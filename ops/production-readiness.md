# Golf SIM — release verification

## Automated checks

```sh
pnpm test:launch
pnpm run typecheck
SITE_URL=https://www.golfsimsorel.ca pnpm build:vercel
pnpm --filter @workspace/scripts exec tsx ../ops/verify-staff-data.mjs
pnpm --filter @workspace/scripts exec tsx ../ops/verify-production-readiness.mjs
```

The SQL scripts require a separate development `DATABASE_URL`. They refuse the
production database identity, create randomly named isolated schemas, and drop
only their own schemas in `finally`. No production migrations are needed for
these fixes.

The readiness script exercises the actual HTTP route handlers and PostgreSQL:
manual creation, duplication, bay moves, partial overlaps, concurrent attempts,
off-grid rejection, closures/reopening/cutoff, recurring season bounds, email
capture, withdrawal, verified historical import, account/calendar isolation,
and failure compensation. Authentication is a test-only session fixture;
production session behavior is tested separately by `staff-auth-flow.test.ts`.

Google Calendar is a provider fixture in these integration tests. It returns
absolute timestamps like Google, including timezone normalization. External
HTTP is blocked so neither Google nor email recipients receive test data.
Passing tests establish SQL persistence and provider-boundary behavior, not a
successful mutation of the live client calendar.

An imported duration such as `1h30` is retained during contact edits and moves.
The edit dialog displays its current duration and omits unchanged time/duration
from the PATCH-like update, rather than silently converting historical data.

## Privacy and historical contacts

Public occupancy is whitelisted to anonymous occupancy IDs, bay, start and end.
The legacy batch endpoint returns 410 without entering SQL/Google booking code.
The legacy full reservation list requires staff authentication.

Historical import is an explicit two-step admin operation: read-only preview,
then confirmation of its fingerprint. It uses only the active account/calendar
and verifies the application's private booking marker against the local booking
and Google event ID. Attendees and free-form text are not provenance.

Records without that proof are excluded, even if their emails look legitimate.
Never relax this into a blind import of personal calendar attendees. Any
alternative historical validation requires a separate, explicitly approved
review of the actual customer records. Existing consent/withdrawal information
is preserved; historical import sends no mail and grants no marketing consent.

Correcting a reservation's contact details captures the new address without
granting consent. Direct customer withdrawal requests can be recorded in the
admin contact bank, with a mandatory reason and audit event.

## Deployment boundary

Before calling a release verified:

1. Run the build on Node 22, matching Vercel's configured runtime.
   In Nix, verify the pnpm launcher's runtime too: a fixed shebang can ignore
   PATH. Invoke the CLI/compiler/bundler with the actual Node 22 binary when
   necessary.
2. Publish the tested code on Vercel; a local preview is not production.
3. Confirm `/sitemap.xml`, `/robots.txt`, public booking, admin authentication,
   and the selected Google calendar on that deployment.
4. Confirm `/api/book/batch` returns 410 and private routes return 401 when
   signed out. Never attempt a real double booking to test the protection.
5. If a real Calendar write test is needed, obtain permission and use an
   explicitly isolated test calendar/reservation, with cleanup.

No production backfill or live booking mutation is authorized merely by running
these test scripts. Owner-level read access to Google does not prove delivery of
a booking email or success of a future Calendar write.
