-- ════════════════════════════════════════════════════════════════════
-- Remove airline_terminals — gate routes on HQ/RHQ presence instead.
--
-- Why
-- ───
-- The terminal layer was a holdover from when every nation had many
-- cities; with the 3-city-per-nation cull (20270465) it's just an extra
-- click + cost step before opening a route. Every other entrepreneur
-- industry uses corp_buildings.regional_hq as the foreign-nation
-- presence gate; this migration aligns airlines with that model.
--
-- What changes
-- ────────────
-- 1. DROP entrepreneur_claim_terminal / entrepreneur_release_terminal.
-- 2. Rewrite entrepreneur_open_route — drop the no_terminal_origin /
--    no_terminal_dest gates; add a presence check (route endpoint must
--    be in the corp's HQ nation OR a nation where the corp owns a
--    completed regional_hq).
-- 3. Rewrite found_entrepreneur_corp — strip the 2-terminal seeding
--    block from the airline branch. The 1 starter Regional aircraft
--    stays.
-- 4. DELETE corp_properties rows with role='airline_terminal' so the
--    maintenance / valuation loops don't trip on dangling references.
-- 5. DROP TABLE airline_terminals CASCADE.
-- 6. Backfill ent_aircraft_designs.range_nm: any NULL or 0 value gets
--    set to 10 (the max lane distance). Legacy designs that predated
--    the per-design range gate had range_nm unset and were silently
--    excluded from every route — this restores them.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Drop the claim/release RPCs and the now-orphaned admin_delete_hub ──
-- admin_delete_hub still referenced airline_terminals. admin_create_hub /
-- admin_update_hub were already dropped by 20270465 (the orphan UI in
-- admin.html that calls them is a pre-existing issue, not introduced
-- here — flag for follow-up).
DROP FUNCTION IF EXISTS public.entrepreneur_claim_terminal(uuid, uuid);
DROP FUNCTION IF EXISTS public.entrepreneur_release_terminal(uuid, uuid);
DROP FUNCTION IF EXISTS public.admin_delete_hub(uuid);

