-- ════════════════════════════════════════════════════════════════════
-- 20270842 — Automotive asset upgrades: the five ladders become real
--
-- Every department card gains an owner [UPGRADE] (design ruling: on
-- the cards, no executive action spent — capital purchases like the
-- pillar upgrades). Prices align with construction's by Roman
-- numeral via yard_upgrade_cost: II $10M · III $16M · IV $25M ·
-- V $40M (Level I is the founding state). Building requirements
-- (Tier I-III Industrial, Tier III Commercial) display but are
-- waived until those buildings exist.
--
-- Five tier columns (default 1) + upgrade_automotive_asset + the
-- per-level helpers, and the live functions re-emitted to read them:
--   · draft_vehicle_blueprint (20270832): Studio grant +1/+2/+3,
--     Experience ceiling 20/20/20/40/60.
--   · start_production_run (20270834): assembly lines 1/2/2/3/4
--     concurrent runs (Superior/Automated efficiencies await their
--     production model).
--   · run_sales_campaign (20270841): franchise home Demand
--     +1/+2/+3/+4 (retained at V), Subsidiary-brand +1/+2/+3 at III+.
--   · analyze_vehicle_market (20270840): optional p_nation_id —
--     foreign analysis unlocks at Data Center III+ (old 2-arg
--     signature dropped; multi-type analysis and the Level V quality
--     insight await their spec).
-- Parts Depot caps await Aluminum.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS design_studio_tier int NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS assembly_tier      int NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS data_center_tier   int NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS parts_depot_tier   int NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS franchise_tier     int NOT NULL DEFAULT 1;

-- ── per-level helpers (the ONE place each curve lives) ────────────
CREATE OR REPLACE FUNCTION public.design_studio_grant(p_tier int)
RETURNS int LANGUAGE sql IMMUTABLE
AS $$ SELECT CASE WHEN p_tier >= 3 THEN 3 WHEN p_tier = 2 THEN 2 ELSE 1 END; $$;
COMMENT ON FUNCTION public.design_studio_grant(int) IS
    'Design & Engineering Studio: Experience granted per new Model by level (+1/+2/+3, flat from III).';

CREATE OR REPLACE FUNCTION public.design_studio_cap(p_tier int)
RETURNS int LANGUAGE sql IMMUTABLE
AS $$ SELECT CASE WHEN p_tier >= 5 THEN 60 WHEN p_tier = 4 THEN 40 ELSE 20 END; $$;
COMMENT ON FUNCTION public.design_studio_cap(int) IS
    'Design & Engineering Studio: the Experience ceiling by level (20/20/20/40/60).';

CREATE OR REPLACE FUNCTION public.assembly_lines(p_tier int)
RETURNS int LANGUAGE sql IMMUTABLE
AS $$ SELECT CASE WHEN p_tier >= 5 THEN 4 WHEN p_tier = 4 THEN 3 WHEN p_tier >= 2 THEN 2 ELSE 1 END; $$;
COMMENT ON FUNCTION public.assembly_lines(int) IS
    'Assembly Plant: concurrent production runs by level (1/2/2/3/4).';

CREATE OR REPLACE FUNCTION public.franchise_home_demand(p_tier int)
RETURNS int LANGUAGE sql IMMUTABLE
AS $$ SELECT LEAST(4, GREATEST(1, p_tier)); $$;
COMMENT ON FUNCTION public.franchise_home_demand(int) IS
    'Franchise & Commercial Suite: +Demand on home campaigns by level (+1/+2/+3/+4, retained at V).';

CREATE OR REPLACE FUNCTION public.franchise_subsidiary_demand(p_tier int)
RETURNS int LANGUAGE sql IMMUTABLE
AS $$ SELECT GREATEST(0, LEAST(3, p_tier - 2)); $$;
COMMENT ON FUNCTION public.franchise_subsidiary_demand(int) IS
    'Franchise & Commercial Suite: +Demand for Subsidiary-brand campaigns (+1/+2/+3 from Level III).';

