import type { Plugin } from "vite";
import { injectSeoMeta } from "@workspace/golf-seo";

// Preserve the original server-rendered metadata now that Vite owns the HTML.
const pagePaths = [
  "/about", "/rates", "/gallery", "/contact", "/booking", "/login", "/admin",
  "/politique-de-confidentialite", "/politique-de-cookies",
];

export function seoPlugin(): Plugin {
  return {
    name: "golf-sim-seo",
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        const requestPath = (context.originalUrl || context.path).split("?")[0];
        return injectSeoMeta(html, requestPath === "/index.html" ? "/" : requestPath);
      },
    },
    generateBundle(_options, bundle) {
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
