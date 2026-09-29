import { getOptimizedStartTimes, type BookingRecord, type DaySchedule } from "./booking-logic";

/** The public POST booking window also applies to staff requests. */
export function isWithinPublicBookingHours(time: string, durationMinutes: number): boolean {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !Number.isFinite(durationMinutes) || durationMinutes < 60) return false;
  const [hours, minutes] = time.split(":").map(Number);
  const start = hours * 60 + minutes;
  return start >= 8 * 60 && start + durationMinutes <= 22 * 60;
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