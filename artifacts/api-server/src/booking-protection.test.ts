import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { issueBookingProof, verifyBookingProof, PROOF_WAIT_MS, PROOF_TTL_MS,
  publicBookingProtection, publicAvailabilityLimit, proofIssueLimit, sendBookingProof } from "./booking-protection";
import { runtimeSql } from "./runtime/sql";

test("booking proof: signed, IP-bound, minimum age, expiry, malformed input and tampering", () => {
  const now = 1_790_000_000_000, key = "fixture-only-signing-key", ip = "192.0.2.1";
  const token = issueBookingProof(ip, now, key);
  assert.equal(verifyBookingProof(token, ip, now, key), false);
  assert.equal(verifyBookingProof(token, ip, now + PROOF_WAIT_MS - 1, key), false);
  assert.equal(verifyBookingProof(token, ip, now + PROOF_WAIT_MS, key), true);
  assert.equal(verifyBookingProof(token, ip, now + PROOF_TTL_MS, key), true);
  assert.equal(verifyBookingProof(token, ip, now + PROOF_TTL_MS + 1, key), false);
  assert.equal(verifyBookingProof(token, "192.0.2.2", now + 5000, key), false);
  assert.equal(verifyBookingProof(token, ip, now + 5000, "wrong-key"), false);
  const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
  assert.equal(verifyBookingProof(tampered, ip, now + 5000, key), false);
  for (const invalid of [null, undefined, 12, [], {}, "", "x".repeat(10000), token + ".extra"]) {
    assert.equal(verifyBookingProof(invalid, ip, now + 5000, key), false);
  }
  assert.equal(verifyBookingProof(token, ip, now - 5000, key), false);
});

test("public booking middleware blocks direct posts, traps, replays and excessive attempts; admin unaffected", async t => {
  // This test never uses a real database, Calendar or email provider.
  process.env.RUNTIME_STORAGE = "memory";
  delete process.env.VERCEL;
  const app = express();
  app.set("trust proxy", 1); // Explicit test proxy; remote identities below are fixtures.
  app.use(express.json());
  app.get("/api/booking/protection", proofIssueLimit, sendBookingProof);
  app.get("/api/availability/optimized", publicAvailabilityLimit, (_req, res) => res.json({ ok: true, slots: [] }));
  let writes = 0;
  app.post("/api/book", ...publicBookingProtection, (_req, res) => { writes++; res.status(201).json({ ok: true }); });
  app.post("/api/admin/bookings", (_req, res) => res.status(201).json({ ok: true }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as import("node:net").AddressInfo).port}`;
  const post = (ip: string, email: string, extra: object = {}, token = issueBookingProof(ip, Date.now() - 3000)) =>
    fetch(`${base}/api/book`, { method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": ip, "X-Booking-Token": token },
      body: JSON.stringify({ email, website: "", ...extra }) });
  try {
    await t.test("issue endpoint is uncached and rate limited", async () => {
      const ip = "192.0.2.200";
      const response = await fetch(`${base}/api/booking/protection`, { headers: { "X-Forwarded-For": ip } });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      const proof = await response.json() as { token: string; waitMs: number };
      assert.equal(proof.waitMs, 2000);
      assert.equal(verifyBookingProof(proof.token, ip, Date.now() + 3000), true);
      for (let i = 0; i < 29; i++) assert.equal((await fetch(`${base}/api/booking/protection`, { headers: { "X-Forwarded-For": ip } })).status, 200);
      const blocked = await fetch(`${base}/api/booking/protection`, { headers: { "X-Forwarded-For": ip } });
      assert.equal(blocked.status, 429);
      assert.ok(Number(blocked.headers.get("retry-after")) > 0);
    });
    await t.test("no booking side effects for missing, too-fast or trapped submissions", async () => {
      const ip = "192.0.2.201";
      assert.equal((await post(ip, "fixture@example.test", {}, "")).status, 403);
      assert.equal((await post(ip, "fixture@example.test", {}, issueBookingProof(ip))).status, 403);
      assert.equal((await post(ip, "fixture@example.test", { website: "spam" })).status, 403);
      assert.equal((await post(ip, "fixture@example.test", { website: {} })).status, 403);
      assert.equal(writes, 0);
    });
    await t.test("two concurrent submissions of the same token create only one booking", async () => {
      const ip = "192.0.2.202", token = issueBookingProof(ip, Date.now() - 3000);
      const responses = await Promise.all([post(ip, "replay@example.test", {}, token), post(ip, "replay@example.test", {}, token)]);
      assert.deepEqual(responses.map(r => r.status).sort(), [201, 429]);
      assert.equal(writes, 1);
    });
    await t.test("email limits span IP addresses and normalize case", async () => {
      for (let i = 0; i < 5; i++) {
        assert.equal((await post(`192.0.2.${10 + i}`, i % 2 ? "Hourly@example.test" : "hourly@example.test")).status, i < 4 ? 201 : 429);
      }
    });
    await t.test("burst limit also counts rejected direct submissions", async () => {
      for (let i = 0; i < 9; i++) assert.equal((await post("192.0.2.203", "burst@example.test", {}, "")).status, i < 8 ? 403 : 429);
    });
    await t.test("staff booking path does not require public anti-bot tokens", async () => {
      assert.equal((await fetch(`${base}/api/admin/bookings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).status, 201);
    });
    await t.test("availability scraping is limited independently of bookings", async () => {
      for (let i = 0; i < 91; i++) {
        assert.equal((await fetch(`${base}/api/availability/optimized`, { headers: { "X-Forwarded-For": "192.0.2.210" } })).status, i < 90 ? 200 : 429);
      }
      assert.equal((await post("192.0.2.210", "independent@example.test")).status, 201);
    });
    await t.test("unavailable durable counters fail closed without creating a booking", async () => {
      const query = runtimeSql.query, before = writes;
      process.env.RUNTIME_STORAGE = "postgres";
      runtimeSql.query = async () => { throw new Error("Fixture database unavailable"); };
      try {
        assert.equal((await post("192.0.2.211", "offline@example.test")).status, 503);
        assert.equal(writes, before);
      } finally {
        runtimeSql.query = query;
        process.env.RUNTIME_STORAGE = "memory";
      }
    });
    await t.test("daily email ceiling survives hourly-window resets and IP rotation", async tt => {
      let now = Date.now();
      tt.mock.method(Date, "now", () => now);
      for (let i = 0; i < 11; i++) {
        if (i && i % 4 === 0) now += 61 * 60_000;
        assert.equal((await post(`198.51.100.${i + 1}`, "daily-email@example.test")).status, i < 10 ? 201 : 429);
      }
    });
    await t.test("daily IP ceiling survives burst-window resets", async tt => {
      let now = Date.now();
      tt.mock.method(Date, "now", () => now);
      for (let i = 0; i < 31; i++) {
        if (i && i % 8 === 0) now += 16 * 60_000;
        assert.equal((await post("192.0.2.204", `daily${i}@example.test`)).status, i < 30 ? 201 : 429);
      }
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
