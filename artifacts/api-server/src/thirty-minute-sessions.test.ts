import assert from "node:assert/strict";
import test from "node:test";
import {
  BOOKING_DURATIONS, bookingPrice, durationMinutes, formatDuration, isOfferedDuration,
} from "@workspace/booking-domain";
import { CreatePublicBookingBody, GetStaffAvailabilityQueryParams } from "@workspace/api-zod";
import { bookingRequestSchema, staffBookingSchema } from "./booking-input";
import { bookingEditSchema, isEditedSlotAvailable } from "./booking-edit";
import { getOptimizedStartTimes, type BookingRecord, type DaySchedule } from "./booking-logic";
import { isStaffSlotAvailable } from "./staff-booking";
import { closureOccupancy } from "./availability-closures";
import { calendarEventForBooking, parseCalendarEvent } from "./googleCalendar";
import { bookingTemplate } from "./booking-emails";
import { recurrenceDates, seasonEnd } from "./recurrence";

const date = new Date(2026, 9, 16);
const base = {
  name: "Fixture", email: "fixture@example.invalid", phone: "555-0100", date: "2026-10-16",
  time: "10:00", bayType: "1", players: 2, duration: "0.5h",
};
const at = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const day = new Date(date);
  day.setHours(hours, minutes, 0, 0);
  return day.toISOString();
};
const record = (time: string, minutes = 30, bay = "1"): BookingRecord => ({
  id: `${bay}-${time}`, simulatorId: bay, customerName: "Fixture",
  startTime: at(time), endTime: new Date(+new Date(at(time)) + minutes * 60000).toISOString(),
});

test("five sale durations share readable labels and an explicitly unknown half-hour price", () => {
  assert.deepEqual(BOOKING_DURATIONS.map(d => d.minutes), [30, 60, 120, 180, 240]);
  assert.deepEqual(BOOKING_DURATIONS.map(d => bookingPrice(d.value)), [null, 25, 56, 84, 112]);
  assert.equal(bookingPrice("0h30"), null);
  assert.equal(bookingPrice(30), null);
  for (const value of ["0.5h", "0h30"]) {
    assert.equal(durationMinutes(value), 30);
    assert.equal(formatDuration(value), "30 min");
  }
  assert.equal(formatDuration("1h30"), "1 h 30 min");
  assert.equal(formatDuration(90), "1 h 30 min");
  assert.equal(formatDuration("invalid"), "Durée inconnue");
  assert.equal(isOfferedDuration("1h30"), false);
  assert.equal(bookingPrice("1h30"), null);
});

test("public, staff, edit and generated contracts accept precisely the new sales catalogue", () => {
  for (const {value, minutes} of BOOKING_DURATIONS) {
    assert.equal(bookingRequestSchema.safeParse({...base, duration:value}).success, true);
    assert.equal(staffBookingSchema.safeParse({...base, duration:value}).success, true);
    assert.equal(bookingEditSchema.safeParse({duration:value}).success, true);
    assert.equal(CreatePublicBookingBody.safeParse({...base, duration:value, turnstileToken:"fixture"}).success, true);
    assert.equal(GetStaffAvailabilityQueryParams.safeParse({date, duration:minutes}).success, true);
  }
  for (const duration of ["0h", "30min", "1.5h", "2.5h", "3.5h", "5h", "30garbage"]) {
    assert.equal(staffBookingSchema.safeParse({...base, duration}).success, false, duration);
    assert.equal(bookingRequestSchema.safeParse({...base, duration}).success, false, duration);
  }
  for (const duration of [0, 15, 30.5, 90, 150, 210, 300]) {
    assert.equal(GetStaffAvailabilityQueryParams.safeParse({date, duration}).success, false);
  }
  // An imported duration can be retained when only contact data is changed.
  assert.equal(bookingEditSchema.safeParse({name:"Nouveau nom", notes:"Correction"}).success, true);
  assert.equal(CreatePublicBookingBody.safeParse({...base,time:"24:30",turnstileToken:"fixture"}).success,true);
});

test("adjacent half-hour reservations fit exactly and revalidation rejects a stale competing request", () => {
  for (const bay of ["1","2","3","4"]) {
    const occupancy = [record("10:00", 30, bay)];
    assert.equal(isStaffSlotAvailable(date,"09:30",30,bay,occupancy),true);
    assert.equal(isStaffSlotAvailable(date,"10:00",30,bay,occupancy),false);
    assert.equal(isStaffSlotAvailable(date,"10:30",30,bay,occupancy),true);
    assert.equal(isStaffSlotAvailable(date,"09:30",60,bay,occupancy),false);
    assert.equal(isStaffSlotAvailable(date,"10:30",120,bay,occupancy),true);
    assert.equal(isEditedSlotAvailable("different",date,"10:00",30,bay,occupancy),false);
    assert.equal(isEditedSlotAvailable(occupancy[0].id,date,"10:00",30,bay,occupancy),true);
    // Same available result observed by two requests, rechecked after the first saves.
    const initiallyFree: BookingRecord[] = [];
    assert.equal(isStaffSlotAvailable(date,"10:00",30,bay,initiallyFree),true);
    initiallyFree.push(record("10:00",30,bay));
    assert.equal(isStaffSlotAvailable(date,"10:00",30,bay,initiallyFree),false);
  }
});

