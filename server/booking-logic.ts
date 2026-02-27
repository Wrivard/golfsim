import {
  addMinutes,
  areIntervalsOverlapping,
  isBefore,
  isAfter,
  setHours,
  setMinutes,
  differenceInMinutes,
  startOfDay,
  isSameDay,
  parseISO
} from 'date-fns';

export interface Simulator {
  id: string;
  name: string;
}

export interface BookingRecord {
  id: string;
  simulatorId: string;
  startTime: string;
  endTime: string;
  customerName: string;
}

export interface ScoreBreakdown {
  base: number;
  gapAfter: number;
  gapBefore: number;
  perfectFit: number;
  bayClustering: number;
  peakHour: number;
  inefficientGap: number;
  durationBonus: number;
  durationStrategy: number;
  total: number;
}

export interface BayEvaluation {
  bayId: string;
  bayName: string;
  score: number;
  isValid: boolean;
  rejectionReason?: string;
  breakdown?: ScoreBreakdown;
  debug?: {
    gapBefore: number;
    gapAfter: number;
  };
}

export interface TimeSlot {
  time: string;
  label?: string;
  score: number;
  assignedBayId: string;
  breakdown?: ScoreBreakdown;
  allBays?: BayEvaluation[];
}

export interface DaySchedule {
  openHour: number;
  openMinute: number;
  lastBookingHour: number;
  lastBookingMinute: number;
  closeHour: number;
  closeMinute: number;
}

const DEFAULT_SCHEDULE: DaySchedule = {
  openHour: 8, openMinute: 0,
  lastBookingHour: 22, lastBookingMinute: 0,
  closeHour: 23, closeMinute: 0,
};

const HALF_HOUR_BAY_IDS = new Set(["3", "4"]);

function getBayGranularity(bayId: string): number {
  return HALF_HOUR_BAY_IDS.has(bayId) ? 30 : 60;
}

const DEFAULT_SIMULATORS: Simulator[] = [
  { id: "1", name: "Baie 1" },
  { id: "2", name: "Baie 2" },
  { id: "3", name: "Baie 3" },
  { id: "4", name: "Baie 4" },
];

function buildScheduleTimes(date: Date, schedule: DaySchedule) {
  const dayStart = startOfDay(date);
  const openTime = setMinutes(setHours(dayStart, schedule.openHour), schedule.openMinute);
  const lastBookingTime = setMinutes(setHours(dayStart, schedule.lastBookingHour), schedule.lastBookingMinute);

  let closeTime: Date;
  if (schedule.closeHour >= 24) {
    const nextDay = addMinutes(dayStart, 24 * 60);
    closeTime = setMinutes(setHours(nextDay, schedule.closeHour - 24), schedule.closeMinute);
  } else {
    closeTime = setMinutes(setHours(dayStart, schedule.closeHour), schedule.closeMinute);
  }

  return { openTime, lastBookingTime, closeTime };
}

function rateRemainingGap(gap: number, touchesBooking: boolean): number {
  if (gap === 0 && touchesBooking) return 5;
  if (gap === 0) return 2;
  if (gap > 0 && gap < 30) return -5;
  if (gap >= 30 && gap < 60) return -2;
  if (gap === 60) return -1;
  if (gap === 240 || gap === 300) return 4;
  if (gap === 120 || gap === 90) return 3;
  if (gap >= 150 && gap <= 300 && gap % 30 === 0) return 2;
  if (gap > 300) return 1;
  return 0;
}

interface DurationContext {
  durationMinutes: number;
  emptyBay: boolean;
  otherBaysHaveBookings: boolean;
  remainingGapBefore: number;
  remainingGapAfter: number;
  touchesDayStart: boolean;
  touchesDayEnd: boolean;
  touchesBookingBefore: boolean;
  touchesBookingAfter: boolean;
  hour: number;
  totalStretch: number;
}

