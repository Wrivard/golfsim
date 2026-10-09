// Render the existing admin interface with browser-only fixtures.
// Never sign in to, read bookings from, or mutate the real backend.
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const out=path.resolve("artifacts/staff-booking-guide/public/images");
const ranges=[
 ["1",8,10],["1",10,11],["1",12,14],["1",14,16],
 ["2",8,10],["2",10,12],["2",14,16],["2",16,18],
 ["3",8,10],["3",10,13],["3",15,17],["3",17,19],
 ["4",8,9],["4",9,11],["4",11,13],["4",13,15],["4",15,17],
];
const bookings=ranges.map(([bay,start,end],i)=>({
 id:`gaps-${bay}-${start}`,name:`Groupe ${String.fromCharCode(65+i)}`,
 email:"demo@example.com",date:"2026-10-15T00:00:00.000Z",
 time:`${String(start).padStart(2,"0")}:00`,duration:`${end-start}h`,
 bayType:bay,players:2,notes:"Exemple fictif",calendarEventId:null,
}));
const browser=await chromium.launch({executablePath:"/repl/tools/bin/chromium",headless:true,args:["--no-sandbox"]});
const context=await browser.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:2,locale:"fr-CA",timezoneId:"America/Toronto"});
const page=await context.newPage(),errors=[];
page.on("pageerror",e=>errors.push(e.message));
await context.route("**/api/**",async route=>{
 const req=route.request(),p=new URL(req.url()).pathname;
 assert.equal(req.method(),"GET","No mutations allowed for this capture.");
 let data={ok:true};
 if(p==="/api/auth/session")data={authenticated:true,admin:{id:"demo",username:"Personnel démo",role:"admin"}};
 else if(p==="/api/admin/bookings")data={ok:true,bookings};
 else if(p==="/api/admin/calendar-settings")data={ok:true,settings:{calendarId:"primary",debugMode:false}};
 else if(p==="/api/admin/calendar-connection")data={connected:false,configured:true};
 else if(p==="/api/admin/calendars")data={ok:true,calendars:[]};
 else if(p.startsWith("/api/schedule"))data={ok:true,schedule:Array.from({length:7},(_,dayOfWeek)=>({dayOfWeek,openHour:8,openMinute:0,lastBookingHour:21,lastBookingMinute:0,closeHour:22,closeMinute:0}))};
 else if(p==="/api/settings/debug-mode")data={debugMode:false};
 await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(data)});
});
const id=name=>page.getByTestId(name);
try{
 await page.goto("http://127.0.0.1:80/admin",{waitUntil:"networkidle"});
 await id("button-view-calendar").click();
 for(let i=0;i<15&&!/15 octobre/i.test(await id("button-today").innerText());i++)await id("button-next-day").click();
 assert.match(await id("button-today").innerText(),/15 octobre/i);
 await id("booking-block-gaps-2-10").waitFor();
 const card=id("card-calendar-view");
 await card.scrollIntoViewIfNeeded();
 await page.evaluate(top=>window.scrollBy(0,top-190),(await card.boundingBox()).y);
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(300);
 const controls={};
 async function box(loc){const b=await loc.boundingBox();assert.ok(b);return b;}
 const date=await box(id("button-today"));
 controls.date={x:date.x*2,y:date.y*2,width:date.width*2,height:date.height*2};
 for(const [key,bay,before,after,hours] of [
   ["gapTwo","2",10,14,2],["gapOther","3",10,15,2],["gapShort","1",10,12,1],
 ]){
   const a=await box(id(`booking-block-gaps-${bay}-${before}`)),b=await box(id(`booking-block-gaps-${bay}-${after}`));
   const top=a.y+a.height,bottom=b.y;
   assert.ok(top>0&&bottom<1000&&bottom>top);
   controls[key]={x:a.x*2,y:top*2,width:a.width*2,height:(bottom-top)*2};
   // Confirm the blank span really is continuous and the expected duration.
   assert.ok(Math.abs((bottom-top)/a.height*(ranges.find(r=>r[0]===bay&&r[1]===before)[2]-before)-hours)<0.01);
 }
 await page.screenshot({path:path.join(out,"context-calendar-gaps.png"),animations:"disabled"});
 assert.equal(errors.length,0,JSON.stringify(errors));
 const file=path.join(out,"context-metadata.json");
 const metadata=JSON.parse(await fs.readFile(file,"utf8"));
 metadata["calendar-gaps"]={file:"context-calendar-gaps.png",width:2560,height:2000,controls};
 await fs.writeFile(file,JSON.stringify(metadata,null,2)+"\n");
 console.log("Captured real admin UI with 17 fictional bookings and verified 1-hour/2-hour gaps. No real API data accessed.");
}finally{await browser.close();}
