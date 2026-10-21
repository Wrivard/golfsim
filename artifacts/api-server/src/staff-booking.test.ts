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

test("staff requests follow the configured schedule, including overnight hours", () => {
  const extended: DaySchedule = { ...schedule, openHour: 7, lastBookingHour: 23, closeHour: 24 };
  assert.equal(isWithinPublicBookingHours("07:30", 60), true);
  assert.equal(isWithinPublicBookingHours("21:00", 60), true);
  assert.equal(isWithinPublicBookingHours("21:30", 60), true);
  assert.equal(isWithinPublicBookingHours("24:30", 60), true);
  assert.equal(isWithinPublicBookingHours("27:00", 60), false);
  assert.equal(isWithinPublicBookingHours("nonsense", 60), false);
  assert.equal(isStaffSlotAvailable(date, "07:30", 60, "1", [], extended), true);
  assert.equal(isStaffSlotAvailable(date, "21:30", 60, "1", [], extended), true);
  assert.equal(isStaffSlotAvailable(date, "24:00", 60, "1", [], extended), false);
  const overnight: DaySchedule = { ...schedule, openHour: 23, lastBookingHour: 26, closeHour: 26 };
  assert.equal(isStaffSlotAvailable(date, "24:00", 60, "1", [], overnight), true);
  assert.equal(isStaffSlotAvailable(date, "25:00", 60, "1", [], overnight), true);
  assert.equal(isStaffSlotAvailable(date, "26:00", 60, "1", [], overnight), false);
});

test("last reservation limits start time only; duration is bounded by closing", () => {
  const ordinaryClose: DaySchedule = {
    openHour: 8, openMinute: 0, lastBookingHour: 22, lastBookingMinute: 0,
    closeHour: 23, closeMinute: 0,
  };
  assert.equal(isStaffSlotAvailable(date, "18:30", 240, "1", [], ordinaryClose), true);

  const overnightClose: DaySchedule = { ...ordinaryClose, closeHour: 26, closeMinute: 0 };
  assert.equal(isStaffSlotAvailable(date, "21:30", 240, "1", [], overnightClose), true);

  const earlierClose: DaySchedule = { ...ordinaryClose, closeHour: 25, closeMinute: 0 };
  assert.equal(isStaffSlotAvailable(date, "21:30", 240, "1", [], earlierClose), false);
});