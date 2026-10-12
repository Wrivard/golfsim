import { pgTable, text, jsonb, timestamp, integer, index } from "drizzle-orm/pg-core";

// Additive infrastructure only. Explicit migration; never seed business data.
export const runtimeSessions = pgTable("gsim_sessions", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, table => [index("gsim_sessions_expiry").on(table.expiresAt)]);
export const runtimeRateLimits = pgTable("gsim_rate_limits", {
  key: text("key").primaryKey(),
  hits: integer("hits").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, table => [index("gsim_rate_limits_expiry").on(table.expiresAt)]);
export const runtimeLeases = pgTable("gsim_job_leases", {
  name: text("name").primaryKey(),
  owner: text("owner").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const runtimeState = pgTable("gsim_runtime_state", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
