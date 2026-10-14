import assert from "node:assert/strict";
import test from "node:test";
import { bookingGeometry } from "../components/admin/calendarDuration";

test("15:00–16:00 ends precisely on the 16:00 grid line, not 16:30", () => {
  const position = bookingGeometry("15:00", "1h");
  assert.equal(position.top, 7 * 64);
  assert.equal(position.height, 64);
  assert.equal(position.top + position.height, (16 - 8) * 64);
  assert.equal(position.endTime, "16:00");
});
test("half-hour, decimal, h30 and multi-hour durations use the same scale", () => {
  assert.equal(bookingGeometry("15:30", "0.5h").height, 32);
  assert.equal(bookingGeometry("15:30", "0.5h").endTime, "16:00");
  assert.equal(bookingGeometry("15:30", "1h30").height, 96);
  assert.equal(bookingGeometry("15:30", "1.5h").endTime, "17:00");
  assert.equal(bookingGeometry("15:00", "3h").height, 192);
});
