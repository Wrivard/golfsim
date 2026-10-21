import { 
  type Booking, type InsertBooking, bookings,
  type AdminUser, type InsertAdminUser, adminUsers,
  type CalendarSettings, type InsertCalendarSettings, calendarSettings,
  type OAuthToken, type InsertOAuthToken, oauthTokens,
  type OperatingSchedule, type InsertOperatingSchedule, operatingSchedule
} from "@workspace/db/schema";
import { db } from "./db";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { bookingSourceFilter, tagBooking } from "./calendar-source";
import { recordContact } from "./email-contacts";
import { normalizeOperatingSchedule } from "@workspace/booking-domain";
type StoredBookingInput = InsertBooking & { calendarEventId?: string | null };

export interface IStorage {
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  getBookingsByDateAndBay(date: Date, bayType: string): Promise<Booking[]>;
  updateBookingCalendarEventId(id: string, calendarEventId: string, contact?: { source: "site" | "personnel"; granted: boolean }): Promise<void>;
  getBookingByCalendarEventId(calendarEventId: string): Promise<Booking | undefined>;
  updateBookingByCalendarEventId(calendarEventId: string, updates: Partial<InsertBooking>): Promise<Booking | undefined>;
  updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined>;
  updateBookingWithConflictCheck(
    id: string, updates: Partial<InsertBooking>,
    checkConflict: (existingBookings: Booking[], current: Booking) => boolean,
    beforeSave: (next: Booking, current: Booking) => Promise<void>,
  ): Promise<{ booking: Booking | null; conflict: boolean }>;
  deleteBooking(id: string): Promise<void>;
  createBookingWithConflictCheck(
    booking: InsertBooking,
    checkConflict: (existingBookings: Booking[]) => boolean
  ): Promise<{ booking: Booking | null; conflict: boolean }>;
  
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  getAdminById(id: string): Promise<AdminUser | undefined>;
  createAdmin(admin: InsertAdminUser): Promise<AdminUser>;
  
  getCalendarSettings(): Promise<CalendarSettings | undefined>;
  updateCalendarSettings(settings: Partial<InsertCalendarSettings>): Promise<CalendarSettings>;
  
  getOAuthToken(provider: string): Promise<OAuthToken | undefined>;
  saveOAuthToken(token: InsertOAuthToken): Promise<OAuthToken>;
  updateOAuthToken(provider: string, updates: Partial<InsertOAuthToken>): Promise<OAuthToken | undefined>;
  deleteOAuthToken(provider: string): Promise<void>;
  
  getBookingsByDateRange(startDate: Date, endDate: Date): Promise<Booking[]>;
  
