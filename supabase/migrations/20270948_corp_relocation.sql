-- ════════════════════════════════════════════════════════════════════
-- 20270948 — Corp relocation: move HQ to a new nation + city
--
-- A corp owner picks a destination nation + city and moves the HQ there.
--   • Cost (from treasury_cash):
--       $1M × (sum_of_5_asset_tiers + 1) × (destSoL / 50)
--             × GREATEST(0.5, 1 − destUnemployment / 20)
--     Bigger firms and richer destinations cost more; a high-unemployment
--     city discounts the move (idle labor wants the jobs).
--   • Unemployment swing = (sum_of_5_asset_tiers / 3) + 1, integer. The
--     destination city DROPS by that (the corp brings jobs); the origin
--     city RISES back by the same (the jobs leave with it). cities.unemployment
--     is 1–10 (low is good), so both ends clamp into that band.
--   • 12-tick cooldown before the same corp can relocate again, so the
--     unemployment swing can't be spammed.
--   • Mayor tax packages need no special handling — the discount keys on
--     (hq_nation_id, hq_city), so moving the HQ inherits the destination
--     city's package automatically.
--
-- The 5 assets are the corp's industry upgrade tiers (each 0–5):
--   construction → supply/pm/materials/reg/design
--   automotive   → design_studio/assembly/data_center/parts_depot/franchise
--   banking      → bank_branch/vault/underwriting/trading/clearing
-- Other (legacy) industries carry no asset ladder → sum 0 → drop 1.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS relocate_cooldown_until_tick int;

CREATE OR REPLACE FUNCTION public.relocate_corp(
    p_corp_id   uuid,
    p_nation_id uuid,
    p_city_name text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    RELOCATE_COOLDOWN_TICKS constant int := 12;   -- ~1 year between moves
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_nation nations%ROWTYPE;
    v_dest   cities%ROWTYPE;
    v_tick   int;
    v_sum    int;
    v_drop   int;
    v_sol    numeric;
    v_cost   bigint;
    v_funds  bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL OR p_city_name IS NULL OR btrim(p_city_name) = '' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    -- Owner gate (mirrors invest_into_corp, 20270802).
    SELECT * INTO v_fac FROM factions
     WHERE faction_type IN ('entrepreneur', 'businessman')
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY (id = v_corp.owner_faction_id) DESC, created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    IF COALESCE(v_corp.relocate_cooldown_until_tick, 0) > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
            'until_tick', v_corp.relocate_cooldown_until_tick);
    END IF;

    -- Destination must be a real nation + city.
    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;
    SELECT * INTO v_dest FROM cities
     WHERE nation_id = p_nation_id
       AND lower(city_name) = lower(btrim(p_city_name))
     FOR UPDATE;
    IF v_dest.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;

    IF v_corp.hq_nation_id = p_nation_id
       AND lower(COALESCE(v_corp.hq_city, '')) = lower(v_dest.city_name) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_there');
    END IF;

    -- Sum of the corp's 5 industry asset tiers (each 0–5).
    v_sum := CASE v_corp.industry
        WHEN 'construction' THEN COALESCE(v_corp.supply_tier,0)+COALESCE(v_corp.pm_tier,0)+COALESCE(v_corp.materials_tier,0)+COALESCE(v_corp.reg_tier,0)+COALESCE(v_corp.design_tier,0)
        WHEN 'automotive'   THEN COALESCE(v_corp.design_studio_tier,0)+COALESCE(v_corp.assembly_tier,0)+COALESCE(v_corp.data_center_tier,0)+COALESCE(v_corp.parts_depot_tier,0)+COALESCE(v_corp.franchise_tier,0)
        WHEN 'banking'      THEN COALESCE(v_corp.bank_branch_tier,0)+COALESCE(v_corp.bank_vault_tier,0)+COALESCE(v_corp.bank_underwriting_tier,0)+COALESCE(v_corp.bank_trading_tier,0)+COALESCE(v_corp.bank_clearing_tier,0)
        ELSE 0
    END;
    v_drop := (v_sum / 3) + 1;   -- integer division, by design

    v_sol  := GREATEST(0, COALESCE(v_nation.standard_of_living, 50));
    v_cost := ROUND( 1000000.0
                     * (v_sum + 1)
                     * (v_sol / 50.0)
                     * GREATEST(0.5, 1 - COALESCE(v_dest.unemployment, 5) / 20.0) )::bigint;

    v_funds := floor(COALESCE(v_corp.treasury_cash, 0))::bigint;
    IF v_cost > v_funds THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'have', v_funds, 'need', v_cost);
    END IF;

    -- Origin city rises back (no-op if the corp's hq_city has no city row).
    UPDATE cities
       SET unemployment = GREATEST(1, LEAST(10, COALESCE(unemployment, 5) + v_drop))
     WHERE nation_id = v_corp.hq_nation_id
       AND lower(city_name) = lower(COALESCE(v_corp.hq_city, ''));

    -- Destination city drops.
    UPDATE cities
       SET unemployment = GREATEST(1, LEAST(10, COALESCE(unemployment, 5) - v_drop))
     WHERE id = v_dest.id;

    -- Move the HQ, pay the fee, arm the cooldown.
    UPDATE entrepreneur_corps
       SET hq_nation_id  = p_nation_id,
           hq_city       = v_dest.city_name,
           treasury_cash = COALESCE(treasury_cash, 0) - v_cost,
           relocate_cooldown_until_tick = v_tick + RELOCATE_COOLDOWN_TICKS
     WHERE id = p_corp_id;

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Relocated HQ to %s, %s for $%s.', v_dest.city_name, v_nation.name, v_cost));

    RETURN jsonb_build_object('success', true,
        'cost', v_cost,
        'unemployment_drop', v_drop,
        'hq_city', v_dest.city_name,
        'hq_nation_id', p_nation_id,
        'cooldown_until_tick', v_tick + RELOCATE_COOLDOWN_TICKS);
END $$;

REVOKE ALL ON FUNCTION public.relocate_corp(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.relocate_corp(uuid, uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
