-- ════════════════════════════════════════════════════════════════════
-- Oil & Gas Phase 2 — Production Loop with Reserves
--
-- Per-tick processor runs the OWNED EQUIPMENT — pumps extract crude
-- into the corp's Crude Reserve; refineries convert crude → refined
-- (up to refinery capacity per tick); gas stations pull refined from
-- the Refined Reserve and sell at retail markup to the local market.
-- That's it — no automatic spot sales.
--
-- Reserves accumulate. A pure-extraction player who skips refineries
-- watches crude pile up doing nothing until they fire a manual
-- sell_crude_to_spot. A refiner without gas stations watches refined
-- pile up until they sell_refined_to_spot. Gas-station owners
-- "consume" their refined inventory each tick at the retail price.
--
-- Five new building types:
--   pump_jack         $8M    — produces 3 crude/tick into Reserve
--   refinery_small    $80M   — converts 4 crude → 4 refined/tick
--   refinery_regular  $170M  — converts 10/tick
--   refinery_large    $300M  — converts 20/tick
--   gas_station       $6M    — sells (SoL+Inf)/20 refined/tick at retail
--
-- Two new player RPCs (manual spot-market sales):
--   sell_crude_to_spot(corp_id, qty_or_null)    @ $20k / unit
--   sell_refined_to_spot(corp_id, qty_or_null)  @ $100k / unit
--
-- Founding cost: starter_building_base_cost('oil_and_gas') flips
-- from $0 → $10M ("Operating License" — no asset seeded, regulatory
-- fee flavor). Phase 3 will introduce the 1D3 starter roll for real
-- starter assets.
--
-- Build path: Oil & Gas corp requests construction via
-- request_building_construction; Construction corp bids and delivers;
-- sector lock blocks any non-oil corp from owning these types.
-- Same pattern as apartments.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: reserves + per-corp tick stamp + CHECK ───────────────
-- crude_reserve / refined_reserve accumulate units (1 unit = 1 barrel
-- abstraction). bigint because long-term hoarding is plausible if a
-- player drills aggressively without refining or selling. Default 0
-- so existing corps and freshly-founded ones start empty.
ALTER TABLE entrepreneur_corps
    ADD COLUMN IF NOT EXISTS crude_reserve            bigint NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS refined_reserve          bigint NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS oil_last_processed_tick  int;

-- Server-side writers only. Reserves shift via the tick processor or
-- the sell-to-spot RPCs; clients never write directly.
REVOKE UPDATE (crude_reserve, refined_reserve, oil_last_processed_tick)
    ON entrepreneur_corps FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN entrepreneur_corps.crude_reserve IS
    'Barrels of crude oil held in this oil_and_gas corp''s reserve. Pumps produce into it (3/pump/tick); refineries draw from it; sell_crude_to_spot moves units to treasury at the crude spot price. Server-only writes.';
COMMENT ON COLUMN entrepreneur_corps.refined_reserve IS
    'Barrels of refined oil held in this oil_and_gas corp''s reserve. Refineries produce into it; gas stations draw from it at retail markup; sell_refined_to_spot moves units to treasury at the refined spot price. Server-only writes.';
COMMENT ON COLUMN entrepreneur_corps.oil_last_processed_tick IS
    'Game tick at which this corp''s oil & gas production loop last ran. Idempotency guard for process_oil_and_gas. NULL = never processed.';

-- corp_buildings CHECK constraint — add five new types alongside
-- apartments (20270436) and the existing seven.
ALTER TABLE corp_buildings DROP CONSTRAINT IF EXISTS corp_buildings_building_type_check;
ALTER TABLE corp_buildings ADD CONSTRAINT corp_buildings_building_type_check
    CHECK (building_type IN ('regional_hq','construction_yard','port','banking_office',
                             'real_estate_office','light_assembly_plant','engine_assembly_plant',
                             'apartment_basic','apartment_modest','apartment_luxury',
                             'pump_jack','refinery_small','refinery_regular','refinery_large',
                             'gas_station'));

