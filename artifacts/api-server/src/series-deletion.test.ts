import test from "node:test";
import assert from "node:assert/strict";
import {seriesId,preserveSeries,deleteSeriesChunk} from "./series-deletion";
const id="12345678-abcd-1234-abcd-123456789012";
const marker=`[Série ${id} / 2026-10-20]`;
test("identifies existing series and preserves membership when notes or dates are edited",()=>{
  assert.equal(seriesId(`Ligue\n${marker}`),id);
  assert.equal(seriesId("Réservation normale"),undefined);
  assert.equal(seriesId(`[Série autre / 2026-10-20]`),undefined);
  assert.equal(preserveSeries("Nouvelle note",marker),`Nouvelle note\n${marker}`);
  assert.equal(preserveSeries(null,marker),marker);
  assert.equal(preserveSeries(marker,null),null);
});
test("deletes Calendar first, then local storage for every confirmed session",async()=>{
  const calls:string[]=[];
  const result=await deleteSeriesChunk([{id:"a",calendarEventId:"ga"},{id:"b",calendarEventId:"gb"}],async id=>{calls.push(id);},async id=>{calls.push(id);});
  assert.deepEqual(calls,["ga","a","gb","b"]);
  assert.deepEqual(result,{deletedIds:["a","b"],complete:true});
});
test("partial failure keeps the failed and later sessions for retry",async()=>{
  const deleted:string[]=[];
  const result=await deleteSeriesChunk([{id:"a",calendarEventId:"ga"},{id:"b",calendarEventId:"gb"},{id:"c",calendarEventId:"gc"}],async id=>{if(id==="gb")throw new Error("provider");},async id=>{deleted.push(id);});
  assert.deepEqual(deleted,["a"]);assert.deepEqual(result,{deletedIds:["a"],complete:false});
});
test("already removed Google events are retry-safe after a database failure",async()=>{
  for(const code of [404,410]){
    const result=await deleteSeriesChunk([{id:"a",calendarEventId:"gone"}],async()=>{throw {code};},async()=>{});
    assert.deepEqual(result,{deletedIds:["a"],complete:true});
  }
  const result=await deleteSeriesChunk([{id:"a",calendarEventId:"ga"}],async()=>{},async()=>{throw Error("db");});
  assert.deepEqual(result,{deletedIds:[],complete:false});
});
