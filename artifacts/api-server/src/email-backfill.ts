import { createHash } from "node:crypto";
import { z } from "zod";
import type { calendar_v3 } from "googleapis";
import type { Booking } from "@workspace/db/schema";
import { emailContacts } from "@workspace/db/schema";
import { db } from "./db";
import { storage } from "./storage";
import { activeCalendarSource } from "./calendar-source";
import { getGoogleCalendarClient, getConfiguredCalendarId } from "./googleCalendar";
import { listCalendarWindow } from "./calendar-pages";
import { listContacts } from "./email-contacts";

/** Never infer customer identity from attendees or an event's free-form description. */
export function verifiedHistoricalBookings(bookings: Booking[], events: calendar_v3.Schema$Event[]) {
  const markers = new Map(events.filter(e => e.status !== "cancelled" && e.id)
    .map(e => [e.id, e.extendedProperties?.private?.golfSimBookingId]));
  return bookings.filter(b => b.calendarEventId && markers.get(b.calendarEventId) === b.id &&
    z.string().email().safeParse(b.email.trim()).success);
}

export async function historicalContactPreview() {
  const source = await activeCalendarSource();
  const bookings = await storage.getAllBookings();
  let eligible: Booking[] = [];
  if (bookings.length) {
    const stamps = bookings.map(b => b.date.getTime());
    const events = await listCalendarWindow(await getGoogleCalendarClient(), await getConfiguredCalendarId(),
      new Date(Math.min(...stamps) - 86400000).toISOString(),
      new Date(Math.max(...stamps) + 2 * 86400000).toISOString());
    eligible = verifiedHistoricalBookings(bookings, events);
  }
  const contacts = await listContacts();
  const known = new Set(contacts.map(c => c.email));
  const emails = new Set(eligible.map(b => b.email.trim().toLowerCase()));
  const fingerprint = createHash("sha256").update(JSON.stringify([
    source, eligible.map(b => [b.id, b.email.trim().toLowerCase(), b.name]).sort(),
  ])).digest("hex");
  return {
    eligible,
    summary: {
      fingerprint, scannedBookings: bookings.length, eligibleBookings: eligible.length,
      eligibleContacts: emails.size,
      newContacts: [...emails].filter(email => !known.has(email)).length,
      excludedBookings: bookings.length - eligible.length,
    },
  };
}

export async function importHistoricalContacts(eligible: Booking[]) {
  return db.transaction(async tx => {
    let imported = 0;
    for (const booking of eligible) {
      const inserted = await tx.insert(emailContacts).values({
        email: booking.email.trim().toLowerCase(), name: booking.name,
        source: "historique vérifié", marketingConsent: false,
        consentAt: null, consentEvidence: null, withdrawnAt: null,
      }).onConflictDoNothing().returning({ email: emailContacts.email });
      imported += inserted.length;
    }
    return imported;
  });
}
