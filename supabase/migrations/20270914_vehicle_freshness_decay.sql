-- ════════════════════════════════════════════════════════════════════
-- 20270914 — Model freshness decay: designs age out of the showroom
--
-- Design change: a Model's showroom pull now fades with its age. Until
-- now appeal was timeless — a sedan drafted in year 1 competed on equal
-- footing with a fresh rival in year 30, so there was no pull to keep
-- designing new Models once you had a good one.
--
-- vehicle_freshness(age_ticks) is a multiplier on a Model's INTRINSIC
-- appeal (vehicle_appeal + bench-tested appeal_bonus):
--   • Years 0–2  (ticks 0–24):  1.00 — a new design sells at full pull.
--   • Years 2–10 (ticks 24–120): linear slide 1.00 → 0.25.
--   • Year 10+   (ticks 120+):   holds at the 0.25 floor (a classic
--     still moves a trickle — it never drops to nothing).
-- Age is current_tick − vehicle_blueprints.created_at_tick.
--
-- It folds into _resolve_sales_campaign's appeal-share on BOTH sides —
-- the campaigning Model and every rival in the denominator — so shares
-- stay normalized and a dated design loses buyers to fresher rivals
-- exactly as the showroom fills out. Campaign-moment boosts (the
-- subsidiary badge, Sharpen the Pitch) ride on top un-aged: those are
-- the sales push, not the car's vintage.
--
-- Sales are action-driven (run_sales_campaign → _resolve_sales_campaign,
-- 20270853 the latest body) and that is the only appeal-share site —
-- analyze_vehicle_market reports demand and inventory, not competition,
-- so it is untouched.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.vehicle_freshness(p_age_ticks int)
RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$
    -- Full pull for 24 ticks, then a linear slide of 0.75 over the next
    -- 96 ticks down to a 0.25 floor, held forever after.
    SELECT GREATEST(0.25, LEAST(1.0,
        1.0 - (GREATEST(0, COALESCE(p_age_ticks, 0)) - 24) * (0.75 / 96.0)));
$$;
COMMENT ON FUNCTION public.vehicle_freshness(int) IS
    'A Model''s showroom freshness by age in ticks: 1.0 for the first 24 (2y), sliding to a 0.25 floor by tick 120 (10y) and holding there. Scales intrinsic appeal in _resolve_sales_campaign so dated designs lose share to fresher rivals.';

-- ── _resolve_sales_campaign — appeal now fades with the Model's age ──
-- Re-emitted from 20270853; the only change is vehicle_freshness folded
-- into the campaigner's and the rivals' intrinsic appeal.
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
    -- stock, HQ'd in the nation. The Model's intrinsic appeal fades
    -- with its age (Freshness, 20270914) — a 2-year grace, then a
    -- slide to a 0.25 floor by year 10.
    v_appeal := (vehicle_appeal(v_bp.engine, v_bp.quality,
                                COALESCE(array_length(v_bp.packages, 1), 0))
                 -- Bench-tested designs (20270847) carry their bonus.
                 + COALESCE(v_bp.appeal_bonus, 0))
                * vehicle_freshness(v_tick - COALESCE(v_bp.created_at_tick, 0))
                + CASE WHEN NOT v_home AND (v_presence).kind = 'subsidiary' THEN 1 ELSE 0 END
                -- Sharpen the Pitch (20270846): the rep's polish.
                + CASE WHEN COALESCE(v_corp.sales_buff_appeal, 0) > 0 THEN 0.5 ELSE 0 END;
    -- Rivals with stock IN this nation: locals' HQ inventory plus
    -- anything foreigners shipped in (their subsidiary badges don't
    -- defend — the bonus is the campaigner's edge). Each rival's
    -- appeal fades with its own age the same way.
    SELECT COALESCE(SUM((vehicle_appeal(vb.engine, vb.quality,
                                        COALESCE(array_length(vb.packages, 1), 0))
                         + COALESCE(vb.appeal_bonus, 0))
                        * vehicle_freshness(v_tick - COALESCE(vb.created_at_tick, 0))), 0)
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
           sales_buff_price  = GREATEST(0, COALESCE(sales_buff_price, 0) - 1)
     WHERE id = p_corp_id;
    IF v_rev > 0 THEN
        PERFORM stamp_entrepreneur_corp_revenue(p_corp_id, v_tick, v_rev);
    END IF;

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Sales campaign in %s — sold %s × %s for $%s.', v_nation.name, v_sold, v_bp.name, v_rev));
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

NOTIFY pgrst, 'reload schema';