function applyDurationStrategy(ctx: DurationContext): { durationBonus: number; peakHour: number; durationStrategy: number; perfectFitOverride?: number } {
  const { durationMinutes, emptyBay, otherBaysHaveBookings, remainingGapBefore, remainingGapAfter,
    touchesDayStart, touchesDayEnd, touchesBookingBefore, touchesBookingAfter, hour, totalStretch } = ctx;

  let durationBonus = 0;
  let peakHour = 0;
  let durationStrategy = 0;
  let perfectFitOverride: number | undefined;

  if (durationMinutes === 60) {
    peakHour = 0;

    if (touchesBookingBefore && touchesBookingAfter && remainingGapBefore === 0 && remainingGapAfter === 0) {
      perfectFitOverride = 7;
    }

    if (emptyBay) {
      if (otherBaysHaveBookings) {
        durationStrategy -= 4;
      } else {
        if (touchesDayStart) {
          durationStrategy += 3;
        } else {
          durationStrategy -= 2;
        }
      }
    }

    if (remainingGapAfter === 60) durationStrategy -= 2;
    if (remainingGapBefore === 60) durationStrategy -= 2;

  } else if (durationMinutes === 120) {
    if (hour >= 17 && hour < 21) peakHour = 1;

    if (emptyBay) {
      if (otherBaysHaveBookings) {
        durationStrategy -= 2;
      } else {
        if (touchesDayStart || touchesDayEnd) {
          durationStrategy += 2;
        }
      }
    }

    if (remainingGapAfter === 60) durationStrategy -= 1;
    if (remainingGapBefore === 60) durationStrategy -= 1;

    if (!emptyBay) {
      const popularDurations = [180, 240];
      for (const pd of popularDurations) {
        if (totalStretch >= pd && totalStretch <= pd + 30 && totalStretch > durationMinutes) {
          durationStrategy -= 3;
          break;
        }
      }
    }

  } else if (durationMinutes === 180) {
    durationBonus = 1;
    if (hour >= 17 && hour < 21) peakHour = 2;

    if (emptyBay) {
      if (touchesDayStart || touchesDayEnd) {
        durationStrategy += 2;
      }
    }

    if (remainingGapAfter === 60) durationStrategy -= 1;
    if (remainingGapBefore === 60) durationStrategy -= 1;

  } else if (durationMinutes === 240) {
    durationBonus = 2;
    if (hour >= 17 && hour < 21) peakHour = 1;

    if (emptyBay) {
      if (touchesDayStart || touchesDayEnd) {
        durationStrategy += 3;
      }
    }

    if (remainingGapAfter === 60) durationStrategy -= 2;
    if (remainingGapBefore === 60) durationStrategy -= 2;

  } else {
    if (hour >= 17 && hour < 21) peakHour = 1;

    if (emptyBay && (touchesDayStart || touchesDayEnd)) {
      durationStrategy += 2;
    }
    if (remainingGapAfter === 60) durationStrategy -= 1;
    if (remainingGapBefore === 60) durationStrategy -= 1;
  }

  return { durationBonus, peakHour, durationStrategy, perfectFitOverride };
}

