import test from "node:test";
import assert from "node:assert/strict";
import { deliverContact, parseContact, mailConfig } from "./contact";

const valid = {
  name: "Client de test", email: "test@example.invalid", players: 3 as const,
  date: "2026-10-14", phone: "555-0100", message: "Événement de test",
  requestId: "19c018c6-98d8-4b10-b026-66c71ba5294b", website: "",
};
test("contact requires all fields, numeric selection, empty honeypot and actual date", () => {
  assert.ok(parseContact(valid));
  for (const body of [
    { ...valid, players: "3" }, { ...valid, players: 5 }, { ...valid, email: "bad" },
    { ...valid, website: "spam" }, { ...valid, name: "  " },
    { ...valid, message: " " }, { ...valid, date: "2026-02-30" },
    { ...valid, date: "2026-13-01" }, { ...valid, requestId: "bad" },
    { ...valid, email: "a@example.invalid\nBcc:evil@example.invalid" },
    { ...valid, from: "attacker@example.invalid" },
  ]) assert.equal(parseContact(body), null);
});
test("Resend payload uses trusted sender/recipient, reply-to, every form field, and retry key", async () => {
  let calls = 0;
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls++;
    assert.equal(url, "https://api.resend.com/emails");
    const audience = calls % 2 === 1 ? "owner" : "customer";
    assert.equal((init!.headers as Record<string, string>)["Idempotency-Key"], `gsim-contact/${valid.requestId}/${audience}`);
    const body = JSON.parse(init!.body as string);
    assert.equal(body.from, "Golf SIM <contact@mail.example.invalid>");
    assert.deepEqual(body.to, [audience === "owner" ? "inbox@example.invalid" : valid.email]);
    assert.equal(body.reply_to, audience === "owner" ? valid.email : "inbox@example.invalid");
    for (const value of [valid.name, valid.email, valid.date, valid.phone, valid.message, "Joueurs : 3"]) assert.ok(body.text.includes(value));
    assert.ok(body.text.includes("PAS une réservation confirmée"));
    assert.ok(body.html.includes("GOLF SIM"));
    assert.ok(body.html.includes("Récapitulatif"));
    return new Response(JSON.stringify({ id: "test-provider-id" }), { status: 200 });
  };
  const config = { apiKey: "fixture-not-a-real-key", from: "contact@mail.example.invalid", to: "inbox@example.invalid" };
  assert.equal(await deliverContact(valid, config, fetcher), "test-provider-id");
  assert.equal(await deliverContact(valid, config, fetcher), "test-provider-id");
  assert.equal(calls, 4);
});
test("provider failure, network timeout and missing acceptance ID never report success", async () => {
  const config = { apiKey: "fixture", from: "contact@example.invalid", to: "inbox@example.invalid" };
  await assert.rejects(deliverContact(valid, config, async () => new Response("{}", { status: 429 })));
  await assert.rejects(deliverContact(valid, config, async () => { throw new Error("network"); }));
  await assert.rejects(deliverContact(valid, config, async () => new Response("{}", { status: 200 })));
});

test("customer failure retries the same two idempotency keys without reporting full success", async () => {
  const keys: string[] = [];
  const config = { apiKey: "fixture", from: "bonjour@kua.quebec", to: "owner@example.invalid" };
  let failCustomer = true;
  const fetcher: typeof fetch = async (_url, init) => {
    const key = (init!.headers as Record<string, string>)["Idempotency-Key"];
    keys.push(key);
    return key.endsWith("/customer") && failCustomer
      ? new Response("{}", { status: 503 })
      : new Response(JSON.stringify({ id: "fixture-accepted" }), { status: 200 });
  };
  await assert.rejects(deliverContact(valid, config, fetcher));
  failCustomer = false;
  assert.equal(await deliverContact(valid, config, fetcher), "fixture-accepted");
  assert.deepEqual(keys.slice(0, 2), keys.slice(2));
});

test("three Vercel email variables work; explicit disable and preview isolation remain effective", () => {
  const keys = ["RESEND_API_KEY","RESEND_FROM_EMAIL","RECIPIENT_EMAIL","CONTACT_EMAIL_ENABLED","CONTACT_EMAIL_FROM","CONTACT_EMAIL_TO","VERCEL_ENV","PREVIEW_CONTACT_EMAIL_TO"];
  const before = keys.map(key => process.env[key]);
  try {
    process.env.VERCEL_ENV = "production";
    process.env.RESEND_API_KEY = "fixture";
    process.env.RESEND_FROM_EMAIL = "bonjour@kua.quebec";
    process.env.RECIPIENT_EMAIL = "owner@example.invalid";
    process.env.CONTACT_EMAIL_FROM = "legacy@example.invalid";
    delete process.env.CONTACT_EMAIL_ENABLED;
    assert.deepEqual(mailConfig(), { apiKey: "fixture", from: "bonjour@kua.quebec", to: "owner@example.invalid" });
    process.env.CONTACT_EMAIL_ENABLED = "false";
    assert.throws(mailConfig);
    process.env.VERCEL_ENV = "preview";
    process.env.CONTACT_EMAIL_ENABLED = "true";
    delete process.env.PREVIEW_CONTACT_EMAIL_TO;
    assert.throws(mailConfig);
    process.env.PREVIEW_CONTACT_EMAIL_TO = "test@example.invalid";
    assert.equal(mailConfig().to, "test@example.invalid");
  } finally {
    keys.forEach((key, i) => before[i] === undefined ? delete process.env[key] : process.env[key] = before[i]);
  }
});
