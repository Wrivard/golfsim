import { getOptimizedStartTimes, type BookingRecord, type DaySchedule } from "./booking-logic";
import { isHalfHourStart } from "@workspace/booking-domain";

/** Validate the slot shape here; the selected weekday schedule sets its real hours. */
export function isWithinPublicBookingHours(time: string, durationMinutes: number): boolean {
  if (!isHalfHourStart(time) || !Number.isInteger(durationMinutes) || durationMinutes < 60 || durationMinutes % 30 !== 0) return false;
  return true;
}

/** Keep the staff's chosen bay while applying the same schedule and grid rules as public booking. */
export function isStaffSlotAvailable(
  date: Date,
  time: string,
  durationMinutes: number,
  bay: string,
  bookings: BookingRecord[],
  schedule?: DaySchedule,
): boolean {
  if (!isWithinPublicBookingHours(time, durationMinutes)) return false;
  const [hours, minutes] = time.split(":").map(Number);
  const requestedTime = new Date(date);
  requestedTime.setHours(hours, minutes, 0, 0);
  const slot = getOptimizedStartTimes(date, durationMinutes, bookings, undefined, schedule)
    .find(candidate => candidate.time === requestedTime.toISOString());
  return !!slot?.allBays?.some(candidate => candidate.bayId === bay && candidate.isValid);
}