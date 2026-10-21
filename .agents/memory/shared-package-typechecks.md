---
name: Shared package typechecks
description: Keeping TypeScript consumers aligned with changed APIs in workspace packages.
---

After changing exports or public types in a shared workspace package, rebuild that package before typechecking its consumers.

**Why:** a consumer typecheck reported a missing export even though it was present in the source; rebuilding the package refreshed the project-reference output and cleared the mismatch.

**How to apply:** run the shared package's TypeScript project build, then rerun the API and frontend typechecks. Do not treat a consumer error as proof that the source edit failed.
