import { sql } from "drizzle-orm";
import { pgTable, varchar, text, date, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const availabilityClosures = pgTable("gsim_availability_closures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kind: text("kind").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  startMinute: integer("start_minute").notNull(),
  endMinute: integer("end_minute").notNull(),
  bayIds: text("bay_ids").array().notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertAvailabilityClosureSchema = createInsertSchema(availabilityClosures).omit({ id: true, createdAt: true });
export type InsertAvailabilityClosure = z.infer<typeof insertAvailabilityClosureSchema>;
export type AvailabilityClosure = typeof availabilityClosures.$inferSelect;
