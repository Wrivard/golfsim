import test from "node:test";
import assert from "node:assert/strict";
import { durationMinutes, intervalsOverlap, isHalfHourStart, publicOccupancy } from "@workspace/booking-domain";
import { isStaffSlotAvailable } from "./staff-booking";
import { calendarEventForBooking } from "./googleCalendar";
import { verifiedHistoricalBookings } from "./email-backfill";
import type { Booking } from "@workspace/db/schema";

test("one duration parser preserves decimal and h:mm formats without accepting garbage", () => {
  for (const [value, expected] of [["1h",60],["1.5h",90],["1h30",90],["2h05",125],["0.5h",30],["4",240]] as const)
    assert.equal(durationMinutes(value), expected);
  for (const value of ["1.5h30","1h5","1h60","-1h","0h","NaN","1h garbage","0.001h"])
    assert.equal(durationMinutes(value),0);
});
test("interval overlap is continuous, symmetric and allows exact adjacency", () => {
  assert.equal(intervalsOverlap(480,540,540,600),false);
  for (const [a,b] of [[481,541],[480,540],[490,520],[470,550]]) {
    assert.equal(intervalsOverlap(a,b,480,540),true);
    assert.equal(intervalsOverlap(480,540,a,b),true);
  }
  assert.ok(isHalfHourStart("08:30")); assert.ok(isHalfHourStart("08:00"));
  for (const value of ["08:01","08:60","24:00","8:00"]) assert.equal(isHalfHourStart(value),false);
});
test("staff collision rules reject partial imported overlaps and off-grid starts", () => {
  const date = new Date("2026-10-16T00:00:00");
  const records = [{ id:"test",customerName:"Test",simulatorId:"1",startTime:"2026-10-16T08:01:00",endTime:"2026-10-16T09:01:00" }];
  assert.equal(isStaffSlotAvailable(date,"08:00",60,"1",records),false);
  assert.equal(isStaffSlotAvailable(date,"09:00",60,"1",records),false);
  assert.equal(isStaffSlotAvailable(date,"08:01",60,"2",[]),false);
  assert.equal(isStaffSlotAvailable(date,"09:30",60,"1",records),true);
});
test("public occupancy is a whitelist, not a spread of private reservation objects", () => {
  const output = publicOccupancy([{ id:"private",name:"Hidden",email:"hidden@example.com",phone:"secret",
    simulatorId:"1",startTime:"start",endTime:"end" } as any]);
  assert.deepEqual(output,[{id:"occupied-0",simulatorId:"1",startTime:"start",endTime:"end"}]);
});
test("Google events calculate exactly the same minutes for h30 and decimal duration", () => {
  const base = {name:"Test",email:"test@example.com",phone:null,date:new Date("2026-10-16T00:00Z"),
    time:"15:00",bayType:"4",players:1};
  for (const duration of ["1h30","1.5h"])
    assert.equal(calendarEventForBooking({...base,duration}).end.dateTime,"2026-10-16T16:30:00");
});
test("historical import excludes personal attendees, free text, mismatched markers and cancellations", () => {
  const b = { id:"verified",email:"TEST@example.com",calendarEventId:"event" } as Booking;
  assert.equal(verifiedHistoricalBookings([b],[{id:"event",attendees:[{email:b.email}],description:"Réservation Golf SIM"}]).length,0);
  assert.equal(verifiedHistoricalBookings([b],[{id:"event",extendedProperties:{private:{golfSimBookingId:"other"}}}]).length,0);
  assert.equal(verifiedHistoricalBookings([b],[{id:"event",status:"cancelled",extendedProperties:{private:{golfSimBookingId:b.id}}}]).length,0);
  assert.equal(verifiedHistoricalBookings([b],[{id:"event",extendedProperties:{private:{golfSimBookingId:b.id}}}]).length,1);
});
