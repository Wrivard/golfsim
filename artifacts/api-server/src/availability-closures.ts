import { and, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { availabilityClosures, bookings, type AvailabilityClosure, type InsertAvailabilityClosure } from "@workspace/db/schema";
import { bookingSourceFilter } from "./calendar-source";
import type { BookingRecord } from "./booking-logic";
function durationMinutes(value: string): number {
  const match = /^(\d+(?:\.\d+)?)h(\d{2})?$/.exec(value);
  return match ? Math.round(Number(match[1]) * 60) + Number(match[2] || 0) : 60;
}

const validDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
  value => !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value,
);
export const closureInput = z.object({
  kind: z.enum(["physical", "online_until"]),
  startDate: validDate,
  endDate: validDate,
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  bayIds: z.array(z.enum(["1", "2", "3", "4"])).min(1).max(4).refine(ids => new Set(ids).size === ids.length),
  title: z.string().trim().min(1).max(200),
}).strict().superRefine((data, ctx) => {
  if (data.endDate < data.startDate || data.endMinute <= data.startMinute)
    ctx.addIssue({ code: "custom", message: "Période invalide." });
  if (data.kind === "online_until" && (data.startDate !== "1900-01-01" ||
    data.startMinute !== 0 || data.endMinute !== 1440 || data.bayIds.length !== 4))
    ctx.addIssue({ code: "custom", message: "Blocage en ligne invalide." });
  if (data.kind === "physical" && (Date.parse(data.endDate) - Date.parse(data.startDate) > 366 * 86400000))
    ctx.addIssue({ code: "custom", message: "Une fermeture ne peut pas dépasser un an." });
});

export type ClosureInput = z.infer<typeof closureInput>;

export async function getClosuresForDate(date: string): Promise<AvailabilityClosure[]> {
  return db.select().from(availabilityClosures).where(and(
    lte(availabilityClosures.startDate, date), gte(availabilityClosures.endDate, date),
  ));
}

export function closureOverlaps(closure: Pick<AvailabilityClosure, "startDate" | "endDate" | "startMinute" | "endMinute" | "bayIds" | "kind">,
  date: string, time: string, durationMinutes: number, bay: string, audience: "public" | "staff"): boolean {
  if (closure.kind === "online_until" && audience === "staff") return false;
  if (date < closure.startDate || date > closure.endDate || !closure.bayIds.includes(bay)) return false;
  const [hours, minutes] = time.split(":").map(Number);
  const start = hours * 60 + minutes;
  return start < closure.endMinute && start + durationMinutes > closure.startMinute;
}

export function isClosed(closures: AvailabilityClosure[], date: string, time: string,
  duration: number, bay: string, audience: "public" | "staff"): boolean {
  return closures.some(c => closureOverlaps(c, date, time, duration, bay, audience));
}

/** Occupied-looking intervals are only passed to the existing slot optimizer; they are never saved as bookings. */
export function closureOccupancy(closures: AvailabilityClosure[], date: string, audience: "public" | "staff"): BookingRecord[] {
  return closures.filter(c => c.kind === "physical" || audience === "public").flatMap(c =>
    c.bayIds.map(bay => ({
      id: `closure:${c.id}:${bay}`,
      simulatorId: bay,
      customerName: "Fermeture",
      startTime: `${date}T${String(Math.floor(c.startMinute / 60)).padStart(2, "0")}:${String(c.startMinute % 60).padStart(2, "0")}:00`,
      endTime: c.endMinute === 1440
        ? `${new Date(Date.parse(date) + 86400000).toISOString().slice(0, 10)}T00:00:00`
        : `${date}T${String(Math.floor(c.endMinute / 60)).padStart(2, "0")}:${String(c.endMinute % 60).padStart(2, "0")}:00`,
    })),
  );
}

export async function listClosures(): Promise<AvailabilityClosure[]> {
  return db.select().from(availabilityClosures).orderBy(availabilityClosures.startDate);
}

export async function saveClosure(input: ClosureInput, id?: string) {
  // The source lock around admin and public booking routes serializes these checks
  // with Google writes. The date advisory locks also protect direct booking inserts.
  return db.transaction(async tx => {
    if (id) {
      const [existing] = await tx.select().from(availabilityClosures).where(eq(availabilityClosures.id, id)).for("update");
      if (!existing || existing.kind !== input.kind) return { missing: true as const };
    }
    if (input.kind === "physical") {
      const dates: string[] = [];
      for (let stamp = Date.parse(input.startDate); stamp <= Date.parse(input.endDate); stamp += 86400000)
        dates.push(new Date(stamp).toISOString().slice(0, 10));
      for (const day of dates)
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`bookings:${day}`}))`);
      const current = await tx.select().from(bookings).where(and(
        gte(bookings.date, new Date(`${input.startDate}T00:00:00Z`)),
        lte(bookings.date, new Date(`${input.endDate}T23:59:59.999Z`)),
        await bookingSourceFilter(),
      ));
      const conflicts = current.filter(b => closureOverlaps(input, b.date.toISOString().slice(0, 10),
        b.time, durationMinutes(b.duration), b.bayType, "staff"))
        .map(b => ({ id: b.id, name: b.name, date: b.date.toISOString().slice(0, 10), time: b.time, bayType: b.bayType }));
      if (conflicts.length) return { conflicts };
    }
    const data = input as InsertAvailabilityClosure;
    if (id) {
      const [closure] = await tx.update(availabilityClosures).set(data).where(eq(availabilityClosures.id, id)).returning();
      return { closure };
    }
    if (input.kind === "online_until") {
      const [existing] = await tx.select().from(availabilityClosures).where(eq(availabilityClosures.kind, "online_until")).for("update");
      if (existing) {
        const [closure] = await tx.update(availabilityClosures).set(data).where(eq(availabilityClosures.id, existing.id)).returning();
        return { closure };
      }
    }
    const [closure] = await tx.insert(availabilityClosures).values(data).returning();
    return { closure };
  });
}

export async function removeClosure(id: string) {
  const [removed] = await db.delete(availabilityClosures).where(eq(availabilityClosures.id, id)).returning();
  return !!removed;
}
