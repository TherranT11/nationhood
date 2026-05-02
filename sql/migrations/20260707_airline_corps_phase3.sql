-- ══════════════════════════════════════════════════════════════
-- Airline Corps Phase 3: aircraft acquisition tick.
--
-- corp_aircraft.created_at is wall-clock; the dashboard wants
-- "months of service" in game time. acquired_at_tick lets us
-- compute that directly. Existing rows (no current writers) get
-- NULL — display falls back to "—".
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.corp_aircraft
    ADD COLUMN IF NOT EXISTS acquired_at_tick INT NULL;

COMMENT ON COLUMN public.corp_aircraft.acquired_at_tick IS
  'Tick at which this aircraft entered the airline''s fleet. NULL on legacy rows; future purchase flows must set this for "months of service" display to populate.';

NOTIFY pgrst, 'reload schema';
