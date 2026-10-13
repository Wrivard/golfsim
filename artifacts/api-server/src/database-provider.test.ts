import test from "node:test";
import assert from "node:assert/strict";
import { databaseConnection, databaseIdentity } from "@workspace/db/connection";

// Synthetic fixtures only. No database connections or provider writes.
const neon = "postgres://fixture@ep-live.neon.tech/db";
const pooler = (project: string, port = "6543") =>
  `postgresql://postgres.${project}:fixture@aws-0-ca-central-1.pooler.supabase.com:${port}/postgres`;

test("a staged Supabase secret never silently switches the existing Neon database", () => {
  assert.equal(databaseConnection({ NEON_DATABASE_URL: neon, SUPABASE_DATABASE_URL: pooler("live") }), neon);
  assert.throws(() => databaseConnection({ DATABASE_PROVIDER: "supabase", NEON_DATABASE_URL: neon }), /no fallback/);
  assert.throws(() => databaseConnection({ DATABASE_PROVIDER: "typo", NEON_DATABASE_URL: neon }), /Unsupported/);
});

test("explicit Supabase selection uses its URL even while rollback Neon is retained", () => {
  const actual = databaseConnection({
    DATABASE_PROVIDER: "supabase", SUPABASE_DATABASE_URL: pooler("live"), NEON_DATABASE_URL: neon,
  });
  assert.equal(new URL(actual).username, "postgres.live");
  assert.equal(new URL(actual).searchParams.get("sslmode"), "require");
});

test("Supabase projects sharing a pooler host remain distinct", () => {
  const actual = databaseConnection({
    VERCEL: "1", VERCEL_ENV: "preview", DATABASE_PROVIDER: "supabase",
    SUPABASE_DATABASE_URL: pooler("live"), PREVIEW_DATABASE_URL: pooler("staging"),
  });
  assert.equal(new URL(actual).username, "postgres.staging");
});

test("live project is blocked across direct, session and transaction pooler aliases", () => {
  const aliases = [
    pooler("live"),
    pooler("live", "5432"),
    "postgresql://postgres:fixture@db.live.supabase.co:5432/postgres",
    "postgresql://otherrole.live:fixture@aws-1-eu-west-1.pooler.supabase.com:6543/postgres",
  ];
  for (const production of aliases) {
    for (const preview of aliases) {
      assert.throws(() => databaseConnection({
        DATABASE_PROVIDER: "supabase", VERCEL_ENV: "preview",
        SUPABASE_DATABASE_URL: production, PREVIEW_DATABASE_URL: preview,
      }), /different database/);
    }
  }
});

test("preview requires a production reference when the production secret is not in scope", () => {
  const base = {
    DATABASE_PROVIDER: "supabase", VERCEL_ENV: "preview", VERCEL: "1",
    PREVIEW_DATABASE_URL: pooler("staging"),
  };
  assert.throws(() => databaseConnection(base), /PRODUCTION_PROJECT_REF/);
  assert.throws(() => databaseConnection({
    ...base, SUPABASE_PRODUCTION_PROJECT_REF: "staging",
  }), /different database/);
  assert.equal(new URL(databaseConnection({
    ...base, SUPABASE_PRODUCTION_PROJECT_REF: "live",
  })).username, "postgres.staging");
});

test("stale or invalid production references fail closed", () => {
  assert.throws(() => databaseConnection({
    DATABASE_PROVIDER: "supabase", SUPABASE_DATABASE_URL: pooler("live"),
    SUPABASE_PRODUCTION_PROJECT_REF: "wrong",
  }), /do not match/);
  assert.throws(() => databaseConnection({
    DATABASE_PROVIDER: "supabase", SUPABASE_PRODUCTION_PROJECT_REF: "live?anything",
    VERCEL_ENV: "preview", PREVIEW_DATABASE_URL: pooler("staging"),
  }), /public reference/);
});

test("Vercel requires the free IPv4-compatible shared transaction pooler", () => {
  for (const url of [pooler("live", "5432"), "postgres://postgres@db.live.supabase.co:5432/postgres"]) {
    assert.throws(() => databaseConnection({
      DATABASE_PROVIDER: "supabase", VERCEL: "1", SUPABASE_DATABASE_URL: url,
    }), /Transaction pooler/);
  }
  assert.doesNotThrow(() => databaseConnection({
    DATABASE_PROVIDER: "supabase", VERCEL: "1", SUPABASE_DATABASE_URL: pooler("live"),
  }));
});

test("Supabase URLs require TLS and reject accidental provider or username mistakes", () => {
  for (const mode of ["disable", "prefer", "allow", "no-verify"]) {
    assert.throws(() => databaseConnection({
      DATABASE_PROVIDER: "supabase", SUPABASE_DATABASE_URL: `${pooler("live")}?sslmode=${mode}`,
    }), /encrypted TLS/);
  }
  const verified = `${pooler("live")}?sslmode=verify-full`;
  assert.equal(databaseConnection({ DATABASE_PROVIDER: "supabase", SUPABASE_DATABASE_URL: verified }), verified);
  assert.throws(() => databaseConnection({ DATABASE_PROVIDER: "supabase", SUPABASE_DATABASE_URL: neon }), /must be a Supabase/);
  assert.throws(() => databaseIdentity("postgres://postgres:fixture@aws-0-ca-central-1.pooler.supabase.com:6543/postgres"), /complete Supabase/);
});

test("bad connection values never appear in error messages", () => {
  const privateFixture = "not-a-url-with-a-private-fixture";
  assert.throws(() => databaseIdentity(privateFixture), error =>
    error instanceof Error && !error.message.includes(privateFixture));
  assert.throws(() => databaseIdentity("https://fixture.invalid/db"), /valid PostgreSQL/);
});
