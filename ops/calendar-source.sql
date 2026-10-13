BEGIN;
SELECT pg_advisory_xact_lock(73401922);
CREATE TABLE IF NOT EXISTS gsim_calendar_sources (
  source_key text PRIMARY KEY,
  ready boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS gsim_booking_sources (
  booking_id varchar PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
  source_key text NOT NULL REFERENCES gsim_calendar_sources(source_key)
);
CREATE INDEX IF NOT EXISTS gsim_booking_sources_source_idx ON gsim_booking_sources(source_key);
ALTER TABLE gsim_calendar_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsim_booking_sources ENABLE ROW LEVEL SECURITY;
-- Attach legacy rows only once to the account/calendar that owned them before
-- rollout. Unmapped rows without a known account remain hidden, never reassigned.
INSERT INTO gsim_calendar_sources(source_key)
SELECT concat_ws(chr(31),t.provider,lower(t.email),
  CASE WHEN lower(coalesce(c.calendar_id,'primary'))=lower(t.email)
    THEN 'primary' ELSE coalesce(c.calendar_id,'primary') END)
FROM oauth_tokens t LEFT JOIN LATERAL
  (SELECT calendar_id FROM calendar_settings LIMIT 1) c ON true
WHERE t.email IS NOT NULL AND t.provider='google'
AND NOT EXISTS(SELECT 1 FROM gsim_calendar_sources)
ON CONFLICT DO NOTHING;
INSERT INTO gsim_booking_sources(booking_id,source_key)
SELECT b.id,s.source_key FROM bookings b CROSS JOIN gsim_calendar_sources s
WHERE (SELECT count(*) FROM gsim_calendar_sources)=1
AND NOT EXISTS(SELECT 1 FROM gsim_booking_sources)
AND b.calendar_event_id IS NOT NULL
AND NOT EXISTS(SELECT 1 FROM gsim_calendar_sources WHERE source_key='__legacy_migration_complete__')
ON CONFLICT DO NOTHING;
INSERT INTO gsim_calendar_sources(source_key) VALUES('__legacy_migration_complete__') ON CONFLICT DO NOTHING;
COMMIT;
