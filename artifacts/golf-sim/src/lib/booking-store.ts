import { create } from 'zustand';
import { Booking, BookingDetails, Simulator, TimeSlot } from './booking-types';

interface BookingStore {
  step: number;
  selectedDuration: number | null;
  selectedDate: Date;
  selectedTimeSlot: string | null;
  assignedBayId: string | null;
  proposedBayId: string | null;
  userDetails: BookingDetails | null;
  isSubmitting: boolean;
  isConfirmed: boolean;
  
  simulators: Simulator[];
  bookings: Booking[];
  isLoadingBookings: boolean;

  setStep: (step: number) => void;
  setDuration: (minutes: number) => void;
  setDate: (date: Date) => void;
  setTimeSlot: (time: string | null, bayId: string | null) => void;
  setUserDetails: (details: BookingDetails) => void;
  setBookings: (bookings: Booking[]) => void;
  setIsLoadingBookings: (loading: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setIsConfirmed: (confirmed: boolean) => void;
  confirmBay: (proposedBayId: string, actualBayId: string) => void;
  reset: () => void;
}

const SIMULATORS: Simulator[] = [
  { id: '1', name: 'Baie 1' },
  { id: '2', name: 'Baie 2' },
  { id: '3', name: 'Baie 3' },
  { id: '4', name: 'Baie 4' },
];

export const useBookingStore = create<BookingStore>((set) => ({
  step: 1,
  selectedDuration: null,
  selectedDate: new Date(),
  selectedTimeSlot: null,
  assignedBayId: null,
  proposedBayId: null,
  userDetails: null,
  isSubmitting: false,
  isConfirmed: false,
  
  simulators: SIMULATORS,
  bookings: [],
  isLoadingBookings: false,

  setStep: (step) => set({ step }),
  setDuration: (minutes) => set({ selectedDuration: minutes }),
  setDate: (date) => set({ selectedDate: date, selectedTimeSlot: null, assignedBayId: null, proposedBayId: null }),
  setTimeSlot: (time, bayId) => set({ selectedTimeSlot: time, assignedBayId: bayId, proposedBayId: null }),
  setUserDetails: (details) => set({ userDetails: details }),
  setBookings: (bookings) => set({ bookings }),
  setIsLoadingBookings: (loading) => set({ isLoadingBookings: loading }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setIsConfirmed: (confirmed) => set({ isConfirmed: confirmed }),
  confirmBay: (proposedBayId, actualBayId) => set({ proposedBayId, assignedBayId: actualBayId, isConfirmed: true }),
  
  reset: () => set({
    step: 1,
    selectedDuration: null,
    selectedTimeSlot: null,
    assignedBayId: null,
    proposedBayId: null,
    userDetails: null,
    isSubmitting: false,
    isConfirmed: false,
    bookings: [],
  })
}));
