-- ════════════════════════════════════════════════════════════════════
-- Audit fix on 20270438: scope FOR UPDATE to corp_buildings only
--
-- 20270438's rent loop did `SELECT ... FROM corp_buildings b JOIN
-- nations n ... FOR UPDATE`. Without an explicit `OF b` clause,
-- PostgreSQL locks rows in BOTH tables — including the joined nations
-- row. Nations rows are written by advance-tick (national stats);
-- holding row locks on them during the apartment rent pass forces
-- advance-tick to wait if it happens to overlap.
--
-- The intent was always to serialize the per-building work, not the
-- nation. Adding `OF b` narrows the lock to the corp_buildings row,
-- which is what the idempotency guarantee actually requires. Nation
-- stats are READ-ONLY during the loop body anyway.
--
-- Pure function rewrite — same body as 20270438 except for the one
-- `FOR UPDATE` line. Bodies stay byte-identical otherwise.
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
               n.standard_of_living, n.infrastructure, n.stability
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

        v_sol  := COALESCE(v_b.standard_of_living, 50);
        v_inf  := COALESCE(v_b.infrastructure,    50);
        v_stab := COALESCE(v_b.stability,         50);

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
