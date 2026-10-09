---
name: Publishing verification
description: Verify production builds independently of working development previews.
---

A working development preview is not sufficient verification for publishing, especially after workspace migrations or changes to build plugins.

**Why:** The site rendered normally in development, but publishing exposed a failure in build-only HTML generation. Development checks never exercised that path.

**How to apply:** Run the affected artifact's actual production build before declaring it ready to publish. Check generated route HTML and its compiled asset references, not just the root page in the development server.
