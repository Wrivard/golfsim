---
name: Integration secret transfers
description: Safely configure external environment variables without exposing credentials in tool results.
---

**Rule:** When the user authorizes configuration of their external hosting project, transfer required secrets only inside authenticated runtime code, directly to encrypted destination variables. Never return values to the assistant or persist them in workspace files.

**Why:** Vercel's documented environment-variable failure payload can include the submitted value. Logging a complete response or error body can therefore disclose credentials even when the destination encrypts them.

**How to apply:** Sanitize both successes and failures to variable names, scopes, types, status codes and error codes. Check per-variable failures even on successful HTTP responses, then verify destination metadata without decrypting secrets. Preserve existing credentials and keep production database URLs out of Preview. Configuration changes do not authorize a database cutover or deployment.
