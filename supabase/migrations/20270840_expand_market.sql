-- ════════════════════════════════════════════════════════════════════
-- 20270840 — AUTOMOTIVE Executive Action #5: Expand Market
--
-- Select a nation and establish a presence:
--   · EXPAND — $10M flat. Your corp sells there under its own name.
--   · OPEN SUBSIDIARY — $7M × that nation's Standard of Living / 50.
--     A named local entity: rename your Models for the market, and
--     the local badge earns +1 appeal on every campaign there.
-- Either way you set standing list prices and ship units from HQ
-- inventory. Re-running on a nation you're already in ships more and
-- updates names/prices without paying the fee again. One presence
-- per (corp, nation); the action spends the day's allowance.
--
-- THE GATE (design ruling): foreign Sales Campaigns now require
-- presence and sell from the stock shipped to that nation
-- (vehicle_market_stock); home campaigns keep selling HQ inventory.
-- run_sales_campaign re-emitted from 20270839 with the gate, the
-- per-nation stock, the subsidiary badge, and rivals counted by
-- stock-in-nation (local HQ inventory + shipped imports).
-- analyze_vehicle_market re-emitted: for-sale counts shipped stock.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.corp_market_presence (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id          uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    nation_id        uuid NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    kind             text NOT NULL CHECK (kind IN ('expansion', 'subsidiary')),
    subsidiary_name  text,
    cost_paid        bigint NOT NULL,
    established_tick int NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (corp_id, nation_id)
);

CREATE TABLE IF NOT EXISTS public.vehicle_market_stock (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id      uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    nation_id    uuid NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    blueprint_id uuid NOT NULL REFERENCES public.vehicle_blueprints(id) ON DELETE CASCADE,
    units        int  NOT NULL DEFAULT 0 CHECK (units >= 0),
    local_name   text,
    list_price   bigint,
    UNIQUE (blueprint_id, nation_id)
);

CREATE INDEX IF NOT EXISTS vehicle_market_stock_nation_idx
    ON public.vehicle_market_stock (nation_id);

ALTER TABLE public.corp_market_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_market_stock ENABLE ROW LEVEL SECURITY;

-- Public game data like the rest of the corp registry; writes only
-- through the RPCs.
DROP POLICY IF EXISTS "Allow select for all" ON public.corp_market_presence;
CREATE POLICY "Allow select for all" ON public.corp_market_presence
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow select for all" ON public.vehicle_market_stock;
CREATE POLICY "Allow select for all" ON public.vehicle_market_stock
    FOR SELECT USING (true);

-- ── expand_market ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.expand_market(
    p_corp_id         uuid,
    p_nation_id       uuid,
    p_kind            text,
    p_subsidiary_name text,
    p_shipments       jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_nation   nations%ROWTYPE;
    v_presence corp_market_presence%ROWTYPE;
    v_tick     int;
    v_cost     bigint := 0;
    v_name     text := TRIM(COALESCE(p_subsidiary_name, ''));
    v_shipped  int := 0;
    r          RECORD;
    v_bp       vehicle_blueprints%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_kind NOT IN ('expansion', 'subsidiary') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_kind');
    END IF;

    -- Lock the corp row: allowance, fee, and HQ stock deductions
    -- below must serialize.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'automotive' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;
    IF p_nation_id = v_corp.hq_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'home_nation');
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

    SELECT * INTO v_presence FROM corp_market_presence
     WHERE corp_id = p_corp_id AND nation_id = p_nation_id;

    IF v_presence.id IS NULL THEN
        -- First entry pays the fee: $10M flat to expand, or
        -- $7M × the TARGET nation's Standard of Living / 50 for a
        -- named subsidiary.
        IF p_kind = 'subsidiary' THEN
            IF length(v_name) < 2 OR length(v_name) > 60 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
            END IF;
            v_cost := ROUND(7000000
                * GREATEST(1, COALESCE(v_nation.standard_of_living, 50)) / 50.0)::bigint;
        ELSE
            v_cost := 10000000;
        END IF;
        IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_cost THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
                'need', v_cost, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
        END IF;
        INSERT INTO corp_market_presence (
            corp_id, nation_id, kind, subsidiary_name, cost_paid, established_tick
        ) VALUES (
            p_corp_id, p_nation_id, p_kind,
            CASE WHEN p_kind = 'subsidiary' THEN v_name END, v_cost, v_tick
        ) RETURNING * INTO v_presence;
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) - v_cost
         WHERE id = p_corp_id;
    END IF;
    -- Already present: the re-run ships and re-prices for free.

    -- Shipments: move units HQ → nation, set standing prices, and
    -- (subsidiaries only) the local Model names.
    FOR r IN SELECT * FROM jsonb_to_recordset(COALESCE(p_shipments, '[]'::jsonb))
                  AS x(blueprint_id uuid, units int, local_name text, list_price bigint)
    LOOP
        SELECT * INTO v_bp FROM vehicle_blueprints
         WHERE id = r.blueprint_id AND corp_id = p_corp_id
         FOR UPDATE;
        IF v_bp.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
        END IF;
        IF COALESCE(r.units, 0) < 0 OR COALESCE(r.units, 0) > COALESCE(v_bp.units_in_stock, 0) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'ship_exceeds_stock',
                'model', v_bp.name, 'have', COALESCE(v_bp.units_in_stock, 0));
        END IF;
        IF COALESCE(r.units, 0) > 0 THEN
            UPDATE vehicle_blueprints
               SET units_in_stock = units_in_stock - r.units
             WHERE id = v_bp.id;
            v_shipped := v_shipped + r.units;
        END IF;
        INSERT INTO vehicle_market_stock (corp_id, nation_id, blueprint_id, units, local_name, list_price)
        VALUES (p_corp_id, p_nation_id, r.blueprint_id, COALESCE(r.units, 0),
                CASE WHEN v_presence.kind = 'subsidiary' THEN NULLIF(TRIM(COALESCE(r.local_name, '')), '') END,
                r.list_price)
        ON CONFLICT (blueprint_id, nation_id) DO UPDATE
           SET units      = vehicle_market_stock.units + COALESCE(EXCLUDED.units, 0),
               local_name = CASE WHEN v_presence.kind = 'subsidiary'
                                 THEN COALESCE(EXCLUDED.local_name, vehicle_market_stock.local_name)
                                 ELSE vehicle_market_stock.local_name END,
               list_price = COALESCE(EXCLUDED.list_price, vehicle_market_stock.list_price);
    END LOOP;

    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_corp_id;

    RETURN jsonb_build_object(
        'success',   true,
        'kind',      v_presence.kind,
        'name',      v_presence.subsidiary_name,
        'cost_paid', v_cost,
        'shipped',   v_shipped,
        'nation',    v_nation.name
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.expand_market(uuid, uuid, text, text, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.expand_market(uuid, uuid, text, text, jsonb) TO authenticated;

-- ── run_sales_campaign — the presence gate ────────────────────────
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

-- ── analyze_vehicle_market — for-sale counts shipped stock ────────
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

REVOKE EXECUTE ON FUNCTION public.analyze_vehicle_market(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.analyze_vehicle_market(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
