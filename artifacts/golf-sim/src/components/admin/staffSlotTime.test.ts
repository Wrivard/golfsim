import { test } from "node:test";
import assert from "node:assert/strict";
import { staffAvailableBays, staffAvailableTimes, staffSlotTime } from "./staffSlotTime";

test("9am remains 9am in Toronto and other browser timezones", () => {
  const original = process.env.TZ;
  try {
    for (const zone of ["America/Toronto", "UTC", "America/Vancouver"]) {
      process.env.TZ = zone;
      assert.equal(staffSlotTime({ time: "2026-09-30T09:00:00.000Z" }), "09:00");
      assert.equal(staffSlotTime({ time: "2026-09-30T09:30:00.000Z" }), "09:30");
      assert.equal(staffSlotTime({ time: "2026-09-30T13:00:00.000Z", bookingTime: "09:00" }), "09:00");
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test("keeps server-approved evening times for the selected bay", () => {
  const slots = [
    { time: "2026-11-07T17:00:00.000Z", bookingTime: "17:00", allBays: [{ bayId: "1", isValid: true }, { bayId: "2", isValid: true }, { bayId: "3", isValid: true }, { bayId: "4", isValid: true }] },
    { time: "2026-11-07T17:30:00.000Z", bookingTime: "17:30", allBays: [{ bayId: "1", isValid: false }, { bayId: "2", isValid: false }, { bayId: "3", isValid: true }, { bayId: "4", isValid: true }] },
    { time: "2026-11-07T21:00:00.000Z", bookingTime: "21:00", allBays: [{ bayId: "1", isValid: false }, { bayId: "2", isValid: false }, { bayId: "3", isValid: true }, { bayId: "4", isValid: true }] },
    { time: "2026-11-07T22:00:00.000Z", bookingTime: "22:00", allBays: [{ bayId: "1", isValid: true }, { bayId: "2", isValid: true }, { bayId: "3", isValid: true }, { bayId: "4", isValid: true }] },
  ];

  assert.deepEqual(staffAvailableTimes(slots), ["17:00", "17:30", "21:00", "22:00"]);
  assert.deepEqual(staffAvailableTimes(slots, "1"), ["17:00", "22:00"]);
  assert.deepEqual(staffAvailableTimes(slots, "3"), ["17:00", "17:30", "21:00", "22:00"]);
  assert.deepEqual(staffAvailableBays(slots, "17:30"), ["3", "4"]);
});