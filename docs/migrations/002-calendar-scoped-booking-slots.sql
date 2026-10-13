-- Keep historical reservations from disconnected calendars without letting
-- their slots block the active account. No reservations or sources are deleted.
-- Booking creation/editing retains its existing advisory transaction locks
-- and active-calendar conflict checks.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE INDEX IF NOT EXISTS bookings_slot_lookup
  ON public.bookings (bay_type, date, "time");
DROP INDEX IF EXISTS public.unique_booking_slot;
COMMIT;