-- ── 2. Sector lock: oil & gas types are oil-corp only ───────────────
CREATE OR REPLACE FUNCTION public.corp_building_required_sector(p_building_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE p_building_type
        WHEN 'construction_yard'     THEN 'construction'
        WHEN 'port'                  THEN 'shipping'
        WHEN 'banking_office'        THEN 'banking'
        WHEN 'engine_assembly_plant' THEN 'aviation_manufacturing'
        WHEN 'light_assembly_plant'  THEN 'aviation_manufacturing'
        WHEN 'apartment_basic'       THEN 'real_estate'
        WHEN 'apartment_modest'      THEN 'real_estate'
        WHEN 'apartment_luxury'      THEN 'real_estate'
        WHEN 'pump_jack'             THEN 'oil_and_gas'
        WHEN 'refinery_small'        THEN 'oil_and_gas'
        WHEN 'refinery_regular'      THEN 'oil_and_gas'
        WHEN 'refinery_large'        THEN 'oil_and_gas'
        WHEN 'gas_station'           THEN 'oil_and_gas'
        ELSE NULL
    END;
$$;

COMMENT ON FUNCTION public.corp_building_required_sector(text) IS
    'Single source of truth for the building_type → required buyer industry sector-lock. NULL = no restriction. apartment_* → real_estate; engine/light_assembly_plant → aviation_manufacturing; pump_jack / refinery_* / gas_station → oil_and_gas. Called by broker_buy_listing, buy_building, accept_offer, request_building_construction.';

-- ── 3. Cost profile: oil & gas types with pinned eff_tier + flat cost
-- Same pattern as plants + apartments. eff_tier supplies duration +
-- ambition; cost is overridden per type. Pattern-B sensitivity stays
-- at 1.0 for oil & gas (no infrastructure penalty for Phase 2).
CREATE OR REPLACE FUNCTION public.corp_building_cost_profile(
    p_building_type text,
    p_tier          text,
    p_nation_id     uuid,
    OUT eff_tier    text,
    OUT cost        bigint,
    OUT duration    int,
    OUT ambition    smallint,
    OUT col         numeric,
    OUT inf         numeric,
    OUT mult        numeric
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_cost_base   bigint;
    v_dur_base    int;
    v_sensitivity numeric;
    v_apt_premium numeric;
BEGIN
    eff_tier := CASE p_building_type
        WHEN 'engine_assembly_plant' THEN 'medium'
        WHEN 'light_assembly_plant'  THEN 'large'
        WHEN 'apartment_basic'       THEN 'small'
        WHEN 'apartment_modest'      THEN 'medium'
        WHEN 'apartment_luxury'      THEN 'large'
        WHEN 'pump_jack'             THEN 'small'
        WHEN 'refinery_small'        THEN 'small'
        WHEN 'refinery_regular'      THEN 'medium'
        WHEN 'refinery_large'        THEN 'large'
        WHEN 'gas_station'           THEN 'small'
        ELSE p_tier
    END;

    v_cost_base := CASE eff_tier
        WHEN 'small'      THEN 20000000
        WHEN 'medium'     THEN 50000000
        WHEN 'large'      THEN 100000000
        WHEN 'major'      THEN 200000000
        WHEN 'monumental' THEN 400000000
        ELSE NULL
    END;
    v_dur_base := CASE eff_tier
        WHEN 'small' THEN 24 WHEN 'medium' THEN 27 WHEN 'large' THEN 30
        WHEN 'major' THEN 33 WHEN 'monumental' THEN 36 ELSE NULL
    END;
    ambition := CASE eff_tier
        WHEN 'small' THEN 1 WHEN 'medium' THEN 2 WHEN 'large' THEN 3
        WHEN 'major' THEN 4 WHEN 'monumental' THEN 5 ELSE NULL
    END;

    -- Per-type cost overrides.
    IF p_building_type = 'engine_assembly_plant' THEN
        v_cost_base := 45000000;
    ELSIF p_building_type = 'light_assembly_plant' THEN
        v_cost_base := 75000000;
    ELSIF p_building_type = 'apartment_basic' THEN
        v_cost_base := 12000000;
    ELSIF p_building_type = 'apartment_modest' THEN
        v_cost_base := 25000000;
    ELSIF p_building_type = 'apartment_luxury' THEN
        v_cost_base := 60000000;
    ELSIF p_building_type = 'pump_jack' THEN
        v_cost_base := 8000000;
    ELSIF p_building_type = 'refinery_small' THEN
        v_cost_base := 80000000;
    ELSIF p_building_type = 'refinery_regular' THEN
        v_cost_base := 170000000;
    ELSIF p_building_type = 'refinery_large' THEN
        v_cost_base := 300000000;
    ELSIF p_building_type = 'gas_station' THEN
        v_cost_base := 6000000;
    END IF;

    -- Apartment Pattern-B sensitivity (every other type defaults 1.0).
    v_sensitivity := CASE p_building_type
        WHEN 'apartment_modest' THEN 1.3
        WHEN 'apartment_luxury' THEN 1.7
        ELSE 1.0
    END;

    SELECT COALESCE(cost_of_living, 50), COALESCE(infrastructure, 50)
      INTO col, inf
      FROM nations WHERE id = p_nation_id;
    col  := COALESCE(col, 50);
    inf  := COALESCE(inf, 50);
    mult := (0.5 + col / 100.0) * (0.5 + (100 - inf) / 100.0);

    v_apt_premium := 1.0 + (v_sensitivity - 1.0) * (100.0 - inf) / 100.0;

    IF v_cost_base IS NULL THEN
        cost := NULL; duration := NULL;
    ELSE
        cost     := ROUND(v_cost_base::numeric * mult * v_apt_premium)::bigint;
        duration := GREATEST(1, ROUND(v_dur_base::numeric * mult)::int);
    END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.corp_building_cost_profile(text, text, uuid) TO authenticated;

COMMENT ON FUNCTION public.corp_building_cost_profile(text, text, uuid) IS
    'Single source for a corp building''s cost / duration / ambition given type+tier+nation. Plants, apartments, and oil & gas types pin their own eff_tier + cost. Apartments apply Pattern-B infrastructure premium; other types collapse to base × mult. cost=NULL = invalid tier. Used by begin_construction + request_building_construction.';

-- ── 4. Commercial build load: include oil & gas types ───────────────
CREATE OR REPLACE FUNCTION public.corp_commercial_build_load(p_corp_id uuid, p_nation_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT (
        (SELECT count(*) FROM corp_buildings
          WHERE builder_corp_id = p_corp_id AND nation_id = p_nation_id
            AND status = 'in_progress'
            AND building_type IN ('port','banking_office','real_estate_office',
                                  'engine_assembly_plant','light_assembly_plant',
                                  'apartment_basic','apartment_modest','apartment_luxury',
                                  'pump_jack','refinery_small','refinery_regular',
                                  'refinery_large','gas_station'))
      + (SELECT count(*) FROM ent_construction_contracts
          WHERE winner_corp_id = p_corp_id AND nation_id = p_nation_id
            AND status = 'active'
            AND building_type IN ('port','banking_office','real_estate_office',
                                  'engine_assembly_plant','light_assembly_plant',
                                  'apartment_basic','apartment_modest','apartment_luxury',
                                  'pump_jack','refinery_small','refinery_regular',
                                  'refinery_large','gas_station'))
    )::int;
$$;
GRANT EXECUTE ON FUNCTION public.corp_commercial_build_load(uuid, uuid) TO authenticated;

-- ── 5. request_building_construction whitelist ──────────────────────
DROP FUNCTION IF EXISTS public.request_building_construction(uuid, text, text, uuid, text, int);

CREATE OR REPLACE FUNCTION public.request_building_construction(
    p_corp_id       uuid,
    p_name          text,
    p_building_type text,
    p_nation_id     uuid,
    p_tier          text,
    p_bidding_ticks int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_corp         entrepreneur_corps%ROWTYPE;
    v_req_sector   text;
    v_prof         record;
    v_nation_name  text;
    v_tick         int;
    v_id           uuid;
    v_num          text;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments'); END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_building_type NOT IN ('regional_hq','construction_yard','port','banking_office',
                               'real_estate_office','engine_assembly_plant','light_assembly_plant',
                               'apartment_basic','apartment_modest','apartment_luxury',
                               'pump_jack','refinery_small','refinery_regular','refinery_large',
                               'gas_station') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    v_req_sector := corp_building_required_sector(p_building_type);
    IF v_req_sector IS NOT NULL AND v_req_sector <> v_corp.industry THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_sector',
            'required', v_req_sector, 'have', v_corp.industry);
    END IF;

    SELECT name INTO v_nation_name FROM nations WHERE id = p_nation_id;
    IF v_nation_name IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found'); END IF;

    SELECT * INTO v_prof FROM corp_building_cost_profile(p_building_type, p_tier, p_nation_id);
    IF v_prof.cost IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier'); END IF;
    IF p_building_type = 'regional_hq' AND v_prof.eff_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    IF COALESCE(v_corp.treasury_cash, 0) < v_prof.cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_corp.treasury_cash, 0)::bigint, 'need', v_prof.cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_num  := 'BLD-' || v_tick || '-' || left(replace(gen_random_uuid()::text, '-', ''), 5);

    INSERT INTO ent_construction_contracts (
        contract_number, name, contract_type, issuer_corp_id, issuer_name,
        building_type, nation_id, tier, build_cost, spec_tier, timeline_ticks,
        bidding_closes_tick, completion_effects, created_at_tick
    ) VALUES (
        v_num, btrim(p_name), 'private', p_corp_id, v_corp.name,
        p_building_type, p_nation_id, v_prof.eff_tier, v_prof.cost, NULL, v_prof.duration,
        v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6)), '{}'::jsonb, v_tick
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'contract_id', v_id,
        'floor', v_prof.cost, 'timeline_ticks', v_prof.duration,
        'bidding_closes_tick', v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6)));
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_building_construction(uuid, text, text, uuid, text, int) TO authenticated;

