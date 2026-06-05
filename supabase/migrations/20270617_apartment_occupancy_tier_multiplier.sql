-- ════════════════════════════════════════════════════════════════════
-- 20270617 — Apartment occupancy: tier multiplier (luxury < basic)
--
-- User reported all three apartment tiers projecting 91% occupancy
-- in Avelia. Not a bug — the occupancy formula was a pure function
-- of nation politician_stability, no tier input — but flagged as a
-- design weakness: realistically a luxury unit serves a smaller
-- renter pool than a basic one, and modelling them as equally
-- occupied means players weigh purely on rent-per-unit vs. cost
-- with no demand ceiling on the high tier.
--
-- Fix: introduce a tier multiplier applied INSIDE the clamp, so
-- the existing 0.4 floor still holds in low-stab nations and the
-- math doesn't go negative anywhere. Multipliers in lockstep with
-- js/utils.js APARTMENT_DEFS.occMult (single source per the
-- existing "Keep them in sync" comment on that map).
--
--   basic   → stab × 1.00 / 100 (clamped 0.4..1.0)  → unchanged
--   modest  → stab × 0.85 / 100 (clamped 0.4..1.0)
--   luxury  → stab × 0.65 / 100 (clamped 0.4..1.0)
--
-- A nation at stab=91 now projects 91% / 77% / 59% for basic /
-- modest / luxury — meaningful differentiation. A nation at
-- stab=50 projects 50% / 42.5% / 40% (luxury clamps to the floor
-- earlier than the others). A nation at stab≤47 floors all three
-- tiers to 40% (the same 0.4 floor the original formula has had
-- since 20270438).
--
-- Body otherwise byte-identical to 20270445 (the politician_stability
-- rename version) — same JOIN, same rent base table, same UPDATE
-- to entrepreneur_corps treasury, same per-building tick stamp.
-- Only v_occ derivation changes (multiply by v_occ_mult before the
-- clamp).
--
-- Apply after 20270616.
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