-- ── upgrade_automotive_asset ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upgrade_automotive_asset(
    p_corp_id uuid,
    p_asset   text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tier int;
    v_cost bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_asset NOT IN
       ('design_studio', 'assembly', 'data_center', 'parts_depot', 'franchise') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the treasury debit and tier bump must
    -- serialize against a concurrent upgrade.
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

    v_tier := COALESCE(CASE p_asset
        WHEN 'design_studio' THEN v_corp.design_studio_tier
        WHEN 'assembly'      THEN v_corp.assembly_tier
        WHEN 'data_center'   THEN v_corp.data_center_tier
        WHEN 'parts_depot'   THEN v_corp.parts_depot_tier
        WHEN 'franchise'     THEN v_corp.franchise_tier
    END, 1);
    IF v_tier >= 5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'max_tier');
    END IF;

    -- The construction price ladder, aligned by Roman numeral:
    -- II $10M · III $16M · IV $25M · V $40M (Level I is free at
    -- founding). yard_upgrade_cost is the one price source.
    v_cost := yard_upgrade_cost(v_tier + 1);
    IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    UPDATE entrepreneur_corps SET
        treasury_cash      = COALESCE(treasury_cash, 0) - v_cost,
        design_studio_tier = CASE WHEN p_asset = 'design_studio' THEN v_tier + 1 ELSE design_studio_tier END,
        assembly_tier      = CASE WHEN p_asset = 'assembly'      THEN v_tier + 1 ELSE assembly_tier END,
        data_center_tier   = CASE WHEN p_asset = 'data_center'   THEN v_tier + 1 ELSE data_center_tier END,
        parts_depot_tier   = CASE WHEN p_asset = 'parts_depot'   THEN v_tier + 1 ELSE parts_depot_tier END,
        franchise_tier     = CASE WHEN p_asset = 'franchise'     THEN v_tier + 1 ELSE franchise_tier END
     WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true,
        'asset', p_asset, 'tier', v_tier + 1, 'cost', v_cost);
END $$;

REVOKE EXECUTE ON FUNCTION public.upgrade_automotive_asset(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.upgrade_automotive_asset(uuid, text) TO authenticated;

-- ── draft_vehicle_blueprint — Studio grant/cap by level ───────────
CREATE OR REPLACE FUNCTION public.draft_vehicle_blueprint(
    p_corp_id       uuid,
    p_name          text,
    p_vehicle_type  text,
    p_vehicle_class text,
    p_engine        text,
    p_packages      text[],
    p_quality       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_tick     int;
    v_id       uuid;
    v_name     text := TRIM(COALESCE(p_name, ''));
    v_packages text[];
    v_cost     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF length(v_name) < 2 OR length(v_name) > 60 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_vehicle_type NOT IN ('coupe', 'sedan', 'pickup', 'motorcycle', 'sports_car')
       OR p_vehicle_class NOT IN ('economy', 'mid_range', 'premium', 'luxury', 'ultra_luxury')
       OR p_engine NOT IN ('basic_3cyl', 'basic_4cyl', 'tuned_4cyl', 'v6', 'v8', 'v12',
                           'electric_basic', 'electric_performance', 'hybrid')
       OR p_quality NOT IN ('low', 'moderate', 'standard', 'exceptional') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Packages: dedupe, then validate against the catalog and the
    -- two fitment gates (plus the V12's market restriction).
    SELECT COALESCE(array_agg(DISTINCT x), '{}') INTO v_packages
      FROM unnest(COALESCE(p_packages, '{}')) AS x;
    IF NOT (v_packages <@ ARRAY['leather_interior', 'premium_audio', 'technology',
                                'driver_assist', 'sport_performance', 'safety',
                                'appearance', 'cold_weather', 'off_road', 'self_driving']) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF 'off_road' = ANY(v_packages) AND p_vehicle_type <> 'pickup' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'off_road_pickup_only');
    END IF;
    IF 'self_driving' = ANY(v_packages)
       AND p_vehicle_class NOT IN ('premium', 'luxury', 'ultra_luxury') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'self_driving_premium_only');
    END IF;
    IF p_engine = 'v12' AND p_vehicle_type <> 'sports_car'
       AND p_vehicle_class NOT IN ('luxury', 'ultra_luxury') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'v12_restricted');
    END IF;

    -- Lock the corp row: the allowance check and the XP debit below
    -- must serialize against a concurrent draft.
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_cost := vehicle_blueprint_xp_cost(p_vehicle_type, p_vehicle_class, p_engine,
                                        COALESCE(array_length(v_packages, 1), 0), p_quality);
    IF COALESCE(v_corp.experience, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_experience',
            'xp_cost', v_cost, 'experience', COALESCE(v_corp.experience, 0));
    END IF;

    INSERT INTO vehicle_blueprints (
        corp_id, name, vehicle_type, vehicle_class, engine,
        packages, quality, xp_cost, created_at_tick
    ) VALUES (
        p_corp_id, v_name, p_vehicle_type, p_vehicle_class, p_engine,
        v_packages, p_quality, v_cost, v_tick
    ) RETURNING id INTO v_id;

    -- The Design & Engineering Studio (20270842): every new Model
    -- grants Experience by studio level (+1/+2/+3), accruing up to
    -- the level's ceiling (20/20/20/40/60 — the grant is forfeited
    -- at the cap, never clamping down).
    UPDATE entrepreneur_corps
       SET experience = GREATEST(COALESCE(experience, 0) - v_cost,
               LEAST(design_studio_cap(COALESCE(design_studio_tier, 1)),
                     COALESCE(experience, 0) - v_cost
                     + design_studio_grant(COALESCE(design_studio_tier, 1)))),
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'blueprint_id', v_id,
        'name', v_name, 'xp_cost', v_cost);
