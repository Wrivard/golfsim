import assert from "node:assert/strict";
import test from "node:test";
import { closureInput, closureOverlaps, closureOccupancy } from "./availability-closures";
import { seasonEnd } from "./recurrence";

const physical = {
  id: "test", kind: "physical" as const, title: "Travaux",
  startDate: "2026-10-14", endDate: "2026-10-16",
  startMinute: 8 * 60 + 30, endMinute: 10 * 60,
  bayIds: ["1", "4"],
  createdAt: new Date(),
};

test("physical closures are bay-specific, half-open and apply to both audiences", () => {
  for (const audience of ["public", "staff"] as const) {
    assert.equal(closureOverlaps(physical, "2026-10-15", "08:00", 60, "1", audience), true);
    assert.equal(closureOverlaps(physical, "2026-10-15", "09:00", 60, "4", audience), true);
    assert.equal(closureOverlaps(physical, "2026-10-15", "10:00", 60, "1", audience), false);
    assert.equal(closureOverlaps(physical, "2026-10-15", "09:00", 60, "2", audience), false);
    assert.equal(closureOverlaps(physical, "2026-10-17", "09:00", 60, "1", audience), false);
  }
  assert.equal(closureOccupancy([physical], "2026-10-15", "staff").length, 2);
});

test("online-until cutoff is inclusive but does not close staff reservations", () => {
  const cutoff = { ...physical, kind: "online_until" as const, startDate: "1900-01-01",
    endMinute: 1440, startMinute: 0, bayIds: ["1", "2", "3", "4"] };
  assert.equal(closureOverlaps(cutoff, cutoff.endDate, "09:00", 60, "4", "public"), true);
  assert.equal(closureOverlaps(cutoff, cutoff.endDate, "09:00", 60, "4", "staff"), false);
  assert.equal(closureOccupancy([cutoff], cutoff.endDate, "staff").length, 0);
  assert.equal(closureOccupancy([cutoff], cutoff.endDate, "public").length, 4);
});

test("invalid ranges, duplicate bays and malformed cutoff fail closed", () => {
  assert.equal(closureInput.safeParse({ ...physical, bayIds: ["1", "1"] }).success, false);
  assert.equal(closureInput.safeParse({ ...physical, endMinute: physical.startMinute }).success, false);
  assert.equal(closureInput.safeParse({ ...physical, endDate: "2026-10-13" }).success, false);
  assert.equal(closureInput.safeParse({ ...physical, kind: "online_until" }).success, false);
});

test("new season end uses the next April 30", () => {
  assert.equal(seasonEnd("2026-10-14"), "2027-04-30");
  assert.equal(seasonEnd("2027-03-01"), "2027-04-30");
  assert.equal(seasonEnd("2027-04-30"), "2027-04-30");
  assert.equal(seasonEnd("2027-05-01"), "2028-04-30");
});
