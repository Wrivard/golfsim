/** Stored durations are left untouched. Invalid values never become bookable time. */
export function durationMinutes(value: string): number {
  const match = /^(?:(\d+(?:\.\d+)?)h?|(\d+)h(\d{2}))$/.exec(value);
  if (!match) return 0;
  if (match[3] && Number(match[3]) > 59) return 0;
  const minutes = match[1] !== undefined
    ? Number(match[1]) * 60 : Number(match[2]) * 60 + Number(match[3]);
  return Number.isFinite(minutes) && Number.isInteger(minutes) && minutes > 0 ? minutes : 0;
}

/** Half-open intervals: a booking ending at 10:00 permits another starting at 10:00. */
export function intervalsOverlap(start: number, end: number, otherStart: number, otherEnd: number): boolean {
  return start < otherEnd && end > otherStart;
}

export function isHalfHourStart(time: string): boolean {
  return /^(?:[01]\d|2[0-3]):(?:00|30)$/.test(time);
}

/** Public occupancy carries no customer identifiers or local reservation IDs. */
export function publicOccupancy(records: { simulatorId: string; startTime: string; endTime: string }[]) {
  return records.map((record, index) => ({
    id: `occupied-${index}`, simulatorId: record.simulatorId,
    startTime: record.startTime, endTime: record.endTime,
  }));
}