-- ── 6. Founding: $10M Operating License for oil & gas ───────────────
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
        WHEN 'oil_and_gas'            THEN 10000000   -- Operating License
        ELSE 0
    END::bigint;
$$;
GRANT EXECUTE ON FUNCTION public.starter_building_base_cost(text) TO authenticated;

COMMENT ON FUNCTION public.starter_building_base_cost(text) IS
    'Base cost in dollars for an industry''s starter building / license, pre-nation-scaling. Source of truth for entrepreneur_corp_founding_cost + found_entrepreneur_corp. oil_and_gas charges $10M for an Operating License (no asset seeded) until Phase 3 introduces the 1D3 starter roll.';

-- ── 7. Market price helpers — single source for spot + retail ───────
-- Three constants, three helpers. process_oil_and_gas, sell_crude_to_spot,
-- and sell_refined_to_spot all read from these so the prices live in
-- exactly one place. JS-side mirrors live in utils.js OIL_GAS_DEFS.
CREATE OR REPLACE FUNCTION public.oil_gas_crude_spot_price()
RETURNS bigint LANGUAGE sql IMMUTABLE AS $$ SELECT 20000::bigint; $$;
CREATE OR REPLACE FUNCTION public.oil_gas_refined_spot_price()
RETURNS bigint LANGUAGE sql IMMUTABLE AS $$ SELECT 100000::bigint; $$;
CREATE OR REPLACE FUNCTION public.oil_gas_retail_price()
RETURNS bigint LANGUAGE sql IMMUTABLE AS $$ SELECT 130000::bigint; $$;
GRANT EXECUTE ON FUNCTION public.oil_gas_crude_spot_price()   TO authenticated;
GRANT EXECUTE ON FUNCTION public.oil_gas_refined_spot_price() TO authenticated;
GRANT EXECUTE ON FUNCTION public.oil_gas_retail_price()       TO authenticated;

