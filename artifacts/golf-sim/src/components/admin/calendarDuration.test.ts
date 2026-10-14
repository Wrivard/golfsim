import assert from "node:assert/strict";
import test from "node:test";
import { parseDurationToMinutes, bookingGeometry } from "./calendarDuration.ts";

test("calendar end time is distinct from the booking duration", () => {
  assert.equal(bookingGeometry("12:30", "4h").endTime, "16:30");
  assert.equal(bookingGeometry("12:30", "1h30").endTime, "14:00");
  assert.equal(bookingGeometry("23:30", "2h").endTime, "01:30");
});

test("parses decimal-hour durations as fractional hours", () => {
  assert.equal(parseDurationToMinutes("1.5h"), 90);
});

test("parses integer-hour durations", () => {
  assert.equal(parseDurationToMinutes("1h"), 60);
  assert.equal(parseDurationToMinutes("3h"), 180);
});

test("parses hour-and-minute durations", () => {
  assert.equal(parseDurationToMinutes("1h30"), 90);
  assert.equal(parseDurationToMinutes("2h05"), 125);
});

test("does not interpret malformed durations as new formats", () => {
  assert.equal(parseDurationToMinutes("1.5h30"), 60);
  assert.equal(parseDurationToMinutes("1h5"), 60);
  assert.equal(parseDurationToMinutes("unrecognized"), 60);
});