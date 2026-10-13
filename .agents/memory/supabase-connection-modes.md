---
name: Supabase connection modes
description: Distinguish dedicated and shared poolers without misdiagnosing a valid endpoint.
---

**Rule:** Determine the connection mode from both hostname and port. `db.[PROJECT-REF].supabase.co:6543` is a dedicated transaction pooler, not a direct connection. Direct connections use that hostname on port `5432`.

**Why:** A real Supabase Connect export showed the dedicated pooler. Misclassifying its hostname as a direct connection led to repeated requests for the same credential without explaining the actual Free-plan limitation.

**How to apply:** For Golf SIM's Free + Vercel target, request the shared transaction pooler: its host ends in `.pooler.supabase.com`, its port is `6543`, and its username includes the project reference. Copy the provider-issued hostname; region alone cannot identify its pooler cluster. Supabase documents the dedicated pooler as paid-plan only and IPv6 unless the paid IPv4 add-on is enabled. Do not infer the user's actual plan merely because the dashboard displays that option.

**Dashboard UI:** The user's Connect dialog has a **Use IPv4 connection** switch below the connection-method choices. With **Transaction pooler** selected, enable that switch to select the shared pooler; its help text explicitly says “Uses the shared pooler.” This switch is distinct from the paid **Enable IPv4 add-on** button farther down.

**Why:** Asking the user to choose Transaction pooler again did not help: it was already selected, but this dialog showed the dedicated endpoint until the separate switch was enabled.

**TLS diagnostics:** Through the shared pooler, PostgreSQL's SSL statistics describe the pooler-to-Postgres hop, not necessarily the application's connection to the pooler. Verify the application's actual TLS socket is encrypted and its server certificate authorized before interpreting those statistics.

**Why:** A read-only test reported PostgreSQL-side SSL false while the application's socket was encrypted with an authorized server certificate. Treating the SQL statistic as proof of an unencrypted client connection would misdiagnose the verified connection.