function evaluateBayAtTime(
  bay: Simulator,
  currentSlot: Date,
  potentialEnd: Date,
  closeTime: Date,
  openTime: Date,
  dayBookings: BookingRecord[],
  allDayBookings: BookingRecord[],
  date: Date,
  durationMinutes: number
): BayEvaluation {
  const bayBookings = dayBookings.filter(b => b.simulatorId === bay.id);

  let isValid = true;
  let nextBookingStart: Date | null = null;
  let previousBookingEnd: Date | null = null;
  let rejectionReason: string | undefined = undefined;

  for (const booking of bayBookings) {
    const bStart = parseISO(booking.startTime);
    const bEnd = parseISO(booking.endTime);

    const overlap = areIntervalsOverlapping(
      { start: currentSlot, end: potentialEnd },
      { start: bStart, end: bEnd }
    );

    if (overlap) {
      isValid = false;
      rejectionReason = "Chevauche une réservation existante";
      break;
    }

    if (isAfter(bStart, currentSlot)) {
      if (!nextBookingStart || isBefore(bStart, nextBookingStart)) {
        nextBookingStart = bStart;
      }
    }

    if (isBefore(bEnd, potentialEnd)) {
      if (!previousBookingEnd || isAfter(bEnd, previousBookingEnd)) {
        previousBookingEnd = bEnd;
      }
    }
  }

  let remainingGapAfter = Infinity;
  if (nextBookingStart) {
    remainingGapAfter = differenceInMinutes(nextBookingStart, potentialEnd);
  } else {
    remainingGapAfter = differenceInMinutes(closeTime, potentialEnd);
  }

  let remainingGapBefore = Infinity;
  if (previousBookingEnd) {
    remainingGapBefore = differenceInMinutes(currentSlot, previousBookingEnd);
  } else {
    remainingGapBefore = differenceInMinutes(currentSlot, openTime);
  }

  if (isValid) {
    if (remainingGapAfter > 0 && remainingGapAfter < 30) {
      isValid = false;
      rejectionReason = `Espace après trop court (${remainingGapAfter}m)`;
    }
  }

  let breakdown: ScoreBreakdown | undefined;
  let score = 0;

  if (isValid) {
    breakdown = {
      base: 0,
      gapAfter: 0,
      gapBefore: 0,
      perfectFit: 0,
      bayClustering: 0,
      peakHour: 0,
      inefficientGap: 0,
      durationBonus: 0,
      durationStrategy: 0,
      total: 0
    };

    const touchesBookingBefore = previousBookingEnd !== null && remainingGapBefore === 0;
    const touchesBookingAfter = nextBookingStart !== null && remainingGapAfter === 0;
    const touchesDayStart = previousBookingEnd === null && remainingGapBefore === 0;
    const touchesDayEnd = nextBookingStart === null && remainingGapAfter === 0;

    breakdown.gapAfter = rateRemainingGap(remainingGapAfter, touchesBookingAfter);
    breakdown.gapBefore = rateRemainingGap(remainingGapBefore, touchesBookingBefore);

    if (touchesBookingBefore && touchesBookingAfter && remainingGapAfter === 0 && remainingGapBefore === 0) {
      breakdown.perfectFit = 5;
    } else if (touchesBookingBefore && touchesBookingAfter) {
      breakdown.perfectFit = 2;
    }

    if (bayBookings.length > 0) breakdown.bayClustering = 2;

    const emptyBay = bayBookings.length === 0;
    const otherBaysHaveBookings = allDayBookings.some(b => b.simulatorId !== bay.id);
    const hour = currentSlot.getHours();
    const totalStretch = remainingGapBefore + durationMinutes + remainingGapAfter;

    const durResult = applyDurationStrategy({
      durationMinutes,
      emptyBay,
      otherBaysHaveBookings,
      remainingGapBefore,
      remainingGapAfter,
      touchesDayStart,
      touchesDayEnd,
      touchesBookingBefore,
      touchesBookingAfter,
      hour,
      totalStretch
    });

    breakdown.durationBonus = durResult.durationBonus;
    breakdown.peakHour = durResult.peakHour;
    breakdown.durationStrategy = durResult.durationStrategy;

    if (durResult.perfectFitOverride !== undefined) {
      breakdown.perfectFit = durResult.perfectFitOverride;
    }

    if (emptyBay && !touchesDayStart && !touchesDayEnd) {
      const smaller = Math.min(remainingGapBefore, remainingGapAfter);
      const larger = Math.max(remainingGapBefore, remainingGapAfter);
      if (smaller > 0 && larger > 0) {
        const ratio = smaller / larger;
        if (ratio > 0.4) {
          breakdown.durationStrategy -= Math.round(ratio * 4);
        }
      }
    }

    breakdown.total =
      breakdown.base +
      breakdown.gapAfter +
      breakdown.gapBefore +
      breakdown.perfectFit +
      breakdown.bayClustering +
      breakdown.peakHour +
      breakdown.inefficientGap +
      breakdown.durationBonus +
      breakdown.durationStrategy;

    score = breakdown.total;
  }

  return {
    bayId: bay.id,
    bayName: bay.name,
    score,
    isValid,
    rejectionReason,
    breakdown,
    debug: {
      gapBefore: remainingGapBefore,
      gapAfter: remainingGapAfter
    }
  };
}

