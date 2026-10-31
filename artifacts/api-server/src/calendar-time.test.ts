import assert from "node:assert/strict";
import test from "node:test";
import { isPastTorontoSlot } from "./calendar-time";

test("public same-day starts before Toronto local time are past", () => {
  // 13:22 in Toronto on October 31, 2026.
  const now = new Date("2026-10-31T17:22:00.000Z");
  assert.equal(isPastTorontoSlot("2026-10-31", "08:00", now), true);
  assert.equal(isPastTorontoSlot("2026-10-31", "11:00", now), true);
  assert.equal(isPastTorontoSlot("2026-10-31", "13:00", now), true);
  assert.equal(isPastTorontoSlot("2026-10-31", "13:30", now), false);
  assert.equal(isPastTorontoSlot("2026-11-01", "08:00", now), false);
  assert.equal(isPastTorontoSlot("2026-10-30", "23:30", now), true);
});
