-- ════════════════════════════════════════════════════════════════════
-- 20270656 — Corp founding restricted to Melizea / Avelia / Montequilla
--
-- User policy: no new entrepreneur corporations may be founded outside
-- those three nations. Layers on top of the existing home-nation gate
-- (20270490 / 20270565) so an existing entrepreneur whose home is
-- elsewhere — pre-033ea45 creation, or seeded data — can no longer
-- found a corp anywhere.
--
-- Pairs with 033ea45's client-side entrepreneur picker filter (which
-- restricts NEW entrepreneur creation to the same three nations).
-- That gate cuts off the supply of new entrepreneurs in other
-- nations; this gate handles the back-stop for any existing ones.
--
-- One-line policy change wrapped in a full re-emit of
-- found_entrepreneur_corp (the codebase convention for RPC body
-- changes). Body otherwise byte-identical to 20270565 except:
--   • The new CORP_NATION_ALLOWLIST check sits right after the
--     home-nation match (so the v_home_name already equals the
--     hq nation's name by lower/trim semantics).
--   • Error shape: { success: false, reason: 'corp_nation_not_allowed',
--                    allowed: [...], home_nation: <name> }.
--     Client (entrepreneur-corporations.html FRIENDLY map) gets a
--     dedicated copy line in the same commit.
--
-- Allowlist is hardcoded in the RPC + client filter + select-nation
-- picker. Three places, one list — drift risk acknowledged; if the
-- list grows beyond a handful of entries, lift to a config table or
-- a nations.foundable boolean column.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    v_home_name     text;
    v_home_id       uuid;
    v_nation_name   text;
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

    -- Home-nation gate. Origin = ent_origin_nation when set (20270349),
    -- else fall back to current nation so pre-snapshot entrepreneurs
    -- aren't locked out. Compare names case-insensitively / trim-safe
    -- to match the travel RPC's own comparison style.
    v_home_name := COALESCE(NULLIF(btrim(v_fac.ent_origin_nation), ''), v_fac.nation);
    IF v_home_name IS NULL OR length(btrim(v_home_name)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_home_nation');
    END IF;

    SELECT id INTO v_home_id FROM nations
     WHERE lower(btrim(name)) = lower(btrim(v_home_name))
     LIMIT 1;
    IF v_home_id IS NULL OR p_hq_nation_id <> v_home_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_home_nation',
            'home_nation', v_home_name);
    END IF;

    IF lower(btrim(COALESCE(v_fac.nation, ''))) <> lower(btrim(v_home_name)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_at_home_nation',
            'home_nation',      v_home_name,
            'current_location', v_fac.nation);
    END IF;

    -- 20270656: corp founding restricted to Melizea / Avelia /
    -- Montequilla. The home-nation gate above already proved
    -- v_home_name and the hq nation's name match (case/trim-insensitive),
    -- so testing the home name is equivalent to testing the hq nation
    -- and skips a second nation row read.
    IF lower(btrim(v_home_name)) NOT IN ('melizea', 'avelia', 'montequilla') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_nation_not_allowed',
            'home_nation', v_home_name,
            'allowed',     jsonb_build_array('Melizea', 'Avelia', 'Montequilla'));
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

    -- Airline branch: no starter seed (20270479).

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

    IF p_industry IN ('construction','banking','real_estate','shipping','aviation_manufacturing') THEN
        v_bld_type := CASE p_industry
            WHEN 'construction'             THEN 'construction_yard'
            WHEN 'banking'                  THEN 'banking_office'
            WHEN 'real_estate'              THEN 'real_estate_office'
            WHEN 'shipping'                 THEN 'port'
            WHEN 'aviation_manufacturing'   THEN
                CASE WHEN floor(random() * 6) + 1 >= 6
                     THEN 'engine_assembly_plant' ELSE 'light_assembly_plant' END
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

    -- Phase B hook (20270565): emit a 'corp_founded' event so the
    -- Corporate History container picks up incorporation.
    SELECT name INTO v_nation_name FROM nations WHERE id = p_hq_nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        p_hq_nation_id, v_id,
        'Corporation Founded',
        format('%s was founded in %s with $%s in starting capital (%s).',
               btrim(p_name),
               COALESCE(v_nation_name, '—'),
               to_char(v_capital, 'FM999,999,999,999'),
               v_listing),
        'business', 'corp_founded',
        jsonb_build_object(
            'corp_id',         v_id,
            'industry',        p_industry,
            'capital',         v_capital,
            'fee',             v_fee,
            'listing',         v_listing,
            'founder_faction_id', v_fac.id
        ),
        COALESCE(v_tick, 0)
    );

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

COMMIT;
