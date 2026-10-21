---
name: Overnight operating-hours ceiling
description: The business's confirmed maximum closing time and how late bookings fit within it.
---

Operating hours and the admin calendar must never extend beyond 02:00 the following day. The latest-reservation time limits the booking's start; it does not limit its end. A booking may end after the latest-start cutoff, but it must finish by the 02:00 closing limit.

**Why:** The user explicitly stated that the business never operates later than 02:00 and asked why the calendar extended to 07:00.

**How to apply:** Cap schedule controls, server availability, and calendar display at 02:00. Do not rewrite production schedule rows as part of a code-only release; normalize legacy values in application reads.
