import { durationMinutes } from "@workspace/booking-domain";

// Keep the existing display fallback for corrupted historical values only.
export const parseDurationToMinutes = (duration: string) => durationMinutes(duration) || 60;

const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Clip a display interval without changing its real start/end or its duration. */
export function visibleIntervalGeometry(start: number, end: number, startHour = 8, endHour = 24, hourHeight = 64) {
  const winStart = startHour * 60;
  const winEnd = endHour * 60;
  const visStart = Math.max(start, winStart);
  const visEnd = Math.min(end, winEnd);
  return {
    top: (visStart - winStart) * hourHeight / 60,
    height: Math.max(0, visEnd - visStart) * hourHeight / 60,
    continuesAfter: end > winEnd && start < winEnd,
    afterWindow: start >= winEnd,
  };
}

/** Positions use the same hour scale as grid lines, with no added row/padding. */
export function bookingGeometry(time: string, duration: string, startHour = 8, hourHeight = 64) {
  const [hour, minute] = time.split(":").map(Number);
  const start = hour * 60 + (minute || 0);
  const minutes = parseDurationToMinutes(duration);
  const end = start + minutes;
  return {
    top: (start - startHour * 60) * hourHeight / 60,
    height: minutes * hourHeight / 60,
    endTime: clock(end),
  };
}

/**
 * Display-only geometry clipped to the visible window [startHour, endHour).
 * Does not change real booking hours: `endTime` and `minutes` stay the true values.
 * - `continuesAfter`: booking runs past the visible end (render open bottom).
 * - `afterWindow`: booking starts at/after the visible end (render as compact chip).
 */
export function visibleBookingGeometry(time: string, duration: string, startHour = 8, endHour = 24, hourHeight = 64) {
  const [hour, minute] = time.split(":").map(Number);
  // Times before the opening hour (00:00–07:59) belong to the late-night tail of the operating day.
  const raw = hour * 60 + (minute || 0);
  const start = raw < startHour * 60 ? raw + 1440 : raw;
  const minutes = parseDurationToMinutes(duration);
  const end = start + minutes;
  return {
    ...visibleIntervalGeometry(start, end, startHour, endHour, hourHeight),
    endTime: clock(end),
    minutes,
  };
}
