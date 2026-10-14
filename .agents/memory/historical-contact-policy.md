---
name: Historical customer contacts
description: Approval and provenance requirements for importing historical customer emails.
---

Historical email imports require verified customer-reservation provenance, must exclude unrelated personal-calendar attendees, and must never infer marketing consent.

**Why:** The user explicitly required a safe, idempotent import of verified reservations without importing unrelated personal-calendar attendees or overwriting consent/withdrawal records.

**How to apply:** Keep imports bounded to the selected account/calendar. Show the expected record count and obtain approval before any production import. If historical provenance cannot be established, exclude the records rather than silently treating them as customers. Preserve existing consent and withdrawal evidence.
