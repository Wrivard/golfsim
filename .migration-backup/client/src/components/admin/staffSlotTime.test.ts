import { test } from "node:test";
import assert from "node:assert/strict";
import { staffSlotTime } from "./staffSlotTime";

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