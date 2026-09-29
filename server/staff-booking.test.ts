import { test } from "node:test";
import { strict as assert } from "node:assert";
import { isStaffSlotAvailable, isWithinPublicBookingHours } from "./staff-booking";
import type { BookingRecord, DaySchedule } from "./booking-logic";

const date = new Date(2026, 5, 15);
const schedule: DaySchedule = {
  openHour: 9, openMinute: 0, lastBookingHour: 20, lastBookingMinute: 0,
  closeHour: 21, closeMinute: 0,
};

test("staff selection keeps chosen bay and rejects exact overlapping intervals", () => {
  const bookings: BookingRecord[] = [{
    id: "existing", simulatorId: "2", customerName: "Customer",
    startTime: "2026-06-15T10:00:00", endTime: "2026-06-15T12:00:00",
  }];
  assert.equal(isStaffSlotAvailable(date, "11:00", 60, "2", bookings, schedule), false);
  assert.equal(isStaffSlotAvailable(date, "12:00", 60, "2", bookings, schedule), true);
  assert.equal(isStaffSlotAvailable(date, "11:00", 60, "1", bookings, schedule), true);
});

test("staff selection uses schedule and existing grid, not manual overrides", () => {
  assert.equal(isStaffSlotAvailable(date, "08:00", 60, "1", [], schedule), false);
  assert.equal(isStaffSlotAvailable(date, "20:00", 120, "1", [], schedule), false);
  assert.equal(isStaffSlotAvailable(date, "09:15", 60, "1", [], schedule), false);
  assert.equal(isStaffSlotAvailable(date, "09:00", 60, "1", [], schedule), true);
});

test("staff requests honor the public 08:00–22:00 submission bounds", () => {
  const extended: DaySchedule = { ...schedule, openHour: 7, lastBookingHour: 23, closeHour: 24 };
  assert.equal(isWithinPublicBookingHours("07:30", 60), false);
  assert.equal(isWithinPublicBookingHours("21:00", 60), true);
  assert.equal(isWithinPublicBookingHours("21:30", 60), false);
  assert.equal(isWithinPublicBookingHours("22:00", 60), false);
  assert.equal(isWithinPublicBookingHours("nonsense", 60), false);
  assert.equal(isStaffSlotAvailable(date, "07:30", 60, "1", [], extended), false);
  assert.equal(isStaffSlotAvailable(date, "21:30", 60, "1", [], extended), false);
});