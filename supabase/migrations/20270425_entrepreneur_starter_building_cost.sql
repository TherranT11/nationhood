-- ════════════════════════════════════════════════════════════════════
-- Entrepreneur founding: charge for the starter unique building
--
-- Pre-20270425, the starter "unique building" (construction_yard,
-- banking_office, port, real_estate_office, light/engine_assembly_plant)
-- seeded by found_entrepreneur_corp had cost_paid = 0. Players paid
-- the capital + 5% founding fee, and the building came for free. This
-- migration sets cost_paid to a real value scaled per-industry and
-- per-nation, and adds it to the cash gate so the founder must hold
-- party_funds ≥ capital + fee + scaled_building_cost.
--
-- ── Per-industry base cost (small-tier scale) ───────────────────────
--   construction          $20M (construction_yard)
--   banking               $15M (banking_office — smaller footprint)
--   shipping              $30M (port)
--   real_estate           $15M (real_estate_office)
--   airline               $25M (virtual "Terminal Hub" — see below)
--   aviation_manufacturing $25M (light/engine assembly plant)
-- Tunable in starter_building_base_cost() if these don't read right
-- in playtest.
--
-- ── Nation scaling ──────────────────────────────────────────────────
-- Same multiplier 20270172_nation_cost_scaling.sql's begin_construction
-- uses:
--   col_factor = 0.5 + cost_of_living / 100              (0.5 .. 1.5)
--   inf_factor = 0.5 + (100 − infrastructure) / 100
--                                                        (0.5 .. 1.5)
--   multiplier = col_factor × inf_factor                 (0.25 .. 2.25)
-- A high-CoL, low-infrastructure nation makes founding ~2x as
-- expensive as a low-CoL, high-infra one. NULL stats fall back to 50
-- which gives multiplier 1.0.
--
-- ── SOT note (begin_construction) ───────────────────────────────────
-- begin_construction still has the multiplier formula inlined. The new
-- helper nation_construction_cost_multiplier() introduced here is the
-- canonical source going forward; when begin_construction is next
-- touched for any reason, switch it to call the helper. Doing that
-- refactor now would expand this commit beyond the entrepreneur side.
--
-- ── Airline footnote ────────────────────────────────────────────────
-- Airline doesn't seed a corp_buildings row (its starter is 2 aircraft
-- + 2 terminals). The starter cost is still deducted from party_funds
-- — skipping airline would make it the cheapest industry to found,
-- inverting the intended pressure. No corp_buildings cost_paid to
-- update; the money is treated as terminal-network setup expenditure.
--
-- ── Existing corps not retroactively charged ───────────────────────
-- Corps founded before this migration keep cost_paid = 0 on their
-- starter building. Backfilling would mean deducting historical money
-- from owner factions, which is a heavier operational decision than
-- belongs in this migration.
--
-- Idempotent: CREATE OR REPLACE on the two helpers + the RPC.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Helper 1: nation cost multiplier ────────────────────────────────
CREATE OR REPLACE FUNCTION public.nation_construction_cost_multiplier(p_nation_id uuid)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT (0.5 + COALESCE(cost_of_living, 50) / 100.0)
         * (0.5 + (100 - COALESCE(infrastructure, 50)) / 100.0)
      FROM nations WHERE id = p_nation_id;
$$;
GRANT EXECUTE ON FUNCTION public.nation_construction_cost_multiplier(uuid) TO authenticated;

COMMENT ON FUNCTION public.nation_construction_cost_multiplier(uuid) IS
    'Construction-cost multiplier for a nation. col_factor × inf_factor from 20270172. Returns NULL for unknown nations; caller decides whether that''s an error or a soft fallback (found_entrepreneur_corp treats it as a hard error via invalid_hq_nation).';

-- ── Helper 2: per-industry starter base cost ────────────────────────
CREATE OR REPLACE FUNCTION public.starter_building_base_cost(p_industry text)
RETURNS bigint
LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT CASE p_industry
        WHEN 'construction'           THEN 20000000
        WHEN 'banking'                THEN 15000000
        WHEN 'shipping'               THEN 30000000
        WHEN 'real_estate'            THEN 15000000
        WHEN 'airline'                THEN 25000000
        WHEN 'aviation_manufacturing' THEN 25000000
        ELSE 0
    END::bigint;
$$;
GRANT EXECUTE ON FUNCTION public.starter_building_base_cost(text) TO authenticated;

COMMENT ON FUNCTION public.starter_building_base_cost(text) IS
    'Base cost in dollars (small-tier scale) for an industry''s starter unique building, pre-nation-scaling. Source of truth for entrepreneur_corp_founding_cost + found_entrepreneur_corp.';

