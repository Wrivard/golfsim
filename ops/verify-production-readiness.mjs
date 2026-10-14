/**
 * Real HTTP + PostgreSQL integration; Google is an in-memory provider fixture.
 * Run: pnpm --filter @workspace/scripts exec tsx ../ops/verify-production-readiness.mjs
 * Refuses production's database identity. Drops only its generated test schema.
 * Never sends mail, contacts the real Google API, or uses production bookings.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { databaseIdentity } from "../lib/db/src/connection.ts";

const dev = process.env.DATABASE_URL;
const production = process.env.NEON_DATABASE_URL;
if (!dev || !production || databaseIdentity(dev) === databaseIdentity(production))
  throw new Error("A separate development PostgreSQL database is required.");
const schema = `golf_readiness_${randomUUID().replaceAll("-", "")}`;
const url = new URL(dev);
url.searchParams.set("options", `-c search_path=${schema},public`);
Object.assign(process.env, {
  DATABASE_PROVIDER: "neon", NEON_DATABASE_URL: url.toString(),
  VERCEL: "1", VERCEL_ENV: "production", NODE_ENV: "production",
  SITE_URL: "https://www.golfsimsorel.ca", CALENDAR_ENABLED: "true",
  GOOGLE_CLIENT_ID: "isolated-client", GOOGLE_CLIENT_SECRET: "isolated-secret",
  SESSION_SECRET: "isolated-readiness-not-a-production-secret", CONTACT_EMAIL_ENABLED: "false",
});
const require = createRequire(new URL("../artifacts/api-server/package.json", import.meta.url));
const express = require("express");
const { google } = require("googleapis");
const stores = new Map();
let failInsert = false, failUpdate = false;
// Google responses contain absolute timestamps, not the offset-less local time
// accepted in an insert/patch request. Simulating requests as responses shifts
// bookings by four/five hours when the real synchronization code reads them.
const googleResponse = body => {
  const event = structuredClone(body);
  for (const field of ["start","end"]) {
    const local = event[field]?.dateTime;
    if (!local || /(?:Z|[+-]\d{2}:\d{2})$/.test(local)) continue;
    const stamp = Date.parse(local + "Z");
    const parts = new Intl.DateTimeFormat("en-CA", {timeZone:"America/Toronto",
      year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(new Date(stamp));
    const part = key => parts.find(p=>p.type===key).value;
    const rendered = Date.parse(`${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}Z`);
    event[field].dateTime = new Date(stamp - (rendered - stamp)).toISOString();
  }
  return event;
};
google.calendar = ({ auth }) => {
  const account = auth.credentials.access_token;
  const eventsFor = calendarId => {
    const key = `${account}|${calendarId}`;
    if (!stores.has(key)) stores.set(key, new Map());
    return stores.get(key);
  };
  return { events: {
    insert: async ({ calendarId, requestBody }) => {
      if (failInsert) { failInsert = false; throw new Error("Simulated Google insert failure"); }
      const id = randomUUID();
      eventsFor(calendarId).set(id, googleResponse({ ...requestBody, id }));
      return { data: { id } };
    },
    patch: async ({ calendarId, eventId, requestBody }) => {
      if (failUpdate) { failUpdate = false; throw new Error("Simulated Google update failure"); }
      assert.ok(eventsFor(calendarId).has(eventId));
      eventsFor(calendarId).set(eventId, googleResponse({ ...eventsFor(calendarId).get(eventId), ...requestBody, id: eventId }));
      return { data: { id: eventId } };
    },
    delete: async ({ calendarId, eventId }) => { eventsFor(calendarId).delete(eventId); return { data: {} }; },
    list: async ({ calendarId }) => ({ data: { items: [...eventsFor(calendarId).values()] } }),
  }};
};
const { db, pool } = await import("../lib/db/src/index.ts");
const { storage } = await import("../artifacts/api-server/src/storage.ts");
const { createCalendarEvent } = await import("../artifacts/api-server/src/googleCalendar.ts");
const { recordContact, listContacts } = await import("../artifacts/api-server/src/email-contacts.ts");
const { registerRoutes } = await import("../artifacts/api-server/src/routes/routes.ts");
const server = createServer();
const originalFetch = globalThis.fetch;
let base;
globalThis.fetch = (input, init) => {
  const target = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (target.origin !== base) throw new Error("External HTTP blocked in isolated integration test.");
  return originalFetch(input, init);
};
const source = "google\u001ffixture@example.com\u001fprimary";
const request = async (path, method = "GET", body, admin = true) => {
  const response = await fetch(base + path, {
    method, headers: { "Content-Type": "application/json", ...(admin ? { "X-Test-Staff": "yes" } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: response.status, data };
};
const must = async (path, method = "GET", body, status = 200) => {
  const result = await request(path, method, body);
  assert.equal(result.status, status, `${method} ${path}: ${JSON.stringify(result.data)}`);
  return result.data;
};
const bookingInput = { date: "2026-10-16", time: "08:00", duration: "1h", bayType: "1",
  players: 2, name: "Fixture Original", email: "original@example.com", phone: "", notes: "" };
const count = async () => (await pool.query("SELECT count(*)::int AS n FROM bookings")).rows[0].n;
try {
  await pool.query(`CREATE SCHEMA "${schema}"`);
  assert.equal((await pool.query("SELECT current_schema() AS s")).rows[0].s, schema);
  await pool.query(`
    CREATE TABLE bookings(id varchar PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,email text NOT NULL,
      phone text,date timestamp NOT NULL,time text NOT NULL,duration text NOT NULL,bay_type text NOT NULL,
      players int NOT NULL,notes text,calendar_event_id text,created_at timestamp NOT NULL DEFAULT now());
    CREATE TABLE oauth_tokens(id varchar PRIMARY KEY DEFAULT gen_random_uuid(),provider text NOT NULL,access_token text NOT NULL,
      refresh_token text,expires_at timestamp,scope text,token_type text DEFAULT 'Bearer',email text,
      created_at timestamp DEFAULT now(),updated_at timestamp DEFAULT now());
    CREATE TABLE calendar_settings(id varchar PRIMARY KEY DEFAULT gen_random_uuid(),sync_email text,
      calendar_id text DEFAULT 'primary',debug_mode boolean DEFAULT false,updated_at timestamp DEFAULT now());
    CREATE TABLE operating_schedule(id varchar PRIMARY KEY DEFAULT gen_random_uuid(),day_of_week int UNIQUE NOT NULL,
      open_hour int DEFAULT 8,open_minute int DEFAULT 0,last_booking_hour int DEFAULT 22,last_booking_minute int DEFAULT 0,
      close_hour int DEFAULT 23,close_minute int DEFAULT 0,updated_at timestamp DEFAULT now());
    CREATE TABLE gsim_rate_limits(key text PRIMARY KEY,hits int,expires_at timestamptz);
    CREATE TABLE gsim_runtime_state(key text PRIMARY KEY,value jsonb,updated_at timestamptz DEFAULT now());
    CREATE TABLE gsim_job_leases(name text PRIMARY KEY,owner text,expires_at timestamptz);
    INSERT INTO calendar_settings(calendar_id) VALUES('primary');
    INSERT INTO oauth_tokens(provider,access_token,email,expires_at) VALUES('google','fixture-token-A','fixture@example.com',now()+interval '1 day');
    INSERT INTO operating_schedule(day_of_week) SELECT generate_series(0,6);
  `);
  await pool.query(await readFile(new URL("./calendar-source.sql", import.meta.url), "utf8"));
  await pool.query(await readFile(new URL("./staff-improvements.sql", import.meta.url), "utf8"));
  await pool.query("UPDATE gsim_calendar_sources SET ready=true WHERE source_key=$1", [source]);
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.session = { ...(req.headers["x-test-staff"] === "yes" ? { adminId: "fixture-staff" } : {}) };
    next();
  });
  await registerRoutes(server, app);
  server.on("request", app);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  const original = (await must("/api/admin/bookings", "POST", bookingInput, 201)).booking;
  assert.ok(original.id && original.calendarEventId);
  assert.equal((await must("/api/admin/bookings")).bookings.length, 1);
  assert.equal(stores.get("fixture-token-A|primary").size, 1);
  assert.equal((await listContacts())[0].marketingConsent, false);
  console.log("PASS manual creation: HTTP, real SQL, re-read, linked Google fixture and no marketing grant");

  const beforeBatch = await count();
  assert.equal((await request("/api/book/batch", "POST", { items: [bookingInput] }, false)).status, 410);
  assert.equal(await count(), beforeBatch);
  assert.equal((await request("/api/reservations", "GET", undefined, false)).status, 401);
  await must("/api/availability?date=2026-10-16&duration=invalid","GET",undefined,400);
  const occupied = await must("/api/availability/bookings?date=2026-10-16");
  assert.equal(occupied.bookings.length, 1);
  assert.deepEqual(Object.keys(occupied.bookings[0]).sort(), ["id","simulatorId","startTime","endTime"].sort());
  assert.notEqual(occupied.bookings[0].id, original.id);
  console.log("PASS retired batch cannot insert; private list protected; public occupancy anonymized");

  const moved = (await must(`/api/admin/bookings/${original.id}`, "PUT", { bayType: "4" })).booking;
  assert.equal(moved.bayType, "4"); assert.equal(moved.time, original.time); assert.equal(moved.duration, original.duration);
  let persisted = (await pool.query("SELECT * FROM bookings WHERE id=$1",[original.id])).rows[0];
  assert.equal(persisted.bay_type, "4");
  assert.equal(stores.get("fixture-token-A|primary").get(original.calendarEventId).colorId, "11");
  await must(`/api/admin/bookings/${original.id}`, "PUT", { time: "08:01" }, 400);
  const duplicate = (await must("/api/admin/bookings", "POST", { ...bookingInput, time: "10:00", name: "Fixture Duplicate" }, 201)).booking;
  assert.notEqual(duplicate.id, original.id);
  assert.equal((await pool.query("SELECT time FROM bookings WHERE id=$1",[original.id])).rows[0].time, "08:00");
  await must(`/api/admin/bookings/${duplicate.id}`, "PUT", { time: "08:30", bayType: "4" }, 409);
  const parallel = await Promise.all([1,2].map(() => request("/api/admin/bookings","POST",{...bookingInput,time:"12:00",bayType:"2"})));
  assert.deepEqual(parallel.map(r=>r.status).sort(), [201,409]);
  console.log("PASS moves, duplicate identity/original safety, off-grid rejection, partial overlap and concurrent insert exclusion");

  const closure = {kind:"physical",startDate:"2026-10-16",endDate:"2026-10-16",
    startMinute:0,endMinute:1440,bayIds:["3"],title:"Private internal fixture title"};
  const full = (await must("/api/admin/closures","POST",closure,201)).closure;
  await must("/api/admin/bookings","POST",{...bookingInput,bayType:"3"},409);
  await must("/api/admin/closures","POST",{...closure,bayIds:["4"]},409);
  const partial = (await must("/api/admin/closures","POST",{...closure,startMinute:570,endMinute:630,bayIds:["4"]},201)).closure;
  await must("/api/admin/bookings","POST",{...bookingInput,time:"09:00",bayType:"4"},409);
  await must("/api/admin/bookings","POST",{...bookingInput,time:"10:30",bayType:"4"},201);
  const publicClosures = await must("/api/closures");
  assert.ok(publicClosures.closures.every(c=>c.title === "Fermeture"));
  assert.equal((await must("/api/admin/closures")).closures.length,2);
  await must(`/api/admin/closures/${full.id}`,"DELETE");
  await must(`/api/admin/closures/${partial.id}`,"DELETE");
  const cutoff = (await must("/api/admin/closures","POST",{...closure,kind:"online_until",
    startDate:"1900-01-01",bayIds:["1","2","3","4"]},201)).closure;
  assert.equal((await must("/api/availability/optimized?date=2026-10-16&duration=60")).slots.length,0);
  const blocked = await request("/api/book","POST",bookingInput,false);
  assert.ok(blocked.status >= 400 && blocked.status < 500);
  await must("/api/admin/bookings","POST",{...bookingInput,time:"14:00"},201);
  await must(`/api/admin/closures/${cutoff.id}`,"DELETE");
  console.log("PASS physical/full/partial closures, existing reservation protection, reopening, public cutoff with staff exception");

  const rule = {start:"2026-10-19",end:"2027-04-30",days:[1],interval:1,time:"16:00",duration:"1h",bayType:"1",
    players:4,name:"Fixture League",email:"",phone:"",notes:""};
  const preview = await must("/api/admin/bookings/recurrence-preview","POST",rule);
  assert.ok(preview.dates.length > 1 && preview.dates.every(d=>d <= "2027-04-30"));
  await must("/api/admin/bookings/recurrence-preview","POST",{...rule,end:"2027-05-01"},400);
  const seriesId = randomUUID();
  for (const date of preview.dates.slice(0,2))
    await must("/api/admin/bookings","POST",{...rule,date,seriesId,source:preview.source},201);
  console.log("PASS recurring season preview/server bounds and persisted linked sessions");

  // Imports prove provenance from the private marker, not attendees/free text.
  for (const verified of [true,false]) {
    const old = await storage.createBooking({...bookingInput,date:new Date("2026-10-20T00:00Z"),
      time:verified ? "10:00" : "12:00",email:verified?"historical@example.com":"personal@example.com"});
    const eventId = await createCalendarEvent(verified ? old : {...old,id:undefined});
    await storage.updateBookingCalendarEventId(old.id,eventId);
  }
  const history = await must("/api/admin/email-contacts/backfill-preview");
  assert.equal(history.newContacts,1); assert.ok(history.excludedBookings >= 1);
  await must("/api/admin/email-contacts/backfill","POST",{fingerprint:"0".repeat(64),confirmed:true},409);
  assert.equal((await must("/api/admin/email-contacts/backfill","POST",{fingerprint:history.fingerprint,confirmed:true})).imported,1);
  assert.equal((await must("/api/admin/email-contacts/backfill","POST",{fingerprint:history.fingerprint,confirmed:true})).imported,0);
  assert.equal((await listContacts()).some(c=>c.email==="personal@example.com"),false);
  await db.transaction(tx=>recordContact(tx,original,"site",true));
  await must("/api/admin/email-contacts/withdrawal","POST",{email:original.email,reason:"Demande directe du client fixture"});
  assert.equal((await listContacts()).find(c=>c.email===original.email).marketingConsent,false);
  await must(`/api/admin/bookings/${original.id}`,"PUT",{email:"corrected@example.com"});
  assert.ok((await listContacts()).some(c=>c.email==="corrected@example.com" && !c.marketingConsent));
  const csv = await request("/api/admin/email-contacts/export?marketingOnly=true");
  assert.equal(csv.status,200); assert.ok(!csv.data.includes("original@example.com"));
  console.log("PASS verified/idempotent backfill, stale preview rejection, attendee exclusion, staff withdrawal and corrected email capture");
  const legacy = await storage.createBooking({...bookingInput,name:"Imported duration",date:new Date("2026-10-23T00:00:00Z"),
    time:"08:01",duration:"1h30",bayType:"4",email:"legacy@example.com"});
  await storage.updateBookingCalendarEventId(legacy.id,await createCalendarEvent(legacy));
  await must(`/api/admin/bookings/${legacy.id}`,"PUT",{name:"Corrected legacy name"},200);
  await must(`/api/admin/bookings/${legacy.id}`,"PUT",{time:"08:30"},200);
  const preserved = (await pool.query("SELECT time,duration FROM bookings WHERE id=$1",[legacy.id])).rows[0];
  assert.deepEqual(preserved,{time:"08:30",duration:"1h30"});
  await must(`/api/admin/bookings/${legacy.id}`,"PUT",{time:"08:31"},400);
  console.log("PASS imported half-hour duration preserved during contact correction and half-hour move; off-grid move rejected");

  let beforeFailure = await count();
  failInsert = true;
  await must("/api/admin/bookings","POST",{...bookingInput,time:"18:00"},500);
  assert.equal(await count(),beforeFailure);
  failUpdate = true;
  await must(`/api/admin/bookings/${original.id}`,"PUT",{time:"17:00"},500);
  assert.equal((await pool.query("SELECT time FROM bookings WHERE id=$1",[original.id])).rows[0].time,"08:00");
  await pool.query(`CREATE FUNCTION reject_fixture_name() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN IF NEW.name='FAIL_SQL' THEN RAISE EXCEPTION 'Simulated SQL failure'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER fixture_failure BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION reject_fixture_name();`);
  const previousEvent = structuredClone(stores.get("fixture-token-A|primary").get(original.calendarEventId));
  await must(`/api/admin/bookings/${original.id}`,"PUT",{name:"FAIL_SQL"},500);
  assert.deepEqual(stores.get("fixture-token-A|primary").get(original.calendarEventId),previousEvent);
  console.log("PASS Google create/update failure cleanup; SQL failure restores Google fixture and preserves local booking");

  await pool.query("UPDATE oauth_tokens SET email='second@example.com',access_token='fixture-token-B'");
  const sourceB = "google\u001fsecond@example.com\u001fprimary";
  await pool.query("INSERT INTO gsim_calendar_sources(source_key,ready) VALUES($1,true)",[sourceB]);
  assert.equal((await must("/api/admin/bookings")).bookings.length,0);
  const second = (await must("/api/admin/bookings","POST",{...bookingInput,bayType:"4"},201)).booking;
  assert.notEqual(second.id,original.id);
  assert.equal(stores.get("fixture-token-B|primary").size,1);
  assert.ok(stores.get("fixture-token-A|primary").has(original.calendarEventId));
  await pool.query("UPDATE calendar_settings SET calendar_id='fixture-calendar-2'");
  await pool.query("INSERT INTO gsim_calendar_sources(source_key,ready) VALUES($1,true)",
    ["google\u001fsecond@example.com\u001ffixture-calendar-2"]);
  assert.equal((await must("/api/admin/bookings")).bookings.length,0);
  assert.equal((await must("/api/availability/optimized?date=2026-10-16&duration=60")).bookings.length,0);
  await must("/api/admin/bookings","POST",{...bookingInput,bayType:"4"},201);
  assert.equal(stores.get("fixture-token-B|primary").size,1);
  assert.equal(stores.get("fixture-token-B|fixture-calendar-2").size,1);
  const site = await request("/api/book","POST",{...bookingInput,date:"2026-10-30",
    email:"website@example.com",marketingConsent:true},false);
  assert.equal(site.status,201);
  assert.equal((await listContacts()).find(c=>c.email==="website@example.com").marketingConsent,true);
  console.log("PASS account AND selected-calendar source isolation; old events untouched; website confirmation and explicit consent persisted");
} finally {
  globalThis.fetch = originalFetch;
  if (server.listening) await new Promise(resolve=>server.close(resolve));
  await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await pool.end();
  console.log("CLEANUP: isolated schema removed; production untouched.");
}
