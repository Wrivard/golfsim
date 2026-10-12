import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import session from "express-session";
import { createServer } from "node:http";
import { databaseConnection } from "@workspace/db/connection";
import { PostgresSessionStore } from "./runtime/session-store";
import type { SqlClient } from "./runtime/sql";
import { torontoSlot } from "./calendar-time";
import { listCalendarWindow } from "./calendar-pages";
import type { calendar_v3 } from "googleapis";
import { privatePath } from "./runtime/private-paths";
import { secretMatches } from "./calendar-jobs";

test("private exports, encoded paths and environment files are denied without blocking site assets", () => {
  for (const path of ["/.local/outputs/private.pdf", "/.env", "/.env.production", "/.agents/memory/file", "/%2elocal/outputs/a.pdf", "/%252elocal/a", "/@fs/project/.local/a"]) assert.ok(privatePath(path));
  for (const path of ["/booking", "/api/auth/login", "/assets/booking.abc.js", "/opengraph.jpg"]) assert.equal(privatePath(path), false);
});
test("job/webhook secrets fail closed and use exact comparisons", () => {
  assert.equal(secretMatches(undefined, undefined), false);
  assert.equal(secretMatches("Bearer fixture-a", "Bearer fixture-b"), false);
  assert.equal(secretMatches("Bearer fixture-a", "Bearer fixture-a"), true);
});

test("preview cannot inherit production database; pooled and direct hosts are the same branch", () => {
  assert.throws(() => databaseConnection({ VERCEL_ENV: "preview", NEON_DATABASE_URL: "postgres://fixture@prod.invalid/db" }));
  assert.throws(() => databaseConnection({ VERCEL_ENV: "preview", NEON_DATABASE_URL: "postgres://fixture@ep-test.invalid/db", PREVIEW_DATABASE_URL: "postgres://fixture@ep-test-pooler.invalid/db" }));
  assert.equal(databaseConnection({ VERCEL_ENV: "preview", NEON_DATABASE_URL: "postgres://fixture@prod.invalid/db", PREVIEW_DATABASE_URL: "postgres://fixture@preview.invalid/db" }), "postgres://fixture@preview.invalid/db");
});
test("Calendar timestamps use Toronto day/hour regardless of server timezone and DST", () => {
  for (const tz of ["UTC", "America/Vancouver", "America/Toronto"]) {
    const old = process.env.TZ;
    try {
      process.env.TZ = tz;
      assert.equal(torontoSlot("2026-10-14T14:00:00Z").time, "10:00");
      assert.equal(torontoSlot("2026-11-15T14:00:00Z").time, "09:00");
      assert.equal(torontoSlot("2026-10-15T02:00:00Z").day, "2026-10-14");
      assert.equal(torontoSlot("2026-10-15T02:00:00Z").date.toISOString(), "2026-10-14T00:00:00.000Z");
    } finally { if (old === undefined) delete process.env.TZ; else process.env.TZ = old; }
  }
});
test("Calendar traverses pages; failed/repeated pages fail rather than return partial bookings", async () => {
  const tokens: (string | undefined)[] = [];
  const client = { events: { list: async ({ pageToken }: { pageToken?: string }) => {
    tokens.push(pageToken);
    return { data: pageToken ? { items: [{ id: "second" }] } : { items: [{ id: "first" }], nextPageToken: "next" } };
  } } } as unknown as calendar_v3.Calendar;
  assert.deepEqual((await listCalendarWindow(client, "fixture", "a", "b")).map(x => x.id), ["first", "second"]);
  assert.deepEqual(tokens, [undefined, "next"]);
  const failed = { events: { list: async ({ pageToken }: { pageToken?: string }) => {
    if (pageToken) throw new Error("provider failure");
    return { data: { nextPageToken: "next" } };
  } } } as unknown as calendar_v3.Calendar;
  await assert.rejects(listCalendarWindow(failed, "fixture", "a", "b"));
  const repeated = { events: { list: async () => ({ data: { nextPageToken: "same" } }) } } as unknown as calendar_v3.Calendar;
  await assert.rejects(listCalendarWindow(repeated, "fixture", "a", "b"));
});

// An isolated SQL-interface fixture, not a connection to the business database.
class SessionSql implements SqlClient {
  records = new Map<string, { data: session.SessionData; expires: Date }>();
  async query(text: string, values: unknown[] = []) {
    const id = values[0] as string;
    if (text.startsWith("INSERT")) this.records.set(id, { data: JSON.parse(values[1] as string), expires: values[2] as Date });
    if (text.startsWith("UPDATE") && this.records.has(id)) this.records.get(id)!.expires = values[1] as Date;
    if (text.startsWith("DELETE")) this.records.delete(id);
    const row = this.records.get(id);
    return { rows: text.startsWith("SELECT") && row && row.expires.getTime() > Date.now() ? [{ data: row.data }] : [] };
  }
}
test("HTTP staff session persists between separate app instances and logout invalidates both", async () => {
  const sql = new SessionSql();
  const servers = [];
  const urls: string[] = [];
  for (let i = 0; i < 2; i++) {
    const app = express();
    app.use(session({ secret: "synthetic-session-test-only-32-characters", store: new PostgresSessionStore(sql), resave: false, saveUninitialized: false }));
    app.post("/fixture-login", (req, res) => {
      req.session.regenerate(err => {
        if (err) return res.sendStatus(500);
        req.session.adminId = "synthetic-staff";
        return req.session.save(error => res.sendStatus(error ? 500 : 200));
      });
    });
    app.get("/fixture-admin", (req, res) => res.sendStatus(req.session.adminId === "synthetic-staff" ? 200 : 401));
    app.post("/fixture-logout", (req, res) => req.session.destroy(error => res.sendStatus(error ? 500 : 200)));
    const server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    servers.push(server);
    urls.push(`http://127.0.0.1:${(server.address() as { port: number }).port}`);
  }
  try {
    const response = await fetch(`${urls[0]}/fixture-login`, { method: "POST" });
    assert.equal(response.status, 200);
    const cookie = response.headers.get("set-cookie")!.split(";")[0];
    assert.equal((await fetch(`${urls[1]}/fixture-admin`, { headers: { cookie } })).status, 200);
    assert.equal((await fetch(`${urls[1]}/fixture-logout`, { method: "POST", headers: { cookie } })).status, 200);
    assert.equal((await fetch(`${urls[0]}/fixture-admin`, { headers: { cookie } })).status, 401);
  } finally {
    await Promise.all(servers.map(server => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))));
  }
});
test("expired session is not returned; SQL store failure is surfaced", async () => {
  const sql = new SessionSql(), store = new PostgresSessionStore(sql);
  const data = { cookie: { expires: new Date(Date.now() - 1000) }, adminId: "fixture" } as session.SessionData;
  await new Promise<void>((resolve, reject) => store.set("fixture", data, error => error ? reject(error) : resolve()));
  assert.equal(await new Promise((resolve, reject) => store.get("fixture", (error, value) => error ? reject(error) : resolve(value))), null);
  const failed = new PostgresSessionStore({ query: async () => { throw new Error("fixture-sql-failure"); } });
  await assert.rejects(new Promise((resolve, reject) => failed.get("fixture", (error, value) => error ? reject(error) : resolve(value))));
});
