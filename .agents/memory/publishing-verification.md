---
name: Publishing verification
description: Verify production builds independently of working development previews.
---

A working development preview is not sufficient verification for publishing, especially after workspace migrations or changes to build plugins.

**Why:** The site rendered normally in development, but publishing exposed a failure in build-only HTML generation. Development checks never exercised that path.

**How to apply:** Run the affected artifact's actual production build before declaring it ready to publish. Check generated route HTML and its compiled asset references, not just the root page in the development server.

Vercel's Node function compilation must also be checked with NodeNext resolution, independently of the workspace's Bundler-mode type check.

**Why:** The workspace build passed, but Vercel rejected extensionless imports in the function's transitive TypeScript graph. Fixing only the entry-point import revealed the same problem inside the server.

**How to apply:** Preserve the precompiled server boundary for the Vercel function and test the entry point under NodeNext after the production build; do not replace it with a direct import of the server's TypeScript source.
