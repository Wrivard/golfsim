---
name: Artifact lifecycle
description: Ownership and removal of managed artifact workflows.
---

Managed artifact workflows cannot be removed independently with `removeWorkflow`; removing their owning artifact directory automatically removes its registration and workflow.

**Why:** The workflow callback rejects managed-service removal. Artifact discovery then removed both the registered guide and its workflow when its directory was deleted.

**How to apply:** Only after explicit user authorization, stop the artifact's service and remove its scoped directory. Preserve unrelated artifacts and exported files outside it. Verify the artifact list and remaining workflows rather than assuming a stopped service has removed the artifact.
