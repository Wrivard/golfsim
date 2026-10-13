import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { pool } from "./db";
import { PgDialect } from "drizzle-orm/pg-core";
import { activeCalendarSource, bookingSourceFilter, sourceReady, withCalendarSource, markSourcePending, markSourceReady } from "./calendar-source";

test("bookings are scoped to the current pair; unavailable/disconnected sources never look free", async () => {
  let key: string | null = "account-A/calendar-A";
  let ready = true;
  const query = mock.method(pool, "query", (async (text: string) => {
    if (text.includes("FROM oauth_tokens")) return { rows:key ? [{source:key}] : [] };
    if (text.includes("SELECT ready")) return { rows:[{ready}] };
    return { rows:[] };
  }) as any);
  try {
    const dialect = new PgDialect();
    const a = dialect.sqlToQuery(await bookingSourceFilter());
    assert.ok(a.sql.includes("gsim_booking_sources"));
    assert.deepEqual(a.params, ["account-A/calendar-A"]);
    key = "account-B/calendar-B";
    const b = dialect.sqlToQuery(await bookingSourceFilter());
    assert.deepEqual(b.params, ["account-B/calendar-B"]);
    key = "account-A/calendar-A";
    assert.deepEqual(dialect.sqlToQuery(await bookingSourceFilter()).params, a.params);
    ready = false;
    await assert.rejects(bookingSourceFilter, /synchronisé/);
    key = null;
    assert.equal(await sourceReady(), false);
    await assert.rejects(activeCalendarSource);
  } finally { query.mock.restore(); }
});

test("source lock survives nested sync, fails closed on contention and releases on error", async () => {
  const commands: string[] = [];
  let locked = true, releases = 0, ran = false;
  const connect = mock.method(pool, "connect", (async () => ({
    query: async (text: string) => { commands.push(text); return {rows:[{locked}]}; },
    release: () => { releases++; },
  })) as any);
  try {
    await withCalendarSource(async () => {
      await withCalendarSource(async () => { ran = true; }, true);
    });
    assert.equal(ran, true);
    assert.equal(commands.filter(c=>c==="BEGIN").length,1);
    assert.equal(releases,1);
    locked = false; ran = false;
    await assert.rejects(withCalendarSource(async () => { ran=true; }, false, 0), /mise à jour/);
    assert.equal(ran,false);
    locked=true;
    await assert.rejects(withCalendarSource(async () => { throw new Error("fixture"); }));
    assert.equal(releases,3);
    assert.equal(commands.at(-1),"ROLLBACK");
  } finally { connect.mock.restore(); }
});
