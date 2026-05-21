-- ════════════════════════════════════════════════════════════════════
-- STARTER BUILDINGS — every corp founds with 1 of its unique building
-- ════════════════════════════════════════════════════════════════════
-- Design change: each entrepreneur corp starts with one completed,
-- owned building of its industry — the asset it would otherwise have to
-- build or buy before it could operate:
--   construction → Construction Yard
--   banking      → Banking Office
--   real_estate  → Real Estate Office
--   shipping     → Port  +  2 freighters (freighters_owned)
-- (airline is unchanged — 20270186 already seeds 2 regional aircraft +
--  2 terminals at founding; it has no corp_buildings type.)
--
-- The building is FREE (no treasury debit), tier 'small', cost_paid = 0
-- (locked: any future sale is full profit), status 'completed', owned
-- by the founding corp, in its HQ nation. No GDP-growth / ambition
-- bonus (gdp_growth_applied = true), matching the 20270183 seed — it's
-- founding infrastructure, not a fresh build.
--
-- Two parts:
--   1. found_entrepreneur_corp — extended so NEW foundings seed the
--      building (verbatim 20270186 body + the building branch).
--   2. One-time BACKFILL — existing corps that don't already own their
--      unique building (anywhere) get one now; shipping corps that lack
--      a port also get topped up to ≥2 freighters. Idempotent: skips any
--      corp that already owns its type, so re-running is a no-op.
--
-- building_type 'real_estate_office' is valid since 20270176; cost_paid
-- = 0 satisfies the CHECK (>= 0). Idempotent (CREATE OR REPLACE + the
-- ownership guard in the backfill).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. found_entrepreneur_corp — seed the starter building ────────
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
    v_bld_label   text;
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
    IF p_industry IN ('construction','banking','real_estate','shipping') THEN
        v_bld_type := CASE p_industry
            WHEN 'construction' THEN 'construction_yard'
            WHEN 'banking'      THEN 'banking_office'
            WHEN 'real_estate'  THEN 'real_estate_office'
            WHEN 'shipping'     THEN 'port'
        END;
        v_bld_label := CASE p_industry
            WHEN 'construction' THEN 'Construction Yard'
            WHEN 'banking'      THEN 'Banking Office'
            WHEN 'real_estate'  THEN 'Real Estate Office'
            WHEN 'shipping'     THEN 'Port'
        END;

        INSERT INTO corp_buildings (
            builder_corp_id, owner_corp_id, nation_id,
            name, tier, building_type,
            cost_paid, ambition_granted,
            status, started_at_tick, completes_at_tick, completed_at_tick,
            gdp_growth_applied, list_price
        ) VALUES (
            v_id, v_id, p_hq_nation_id,
            left(btrim(p_name) || ' ' || v_bld_label, 80), 'small', v_bld_type,
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
    'Found an entrepreneur corp. Debits capital + 5%% fee from party_funds, seeds treasury_cash = capital. Public adds 20-share AMM state. Airline gets 2 regional aircraft + 2 terminals; construction/banking/real_estate/shipping each get 1 free completed unique building (cost_paid 0) in their HQ nation, and shipping also gets 2 freighters.';

-- ── 2. One-time backfill for existing corps ──────────────────────
DO $$
DECLARE
    v_tick  int;
    v_corp  RECORD;
    v_btype text;
    v_label text;
    v_n     int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR v_corp IN
        SELECT id, name, industry, hq_nation_id
          FROM entrepreneur_corps
         WHERE industry IN ('construction','banking','real_estate','shipping')
           AND hq_nation_id IS NOT NULL
    LOOP
        v_btype := CASE v_corp.industry
            WHEN 'construction' THEN 'construction_yard'
            WHEN 'banking'      THEN 'banking_office'
            WHEN 'real_estate'  THEN 'real_estate_office'
            WHEN 'shipping'     THEN 'port'
        END;
        v_label := CASE v_corp.industry
            WHEN 'construction' THEN 'Construction Yard'
            WHEN 'banking'      THEN 'Banking Office'
            WHEN 'real_estate'  THEN 'Real Estate Office'
            WHEN 'shipping'     THEN 'Port'
        END;

        -- Skip corps that already own their unique building anywhere
        -- (built/bought one) — makes this idempotent + non-duplicating.
        IF EXISTS (
            SELECT 1 FROM corp_buildings
             WHERE owner_corp_id = v_corp.id AND building_type = v_btype
        ) THEN
            CONTINUE;
        END IF;

        INSERT INTO corp_buildings (
            builder_corp_id, owner_corp_id, nation_id,
            name, tier, building_type,
            cost_paid, ambition_granted,
            status, started_at_tick, completes_at_tick, completed_at_tick,
            gdp_growth_applied, list_price
        ) VALUES (
            v_corp.id, v_corp.id, v_corp.hq_nation_id,
            left(v_corp.name || ' ' || v_label, 80), 'small', v_btype,
            0, 0,
            'completed', v_tick, v_tick, v_tick,
            true, NULL
        );

        -- Shipping starter package also tops freighters up to >= 2.
        IF v_corp.industry = 'shipping' THEN
            UPDATE entrepreneur_corps
               SET freighters_owned = GREATEST(COALESCE(freighters_owned, 0), 2)
             WHERE id = v_corp.id;
        END IF;

        v_n := v_n + 1;
    END LOOP;

    RAISE NOTICE 'Starter-building backfill: granted % building(s) to existing corps.', v_n;
END$$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- found_entrepreneur_corp reverts by re-running 20270186's body.
-- Backfilled buildings (free starters): builder_corp_id = owner_corp_id,
-- cost_paid = 0, gdp_growth_applied = true. To undo:
-- BEGIN;
-- DELETE FROM corp_buildings
--  WHERE cost_paid = 0 AND gdp_growth_applied = true
--    AND owner_corp_id IS NOT NULL AND builder_corp_id = owner_corp_id;
-- COMMIT;
