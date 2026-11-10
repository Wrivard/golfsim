import { z } from "zod";
import { BOOKING_DURATION_VALUES, isHalfHourStart } from "@workspace/booking-domain";

/** Sales catalogue validation; imported bookings are deliberately not rewritten. */
export const bookingRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  date: z.string().transform(str => new Date(str)),
  time: z.string().refine(isHalfHourStart, "Choisissez une heure ou une demi-heure."),
  duration: z.enum(BOOKING_DURATION_VALUES),
  bayType: z.enum(["1", "2", "3", "4"]),
  players: z.number().min(1).max(4),
  notes: z.string().optional(),
  marketingConsent: z.boolean().optional().default(false),
});

export const staffBookingSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.union([z.literal(""), z.string().email()]).default(""),
  phone: z.string().max(100).default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value =>
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value),
  time: z.string().refine(isHalfHourStart, "Choisissez une heure ou une demi-heure."),
  duration: z.enum(BOOKING_DURATION_VALUES),
  bayType: z.enum(["1", "2", "3", "4"]),
  players: z.number().int().min(1).max(4),
  notes: z.string().max(2000).default(""),
});
