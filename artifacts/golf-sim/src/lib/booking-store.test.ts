import { test } from "node:test";
import assert from "node:assert/strict";
import { useBookingStore } from "./booking-store";

test("confirmBay retains the proposed bay, stores the actual bay, and reset clears both", () => {
  useBookingStore.getState().reset();
  try {
    useBookingStore.getState().setTimeSlot("2026-06-15T10:00:00", "1");
    assert.equal(useBookingStore.getState().assignedBayId, "1");
    assert.equal(useBookingStore.getState().proposedBayId, null);

    useBookingStore.getState().confirmBay("1", "3");
    assert.equal(useBookingStore.getState().assignedBayId, "3");
    assert.equal(useBookingStore.getState().proposedBayId, "1");
    assert.equal(useBookingStore.getState().isConfirmed, true);

    useBookingStore.getState().reset();
    assert.equal(useBookingStore.getState().assignedBayId, null);
    assert.equal(useBookingStore.getState().proposedBayId, null);
    assert.equal(useBookingStore.getState().isConfirmed, false);
    assert.equal(useBookingStore.getState().selectedTimeSlot, null);
  } finally {
    useBookingStore.getState().reset();
  }
});