import test from "node:test";
import assert from "node:assert/strict";
import { deliverContact, parseContact } from "./contact";

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
    assert.equal((init!.headers as Record<string, string>)["Idempotency-Key"], `gsim-contact/${valid.requestId}`);
    const body = JSON.parse(init!.body as string);
    assert.equal(body.from, "Golf SIM <contact@mail.example.invalid>");
    assert.deepEqual(body.to, ["inbox@example.invalid"]);
    assert.equal(body.reply_to, valid.email);
    for (const value of [valid.name, valid.email, valid.date, valid.phone, valid.message, "Joueurs : 3"]) assert.ok(body.text.includes(value));
    assert.ok(body.text.includes("PAS une réservation confirmée"));
    assert.equal(body.html, undefined);
    return new Response(JSON.stringify({ id: "test-provider-id" }), { status: 200 });
  };
  const config = { apiKey: "fixture-not-a-real-key", from: "contact@mail.example.invalid", to: "inbox@example.invalid" };
  assert.equal(await deliverContact(valid, config, fetcher), "test-provider-id");
  assert.equal(await deliverContact(valid, config, fetcher), "test-provider-id");
  assert.equal(calls, 2);
});
test("provider failure, network timeout and missing acceptance ID never report success", async () => {
  const config = { apiKey: "fixture", from: "contact@example.invalid", to: "inbox@example.invalid" };
  await assert.rejects(deliverContact(valid, config, async () => new Response("{}", { status: 429 })));
  await assert.rejects(deliverContact(valid, config, async () => { throw new Error("network"); }));
  await assert.rejects(deliverContact(valid, config, async () => new Response("{}", { status: 200 })));
});
