---
name: Hosting target
description: User-requested production hosting destination for Golf SIM.
---

The user wants the Golf SIM site on its real domain, hosted on Vercel, with the database, Google Calendar and Resend contact emails connected. The user explicitly chose “vercel gratuit free plan”; do not upgrade or assume approval for paid hosting.

Pour la base de données, l'utilisateur souhaite que « ça reste confortablement gratuit ».

**Why:** The user asked for alternative databases after learning that background synchronization could exhaust Neon's free compute allowance.

**How to apply:** Evaluate free-tier headroom, not just whether a free plan exists. A database alternative has not yet been selected; do not migrate data or activate paid services without approval.

**Why:** The user explicitly named Vercel as the intended destination and reiterated the free plan after being told about Hobby's restrictions.

**How to apply:** Respect the selected free plan without claiming it permits commercial use or guarantees availability. Preserve Calendar scheduling through a verified free external caller rather than silently removing synchronization. Domain and DNS inputs are in the launch guide; account setup, external service activation and cutover still require confirmation. This preference does not authorize deployment, a paid subscription or DNS changes.

Check database compute allowances as well as hosting and scheduler allowances before promising a free deployment.

**Why:** A free scheduled caller can repeatedly wake Neon and prevent its idle suspension. Calendar reconciliation, session cleanup and administrative polling can consume the database's monthly compute allowance even with few reservations.

**How to apply:** Verify current Neon limits and actual usage before enabling background jobs. Compare polling frequency with the database's idle timeout; retain synchronization requirements and obtain approval before reducing them. Never equate a free scheduler with free database operation.
