/** Stored durations are left untouched. Invalid values never become bookable time. */
export function durationMinutes(value: string): number {
  const match = /^(?:(\d+(?:\.\d+)?)h?|(\d+)h(\d{2}))$/.exec(value);
  if (!match) return 0;
  if (match[3] && Number(match[3]) > 59) return 0;
  const minutes = match[1] !== undefined
    ? Number(match[1]) * 60 : Number(match[2]) * 60 + Number(match[3]);
  return Number.isFinite(minutes) && Number.isInteger(minutes) && minutes > 0 ? minutes : 0;
}

export const MAX_OPERATING_HOUR = 26;

/** Keep any legacy schedule row within the supported 2 a.m. operating-day limit. */
export function normalizeOperatingSchedule<T extends {
  lastBookingHour: number;
  lastBookingMinute: number;
  closeHour: number;
  closeMinute: number;
}>(schedule: T): T {
  const toMinutes = (hour: number, minute: number) =>
    Math.max(0, Math.min(MAX_OPERATING_HOUR * 60, hour * 60 + minute));
  const close = toMinutes(schedule.closeHour, schedule.closeMinute);
  const lastBooking = Math.min(toMinutes(schedule.lastBookingHour, schedule.lastBookingMinute), close);
  return {
    ...schedule,
    lastBookingHour: Math.floor(lastBooking / 60),
    lastBookingMinute: lastBooking % 60,
    closeHour: Math.floor(close / 60),
    closeMinute: close % 60,
  };
}

/** Half-open intervals: a booking ending at 10:00 permits another starting at 10:00. */
export function intervalsOverlap(start: number, end: number, otherStart: number, otherEnd: number): boolean {
  return start < otherEnd && end > otherStart;
}

export function isHalfHourStart(time: string): boolean {
  return /^(?:(?:[01]\d|2[0-5]):(?:00|30)|26:00)$/.test(time);
}

/** Format an operating-day time while making next-day starts unambiguous. */
export function formatOperatingTime(time: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return time;
  const hours = Number(match[1]);
  if (hours < 24) return time;
  return `${String(hours - 24).padStart(2, "0")}:${match[2]} (+1j)`;
}

/** Public occupancy carries no customer identifiers or local reservation IDs. */
export function publicOccupancy(records: { simulatorId: string; startTime: string; endTime: string }[]) {
  return records.map((record, index) => ({
    id: `occupied-${index}`, simulatorId: record.simulatorId,
    startTime: record.startTime, endTime: record.endTime,
  }));
}
