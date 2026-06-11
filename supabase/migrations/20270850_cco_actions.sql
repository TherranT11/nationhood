-- ════════════════════════════════════════════════════════════════════
-- 20270850 — The CCO's kit (Commercial rung 6)
--
-- The Chief Commercial Officer sells on their own authority (design
-- ruling), one action per tick on the shared employee allowance:
--
--   · cco_run_campaign — fires a full Sales Campaign (nation, Model,
--     price) WITHOUT the owner's executive action: a staffed
--     Commercial chair doubles the corp's selling tempo. To keep one
--     source, run_sales_campaign splits: _resolve_sales_campaign is
--     the entire resolution engine (demand, buffs, presence, stock,
--     revenue) and both the owner wrapper (exec allowance) and the
--     CCO wrapper (employee allowance) call it.
--   · cco_dealer_summit — pick a nation; the NEXT campaign there
--     gets +1.5 appeal (triple the rep's pitch). One pending summit
--     (entrepreneur_corps.summit_nation_id); campaigns elsewhere
--     leave it standing.
--   · cco_fleet_contract — sell up to 30 units of one Model from HQ
--     inventory at 70% of its class anchor, instantly, no demand
--     roll: the B2B clearance valve.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS summit_nation_id uuid REFERENCES public.nations(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.entrepreneur_corps.summit_nation_id IS
    'The CCO''s pending Dealer Summit (20270850): the next Sales Campaign in this nation gets +1.5 appeal, then the charge clears.';

-- ── _commercial_chief_check — the shared eligibility guard ────────
CREATE OR REPLACE FUNCTION public._commercial_chief_check(p_uid uuid)
RETURNS factions
LANGUAGE plpgsql
AS $$
DECLARE
    v_fac factions%ROWTYPE;
BEGIN
    SELECT * INTO v_fac FROM factions
     WHERE (id = p_uid OR linked_user_id = p_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL OR v_fac.biz_employer_corp_id IS NULL
       OR lower(COALESCE(v_fac.status, '')) = 'arrested'
       OR NOT EXISTS (
            SELECT 1 FROM job_applicants a
              JOIN job_openings o ON o.id = a.opening_id
             WHERE a.applicant_faction_id = v_fac.id
               AND a.status = 'hired'
               AND o.corp_id = v_fac.biz_employer_corp_id
               AND o.track = 'commercial'
               AND o.rung = 6
       ) THEN
        RETURN NULL;
    END IF;
    RETURN v_fac;
END $$;

REVOKE EXECUTE ON FUNCTION public._commercial_chief_check(uuid) FROM PUBLIC;

-- ── _resolve_sales_campaign — the one resolution engine ───────────
-- Internal: no auth, no allowance — the wrappers own those. Takes
-- the corp row lock, so concurrent owner/CCO campaigns serialize.
CREATE OR REPLACE FUNCTION public._resolve_sales_campaign(
    p_corp_id      uuid,
    p_nation_id    uuid,
    p_blueprint_id uuid,
    p_price        bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
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
    v_summit boolean;
    v_presence corp_market_presence%ROWTYPE;
    v_stockrow vehicle_market_stock%ROWTYPE;
    v_stock  int;
BEGIN
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
    -- Sweeten the Financing (20270846): the demand math reads the
    -- price 10% lower than the full sticker the buyers actually pay.
    v_units := v_units * GREATEST(0.4, LEAST(1.6,
        vehicle_class_anchor_price(v_bp.vehicle_class)::numeric
        / (p_price * CASE WHEN COALESCE(v_corp.sales_buff_price, 0) > 0 THEN 0.90 ELSE 1 END)));

    -- Appeal share against competitor Models of the same type with
    -- stock, HQ'd in the nation.
    -- Dealer Summit (20270850): the CCO's call applies to the next
    -- campaign IN THE SUMMIT'S NATION and falls off there — campaigns
    -- elsewhere leave the charge standing.
    v_summit := (v_corp.summit_nation_id = p_nation_id);
    v_appeal := vehicle_appeal(v_bp.engine, v_bp.quality,
                               COALESCE(array_length(v_bp.packages, 1), 0))
                -- Bench-tested designs (20270847) carry their bonus.
                + COALESCE(v_bp.appeal_bonus, 0)
                + CASE WHEN NOT v_home AND (v_presence).kind = 'subsidiary' THEN 1 ELSE 0 END
                -- Sharpen the Pitch (20270846): the rep's polish.
                + CASE WHEN COALESCE(v_corp.sales_buff_appeal, 0) > 0 THEN 0.5 ELSE 0 END
                + CASE WHEN v_summit THEN 1.5 ELSE 0 END;
    -- Rivals with stock IN this nation: locals' HQ inventory plus
    -- anything foreigners shipped in (their subsidiary badges don't
    -- defend — the bonus is the campaigner's edge).
    SELECT COALESCE(SUM(vehicle_appeal(vb.engine, vb.quality,
                                       COALESCE(array_length(vb.packages, 1), 0))
                        + COALESCE(vb.appeal_bonus, 0)), 0)
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

    -- Drum Up Buyers (20270846): +10% units, rounded up, min +1 —
    -- applied before the stock cap.
    IF COALESCE(v_corp.sales_buff_units, 0) > 0 THEN
        v_units := v_units + GREATEST(1, CEIL(FLOOR(v_units) * 0.10));
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
           sales_buff_units  = GREATEST(0, COALESCE(sales_buff_units, 0) - 1),
           sales_buff_appeal = GREATEST(0, COALESCE(sales_buff_appeal, 0) - 1),
           sales_buff_price  = GREATEST(0, COALESCE(sales_buff_price, 0) - 1),
           summit_nation_id  = CASE WHEN v_summit THEN NULL ELSE summit_nation_id END
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

REVOKE EXECUTE ON FUNCTION public._resolve_sales_campaign(uuid, uuid, uuid, bigint) FROM PUBLIC;

-- ── run_sales_campaign — the owner's wrapper ──────────────────────
CREATE OR REPLACE FUNCTION public.run_sales_campaign(
    p_corp_id      uuid,
    p_nation_id    uuid,
    p_blueprint_id uuid,
    p_price        bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tick int;
    v_res  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
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

    v_res := _resolve_sales_campaign(p_corp_id, p_nation_id, p_blueprint_id, p_price);
    IF COALESCE((v_res->>'success')::boolean, false) THEN
        UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_corp_id;
    END IF;
    RETURN v_res;
END $$;

REVOKE EXECUTE ON FUNCTION public.run_sales_campaign(uuid, uuid, uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.run_sales_campaign(uuid, uuid, uuid, bigint) TO authenticated;

-- ── cco_run_campaign — the chief's own channel ────────────────────
CREATE OR REPLACE FUNCTION public.cco_run_campaign(
    p_nation_id    uuid,
    p_blueprint_id uuid,
    p_price        bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_tick int;
    v_res  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    v_fac := _commercial_chief_check(v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_cco');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_res := _resolve_sales_campaign(v_fac.biz_employer_corp_id, p_nation_id, p_blueprint_id, p_price);
    IF COALESCE((v_res->>'success')::boolean, false) THEN
        UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;
    END IF;
    RETURN v_res;
END $$;

REVOKE EXECUTE ON FUNCTION public.cco_run_campaign(uuid, uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cco_run_campaign(uuid, uuid, bigint) TO authenticated;

-- ── cco_dealer_summit ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cco_dealer_summit(p_nation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_nation nations%ROWTYPE;
    v_tick   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    v_fac := _commercial_chief_check(v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_cco');
    END IF;
    SELECT * INTO v_nation FROM nations
     WHERE id = p_nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_fac.biz_employer_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.summit_nation_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'summit_already_called');
    END IF;

    UPDATE entrepreneur_corps SET summit_nation_id = p_nation_id WHERE id = v_corp.id;
    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true, 'nation', v_nation.name);
END $$;

REVOKE EXECUTE ON FUNCTION public.cco_dealer_summit(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cco_dealer_summit(uuid) TO authenticated;

-- ── cco_fleet_contract ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cco_fleet_contract(
    p_blueprint_id uuid,
    p_quantity     int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_bp   vehicle_blueprints%ROWTYPE;
    v_tick int;
    v_unit bigint;
    v_rev  bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_blueprint_id IS NULL OR p_quantity IS NULL
       OR p_quantity < 1 OR p_quantity > 30 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;
    v_fac := _commercial_chief_check(v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_cco');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_fac.biz_employer_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    SELECT * INTO v_bp FROM vehicle_blueprints
     WHERE id = p_blueprint_id AND corp_id = v_corp.id
     FOR UPDATE;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;
    IF COALESCE(v_bp.units_in_stock, 0) < p_quantity THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_stock',
            'have', COALESCE(v_bp.units_in_stock, 0));
    END IF;

    -- The B2B haircut: 70% of the class anchor, guaranteed.
    v_unit := ROUND(vehicle_class_anchor_price(v_bp.vehicle_class) * 0.70)::bigint;
    v_rev  := v_unit * p_quantity;

    UPDATE vehicle_blueprints
       SET units_in_stock = units_in_stock - p_quantity
     WHERE id = v_bp.id;
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + v_rev
     WHERE id = v_corp.id;
    PERFORM stamp_entrepreneur_corp_revenue(v_corp.id, v_tick, v_rev);
    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true, 'name', v_bp.name,
        'sold', p_quantity, 'unit', v_unit, 'revenue', v_rev);
END $$;

REVOKE EXECUTE ON FUNCTION public.cco_fleet_contract(uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cco_fleet_contract(uuid, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
