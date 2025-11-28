import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  date: timestamp("date", { mode: "date" }).notNull(),
  time: text("time").notNull(),
  duration: text("duration").notNull(),
  bayType: text("bay_type").notNull(),
  players: integer("players").notNull(),
  notes: text("notes"),
  calendarEventId: text("calendar_event_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`now()`),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  calendarEventId: true,
  createdAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
