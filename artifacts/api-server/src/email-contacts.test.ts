import assert from "node:assert/strict";
import test from "node:test";
import { csvContacts } from "./email-contacts";
import type { EmailContact } from "@workspace/db/schema";

const base = {
  email: "josée@example.com", name: 'Josée "Golf"', source: "site",
  marketingConsent: false, consentAt: null, withdrawnAt: null,
  consentEvidence: null, createdAt: new Date(),
} satisfies EmailContact;

test("complete CSV remains UTF-8, quotes accents and protects spreadsheet cells", () => {
  const csv = csvContacts([base, { ...base, email: "safe@example.com", name: "=HYPERLINK(\"x\")" }], false);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /"Josée ""Golf"""/);
  assert.match(csv, /"'=HYPERLINK\(""x""\)"/);
  assert.match(csv, /\r\n/);
});

test("marketing CSV excludes the unconsented and withdrawn", () => {
  const csv = csvContacts([base, { ...base, email: "withdrawn@example.com", marketingConsent: false,
    consentAt: new Date(), withdrawnAt: new Date(), consentEvidence: "test" }], true);
  assert.doesNotMatch(csv, /josée@example.com|withdrawn@example.com/);
});
