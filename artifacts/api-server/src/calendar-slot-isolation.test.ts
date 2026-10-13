import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {getTableConfig} from "drizzle-orm/pg-core";
import {bookings} from "@workspace/db/schema";
import {getConfirmationBay} from "./confirmation-bay";

test("schema permits matching slots across calendars without removing the lookup index",()=>{
  const indexes=getTableConfig(bookings).indexes;
  assert.ok(!indexes.some(i=>i.config.unique));
  assert.ok(indexes.some(i=>i.config.name==="bookings_slot_lookup"));
});

test("hidden history does not block confirmation, while occupied active bays still do",()=>{
  const date=new Date("2026-10-14T00:00:00Z");
  const records=["1","2","3","4"].map(bay=>({
    id:bay,simulatorId:bay,startTime:"2026-10-14T08:00:00",
    endTime:"2026-10-14T12:00:00",customerName:"Fixture",source:"old-calendar",
  }));
  const schedule={openHour:8,openMinute:0,lastBookingHour:22,lastBookingMinute:0,closeHour:24,closeMinute:0,isClosed:false};
  assert.ok(getConfirmationBay(date,"08:00",240,records.filter(b=>b.source==="active-calendar"),schedule));
  assert.equal(getConfirmationBay(date,"08:00",240,records,schedule),null);
});

test("creation retains a date lock, fresh source-filtered reads and source tagging",async()=>{
  const source=await readFile(new URL("./storage.ts",import.meta.url),"utf8");
  const method=source.slice(source.indexOf("async createBookingWithConflictCheck("),source.indexOf("async getAdminByUsername("));
  assert.match(method,/pg_advisory_xact_lock/);
  assert.match(method,/await bookingSourceFilter\(\)/);
  assert.ok(method.indexOf("pg_advisory_xact_lock")<method.indexOf("checkConflict(existingBookings)"));
  assert.ok(method.indexOf("checkConflict(existingBookings)")<method.indexOf("tx.insert(bookings)"));
  assert.match(method,/await tagBooking\(tx, booking.id\)/);
});