  getSchedule(): Promise<OperatingSchedule[]>;
  getScheduleForDay(dayOfWeek: number): Promise<OperatingSchedule | undefined>;
  updateScheduleForDay(dayOfWeek: number, data: Partial<InsertOperatingSchedule>): Promise<OperatingSchedule>;
  initializeDefaultSchedule(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async hasHistoricalBooking(id: string) {
    const [row] = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.id,id));
    return !!row;
  }
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    return db.transaction(async tx => {
      const [booking] = await tx.insert(bookings).values(insertBooking).returning();
      await tagBooking(tx, booking.id);
      return booking;
    });
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(and(eq(bookings.id, id), await bookingSourceFilter()));
    return booking;
  }

  async getAllBookings(): Promise<Booking[]> {
    return db.select().from(bookings).where(await bookingSourceFilter());
  }

  async getBookingsByDateAndBay(date: Date, bayType: string): Promise<Booking[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return db.select().from(bookings).where(
      and(
        gte(bookings.date, startOfDay),
        lt(bookings.date, endOfDay),
        eq(bookings.bayType, bayType)
        , await bookingSourceFilter()
      )
    );
  }

  async updateBookingCalendarEventId(id: string, calendarEventId: string, contact?: { source: "site" | "personnel"; granted: boolean }): Promise<void> {
    await db.transaction(async tx => {
      const [updated] = await tx.update(bookings).set({ calendarEventId })
        .where(and(eq(bookings.id, id), await bookingSourceFilter())).returning();
      if (!updated) throw new Error("Booking no longer belongs to the active calendar.");
      if (contact) await recordContact(tx, updated, contact.source, contact.granted);
    });
  }

  async getBookingByCalendarEventId(calendarEventId: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(and(eq(bookings.calendarEventId, calendarEventId), await bookingSourceFilter()));
    return booking;
  }

  async updateBookingByCalendarEventId(calendarEventId: string, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings).set(updates).where(and(eq(bookings.calendarEventId, calendarEventId), await bookingSourceFilter())).returning();
    return updated;
  }

  async updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings).set(updates).where(and(eq(bookings.id, id), await bookingSourceFilter())).returning();
    return updated;
  }

  async updateBookingWithConflictCheck(
    id: string, updates: Partial<InsertBooking>,
    checkConflict: (existingBookings: Booking[], current: Booking) => boolean,
    beforeSave: (next: Booking, current: Booking) => Promise<void>,
  ): Promise<{ booking: Booking | null; conflict: boolean }> {
    return db.transaction(async tx => {
      // Serialize changes to the same reservation; date locks also serialize with creation.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`booking-edit:${id}`}))`);
      const scope = await bookingSourceFilter();
      const [current] = await tx.select().from(bookings).where(and(eq(bookings.id,id),scope)).for("update");
      if (!current) return { booking:null, conflict:false };
      const next = { ...current, ...updates };
      const rowDates = [current, next].map(booking => {
        const day = new Date(booking.date);
        day.setHours(0, 0, 0, 0);
        const [hours, minutes] = booking.time.split(":").map(Number);
        const actual = new Date(day);
        actual.setDate(actual.getDate() + Math.floor((hours * 60 + minutes) / 1440));
        return [day.toISOString().slice(0, 10), actual.toISOString().slice(0, 10)];
      }).flat();
      const dates = [...new Set(rowDates)].sort();
      for (const date of dates)
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`bookings:${date}`}))`);
      const start = new Date(Math.min(new Date(current.date).getTime(), new Date(next.date).getTime()));
      start.setHours(0, 0, 0, 0);
      const end = new Date(Math.max(new Date(current.date).getTime(), new Date(next.date).getTime()));
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 3);
      const others = await tx.select().from(bookings).where(and(gte(bookings.date,start),lt(bookings.date,end),scope));
      if (checkConflict(others,current)) return { booking:null, conflict:true };
      await beforeSave(next,current);
      const [updated] = await tx.update(bookings).set(updates).where(eq(bookings.id,id)).returning();
      // Editing contact details does not grant (or restore) marketing consent.
      if (updated) await recordContact(tx, updated, "personnel", false);
      return { booking:updated, conflict:false };
    });
  }

  async deleteBooking(id: string): Promise<void> {
    await db.delete(bookings).where(and(eq(bookings.id, id), await bookingSourceFilter()));
  }

  async createBookingWithConflictCheck(
    insertBooking: StoredBookingInput,
    checkConflict: (existingBookings: Booking[]) => boolean
  ): Promise<{ booking: Booking | null; conflict: boolean }> {
    return await db.transaction(async (tx) => {
      const startOfDay = new Date(insertBooking.date);
      startOfDay.setHours(0, 0, 0, 0);
      const [hours, minutes] = insertBooking.time.split(":").map(Number);
      const actualDay = new Date(startOfDay);
      actualDay.setDate(actualDay.getDate() + Math.floor((hours * 60 + minutes) / 1440));
      const endOfRange = new Date(startOfDay);
      endOfRange.setDate(endOfRange.getDate() + 3);

      // Lock both the operating date and the real calendar date for overnight
      // slots, then inspect bookings from the full possible overlap window.
      const lockDates = [...new Set([
        startOfDay.toISOString().slice(0, 10),
        actualDay.toISOString().slice(0, 10),
      ])].sort();
      for (const lockDate of lockDates) {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`bookings:${lockDate}`}))`);
      }

      const existingBookings = await tx.select().from(bookings).where(
        and(
          gte(bookings.date, startOfDay),
          lt(bookings.date, endOfRange)
          , await bookingSourceFilter()
        )
      );

      if (checkConflict(existingBookings)) {
        return { booking: null, conflict: true };
      }

      try {
        const [booking] = await tx.insert(bookings).values(insertBooking).returning();
        await tagBooking(tx, booking.id);
        return { booking, conflict: false };
      } catch (error: any) {
        if (error?.code === '23505') {
          return { booking: null, conflict: true };
        }
        throw error;
      }
    });
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return admin;
  }

  async getAdminById(id: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return admin;
  }

  async createAdmin(admin: InsertAdminUser): Promise<AdminUser> {
    const [newAdmin] = await db.insert(adminUsers).values(admin).returning();
    return newAdmin;
  }

  async getCalendarSettings(): Promise<CalendarSettings | undefined> {
    const [settings] = await db.select().from(calendarSettings);
    return settings;
  }

  async updateCalendarSettings(settings: Partial<InsertCalendarSettings>): Promise<CalendarSettings> {
    const existing = await this.getCalendarSettings();
    
    if (existing) {
      const [updated] = await db.update(calendarSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(calendarSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(calendarSettings)
        .values({ ...settings })
        .returning();
      return created;
    }
  }

  async getOAuthToken(provider: string): Promise<OAuthToken | undefined> {
    const [token] = await db.select().from(oauthTokens).where(eq(oauthTokens.provider, provider));
    return token;
  }

  async saveOAuthToken(token: InsertOAuthToken): Promise<OAuthToken> {
    return db.transaction(async tx => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(73401921)`);
      const provider = token.provider || "google";
      const [old] = await tx.select().from(oauthTokens).where(eq(oauthTokens.provider, provider));
      // Keep historical event links intact; source mappings isolate old bookings.
      if (provider === "google" && (!old || old.email?.toLowerCase() !== token.email?.toLowerCase())) {
        await tx.update(calendarSettings).set({ calendarId: "primary" });
      }
      await tx.delete(oauthTokens).where(eq(oauthTokens.provider, provider));
      const [saved] = await tx.insert(oauthTokens).values(token).returning();
      return saved;
    });
  }

  async changeCalendar(settings: Partial<InsertCalendarSettings>) {
    return db.transaction(async tx => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(73401921)`);
      const [old] = await tx.select().from(calendarSettings);
      if (old) return (await tx.update(calendarSettings).set(settings).where(eq(calendarSettings.id, old.id)).returning())[0];
      return (await tx.insert(calendarSettings).values(settings).returning())[0];
    });
  }

  async updateOAuthToken(provider: string, updates: Partial<InsertOAuthToken>): Promise<OAuthToken | undefined> {
    const [updated] = await db.update(oauthTokens)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(oauthTokens.provider, provider))
      .returning();
    return updated;
  }

  async deleteOAuthToken(provider: string): Promise<void> {
    await db.delete(oauthTokens).where(eq(oauthTokens.provider, provider));
  }

  async getBookingsByDateRange(startDate: Date, endDate: Date): Promise<Booking[]> {
    return db.select().from(bookings).where(
      and(
        await bookingSourceFilter(),
        gte(bookings.date, startDate),
        lt(bookings.date, endDate)
      )
    );
  }

  async getSchedule(): Promise<OperatingSchedule[]> {
    return (await db.select().from(operatingSchedule).orderBy(operatingSchedule.dayOfWeek))
      .map(normalizeOperatingSchedule);
  }

  async getScheduleForDay(dayOfWeek: number): Promise<OperatingSchedule | undefined> {
    const [schedule] = await db.select().from(operatingSchedule).where(eq(operatingSchedule.dayOfWeek, dayOfWeek));
    return schedule ? normalizeOperatingSchedule(schedule) : undefined;
  }

  async updateScheduleForDay(dayOfWeek: number, data: Partial<InsertOperatingSchedule>): Promise<OperatingSchedule> {
    const existing = await this.getScheduleForDay(dayOfWeek);
    if (existing) {
      const [updated] = await db.update(operatingSchedule)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(operatingSchedule.dayOfWeek, dayOfWeek))
        .returning();
      return normalizeOperatingSchedule(updated);
    } else {
      const [created] = await db.insert(operatingSchedule)
        .values({ ...data, dayOfWeek })
        .returning();
      return normalizeOperatingSchedule(created);
    }
  }

  async initializeDefaultSchedule(): Promise<void> {
    const existing = await this.getSchedule();
    if (existing.length >= 7) return;

    const defaults: Array<{ dayOfWeek: number; openHour: number; openMinute: number; lastBookingHour: number; lastBookingMinute: number; closeHour: number; closeMinute: number }> = [
      { dayOfWeek: 0, openHour: 8, openMinute: 0, lastBookingHour: 21, lastBookingMinute: 0, closeHour: 22, closeMinute: 0 },
      { dayOfWeek: 1, openHour: 8, openMinute: 0, lastBookingHour: 22, lastBookingMinute: 0, closeHour: 23, closeMinute: 0 },
      { dayOfWeek: 2, openHour: 8, openMinute: 0, lastBookingHour: 22, lastBookingMinute: 0, closeHour: 23, closeMinute: 0 },
      { dayOfWeek: 3, openHour: 8, openMinute: 0, lastBookingHour: 22, lastBookingMinute: 0, closeHour: 23, closeMinute: 0 },
      { dayOfWeek: 4, openHour: 8, openMinute: 0, lastBookingHour: 22, lastBookingMinute: 0, closeHour: 24, closeMinute: 0 },
      { dayOfWeek: 5, openHour: 8, openMinute: 0, lastBookingHour: 22, lastBookingMinute: 0, closeHour: 25, closeMinute: 0 },
      { dayOfWeek: 6, openHour: 8, openMinute: 0, lastBookingHour: 22, lastBookingMinute: 0, closeHour: 25, closeMinute: 0 },
    ];

    for (const d of defaults) {
      const exists = existing.find(e => e.dayOfWeek === d.dayOfWeek);
      if (!exists) {
        await db.insert(operatingSchedule).values(d);
      }
    }
  }
}

export const storage = new DatabaseStorage();
