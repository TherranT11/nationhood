-- ════════════════════════════════════════════════════════════════════
-- Oil & Gas Phase 3a — Founding starter 1D3 roll
--
-- Replaces the Phase 2 flat $10M "Operating License" with a real
-- starter package that varies by a 1D3 roll:
--
--   Roll 1 → 1 Pump Jack         (in HQ nation, completed)
--   Roll 2 → 1 Small Refinery    (in HQ nation, completed)
--   Roll 3 → 3 Gas Stations      (all in HQ nation, completed)
--
-- Asset value spread: ~$8M / ~$80M / ~$18M (pre-nation-mult). Founder
-- pays a flat $30M × nation_mult regardless of roll — so Roll 2 is a
-- jackpot, Roll 1 is a sting, Roll 3 is roughly fair. The gamble is the
-- design.
--
-- ── Persistence model: roll-once-and-stick ──────────────────────────
-- The roll is saved to the faction (factions.oil_and_gas_starter_roll)
-- the FIRST time a player picks Oil & Gas in the Found Corp modal.
-- Every subsequent open of the modal reads the same saved value —
-- closing without founding doesn't reroll. The roll is cleared only
-- when the player actually founds the corp (found_entrepreneur_corp
-- consumes it on the oil_and_gas branch). Next Oil & Gas founding =
-- fresh roll.
--
-- Server-side write only: REVOKE UPDATE on the two new columns so
-- a savvy client can't reroll via direct PATCH.
--
-- ── Scope deferred to Phase 3b/c ────────────────────────────────────
-- The other Phase 3 design items — survey action (1d10 - 2 with $5M+
-- $10M-per-boost), tradeable Drilling Permit asset, dry-survey plot
-- consumption, and nations.oil_and_gas plot inventory tracking — are
-- independent feature surfaces and not in this migration. Starter
-- roll lands first because the founding flow is what the player
-- touches at corp creation; the rest builds on top.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: saved roll on factions ──────────────────────────────
ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS oil_and_gas_starter_roll           int,
    ADD COLUMN IF NOT EXISTS oil_and_gas_starter_rolled_at_tick int;

REVOKE UPDATE (oil_and_gas_starter_roll, oil_and_gas_starter_rolled_at_tick)
    ON factions FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN factions.oil_and_gas_starter_roll IS
    'Saved 1D3 outcome for the entrepreneur''s next Oil & Gas founding. 1=Pump Jack / 2=Small Refinery / 3=3 Gas Stations. NULL = never rolled or already consumed at last founding. Server-only writes (RPC oil_and_gas_starter_roll seeds it, found_entrepreneur_corp clears it).';
COMMENT ON COLUMN factions.oil_and_gas_starter_rolled_at_tick IS
    'Game tick at which the saved Oil & Gas starter roll was generated. NULL when the roll is NULL.';

-- ── 2. Helper: label per roll ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.oil_and_gas_starter_label(p_roll int)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_roll
        WHEN 1 THEN '1 Pump Jack'
        WHEN 2 THEN '1 Small Refinery'
        WHEN 3 THEN '3 Gas Stations'
        ELSE NULL
    END;
$$;
GRANT EXECUTE ON FUNCTION public.oil_and_gas_starter_label(int) TO authenticated;

COMMENT ON FUNCTION public.oil_and_gas_starter_label(int) IS
    'Single source for the player-facing label of an Oil & Gas starter roll outcome. 1=Pump Jack, 2=Small Refinery, 3=3 Gas Stations.';

