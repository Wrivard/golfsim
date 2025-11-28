import { type Booking, type InsertBooking, bookings } from "@shared/schema";
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
          lt(bookings.date, endOfDay),
          eq(bookings.bayType, insertBooking.bayType)
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
}

export const storage = new DatabaseStorage();
