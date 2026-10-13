# Golf SIM — Vercel launch checklist

**Status: code preparation is not a live launch.** No domain or provider setup
is considered verified until the owner supplies the details and the actual
deployment is tested. Do not switch DNS while any launch gate below is pending.
Preserve the existing Neon database, staff accounts and October 14 demo bookings.

**Database update:** The owner approved preparation for **Supabase Free**.
See `docs/SUPABASE-PREPARATION.md` for the staged copy and privacy checklist.
Neon is still active; adding a Supabase secret does not authorize or trigger
cutover. The PostgreSQL client supports both providers.

## 1. Owner inputs

Confirmed by the owner:

| Input | Value |
| --- | --- |
| Custom domain | `golfsimsorel.ca` |
| DNS management | Web Hosting Canada |
| Selected Vercel plan | Hobby/free — owner confirmed; no paid upgrade authorized |
| Contact inbox | `golfsim.soreltracy@gmail.com` |
| Planned primary origin | `https://golfsimsorel.ca` — not a verified live deployment |

**Policy warning:** Vercel restricts Hobby to non-commercial personal use.
The owner has chosen Hobby despite this warning. Technical compatibility with
its limits is not permission for commercial use, and preparation does not
guarantee Vercel will allow continued hosting of this business site.

**Technical choice:** Hobby rejects frequent native cron during deployment.
`vercel.json` therefore has no native cron. Five-minute reconciliation is retained
through the separate free Cloudflare Worker in `ops/calendar-scheduler/`.
It is prepared but not connected or enabled. Do not describe synchronization as
operational until the actual scheduled calls and their outcomes are verified.
No paid subscription or domain transfer is authorized.

Still required:

- Confirm the Vercel project/team and Git repository connection.
- Configure and verify the free external scheduler before launch.
- Confirm whether `www.golfsimsorel.ca` should redirect to the planned apex origin.
- Confirm the Resend account and verified sending subdomain.
- Create the isolated Supabase Free test project and test Google Calendar.
- Approve backup, additive infrastructure migration and eventual cutover.
  Preparing this guide does not apply migrations or authorize live test records.

## 2. Vercel project settings

| Setting | Value |
| --- | --- |
| Root Directory | Repository root, not an individual artifact |
| Framework | Other / no framework preset (`vercel.json` controls the build) |
| Node.js | 22.x |
| Install | `pnpm install --frozen-lockfile --prod=false` |
| Build | `pnpm run build:vercel` |
| Output | `artifacts/golf-sim/dist/public` |
| API | Node function `api/index.ts`, complete Express API |
| Scheduler | Free external Cloudflare Worker calls `/api/jobs/calendar` every five minutes, UTC |

Frontend assets are served by the CDN. `/api/*`, OAuth callback, robots and
sitemap go to the backend; page URLs have their own generated SEO HTML.
The build excludes the design sandbox and staff PDF exports. No Next.js rewrite
or separate API hostname is needed.

Review `docs/vercel.env.example`. Enter secrets directly in Vercel settings.
They must not be committed, displayed in chat, or prefixed with `VITE_`.
Existing Replit secrets do not establish that Vercel is configured.
Production requires a strong `SESSION_SECRET` and `CRON_SECRET` (32+ characters);
enabled Calendar watches also require `CALENDAR_WEBHOOK_SECRET` (32+ characters).
Changing session secrets logs staff out; preserve the existing staff credentials.
`STAFF_ADMIN_PASSWORD` is not used to overwrite existing database password hashes.

## 3. Database and staging isolation

Keep the existing user-managed Neon production branch until the separately
approved Supabase cutover. Follow `docs/SUPABASE-PREPARATION.md` for that target;
do not replace Neon just by copying an environment variable. Connection pools
are bounded; no tables are created on startup.

1. Take a provider backup/snapshot and record a **read-only** data baseline.
2. Create/choose an isolated test database. The selected new target is a separate
   Supabase Free project; an existing Neon staging branch remains a rollback option.
3. Review and run `docs/migrations/001-vercel-runtime.sql` in staging first.
   It adds sessions, distributed rate limits, leases and runtime state only.
