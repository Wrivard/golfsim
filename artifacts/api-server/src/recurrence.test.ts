import {test} from "node:test";
import assert from "node:assert/strict";
import {recurrenceDates} from "./recurrence";
test("weekly Tuesdays inclusive, independent of daylight saving",()=>{
 assert.deepEqual(recurrenceDates("2026-10-27","2026-11-10",[2]),["2026-10-27","2026-11-03","2026-11-10"]);
});
test("alternate weeks, multiple weekdays and validation",()=>{
 assert.deepEqual(recurrenceDates("2026-10-12","2026-10-27",[1,2],2),["2026-10-12","2026-10-13","2026-10-26","2026-10-27"]);
 assert.throws(()=>recurrenceDates("2026-02-30","2026-03-20",[2]));
 assert.throws(()=>recurrenceDates("2026-10-12","2026-10-11",[2]));
 assert.throws(()=>recurrenceDates("2026-10-12","2026-10-20",[]));
});
