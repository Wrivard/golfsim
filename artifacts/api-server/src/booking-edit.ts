import { z } from "zod";
import { isHalfHourStart } from "@workspace/booking-domain";
import type { BookingRecord } from "./booking-logic";
import { isStaffSlotAvailable } from "./staff-booking";

export const bookingEditSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  email: z.union([z.literal(""), z.string().email()]).optional(),
  phone: z.string().max(100).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value =>
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value).optional(),
  time: z.string().refine(isHalfHourStart, "Choisissez une heure ou une demi-heure.").optional(),
  duration: z.enum(["1h", "2h", "3h", "4h"]).optional(),
  bayType: z.enum(["1", "2", "3", "4"]).optional(),
  players: z.number().int().min(1).max(4).optional(),
  notes: z.string().max(2000).nullable().optional(),
}).strict();

/** Exclude the reservation itself, never another reservation in the same bay. */
export function isEditedSlotAvailable(
  id: string, date: Date, time: string, durationMinutes: number, bay: string,
  records: BookingRecord[], schedule?: Parameters<typeof isStaffSlotAvailable>[5],
) {
  return isStaffSlotAvailable(date, time, durationMinutes, bay, records.filter(row => row.id !== id), schedule);
}