-- ── 3. RPC: get-or-roll the starter ────────────────────────────────
-- Idempotent on the faction's saved state. Always returns the
-- canonical starter info for whatever roll the faction has saved
-- (or generates one on first call). Caller doesn't need to know
-- whether it was a fresh roll or a replay — the `fresh` flag is
-- there for UI nicety ("rolled when you first considered Oil & Gas").
CREATE OR REPLACE FUNCTION public.oil_and_gas_starter_roll()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_roll int;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
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

    -- Replay path: already rolled, return the saved value.
    IF v_fac.oil_and_gas_starter_roll IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success',        true,
            'roll',           v_fac.oil_and_gas_starter_roll,
            'label',          oil_and_gas_starter_label(v_fac.oil_and_gas_starter_roll),
            'rolled_at_tick', v_fac.oil_and_gas_starter_rolled_at_tick,
            'fresh',          false
        );
    END IF;

    -- Fresh roll: 1-3 inclusive.
    v_roll := floor(random() * 3)::int + 1;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET oil_and_gas_starter_roll           = v_roll,
           oil_and_gas_starter_rolled_at_tick = v_tick
     WHERE id = v_fac.id;

    RETURN jsonb_build_object(
        'success',        true,
        'roll',           v_roll,
        'label',          oil_and_gas_starter_label(v_roll),
        'rolled_at_tick', v_tick,
        'fresh',          true
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.oil_and_gas_starter_roll() TO authenticated;

COMMENT ON FUNCTION public.oil_and_gas_starter_roll() IS
    'Get-or-roll the Oil & Gas founding starter for the current entrepreneur. Returns the saved roll if one exists; otherwise rolls 1D3 and persists it. Cleared at founding time by found_entrepreneur_corp''s oil_and_gas branch — so the next Oil & Gas founding gets a fresh roll. FOR UPDATE on the faction row prevents concurrent double-rolls.';

-- ── 4. Founding fee bump: $10M → $30M for Oil & Gas ────────────────
-- The $30M base is the flat fee a founder pays regardless of which
-- 1D3 outcome they got — designed so Roll 2 is a jackpot vs the $80M
-- refinery market value, Roll 1 is a sting vs the $8M pump market
-- value, Roll 3 is roughly fair.
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
        WHEN 'oil_and_gas'            THEN 30000000   -- Phase 3a 1D3 starter
        ELSE 0
    END::bigint;
$$;
GRANT EXECUTE ON FUNCTION public.starter_building_base_cost(text) TO authenticated;

COMMENT ON FUNCTION public.starter_building_base_cost(text) IS
    'Base cost in dollars for an industry''s starter package, pre-nation-scaling. Source of truth for entrepreneur_corp_founding_cost + found_entrepreneur_corp. Oil & Gas: $30M flat fee covering whatever the 1D3 starter roll lands on.';

-- ── 5. found_entrepreneur_corp — Oil & Gas branch ──────────────────
-- Body of 20270441 + a new Oil & Gas branch that reads the saved
-- starter roll, defensively rolls if NULL (e.g. founder submitted
-- without ever calling the get-or-roll RPC), seeds the matching
-- corp_buildings rows, and clears the saved roll on the faction.
--
-- Buildings seeded have cost_paid = the building's standard base cost
-- (not the $30M flat starter fee) so book value is accurate per
-- building. The $30M fee is captured in v_building_cost / v_total
-- the same way Airline's Terminal Hub fee is — debited from
-- party_funds, doesn't end up on any corp_buildings.cost_paid.
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
    v_oil_roll      int;
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

    -- Airline starter seed: 1 regional aircraft + 2 same-nation terminals.
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

    -- Oil & Gas starter seed: read the saved 1D3 roll (or roll now if
    -- the founder submitted without the modal having pre-rolled),
    -- materialise the matching corp_buildings rows in the HQ nation,
    -- then clear the saved roll so the next Oil & Gas founding gets
    -- a fresh outcome.
    IF p_industry = 'oil_and_gas' THEN
        v_oil_roll := v_fac.oil_and_gas_starter_roll;
        IF v_oil_roll IS NULL THEN
            v_oil_roll := floor(random() * 3)::int + 1;
        END IF;

        IF v_oil_roll = 1 THEN
            -- 1 Pump Jack
            INSERT INTO corp_buildings (
                builder_corp_id, owner_corp_id, nation_id,
                name, tier, building_type,
                cost_paid, ambition_granted,
                status, started_at_tick, completes_at_tick, completed_at_tick,
                gdp_growth_applied, list_price
            ) VALUES (
                v_id, v_id, p_hq_nation_id,
                left(btrim(p_name) || ' Pump Jack', 80), 'small', 'pump_jack',
                ROUND(8000000 * v_mult)::bigint, 0,
                'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
                true, NULL
            );
        ELSIF v_oil_roll = 2 THEN
            -- 1 Small Refinery
            INSERT INTO corp_buildings (
                builder_corp_id, owner_corp_id, nation_id,
                name, tier, building_type,
                cost_paid, ambition_granted,
                status, started_at_tick, completes_at_tick, completed_at_tick,
                gdp_growth_applied, list_price
            ) VALUES (
                v_id, v_id, p_hq_nation_id,
                left(btrim(p_name) || ' Small Refinery', 80), 'small', 'refinery_small',
                ROUND(80000000 * v_mult)::bigint, 0,
                'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
                true, NULL
            );
        ELSIF v_oil_roll = 3 THEN
            -- 3 Gas Stations
            INSERT INTO corp_buildings (
                builder_corp_id, owner_corp_id, nation_id,
                name, tier, building_type,
                cost_paid, ambition_granted,
                status, started_at_tick, completes_at_tick, completed_at_tick,
                gdp_growth_applied, list_price
            )
            SELECT v_id, v_id, p_hq_nation_id,
                   left(btrim(p_name) || ' Gas Station #' || gs.n, 80), 'small', 'gas_station',
                   ROUND(6000000 * v_mult)::bigint, 0,
                   'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
                   true, NULL
              FROM generate_series(1, 3) AS gs(n);
        END IF;

        -- Consume the saved roll. Next Oil & Gas founding rolls fresh.
        UPDATE factions
           SET oil_and_gas_starter_roll           = NULL,
               oil_and_gas_starter_rolled_at_tick = NULL
         WHERE id = v_fac.id;
    END IF;

    -- Other industries: one starter unique building.
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
        'oil_starter_roll', CASE WHEN p_industry = 'oil_and_gas' THEN v_oil_roll END,
        'total_paid',    v_total);
END;
$$;
GRANT EXECUTE ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
