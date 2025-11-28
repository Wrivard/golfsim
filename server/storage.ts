import { 
  type Booking, type InsertBooking, bookings,
  type AdminUser, type InsertAdminUser, adminUsers,
  type CalendarSettings, type InsertCalendarSettings, calendarSettings,
  type OAuthToken, type InsertOAuthToken, oauthTokens
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
}

export const storage = new DatabaseStorage();
