-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR FOUNDING — home-nation only
-- ════════════════════════════════════════════════════════════════════
-- Design change: an entrepreneur can only FOUND corporations in their
-- home nation (factions.nation, stored by name at creation). Corps expand
-- to other nations per-corp by building a regional HQ there (existing
-- begin_construction → regional_hq → ports/offices mechanic) — but new
-- corps are always founded at home. No foreign founding.
--
-- This re-defines found_entrepreneur_corp identical to 20270220 with ONE
-- added gate after the faction lookup: p_hq_nation_id must resolve to the
-- entrepreneur's home nation. Existing foreign-HQ corps are grandfathered
-- (the gate only runs at founding). Returns the clean {success,reason}
-- shape so the UI can message it. Apply after 20270220.
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
    v_uid         uuid := auth.uid();
    v_fac         factions%ROWTYPE;
    v_capital     bigint := COALESCE(p_capital, 0);
    v_fee         bigint;
    v_total       bigint;
    v_id          uuid;
    v_tick        int;
    v_listing     text;
    v_city        uuid;
    v_seed_nation uuid;
    v_bld_type    text;
    v_home_nation uuid;
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

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- HOME-NATION GATE: new corps are founded only in the entrepreneur's
    -- home nation (factions.nation, by name). Expansion to other nations is
    -- per-corp via regional HQs, not new foreign foundings.
    SELECT id INTO v_home_nation FROM nations WHERE name = v_fac.nation LIMIT 1;
    IF v_home_nation IS NULL OR p_hq_nation_id <> v_home_nation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_home_nation',
            'home_nation', v_fac.nation);
    END IF;

    v_fee   := (v_capital * 5) / 100;
    v_total := v_capital + v_fee;
    IF COALESCE(v_fac.party_funds, 0) < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_total);
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

    -- Airline starter seed: 2 free regional aircraft (corp_aircraft rows are
    -- the source of truth post-20270204) + 2 same-nation starter terminals
    -- so a first route is openable.
    IF p_industry = 'airline' THEN
        INSERT INTO corp_aircraft (entrepreneur_corp_id, aircraft_class, condition, acquired_at_tick)
        SELECT v_id, 'regional', 100, COALESCE(v_tick, 0)
          FROM generate_series(1, 2);

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

    -- Starter unique building (+ shipping freighters). Free, completed,
    -- owned, in the HQ nation; cost_paid 0, no GDP/ambition bonus.
    -- Aviation Manufacturing rolls 1D6 for its building type (5/23/26 spec).
    IF p_industry IN ('construction','banking','real_estate','shipping','aviation_manufacturing') THEN
        v_bld_type := CASE p_industry
            WHEN 'construction' THEN 'construction_yard'
            WHEN 'banking'      THEN 'banking_office'
            WHEN 'real_estate'  THEN 'real_estate_office'
            WHEN 'shipping'     THEN 'port'
            -- 1D6: 6 → Engine Assembly Plant (1/6), 1-5 → Light Assembly Plant (5/6).
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
            0, 0,
            'completed', COALESCE(v_tick, 0), COALESCE(v_tick, 0), COALESCE(v_tick, 0),
            true, NULL
        );

        IF p_industry = 'shipping' THEN
            UPDATE entrepreneur_corps SET freighters_owned = 2 WHERE id = v_id;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'corp_id', v_id, 'listing', v_listing,
        'capital', v_capital, 'founding_fee', v_fee);
END;
$$;

GRANT EXECUTE ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
