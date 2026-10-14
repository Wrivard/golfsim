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

test("online restrictions accept a single day or an inclusive period, never blocking staff", () => {
  for (const endDate of ["2026-10-20", "2026-10-23"]) {
    const input = { kind: "online_until" as const, startDate: "2026-10-20", endDate,
      startMinute: 0, endMinute: 1440, bayIds: ["1", "2", "3", "4"] as ("1" | "2" | "3" | "4")[], title: "En ligne" };
    assert.equal(closureInput.safeParse(input).success, true);
    const restriction = { ...input, id: "range", createdAt: new Date() };
    for (const date of [input.startDate, endDate]) {
      for (const bay of input.bayIds) {
        assert.equal(closureOverlaps(restriction, date, "08:30", 60, bay, "public"), true);
        assert.equal(closureOverlaps(restriction, date, "08:30", 60, bay, "staff"), false);
      }
      assert.equal(closureOccupancy([restriction], date, "public").length, 4);
      assert.equal(closureOccupancy([restriction], date, "staff").length, 0);
    }
    for (const date of ["2026-10-19", "2026-10-24"]) {
      assert.equal(closureOverlaps(restriction, date, "08:30", 60, "1", "public"), false);
      assert.equal(closureOccupancy([restriction], date, "public").length, 0);
    }
    assert.equal(closureInput.safeParse({ ...input, endDate: "2026-10-19" }).success, false);
    assert.equal(closureInput.safeParse({ ...input, startMinute: 60 }).success, false);
    assert.equal(closureInput.safeParse({ ...input, bayIds: ["1", "2"] }).success, false);
  }
});

test("new season end uses the next April 30", () => {
  assert.equal(seasonEnd("2026-10-14"), "2027-04-30");
  assert.equal(seasonEnd("2027-03-01"), "2027-04-30");
  assert.equal(seasonEnd("2027-04-30"), "2027-04-30");
  assert.equal(seasonEnd("2027-05-01"), "2028-04-30");
});
