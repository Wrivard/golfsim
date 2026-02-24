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
import { Booking, TimeSlot, Simulator, BayEvaluation, ScoreBreakdown } from './booking-types';

const OPERATING_START_HOUR = 8;
const OPERATING_END_HOUR = 22;
const SLOT_GRANULARITY = 60;

export function getOptimizedStartTimes(
  date: Date, 
  durationMinutes: number, 
  bookings: Booking[],
  simulators: Simulator[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  let currentSlot = setMinutes(setHours(startOfDay(date), OPERATING_START_HOUR), 0);
  const endOfDay = setMinutes(setHours(startOfDay(date), OPERATING_END_HOUR), 0);
  
  const dayBookings = bookings.filter(b => isSameDay(parseISO(b.startTime), date));

  while (isBefore(currentSlot, endOfDay)) {
    const potentialEnd = addMinutes(currentSlot, durationMinutes);

    if (isAfter(potentialEnd, endOfDay)) {
       currentSlot = addMinutes(currentSlot, SLOT_GRANULARITY);
       continue;
    }

    let bestBaySlot: BayEvaluation | null = null;
    const allBaysEvaluation: BayEvaluation[] = [];

    for (const bay of simulators) {
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
              perfectFit: 0,
              bayClustering: 0,
              peakHour: 0,
              inefficientGap: 0,
              openStretchPenalty: 0,
              total: 0
            };

            if (remainingGapAfter === 0) breakdown.gapAfter += 5;
            if (remainingGapBefore === 0) breakdown.gapBefore += 5;
            if (remainingGapAfter >= 30 && remainingGapAfter <= 60) breakdown.inefficientGap -= 3;

            if (remainingGapAfter === 0 && remainingGapBefore === 0) {
              breakdown.perfectFit += 3;
            }

            if (bayBookings.length > 0) breakdown.bayClustering += 2;

            const hour = currentSlot.getHours();
            if (hour >= 17 && hour < 21) breakdown.peakHour += 1;

            breakdown.total = 
              breakdown.base + 
              breakdown.gapAfter + 
              breakdown.gapBefore + 
              breakdown.perfectFit +
              breakdown.bayClustering + 
              breakdown.peakHour + 
              breakdown.inefficientGap +
              breakdown.openStretchPenalty;
            
            score = breakdown.total;
        }

        const evaluation: BayEvaluation = {
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

        allBaysEvaluation.push(evaluation);

        if (isValid) {
            if (!bestBaySlot || score > bestBaySlot.score) {
                bestBaySlot = evaluation;
            }
        }
    }

    if (bestBaySlot) {
        slots.push({
            time: currentSlot.toISOString(),
            score: bestBaySlot.score,
            assignedBayId: bestBaySlot.bayId,
            breakdown: bestBaySlot.breakdown,
            label: bestBaySlot.score >= 5 ? "Meilleur choix" : undefined,
            allBays: allBaysEvaluation
        });
    }

    currentSlot = addMinutes(currentSlot, SLOT_GRANULARITY);
  }

  return slots.sort((a, b) => b.score - a.score);
}
