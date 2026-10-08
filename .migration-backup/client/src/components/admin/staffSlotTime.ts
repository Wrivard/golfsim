/** Slot ISO values encode business clock time, not a browser-local appointment instant. */
export function staffSlotTime(slot: { time: string; bookingTime?: string }): string {
  if (slot.bookingTime) return slot.bookingTime;
  // Compatibility with servers published before bookingTime was added.
  return slot.time.slice(11, 16);
}