---
name: Overnight operating-hours ceiling
description: The business's confirmed maximum closing time and how late bookings fit within it.
---

Operating hours and the admin calendar must never extend beyond 02:00 the following day. The latest-reservation time limits the booking's start; it does not limit its end. A booking may end after the latest-start cutoff, but it must finish by the 02:00 closing limit.

**Why:** The user explicitly stated that the business never operates later than 02:00 and asked why the calendar extended to 07:00.

**How to apply:** Cap schedule controls, server availability, and calendar display at 02:00. Do not rewrite production schedule rows as part of a code-only release; normalize legacy values in application reads.

For the admin calendar's compact default view, the user now wants to hide the next-day hourly rows and clip bookings at midnight with an open bottom edge to show continuation. This is a display preference, not a change to the actual 02:00 operating limit.

**Why:** The user finds the hours and short reservations too compressed on laptops and wants only a modest increase in vertical space.

**How to apply:** Preserve actual times and overnight access in booking details; do not shorten or delete bookings when changing the visible grid.
