import test from "node:test";
import assert from "node:assert/strict";
import { getOptimizedStartTimes } from "./booking-logic";

const overnightSchedule = {
  openHour: 23,
  openMinute: 0,
  lastBookingHour: 26,
  lastBookingMinute: 0,
  closeHour: 26,
  closeMinute: 0,
};

test("overnight starts remain attached to the operating date and can reach 2 a.m.", () => {
  const date = new Date("2026-10-16T00:00:00.000Z");
  const slots = getOptimizedStartTimes(date, 60, [], undefined, overnightSchedule);
  assert.ok(slots.some(slot => slot.time === "2026-10-17T00:00:00.000Z"));
  assert.ok(slots.some(slot => slot.time === "2026-10-17T01:00:00.000Z"));
  assert.equal(slots.some(slot => slot.time === "2026-10-17T02:00:00.000Z"), false);
});

test("next-calendar-day bookings block overlapping overnight starts", () => {
  const date = new Date("2026-10-16T00:00:00.000Z");
  const slots = getOptimizedStartTimes(date, 60, [{
    id: "next-day-conflict",
    simulatorId: "1",
    startTime: "2026-10-17T00:00:00.000Z",
    endTime: "2026-10-17T01:00:00.000Z",
    customerName: "External event",
  }], undefined, overnightSchedule);
  const midnight = slots.find(slot => slot.time === "2026-10-17T00:00:00.000Z");
  assert.ok(midnight);
  assert.equal(midnight.allBays?.find(bay => bay.bayId === "1")?.isValid, false);
});
