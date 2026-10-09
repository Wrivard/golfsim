// Exercise the unchanged route registration with isolated storage and Calendar adapters.
// No actual database credentials, customer records or Google API calls are used.
import { build } from "esbuild";
import express from "express";
import session from "express-session";
import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const directory=path.resolve("artifacts/api-server/node_modules/.cache");
await fs.mkdir(directory,{recursive:true});
const file=path.join(directory,"edit-route-verification.mjs");
const fakeStorage=`
export const state={booking:{id:"demo",name:"Client Demo",email:"",phone:null,date:new Date("2026-10-15T00:00:00Z"),time:"10:00",duration:"2h",bayType:"2",players:2,notes:null,calendarEventId:"event-demo"},failSave:false};
const other={id:"other",name:"Other Demo",date:new Date("2026-10-16T00:00:00Z"),time:"14:00",duration:"2h",bayType:"2",players:2};
export const storage={
 initializeDefaultSchedule:async()=>{},
 getScheduleForDay:async()=>({openHour:8,openMinute:0,lastBookingHour:21,lastBookingMinute:0,closeHour:22,closeMinute:0}),
 getBooking:async id=>id==="demo"?structuredClone(state.booking):undefined,
 getAllBookings:async()=>[structuredClone(state.booking)],
 updateBookingWithConflictCheck:async(id,updates,check,before)=>{
   const current=structuredClone(state.booking),next={...current,...updates};
   const records=[current,other].filter(r=>r.date.toISOString().slice(0,10)===next.date.toISOString().slice(0,10));
   if(check(records,current))return {booking:null,conflict:true};
   await before(next,current);
   if(state.failSave){state.failSave=false;throw new Error("Simulated commit failure");}
   state.booking=next;return {booking:structuredClone(next),conflict:false};
 },
 getAdminById:async()=>({id:"fictional-admin",username:"fixture",role:"admin"})
};`;
const fakeCalendar=`
export const calendarState={patches:[],fail:false};
export async function updateCalendarEvent(id,booking){
 if(calendarState.fail){calendarState.fail=false;throw new Error("Simulated Calendar failure");}
 calendarState.patches.push({id,date:booking.date.toISOString().slice(0,10),time:booking.time});
}
export const createCalendarEvent=async()=>"fixture-event";
export const deleteCalendarEvent=async()=>{};
export const getCalendarConnectionStatus=async()=>({connected:false,configured:false});
export const getGoogleAuthUrl=()=>""; export const generateOAuthState=()=>"fixture";
export const exchangeCodeForTokens=async()=>({}); export const revokeGoogleAccess=async()=>{};
export const getRedirectUri=()=>""; export const listCalendars=async()=>[];
export const syncCalendarToDatabase=async()=>({imported:0,updated:0,deleted:0,errors:0});
export const setupCalendarWatch=async()=>null; export const getActiveWatchChannelId=()=>null;
export const getWatchToken=()=>"";`;
await build({
 stdin:{contents:'export {registerRoutes} from "./artifacts/api-server/src/routes/routes.ts"; export {state} from "fixture-storage"; export {calendarState} from "fixture-calendar";',resolveDir:process.cwd()},
 outfile:file,bundle:true,platform:"node",format:"esm",packages:"external",logLevel:"silent",
 plugins:[{name:"isolated-adapters",setup(b){
   b.onResolve({filter:/^(fixture-storage|\.\.\/storage)$/},()=>({path:"storage",namespace:"fixture"}));
   b.onResolve({filter:/^(fixture-calendar|\.\.\/googleCalendar)$/},()=>({path:"calendar",namespace:"fixture"}));
   b.onLoad({filter:/.*/,namespace:"fixture"},args=>({contents:args.path==="storage"?fakeStorage:fakeCalendar,loader:"js"}));
 }}],
});
const {registerRoutes,state,calendarState}=await import(pathToFileURL(file).href);
const app=express();app.use(express.json());app.use(session({secret:"fictional-test-session",resave:false,saveUninitialized:false}));
app.post("/test-session",(req,res)=>{req.session.adminId="fictional-admin";res.json({ok:true});});
const server=createServer(app);
await registerRoutes(server,app);
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let cookie="";
async function request(body,authenticated=true){
 const r=await fetch(base+"/api/admin/bookings/demo",{method:"PUT",headers:{"Content-Type":"application/json",...(authenticated?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 return {status:r.status,data:await r.json()};
}
try{
 assert.equal((await request({date:"2026-10-16"},false)).status,401);
 const login=await fetch(base+"/test-session",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
 cookie=login.headers.get("set-cookie").split(";")[0];
 assert.equal((await request({date:"2026-02-30"})).status,400);
 assert.equal((await request({date:"2026-10-16",time:"14:00"})).status,409);
 assert.equal(state.booking.date.toISOString().slice(0,10),"2026-10-15");assert.equal(calendarState.patches.length,0);
 const changed=await request({date:"2026-10-16",time:"12:00"});
 assert.equal(changed.status,200);assert.equal(changed.data.booking.id,"demo");assert.equal(changed.data.booking.time,"12:00");
 assert.equal(changed.data.booking.date,"2026-10-16T00:00:00.000Z");
 assert.deepEqual(calendarState.patches.at(-1),{id:"event-demo",date:"2026-10-16",time:"12:00"});
 assert.equal((await request({time:"25:00"})).status,400);
 assert.equal((await request({time:"21:30"})).status,409);
 calendarState.fail=true;
 assert.equal((await request({time:"18:00"})).status,500);assert.equal(state.booking.time,"12:00");
 state.failSave=true;
 assert.equal((await request({time:"16:00"})).status,500);assert.equal(state.booking.time,"12:00");
 assert.equal(calendarState.patches.at(-1).time,"12:00","Restore Calendar after failed database commit.");
 console.log(JSON.stringify({actualRoutesVerified:true,isolatedAdapters:true,authRequired:true,datePersisted:true,timePersisted:true,identityPreserved:true,conflictsRejected:true,calendarPatched:true,calendarFailureKeepsOriginal:true,commitFailureRestoresCalendar:true}));
 await new Promise(resolve=>server.close(resolve));await fs.unlink(file);process.exit(0);
}catch(error){
 console.error(error.message);await fs.unlink(file).catch(()=>{});process.exit(1);
}
