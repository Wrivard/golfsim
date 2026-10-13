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

A standalone NodeNext check is necessary but not sufficient evidence that Vercel's function compilation succeeds.

**Why:** Both the product build and the standalone check passed locally, while Vercel's later function compilation rejected the Express call signature. Different compiler resolution contexts can expose errors that local checks miss.

**How to apply:** Validate the complete Vercel build pipeline on a clean checkout with the deployment's Node version, including its final server-function packaging step. Distinguish a passing product build from a passing Vercel build in reports.

Keep the serverless boundary independent of transitive framework types.

**Why:** Vercel's language-service resolver rejected Express's callable type even when standalone NodeNext checks passed; the same old code passed with Vercel's explicit experimental TypeScript resolver. A Node HTTP contract avoids depending on that resolver behavior without suppressing type safety.

**How to apply:** Check the HTTP contract against the implementation and exercise the actual Vercel function builder, with no experimental workaround enabled.