-- ── Helper 3 / RPC: founding cost preview ───────────────────────────
-- Wraps the math the UI needs so client-side never duplicates it.
-- Returns capital + fee + scaled building cost as a breakdown.
CREATE OR REPLACE FUNCTION public.entrepreneur_corp_founding_cost(
    p_industry     text,
    p_hq_nation_id uuid,
    p_capital      bigint
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_cap       bigint  := GREATEST(0, COALESCE(p_capital, 0));
    v_fee       bigint;
    v_base      bigint;
    v_mult      numeric;
    v_bld_cost  bigint;
BEGIN
    v_fee      := (v_cap * 5) / 100;
    v_base     := starter_building_base_cost(p_industry);
    v_mult     := nation_construction_cost_multiplier(p_hq_nation_id);
    v_bld_cost := COALESCE(ROUND(v_base * v_mult)::bigint, 0);

    RETURN jsonb_build_object(
        'capital',         v_cap,
        'fee',             v_fee,
        'building_base',   v_base,
        'nation_mult',     v_mult,
        'building_cost',   v_bld_cost,
        'total',           v_cap + v_fee + v_bld_cost
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.entrepreneur_corp_founding_cost(text, uuid, bigint) TO authenticated;

-- ── Re-author found_entrepreneur_corp ───────────────────────────────
-- Body = 20270213 + four patches:
--   1. v_building_cost computed via the helpers.
--   2. v_total now adds v_building_cost.
--   3. The deduct UPDATE uses the new v_total.
--   4. corp_buildings.cost_paid set to v_building_cost (was 0).
-- Everything else (validation, listing, airline seed, freighters,
-- aviation 1D6 roll) is byte-for-byte the same.
CREATE OR REPLACE FUNCTION found_entrepreneur_corp(
    p_industry text, p_hq_nation_id uuid, p_name text, p_capital bigint, p_listing text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_capital      bigint := COALESCE(p_capital, 0);
    v_fee          bigint;
    v_building_cost bigint;
    v_mult         numeric;
    v_total        bigint;
    v_id           uuid;
    v_tick         int;
    v_listing      text;
    v_city         uuid;
    v_seed_nation  uuid;
    v_bld_type     text;
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

    -- Nation scaling — NULL means the nation doesn't exist (or has no
    -- continent / stats). Existing valid-nation guard from 20270213 is
    -- preserved below via the SELECT into v_fac block; the multiplier
    -- helper returns NULL for unknown nations too, which we hard-error
    -- on as invalid_hq_nation.
    v_mult := nation_construction_cost_multiplier(p_hq_nation_id);
    IF v_mult IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_hq_nation');
    END IF;
    v_building_cost := ROUND(starter_building_base_cost(p_industry) * v_mult)::bigint;

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
    v_total := v_capital + v_fee + v_building_cost;
    IF COALESCE(v_fac.party_funds, 0) < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have',          COALESCE(v_fac.party_funds, 0),
            'need',          v_total,
            'capital',       v_capital,
            'fee',           v_fee,
            'building_cost', v_building_cost);
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

    -- Airline starter seed (unchanged): 2 regional aircraft + 2 starter
    -- terminals. Airline gets no corp_buildings row, so v_building_cost
    -- is debited from party_funds (via v_total above) but doesn't land
    -- on a building's cost_paid — it's the "Terminal Hub" virtual line
    -- the migration header documents.
    IF p_industry = 'airline' THEN
        UPDATE entrepreneur_corps SET aircraft_regional_owned = 2 WHERE id = v_id;

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

    -- Starter unique building. cost_paid is now v_building_cost
    -- (was 0 pre-20270425); ambition_granted stays 0 — founding
    -- infrastructure doesn't grant ambition.
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
        'capital', v_capital, 'founding_fee', v_fee, 'building_cost', v_building_cost,
        'total_paid', v_total);
END;
$$;

GRANT EXECUTE ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) TO authenticated;

COMMENT ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) IS
    'Found an entrepreneur corp. Debits capital + 5%% fee + nation-scaled starter building cost from party_funds; seeds treasury_cash = capital. Public adds 20-share AMM state. Airline gets 2 regional aircraft + 2 terminals (no corp_buildings row; the building_cost is a virtual Terminal Hub charge). construction/banking/real_estate/shipping/aviation_manufacturing each get 1 completed unique building (cost_paid = scaled starter cost) in their HQ nation; shipping also gets 2 freighters; aviation_manufacturing rolls 1D6 for its starter (1-5 Light Assembly Plant, 6 Engine Assembly Plant).';

NOTIFY pgrst, 'reload schema';

COMMIT;
