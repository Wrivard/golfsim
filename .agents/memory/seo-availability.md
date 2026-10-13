---
name: Public crawl availability
description: Keep sitemap and robots independent of API and database initialization.
---
Generate public crawl documents at build time and serve them as static assets on Vercel.

**Why:** An API initialization failure made sitemap.xml return a service-unavailable JSON response, even though sitemap generation itself worked.

**How to apply:** Keep production sitemap/robots routing outside the server bootstrap. Reuse shared renderers for development, preserve preview crawl restrictions and validate generated assets plus routing during production builds.
