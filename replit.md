# Golf SIM Sorel-Tracy

Existing golf simulator website with public reservations, staff booking administration, and Google Calendar synchronization.

## Preservation rules

- Preserve the user-managed Neon database and its data. Do not replace it with a Replit database, reset it, push its schema automatically, or seed customer records.
- Preserve the existing authentication, booking availability rules, Google Calendar behavior, brand assets, and recent copy/link changes.
- Workspace preparation is a port, not a redesign or feature expansion. The staff booking guide belongs in a separate artifact.

## Run & Operate

- Start `artifacts/api-server: API Server` and `artifacts/golf-sim: web` using their managed workflows.
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Do not run a database push for a port. External Neon schema changes require explicit authorization.
- Required secrets: `NEON_DATABASE_URL` (existing database), `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
