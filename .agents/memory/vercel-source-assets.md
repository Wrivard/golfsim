---
name: Vercel source assets
description: Keep static images required by Golf SIM available to Git-based Vercel builds.
---

Vercel builds from the committed Git checkout, so product assets imported from the globally ignored root `attached_assets` directory are not guaranteed to exist in production. Keep assets needed by the web artifact in its tracked source tree and verify their paths in a production build.

**Why:** Local Vite builds had access to ignored workspace images, while Vercel failed because its Git checkout could not find the imported files.

**How to apply:** Store imported Golf SIM images under the web artifact's `src/assets` tree, update imports to that tracked path, and make sure the files are included in the commit before expecting Vercel to build them.
