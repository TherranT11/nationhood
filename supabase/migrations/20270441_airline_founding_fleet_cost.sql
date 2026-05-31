-- ════════════════════════════════════════════════════════════════════
-- Charge airline founders for their starter aircraft
--
-- Pre-this migration, an Airline corp founded with 2 free regional
-- aircraft. Off-the-shelf regional jets cost $60M each via
-- entrepreneur_buy_aircraft (20270204), so founding effectively gave
-- the player $120M of market-value aircraft for $0.
--
-- This migration:
--   1. Charges the founder $60M (= 1 regional jet × $60M market
--      price) for the starter aircraft. No founder discount — same
--      price players pay for additional jets after founding.
--   2. Cuts the starter fleet from 2 jets to 1. Airline founders
--      now buy their second jet through the normal purchase flow
--      once the corp is running.
--
-- Three surgical updates:
--   1. airline_starter_fleet_cost() — new helper. Single source
--      ($60M for 1 jet at market).
--   2. entrepreneur_corp_founding_cost() — adds fleet_cost to the
--      returned breakdown (0 for non-airline). Total now includes it.
--   3. found_entrepreneur_corp() — debits the same fleet_cost from
--      party_funds, seeds 1 corp_aircraft row instead of 2,
--      surfaces the new field in the insufficient_funds breakdown
--      and success payload.
--
-- Terminal seed (2 same-nation airline_terminals claimed) preserved
-- byte-for-byte — that's a separate "right to fly here" mechanic,
-- not part of the fleet count.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Helper: airline starter fleet cost ───────────────────────────
-- 1 regional jet × $60M market price. Matches entrepreneur_buy_aircraft
-- (20270204) exactly — no founder discount, no special-case pricing,
-- the founder pays the same as a player buying a second regional jet
-- after founding. If the starter jet count or the regional class
-- price ever moves, this total updates here.
CREATE OR REPLACE FUNCTION public.airline_starter_fleet_cost()
RETURNS bigint
LANGUAGE sql IMMUTABLE
AS $$
    SELECT 60000000::bigint;
$$;
GRANT EXECUTE ON FUNCTION public.airline_starter_fleet_cost() TO authenticated;

COMMENT ON FUNCTION public.airline_starter_fleet_cost() IS
    'Total cash debited at airline founding for the 1 regional starter aircraft ($60M market rate, same as entrepreneur_buy_aircraft). Single source for entrepreneur_corp_founding_cost preview + found_entrepreneur_corp debit.';

