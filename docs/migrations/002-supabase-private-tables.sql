-- SUPABASE TARGET ONLY. Owner-reviewed and manually applied; never auto-run.
-- Disable the project's Data API BEFORE importing any data.
-- Run AFTER the core tables and 001-vercel-runtime.sql are present.
-- The existing Neon source is never modified by this script.
BEGIN;
DO $$
DECLARE
  table_name text;
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Use the Supabase postgres owner connection for this step';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    RAISE EXCEPTION 'Expected Supabase roles are absent; stop and verify the target';
  END IF;
  FOREACH table_name IN ARRAY ARRAY[
    'bookings', 'admin_users', 'calendar_settings', 'oauth_tokens', 'operating_schedule',
    'gsim_sessions', 'gsim_rate_limits', 'gsim_job_leases', 'gsim_runtime_state'
  ] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      RAISE EXCEPTION 'Required application table % is missing', table_name;
    END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated, service_role',
      table_name
    );
  END LOOP;
END $$;
-- No public policies are created. The Express server uses the postgres owner
-- connection; the existing staff login remains the authorization boundary.
-- Do not FORCE RLS or switch to Supabase Auth as part of this migration.
COMMIT;
