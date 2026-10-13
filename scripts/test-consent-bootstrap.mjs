import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const html = await readFile(new URL("../artifacts/golf-sim/index.html", import.meta.url), "utf8");
const code = html.match(/<script data-cookieconsent="ignore">([\s\S]*?)<\/script>/)[1];
function browser(hostname) {
  const scripts = [], listeners = {};
  const window = { location: { hostname }, addEventListener(name, handler) { listeners[name] = handler; } };
  const document = {
    createElement: () => ({ setAttribute(key, value) { this[key] = value; } }),
    head: { appendChild(script) { scripts.push(script); } },
  };
  runInNewContext(code, { window, document, console, Date });
  return { window, scripts, listeners };
}
for (const hostname of ["localhost", "127.0.0.1", "[::1]", "example.replit.dev", "example.replit.app", "example.vercel.app"]) {
  test(`no consent or tracking scripts on ${hostname}`, () => {
    const b = browser(hostname);
    assert.equal(b.scripts.length, 0);
    assert.equal(b.window.dataLayer, undefined);
  });
}
for (const hostname of ["golfsimsorel.ca", "www.golfsimsorel.ca"]) {
  test(`Cookiebot first; GTM requires consent; revocation updates consent on ${hostname}`, () => {
    const b = browser(hostname);
    assert.equal(b.scripts.length, 1);
    assert.equal(b.scripts[0].id, "Cookiebot");
    assert.equal(b.scripts[0]["data-cbid"], "ce5cea44-601a-436a-92f6-f64f522e2fdf");
    assert.equal(b.window.dataLayer[0][2].analytics_storage, "denied");
    b.window.Cookiebot = { consent: { statistics: false, marketing: false, preferences: false } };
    b.listeners.CookiebotOnConsentReady();
    assert.equal(b.scripts.length, 1);
    b.window.Cookiebot.consent.statistics = true;
    b.listeners.CookiebotOnAccept();
    assert.equal(b.scripts[1].src, "https://www.googletagmanager.com/gtm.js?id=GTM-NL4X3WBR");
    b.listeners.CookiebotOnAccept();
    assert.equal(b.scripts.length, 2);
    b.window.Cookiebot.consent.statistics = false;
    b.listeners.CookiebotOnDecline();
    assert.equal(b.window.dataLayer.at(-1)[2].analytics_storage, "denied");
  });
}
test("noscript does not bypass consent or development hostname checks", () => {
  const fallback = html.match(/<noscript>([\s\S]*?)<\/noscript>/)[1];
  assert.match(fallback, /data-src="https:\/\/www.googletagmanager.com\/ns.html\?id=GTM-NL4X3WBR"/);
  assert.ok(!/\ssrc=/.test(fallback));
});
test("the essential application bundle is not blocked when tracking consent is refused", () => {
  assert.match(html, /<script type="module" src="\/src\/main.tsx" data-cookieconsent="ignore"><\/script>/);
});
