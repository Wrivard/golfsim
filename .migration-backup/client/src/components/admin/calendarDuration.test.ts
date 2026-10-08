import assert from "node:assert/strict";
import test from "node:test";
import { parseDurationToMinutes } from "./calendarDuration.ts";

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