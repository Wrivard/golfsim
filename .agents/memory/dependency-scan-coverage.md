---
name: Dependency scan coverage
description: Why dependency remediation needs both package-manager audits and an independent scanner.
---

Do not treat a clean package-manager audit as proof that every reported dependency advisory has been resolved.

**Why:** The pnpm audit reported zero vulnerabilities while the independent scanner still detected a vulnerable transitive routing dependency in Vercel tooling. An archived application also had a separate npm lockfile outside the workspace.

**How to apply:** Enumerate manifests with a pruned filesystem walk, handle each independent lockfile, compare the originally reported package/version pairs against the resulting pins, and finish with an independent dependency scan.
