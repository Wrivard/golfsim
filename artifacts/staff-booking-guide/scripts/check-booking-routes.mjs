import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base="http://127.0.0.1:4300";
const finish=process.argv.includes("--finish");
const results=finish?JSON.parse(await fs.readFile("artifacts/staff-booking-guide/docs/booking-route-checks.json","utf8")).results:[];
const observations=[];
let cookie="";
async function api(path,method="GET",body,auth=true){
  const response=await fetch(base+path,{method,headers:{
    ...(method!=="GET"?{"content-type":"application/json"}:{}),...(auth&&cookie?{cookie}:{})},
    ...(body?{body:JSON.stringify(body)}:{})});
  const text=await response.text();
  let data;try{data=JSON.parse(text)}catch{data=null}
  return {status:response.status,data,response};
}
async function check(name,fn){
  const index=results.findIndex(r=>r.name===name);
  if(finish && index>=0 && results[index].pass && name!=="Normal staff login with fixture credentials")return;
  let result;
  try{await fn();result={name,pass:true}}catch(error){result={name,pass:false,error:error.message}}
  if(index>=0)results[index]=result;else results.push(result);
}
const day="2026-10-22";
const payload={name:"Test isolé",date:day,time:"14:00",duration:"1h",bayType:"1",players:2};
await check("Staff data requires an authenticated session",async()=>{
  assert.equal((await api("/api/admin/bookings","GET",undefined,false)).status,401);
});
await check("Normal staff login with fixture credentials",async()=>{
  const credentials=JSON.parse(await fs.readFile("/tmp/gsim-guide-login.json","utf8"));
  const login=await api("/api/auth/login","POST",credentials,false);
  assert.equal(login.status,200);
  cookie=login.response.headers.get("set-cookie").split(";")[0];
});
await check("Invalid staff player count is rejected",async()=>{
  assert.equal((await api("/api/admin/bookings","POST",{...payload,players:0})).status,400);
});
await check("Staff sessions ending after 22h are rejected",async()=>{
  assert.equal((await api("/api/admin/bookings","POST",{...payload,time:"21:30",duration:"2h"})).status,400);
});
await check("Invalid staff email is rejected",async()=>{
  assert.equal((await api("/api/admin/bookings","POST",{...payload,email:"invalid"})).status,400);
});
let firstId;
await check("Staff creation permits omitted email and phone",async()=>{
  const r=await api("/api/admin/bookings","POST",payload);
  assert.equal(r.status,201);assert.equal(r.data.ok,true);firstId=r.data.booking.id;
  assert.match(r.data.booking.calendarEventId,/^training-/);
});
await check("An overlapping same-bay booking is rejected",async()=>{
  assert.equal((await api("/api/admin/bookings","POST",{...payload,time:"14:30"})).status,409);
});
await check("The same hour in a different bay is permitted",async()=>{
  assert.equal((await api("/api/admin/bookings","POST",{...payload,bayType:"2"})).status,201);
});
await check("Concurrent same-bay submissions cannot double-book",async()=>{
  const requests=await Promise.all([
    api("/api/admin/bookings","POST",{...payload,time:"16:00",bayType:"3",name:"Test concurrence A"}),
    api("/api/admin/bookings","POST",{...payload,time:"16:00",bayType:"3",name:"Test concurrence B"})
  ]);
  assert.deepEqual(requests.map(r=>r.status).sort(),[201,409]);
});
await check("Staff can update an isolated reservation",async()=>{
  assert.ok(firstId);
  const r=await api("/api/admin/bookings/"+firstId,"PUT",{...payload,name:"Test isolé modifié"});
  assert.equal(r.status,200);
  const all=await api("/api/admin/bookings");
  assert.equal(all.data.bookings.find(b=>b.id===firstId).name,"Test isolé modifié");
});
await check("Staff deletion removes the isolated database record",async()=>{
  assert.ok(firstId);
  assert.equal((await api("/api/admin/bookings/"+firstId,"DELETE")).status,200);
  const all=await api("/api/admin/bookings");
  assert.equal(all.data.bookings.some(b=>b.id===firstId),false);
});
await check("Client booking requires a valid email",async()=>{
  const r=await api("/api/book","POST",{...payload,email:"invalid"},false);
  assert.ok(r.status>=400);
  if(r.status!==400 || !r.data)observations.push({severity:"medium",finding:"Invalid public booking payload is rejected, but its error response is not the expected JSON 400.",actualStatus:r.status,jsonBody:Boolean(r.data)});
});
await check("Public availability is accessible without staff sign-in",async()=>{
  const r=await api("/api/availability/optimized?date="+day+"&duration=120","GET",undefined,false);
  assert.equal(r.status,200);assert.equal(r.data.ok,true);assert.ok(Array.isArray(r.data.slots));
});
await check("Confirmed privacy finding: unauthenticated reservations endpoint returns full sample contact data",async()=>{
  const r=await api("/api/reservations","GET",undefined,false);
  assert.equal(r.status,200);
  assert.ok(r.data.reservations.some(b=>b.email==="client@example.com"&&b.name==="Client Démo"));
});
await check("Logout removes staff access",async()=>{
  assert.equal((await api("/api/auth/logout","POST")).status,200);
  assert.equal((await api("/api/admin/bookings")).status,401);
});
const report={method:"Actual routes, validation, session authentication and DatabaseStorage against an isolated PostgreSQL database; Calendar replaced by a no-network fixture.",results,observations,passed:results.filter(r=>r.pass).length,total:results.length};
await fs.writeFile("artifacts/staff-booking-guide/docs/booking-route-checks.json",JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.passed!==report.total)process.exitCode=1;
