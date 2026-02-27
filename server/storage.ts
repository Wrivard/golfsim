import { 
  type Booking, type InsertBooking, bookings,
  type AdminUser, type InsertAdminUser, adminUsers,
  type CalendarSettings, type InsertCalendarSettings, calendarSettings,
  type OAuthToken, type InsertOAuthToken, oauthTokens,
  type OperatingSchedule, type InsertOperatingSchedule, operatingSchedule
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lt, sql } from "drizzle-orm";

export interface IStorage {
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  getBookingsByDateAndBay(date: Date, bayType: string): Promise<Booking[]>;
  updateBookingCalendarEventId(id: string, calendarEventId: string): Promise<void>;
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
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getAllBookings(): Promise<Booking[]> {
    return db.select().from(bookings);
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
      )
    );
  }

  async updateBookingCalendarEventId(id: string, calendarEventId: string): Promise<void> {
    await db.update(bookings).set({ calendarEventId }).where(eq(bookings.id, id));
  }

  async deleteBooking(id: string): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  async createBookingWithConflictCheck(
    insertBooking: InsertBooking,
    checkConflict: (existingBookings: Booking[]) => boolean
  ): Promise<{ booking: Booking | null; conflict: boolean }> {
    return await db.transaction(async (tx) => {
      const startOfDay = new Date(insertBooking.date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(insertBooking.date);
      endOfDay.setHours(23, 59, 59, 999);

      const existingBookings = await tx.select().from(bookings).where(
        and(
          gte(bookings.date, startOfDay),
          lt(bookings.date, endOfDay)
        )
      );

      if (checkConflict(existingBookings)) {
        return { booking: null, conflict: true };
      }

      try {
        const [booking] = await tx.insert(bookings).values(insertBooking).returning();
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
    await db.delete(oauthTokens).where(eq(oauthTokens.provider, token.provider || "google"));
    
    const [newToken] = await db.insert(oauthTokens).values(token).returning();
    return newToken;
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
        gte(bookings.date, startDate),
        lt(bookings.date, endDate)
      )
    );
  }

  async getSchedule(): Promise<OperatingSchedule[]> {
    return db.select().from(operatingSchedule).orderBy(operatingSchedule.dayOfWeek);
  }

  async getScheduleForDay(dayOfWeek: number): Promise<OperatingSchedule | undefined> {
    const [schedule] = await db.select().from(operatingSchedule).where(eq(operatingSchedule.dayOfWeek, dayOfWeek));
    return schedule;
  }

  async updateScheduleForDay(dayOfWeek: number, data: Partial<InsertOperatingSchedule>): Promise<OperatingSchedule> {
    const existing = await this.getScheduleForDay(dayOfWeek);
    if (existing) {
      const [updated] = await db.update(operatingSchedule)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(operatingSchedule.dayOfWeek, dayOfWeek))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(operatingSchedule)
        .values({ ...data, dayOfWeek })
        .returning();
      return created;
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
