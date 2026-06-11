-- ════════════════════════════════════════════════════════════════════
-- 20270836 — AUTOMOTIVE Executive Action #3: Analyze Market
--
-- Process sales data and demand: pick a nation and a vehicle type,
-- and the report shows the type's Monthly Demand, the desire split
-- across the five classes, and the vehicles of that type currently
-- for sale in the nation. Running the analysis spends the corp's
-- one-per-tick executive action.
--
-- The demand model (the ONE place it lives):
--   · Monthly Demand = population ÷ 100,000 × the type's market
--     share — Sedan 40% · Pickup 20% · Motorcycle 20% · Coupe 15% ·
--     Sports Car 5%.
--   · Class desire: affluence = (Standard of Living + Wages) / 2.
--     Baseline at 50 splits 30/35/20/10/5 across Economy → Ultra-
--     Luxury; richer nations shift desire up the ladder, poorer
--     nations toward Economy (weights below, normalized to 100%).
--   · For sale = Σ units_in_stock of that type across corps HQ'd in
--     the nation (corp inventory IS the showroom until dealer/sale
--     mechanics land).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.analyze_vehicle_market(
    p_corp_id      uuid,
    p_nation_id    uuid,
    p_vehicle_type text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_nation  nations%ROWTYPE;
    v_tick    int;
    v_share   numeric;
    v_demand  numeric;
    v_aff     numeric;
    v_w       numeric[];
    v_total   numeric;
    v_classes jsonb := '[]'::jsonb;
    v_names   text[] := ARRAY['economy', 'mid_range', 'premium', 'luxury', 'ultra_luxury'];
    v_sale    bigint;
    i         int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_vehicle_type NOT IN ('coupe', 'sedan', 'pickup', 'motorcycle', 'sports_car') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the allowance spend below must serialize.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'automotive' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT * INTO v_nation FROM nations
     WHERE id = p_nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Monthly demand: population ÷ 100k × the type's market share.
    v_share := CASE p_vehicle_type
        WHEN 'sedan'      THEN 0.40
        WHEN 'pickup'     THEN 0.20
        WHEN 'motorcycle' THEN 0.20
        WHEN 'coupe'      THEN 0.15
        WHEN 'sports_car' THEN 0.05
    END;
    v_demand := GREATEST(0, COALESCE(v_nation.population, 0)) / 100000.0 * v_share;

    -- Class desire weights from affluence (SoL + Wages averaged;
    -- 50 baseline → 30/35/20/10/5), floored so no class hits zero.
    v_aff := (GREATEST(1, COALESCE(v_nation.standard_of_living, 50))
              + GREATEST(1, COALESCE(v_nation.wages, 50))) / 2.0;
    v_w := ARRAY[
        GREATEST(5, 30 + (50 - v_aff) * 0.6),
        GREATEST(10, 35 + (50 - v_aff) * 0.1),
        GREATEST(3, 20 + (v_aff - 50) * 0.3),
        GREATEST(2, 10 + (v_aff - 50) * 0.2),
        GREATEST(1,  5 + (v_aff - 50) * 0.1)
    ];
    v_total := v_w[1] + v_w[2] + v_w[3] + v_w[4] + v_w[5];

    FOR i IN 1..5 LOOP
        v_classes := v_classes || jsonb_build_array(jsonb_build_object(
            'class',         v_names[i],
            'desire_pct',    ROUND(v_w[i] / v_total * 100),
            'monthly_units', ROUND(v_demand * v_w[i] / v_total)));
    END LOOP;

    -- The showroom: every unit of this type sitting in the inventory
    -- of a corp headquartered in the nation.
    SELECT COALESCE(SUM(vb.units_in_stock), 0) INTO v_sale
      FROM vehicle_blueprints vb
      JOIN entrepreneur_corps ec ON ec.id = vb.corp_id
     WHERE ec.hq_nation_id = p_nation_id
       AND vb.vehicle_type = p_vehicle_type;

    -- The analysis is the day's executive action.
    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_corp_id;

    RETURN jsonb_build_object(
        'success',        true,
        'nation',         v_nation.name,
        'vehicle_type',   p_vehicle_type,
        'monthly_demand', ROUND(v_demand),
        'affluence',      ROUND(v_aff),
        'classes',        v_classes,
        'for_sale_units', v_sale
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.analyze_vehicle_market(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.analyze_vehicle_market(uuid, uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
