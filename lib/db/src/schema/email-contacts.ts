import { pgTable, text, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const emailContacts = pgTable("gsim_email_contacts", {
  email: text("email").primaryKey(),
  name: text("name").notNull(),
  source: text("source").notNull(),
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  consentEvidence: text("consent_evidence"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const emailConsentEvents = pgTable("gsim_email_consent_events", {
  id: varchar("id").primaryKey(),
  email: text("email").notNull(),
  action: text("action").notNull(),
  source: text("source").notNull(),
  evidence: text("evidence").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertEmailContactSchema = createInsertSchema(emailContacts).omit({ createdAt: true });
export type InsertEmailContact = z.infer<typeof insertEmailContactSchema>;
export type EmailContact = typeof emailContacts.$inferSelect;
