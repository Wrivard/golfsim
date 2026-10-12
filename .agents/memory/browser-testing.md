---
name: Browser testing availability
description: Handling unavailable testing helpers without sending real emails during verification.
---

The testing helper documented in the local skill can be unavailable: this workspace rejected its documented `testing` configuration. Check actual availability rather than assuming the skill guarantees it.

**Why:** The documented helper failed at startup, while an installed local Chromium and Playwright core successfully verified the contact form.

**How to apply:** If the helper remains unavailable, use the installed browser for interactive checks. Intercept email submissions with controlled responses so failure, retry and success flows can be checked without sending real messages. Browser mocks do not verify real provider delivery.
