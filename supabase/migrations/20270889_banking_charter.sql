-- ════════════════════════════════════════════════════════════════════
-- 20270889 — Banking charters on the Businessman path
--
-- DESIGN (user-confirmed): banks are founded through Start Company
-- like construction and automotive, foundable wherever businessmen
-- live (Sierramar / Melizea / Avelia / Montequilla — the founding
-- RPC already binds the HQ city to the founder's own nation):
--
--   • Cost: $50M base × Standard of Living / 50 — the 20270835
--     formula with banking priced above automotive's $35M as the
--     most capital-intensive charter in the game.
--   • The 20/80 split: 20% burns as the charter, 80% is DEPOSITED
--     into the corp treasury as the bank's opening reserve (and
--     stamped as starting_capital). Construction/automotive fees
--     keep burning in full — their first dollar comes from clients;
--     a bank's first dollar comes from its own vault.
--   • The legacy entrepreneur path RETIRES for banking:
--     found_entrepreneur_corp refuses industry 'banking'
--     (banking_retired). Existing entrepreneur banks grandfather
--     untouched.
--
-- The five banking asset ladders, the rate sheet, and the loan
-- window land in subsequent slices — this migration is the door.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Businessman charter ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.businessman_start_corporation(
    p_faction_id uuid,
    p_city_id    uuid,
    p_industry   text,
    p_name       text,
    p_logo_url   text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_city   cities%ROWTYPE;
    v_tick   int;
    v_cost   numeric;
    v_reserve bigint := 0;
    v_sol    numeric;
    v_corp_id uuid;
    v_name   text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_industry NOT IN ('construction', 'automotive', 'banking') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_industry');
    END IF;
    v_name := btrim(COALESCE(p_name, ''));
    IF length(v_name) < 2 OR length(v_name) > 60 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_businessman');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT * INTO v_city FROM cities
     WHERE id = p_city_id AND nation_id = v_fac.nation_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_city');
    END IF;

    IF EXISTS (SELECT 1 FROM entrepreneur_corps WHERE lower(name) = lower(v_name)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_taken');
    END IF;

    -- Founding capital — $10M construction / $35M automotive / $50M
    -- banking (20270889), scaled by the nation's Standard of Living
    -- (50 is baseline: SoL 75 costs 1.5×, SoL 40 costs 0.8×).
    -- Banking splits the charge 20/80: a fifth burns as the charter,
    -- the rest is DEPOSITED into the corp treasury as the bank's
    -- opening reserve — a bank with an empty vault is a sign on a
    -- door. Construction/automotive fees burn in full as before.
    SELECT GREATEST(1, COALESCE(standard_of_living, 50)) INTO v_sol
      FROM nations WHERE id = v_fac.nation_id;
    v_cost := ROUND(CASE p_industry
                        WHEN 'banking'    THEN 50000000
                        WHEN 'automotive' THEN 35000000
                        ELSE                   10000000
                    END * COALESCE(v_sol, 50) / 50.0);
    v_reserve := CASE WHEN p_industry = 'banking'
                      THEN ROUND(v_cost * 0.80) ELSE 0 END;

    IF COALESCE(v_fac.party_funds, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'cost', v_cost, 'funds', COALESCE(v_fac.party_funds, 0));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_cost
     WHERE id = v_fac.id;

    INSERT INTO entrepreneur_corps (
        owner_faction_id, name, industry,
        hq_city, hq_nation_id,
        starting_capital, founding_fee, listing,
        founded_tick, logo_url, experience, treasury_cash
    ) VALUES (
        v_fac.id, v_name, p_industry,
        v_city.city_name, v_fac.nation_id,
        v_reserve, v_cost, 'private',
        v_tick, NULLIF(btrim(COALESCE(p_logo_url, '')), ''),
        -- 20270832: automotive corps open with 5 Experience — the
        -- Design Studio bootstrap (construction earns from builds).
        CASE WHEN p_industry = 'automotive' THEN 5 ELSE 0 END,
        -- Banking: the 80% reserve opens the vault (20270889).
        v_reserve
    ) RETURNING id INTO v_corp_id;

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key, fired_at_tick
    ) VALUES (
        v_fac.nation_id, v_fac.id,
        'Corporation Founded',
        COALESCE(v_fac.faction_name, 'A businessman') || ' has founded ' || v_name
            || ' in ' || v_city.city_name || '.',
        'economy', 'businessman_founded_corp', v_tick
    );

    RETURN jsonb_build_object(
        'success',   true,
        'corp_id',   v_corp_id,
        'corp_name', v_name,
        'city',      v_city.city_name,
        'reserve_deposited', v_reserve,
        'new_funds', COALESCE(v_fac.party_funds, 0) - v_cost
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.businessman_start_corporation(uuid, uuid, text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.businessman_start_corporation(uuid, uuid, text, text, text) TO authenticated;

-- ── 2. The legacy path retires ────────────────────────────────────
CREATE OR REPLACE FUNCTION found_entrepreneur_corp(
    p_industry text, p_hq_nation_id uuid, p_name text, p_capital bigint, p_listing text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid            uuid := auth.uid();
    v_fac            factions%ROWTYPE;
    v_capital        bigint := COALESCE(p_capital, 0);
    v_fee            bigint;
    v_building_cost  bigint;
    v_fleet_cost     bigint;
    v_mult           numeric;
    v_total          bigint;
    v_id             uuid;
    v_tick           int;
    v_listing        text;
    v_bld_type       text;
    v_oil_roll       int;
    v_starter_cost   bigint;
    v_home_name      text;
    v_home_id        uuid;
    v_home_foundable boolean;
    v_allowed        text[];
    v_nation_name    text;
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
    -- 20270889 DESIGN CHANGE: banking charters moved to the
    -- Businessman path ($50M × SoL/50, 20/80 burn/reserve).
    -- Existing entrepreneur banks are grandfathered; no new ones.
    IF p_industry = 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'banking_retired');
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

    -- 20270657: combined home_nation lookup + foundable_for_corp read,
    -- so we don't round-trip to nations twice. v_home_foundable is the
    -- column-driven gate replacing 20270656's hardcoded IN clause.
    SELECT id, foundable_for_corp INTO v_home_id, v_home_foundable
      FROM nations
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

    -- 20270657: corp founding gated by nations.foundable_for_corp.
    -- Single server-side source of truth — admin tooling toggles the
    -- column, this RPC just reads it. Rejection payload includes the
    -- live allowed list (computed once on the failure path) so the
    -- client can render any future policy change without a code edit.
    IF NOT COALESCE(v_home_foundable, FALSE) THEN
        SELECT array_agg(name ORDER BY name) INTO v_allowed
          FROM nations
         WHERE foundable_for_corp = TRUE;
        RETURN jsonb_build_object('success', false, 'reason', 'corp_nation_not_allowed',
            'home_nation', v_home_name,
            'allowed',     COALESCE(to_jsonb(v_allowed), '[]'::jsonb));
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

NOTIFY pgrst, 'reload schema';

COMMIT;
