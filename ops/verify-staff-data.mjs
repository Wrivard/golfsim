/**
 * Real PostgreSQL checks in an isolated development schema only.
 * Run: pnpm --filter @workspace/scripts exec tsx ../ops/verify-staff-data.mjs
 * Never uses Neon production, Google, Resend or any real booking/contact.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { databaseIdentity } from "../lib/db/src/connection.ts";

const dev = process.env.DATABASE_URL;
const production = process.env.NEON_DATABASE_URL;
if (!dev || !production || databaseIdentity(dev) === databaseIdentity(production))
  throw new Error("A separate development PostgreSQL database is required.");

const schema = `staff_checks_${randomUUID().replaceAll("-", "")}`;
const url = new URL(dev);
url.searchParams.set("options", `-c search_path=${schema},public`);
process.env.DATABASE_PROVIDER = "neon";
process.env.NEON_DATABASE_URL = url.toString();
delete process.env.VERCEL_ENV;
delete process.env.VERCEL;
process.env.SITE_URL = "https://www.golfsimsorel.ca";
process.env.SESSION_SECRET = "isolated-staff-test-key-not-a-production-secret";

const { db, pool } = await import("../lib/db/src/index.ts");
const { recordContact, listContacts, unsubscribeLink, withdrawConsent, csvContacts } =
  await import("../artifacts/api-server/src/email-contacts.ts");

try {
  await pool.query(`CREATE SCHEMA "${schema}"`);
  await pool.query(await readFile(new URL("./staff-improvements.sql", import.meta.url), "utf8"));
  const booking = { id: "test-booking", email: "TEST@example.com", name: "Client de test" };
  await db.transaction(tx => recordContact(tx, booking, "site", false));
  let contacts = await listContacts();
  assert.equal(contacts.length, 1);
  assert.equal(contacts[0].email, "test@example.com");
  assert.equal(contacts[0].marketingConsent, false);
  assert.equal(unsubscribeLink(contacts[0]), null);
  assert.ok(!csvContacts(contacts, true).includes("test@example.com"));
  await db.transaction(tx => recordContact(tx, booking, "site", true));
  contacts = await listContacts();
  assert.equal(contacts.length, 1);
  assert.ok(contacts[0].consentAt);
  assert.ok(contacts[0].consentEvidence?.includes(booking.id));
  const token = new URL(unsubscribeLink(contacts[0])).hash.slice("#token=".length);
  assert.equal(await withdrawConsent(token.slice(0, -3) + "bad"), false);
  await db.transaction(tx => recordContact(tx, booking, "personnel", false));
  assert.equal((await listContacts())[0].marketingConsent, true);
  assert.equal(await withdrawConsent(token), true);
  assert.equal(await withdrawConsent(token), true);
  contacts = await listContacts();
  assert.equal(contacts[0].marketingConsent, false);
  assert.ok(contacts[0].withdrawnAt);
  assert.equal(unsubscribeLink(contacts[0]), null);
  await db.transaction(tx => recordContact(tx, booking, "personnel", false));
  assert.equal((await listContacts())[0].marketingConsent, false);
  await new Promise(resolve => setTimeout(resolve, 5));
  await db.transaction(tx => recordContact(tx, booking, "site", true));
  assert.equal((await listContacts())[0].withdrawnAt, null);
  assert.equal(await withdrawConsent(token), false);
  const latestToken = new URL(unsubscribeLink((await listContacts())[0])).hash.slice("#token=".length);
  assert.equal(await withdrawConsent(latestToken), true);
  const audit = await pool.query("SELECT action FROM gsim_email_consent_events ORDER BY created_at");
  assert.deepEqual(audit.rows.map(row => row.action), ["granted", "withdrawn", "granted", "withdrawn"]);
  await assert.rejects(pool.query(
    "INSERT INTO gsim_availability_closures(kind,start_date,end_date,start_minute,end_minute,bay_ids,title) VALUES('physical','2026-10-14','2026-10-14',600,500,ARRAY['1'],'test')",
  ));
  console.log("PASS: isolated SQL migration, deduplication, explicit grants, staff preservation, withdrawal, regrant, audit and range constraints.");
} finally {
  await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await pool.end();
}
