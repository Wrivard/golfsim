import { durationMinutes } from "@workspace/booking-domain";

// Keep the existing display fallback for corrupted historical values only.
export const parseDurationToMinutes = (duration: string) => durationMinutes(duration) || 60;

/** Positions use the same hour scale as grid lines, with no added row/padding. */
export function bookingGeometry(time: string, duration: string, startHour = 8, hourHeight = 64) {
  const [hour, minute] = time.split(":").map(Number);
  const start = hour * 60 + minute;
  const minutes = parseDurationToMinutes(duration);
  const end = start + minutes;
  return {
    top: (start - startHour * 60) * hourHeight / 60,
    height: minutes * hourHeight / 60,
    endTime: `${String(Math.floor(end / 60) % 24).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`,
  };
}