---
name: Browser testing availability
description: Handling unavailable testing helpers without sending real emails during verification.
---

The testing helper documented in the local skill can be unavailable: this workspace rejected its documented `testing` configuration. Check actual availability rather than assuming the skill guarantees it.

**Why:** The documented helper failed at startup, while an installed local Chromium and Playwright core successfully verified the contact form.

**How to apply:** If the helper remains unavailable, use the installed browser for interactive checks. Intercept email submissions with controlled responses so failure, retry and success flows can be checked without sending real messages. Browser mocks do not verify real provider delivery.

Verify mobile date pickers after opening them, including selecting the last row in a six-week month at a reduced viewport height.

**Why:** The booking page rendered correctly while its anchored calendar was constrained by available popover height on a phone, leaving lower weeks apparently cut off. A first-viewport screenshot did not exercise that state.

**How to apply:** Test opening, month navigation, last-day selection and reopening at small phone sizes that account for browser chrome. Distinguish Chromium mobile-size checks from testing Safari on an actual iPhone.
