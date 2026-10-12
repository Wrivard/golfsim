# Golf SIM — Vercel launch checklist

**Status: code preparation is not a live launch.** No domain or provider setup
is considered verified until the owner supplies the details and the actual
deployment is tested. Do not switch DNS while any launch gate below is pending.
Preserve the existing Neon database, staff accounts and October 14 demo bookings.

## 1. Owner inputs

Confirmed by the owner:

| Input | Value |
| --- | --- |
| Custom domain | `golfsimsorel.ca` |
| DNS management | Web Hosting Canada |
| Current Vercel plan | Hobby — launch blocked pending hosting decision |
| Contact inbox | `golfsim.soreltracy@gmail.com` |
| Planned primary origin | `https://golfsimsorel.ca` — not a verified live deployment |

**Hosting gate:** Vercel Hobby is restricted to non-commercial personal use.
It also rejects cron schedules more frequent than once daily during deployment.
The configured five-minute Calendar reconciliation requires Pro/Enterprise.
Do not silently remove reconciliation to make a Hobby deployment pass, or
purchase/upgrade a plan without the owner's action. If a different host is
chosen, review its runtime and scheduler before adapting the launch plan.

Still required:

- Confirm the Vercel project/team, Git repository connection and eligible plan.
- Confirm whether `www.golfsimsorel.ca` should redirect to the planned apex origin.
- Confirm the Resend account and verified sending subdomain.
- Approve the isolated Neon staging branch and test Google Calendar.
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
| Cron | `/api/jobs/calendar`, every five minutes, UTC |

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

Keep the existing user-managed Neon production branch. Prefer its provider-issued
pooled URL. Connection pools are bounded; no tables are created on startup.

1. Take a provider backup/snapshot and record a **read-only** data baseline.
2. Create/choose an isolated staging branch using the owner's Neon account.
3. Review and run `docs/migrations/001-vercel-runtime.sql` in staging first.
   It adds sessions, distributed rate limits, leases and runtime state only.
4. Configure **Preview** with `PREVIEW_DATABASE_URL`, not the live connection.
   The app refuses to fall back to production or to use the same known branch
   hostname, including pooled/direct variants.
5. After authorization and staging validation, deliberately apply the same
   additive migration to the confirmed production branch. Do not use
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
Vercel cron runs on production deployments only; invoke the authenticated job
manually during staging tests rather than assuming preview cron runs.

## 4. Google Calendar configuration and ownership

Use the existing Google Cloud OAuth application for production. Register the
exact `https://golfsimsorel.ca/oauth/google/callback` redirect URI and required
authorized domain. Keep old redirect URIs for rollback until cutover is complete.
Use Google Console production/testing consent settings appropriate to a real
operational account; verify refresh-token longevity and reconnect behavior.

The planned push endpoint is `https://golfsimsorel.ca/api/calendar/webhook`. Watches and
their expiry survive function instances in PostgreSQL. Cron renews watches
before expiry and reconciles the complete three-month event window, including
all pages. Webhook work is awaited before responding and validated against
channel, resource and a stable secret. Five-minute reconciliation covers missed
or debounced notifications; do not promise instant inbound synchronization.

Exactly one durable deployment is allowed to renew/synchronize Calendar. Set its
approved origin in the **correct** database, after approval, using Neon SQL:

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
   then enable production Calendar and the verified contact sender.
6. After DNS propagates, test the actual custom domain on desktop/mobile and
   authorize a small, clearly labelled live smoke-test booking/email.
7. Verify Calendar identity, persistent staff login and mailbox receipt;
   remove only specifically created test records, never the October 14 demo set.
8. Monitor Vercel 5xx/latency, Neon connections, cron status, latest sync time/watch
   expiry, Resend delivery/bounces and business-inbox receipt.

Rollback: owner restores the previous DNS/deployment, disables the new workers,
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
