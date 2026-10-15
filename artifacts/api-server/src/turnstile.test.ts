import assert from "node:assert/strict";
import test from "node:test";
import { turnstileSettings, verifyTurnstile, type TurnstileSettings } from "./turnstile";

const config: TurnstileSettings = { siteKey: "fixture-site", secret: "fixture-secret", testMode: false,
  hostnames: new Set(["golfsimsorel.ca", "www.golfsimsorel.ca"]) };
const binding = "a".repeat(64);
const valid = { success: true, hostname: "www.golfsimsorel.ca", action: "booking", cdata: binding };
const reply = (data: unknown, status = 200) => (async () => new Response(JSON.stringify(data), { status })) as typeof fetch;

test("Turnstile production cannot use missing or dummy keys, even with NODE_ENV overridden", () => {
  assert.throws(() => turnstileSettings({ VERCEL: "1", VERCEL_ENV: "production", NODE_ENV: "development" }));
  assert.throws(() => turnstileSettings({ NODE_ENV: "production", TURNSTILE_SITE_KEY: "1x00000000000000000000AA", TURNSTILE_SECRET_KEY: "fixture" }));
  assert.throws(() => turnstileSettings({ NODE_ENV: "production", TURNSTILE_SITE_KEY: "fixture", TURNSTILE_SECRET_KEY: "fixture" }));
  const prod = turnstileSettings({ NODE_ENV: "production", TURNSTILE_SITE_KEY: "fixture", TURNSTILE_SECRET_KEY: "fixture", SITE_URL: "https://www.golfsimsorel.ca" });
  assert.equal(prod.testMode, false);
  assert.ok(prod.hostnames.has("golfsimsorel.ca"));
  assert.ok(prod.hostnames.has("www.golfsimsorel.ca"));
  assert.equal(turnstileSettings({ NODE_ENV: "development" }).testMode, true);
  assert.equal(turnstileSettings({ VERCEL: "1", VERCEL_ENV: "preview", NODE_ENV: "production" }).testMode, true);
});
test("Turnstile verifies Cloudflare success AND hostname, action and form binding", async () => {
  assert.equal(await verifyTurnstile("fixture-token", "192.0.2.1", binding, config, reply(valid)), "valid");
  for (const body of [{ ...valid, hostname: "attacker.example" }, { ...valid, action: "contact" }, { ...valid, cdata: "another-form" }, { ...valid, success: "true" },
    { success: false, "error-codes": ["timeout-or-duplicate"] }, null, {}]) {
    assert.equal(await verifyTurnstile("fixture-token", "192.0.2.1", binding, config, reply(body)), "invalid");
  }
});
test("Turnstile fails closed for outages, malformed responses, expired/replayed and oversized tokens", async () => {
  for (const value of [null, undefined, [], "", "a".repeat(2049)]) {
    assert.equal(await verifyTurnstile(value, "", binding, config, reply(valid)), "invalid");
  }
  assert.equal(await verifyTurnstile("fixture-token", "", binding, config, reply({}, 503)), "unavailable");
  assert.equal(await verifyTurnstile("fixture-token", "", binding, config, reply({ success: false, "error-codes": ["invalid-input-secret"] })), "unavailable");
  assert.equal(await verifyTurnstile("fixture-token", "", binding, config, (async () => { throw new Error("Fixture timeout"); }) as typeof fetch), "unavailable");
  assert.equal(await verifyTurnstile("fixture-token", "", binding, config, (async () => new Response("<html>Failure</html>")) as typeof fetch), "unavailable");
});
test("Turnstile sends only server-side secret/token/IP to the fixed endpoint with a timeout", async () => {
  const fetcher = (async (url, init) => {
    assert.equal(url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    assert.equal(init?.method, "POST");
    assert.ok(init?.signal);
    const form = new URLSearchParams(String(init?.body));
    assert.equal(form.get("secret"), "fixture-secret");
    assert.equal(form.get("response"), "fixture-token");
    assert.equal(form.get("remoteip"), "192.0.2.1");
    return new Response(JSON.stringify(valid));
  }) as typeof fetch;
  assert.equal(await verifyTurnstile("fixture-token", "192.0.2.1", binding, config, fetcher), "valid");
});
