-- ════════════════════════════════════════════════════════════════════
-- AVIATION MANUFACTURING — enable the entrepreneur corp type + starter
-- ════════════════════════════════════════════════════════════════════
-- Adds 'aviation_manufacturing' as a foundable entrepreneur industry and
-- gives it a free starter building like every other corp type
-- (20270192). Aviation Manufacturing's unique building is decided by a
-- 1D6 roll at founding (spec 5/23/26):
--     1-5 → Light Assembly Plant  (light_assembly_plant)
--     6   → Engine Assembly Plant (engine_assembly_plant)
-- The two building types already exist in the legacy corp system; they're
-- registered here on corp_buildings so the entrepreneur system can use
-- them. (Costs live in js/game/corp-valuation.js: LIGHT/ENGINE_ASSEMBLY_*.)
--
-- SCOPE: foundational enablement only — foundable type + starter building.
-- No production/design gameplay and no buildable extra plants in this pass
-- (begin_construction's building_type IN-list is intentionally NOT widened),
-- mirroring how airline / real-estate were first enabled.
--
-- No backfill: the type was previously disallowed, so no existing aviation
-- corps need the starter building.
--
-- Idempotent: CHECK drops use IF EXISTS; CREATE OR REPLACE on the RPC.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. industry CHECK gains 'aviation_manufacturing' ─────────────
ALTER TABLE entrepreneur_corps DROP CONSTRAINT IF EXISTS entrepreneur_corps_industry_check;
ALTER TABLE entrepreneur_corps
    ADD CONSTRAINT entrepreneur_corps_industry_check
    CHECK (industry IN ('construction','banking','shipping','real_estate','airline','aviation_manufacturing'));

-- ── 2. building_type CHECK gains the two Assembly Plants ─────────
ALTER TABLE corp_buildings DROP CONSTRAINT IF EXISTS corp_buildings_building_type_check;
ALTER TABLE corp_buildings ADD CONSTRAINT corp_buildings_building_type_check
    CHECK (building_type IN ('regional_hq','construction_yard','port','banking_office',
                             'real_estate_office','light_assembly_plant','engine_assembly_plant'));

-- ── 3. found_entrepreneur_corp — seed the starter building ───────
-- Verbatim from 20270192 plus the aviation_manufacturing dice branch in
-- the starter-building block.
CREATE OR REPLACE FUNCTION found_entrepreneur_corp(
    p_industry text, p_hq_nation_id uuid, p_name text, p_capital bigint, p_listing text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_fac       factions%ROWTYPE;
    v_capital   bigint := COALESCE(p_capital, 0);
    v_fee       bigint;
    v_total     bigint;
    v_id          uuid;
    v_tick        int;
    v_listing     text;
    v_city        uuid;
    v_seed_nation uuid;
    v_bld_type    text;
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

    -- Airline starter seed (unchanged): 2 free regional aircraft + 2
    -- same-nation starter terminals so a first route is openable.
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

COMMENT ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) IS
    'Found an entrepreneur corp. Debits capital + 5%% fee from party_funds, seeds treasury_cash = capital. Public adds 20-share AMM state. Airline gets 2 regional aircraft + 2 terminals; construction/banking/real_estate/shipping each get 1 free completed unique building (cost_paid 0) in their HQ nation (shipping also gets 2 freighters); aviation_manufacturing rolls 1D6 for its starter building (1-5 Light Assembly Plant, 6 Engine Assembly Plant).';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-run the 20270192 RPC body (no aviation branch) and shrink both CHECKs:
-- ALTER TABLE entrepreneur_corps DROP CONSTRAINT IF EXISTS entrepreneur_corps_industry_check;
-- ALTER TABLE entrepreneur_corps ADD CONSTRAINT entrepreneur_corps_industry_check
--   CHECK (industry IN ('construction','banking','shipping','real_estate','airline'));
-- ALTER TABLE corp_buildings DROP CONSTRAINT IF EXISTS corp_buildings_building_type_check;
-- ALTER TABLE corp_buildings ADD CONSTRAINT corp_buildings_building_type_check
--   CHECK (building_type IN ('regional_hq','construction_yard','port','banking_office','real_estate_office'));
