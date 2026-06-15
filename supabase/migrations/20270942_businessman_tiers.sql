-- ════════════════════════════════════════════════════════════════════
-- 20270942 — Businessman tiers: auto-assigned by nation, not picked
--
-- Replaces the "remind me of who you are" archetype pick with a relative
-- tier (mirrors the politician tier, 20270782). The four businessman
-- nations are ranked by active-businessman count; the chosen nation's
-- rank sets the tier, which maps onto the existing archetype wealth/age:
--
--   Tier A = Salaryman    youthful_salaryman   $150,000 · age 25
--   Tier B = Executive    seasoned_executive   $2,000,000 · age 50
--   Tier C = Entrepreneur wealthy_entrepreneur $65,000,000 · age 60
--
-- Most businessmen → A (Salaryman); fewest → C (Entrepreneur). Same
-- catch-up shape as politicians: a crowded scene starts you small, an
-- empty one hands you a war chest. The derived archetype key still drives
-- the residence + career-history rolls, so nothing downstream changes.
--
-- Signature drops p_archetype: create_businessman(uuid, text, text). The
-- four-arg version (20270789) is DROPPED — a removed param can't overload.
-- Body otherwise faithful to 20270789 (residence, history, home city).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.create_businessman(uuid, text, text, text);

CREATE OR REPLACE FUNCTION public.create_businessman(
    p_nation_id  uuid,
    p_first_name text,
    p_last_name  text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_nation          nations%ROWTYPE;
    v_tick            int;
    v_existing        uuid;
    v_existing_banned boolean;
    v_primary         uuid;
    v_is_linked       boolean;
    v_faction_id      uuid;
    v_first           text;
    v_last            text;
    v_funds           numeric;
    v_age             int;
    v_res             jsonb;
    v_hist            jsonb;
    v_home_city       text;
    v_pos             int;
    v_n               int;
    v_a_size          int;
    v_c_size          int;
    v_tier            text;
    v_archetype       text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    v_first := btrim(COALESCE(p_first_name, ''));
    v_last  := btrim(COALESCE(p_last_name,  ''));
    IF length(v_first) < 1 OR length(v_last) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;
    IF v_nation.name NOT IN ('Melizea', 'Avelia', 'Montequilla', 'Sierramar') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_foundable');
    END IF;

    -- Tier algorithm (mirrors politicians, 20270782): rank the four
    -- businessman nations by active-businessman count DESC; top third → A,
    -- bottom third → C, middle → B. random() tiebreak so a flat field
    -- doesn't always slot the same nation. Fewest businessmen → C.
    -- Mirrored client-side in select-nation.html.
    WITH counts AS (
        SELECT n.id AS nation_id,
               COUNT(f.id) FILTER (
                   WHERE f.faction_type = 'businessman'
                     AND f.abandoned_at IS NULL
               ) AS biz_count
          FROM nations n
          LEFT JOIN factions f ON f.nation_id = n.id
         WHERE n.name IN ('Melizea', 'Avelia', 'Montequilla', 'Sierramar')
         GROUP BY n.id
    ),
    ranked AS (
        SELECT nation_id,
               ROW_NUMBER() OVER (ORDER BY biz_count DESC, random()) - 1 AS pos,
               COUNT(*)    OVER ()                                      AS total
          FROM counts
    )
    SELECT pos, total INTO v_pos, v_n
      FROM ranked WHERE nation_id = p_nation_id;

    IF v_n IS NULL OR v_n <= 1 THEN
        v_tier := 'A';
    ELSIF v_n = 2 THEN
        v_tier := CASE WHEN v_pos = 0 THEN 'A' ELSE 'C' END;
    ELSE
        v_a_size := GREATEST(1, FLOOR(v_n::numeric / 3.0)::int);
        v_c_size := GREATEST(1, FLOOR(v_n::numeric / 3.0)::int);
        IF v_pos < v_a_size THEN
            v_tier := 'A';
        ELSIF v_pos >= (v_n - v_c_size) THEN
            v_tier := 'C';
        ELSE
            v_tier := 'B';
        END IF;
    END IF;

    -- Tier → archetype + wealth/age (the 20270785 values, unchanged).
    IF v_tier = 'C' THEN
        v_archetype := 'wealthy_entrepreneur'; v_funds := 65000000; v_age := 60;
    ELSIF v_tier = 'B' THEN
        v_archetype := 'seasoned_executive';   v_funds := 2000000;  v_age := 50;
    ELSE
        v_archetype := 'youthful_salaryman';   v_funds := 150000;   v_age := 25;
    END IF;
    v_res := _roll_businessman_residence(v_archetype);

    -- Uniformly random home city; capital fallback for nations with
    -- no cities rows.
    SELECT city_name INTO v_home_city FROM cities
     WHERE nation_id = p_nation_id
     ORDER BY random() LIMIT 1;
    v_home_city := COALESCE(v_home_city, v_nation.capital);

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_hist := _roll_businessman_history(v_archetype, p_nation_id, v_home_city, v_tick);

    SELECT id, COALESCE(is_banned, false) INTO v_existing, v_existing_banned
      FROM factions
     WHERE faction_type = 'businessman'
       AND nation_id    = p_nation_id
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false,
            'reason', CASE WHEN v_existing_banned THEN 'banned_in_nation'
                           ELSE 'already_in_nation' END);
    END IF;

    SELECT id INTO v_primary FROM factions
     WHERE id = v_uid AND abandoned_at IS NULL
     LIMIT 1;
    v_is_linked  := v_primary IS NOT NULL;
    v_faction_id := CASE WHEN v_is_linked THEN gen_random_uuid() ELSE v_uid END;

    BEGIN
        IF v_is_linked THEN
            INSERT INTO factions (
                id, faction_type, faction_name,
                nation_id, nation,
                seats, action_points, party_funds,
                entrepreneur_archetype,
                biz_residence_name, biz_residence_worth, biz_career_history, biz_home_city,
                abandoned_at,
                leader_first_name, leader_last_name, leader_age,
                founded_tick,
                linked_user_id
            ) VALUES (
                v_faction_id, 'businessman',
                v_first || ' ' || v_last,
                p_nation_id, v_nation.name,
                0, 0, v_funds,
                v_archetype,
                v_res->>'name', (v_res->>'worth')::bigint, v_hist, v_home_city,
                NULL,
                v_first, v_last, v_age,
                v_tick,
                v_uid
            );
        ELSE
            INSERT INTO factions (
                id, faction_type, faction_name,
                nation_id, nation,
                seats, action_points, party_funds,
                entrepreneur_archetype,
                biz_residence_name, biz_residence_worth, biz_career_history, biz_home_city,
                abandoned_at,
                leader_first_name, leader_last_name, leader_age,
                founded_tick,
                linked_user_id
            ) VALUES (
                v_faction_id, 'businessman',
                v_first || ' ' || v_last,
                p_nation_id, v_nation.name,
                0, 0, v_funds,
                v_archetype,
                v_res->>'name', (v_res->>'worth')::bigint, v_hist, v_home_city,
                NULL,
                v_first, v_last, v_age,
                v_tick,
                NULL
            )
            ON CONFLICT (id) DO UPDATE SET
                faction_type           = EXCLUDED.faction_type,
                faction_name           = EXCLUDED.faction_name,
                nation_id              = EXCLUDED.nation_id,
                nation                 = EXCLUDED.nation,
                seats                  = EXCLUDED.seats,
                action_points          = EXCLUDED.action_points,
                party_funds            = EXCLUDED.party_funds,
                entrepreneur_archetype = EXCLUDED.entrepreneur_archetype,
                biz_residence_name     = EXCLUDED.biz_residence_name,
                biz_residence_worth    = EXCLUDED.biz_residence_worth,
                biz_career_history     = EXCLUDED.biz_career_history,
                biz_home_city          = EXCLUDED.biz_home_city,
                abandoned_at           = NULL,
                leader_first_name      = EXCLUDED.leader_first_name,
                leader_last_name       = EXCLUDED.leader_last_name,
                leader_age             = EXCLUDED.leader_age,
                founded_tick           = EXCLUDED.founded_tick,
                linked_user_id         = NULL;
        END IF;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_occupied');
    END;

    RETURN jsonb_build_object(
        'success',    true,
        'faction_id', v_faction_id,
        'tier',       v_tier
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.create_businessman(uuid, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_businessman(uuid, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
