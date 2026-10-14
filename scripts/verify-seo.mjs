import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

const config = JSON.parse(await readFile("vercel.json", "utf8"));
const out = config.outputDirectory;
for (const [route, mimeMarker] of [["/sitemap.xml", "<urlset"], ["/robots.txt", "User-agent:"]]) {
  const rule = config.rewrites.find(item => item.source === route);
  assert.ok(rule && rule.destination.startsWith("/seo/"), `${route} must not depend on the API`);
  let shadowingAsset = false;
  try {
    await access(`${out}${route}`);
    shadowingAsset = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  assert.equal(shadowingAsset, false, `${route}: a root static asset would shadow the /seo/ rewrite on Vercel`);
  const content = await readFile(`${out}${rule.destination}`, "utf8");
  assert.ok(content.includes(mimeMarker));
  if (route === "/sitemap.xml") {
    const origin = new URL(process.env.SITE_URL).origin;
    const urls = [...content.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
    assert.equal(urls.length, 8);
    assert.equal(new Set(urls).size, 8);
    for (const url of urls) {
      assert.equal(new URL(url).origin, origin);
      assert.ok(!/\/(admin|login)(\/|$)/.test(new URL(url).pathname));
    }
  } else if (process.env.VERCEL_ENV === "preview") {
    assert.equal(content, "User-agent: *\nDisallow: /\n");
  } else {
    assert.ok(content.includes(`Sitemap: ${new URL(process.env.SITE_URL).origin}/sitemap.xml`));
  }
}
console.log("PASS: sitemap and robots are valid public build assets routed independently of API startup.");
