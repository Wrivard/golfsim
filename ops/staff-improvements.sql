-- Additive migration. Apply only to the authorized target database.
-- Does not alter bookings, sources, credentials, calendars or existing series.
BEGIN;
CREATE TABLE IF NOT EXISTS gsim_availability_closures (
 id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK (kind IN ('physical','online_until')),
 start_date date NOT NULL, end_date date NOT NULL,
 start_minute integer NOT NULL, end_minute integer NOT NULL,
 bay_ids text[] NOT NULL, title text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (end_date >= start_date),
 CHECK (start_minute >= 0 AND end_minute <= 1440 AND end_minute > start_minute),
 CHECK (cardinality(bay_ids) BETWEEN 1 AND 4 AND bay_ids <@ ARRAY['1','2','3','4']::text[]),
 CHECK (kind <> 'online_until' OR
   (start_date = DATE '1900-01-01' AND start_minute=0 AND end_minute=1440 AND cardinality(bay_ids)=4))
);
CREATE INDEX IF NOT EXISTS gsim_closures_dates ON gsim_availability_closures(start_date,end_date);
CREATE UNIQUE INDEX IF NOT EXISTS gsim_online_until_unique ON gsim_availability_closures(kind) WHERE kind='online_until';
CREATE TABLE IF NOT EXISTS gsim_email_contacts (
 email text PRIMARY KEY, name text NOT NULL, source text NOT NULL,
 marketing_consent boolean NOT NULL DEFAULT false,
 consent_at timestamptz, withdrawn_at timestamptz, consent_evidence text,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (email=lower(trim(email))),
 CHECK (NOT marketing_consent OR (consent_at IS NOT NULL AND consent_evidence IS NOT NULL AND withdrawn_at IS NULL))
);
CREATE TABLE IF NOT EXISTS gsim_email_consent_events (
 id varchar PRIMARY KEY, email text NOT NULL,
 action text NOT NULL CHECK (action IN ('granted','withdrawn')),
 source text NOT NULL, evidence text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gsim_consent_events_email ON gsim_email_consent_events(email);
COMMIT;
