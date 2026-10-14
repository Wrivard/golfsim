---
name: Browser testing availability
description: Handling unavailable testing helpers without sending real emails during verification.
---

The testing helper documented in the local skill can be unavailable: this workspace rejected its documented `testing` configuration. Check actual availability rather than assuming the skill guarantees it.

**Why:** The documented helper failed at startup, while an installed local Chromium and Playwright core successfully verified the contact form.

**How to apply:** If the helper remains unavailable, use the installed browser for interactive checks. Intercept email submissions with controlled responses so failure, retry and success flows can be checked without sending real messages. Browser mocks do not verify real provider delivery.

The public booking date picker must show the complete month on mobile without internal scrolling. Verify it after opening, including a six-week month at reduced viewport heights.

**Why:** The user repeatedly reported a cut-off calendar and explicitly rejected having to scroll within it. Merely checking that the last day becomes selectable after scrolling misses this requirement.

**How to apply:** Assert no internal overflow and that every day is inside the visible viewport before scrolling. Include six-week months, browser chrome, short landscape heights, and viewport resizing while open. Distinguish Chromium mobile-size checks from testing Safari on an actual iPhone.
