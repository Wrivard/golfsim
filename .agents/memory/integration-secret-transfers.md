---
name: Integration secret transfers
description: Safely configure external environment variables without exposing credentials in tool results.
---

**Rule:** When the user authorizes configuration of their external hosting project, transfer required secrets only inside authenticated runtime code, directly to encrypted destination variables. Never return values to the assistant or persist them in workspace files.

**Why:** Vercel's documented environment-variable failure payload can include the submitted value. Logging a complete response or error body can therefore disclose credentials even when the destination encrypts them.

**How to apply:** Sanitize both successes and failures to variable names, scopes, types, status codes and error codes. Check per-variable failures even on successful HTTP responses, then verify destination metadata without decrypting secrets. Preserve existing credentials and keep production database URLs out of Preview. Configuration changes do not authorize a database cutover or deployment.

Do not treat Vercel environment-list values as plaintext, even with a decrypt query parameter.

**Why:** The list endpoint returned ciphertext, which looked populated and passed length checks but was not a usable connection string.

**How to apply:** Use list results only for metadata. When an authorized runtime check requires a credential, use the documented per-variable retrieval endpoint inside the authenticated runtime and consume it there; return only sanitized diagnostic results. Sensitive variables may not be retrievable.

Preserve Preview when changing a production setting shared across environment targets.

**Why:** A public-origin variable can be stored as sensitive and shared between Production and Preview; replacing its value in place would also change Preview.

**How to apply:** Separate the production target into its own variable while preserving the existing Preview value without reading it. Restore the original targets if creation of the production variable fails. These configuration changes still require a new deployment to take effect.
