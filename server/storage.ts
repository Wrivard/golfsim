import { type Booking, type InsertBooking, bookings } from "@shared/schema";
import { db } from "@db/index";
import { eq } from "drizzle-orm";

export interface IStorage {
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
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
}

export const storage = new DatabaseStorage();
