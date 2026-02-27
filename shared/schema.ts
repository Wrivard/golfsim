import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, uniqueIndex, boolean } from "drizzle-orm/pg-core";
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
}, (table) => ({
  uniqueSlot: uniqueIndex("unique_booking_slot").on(table.bayType, table.date, table.time),
}));

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`now()`),
});

export const calendarSettings = pgTable("calendar_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncEmail: text("sync_email"),
  calendarId: text("calendar_id").default("primary"),
  debugMode: boolean("debug_mode").default(false),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`now()`),
});

export const oauthTokens = pgTable("oauth_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull().default("google"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  scope: text("scope"),
  tokenType: text("token_type").default("Bearer"),
  email: text("email"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`now()`),
});

export const operatingSchedule = pgTable("operating_schedule", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dayOfWeek: integer("day_of_week").notNull().unique(),
  openHour: integer("open_hour").notNull().default(8),
  openMinute: integer("open_minute").notNull().default(0),
  lastBookingHour: integer("last_booking_hour").notNull().default(22),
  lastBookingMinute: integer("last_booking_minute").notNull().default(0),
  closeHour: integer("close_hour").notNull().default(23),
  closeMinute: integer("close_minute").notNull().default(0),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`now()`),
});

export const insertOperatingScheduleSchema = createInsertSchema(operatingSchedule).omit({
  id: true,
  updatedAt: true,
});

export type InsertOperatingSchedule = z.infer<typeof insertOperatingScheduleSchema>;
export type OperatingSchedule = typeof operatingSchedule.$inferSelect;

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  calendarEventId: true,
  createdAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarSettingsSchema = createInsertSchema(calendarSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertOAuthTokenSchema = createInsertSchema(oauthTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

export type InsertCalendarSettings = z.infer<typeof insertCalendarSettingsSchema>;
export type CalendarSettings = typeof calendarSettings.$inferSelect;

export type InsertOAuthToken = z.infer<typeof insertOAuthTokenSchema>;
export type OAuthToken = typeof oauthTokens.$inferSelect;
