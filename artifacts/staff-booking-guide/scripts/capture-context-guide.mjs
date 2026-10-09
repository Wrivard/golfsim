// Render the real frontend with fictional API responses in this browser only.
// No booking, login, or Calendar mutation is sent to the running backend.
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const out=path.resolve("artifacts/staff-booking-guide/public/images");
const base="http://127.0.0.1:80";
const browser=await chromium.launch({executablePath:"/repl/tools/bin/chromium",headless:true,args:["--no-sandbox"]});
const context=await browser.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:2,locale:"fr-CA",timezoneId:"America/Toronto"});
const page=await context.newPage();
const metadata={};
let signedIn=false;
let booking={id:"guide-demo",name:"Client Démo",email:"client@example.com",date:"2026-10-15T00:00:00.000Z",time:"10:00",duration:"2h",bayType:"2",players:2,notes:"Exemple fictif",calendarEventId:null};
let saved=false;
const errors=[];
page.on("pageerror",e=>errors.push(e.message));
await context.route("**/api/**",async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname;
  let data={ok:true};
  if(p==="/api/auth/session")data={authenticated:signedIn,admin:{id:"demo",username:"Personnel démo",role:"admin"}};
  else if(p==="/api/auth/login"){signedIn=true;data={ok:true};}
  else if(p==="/api/auth/logout"){signedIn=false;}
  else if(p==="/api/admin/bookings/guide-demo"&&req.method()==="PUT"){
    const input=req.postDataJSON();assert.equal(input.date,"2026-10-16");assert.equal(input.time,"14:00");
    booking={...booking,...input,date:input.date+"T00:00:00.000Z"};saved=true;data={ok:true,booking};
  }
  else if(p==="/api/admin/bookings")data={ok:true,bookings:[booking]};
  else if(p==="/api/admin/calendar-settings")data={ok:true,settings:{calendarId:"primary",debugMode:false}};
  else if(p==="/api/admin/calendar-connection")data={connected:false,configured:true};
  else if(p==="/api/admin/calendars")data={ok:true,calendars:[]};
  else if(p.startsWith("/api/schedule"))data={ok:true,schedule:Array.from({length:7},(_,dayOfWeek)=>({dayOfWeek,openHour:8,openMinute:0,lastBookingHour:21,lastBookingMinute:0,closeHour:22,closeMinute:0}))};
  else if(p==="/api/settings/debug-mode")data={debugMode:false};
  else if(p==="/api/availability/optimized"){
    const date=url.searchParams.get("date"),duration=Number(url.searchParams.get("duration")||120);
    data={ok:true,bookings:[],slots:["10:00","12:00","14:00","16:00"].map((time,i)=>({
      time:date+"T"+time+":00.000Z",assignedBayId:"2",score:100-i,availableBays:4,
      label:i===0?"Meilleur créneau":undefined,allBays:[],
    })),meta:{date,durationMinutes:duration,totalSlots:4,bestScore:100}};
  }
  else if(p==="/api/book")data={ok:true,reservation:{bayType:"2"}};
  else if(req.method()!=="GET")throw new Error("Unexpected mutation blocked in fictional screenshot session.");
  await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(data)});
});
const id=name=>page.getByTestId(name);
async function scene(name,targets={}){
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(350);
  const buffer=await page.screenshot({path:path.join(out,"context-"+name+".png"),animations:"disabled"});
  const controls={};
  for(const [key,loc]of Object.entries(targets)){
    const b=await loc.first().boundingBox();
    assert.ok(b&&b.y>=0&&b.y+b.height<=1002,`Target ${name}/${key} must be inside the scene.`);
    controls[key]={x:b.x*2,y:b.y*2,width:b.width*2,height:b.height*2};
  }
  metadata[name]={file:"context-"+name+".png",width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20),controls};
}
async function focus(loc,margin=160){
  await loc.scrollIntoViewIfNeeded();
  await page.evaluate(({top,margin})=>window.scrollBy(0,top-margin),{top:(await loc.boundingBox()).y,margin});
}
try{
  await page.goto(base+"/booking",{waitUntil:"networkidle"});
  await id("duration-120").waitFor();
  await focus(id("duration-120"),450);
  await scene("duration",{reserve:page.getByRole("link",{name:/réserver/i}).first(),duration:id("duration-120")});
  await id("duration-120").click();
  await id("button-date-picker").waitFor();await focus(id("button-date-picker"),350);
  await id("button-date-picker").click();
  const day=page.getByRole("button",{name:/15 octobre 2026/i}).first();
  await day.waitFor();
  await scene("date",{date:id("button-date-picker"),day,calendar:page.getByRole("dialog").last()});
  await day.click();await page.keyboard.press("Escape");
  const slot=page.getByRole("button",{name:/10:00/}).first();
  await slot.waitFor();
  await scene("time",{date:id("button-date-picker"),time:slot});
  await slot.click();
  await id("input-name").fill("Client Démo");await id("input-email").fill("client@example.com");
  await id("input-players").fill("2");await id("checkbox-accept-terms").check();
  await focus(page.locator("form"),220);
  await scene("details",{name:id("input-name"),email:id("input-email"),players:id("input-players"),terms:id("checkbox-accept-terms"),continue:id("button-review")});
  await id("button-review").click();
  const confirm=page.getByRole("button",{name:"Confirmer",exact:true});
  await confirm.waitFor();await focus(confirm.locator("../.."),200);
  await scene("review",{confirm});
  await confirm.click();
  const success=page.getByRole("heading",{name:/Réservation Confirmée/i});
  await success.waitFor();await focus(success.locator(".."),250);
  await scene("success",{success,bay:id("confirmed-bay"),panel:success.locator("..")});
  await page.goto(base+"/login",{waitUntil:"networkidle"});
  await scene("login",{username:id("input-username"),password:id("input-password"),login:id("button-login")});
  // Dummy credentials exist only in this isolated browser; actual staff secrets never enter screenshots.
  await id("input-username").fill("demonstration");await id("input-password").fill("demonstration");
  await id("button-login").click();
  await id("button-view-calendar").waitFor();await id("button-view-calendar").click();
  for(let i=0;i<12&&!/15 octobre/i.test(await id("button-today").innerText());i++)await id("button-next-day").click();
  const calendar=id("card-calendar-view");
  await focus(calendar,190);
  await scene("calendar",{view:id("button-view-calendar"),date:id("button-today"),next:id("button-next-day"),booking:id("booking-block-guide-demo")});
  await id("booking-block-guide-demo").click();
  await id("button-edit-booking").waitFor();
  await scene("modal",{edit:id("button-edit-booking")});
  await id("button-edit-booking").click();
  await id("input-edit-date").fill("2026-10-16");await id("input-edit-time").fill("14:00");
  await scene("edit",{date:id("input-edit-date"),time:id("input-edit-time"),duration:id("select-edit-duration"),save:id("button-save-booking")});
  await id("button-save-booking").click();await id("modal-booking-overlay").waitFor({state:"hidden"});
  await page.getByText("Réservation modifiée",{exact:true}).waitFor();
  assert.equal(saved,true);
  assert.match(await id("button-today").innerText(),/16 octobre/i);
  await id("booking-block-guide-demo").waitFor();
  await id("button-prev-day").click();
  assert.equal(await id("booking-block-guide-demo").count(),0,"Moved booking must leave its original date.");
  await id("button-next-day").click();await id("booking-block-guide-demo").waitFor();
  await scene("saved",{date:id("button-today"),booking:id("booking-block-guide-demo")});
  await id("booking-block-guide-demo").click();
  await id("button-edit-booking").click();
  assert.equal(await id("input-edit-date").inputValue(),"2026-10-16");
  assert.equal(await id("input-edit-time").inputValue(),"14:00");
  await id("button-close-modal").click();
  await page.reload({waitUntil:"networkidle"});await id("button-view-calendar").click();
  for(let i=0;i<12&&!/16 octobre/i.test(await id("button-today").innerText());i++)await id("button-next-day").click();
  await id("booking-block-guide-demo").waitFor();
  await id("button-logout").click();await id("button-login").waitFor();
  assert.equal(errors.length,0,JSON.stringify(errors));
  await fs.writeFile(path.join(out,"context-metadata.json"),JSON.stringify(metadata,null,2)+"\n");
  console.log(JSON.stringify({scenes:Object.keys(metadata).length,realFrontend:true,fictionalDataOnly:true,dateAndTimeSent:true,oldDayCleared:true,newDayVerified:true,reopenedFieldsVerified:true,reloadVerified:true,logoutVerified:true}));
}finally{await browser.close();}