test("physical and public-only closures retain their audience and exact boundary behaviour", () => {
  const closure = {
    id:"fixture",kind:"physical" as const,title:"Fermeture",startDate:"2026-10-16",endDate:"2026-10-16",
    startMinute:600,endMinute:630,bayIds:["1"],createdAt:new Date(),
  };
  const closed = closureOccupancy([closure],"2026-10-16","staff");
  assert.equal(isStaffSlotAvailable(date,"10:00",30,"1",closed),false);
  assert.equal(isStaffSlotAvailable(date,"10:30",30,"1",closed),true);
  assert.equal(isStaffSlotAvailable(date,"10:00",30,"2",closed),true);
  const publicOnly = {...closure,kind:"online_until" as const};
  assert.equal(closureOccupancy([publicOnly],"2026-10-16","staff").length,0);
  assert.ok(closureOccupancy([publicOnly],"2026-10-16","public").length>0);
});

test("late half-hours obey last start and closing independently", () => {
  const schedule:DaySchedule={openHour:8,openMinute:0,lastBookingHour:25,lastBookingMinute:30,closeHour:26,closeMinute:0};
  for (const time of ["23:30","24:00","24:30","25:30"]) {
    assert.equal(isStaffSlotAvailable(date,time,30,"1",[],schedule),true,time);
  }
  assert.equal(isStaffSlotAvailable(date,"26:00",30,"1",[],schedule),false);
  assert.equal(isStaffSlotAvailable(date,"25:30",60,"1",[],schedule),false);
  const cutoff = {...schedule,lastBookingHour:22,lastBookingMinute:0};
  assert.equal(isStaffSlotAvailable(date,"21:30",240,"1",[],cutoff),true);
  assert.equal(isStaffSlotAvailable(date,"22:00",30,"1",[],cutoff),true);
  assert.equal(isStaffSlotAvailable(date,"22:30",30,"1",[],cutoff),false);
  const importedOnRealDate=record("24:30");
  assert.equal(isStaffSlotAvailable(date,"24:30",30,"1",[importedOnRealDate],schedule),false);
  const overnightClosure={
    id:"night",kind:"physical" as const,title:"Fermeture",startDate:"2026-10-17",endDate:"2026-10-17",
    startMinute:0,endMinute:60,bayIds:["1"],createdAt:new Date(),
  };
  const closed=closureOccupancy([overnightClosure],"2026-10-17","staff");
  assert.equal(isStaffSlotAvailable(date,"24:30",30,"1",closed,schedule),false);
});

test("a genuine half-hour gap is offered and can host consecutive league sessions", () => {
  const occupancy=[record("08:00",120),record("10:30",120)];
  const slots=getOptimizedStartTimes(date,30,occupancy,[{id:"1",name:"Baie 1"}]);
  assert.ok(slots.some(s=>s.time===at("10:00")));
  const end=seasonEnd("2026-10-16");
  const days=recurrenceDates("2026-10-16",end,[5]);
  assert.equal(end,"2027-04-30");
  assert.ok(days.length>1 && days.length<=104);
  for(const day of days) assert.equal(isStaffSlotAvailable(new Date(`${day}T00:00:00`),"10:00",30,"1",[]),true);
});

test("Google writes, imports and public email preserve exact thirty-minute boundaries", () => {
  for(const time of ["10:00","23:30","24:30"]) {
    const event=calendarEventForBooking({...base,id:"fixture",date:new Date("2026-10-16T00:00:00Z"),time});
    assert.equal(+new Date(event.end.dateTime)-+new Date(event.start.dateTime),30*60000);
    assert.match(event.description,/Durée: 30 min/);
    // Google returns offset timestamps, unlike its local-time write payload.
    const imported=parseCalendarEvent({...event,id:"fixture",start:{dateTime:`${event.start.dateTime}-04:00`},end:{dateTime:`${event.end.dateTime}-04:00`}});
    assert.equal(durationMinutes(imported!.duration),30);
    assert.equal(imported!.time,time);
  }
  for(const audience of ["owner","customer"] as const){
    const mail=bookingTemplate([{...base,date:new Date("2026-10-16T00:00:00Z"),id:"fixture",notes:null}],audience);
    assert.match(mail.text,/30 min/);
    assert.doesNotMatch(mail.text,/0\.5h|0\s*\$|12[.,]50|14\s*\$/);
  }
});
