import { test } from "node:test";
import { strict as assert } from "node:assert";
import { bookingEditSchema, isEditedSlotAvailable } from "./booking-edit";
const day = new Date(2026, 9, 16);
const records = [
  { id: "self", simulatorId: "2", startTime: "2026-10-16T10:00:00", endTime: "2026-10-16T12:00:00", customerName: "Demo" },
  { id: "other", simulatorId: "2", startTime: "2026-10-16T14:00:00", endTime: "2026-10-16T16:00:00", customerName: "Demo B" },
];
test("edit validates real dates, clock values, whole player counts and duration", () => {
  for (const input of [{date:"2026-02-30"}, {date:"16/10/2026"}, {time:"25:00"}, {time:"10:75"}, {players:1.5}, {duration:"5h"}])
    assert.equal(bookingEditSchema.safeParse(input).success, false);
  assert.equal(bookingEditSchema.safeParse({date:"2026-10-16",time:"12:00",duration:"2h",players:2}).success, true);
  assert.equal(bookingEditSchema.safeParse({time:"12:00"}).success, true);
});
test("editing excludes itself but refuses another booking, adjacent slots work", () => {
  assert.equal(isEditedSlotAvailable("self",day,"10:00",120,"2",records),true);
  assert.equal(isEditedSlotAvailable("self",day,"13:00",120,"2",records),false);
  assert.equal(isEditedSlotAvailable("self",day,"12:00",120,"2",records),true);
  assert.equal(isEditedSlotAvailable("self",day,"14:00",120,"1",records),true);
});
test("editing enforces submission hours and booking grid", () => {
  assert.equal(isEditedSlotAvailable("self",day,"21:30",120,"2",[]),false);
  assert.equal(isEditedSlotAvailable("self",day,"12:15",60,"2",[]),false);
});
