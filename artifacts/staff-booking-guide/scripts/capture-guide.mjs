// Screenshot the unchanged application through a disconnected training gateway.
// Never point this script at the live preview or published site.
import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const base = "http://127.0.0.1:4300";
const out = path.resolve("artifacts/staff-booking-guide/public/images");
await fs.mkdir(out,{recursive:true});
const browser = await chromium.launch({executablePath:"/repl/tools/bin/chromium",headless:true,args:["--no-sandbox"]});
const context = await browser.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:2,locale:"fr-CA",timezoneId:"America/Toronto"});
const page = await context.newPage();
const detailsOnly = process.argv.includes("--details-only");
const adminOnly = process.argv.includes("--admin-only") || detailsOnly;
const metadata = adminOnly ? JSON.parse(await fs.readFile(path.join(out,"capture-metadata.json"),"utf8")) : {};
const results = adminOnly ? JSON.parse(await fs.readFile(path.join(out,"capture-results.json"),"utf8")).results : [];
const errors = [];
page.on("pageerror",error=>errors.push(error.message));
page.on("request",req=>{
  if(["POST","PUT","PATCH","DELETE"].includes(req.method()) && !req.url().startsWith(base))
    throw new Error("Refusing a mutation outside the isolated training gateway.");
});
const testid = id => page.getByTestId(id);
async function capture(name,region,keys={},clipOverride) {
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(300);
  let origin, data;
  if(region) {
    await region.scrollIntoViewIfNeeded();
    if(clipOverride) {
      const b = await region.boundingBox();
      origin={x:b.x,y:b.y,...clipOverride};
      data=await page.screenshot({path:path.join(out,name+".png"),clip:origin,animations:"disabled"});
    } else {
      data=await region.screenshot({path:path.join(out,name+".png"),animations:"disabled"});
      origin=await region.boundingBox();
    }
  } else {
    origin={x:0,y:0,width:1280,height:1000};
    data=await page.screenshot({path:path.join(out,name+".png"),animations:"disabled"});
  }
  const width=data.readUInt32BE(16),height=data.readUInt32BE(20);
  const scale=width/origin.width, controls={};
  for(const [key,loc] of Object.entries(keys)) {
    if(await loc.count()){
      const b=await loc.first().boundingBox();
      if(b)controls[key]={x:(b.x-origin.x)*scale,y:(b.y-origin.y)*scale,width:b.width*scale,height:b.height*scale};
    }
  }
  metadata[name]={file:name+".png",width,height,origin,controls};
  await fs.writeFile(path.join(out,"capture-metadata.json"),JSON.stringify(metadata,null,2));
  console.log("Saved",name,width,height);
}
try {
  if(!adminOnly) {
  await page.goto(base,{waitUntil:"networkidle"});
  const reserve=page.getByRole("link",{name:/réserver/i}).first();
  await capture("client-home",null,{reserve});
  await reserve.click();
  await testid("duration-120").waitFor();
  const durations=testid("duration-120").locator("../..");
  await capture("client-duration",durations,{duration:testid("duration-120")});
  await testid("duration-120").click();
  await testid("button-date-picker").click();
  const picker=page.getByRole("dialog").last();
  await picker.waitFor();
  const day=picker.getByRole("button",{name:/15 octobre 2026/i});
  const actualDay=await day.count()?day.first():picker.getByRole("button",{name:"15",exact:true}).first();
  await capture("client-date",picker,{day:actualDay});
  await actualDay.click();
  await page.keyboard.press("Escape");
  await testid("button-date-picker").waitFor();
  assert.match(await testid("button-date-picker").innerText(),/15/);
  const slot=page.getByRole("button",{name:/10:00/}).first();
  await slot.waitFor();
  await capture("client-time",testid("button-date-picker").locator("../.."),{date:testid("button-date-picker"),time:slot});
  await slot.click();
  await testid("input-name").fill("Client Démo");
  await testid("input-email").fill("client@example.com");
  const players=testid("input-players");
  if((await players.evaluate(el=>el.tagName))==="SELECT")await players.selectOption("2");else await players.fill("2");
  await testid("input-notes").fill("Démonstration personnel");
  await testid("button-review").click();
  assert.equal(await testid("checkbox-accept-terms").isVisible(),true);
  results.push("Client: acceptance of terms is mandatory; review without acceptance stays on details.");
  await testid("checkbox-accept-terms").check();
  await capture("client-details",page.locator("form"),{
    name:testid("input-name"),email:testid("input-email"),phone:testid("input-phone"),players,
    notes:testid("input-notes"),terms:testid("checkbox-accept-terms"),continue:testid("button-review")});
  await testid("button-review").click();
  const confirm=page.getByRole("button",{name:"Confirmer",exact:true});
  await confirm.waitFor();
  await capture("client-review",confirm.locator("../.."),{confirm,back:page.getByRole("button",{name:"Retour",exact:true}).last()});
  await confirm.click();
  const success=page.getByRole("heading",{name:/Réservation Confirmée/i});
  await success.waitFor();
  await capture("client-success",success.locator(".."),{success,bay:testid("confirmed-bay")});
  results.push("Client: 2026-10-15, 10:00, 2h, Client Démo, 2 players; real /api/book request succeeded in scratch database.");
  results.push("Client final bay: "+await testid("confirmed-bay").innerText());
  }

  // Authenticate normally against the scratch database, never bypass auth.
  await page.goto(base+"/login",{waitUntil:"networkidle"});
  const credentials=JSON.parse(await fs.readFile("/tmp/gsim-guide-login.json","utf8"));
  await testid("input-username").fill(credentials.username);
  await testid("input-password").fill(credentials.password);
  await capture("staff-login",page.locator("form").locator(".."),{
    username:testid("input-username"),password:testid("input-password"),login:testid("button-login")});
  await testid("button-login").click();
  await testid("button-view-calendar").waitFor();
  await testid("button-view-calendar").click();
  await testid("card-calendar-view").waitFor();
  for(let i=0;i<12;i++){
    const label=await testid("button-today").innerText();
    if(label.toLowerCase().includes("15 octobre"))break;
    await testid("button-next-day").click();
  }
  assert.match(await testid("button-today").innerText(),/15 octobre/i);
  const calendar=testid("card-calendar-view");
  const add=calendar.getByRole("button",{name:"Ajouter",exact:true});
  if(!detailsOnly) {
  await capture("staff-calendar",calendar,{
    previous:testid("button-prev-day"),date:testid("button-today"),next:testid("button-next-day"),add
  },{width:(await calendar.boundingBox()).width,height:500});
  await add.click();
  const dialog=page.getByRole("dialog");
  await dialog.waitFor();
  async function select(id,label){
    const loc=page.locator("#"+id);
    if(await loc.evaluate(el=>el.tagName==="SELECT"))await loc.selectOption({label});
    else{await loc.click();await page.getByRole("option",{name:label,exact:true}).click();}
  }
  await page.locator("#staff-date").fill("2026-10-15");
  await select("staff-duration","1h");
  await select("staff-bay","Baie 2");
  await select("staff-time","12:00");
  await select("staff-players","2");
  await capture("staff-open-dialog",dialog,{
    date:page.locator("#staff-date"),time:page.locator("#staff-time"),duration:page.locator("#staff-duration"),
    bay:page.locator("#staff-bay"),players:page.locator("#staff-players")});
  await page.locator("#staff-name").fill("Réservation Démo");
  await page.locator("#staff-notes").fill("Exemple pour le personnel");
  const save=dialog.getByRole("button",{name:"Ajouter la réservation",exact:true});
  await capture("staff-form",dialog,{
    date:page.locator("#staff-date"),time:page.locator("#staff-time"),duration:page.locator("#staff-duration"),
    bay:page.locator("#staff-bay"),players:page.locator("#staff-players"),name:page.locator("#staff-name"),
    email:page.locator("#staff-email"),phone:page.locator("#staff-phone"),notes:page.locator("#staff-notes"),save});
  await save.click();
  await dialog.waitFor({state:"hidden"});
  }
  const bookingBlock=calendar.getByText("Réservation Démo",{exact:true});
  await bookingBlock.waitFor();
  await capture("staff-saved",calendar,{booking:bookingBlock},{
    width:(await calendar.boundingBox()).width,height:630});
  await bookingBlock.click();
  await testid("text-modal-name").waitFor();
  const details=testid("modal-booking-overlay").locator(":scope > .relative");
  await capture("staff-details",details,{
    name:testid("text-modal-name"),edit:testid("button-edit-booking"),remove:testid("button-delete-booking"),
    close:testid("button-close-modal")});
  await testid("button-delete-booking").click();
  await capture("staff-cancel-confirm",details,{
    confirmDelete:testid("button-confirm-delete-booking"),close:testid("button-close-modal")});
  await testid("button-close-modal").click();
  await capture("staff-logout",page.locator("header"),{logout:testid("button-logout")});
  await testid("button-logout").click();
  await testid("button-login").waitFor();
  results.push("Admin: normal login, day navigation, Ajouter dialog, creation with optional email/phone blank, 1h at 12:00 in bay 2, calendar block/details, double-confirmation cancellation UI, logout verified.");
  results.push("No actual cancellation performed in screenshot flow. All data was isolated fictional data.");
  await fs.writeFile(path.join(out,"capture-results.json"),JSON.stringify({results,errors},null,2));
  console.log(JSON.stringify({results,errors},null,2));
} catch(error) {
  await page.screenshot({path:"/tmp/staff-guide-capture-error.png"});
  console.error(error.message);
  console.error((await page.locator("body").innerText()).slice(0,2400));
  await fs.writeFile(path.join(out,"capture-results.json"),JSON.stringify({results,errors,error:error.message},null,2));
  process.exitCode=1;
} finally {await browser.close();}