export function getOptimizedStartTimes(
  date: Date,
  durationMinutes: number,
  bookings: BookingRecord[],
  simulators: Simulator[] = DEFAULT_SIMULATORS,
  schedule: DaySchedule = DEFAULT_SCHEDULE
): TimeSlot[] {
  const { openTime, lastBookingTime, closeTime } = buildScheduleTimes(date, schedule);
  const dayBookings = bookings.filter(b => isSameDay(parseISO(b.startTime), date));

  const candidateTimes = new Set<string>();
  for (const bay of simulators) {
    const granularity = getBayGranularity(bay.id);
    let t = openTime;
    while (isBefore(t, lastBookingTime) || t.getTime() === lastBookingTime.getTime()) {
      const potentialEnd = addMinutes(t, durationMinutes);
      if (!isAfter(potentialEnd, closeTime)) {
        candidateTimes.add(t.toISOString());
      }
      t = addMinutes(t, granularity);
    }
  }

  const sortedTimes = Array.from(candidateTimes).sort();
  const slots: TimeSlot[] = [];

  for (const timeISO of sortedTimes) {
    const currentSlot = parseISO(timeISO);
    const potentialEnd = addMinutes(currentSlot, durationMinutes);
    const slotMinutes = currentSlot.getMinutes();

    const eligibleBays = simulators.filter(bay => {
      const granularity = getBayGranularity(bay.id);
      return slotMinutes % granularity === 0;
    });

    let bestBaySlot: BayEvaluation | null = null;
    const allBaysEvaluation: BayEvaluation[] = [];

    for (const bay of eligibleBays) {
      const evaluation = evaluateBayAtTime(bay, currentSlot, potentialEnd, closeTime, openTime, dayBookings, dayBookings, date, durationMinutes);
      allBaysEvaluation.push(evaluation);

      if (evaluation.isValid) {
        if (!bestBaySlot || evaluation.score > bestBaySlot.score) {
          bestBaySlot = evaluation;
        }
      }
    }

    if (bestBaySlot) {
      slots.push({
        time: timeISO,
        score: bestBaySlot.score,
        assignedBayId: bestBaySlot.bayId,
        breakdown: bestBaySlot.breakdown,
        label: undefined,
        allBays: allBaysEvaluation
      });
    }
  }

  if (slots.length > 0) {
    const BEST_CHOICE_THRESHOLD = 5;
    for (const slot of slots) {
      slot.label = slot.score >= BEST_CHOICE_THRESHOLD ? "Meilleur choix" : undefined;
    }
  }

  return slots;
}

export function validateBayAssignment(
  date: Date,
  time: string,
  durationMinutes: number,
  requestedBayId: string,
  bookings: BookingRecord[],
  simulators: Simulator[] = DEFAULT_SIMULATORS,
  schedule: DaySchedule = DEFAULT_SCHEDULE
): { valid: boolean; reason?: string; suggestedBayId?: string } {
  const slots = getOptimizedStartTimes(date, durationMinutes, bookings, simulators, schedule);

  const [h, m] = time.split(':').map(Number);
  const requestedTime = setMinutes(setHours(startOfDay(date), h), m);
  const requestedTimeISO = requestedTime.toISOString();

  const matchingSlot = slots.find(s => s.time === requestedTimeISO);

  if (!matchingSlot) {
    return { valid: false, reason: "Ce créneau horaire n'est pas disponible." };
  }

  const bayEval = matchingSlot.allBays?.find(b => b.bayId === requestedBayId);
  if (!bayEval || !bayEval.isValid) {
    return {
      valid: false,
      reason: bayEval?.rejectionReason || "Cette baie n'est pas disponible pour ce créneau.",
      suggestedBayId: matchingSlot.assignedBayId
    };
  }

  return { valid: true };
}
