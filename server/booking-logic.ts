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
  bayClustering: number;
  peakHour: number;
  inefficientGap: number;
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

const OPERATING_START_HOUR = 8;
const OPERATING_END_HOUR = 22;

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

function evaluateBayAtTime(
  bay: Simulator,
  currentSlot: Date,
  potentialEnd: Date,
  endOfDay: Date,
  dayBookings: BookingRecord[],
  date: Date
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
    remainingGapAfter = differenceInMinutes(endOfDay, potentialEnd);
  }

  let remainingGapBefore = Infinity;
  if (previousBookingEnd) {
    remainingGapBefore = differenceInMinutes(currentSlot, previousBookingEnd);
  } else {
    const openTime = setMinutes(setHours(startOfDay(date), OPERATING_START_HOUR), 0);
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
      bayClustering: 0,
      peakHour: 0,
      inefficientGap: 0,
      total: 0
    };

    if (remainingGapAfter === 0) breakdown.gapAfter += 5;
    if (remainingGapBefore === 0) breakdown.gapBefore += 5;
    if (remainingGapAfter >= 30 && remainingGapAfter <= 60) breakdown.inefficientGap -= 3;

    if (bayBookings.length > 0) breakdown.bayClustering += 2;

    const hour = currentSlot.getHours();
    if (hour >= 17 && hour < 21) breakdown.peakHour += 1;

    breakdown.total =
      breakdown.base +
      breakdown.gapAfter +
      breakdown.gapBefore +
      breakdown.bayClustering +
      breakdown.peakHour +
      breakdown.inefficientGap;

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
  simulators: Simulator[] = DEFAULT_SIMULATORS
): TimeSlot[] {
  const openTime = setMinutes(setHours(startOfDay(date), OPERATING_START_HOUR), 0);
  const endOfDay = setMinutes(setHours(startOfDay(date), OPERATING_END_HOUR), 0);
  const dayBookings = bookings.filter(b => isSameDay(parseISO(b.startTime), date));

  const candidateTimes = new Set<string>();
  for (const bay of simulators) {
    const granularity = getBayGranularity(bay.id);
    let t = openTime;
    while (isBefore(t, endOfDay)) {
      const potentialEnd = addMinutes(t, durationMinutes);
      if (!isAfter(potentialEnd, endOfDay)) {
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
      const evaluation = evaluateBayAtTime(bay, currentSlot, potentialEnd, endOfDay, dayBookings, date);
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
  simulators: Simulator[] = DEFAULT_SIMULATORS
): { valid: boolean; reason?: string; suggestedBayId?: string } {
  const slots = getOptimizedStartTimes(date, durationMinutes, bookings, simulators);

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
