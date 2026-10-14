-- Apply only to an authorized database. Preserves every existing restriction,
-- booking and calendar. Allows date-bounded online restrictions while retaining
-- full-day/all-bay validation and the single-online-restriction index.
BEGIN;
SET LOCAL lock_timeout = '5s';
DO $migration$
DECLARE
  old_check record;
  target regclass := 'gsim_availability_closures'::regclass;
BEGIN
  FOR old_check IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = target AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%1900-01-01%'
      AND pg_get_constraintdef(oid) LIKE '%online_until%'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', target, old_check.conname);
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = target
      AND conname = 'gsim_online_period_full_day') THEN
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT gsim_online_period_full_day
      CHECK (kind <> ''online_until'' OR
        (start_minute = 0 AND end_minute = 1440 AND cardinality(bay_ids) = 4))', target);
  END IF;
END $migration$;
COMMIT;
