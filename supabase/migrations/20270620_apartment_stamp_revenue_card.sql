-- ════════════════════════════════════════════════════════════════════
-- 20270620 — Apartments: stamp last_tick_revenue / last_revenue_tick
--
-- Fourth in the bypass-the-ledger sweep (20270605 oil & gas,
-- 20270616 airlines, 20270618 shipping). process_apartment_rents
-- credits each completed apartment's net rent to
-- entrepreneur_corps.treasury_cash but doesn't stamp the two
-- columns the Revenue Change card reads. A construction corp
-- earning $X/tick from one or more apartments shows "$0 · no
-- data yet" on the card — same diagnosis as the prior three.
--
-- Body lifted verbatim from 20270617 (the tier multiplier
-- version) except for the per-building UPDATE on
-- entrepreneur_corps, which now stamps the two columns alongside
-- the treasury credit. Multi-iteration CASE aggregation matches
-- airlines (20270616) and shipping (20270618): a construction
-- corp owning N apartments hits the UPDATE N times per tick — the
-- CASE accumulates the per-building net rent into one stamp
-- instead of letting each iteration overwrite the previous one.
--
-- Apply after 20270619.
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
    v_occ_mult    numeric;
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

        -- 20270617: tier multiplier. Lockstep with
        -- js/utils.js APARTMENT_DEFS.occMult.
        v_occ_mult := CASE v_b.building_type
            WHEN 'apartment_basic'  THEN 1.00
            WHEN 'apartment_modest' THEN 0.85
            WHEN 'apartment_luxury' THEN 0.65
            ELSE                         1.00
        END;

        v_sol  := COALESCE(v_b.standard_of_living,   50);
        v_inf  := COALESCE(v_b.infrastructure,       50);
        v_stab := COALESCE(v_b.politician_stability, 50);

        v_gross := v_base_rent::numeric * (v_sol + v_inf) / 100.0;
        v_occ   := GREATEST(0.4, LEAST(1.0, v_stab * v_occ_mult / 100.0));
        v_maint := v_base_rent::numeric * (100.0 - v_inf) / 200.0;
        v_net   := ROUND(v_gross * v_occ - v_maint)::bigint;

        -- 20270620: stamp last_tick_revenue + last_revenue_tick
        -- alongside the treasury credit so the Revenue Change card
        -- has data to read. CASE aggregates across multiple
        -- apartments owned by the same corp in one tick — same
        -- pattern as airlines (20270616) and shipping (20270618).
        UPDATE entrepreneur_corps
           SET treasury_cash     = COALESCE(treasury_cash, 0) + v_net,
               last_tick_revenue = CASE
                   WHEN last_revenue_tick = p_tick
                        THEN COALESCE(last_tick_revenue, 0) + v_net
                   WHEN v_net <> 0
                        THEN v_net
                   ELSE last_tick_revenue
               END,
               last_revenue_tick = CASE
                   WHEN last_revenue_tick = p_tick THEN p_tick
                   WHEN v_net <> 0                 THEN p_tick
                   ELSE last_revenue_tick
               END,
               updated_at = now()
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
