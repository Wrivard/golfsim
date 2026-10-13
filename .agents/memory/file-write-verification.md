---
name: File-write verification
description: Verify actual file persistence before executing scripts that mutate external services.
---

**Rule:** A file-edit tool's success response is not sufficient evidence that a new operational script exists on disk.

**Why:** A large file-add reported success but the following type check found no file. Subsequent smaller edits persisted correctly.

**How to apply:** Before running an operational script against an external service, confirm the file exists and passes a type/syntax check. Investigate discrepancies before attempting any external mutation; do not rely on the edit acknowledgment.