4. Configure **Preview** with `PREVIEW_DATABASE_URL`, not the live connection.
   The app refuses to fall back to production or to use the same known branch
   identity, including pooled/direct variants. Supabase isolation compares project
   references, not the shared pooler hostname. Set its production project reference
   in all Vercel scopes, without sharing the production password with Preview.
5. After authorization and staging validation, deliberately apply the same
   additive migration to the confirmed target database. Supabase also requires
   the private-table protection script and a disabled Data API. Do not use
   `push-force`, reset, reseed, or an automatic build migration.

Preview Calendar uses separate `google-preview` token records, not cloned
production OAuth tokens. It is disabled by default. To test it, explicitly
configure `PREVIEW_CALENDAR_ENABLED=true`, a non-primary test
`PREVIEW_CALENDAR_ID`, separate preview Google OAuth credentials and the exact
stable staging callback in `PREVIEW_GOOGLE_REDIRECT_URI`.
The test Calendar ID must differ from any copied live Calendar setting.

Preview email cannot fall back to the business inbox: it requires
`PREVIEW_CONTACT_EMAIL_TO`, an owner-authorized test recipient.
Keep `CONTACT_EMAIL_ENABLED=false` until email testing is authorized.
There is no Vercel cron. Invoke the authenticated job manually in staging, or use
an explicitly isolated test scheduler. Never point a staging worker at production.

### Free scheduler setup

Use a Cloudflare **Workers Free** account for the tiny scheduled caller only.
Do not move WHC nameservers or the website to Cloudflare. At five-minute intervals,
there are approximately 288 ticks/day. Cloudflare currently includes five Cron
Triggers and 100,000 Worker requests/day; the free CPU budget is 10 ms per tick.
Only the HTTPS call and small response check run there; the actual synchronization
runs in Vercel. Network wait time is not CPU time, and scheduled wall time permits
waiting for the Vercel function's maximum duration. Verify actual CPU usage,
Vercel quotas and Neon usage during staging; this is not an unlimited free SLA.

1. Create a Worker using `ops/calendar-scheduler/worker.mjs` and its
   `wrangler.json` configuration, or the equivalent dashboard settings.
   Use the Free plan, turn off public Worker/preview URLs, and do not upgrade.
2. Set `SITE_ORIGIN` to the exact HTTPS origin of the intended deployment.
   Keep `SCHEDULER_ENABLED=false` until the owner approves activation.
3. In Cloudflare's encrypted secret settings, set `CRON_SECRET` to the **same**
   value as the Vercel job secret. Enter it privately; never put it in source,
   a URL, screenshots or chat. No Google credentials or database URL belong there.
4. Set the Cron Trigger to `*/5 * * * *` (UTC). Scheduling changes can take time
   to propagate. Keep the production Worker disabled while testing staging.
5. After the migration, Calendar owner row, Google authorization and custom
   domain are verified and cutover is approved, enable the server Calendar and
   set the Worker flag to `true`. Confirm a scheduled tick, active successful
   response, watch renewal and latest-sync timestamp. Check Cron Events/logs
   for failures; HTTP rejection, disabled Calendar and invalid responses fail
   explicitly. Configure monitoring/alerts in the owner account.

The caller does not follow redirects, preventing a secret from being forwarded
to another hostname. Choose the final canonical origin. The existing database
lease protects overlapping webhook/manual/scheduled calls. A failed tick is not
a completed sync; diagnose it and verify recovery on subsequent ticks.

## 4. Google Calendar configuration and ownership

Use the existing Google Cloud OAuth application for production. Register the
exact `https://golfsimsorel.ca/oauth/google/callback` redirect URI and required
authorized domain. Keep old redirect URIs for rollback until cutover is complete.
Use Google Console production/testing consent settings appropriate to a real
operational account; verify refresh-token longevity and reconnect behavior.

The planned push endpoint is `https://golfsimsorel.ca/api/calendar/webhook`. Watches and
their expiry survive function instances in PostgreSQL. Scheduled maintenance renews watches
before expiry and reconciles the complete three-month event window, including
all pages. Webhook work is awaited before responding and validated against
channel, resource and a stable secret. Five-minute reconciliation covers missed
or debounced notifications; do not promise instant inbound synchronization.

