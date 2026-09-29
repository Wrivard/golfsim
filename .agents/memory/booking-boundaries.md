---
name: Booking optimization boundaries
description: User-approved boundaries for reducing agenda gaps without changing business rules.
---

Optimize bay assignment and recommendations, not eligibility. Preserve whole-hour starts on bays 1–2, existing start rules on bays 3–4, and public durations of 1–4 whole hours. Do not hide otherwise valid times solely because they leave gaps.

**Why:** The user explicitly prefers customer choice and existing business rules over aggressive gap prevention.

**How to apply:** Score usable capacity and newly introduced waste, while treating existing validity checks as a separate compatibility constraint.

Leave the existing closing-time/cutoff behavior unchanged unless separately authorized, including the known discrepancy between configured schedule and final-submit closing checks.

**Why:** The discrepancy was explained and the user explicitly requested retaining current behavior during optimization.

**How to apply:** Do not bundle a closing-time correction with scoring changes.

Staff enter ordinary phone reservations through the public site; business-rule exceptions are made through Google Calendar only, not a new website override.

**Why:** This is the user's chosen staff workflow.

**How to apply:** Do not add admin override controls as part of optimization. Any confirmation-time reassignment must clearly display the final bay.