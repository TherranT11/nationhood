-- ════════════════════════════════════════════════════════════════════
-- Corp-cull Phase 4c — drop legacy airline tick functions
-- ════════════════════════════════════════════════════════════════════
-- The legacy airline-sector block (the per-corp `process_airline_corp_tick`
-- loop over corp_sector='Airline' factions) was removed from advance-corp-tick
-- in this commit. With it gone, these have zero callers:
--   • process_airline_corp_tick   — legacy per-corp airline resolver
--   • airline_aircraft_ops_cost   — helper, only called inside ^ via SUM(...)
--   • airline_aircraft_seats      — helper, only called inside ^ via SUM(...)
--   • airline_aircraft_value      — legacy loan-collateral helper, already
--                                   callerless
-- The entrepreneur airline system (process_entrepreneur_airline_routes +
-- airline_routes/terminals/cities keyed to entrepreneur_corps) is a separate
-- path and is NOT affected.
--
-- DEPLOY ORDER: deploy advance-corp-tick (without the airline block) BEFORE
-- applying this migration so the tick never calls a dropped function.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.process_airline_corp_tick(uuid, integer);
DROP FUNCTION IF EXISTS public.airline_aircraft_ops_cost(text);
DROP FUNCTION IF EXISTS public.airline_aircraft_seats(text);
DROP FUNCTION IF EXISTS public.airline_aircraft_value(text);

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20260721 (helpers + tick resolver) and its successors
-- (20261019/20260726/20270109 for process_airline_corp_tick; 20260724 for
-- airline_aircraft_value); restore the airline block in advance-corp-tick.