Exactly one durable deployment is allowed to renew/synchronize Calendar. Set its
approved origin in the **correct** database, after approval, using its SQL editor:

```sql
-- Production only, after explicit cutover approval. Use a separate origin in staging.
INSERT INTO gsim_runtime_state (key, value)
VALUES ('calendar-sync-owner', jsonb_build_object('origin', 'https://golfsimsorel.ca'))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
```

Use the staging origin in the staging database, production origin in production.
The job refuses to run for a different durable owner; a lease also prevents
simultaneous cron/webhook/manual reconciliation. Keep `CALENDAR_ENABLED=false`
on Vercel production until cutover is approved.

**Important:** an already-published old server does not automatically understand
this new ownership row. At cutover, stop/disable its old background sync/watch
worker through an owner-controlled change. Do not leave two active importers.
Retain its code/checkpoint for rollback; do not delete the existing booking data.
For long-running Replit compatibility, polling remains available; set a verified
`SITE_URL` if push notifications are required. No development hostname is used
as a production push destination.

## 5. Resend and the contact form

Golf SIM now sends two branded HTML/plain-text emails: the business notification
first, then the customer's acknowledgement (not a confirmed reservation).
Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL=bonjour@kua.quebec`,
`RECIPIENT_EMAIL=golfsim.soreltracy@gmail.com`, and
`CONTACT_EMAIL_ENABLED=true` after authorized verification. The new sender and
recipient names take precedence over the legacy `CONTACT_EMAIL_FROM` and
`CONTACT_EMAIL_TO` aliases. Preview always redirects both messages to
`PREVIEW_CONTACT_EMAIL_TO`. No live sends are performed by automated tests.
Independent idempotency keys cover retries of either message within Resend's
24-hour deduplication window; this does not guarantee eventual inbox delivery.

In production the three Resend variables are sufficient when
`CONTACT_EMAIL_ENABLED` is absent. An explicit `false` remains an emergency
disable switch. Preview still requires explicit enablement and a dedicated test
recipient; it never inherits the production recipient.

### Changing the Google account

Do this outside booking activity. Use **Changer de compte**, read the confirmation,
choose the client's account and grant Calendar permissions. An incomplete consent
does not replace the saved connection. A different account resets the selection to
its primary calendar and detaches old Google event links in one database
transaction, preserving all bookings and leaving old Google events untouched.
Select a writable business calendar before accepting bookings. Old reservations
are not bulk-exported; editing a detached reservation creates its event in the
selected calendar. Disconnecting removes usable tokens but retains account
identity so a same-account reconnect can preserve its existing links.

With the domain redirecting to www, align `SITE_URL`, the approved synchronization
owner and Google's registered redirect URI with `https://www.golfsimsorel.ca`.
The callback is `https://www.golfsimsorel.ca/oauth/google/callback`.
Connecting the client's Google account still requires their interactive consent,
and possibly inclusion as an OAuth test user. The production database selection,
Calendar enablement and external scheduler require separately approved activation.

### Legacy sender-domain setup

Use the existing Resend account. Verify a dedicated sender subdomain, for example
`notifications.golfsimsorel.ca` (proposed, not yet verified). Add **only the DNS values Resend generates**:
DKIM, SPF/Return-Path MX or CNAME as shown in that account.
Do not replace the root MX records for existing mailboxes or add conflicting SPF
records. Review existing authentication records before adding DMARC.

Configure a server-only, appropriately restricted sending API key and:

- `CONTACT_EMAIL_FROM`: plain verified sender address, not the visitor's address.
- `CONTACT_EMAIL_TO`: confirmed business inbox.
- `CONTACT_EMAIL_ENABLED=true`: only after domain verification/testing approval.

The visitor address is Reply-To. Every form field is included as plain text;
the sender/recipient/subject are server-owned. Validation, honeypot and
database-backed request limits protect the endpoint. The controlled player
selection is submitted. Failure preserves the form and shows a real error.
Retries of unchanged content reuse the Resend idempotency key; Resend's window
is 24 hours, not an unlimited exactly-once guarantee.

Provider acceptance is not proof of inbox delivery. Send one explicitly
authorized test, inspect Resend delivery/bounce status and confirm receipt in
the actual inbox; test replying. A group request is not a confirmed booking.
Investigate bounces/configuration failures before enabling the live form.

