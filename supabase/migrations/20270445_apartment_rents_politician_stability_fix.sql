-- ════════════════════════════════════════════════════════════════════
-- Fix process_apartment_rents — column is politician_stability
--
-- Phase 2 of Real Estate (20270438) read nation.stability for apartment
-- occupancy. That column doesn't exist on the live nations table —
-- 20270361 added politician_stability as the politician-side score
-- and the original `stability` column was retired with it (the
-- legacy work_schema.sql still lists `stability` but production
-- runs the renamed version).
--
-- Symptom: every entrepreneur corp page erroring with
--   "[entrepreneur-corp] buildings fetch error: column nations_1.stability
--    does not exist"
-- because the corp_buildings embed asked PostgREST for the same
-- non-existent column. process_apartment_rents would have silently
-- failed at every per-tick run with the same column-missing error.
--
-- This migration is a single-line rebody: SELECT n.politician_stability
-- instead of n.stability. All other lines of process_apartment_rents
-- are byte-identical to the 20270439 lock-scope-fix version.
--
-- (process_oil_and_gas, 20270443, doesn't reference stability — only
-- standard_of_living + infrastructure — so it's unaffected.)
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.process_apartment_rents(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_b           RECORD;
    v_base_rent   bigint;
    v_sol         numeric;
    v_inf         numeric;
    v_stab        numeric;
    v_gross       numeric;
    v_occ         numeric;
    v_maint       numeric;
    v_net         bigint;
    v_count       int    := 0;
    v_total_net   bigint := 0;
BEGIN
    FOR v_b IN
        SELECT b.id, b.owner_corp_id, b.building_type, b.nation_id,
               n.standard_of_living, n.infrastructure, n.politician_stability
          FROM corp_buildings b
          JOIN nations n ON n.id = b.nation_id
         WHERE b.building_type IN ('apartment_basic', 'apartment_modest', 'apartment_luxury')
           AND b.status = 'completed'
           AND b.owner_corp_id IS NOT NULL
           AND (b.last_processed_tick IS NULL OR b.last_processed_tick <> p_tick)
         FOR UPDATE OF b
    LOOP
        v_base_rent := CASE v_b.building_type
            WHEN 'apartment_basic'  THEN 40000
            WHEN 'apartment_modest' THEN 90000
            WHEN 'apartment_luxury' THEN 250000
        END;

        v_sol  := COALESCE(v_b.standard_of_living,   50);
        v_inf  := COALESCE(v_b.infrastructure,       50);
        v_stab := COALESCE(v_b.politician_stability, 50);

        v_gross := v_base_rent::numeric * (v_sol + v_inf) / 100.0;
        v_occ   := GREATEST(0.4, LEAST(1.0, v_stab / 100.0));
        v_maint := v_base_rent::numeric * (100.0 - v_inf) / 200.0;
        v_net   := ROUND(v_gross * v_occ - v_maint)::bigint;

        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_net
         WHERE id = v_b.owner_corp_id;

        UPDATE corp_buildings
           SET last_processed_tick = p_tick
         WHERE id = v_b.id;

        v_count     := v_count + 1;
        v_total_net := v_total_net + v_net;
    END LOOP;

    RETURN jsonb_build_object(
        'success',         true,
        'tick',            p_tick,
        'apartments_run',  v_count,
        'total_net_rent',  v_total_net
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_apartment_rents(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_apartment_rents(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
