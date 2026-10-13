import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { google } from "googleapis";
import { storage } from "./storage";
import { contactTemplate } from "./contact-templates";
import { db } from "./db";
import { bookings, oauthTokens, calendarSettings } from "@workspace/db/schema";

process.env.GOOGLE_CLIENT_ID ||= "fixture-client";
process.env.GOOGLE_CLIENT_SECRET ||= "fixture-secret";
process.env.CALENDAR_ENABLED = "true";
process.env.VERCEL_ENV = "";

test("OAuth requests account selection and renewable offline access", async () => {
  const { getGoogleAuthUrl } = await import("./googleCalendar");
  const url = new URL(getGoogleAuthUrl("https://www.golfsimsorel.ca/oauth/google/callback", "fixture-state"));
  assert.equal(url.searchParams.get("prompt"), "select_account consent");
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("state"), "fixture-state");
});
test("incomplete OAuth consent preserves the existing stored account", async () => {
  const { exchangeCodeForTokens } = await import("./googleCalendar");
  const getToken = mock.method(google.auth.OAuth2.prototype, "getToken", async () => ({ tokens: { access_token: "fixture-only" } }));
  const info = mock.method(google as unknown as { oauth2: (...args: any[]) => any }, "oauth2", () => ({ userinfo: { get: async () => ({ data: { email: "fixture@example.invalid" } }) } }));
  const save = mock.method(storage, "saveOAuthToken", async () => { throw new Error("must not save"); });
  try {
    await assert.rejects(exchangeCodeForTokens("fixture-code", "https://example.invalid/callback"), /incomplète/);
    assert.equal(save.mock.callCount(), 0);
  } finally { getToken.mock.restore(); info.mock.restore(); save.mock.restore(); }
});

test("account swap preserves historical Google links; same-account reconnect and failed swaps preserve them", async () => {
  let state = { token: { email: "old@example.invalid", accessToken: "" }, booking: { name: "Unchanged", calendarEventId: "old-event" as string | null }, calendar: { id: "settings", calendarId: "old-calendar" } };
  let failInsert = false;
  const transaction = mock.method(db, "transaction", (async (action: any) => {
    const before = structuredClone(state);
    const tx = {
      execute: async () => {},
      select: () => ({ from: () => ({ where: async () => [state.token] }) }),
      update: (table: unknown) => ({ set: async (value: any) => {
        if (table === bookings) Object.assign(state.booking, value);
        if (table === calendarSettings) Object.assign(state.calendar, value);
      } }),
      delete: () => ({ where: async () => {} }),
      insert: (table: unknown) => ({ values: (token: any) => ({ returning: async () => {
        assert.equal(table, oauthTokens);
        if (failInsert) throw new Error("fixture insert failed");
        state.token = token;
        return [token];
      } }) }),
    };
    try { return await action(tx); } catch (error) { state = before; throw error; }
  }) as any);
  try {
    await storage.saveOAuthToken({ provider: "google", email: "old@example.invalid", accessToken: "fixture" });
    assert.equal(state.booking.calendarEventId, "old-event");
    failInsert = true;
    await assert.rejects(storage.saveOAuthToken({ provider: "google", email: "new@example.invalid", accessToken: "fixture" }));
    assert.equal(state.booking.calendarEventId, "old-event");
    assert.equal(state.token.email, "old@example.invalid");
    failInsert = false;
    await storage.saveOAuthToken({ provider: "google", email: "new@example.invalid", accessToken: "fixture" });
    assert.equal(state.booking.calendarEventId, "old-event");
    assert.equal(state.booking.name, "Unchanged");
    assert.equal(state.calendar.calendarId, "primary");
  } finally { transaction.mock.restore(); }
});
test("both branded templates escape customer HTML and distinguish request from reservation", () => {
  const data = { name: "<script>bad</script>", email: "fixture@example.invalid", players: 3, message: "<img onerror=bad>\nDetails", requestId: "fixture" };
  for (const audience of ["owner", "customer"] as const) {
    const template = contactTemplate(data, audience);
    assert.ok(template.html.includes("&lt;script&gt;"));
    assert.ok(!template.html.includes("<img onerror"));
    assert.ok(template.text.includes("PAS une réservation confirmée"));
    assert.ok(template.html.includes("GOLF SIM"));
  }
});
