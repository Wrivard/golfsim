import test from "node:test";
import assert from "node:assert/strict";
import { getOptimizedStartTimes, validateBayAssignment, type BookingRecord } from "./booking-logic";
import { isStaffSlotAvailable } from "./staff-booking";
import { isEditedSlotAvailable } from "./booking-edit";
import { recurrenceDates } from "./recurrence";

const day = new Date(2026, 9, 16);
const bays = ["1", "2", "3", "4"];

test("public and staff accept whole-hour and half-hour starts on every bay for all durations", () => {
  for (const duration of [60, 120, 180, 240]) {
    for (const bay of bays) {
      for (const time of ["16:00", "16:30", "17:00", "17:30"]) {
        assert.equal(validateBayAssignment(day, time, duration, bay, []).valid, true);
        assert.equal(isStaffSlotAvailable(day, time, duration, bay, []), true);
        assert.equal(isEditedSlotAvailable("editing", day, time, duration, bay, []), true);
      }
      assert.equal(isStaffSlotAvailable(day, "16:15", duration, bay, []), false);
      assert.equal(validateBayAssignment(day, "16:45", duration, bay, []).valid, false);
    }
  }
});

test("a half-hour start cannot overlap a reservation but can start at its exact end", () => {
  for (const bay of bays) {
    const records: BookingRecord[] = [{
      id: "existing", simulatorId: bay, customerName: "Fixture",
      startTime: "2026-10-16T16:30:00", endTime: "2026-10-16T18:30:00",
    }];
    for (const time of ["16:00", "16:30", "17:00", "18:00"]) {
      assert.equal(validateBayAssignment(day, time, 60, bay, records).valid, false);
      assert.equal(isStaffSlotAvailable(day, time, 60, bay, records), false);
      assert.equal(isEditedSlotAvailable("different", day, time, 60, bay, records), false);
    }
    assert.equal(isStaffSlotAvailable(day, "18:30", 60, bay, records), true);
    assert.equal(isEditedSlotAvailable("existing", day, "17:30", 60, bay, records), true);
    assert.equal(isStaffSlotAvailable(day, "20:30", 120, bay, []), false);
    assert.equal(isStaffSlotAvailable(day, "20:30", 60, bay, []), true);
  }
});

test("weekly league sessions at a half-hour use the same availability validation on every bay", () => {
  const dates = recurrenceDates("2026-10-16", "2026-11-06", [5]);
  assert.equal(dates.length, 4);
  for (const date of dates) {
    for (const bay of bays) {
      const currentDay = new Date(`${date}T00:00:00`);
      assert.equal(isStaffSlotAvailable(currentDay, "08:30", 120, bay, []), true);
      const occupied: BookingRecord[] = [{
        id: "league", simulatorId: bay, customerName: "Fixture",
        startTime: `${date}T08:30:00`, endTime: `${date}T10:30:00`,
      }];
      assert.equal(isStaffSlotAvailable(currentDay, "08:30", 120, bay, occupied), false);
    }
  }
});

test("ranking recognizes a perfect half-hour gap on each bay as a best choice", () => {
  for (const bay of bays) {
    const records: BookingRecord[] = [
      { id: "before", simulatorId: bay, startTime: "2026-10-16T08:00:00", endTime: "2026-10-16T16:30:00", customerName: "Fixture" },
      { id: "after", simulatorId: bay, startTime: "2026-10-16T17:30:00", endTime: "2026-10-16T23:00:00", customerName: "Fixture" },
    ];
    const slots = getOptimizedStartTimes(day, 60, records, [{ id: bay, name: bay }]);
    assert.equal(slots.length, 1);
    assert.equal(new Date(slots[0].time).getMinutes(), 30);
    assert.equal(slots[0].assignedBayId, bay);
    assert.equal(slots[0].label, "Meilleur choix");
    assert.equal(slots[0].allBays![0].metrics!.newlyUnsellableMinutes, 0);
  }
});