END $$;

REVOKE EXECUTE ON FUNCTION public.draft_vehicle_blueprint(uuid, text, text, text, text, text[], text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.draft_vehicle_blueprint(uuid, text, text, text, text, text[], text) TO authenticated;

-- ── start_production_run — lines by plant level ───────────────────
CREATE OR REPLACE FUNCTION public.start_production_run(
    p_corp_id      uuid,
    p_blueprint_id uuid,
    p_quantity     int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_corp  entrepreneur_corps%ROWTYPE;
    v_bp    vehicle_blueprints%ROWTYPE;
    v_tick  int;
    v_unit  bigint;
    v_total bigint;
    v_id    uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_blueprint_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    -- 1 vehicle per tick: the amount IS the ticks the line is
    -- assigned. 60 (five game-years) bounds runaway assignments.
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 60 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    -- Lock the corp row: the allowance, the line check, and the
    -- treasury debit below must serialize against concurrent runs.
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

    -- Assembly lines by plant level (20270842): 1/2/2/3/4 concurrent
    -- runs. (The Level III+ Superior / Automated line efficiencies
    -- await their production model.)
    IF (SELECT COUNT(*) FROM vehicle_production_runs
         WHERE corp_id = p_corp_id AND status = 'running')
       >= assembly_lines(COALESCE(v_corp.assembly_tier, 1)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_line_available');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_unit  := GREATEST(1, COALESCE(v_bp.xp_cost, 1)) * 5000;
    v_total := v_unit * p_quantity;
    IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_total, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    INSERT INTO vehicle_production_runs (
        corp_id, blueprint_id, quantity, unit_cost, total_cost,
        started_tick, completes_at_tick
    ) VALUES (
        p_corp_id, p_blueprint_id, p_quantity, v_unit, v_total,
        v_tick, v_tick + p_quantity
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_total,
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'run_id', v_id,
        'quantity', p_quantity, 'unit_cost', v_unit, 'total_cost', v_total,
        'completes_at_tick', v_tick + p_quantity);
END $$;

REVOKE EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_production_run(uuid, uuid, int) TO authenticated;

-- ── run_sales_campaign — franchise demand by level ────────────────
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
    v_home   boolean;
    v_presence corp_market_presence%ROWTYPE;
    v_stockrow vehicle_market_stock%ROWTYPE;
    v_stock  int;
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

    SELECT * INTO v_nation FROM nations
     WHERE id = p_nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;

    -- Home campaigns sell HQ inventory; foreign ones need presence
    -- there (Expand Market, 20270840) and sell the stock you shipped.
    -- A Subsidiary's local badge earns +1 appeal.
    v_home := (p_nation_id = v_corp.hq_nation_id);
    IF NOT v_home THEN
        SELECT * INTO v_presence FROM corp_market_presence
         WHERE corp_id = p_corp_id AND nation_id = p_nation_id;
        IF v_presence.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'not_in_market');
        END IF;
        SELECT * INTO v_stockrow FROM vehicle_market_stock
         WHERE blueprint_id = p_blueprint_id AND nation_id = p_nation_id;
        v_stock := COALESCE(v_stockrow.units, 0);
    ELSE
        v_stock := COALESCE(v_bp.units_in_stock, 0);
    END IF;
    IF v_stock < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_stock');
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
                               COALESCE(array_length(v_bp.packages, 1), 0))
                + CASE WHEN NOT v_home AND (v_presence).kind = 'subsidiary' THEN 1 ELSE 0 END;
    -- Rivals with stock IN this nation: locals' HQ inventory plus
    -- anything foreigners shipped in (their subsidiary badges don't
    -- defend — the bonus is the campaigner's edge).
    SELECT COALESCE(SUM(vehicle_appeal(vb.engine, vb.quality,
                                       COALESCE(array_length(vb.packages, 1), 0))), 0)
      INTO v_comp
      FROM vehicle_blueprints vb
      JOIN entrepreneur_corps ec ON ec.id = vb.corp_id
     WHERE vb.vehicle_type = v_bp.vehicle_type
       AND vb.corp_id <> p_corp_id
       AND ((ec.hq_nation_id = p_nation_id AND COALESCE(vb.units_in_stock, 0) > 0)
            OR EXISTS (SELECT 1 FROM vehicle_market_stock ms
                        WHERE ms.blueprint_id = vb.id
                          AND ms.nation_id = p_nation_id
                          AND ms.units > 0));
    v_units := v_units * v_appeal / (v_appeal + v_comp);

    -- Franchise & Commercial Suite (20270842): the network adds
    -- Demand at home by suite level (+1/+2/+3/+4, retained at V),
    -- and Subsidiary-brand campaigns gain +1/+2/+3 from Level III.
    IF v_home THEN
        v_units := v_units + franchise_home_demand(COALESCE(v_corp.franchise_tier, 1));
    ELSIF (v_presence).kind = 'subsidiary' THEN
        v_units := v_units + franchise_subsidiary_demand(COALESCE(v_corp.franchise_tier, 1));
    END IF;

    v_sold := LEAST(v_stock, FLOOR(v_units)::int);
    v_rev  := v_sold::bigint * p_price;

    IF v_home THEN
        UPDATE vehicle_blueprints
           SET units_in_stock = units_in_stock - v_sold
         WHERE id = v_bp.id;
    ELSE
        UPDATE vehicle_market_stock
           SET units = units - v_sold
         WHERE id = (v_stockrow).id;
    END IF;
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

-- ── analyze_vehicle_market — foreign intel at Data Center III+ ────
DROP FUNCTION IF EXISTS public.analyze_vehicle_market(uuid, text);

CREATE OR REPLACE FUNCTION public.analyze_vehicle_market(
    p_corp_id      uuid,
    p_vehicle_type text,
    p_nation_id    uuid DEFAULT NULL
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

    -- Home turf by default; a Quality & Data Center at Level III+
    -- (20270842) unlocks analyzing another nation.
    IF p_nation_id IS NOT NULL AND p_nation_id <> v_corp.hq_nation_id
       AND COALESCE(v_corp.data_center_tier, 1) < 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'data_center_too_small');
    END IF;
    SELECT * INTO v_nation FROM nations
     WHERE id = COALESCE(p_nation_id, v_corp.hq_nation_id)
       AND name = ANY (market_nation_names());
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
    SELECT COALESCE(SUM(vb.units_in_stock), 0)
           + COALESCE((SELECT SUM(ms.units) FROM vehicle_market_stock ms
                         JOIN vehicle_blueprints mb ON mb.id = ms.blueprint_id
                        WHERE ms.nation_id = v_nation.id
                          AND mb.vehicle_type = p_vehicle_type), 0)
      INTO v_sale
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

REVOKE EXECUTE ON FUNCTION public.analyze_vehicle_market(uuid, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.analyze_vehicle_market(uuid, text, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
