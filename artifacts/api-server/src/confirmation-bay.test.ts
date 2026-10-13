import { test } from "node:test";
import assert from "node:assert/strict";
import { getConfirmationBay } from "./confirmation-bay";
import type { BookingRecord, DaySchedule } from "./booking-logic";

const date = new Date("2026-06-15T00:00:00");
const schedule: DaySchedule = {
  openHour: 8, openMinute: 0,
  lastBookingHour: 21, lastBookingMinute: 0,
  closeHour: 22, closeMinute: 0,
};

function occupied(bayId: string, start: string, end: string): BookingRecord {
  return {
    id: `${bayId}-${start}`,
    simulatorId: bayId,
    startTime: `2026-06-15T${start}:00`,
    endTime: `2026-06-15T${end}:00`,
    customerName: "Existing",
  };
}

test("confirmation chooses a new available bay when the preview bay was booked", () => {
  const initial = getConfirmationBay(date, "10:00", 60, [], schedule);
  assert.ok(initial);
  const final = getConfirmationBay(date, "10:00", 60, [occupied(initial, "10:00", "11:00")], schedule);
  assert.ok(final);
  assert.notEqual(final, initial);
});

test("confirmation retains the proposed best bay when availability is unchanged", () => {
  const proposedBay = getConfirmationBay(date, "10:00", 60, [], schedule);
  assert.ok(proposedBay);
  const confirmedBay = getConfirmationBay(date, "10:00", 60, [], schedule);
  assert.equal(confirmedBay, proposedBay);
});

test("confirmation rejects an unavailable time, even if a bay was proposed earlier", () => {
  const bookings = ["1", "2", "3", "4"].map(id => occupied(id, "10:00", "11:00"));
  assert.equal(getConfirmationBay(date, "10:00", 60, bookings, schedule), null);
  assert.equal(getConfirmationBay(date, "21:30", 60, [], schedule), null);
});

test("half-hour confirmation can use any bay, including bays 1 and 2", () => {
  for (const bay of ["1", "2", "3", "4"]) {
    const occupiedOthers = ["1", "2", "3", "4"].filter(id => id !== bay)
      .map(id => occupied(id, "10:00", "12:00"));
    assert.equal(getConfirmationBay(date, "10:30", 60, occupiedOthers, schedule), bay);
  }
});