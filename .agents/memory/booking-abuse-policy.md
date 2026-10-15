---
name: Public booking abuse protection
description: Scope, security claims and release constraints for public reservation anti-abuse measures.
---

Apply public anti-abuse limits to the customer booking flow, not staff-created bookings or recurring leagues.

**Why:** Staff legitimately create many sessions in one operation; public spam controls must not interrupt that work.

**How to apply:** Keep staff authentication intact and outside customer submission quotas when adding more protection.

Do not describe signed form tokens, waiting periods or hidden fields as proof that a visitor is human.

**Why:** Automated browsers can fetch tokens and wait. These controls reduce basic automation and repeated submissions, but do not replace a provider-verified CAPTCHA against more advanced attacks.

**How to apply:** Explain the distinction accurately when reviewing or strengthening protection.

Release changes to the public booking protection protocol in the frontend and API together.

**Why:** Older open browser tabs may lack the newly required request headers and need a page reload; deploying only one side can prevent legitimate booking.

**How to apply:** Verify the complete client/server journey and include reload guidance for old tabs during rollout.
