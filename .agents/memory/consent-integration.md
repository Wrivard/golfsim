---
name: Consent integration boundaries
description: Why tracking is gated while the booking application remains independent of consent.
---

Use basic consent gating for the tracking container, rather than loading it before the visitor chooses and assuming every third-party tag respects consent.

**Why:** A default-denied Google consent state does not by itself prevent non-Google tags from executing. Loading the container only after statistics or marketing consent reduces that risk; the container's individual tag consent checks still require configuration.

Do not let the no-JavaScript fallback bypass the consent gate, and do not block the essential booking application when tracking consent is refused.

**Why:** A static GTM iframe with a live source would contact Google without consent and would ignore the JavaScript-based development hostname guard. The React application must remain usable regardless of tracking choices.

**How to apply:** Preserve these boundaries when changing Cookiebot/GTM initialization or the HTML entry point. Do not claim that successful development tests verify the external Cookiebot domain registration, published GTM tags, or legal compliance.

Check essential-script consent exemptions in the final production HTML, including generated SEO pages, not only in the source entry point.

**Why:** Vite rebuilt the module script tag without its custom consent attribute even though development preserved it. This could let automatic blocking prevent the app from starting only after publication.