-- ── 2. entrepreneur_open_route: HQ/RHQ presence gate ────────────────
-- Body copied byte-for-byte from 20270465_airline_three_city_distance_model.sql
-- with the terminal-existence checks (lines 407-414 of that migration)
-- replaced by the presence check below. Aircraft assignment logic
-- (lines 466-478 of 20270465) is unchanged.
CREATE OR REPLACE FUNCTION public.entrepreneur_open_route(
    p_corp_id        uuid,
    p_origin_city_id uuid,
    p_dest_city_id   uuid,
    p_ticket_price   int,
    p_class          text,
    p_count          int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid               uuid := auth.uid();
    v_corp              entrepreneur_corps%ROWTYPE;
    v_fac               factions%ROWTYPE;
    v_origin            airline_cities%ROWTYPE;
    v_dest              airline_cities%ROWTYPE;
    v_a                 uuid;
    v_b                 uuid;
    v_distance          int;
    v_route_type        text;
    v_tick              int;
    v_idle_with_range   int;
    v_route_id          uuid;
    v_ids               uuid[];
    v_has_presence      boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_origin_city_id IS NULL OR p_dest_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_origin_city_id = p_dest_city_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'same_city');
    END IF;
    IF p_ticket_price IS NULL OR p_ticket_price < 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_ticket_price');
    END IF;
    IF p_class NOT IN ('regional', 'narrowbody', 'widebody') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_class');
    END IF;
    IF p_count IS NULL OR p_count < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_aircraft_assigned');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'airline' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_airline_corp');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_origin FROM airline_cities WHERE id = p_origin_city_id;
    SELECT * INTO v_dest   FROM airline_cities WHERE id = p_dest_city_id;
    IF v_origin.id IS NULL OR v_dest.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;

    -- Presence gate: HQ nation OR completed RHQ in either endpoint nation.
    v_has_presence := (
        v_origin.nation_id = v_corp.hq_nation_id
        OR v_dest.nation_id = v_corp.hq_nation_id
        OR EXISTS (
            SELECT 1 FROM corp_buildings
             WHERE owner_corp_id   = p_corp_id
               AND building_type   = 'regional_hq'
               AND status          = 'completed'
               AND nation_id IN (v_origin.nation_id, v_dest.nation_id)
        )
    );
    IF NOT v_has_presence THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_presence_at_endpoint');
    END IF;

    -- Canonical pair order (table CHECK requires origin < dest).
    IF p_origin_city_id < p_dest_city_id THEN
        v_a := p_origin_city_id; v_b := p_dest_city_id;
    ELSE
        v_a := p_dest_city_id;   v_b := p_origin_city_id;
    END IF;

    IF EXISTS (SELECT 1 FROM airline_routes
                WHERE airline_corp_id = p_corp_id
                  AND origin_city_id = v_a AND dest_city_id = v_b
                  AND status = 'active') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'route_exists');
    END IF;

    SELECT distance INTO v_distance FROM airline_city_ranges
     WHERE city_a_id = v_a AND city_b_id = v_b;
    IF v_distance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_distance_data');
    END IF;

    SELECT COUNT(*) INTO v_idle_with_range
      FROM corp_aircraft ca
      LEFT JOIN ent_aircraft_designs d ON d.id = ca.ent_design_id
     WHERE ca.entrepreneur_corp_id = p_corp_id
       AND ca.aircraft_class = p_class
       AND ca.route_id IS NULL
       AND COALESCE(d.range_nm, 0) >= v_distance;
    IF p_count > v_idle_with_range THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_range_aircraft',
            'class', p_class, 'route_distance', v_distance,
            'available_with_range', v_idle_with_range, 'requested', p_count);
    END IF;

    v_route_type := CASE WHEN v_origin.nation_id = v_dest.nation_id THEN 'domestic' ELSE 'international' END;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO airline_routes (
        airline_corp_id, airline_faction_id,
        origin_city_id, dest_city_id, ticket_price,
        aircraft_class, route_type, status, opened_at_tick
    ) VALUES (
        p_corp_id, NULL,
        v_a, v_b, p_ticket_price,
        p_class, v_route_type, 'active', v_tick
    ) RETURNING id INTO v_route_id;

    SELECT array_agg(id) INTO v_ids FROM (
        SELECT ca.id FROM corp_aircraft ca
          LEFT JOIN ent_aircraft_designs d ON d.id = ca.ent_design_id
         WHERE ca.entrepreneur_corp_id = p_corp_id
           AND ca.aircraft_class = p_class
           AND ca.route_id IS NULL
           AND COALESCE(d.range_nm, 0) >= v_distance
         ORDER BY ca.created_at ASC
         LIMIT p_count
         FOR UPDATE OF ca
    ) picks;
    UPDATE corp_aircraft SET route_id = v_route_id WHERE id = ANY(v_ids);

    RETURN jsonb_build_object(
        'success', true, 'route_id', v_route_id,
        'distance', v_distance, 'route_type', v_route_type,
        'aircraft_assigned', array_length(v_ids, 1)
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.entrepreneur_open_route(uuid, uuid, uuid, int, text, int) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_open_route(uuid, uuid, uuid, int, text, int) IS
    'Open an airline route. Presence gate: route must touch the corp''s HQ nation OR a nation where the corp owns a completed regional_hq (no more airline_terminals). Range gate: design.range_nm >= lane distance (1-10).';

-- ── 3. found_entrepreneur_corp: strip terminal seed from airline branch ──
-- Replaces 20270447's version; only diff is the airline branch (lines
-- 116-146 of that migration) — the terminal-claim loop is removed,
-- the 1 starter Regional aircraft seed stays.
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
    v_bld_type      text;
    v_oil_roll      int;
    v_starter_cost  bigint;
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

    -- Airline starter seed: 1 regional aircraft. Terminals are gone —
    -- the corp can fly anything touching its HQ nation immediately.
    IF p_industry = 'airline' THEN
        INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
        VALUES (v_id, 'regional', 100, COALESCE(v_tick, 0));
    END IF;

    -- Oil & Gas starter seed (unchanged from 20270447).
    IF p_industry = 'oil_and_gas' THEN
        v_oil_roll := v_fac.oil_and_gas_starter_roll;
        IF v_oil_roll IS NULL THEN
            v_oil_roll := floor(random() * 3)::int + 1;
        END IF;

        IF v_oil_roll = 1 THEN
            SELECT cost INTO v_starter_cost
              FROM corp_building_cost_profile('pump_jack', NULL, p_hq_nation_id);
            INSERT INTO corp_buildings (
                builder_corp_id, owner_corp_id, nation_id,
                name, tier, building_type,
                cost_paid, ambition_granted,
                status, started_at_tick, completes_at_tick, completed_at_tick,
                gdp_growth_applied, list_price
            ) VALUES (
                v_id, v_id, p_hq_nation_id,
                left(btrim(p_name) || ' Pump Jack', 80), 'small', 'pump_jack',
                COALESCE(v_starter_cost, 0), 0,
                'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
                true, NULL
            );
        ELSIF v_oil_roll = 2 THEN
            SELECT cost INTO v_starter_cost
              FROM corp_building_cost_profile('refinery_small', NULL, p_hq_nation_id);
            INSERT INTO corp_buildings (
                builder_corp_id, owner_corp_id, nation_id,
                name, tier, building_type,
                cost_paid, ambition_granted,
                status, started_at_tick, completes_at_tick, completed_at_tick,
                gdp_growth_applied, list_price
            ) VALUES (
                v_id, v_id, p_hq_nation_id,
                left(btrim(p_name) || ' Small Refinery', 80), 'small', 'refinery_small',
                COALESCE(v_starter_cost, 0), 0,
                'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
                true, NULL
            );
        ELSIF v_oil_roll = 3 THEN
            SELECT cost INTO v_starter_cost
              FROM corp_building_cost_profile('gas_station', NULL, p_hq_nation_id);
            INSERT INTO corp_buildings (
                builder_corp_id, owner_corp_id, nation_id,
                name, tier, building_type,
                cost_paid, ambition_granted,
                status, started_at_tick, completes_at_tick, completed_at_tick,
                gdp_growth_applied, list_price
            )
            SELECT v_id, v_id, p_hq_nation_id,
                   left(btrim(p_name) || ' Gas Station #' || gs.n, 80), 'small', 'gas_station',
                   COALESCE(v_starter_cost, 0), 0,
                   'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
                   true, NULL
              FROM generate_series(1, 3) AS gs(n);
        END IF;

        UPDATE factions
           SET oil_and_gas_starter_roll           = NULL,
               oil_and_gas_starter_rolled_at_tick = NULL
         WHERE id = v_fac.id;
    END IF;

    -- Other industries: one starter unique building.
    IF p_industry IN ('construction','banking','real_estate','shipping','aviation_manufacturing') THEN
        v_bld_type := CASE p_industry
            WHEN 'construction'             THEN 'construction_yard'
            WHEN 'banking'                  THEN 'main_office'
            WHEN 'real_estate'              THEN 'leasing_office'
            WHEN 'shipping'                 THEN 'shipping_depot'
            WHEN 'aviation_manufacturing'   THEN 'aviation_factory'
        END;
        IF v_bld_type IS NOT NULL THEN
            INSERT INTO corp_buildings (
                builder_corp_id, owner_corp_id, nation_id,
                name, tier, building_type,
                cost_paid, ambition_granted,
                status, started_at_tick, completes_at_tick, completed_at_tick,
                gdp_growth_applied, list_price
            ) VALUES (
                v_id, v_id, p_hq_nation_id,
                left(btrim(p_name) || ' ' || replace(initcap(replace(v_bld_type, '_', ' ')), ' ', ' '), 80),
                'small', v_bld_type,
                v_building_cost, 0,
                'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
                true, NULL
            );
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success',   true,
        'id',        v_id,
        'industry',  p_industry,
        'capital',   v_capital,
        'fee',       v_fee,
        'building_cost', v_building_cost,
        'fleet_cost',    v_fleet_cost,
        'total',     v_total
    );
END;
$$;

GRANT EXECUTE ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) TO authenticated;

-- ── 4. Clean up corp_properties rows pointing at airline_terminals ──
-- corp_properties was dropped in sql/migrations/20270251, which never
-- reached supabase/migrations / prod. Guard with to_regclass so the
-- DELETE is a no-op where the table doesn't exist.
DO $$
BEGIN
    IF to_regclass('public.corp_properties') IS NOT NULL THEN
        EXECUTE 'DELETE FROM corp_properties WHERE role = ''airline_terminal''';
    END IF;
END $$;

-- ── 5. Drop the table ───────────────────────────────────────────────
DROP TABLE IF EXISTS airline_terminals CASCADE;

-- ── 6. Backfill range_nm on legacy aircraft designs ─────────────────
-- Designs predating the per-design range gate had range_nm = NULL or 0;
-- after 20270465 they were silently excluded from every route. Set to
-- 10 (the max lane distance) so legacy fleets can fly again.
UPDATE ent_aircraft_designs
   SET range_nm = 10
 WHERE range_nm IS NULL OR range_nm <= 0;

NOTIFY pgrst, 'reload schema';

COMMIT;
