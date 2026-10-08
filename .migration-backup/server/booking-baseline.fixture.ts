import { isSameDay, parseISO } from "date-fns";
import type { BookingRecord, TimeSlot } from "./booking-logic";

// Frozen implementation of the original valid-bay scorer. The availability
// calculation is shared: ranking never had authority to change valid slots.
function rateRemainingGap(gap: number, touchesBooking: boolean): number {
  if (gap === 0 && touchesBooking) return 5;
  if (gap === 0) return 2;
  if (gap > 0 && gap < 30) return -5;
  if (gap >= 30 && gap < 60) return -2;
  if (gap === 60) return -1;
  return 0;
}
function rateGapToBoundary(gap: number): number {
  if (gap === 0) return 3;
  if (gap > 0 && gap < 30) return -5;
  if (gap >= 30 && gap <= 60) return -1;
  if (gap > 60 && gap <= 120) return 0;
  return -1;
}

export function originalBayScore(
  slot: Date, durationMinutes: number, bayId: string,
  gapBefore: number, gapAfter: number, bookings: BookingRecord[],
): number {
  const dayBookings = bookings.filter(b => isSameDay(parseISO(b.startTime), slot));
  const bayBookings = dayBookings.filter(b => b.simulatorId === bayId);
  const end = slot.getTime() + durationMinutes * 60000;
  const previous = bayBookings.reduce<number | null>((value, b) => {
    const time = parseISO(b.endTime).getTime();
    return time < end && (value === null || time > value) ? time : value;
  }, null);
  const next = bayBookings.reduce<number | null>((value, b) => {
    const time = parseISO(b.startTime).getTime();
    return time > slot.getTime() && (value === null || time < value) ? time : value;
  }, null);
  const beforeBooking = previous !== null;
  const afterBooking = next !== null;
  const touchesBookingBefore = beforeBooking && gapBefore === 0;
  const touchesBookingAfter = afterBooking && gapAfter === 0;
  const touchesDayStart = !beforeBooking && gapBefore === 0;
  const touchesDayEnd = !afterBooking && gapAfter === 0;
  const emptyBay = bayBookings.length === 0;
  const otherBaysHaveBookings = dayBookings.some(b => b.simulatorId !== bayId);
  const hour = slot.getHours();
  const totalStretch = gapBefore + durationMinutes + gapAfter;

  let gapScore =
    (beforeBooking ? rateRemainingGap(gapBefore, touchesBookingBefore) : rateGapToBoundary(gapBefore)) +
    (afterBooking ? rateRemainingGap(gapAfter, touchesBookingAfter) : rateGapToBoundary(gapAfter));
  let perfectFit = touchesBookingBefore && touchesBookingAfter ? 5 : 0;
  let durationStrategy = 0;
  let durationBonus = 0;
  let peakHour = 0;
  if (durationMinutes === 60) {
    if (touchesBookingBefore && touchesBookingAfter) perfectFit = 7;
    if (emptyBay) {
      if (otherBaysHaveBookings) durationStrategy -= 4;
      else durationStrategy += touchesDayStart ? 3 : -2;
    }
    if (gapAfter === 60 && afterBooking) durationStrategy -= 2;
    if (gapBefore === 60 && beforeBooking) durationStrategy -= 2;
    if (touchesBookingBefore && gapAfter > 120) durationStrategy -= 3;
    else if (touchesBookingAfter && gapBefore > 120) durationStrategy -= 3;
  } else if (durationMinutes === 120) {
    if (hour >= 17 && hour < 21) peakHour = 1;
    if (emptyBay) {
      if (otherBaysHaveBookings) durationStrategy -= 2;
      else if (touchesDayStart || touchesDayEnd) durationStrategy += 2;
    }
    if (gapAfter === 60 && afterBooking) durationStrategy -= 1;
    if (gapBefore === 60 && beforeBooking) durationStrategy -= 1;
    if (!emptyBay && [180, 240].some(pd => totalStretch >= pd && totalStretch <= pd + 30 && totalStretch > durationMinutes)) {
      durationStrategy -= 3;
    }
  } else if (durationMinutes === 180) {
    durationBonus = 1;
    if (hour >= 17 && hour < 21) peakHour = 2;
    if (emptyBay && (touchesDayStart || touchesDayEnd)) durationStrategy += 2;
    if (gapAfter === 60 && afterBooking) durationStrategy -= 1;
    if (gapBefore === 60 && beforeBooking) durationStrategy -= 1;
  } else if (durationMinutes === 240) {
    durationBonus = 2;
    if (hour >= 17 && hour < 21) peakHour = 1;
    if (emptyBay && (touchesDayStart || touchesDayEnd)) durationStrategy += 3;
    if (gapAfter === 60 && afterBooking) durationStrategy -= 2;
    if (gapBefore === 60 && beforeBooking) durationStrategy -= 2;
  } else {
    if (hour >= 17 && hour < 21) peakHour = 1;
    if (emptyBay && (touchesDayStart || touchesDayEnd)) durationStrategy += 2;
    if (gapAfter === 60 && afterBooking) durationStrategy -= 1;
    if (gapBefore === 60 && beforeBooking) durationStrategy -= 1;
  }
  if (emptyBay && !touchesDayStart && !touchesDayEnd) {
    const smaller = Math.min(gapBefore, gapAfter);
    const larger = Math.max(gapBefore, gapAfter);
    if (smaller > 0 && larger > 0 && smaller / larger > 0.4) {
      durationStrategy -= Math.round(smaller / larger * 4);
    }
  }
  return gapScore + perfectFit + (bayBookings.length > 0 ? 1 : 0) +
    peakHour + durationBonus + durationStrategy;
}

export function baselineBayForRequest(
  slot: TimeSlot, durationMinutes: number, bookings: BookingRecord[],
): string {
  const date = parseISO(slot.time);
  let best: { id: string; score: number } | undefined;
  for (const bay of slot.allBays ?? []) {
    if (!bay.isValid) continue;
    const score = originalBayScore(date, durationMinutes, bay.bayId, bay.debug!.gapBefore, bay.debug!.gapAfter, bookings);
    if (!best || score > best.score) best = { id: bay.bayId, score };
  }
  if (!best) throw new Error("Expected at least one valid bay");
  return best.id;
}