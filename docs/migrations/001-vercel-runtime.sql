-- OWNER-REVIEWED, ADDITIVE ONLY. Run in the confirmed isolated staging DB first.
-- Take a backup before applying to the confirmed external PostgreSQL DB.
-- This file is NOT executed at build/startup/request time.
BEGIN;
CREATE TABLE IF NOT EXISTS gsim_sessions (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS gsim_sessions_expiry ON gsim_sessions(expires_at);
CREATE TABLE IF NOT EXISTS gsim_rate_limits (
  key text PRIMARY KEY,
  hits integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS gsim_rate_limits_expiry ON gsim_rate_limits(expires_at);
CREATE TABLE IF NOT EXISTS gsim_job_leases (
  name text PRIMARY KEY,
  owner text NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS gsim_runtime_state (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
