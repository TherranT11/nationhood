-- ════════════════════════════════════════════════════════════════════
-- SEED — unowned starter buildings, 3 per nation
-- ════════════════════════════════════════════════════════════════════
-- Drops 3 distinct random buildings into every nation: pick from
-- (Regional HQ, Port, Construction Yard, Banking Office), random cost
-- between $20M and $65M each, no owner, no builder, not listed.
-- The 5th building_type (real_estate_office) is intentionally
-- excluded — these seeds are meant to be "the nation's existing
-- infrastructure" that Real Estate corps could list and other corps
-- could buy, not pre-existing Real Estate offices.
--
-- ── Field choices ────────────────────────────────────────────────
--   builder_corp_id    NULL   (no founding corp — these pre-date the
--                              entrepreneur era; FK SET NULL since
--                              20270167)
--   owner_corp_id      NULL   (the "abandoned / unowned" state per
--                              20270167 comment; UI treats NULL owner
--                              as not held by anyone)
--   status             completed   (drop-in usable, not under
--                                   construction)
--   gdp_growth_applied true   (no +0.2 GDP_Growth firing on seed —
--                              these existed before the player started
--                              and shouldn't grant a one-time bump)
--   list_price         NULL   (not on the marketplace; a Real Estate
--                              corp has to list them first via the
--                              existing list_building_for_sale RPC)
--   tier               small for cost<$40M, else medium (matches the
--                              tier table band: small=$20M base,
--                              medium=$50M base)
--   started_at_tick    current tick (informational; status='completed'
--   completes_at_tick  current tick  so the "X ticks remaining" code
--   completed_at_tick  current tick  path never fires)
--
-- ── Names ────────────────────────────────────────────────────────
-- "<Nation> <Variant>" using a small variant pool per type so they
-- read like real properties (4 variants × 4 types = 16 phrasings).
-- Duplicates across nations are fine — corp_buildings.name has no
-- unique constraint.
--
-- ── Idempotency ──────────────────────────────────────────────────
-- Skip any nation that already has unowned + unbuilt buildings (i.e.
-- the signature of a prior run: builder_corp_id IS NULL AND
-- owner_corp_id IS NULL). Re-running the migration won't double-seed.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_nation     RECORD;
    v_types      text[] := ARRAY['regional_hq','port','construction_yard','banking_office'];
    v_chosen     text[];
    v_type       text;
    v_cost       bigint;
    v_tier       text;
    v_name       text;
    v_variant    text;
    v_pool       text[];
    v_tick       int;
    v_count      int := 0;
    v_skipped    int := 0;
    v_rhq_names  constant text[] := ARRAY['Regional Plaza','Civic Tower','Capital Center','Grand Pavilion'];
    v_port_names constant text[] := ARRAY['Trade Wharf','Harborside Docks','Mariner''s Quay','Commercial Pier'];
    v_yard_names constant text[] := ARRAY['Industrial Yard','Builder''s Compound','Construction Works','Heavy Yard'];
    v_bank_names constant text[] := ARRAY['Banking House','National Exchange','Treasury Hall','Founders'' Bank'];
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR v_nation IN
        SELECT id, name FROM nations
         WHERE continent IS NOT NULL
         ORDER BY name
    LOOP
        -- Idempotency: skip nations already seeded.
        IF EXISTS (
            SELECT 1 FROM corp_buildings
             WHERE nation_id        = v_nation.id
               AND builder_corp_id IS NULL
               AND owner_corp_id   IS NULL
        ) THEN
            v_skipped := v_skipped + 1;
            CONTINUE;
        END IF;

        -- Random 3 distinct types out of the 4. ORDER BY random()
        -- shuffles; slice [1:3] takes the first three.
        SELECT (array_agg(t ORDER BY random()))[1:3] INTO v_chosen
          FROM unnest(v_types) t;

        FOREACH v_type IN ARRAY v_chosen LOOP
            v_cost := 20000000 + floor(random() * 45000001)::bigint;   -- [20M, 65M]
            v_tier := CASE WHEN v_cost < 40000000 THEN 'small' ELSE 'medium' END;

            v_pool := CASE v_type
                WHEN 'regional_hq'        THEN v_rhq_names
                WHEN 'port'               THEN v_port_names
                WHEN 'construction_yard'  THEN v_yard_names
                WHEN 'banking_office'     THEN v_bank_names
            END;
            v_variant := v_pool[1 + floor(random() * array_length(v_pool, 1))::int];
            v_name    := v_nation.name || ' ' || v_variant;

            INSERT INTO corp_buildings (
                builder_corp_id, owner_corp_id, nation_id,
                name, tier, building_type,
                cost_paid, ambition_granted,
                status, started_at_tick, completes_at_tick, completed_at_tick,
                gdp_growth_applied, list_price
            ) VALUES (
                NULL, NULL, v_nation.id,
                v_name, v_tier, v_type,
                v_cost, 0,
                'completed', v_tick, v_tick, v_tick,
                true, NULL
            );
            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Seeded % unowned buildings across nations (% nations skipped — already had seeds).', v_count, v_skipped;
END$$;

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DELETE FROM corp_buildings
--  WHERE builder_corp_id IS NULL
--    AND owner_corp_id   IS NULL
--    AND status = 'completed'
--    AND gdp_growth_applied = true;
-- COMMIT;
