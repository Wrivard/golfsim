import { getOptimizedStartTimes, type BookingRecord, type DaySchedule } from "./booking-logic";

/**
 * The proposed bay is only a preview. At submission, choose the best available
 * bay for the exact requested time from a freshly loaded day of bookings.
 */
export function getConfirmationBay(
  date: Date,
  time: string,
  durationMinutes: number,
  bookings: BookingRecord[],
  schedule?: DaySchedule,
): string | null {
  const [hours, minutes] = time.split(":").map(Number);
  const requestedTime = new Date(date);
  requestedTime.setHours(hours, minutes, 0, 0);

  const slot = getOptimizedStartTimes(date, durationMinutes, bookings, undefined, schedule)
    .find(candidate => candidate.time === requestedTime.toISOString());
  return slot?.assignedBayId ?? null;
}