-- ════════════════════════════════════════════════════════════════════
-- 20270789 — Businessman home city: uniformly random at creation
--
-- Current Location / Residence defaulted to the nation's capital.
-- Per design, a new businessman now rolls a home city UNIFORMLY at
-- random from the nation's city list (capital + major cities — up to
-- five per nation since 20270716), persisted as
-- factions.biz_home_city. The capital remains the fallback for a
-- nation with no cities rows.
--
-- Coherence bonus: the Youthful Salaryman's "Graduated from {City}
-- University" history entry now uses the rolled home city instead of
-- the capital — you studied where you live.
--
-- create_businessman re-emitted byte-faithful to 20270787 except the
-- home-city roll (passed into the history roll) and the new insert
-- column. Existing businessmen are backfilled with the same uniform
-- roll (their already-displayed capital may change — acceptable, the
-- location was placeholder copy until now).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS biz_home_city text;

CREATE OR REPLACE FUNCTION public.create_businessman(
    p_nation_id  uuid,
    p_first_name text,
    p_last_name  text,
    p_archetype  text
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
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    v_first := btrim(COALESCE(p_first_name, ''));
    v_last  := btrim(COALESCE(p_last_name,  ''));
    IF length(v_first) < 1 OR length(v_last) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;

    IF p_archetype = 'wealthy_entrepreneur' THEN
        v_funds := 65000000; v_age := 60;
    ELSIF p_archetype = 'seasoned_executive' THEN
        v_funds := 2000000;  v_age := 50;
    ELSIF p_archetype = 'youthful_salaryman' THEN
        v_funds := 150000;   v_age := 25;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_archetype');
    END IF;
    v_res := _roll_businessman_residence(p_archetype);

    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;
    IF v_nation.name NOT IN ('Melizea', 'Avelia', 'Montequilla', 'Sierramar') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_foundable');
    END IF;

    -- Uniformly random home city; capital fallback for nations with
    -- no cities rows.
    SELECT city_name INTO v_home_city FROM cities
     WHERE nation_id = p_nation_id
     ORDER BY random() LIMIT 1;
    v_home_city := COALESCE(v_home_city, v_nation.capital);

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_hist := _roll_businessman_history(p_archetype, p_nation_id, v_home_city, v_tick);

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
                p_archetype,
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
                p_archetype,
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
        'faction_id', v_faction_id
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.create_businessman(uuid, text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_businessman(uuid, text, text, text) TO authenticated;

-- ── Backfill: uniform roll per existing businessman ───────────────
-- Correlated subqueries re-execute per row, so each businessman gets
-- an independent roll; capital fallback for city-less nations.
UPDATE public.factions f
   SET biz_home_city = COALESCE(
        (SELECT c.city_name FROM cities c
          WHERE c.nation_id = f.nation_id
          ORDER BY random() LIMIT 1),
        (SELECT n.capital FROM nations n WHERE n.id = f.nation_id))
 WHERE f.faction_type = 'businessman'
   AND f.biz_home_city IS NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
