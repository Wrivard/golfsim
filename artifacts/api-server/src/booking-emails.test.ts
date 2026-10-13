import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { bookingTemplate, sendBookingEmails } from "./booking-emails";
import { contactTemplate } from "./contact-templates";

const booking = {
  id: "fixture-reservation", name: "Camille <script>", email: "customer@example.invalid",
  phone: "555-0100", date: new Date("2026-10-15T00:00:00Z"), time: "10:30",
  duration: "2h", bayType: "3", players: 4, notes: "Client <img src=x onerror=alert(1)>",
};
const config = { apiKey: "fixture", from: "bonjour@kua.quebec", to: "owner@example.invalid" };

test("all four email types include an accessible HTTPS logo, brand and text alternative", () => {
  const contact = { ...booking, date: "2026-10-15", message: booking.notes, requestId: booking.id };
  for (const audience of ["owner", "customer"] as const) {
    for (const template of [contactTemplate(contact, audience), bookingTemplate([booking], audience)]) {
      assert.match(template.html, /src="https:\/\/[^"]+\/email-logo.png"/);
      assert.match(template.html, /alt="Golf SIM Sorel-Tracy"/);
      assert.match(template.html, /#295634/);
      assert.ok(template.text.includes(booking.name));
      assert.ok(!template.html.includes("<script>") && !template.html.includes("<img src=x"));
      assert.ok(template.html.includes("&lt;script&gt;"));
    }
    assert.match(contactTemplate(contact, audience).text, /PAS une réservation confirmée/);
    const mail = bookingTemplate([booking], audience);
    assert.match(mail.text, /15 octobre 2026/);
    assert.match(mail.text, /10:30/);
    assert.match(mail.text, /Baie 3/);
    assert.match(mail.text, /paiement s’effectue sur place/);
  }
});

test("booking deliveries have separate recipients, reply addresses and stable deduplication keys", async () => {
  const bodies: any[] = [], keys: string[] = [];
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(url, "https://api.resend.com/emails");
    bodies.push(JSON.parse(String(init?.body)));
    keys.push(new Headers(init?.headers).get("Idempotency-Key")!);
    return Response.json({id:"fixture-accepted"});
  };
  assert.equal(await sendBookingEmails([booking], () => config, fetcher), "accepted");
  assert.deepEqual(bodies.map(b => b.to), [[config.to], [booking.email]]);
  assert.deepEqual(bodies.map(b => b.reply_to), [booking.email, config.to]);
  assert.ok(keys[0] !== keys[1]);
  await sendBookingEmails([booking], () => config, fetcher);
  assert.deepEqual(keys.slice(0,2),keys.slice(2));
});

test("delivery errors return a warning instead of throwing and both audiences are attempted", async () => {
  for (const mode of ["reject", "network", "malformed", "missing-id", "partial"]) {
    let calls = 0;
    const result = await sendBookingEmails([booking], () => config, async () => {
      calls++;
      if (mode === "network") throw new Error("private provider details");
      if (mode === "malformed") return new Response("<html>failure</html>");
      if (mode === "missing-id") return Response.json({});
      if (mode === "partial" && calls === 2) return Response.json({id:"accepted"});
      return new Response("",{status:503});
    });
    assert.equal(result, "unavailable"); assert.equal(calls,2);
  }
  assert.equal(await sendBookingEmails([booking], () => { throw new Error("missing configuration"); }), "unavailable");
});

test("a multi-booking request is summarized in two messages, not one pair per reservation", async () => {
  const batch = [booking, {...booking, id:"second-fixture",bayType:"4",time:"14:00"}];
  let calls = 0;
  assert.equal(await sendBookingEmails(batch, () => config, async (_url, init) => {
    calls++;
    const data = JSON.parse(String(init?.body));
    assert.match(data.text, /Baie 3/); assert.match(data.text, /Baie 4/); assert.match(data.text, /14:00/);
    return Response.json({id:"accepted"});
  }), "accepted");
  assert.equal(calls,2);
});

test("preview sends both messages only to the dedicated test inbox", async () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "preview";
  try {
    await sendBookingEmails([booking], () => config, async (_url, init) => {
      assert.deepEqual(JSON.parse(String(init?.body)).to,[config.to]);
      return Response.json({id:"accepted"});
    });
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous;
  }
});

test("booking notifications are wired only to public confirmation routes, after Calendar persistence", async () => {
  const source = await readFile(new URL("./routes/routes.ts", import.meta.url), "utf8");
  const beforePublic = source.slice(source.indexOf("export async function registerRoutes"),source.indexOf('app.post("/api/book",'));
  assert.ok(!beforePublic.includes("sendBookingEmails("));
  const single = source.slice(source.indexOf('app.post("/api/book",'),source.indexOf('app.post("/api/book/batch",'));
  const batch = source.slice(source.indexOf('app.post("/api/book/batch",'));
  for (const handler of [single,batch]) {
    assert.ok(handler.indexOf("sendBookingEmails(") > handler.indexOf("await storage.updateBookingCalendarEventId"));
    assert.match(handler, /emailStatus/);
  }
});
