import type { Plugin } from "vite";
import { injectSeoMeta, renderSitemap, renderRobots } from "@workspace/golf-seo";

// Preserve the original server-rendered metadata now that Vite owns the HTML.
const pagePaths = [
  "/about", "/rates", "/gallery", "/contact", "/booking", "/login", "/admin",
  "/politique-de-confidentialite", "/politique-de-cookies",
];

export function seoPlugin(): Plugin {
  return {
    name: "golf-sim-seo",
    // Vite's HTML build plugin must emit index.html before we copy it.
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        const requestPath = (context.originalUrl || context.path).split("?")[0];
        return injectSeoMeta(html, requestPath === "/index.html" ? "/" : requestPath);
      },
    },
    generateBundle(_options, bundle) {
      // Public crawl files must remain available when the API/database is down.
      this.emitFile({ type: "asset", fileName: "seo/sitemap.xml", source: renderSitemap() });
      this.emitFile({ type: "asset", fileName: "seo/robots.txt", source: renderRobots() });
      const index = bundle["index.html"];
      if (!index || index.type !== "asset") throw new Error("Golf SIM index.html missing");
      for (const pagePath of pagePaths) {
        this.emitFile({
          type: "asset",
          fileName: `${pagePath.slice(1)}/index.html`,
          source: injectSeoMeta(String(index.source), pagePath),
        });
      }
    },
  };
}