COMMENT ON FUNCTION public.oil_gas_crude_spot_price()   IS 'Crude oil spot market price per barrel ($/unit). Single source.';
COMMENT ON FUNCTION public.oil_gas_refined_spot_price() IS 'Refined oil spot market price per barrel ($/unit). Single source.';
COMMENT ON FUNCTION public.oil_gas_retail_price()       IS 'Gas station retail price per barrel of refined oil sold to local market ($/unit). Single source.';

-- ── 8. Per-tick production processor ────────────────────────────────
-- Runs the OWNED EQUIPMENT every tick. No spot-market activity.
--   1. Pumps add 3 crude per pump to crude_reserve.
--   2. Refineries pull min(refinery_capacity, crude_reserve) from
--      crude_reserve and add the same amount to refined_reserve.
--   3. Gas stations pull min(total_demand, refined_reserve) from
--      refined_reserve and credit treasury_cash at retail price.
-- Anything left in reserves stays there until the player fires
-- sell_crude_to_spot / sell_refined_to_spot manually.
--
-- FOR UPDATE on entrepreneur_corps row only (lock scope lesson from
-- the apartment audit, 20270439).
CREATE OR REPLACE FUNCTION public.process_oil_and_gas(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_corp                 RECORD;
    v_pumps                int;
    v_refine_cap           bigint;
    v_demand               bigint;
    v_crude_produced       bigint;
    v_refined_made         bigint;
    v_sold_to_stations     bigint;
    v_retail_revenue       bigint;
    v_count                int := 0;
    v_total_retail         bigint := 0;
    v_total_crude_added    bigint := 0;
    v_total_refined_made   bigint := 0;
BEGIN
    FOR v_corp IN
        SELECT id, crude_reserve, refined_reserve
          FROM entrepreneur_corps
         WHERE industry = 'oil_and_gas'
           AND (oil_last_processed_tick IS NULL OR oil_last_processed_tick <> p_tick)
         FOR UPDATE
    LOOP
        -- 1. Extraction
        SELECT COUNT(*) INTO v_pumps
          FROM corp_buildings
         WHERE owner_corp_id = v_corp.id
           AND building_type = 'pump_jack'
           AND status = 'completed';
        v_crude_produced := (v_pumps * 3)::bigint;

        -- 2. Refining capacity (sum per-tier throughput)
        SELECT COALESCE(SUM(CASE building_type
            WHEN 'refinery_small'   THEN 4
            WHEN 'refinery_regular' THEN 10
            WHEN 'refinery_large'   THEN 20
            ELSE 0 END), 0)::bigint INTO v_refine_cap
          FROM corp_buildings
         WHERE owner_corp_id = v_corp.id
           AND building_type IN ('refinery_small','refinery_regular','refinery_large')
           AND status = 'completed';
        -- Pull from crude_reserve PLUS what pumps just produced; the
        -- refinery is processing this tick's intake immediately if there's
        -- room in the same tick (no one-tick lag between pump and refine).
        v_refined_made := LEAST(v_refine_cap, v_corp.crude_reserve + v_crude_produced);

        -- 3. Gas station retail consumption
        SELECT COALESCE(SUM(FLOOR((COALESCE(n.standard_of_living, 50)
                                 + COALESCE(n.infrastructure,    50)) / 20.0)), 0)::bigint
          INTO v_demand
          FROM corp_buildings b
          JOIN nations n ON n.id = b.nation_id
         WHERE b.owner_corp_id = v_corp.id
           AND b.building_type = 'gas_station'
           AND b.status = 'completed';
        v_sold_to_stations := LEAST(v_demand, v_corp.refined_reserve + v_refined_made);
        v_retail_revenue   := v_sold_to_stations * oil_gas_retail_price();

        -- 4. Commit deltas. Reserves are NET of in/out this tick.
        UPDATE entrepreneur_corps
           SET crude_reserve   = crude_reserve   + v_crude_produced - v_refined_made,
               refined_reserve = refined_reserve + v_refined_made   - v_sold_to_stations,
               treasury_cash   = COALESCE(treasury_cash, 0) + v_retail_revenue,
               oil_last_processed_tick = p_tick
         WHERE id = v_corp.id;

        v_count               := v_count + 1;
        v_total_retail        := v_total_retail + v_retail_revenue;
        v_total_crude_added   := v_total_crude_added + v_crude_produced;
        v_total_refined_made  := v_total_refined_made + v_refined_made;
    END LOOP;

    RETURN jsonb_build_object(
        'success',            true,
        'tick',               p_tick,
        'corps_processed',    v_count,
        'crude_produced',     v_total_crude_added,
        'refined_produced',   v_total_refined_made,
        'retail_revenue',     v_total_retail
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_oil_and_gas(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_oil_and_gas(int) TO service_role;

COMMENT ON FUNCTION public.process_oil_and_gas(int) IS
    'Per-tick production processor for Oil & Gas corps. Runs owned equipment: pumps → crude_reserve, refineries crude_reserve → refined_reserve (up to capacity), gas stations refined_reserve → treasury at retail. No automatic spot sales — those are manual player actions via sell_crude_to_spot / sell_refined_to_spot. Idempotent within a tick (oil_last_processed_tick). Service-role only; called from advance-corp-tick.';

-- ── 9. Player action: sell crude to spot market ─────────────────────
-- Owner-only. NULL quantity = sell all. Positive quantity = sell exact,
-- error if reserve < quantity (player gets clear feedback rather than
-- a silent partial fill).
CREATE OR REPLACE FUNCTION public.sell_crude_to_spot(
    p_corp_id  uuid,
    p_quantity bigint DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_fac       factions%ROWTYPE;
    v_corp      entrepreneur_corps%ROWTYPE;
    v_qty       bigint;
    v_price     bigint;
    v_revenue   bigint;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments'); END IF;
    IF p_quantity IS NOT NULL AND p_quantity <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF v_corp.industry <> 'oil_and_gas' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_oil_and_gas_corp');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    v_qty := COALESCE(p_quantity, v_corp.crude_reserve);
    IF v_qty <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'empty_reserve');
    END IF;
    IF v_qty > v_corp.crude_reserve THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_reserve',
            'have', v_corp.crude_reserve, 'requested', v_qty);
    END IF;

    v_price   := oil_gas_crude_spot_price();
    v_revenue := v_qty * v_price;

    UPDATE entrepreneur_corps
       SET crude_reserve = crude_reserve - v_qty,
           treasury_cash = COALESCE(treasury_cash, 0) + v_revenue
     WHERE id = p_corp_id;

    RETURN jsonb_build_object(
        'success',           true,
        'sold',              v_qty,
        'unit_price',        v_price,
        'revenue',           v_revenue,
        'crude_reserve_after', v_corp.crude_reserve - v_qty
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.sell_crude_to_spot(uuid, bigint) TO authenticated;

COMMENT ON FUNCTION public.sell_crude_to_spot(uuid, bigint) IS
    'Owner-only manual sell of crude oil from the corp''s reserve to the spot market at oil_gas_crude_spot_price. NULL quantity = sell all; positive quantity = sell exact (rejects if reserve < quantity). FOR UPDATE on the corp row serialises against the per-tick processor.';

-- ── 10. Player action: sell refined to spot market ──────────────────
CREATE OR REPLACE FUNCTION public.sell_refined_to_spot(
    p_corp_id  uuid,
    p_quantity bigint DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_fac       factions%ROWTYPE;
    v_corp      entrepreneur_corps%ROWTYPE;
    v_qty       bigint;
    v_price     bigint;
    v_revenue   bigint;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments'); END IF;
    IF p_quantity IS NOT NULL AND p_quantity <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF v_corp.industry <> 'oil_and_gas' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_oil_and_gas_corp');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    v_qty := COALESCE(p_quantity, v_corp.refined_reserve);
    IF v_qty <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'empty_reserve');
    END IF;
    IF v_qty > v_corp.refined_reserve THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_reserve',
            'have', v_corp.refined_reserve, 'requested', v_qty);
    END IF;

    v_price   := oil_gas_refined_spot_price();
    v_revenue := v_qty * v_price;

    UPDATE entrepreneur_corps
       SET refined_reserve = refined_reserve - v_qty,
           treasury_cash   = COALESCE(treasury_cash, 0) + v_revenue
     WHERE id = p_corp_id;

    RETURN jsonb_build_object(
        'success',             true,
        'sold',                v_qty,
        'unit_price',          v_price,
        'revenue',             v_revenue,
        'refined_reserve_after', v_corp.refined_reserve - v_qty
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.sell_refined_to_spot(uuid, bigint) TO authenticated;

COMMENT ON FUNCTION public.sell_refined_to_spot(uuid, bigint) IS
    'Owner-only manual sell of refined oil from the corp''s reserve to the spot market at oil_gas_refined_spot_price. NULL quantity = sell all; positive quantity = sell exact (rejects if reserve < quantity). FOR UPDATE on the corp row serialises against the per-tick processor.';

NOTIFY pgrst, 'reload schema';

COMMIT;