-- ── 2. Preview: include fleet_cost in the breakdown ─────────────────
CREATE OR REPLACE FUNCTION public.entrepreneur_corp_founding_cost(
    p_industry     text,
    p_hq_nation_id uuid,
    p_capital      bigint
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_cap        bigint  := GREATEST(0, COALESCE(p_capital, 0));
    v_fee        bigint;
    v_base       bigint;
    v_mult       numeric;
    v_bld_cost   bigint;
    v_fleet_cost bigint;
BEGIN
    v_fee        := (v_cap * 5) / 100;
    v_base       := starter_building_base_cost(p_industry);
    v_mult       := nation_construction_cost_multiplier(p_hq_nation_id);
    v_bld_cost   := COALESCE(ROUND(v_base * v_mult)::bigint, 0);
    v_fleet_cost := CASE WHEN p_industry = 'airline' THEN airline_starter_fleet_cost() ELSE 0 END;

    RETURN jsonb_build_object(
        'capital',       v_cap,
        'fee',           v_fee,
        'building_cost', v_bld_cost,
        'fleet_cost',    v_fleet_cost,
        'total',         v_cap + v_fee + v_bld_cost + v_fleet_cost
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.entrepreneur_corp_founding_cost(text, uuid, bigint) TO authenticated;

-- ── 3. Founding RPC: debit the starter fleet ────────────────────────
-- Body identical to 20270440 with v_fleet_cost threaded through:
-- computed alongside v_building_cost, added to v_total, surfaced in
-- the insufficient_funds breakdown, returned in the success payload.
-- Airline branch (corp_aircraft INSERT + terminal seed) unchanged.
CREATE OR REPLACE FUNCTION found_entrepreneur_corp(
    p_industry text, p_hq_nation_id uuid, p_name text, p_capital bigint, p_listing text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_fac           factions%ROWTYPE;
    v_capital       bigint := COALESCE(p_capital, 0);
    v_fee           bigint;
    v_building_cost bigint;
    v_fleet_cost    bigint;
    v_mult          numeric;
    v_total         bigint;
    v_id            uuid;
    v_tick          int;
    v_listing       text;
    v_city          uuid;
    v_seed_nation   uuid;
    v_bld_type      text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF v_capital < 5000000 OR v_capital > 500000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_capital');
    END IF;
    IF p_industry IS NULL OR length(btrim(p_industry)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_industry');
    END IF;
    IF p_hq_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_hq_nation');
    END IF;
    v_listing := lower(COALESCE(NULLIF(btrim(p_listing), ''), 'private'));
    IF v_listing NOT IN ('private','public') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_listing');
    END IF;

    v_mult := nation_construction_cost_multiplier(p_hq_nation_id);
    IF v_mult IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_hq_nation');
    END IF;
    v_building_cost := ROUND(starter_building_base_cost(p_industry) * v_mult)::bigint;
    v_fleet_cost    := CASE WHEN p_industry = 'airline' THEN airline_starter_fleet_cost() ELSE 0 END;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    v_fee   := (v_capital * 5) / 100;
    v_total := v_capital + v_fee + v_building_cost + v_fleet_cost;
    IF COALESCE(v_fac.party_funds, 0) < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have',          COALESCE(v_fac.party_funds, 0),
            'need',          v_total,
            'capital',       v_capital,
            'fee',           v_fee,
            'building_cost', v_building_cost,
            'fleet_cost',    v_fleet_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_total
     WHERE id = v_fac.id;

    INSERT INTO entrepreneur_corps
        (owner_faction_id, name, industry, hq_nation_id, starting_capital, founding_fee,
         listing, founded_tick, treasury_cash, shares_outstanding, share_price)
    VALUES
        (v_fac.id, btrim(p_name), p_industry, p_hq_nation_id, v_capital, v_fee,
         v_listing, COALESCE(v_tick, 0),
         v_capital::numeric,
         CASE WHEN v_listing = 'public' THEN 20 END,
         CASE WHEN v_listing = 'public' THEN v_capital::numeric / 20 END)
    RETURNING id INTO v_id;

    IF v_listing = 'public' THEN
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (v_id, v_fac.id, 20);
    END IF;

    -- Airline starter seed: 1 regional aircraft + 2 same-nation
    -- terminals. Fleet cost ($60M for the jet) was already debited
    -- above; this just materializes the row. Terminal claims are a
    -- separate mechanic (the right to fly into a city) and stay at 2.
    IF p_industry = 'airline' THEN
        INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
        VALUES (v_id, 'regional', 100, COALESCE(v_tick, 0));

        SELECT nation_id INTO v_seed_nation
          FROM airline_cities
         GROUP BY nation_id
        HAVING COUNT(*) >= 2
         ORDER BY (nation_id = p_hq_nation_id) DESC, SUM(population_pct) DESC
         LIMIT 1;

        IF v_seed_nation IS NOT NULL THEN
            FOR v_city IN
                SELECT id FROM airline_cities
                 WHERE nation_id = v_seed_nation
                 ORDER BY population_pct DESC, name ASC
                 LIMIT 2
            LOOP
                UPDATE airline_terminals
                   SET owner_corp_id = v_id, acquired_at_tick = COALESCE(v_tick, 0)
                 WHERE id = (
                     SELECT id FROM airline_terminals
                      WHERE city_id = v_city
                        AND owner_airline_id IS NULL
                        AND owner_corp_id   IS NULL
                      ORDER BY terminal_number ASC
                      LIMIT 1
                 );
            END LOOP;
        END IF;
    END IF;

    IF p_industry IN ('construction','banking','real_estate','shipping','aviation_manufacturing') THEN
        v_bld_type := CASE p_industry
            WHEN 'construction' THEN 'construction_yard'
            WHEN 'banking'      THEN 'banking_office'
            WHEN 'real_estate'  THEN 'real_estate_office'
            WHEN 'shipping'     THEN 'port'
            WHEN 'aviation_manufacturing' THEN
                CASE WHEN floor(random() * 6) + 1 >= 6
                     THEN 'engine_assembly_plant' ELSE 'light_assembly_plant' END
        END;

        INSERT INTO corp_buildings (
            builder_corp_id, owner_corp_id, nation_id,
            name, tier, building_type,
            cost_paid, ambition_granted,
            status, started_at_tick, completes_at_tick, completed_at_tick,
            gdp_growth_applied, list_price
        ) VALUES (
            v_id, v_id, p_hq_nation_id,
            left(btrim(p_name) || ' ' || initcap(replace(v_bld_type, '_', ' ')), 80), 'small', v_bld_type,
            v_building_cost, 0,
            'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
            true, NULL
        );

        IF p_industry = 'shipping' THEN
            UPDATE entrepreneur_corps SET freighters_owned = 2 WHERE id = v_id;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'corp_id', v_id, 'listing', v_listing,
        'capital',       v_capital,
        'founding_fee',  v_fee,
        'building_cost', v_building_cost,
        'fleet_cost',    v_fleet_cost,
        'total_paid',    v_total);
END;
$$;

GRANT EXECUTE ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
