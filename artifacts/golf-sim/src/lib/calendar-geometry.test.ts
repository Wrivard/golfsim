import assert from "node:assert/strict";
import test from "node:test";
import { bookingGeometry, visibleBookingGeometry, visibleIntervalGeometry } from "../components/admin/calendarDuration";

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

test("one- and two-hour cards keep the true scale and half-hour positions", () => {
  const short = visibleBookingGeometry("12:30", "1h", 8, 24, 38);
  assert.equal(short.top, 4.5 * 38);
  assert.equal(short.height, 38);
  assert.equal(short.endTime, "13:30");
  assert.equal(short.continuesAfter, false);
  assert.equal(visibleBookingGeometry("12:30", "2h", 8, 24, 38).height, 76);
  assert.equal(visibleBookingGeometry("15:30", "0.5h", 8, 24, 38).height, 19);
});

test("midnight clips only the display, not the true end time or duration", () => {
  const exact = visibleBookingGeometry("22:00", "2h", 8, 24, 38);
  assert.equal(exact.top + exact.height, 16 * 38);
  assert.equal(exact.continuesAfter, false);
  const beyond = visibleBookingGeometry("23:30", "2h", 8, 24, 38);
  assert.equal(beyond.top, 15.5 * 38);
  assert.equal(beyond.height, 19);
  assert.equal(beyond.minutes, 120);
  assert.equal(beyond.endTime, "01:30");
  assert.equal(beyond.continuesAfter, true);
  assert.equal(beyond.afterWindow, false);
});

test("after-midnight starts remain available to the compact row in both time formats", () => {
  for (const time of ["00:30", "24:30"]) {
    const late = visibleBookingGeometry(time, "1h", 8, 24, 38);
    assert.equal(late.afterWindow, true);
    assert.equal(late.height, 0);
    assert.equal(late.endTime, "01:30");
    assert.equal(late.minutes, 60);
  }
});

test("physical closures use the same clipped display scale without ghost intervals", () => {
  const closure = visibleIntervalGeometry(13 * 60, 17 * 60, 8, 24, 38);
  assert.equal(closure.top, 5 * 38);
  assert.equal(closure.height, 4 * 38);
  assert.equal(visibleIntervalGeometry(0, 8 * 60, 8, 24, 38).height, 0);
  assert.equal(visibleIntervalGeometry(22 * 60, 26 * 60, 8, 24, 38).height, 2 * 38);
});
