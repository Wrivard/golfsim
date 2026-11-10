import { addMinutes, differenceInMinutes } from "date-fns";
import { BOOKING_DURATION_MINUTES } from "@workspace/booking-domain";

const ALLOWED_DURATIONS = BOOKING_DURATION_MINUTES;

export interface PlacementMetrics {
  existingUnsellableMinutes: number;
  remainingUnsellableMinutes: number;
  newlyUnsellableMinutes: number;
  longStartsLost: number;
  mediumStartsLost: number;
}

export function measureFreeSegment(
  start: Date,
  end: Date,
  openTime: Date,
  lastBookingTime: Date,
  closeTime: Date,
  granularity: number,
  candidateGranularities: readonly number[] = [granularity],
): { unsellable: number; longStarts: number; mediumStarts: number; startsByDuration: number[] } {
  const length = differenceInMinutes(end, start);
  if (length <= 0) return { unsellable: 0, longStarts: 0, mediumStarts: 0, startsByDuration: ALLOWED_DURATIONS.map(() => 0) };

  // Only actual bookable starts count. A 30-minute remainder is now sellable
  // when a legal start exists before the last-start cutoff.
  const ranges: Array<[number, number]> = [];
  let longStarts = 0;
  let mediumStarts = 0;
  const startsByDuration = ALLOWED_DURATIONS.map(() => 0);
  const seenStarts = new Set<number>();
  // Candidate times come from the union of every bay's opening-relative grid,
  // then eligibility uses the wall-clock minute. In particular, an 08:30
  // opening can expose 09:00 on an hourly bay via a half-hour bay's grid.
  for (const candidateGranularity of candidateGranularities) {
    for (let slot = openTime; slot <= lastBookingTime; slot = addMinutes(slot, candidateGranularity)) {
      if (slot < start || slot >= end || slot.getMinutes() % granularity !== 0 || seenStarts.has(slot.getTime())) continue;
      seenStarts.add(slot.getTime());
      for (let index = 0; index < ALLOWED_DURATIONS.length; index++) {
        const duration = ALLOWED_DURATIONS[index];
        const finish = addMinutes(slot, duration);
        if (finish > end || finish > closeTime) continue;
        startsByDuration[index]++;
        if (duration === 240) longStarts++;
        if (duration === 180) mediumStarts++;
        ranges.push([slot.getTime(), finish.getTime()]);
      }
    }
  }

  ranges.sort((a, b) => a[0] - b[0]);
  let covered = 0;
  let until = start.getTime();
  for (const [from, to] of ranges) {
    if (to > until) {
      covered += to - Math.max(from, until);
      until = to;
    }
  }
  return { unsellable: length - covered / 60000, longStarts, mediumStarts, startsByDuration };
}

export function measurePlacement(
  start: Date,
  end: Date,
  freeStart: Date,
  freeEnd: Date,
  openTime: Date,
  lastBookingTime: Date,
  closeTime: Date,
  granularity: number,
  candidateGranularities: readonly number[] = [granularity],
): PlacementMetrics {
  const before = measureFreeSegment(freeStart, freeEnd, openTime, lastBookingTime, closeTime, granularity, candidateGranularities);
  const left = measureFreeSegment(freeStart, start, openTime, lastBookingTime, closeTime, granularity, candidateGranularities);
  const right = measureFreeSegment(end, freeEnd, openTime, lastBookingTime, closeTime, granularity, candidateGranularities);
  const remainingUnsellableMinutes = left.unsellable + right.unsellable;
  return {
    existingUnsellableMinutes: before.unsellable,
    remainingUnsellableMinutes,
    newlyUnsellableMinutes: remainingUnsellableMinutes - before.unsellable,
    longStartsLost: before.longStarts - left.longStarts - right.longStarts,
    mediumStartsLost: before.mediumStarts - left.mediumStarts - right.mediumStarts,
  };
}