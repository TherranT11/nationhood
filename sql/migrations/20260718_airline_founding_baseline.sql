-- 20260718_airline_founding_baseline.sql
--
-- Bring all existing airlines up to the new founding baseline:
--
--   corp_innovation       = 5
--   corp_market_share     = 1
--   corp_assets           = 2
--   corp_reputation       = 1
--   corp_employee_wages   = 5
--   corp_productivity     = 5
--   corp_op_safety        = 10
--   corp_aircraft         ≥ 2 regional (top up if short)
--
-- Ownership (100%) is already auto-seeded by trg_corp_ownership_auto_seed
-- whenever a corporation row is inserted, so no work needed there.
--
-- The aircraft top-up only INSERTs the difference vs. existing regional
-- count, so re-running this migration is idempotent and won't double-grant
-- planes to airlines that already had some.

BEGIN;

-- ── 1. stat baseline ──
UPDATE public.factions
SET corp_innovation     = 5,
    corp_market_share   = 1,
    corp_assets         = 2,
    corp_reputation     = 1,
    corp_employee_wages = 5,
    corp_productivity   = 5,
    corp_op_safety      = 10
WHERE faction_type = 'corporation'
  AND corp_sector  = 'Airline'
  AND abandoned_at IS NULL;

-- ── 2. starter fleet top-up to 2 regional aircraft ──
DO $$
DECLARE
    v_corp   RECORD;
    v_have   INT;
    v_need   INT;
BEGIN
    FOR v_corp IN
        SELECT id
          FROM public.factions
         WHERE faction_type = 'corporation'
           AND corp_sector  = 'Airline'
           AND abandoned_at IS NULL
    LOOP
        SELECT COUNT(*) INTO v_have
          FROM public.corp_aircraft
         WHERE corp_id = v_corp.id
           AND aircraft_class = 'regional';

        v_need := 2 - v_have;
        IF v_need > 0 THEN
            INSERT INTO public.corp_aircraft (corp_id, aircraft_class, condition)
            SELECT v_corp.id, 'regional', 100
              FROM generate_series(1, v_need);
        END IF;
    END LOOP;
END $$;

-- ── 3. resync corp_fleet to match owned aircraft (Regional=1, Narrowbody=2,
--      Widebody=3 fleet slots — see 20260704_airline_corps_phase1.sql).
UPDATE public.factions f
SET corp_fleet = COALESCE(slot_totals.total, 0)
FROM (
    SELECT corp_id,
           SUM(fleet_slots) AS total
      FROM public.corp_aircraft
     GROUP BY corp_id
) slot_totals
WHERE f.id = slot_totals.corp_id
  AND f.faction_type = 'corporation'
  AND f.corp_sector  = 'Airline';

COMMIT;
