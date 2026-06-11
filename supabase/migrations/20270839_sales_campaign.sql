-- ════════════════════════════════════════════════════════════════════
-- 20270839 — AUTOMOTIVE Executive Action #4: Sales Campaign
--
-- Pick a nation, pick a Model, set your price, and sell into the
-- month's demand. Resolution (the ONE place it lives):
--
--   units = demand(type × class in the nation)         -- 100× the 20270836 scale
--         × energy factor   clamp(Energy/50, 0.5–1.5)  -- cheap gas helps
--         × cost-of-living  clamp(50/CoL,   0.5–1.5)   -- pricey living hurts
--         × price factor    clamp(anchor/price, 0.4–1.6)
--         × appeal share against competitor Models of the same type
--           HQ'd in the nation (appeal = 1 + engine + quality +
--           0.5/package, floor 0.5)
--   sold = LEAST(your stock, FLOOR(units));  revenue = sold × price
--   → treasury + the corp revenue stamp; stock decremented; the
--   campaign spends the day's executive action.
--
-- Class anchor prices: Economy $18k · Mid-Range $35k · Premium $55k
-- · Luxury $90k · Ultra-Luxury $250k (the class copy's "sub-$20k"
-- made canon). Demand math moves into vehicle_type_share /
-- vehicle_class_weight so analyze_vehicle_market (re-emitted from
-- 20270838) and the campaign read identical numbers.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── shared demand + pricing helpers ───────────────────────────────
CREATE OR REPLACE FUNCTION public.vehicle_type_share(p_vehicle_type text)
RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_vehicle_type
        WHEN 'sedan'      THEN 0.40
        WHEN 'pickup'     THEN 0.20
        WHEN 'motorcycle' THEN 0.20
        WHEN 'coupe'      THEN 0.15
        WHEN 'sports_car' THEN 0.05
        ELSE 0
    END;
$$;
COMMENT ON FUNCTION public.vehicle_type_share(text) IS
    'Each vehicle type''s share of a nation''s monthly vehicle demand (20270836 model). Read by analyze_vehicle_market and run_sales_campaign.';

CREATE OR REPLACE FUNCTION public.vehicle_type_monthly_demand(p_population numeric, p_vehicle_type text)
RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$
    -- population ÷ 1,000 × type share — 100× the original 20270836
    -- scale, which priced a 500k nation at 2 sedans a month. ~200 is
    -- the respectable number. The ONE place the demand scale lives.
    SELECT GREATEST(0, COALESCE(p_population, 0)) / 1000.0 * vehicle_type_share(p_vehicle_type);
$$;
COMMENT ON FUNCTION public.vehicle_type_monthly_demand(numeric, text) IS
    'A nation''s monthly vehicle demand for a type: population ÷ 1,000 × type share. Read by analyze_vehicle_market and run_sales_campaign.';

CREATE OR REPLACE FUNCTION public.vehicle_class_weight(p_class text, p_affluence numeric)
RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_class
        WHEN 'economy'      THEN GREATEST(5, 30 + (50 - p_affluence) * 0.6)
        WHEN 'mid_range'    THEN GREATEST(10, 35 + (50 - p_affluence) * 0.1)
        WHEN 'premium'      THEN GREATEST(3, 20 + (p_affluence - 50) * 0.3)
        WHEN 'luxury'       THEN GREATEST(2, 10 + (p_affluence - 50) * 0.2)
        WHEN 'ultra_luxury' THEN GREATEST(1,  5 + (p_affluence - 50) * 0.1)
        ELSE 0
    END;
$$;
COMMENT ON FUNCTION public.vehicle_class_weight(text, numeric) IS
    'Un-normalized class-desire weight at a given affluence ((SoL + Wages)/2; 50 baseline → 30/35/20/10/5). Read by analyze_vehicle_market and run_sales_campaign.';

CREATE OR REPLACE FUNCTION public.vehicle_class_anchor_price(p_class text)
RETURNS bigint
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_class
        WHEN 'economy'      THEN 18000
        WHEN 'mid_range'    THEN 35000
        WHEN 'premium'      THEN 55000
        WHEN 'luxury'       THEN 90000
        WHEN 'ultra_luxury' THEN 250000
        ELSE 35000
    END::bigint;
$$;
COMMENT ON FUNCTION public.vehicle_class_anchor_price(text) IS
    'The fair-price anchor per class (20270839): pricing at the anchor is volume-neutral; under sells more, over sells fewer (clamped 0.4–1.6). The client mirrors it for display.';

CREATE OR REPLACE FUNCTION public.vehicle_appeal(p_engine text, p_quality text, p_package_count int)
RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$
    SELECT GREATEST(0.5,
        1
        + CASE p_engine
            WHEN 'tuned_4cyl'           THEN 1
            WHEN 'v6'                   THEN 1
            WHEN 'v8'                   THEN 2
            WHEN 'v12'                  THEN 3
            WHEN 'electric_basic'       THEN 1
            WHEN 'electric_performance' THEN 2
            WHEN 'hybrid'               THEN 1
            ELSE 0
        END
        + CASE p_quality
            WHEN 'low'         THEN -1
            WHEN 'standard'    THEN 1
            WHEN 'exceptional' THEN 2
            ELSE 0
        END
        + 0.5 * GREATEST(0, COALESCE(p_package_count, 0)));
$$;
COMMENT ON FUNCTION public.vehicle_appeal(text, text, int) IS
    'A Model''s showroom appeal: 1 + engine mod + quality mod + 0.5/package, floor 0.5. Splits demand between competing Models in run_sales_campaign; mirrored client-side for the campaign modal.';

