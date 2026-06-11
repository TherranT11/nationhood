-- ════════════════════════════════════════════════════════════════════
-- 20270846 — The Field Sales Rep's kit (Commercial rung 1)
--
-- The second employee kit: a hired Field Sales Representative /
-- Marketing Analyst (commercial track, rung 1 — verified on the
-- live hire row) picks one action per tick (the shared
-- factions.biz_action_tick allowance), priming the employer's NEXT
-- Sales Campaign:
--
--   · drum_up_buyers     — +10% units sold, rounded up, min +1,
--                          applied before the stock cap
--   · sharpen_pitch      — +0.5 appeal in the demand split (the
--                          contested-market tool)
--   · sweeten_financing  — the price factor reads the sticker 10%
--                          lower than what buyers actually pay
--
-- Max 1 pending charge of each type; one of each falls off when the
-- next campaign runs. run_sales_campaign re-emitted byte-faithful to
-- 20270842 except the three buffs and their consumption.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS sales_buff_units  int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sales_buff_appeal int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sales_buff_price  int NOT NULL DEFAULT 0;

-- ── sales_rep_action ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sales_rep_action(p_action text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_corp  entrepreneur_corps%ROWTYPE;
    v_tick  int;
    v_have  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_action NOT IN ('drum_up_buyers', 'sharpen_pitch', 'sweeten_financing') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_businessman');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    IF v_fac.biz_employer_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_employed');
    END IF;

    -- The kit belongs to the rung-1 Field Sales Representative —
    -- verified on the live hire row.
    IF NOT EXISTS (
        SELECT 1 FROM job_applicants a
          JOIN job_openings o ON o.id = a.opening_id
         WHERE a.applicant_faction_id = v_fac.id
           AND a.status = 'hired'
           AND o.corp_id = v_fac.biz_employer_corp_id
           AND o.track = 'commercial'
           AND o.rung = 1
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_sales_rep');
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

    -- Max 1 pending charge of each type — campaigns run once a tick.
    v_have := COALESCE(CASE p_action
        WHEN 'drum_up_buyers'    THEN v_corp.sales_buff_units
        WHEN 'sharpen_pitch'     THEN v_corp.sales_buff_appeal
        WHEN 'sweeten_financing' THEN v_corp.sales_buff_price
    END, 0);
    IF v_have >= 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'campaign_already_primed');
    END IF;

    UPDATE entrepreneur_corps SET
        sales_buff_units  = sales_buff_units  + CASE WHEN p_action = 'drum_up_buyers'    THEN 1 ELSE 0 END,
        sales_buff_appeal = sales_buff_appeal + CASE WHEN p_action = 'sharpen_pitch'     THEN 1 ELSE 0 END,
        sales_buff_price  = sales_buff_price  + CASE WHEN p_action = 'sweeten_financing' THEN 1 ELSE 0 END
     WHERE id = v_corp.id;
    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true, 'action', p_action, 'pending', 1, 'cap', 1);
END $$;

REVOKE EXECUTE ON FUNCTION public.sales_rep_action(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.sales_rep_action(text) TO authenticated;

-- ── run_sales_campaign — the rep's charges ride the next one ──────
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
    -- Sweeten the Financing (20270846): the demand math reads the
    -- price 10% lower than the full sticker the buyers actually pay.
    v_units := v_units * GREATEST(0.4, LEAST(1.6,
        vehicle_class_anchor_price(v_bp.vehicle_class)::numeric
        / (p_price * CASE WHEN COALESCE(v_corp.sales_buff_price, 0) > 0 THEN 0.90 ELSE 1 END)));

    -- Appeal share against competitor Models of the same type with
    -- stock, HQ'd in the nation.
    v_appeal := vehicle_appeal(v_bp.engine, v_bp.quality,
                               COALESCE(array_length(v_bp.packages, 1), 0))
                + CASE WHEN NOT v_home AND (v_presence).kind = 'subsidiary' THEN 1 ELSE 0 END
                -- Sharpen the Pitch (20270846): the rep's polish.
                + CASE WHEN COALESCE(v_corp.sales_buff_appeal, 0) > 0 THEN 0.5 ELSE 0 END;
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

NOTIFY pgrst, 'reload schema';

COMMIT;