## 6. Pre-launch validation — actual staging deployment required

- Clean Vercel production build; direct loads/refreshes of all public routes.
- `/api/healthz`, schedule, availability, robots, sitemap and static assets.
- Staff login on HTTPS; reload and different function instances; session expiry,
  logout and signed-out/CSRF rejection. Test real PostgreSQL session persistence,
  not only the isolated SQL-interface regression fixture.
- Client 1–4 hour booking, available day/time, relative “Meilleur choix”, players,
  confirmation and correct assigned bay. No email confirmation promise.
- Admin create/edit date/time/bay/player count, conflict rejection, delete, and
  Toronto times (including dates around daylight-saving changes).
- Simultaneous requests for the same slot; preserve existing transaction locks.
- Calendar create/patch/delete, inbound changes/cancellation, multiple event
  pages, watch expiry/renewal, expired credentials, provider failure/compensation,
  job overlap and recovery after a missed webhook.
- Contact required fields/player selection; server validation, disabled/missing
  sender, provider errors, retry idempotency, actual delivery and Reply-To.
- Production and previews truly use separate databases/calendars/recipients.
- `.local`, `.agents`, `.git`, `.env*`, `@fs` and confidential exports are denied
  and absent from CDN outputs/function uploads. Use a nonsensitive fixture, never
  the staff credential PDF.
- Canonical/OG/schema/sitemap use the exact real domain; private pages noindex;
  preview deployments noindex. Publish a fresh production build, not an unchanged
  preview build with preview noindex metadata.
- Confirm advertised contact-page hours against the saved operating schedule
  with the owner; do not silently change business hours during hosting migration.

The automated launch suite covers booking/scoring/edit regressions, mail payload
and failures, preview branch guards, Toronto/DST conversion, complete pagination,
and sessions shared by separate HTTP apps using an isolated SQL-interface fixture.
It does **not** prove external Neon/Google/Resend/Vercel configuration.

## 7. Owner-approved domain cutover and rollback

Manage the domain records at Web Hosting Canada; a registrar transfer or a
nameserver change is not needed just to point a website at Vercel.
Read-only DNS checks on October 12, 2026 found WHC parking nameservers,
`www` aliasing the apex, and existing MX mail routing. This is not proof that
the Vercel domain is configured. Keep the existing DNS zone and mailbox/forwarding
records; verify that their mail targets remain resolvable after a website change.
Do not use the existing parking address as a Vercel destination.

1. Complete the checks above and document all failures/blockers.
2. Confirm a current backup and schema compatibility with the old deployment.
3. Owner publishes the production Vercel build with production-scoped variables.
4. Obtain exact apex/www DNS records from **that Vercel project**. Preserve email
   records, choose one canonical hostname, configure the other to redirect,
   and verify domain ownership and TLS. No guessed IP addresses.
5. Coordinate retiring old Calendar workers and assigning the new sync owner,
   then enable production Calendar, the external scheduler and the verified contact sender.
6. After DNS propagates, test the actual custom domain on desktop/mobile and
   authorize a small, clearly labelled live smoke-test booking/email.
7. Verify Calendar identity, persistent staff login and mailbox receipt;
   remove only specifically created test records, never the October 14 demo set.
8. Monitor Vercel 5xx/latency and quotas, Neon connections/usage, external scheduler status, latest sync time/watch
   expiry, Resend delivery/bounces and business-inbox receipt.

Rollback: owner restores the previous DNS/deployment, disables the Cloudflare scheduler and new workers,
reassigns synchronization ownership if needed, and restores old service settings.
Keep additive tables and customer records; do not restore an old database snapshot
over newly accepted bookings without explicit review.

## Official references

- https://vercel.com/docs/frameworks/backend/express
- https://vercel.com/docs/cron-jobs/usage-and-pricing
- https://vercel.com/docs/cron-jobs
- https://vercel.com/docs/plans/hobby
- https://resend.com/docs/add-a-domain
- https://resend.com/docs/dashboard/emails/idempotency-keys
- https://developers.cloudflare.com/workers/configuration/cron-triggers/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/platform/pricing/