-- ── run_sales_campaign ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.run_sales_campaign(
    p_corp_id      uuid,
    p_nation_id    uuid,
    p_blueprint_id uuid,
    p_price        bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_bp     vehicle_blueprints%ROWTYPE;
    v_nation nations%ROWTYPE;
    v_tick   int;
    v_aff    numeric;
    v_w      numeric;
    v_wsum   numeric;
    v_units  numeric;
    v_appeal numeric;
    v_comp   numeric;
    v_sold   int;
    v_rev    bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL OR p_blueprint_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_price IS NULL OR p_price < 1 OR p_price > 100000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_price');
    END IF;

    -- Lock the corp row: the allowance spend and the revenue credit
    -- below must serialize.
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

    SELECT * INTO v_bp FROM vehicle_blueprints
     WHERE id = p_blueprint_id AND corp_id = p_corp_id;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;
    IF COALESCE(v_bp.units_in_stock, 0) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_stock');
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

    -- The month's demand for this type × class in the nation
    -- (identical math to analyze_vehicle_market via the helpers).
    v_aff := (GREATEST(1, COALESCE(v_nation.standard_of_living, 50))
              + GREATEST(1, COALESCE(v_nation.wages, 50))) / 2.0;
    v_w := vehicle_class_weight(v_bp.vehicle_class, v_aff);
    v_wsum := vehicle_class_weight('economy', v_aff) + vehicle_class_weight('mid_range', v_aff)
            + vehicle_class_weight('premium', v_aff) + vehicle_class_weight('luxury', v_aff)
            + vehicle_class_weight('ultra_luxury', v_aff);
    v_units := vehicle_type_monthly_demand(v_nation.population, v_bp.vehicle_type)
               * v_w / v_wsum;

    -- Gas prices and disposable income: high Energy on hand helps,
    -- a high Cost of Living hurts.
    v_units := v_units
        * GREATEST(0.5, LEAST(1.5, GREATEST(0, COALESCE(v_nation.energy, 0)) / 50.0))
        * GREATEST(0.5, LEAST(1.5, 50.0 / GREATEST(1, COALESCE(v_nation.cost_of_living, 50))));

    -- Pricing against the class anchor: undercutting sells more.
    v_units := v_units * GREATEST(0.4, LEAST(1.6,
        vehicle_class_anchor_price(v_bp.vehicle_class)::numeric / p_price));

    -- Appeal share against competitor Models of the same type with
    -- stock, HQ'd in the nation.
    v_appeal := vehicle_appeal(v_bp.engine, v_bp.quality,
                               COALESCE(array_length(v_bp.packages, 1), 0));
    SELECT COALESCE(SUM(vehicle_appeal(vb.engine, vb.quality,
                                       COALESCE(array_length(vb.packages, 1), 0))), 0)
      INTO v_comp
      FROM vehicle_blueprints vb
      JOIN entrepreneur_corps ec ON ec.id = vb.corp_id
     WHERE ec.hq_nation_id = p_nation_id
       AND vb.vehicle_type = v_bp.vehicle_type
       AND vb.corp_id <> p_corp_id
       AND COALESCE(vb.units_in_stock, 0) > 0;
    v_units := v_units * v_appeal / (v_appeal + v_comp);

    v_sold := LEAST(COALESCE(v_bp.units_in_stock, 0), FLOOR(v_units)::int);
    v_rev  := v_sold::bigint * p_price;

    UPDATE vehicle_blueprints
       SET units_in_stock = units_in_stock - v_sold
     WHERE id = v_bp.id;
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + v_rev,
           exec_action_tick = v_tick
     WHERE id = p_corp_id;
    IF v_rev > 0 THEN
        PERFORM stamp_entrepreneur_corp_revenue(p_corp_id, v_tick, v_rev);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'sold',    v_sold,
        'revenue', v_rev,
        'name',    v_bp.name,
        'price',   p_price,
        'nation',  v_nation.name
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.run_sales_campaign(uuid, uuid, uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.run_sales_campaign(uuid, uuid, uuid, bigint) TO authenticated;

-- ── analyze_vehicle_market — re-emitted onto the shared helpers ───
CREATE OR REPLACE FUNCTION public.analyze_vehicle_market(
    p_corp_id      uuid,
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
    IF p_corp_id IS NULL THEN
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

    -- Home turf only when this action starts: the analysis reads the
    -- corp's HQ nation. Foreign market intel comes later.
    SELECT * INTO v_nation FROM nations
     WHERE id = v_corp.hq_nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Monthly demand: population ÷ 100k × the type's market share,
    -- class weights from affluence — both via the 20270839 helpers
    -- shared with run_sales_campaign.
    v_share := vehicle_type_share(p_vehicle_type);
    v_demand := vehicle_type_monthly_demand(v_nation.population, p_vehicle_type);

    v_aff := (GREATEST(1, COALESCE(v_nation.standard_of_living, 50))
              + GREATEST(1, COALESCE(v_nation.wages, 50))) / 2.0;
    v_w := ARRAY[
        vehicle_class_weight('economy',      v_aff),
        vehicle_class_weight('mid_range',    v_aff),
        vehicle_class_weight('premium',      v_aff),
        vehicle_class_weight('luxury',       v_aff),
        vehicle_class_weight('ultra_luxury', v_aff)
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
     WHERE ec.hq_nation_id = v_nation.id
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

REVOKE EXECUTE ON FUNCTION public.analyze_vehicle_market(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.analyze_vehicle_market(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
