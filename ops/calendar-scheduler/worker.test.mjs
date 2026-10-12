import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import worker, { runCalendarTick } from "./worker.mjs";

const env = {
  SCHEDULER_ENABLED: "true",
  SITE_ORIGIN: "https://scheduler-fixture.example.invalid",
  CRON_SECRET: "synthetic-fixture-not-a-real-secret-12345",
};
const reply = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json" },
});

test("Hobby deployment has no native frequent cron; the external schedule starts disabled", async () => {
  const vercel = JSON.parse(await readFile(new URL("../../vercel.json", import.meta.url), "utf8"));
  const scheduler = JSON.parse(await readFile(new URL("./wrangler.json", import.meta.url), "utf8"));
  assert.equal(vercel.crons, undefined);
  assert.deepEqual(scheduler.triggers.crons, ["*/5 * * * *"]);
  assert.equal(scheduler.vars.SCHEDULER_ENABLED, "false");
  assert.equal(scheduler.workers_dev, false);
  assert.equal(scheduler.preview_urls, false);
});

test("disabled scheduler makes no outbound requests", async () => {
  const result = await runCalendarTick({ SCHEDULER_ENABLED: "false" }, () => assert.fail("Unexpected request"));
  assert.deepEqual(result, { disabled: true });
});

test("active tick uses a private header, refuses redirects and awaits the response", async () => {
  const result = await runCalendarTick(env, async (url, options) => {
    assert.equal(url, `${env.SITE_ORIGIN}/api/jobs/calendar`);
    assert.equal(options.method, "GET");
    assert.equal(options.headers.Authorization, `Bearer ${env.CRON_SECRET}`);
    assert.equal(options.redirect, "manual");
    assert.equal(options.signal.aborted, false);
    assert.equal(url.includes(env.CRON_SECRET), false);
    return reply({ ok: true, skipped: false });
  });
  assert.deepEqual(result, { ok: true, skipped: false });
});

test("shared-lease overlap is an accepted skipped tick", async () => {
  assert.deepEqual(await runCalendarTick(env, async () => reply({ ok: true, skipped: true })), { ok: true, skipped: true });
});

test("invalid origins and secrets fail before sending anything", async () => {
  for (const origin of ["http://example.invalid", "https://user:pass@example.invalid", "https://example.invalid/path", "https://example.invalid/?q=x", "invalid"]) {
    await assert.rejects(runCalendarTick({ ...env, SITE_ORIGIN: origin }, () => assert.fail("Unexpected request")), /HTTPS site origin/);
  }
  await assert.rejects(runCalendarTick({ ...env, CRON_SECRET: "short" }), /job secret/);
  await assert.rejects(runCalendarTick({ ...env, CRON_SECRET: `${env.CRON_SECRET}\n` }), /job secret/);
});

test("authentication failures, provider errors and redirects are reported as failures", async () => {
  for (const status of [301, 401, 503]) {
    await assert.rejects(runCalendarTick(env, async () => reply({ ok: false }, status)), new RegExp(`HTTP ${status}`));
  }
});

test("disabled Calendar, rejected work and malformed responses never count as successful sync", async () => {
  for (const body of [{ ok: true, disabled: true }, { ok: false }, null]) {
    await assert.rejects(runCalendarTick(env, async () => reply(body)), /active maintenance/);
  }
  await assert.rejects(runCalendarTick(env, async () => new Response("not JSON")), /invalid response/);
  await assert.rejects(runCalendarTick(env, async () => { throw new Error(`fixture ${env.CRON_SECRET}`); }), error => {
    assert.equal(error.message.includes(env.CRON_SECRET), false);
    return /could not be reached/.test(error.message);
  });
});

test("scheduled handler does not finish before the protected job completes", async t => {
  let complete;
  t.mock.method(globalThis, "fetch", () => new Promise(resolve => { complete = resolve; }));
  let finished = false;
  const pending = worker.scheduled({}, env).then(() => { finished = true; });
  await Promise.resolve();
  assert.equal(finished, false);
  complete(reply({ ok: true }));
  await pending;
  assert.equal(finished, true);
});
