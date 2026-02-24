export interface Simulator {
  id: string;
  name: string;
}

export interface Booking {
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
  openStretchPenalty: number;
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

export interface BookingDetails {
  name: string;
  email: string;
  phone?: string;
  players: number;
  notes?: string;
}
