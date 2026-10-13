import test from "node:test";
import assert from "node:assert/strict";
import { renderSitemap, renderRobots } from "@workspace/golf-seo";

test("crawl documents render without database configuration and previews remain blocked", () => {
  const site = process.env.SITE_URL, environment = process.env.VERCEL_ENV;
  try {
    process.env.SITE_URL = "https://www.golfsimsorel.ca";
    process.env.VERCEL_ENV = "production";
    const xml = renderSitemap();
    assert.equal((xml.match(/<url>/g) || []).length, 8);
    assert.ok(xml.includes("<loc>https://www.golfsimsorel.ca/booking</loc>"));
    assert.ok(!xml.includes("/admin") && !xml.includes("/login"));
    assert.ok(renderRobots().includes("Sitemap: https://www.golfsimsorel.ca/sitemap.xml"));
    process.env.VERCEL_ENV = "preview";
    assert.equal(renderRobots(), "User-agent: *\nDisallow: /\n");
  } finally {
    if (site === undefined) delete process.env.SITE_URL; else process.env.SITE_URL = site;
    if (environment === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = environment;
  }
});
