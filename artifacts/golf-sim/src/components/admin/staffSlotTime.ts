/** Slot ISO values encode business clock time, not a browser-local appointment instant. */
export function staffSlotTime(slot: { time: string; bookingTime?: string }): string {
  if (slot.bookingTime) return slot.bookingTime;
  // Compatibility with servers published before bookingTime was added.
  return slot.time.slice(11, 16);
}

export interface StaffAvailabilitySlot {
  time: string;
  bookingTime?: string;
  allBays?: { bayId: string; isValid: boolean }[];
}

/** Keep every server-approved time for the selected bay; the API owns schedule and duration rules. */
export function staffAvailableTimes(slots: StaffAvailabilitySlot[], bayType: string): string[] {
  return slots
    .filter(slot => slot.allBays?.some(bay => bay.bayId === bayType && bay.isValid))
    .map(staffSlotTime)
    .sort();
}