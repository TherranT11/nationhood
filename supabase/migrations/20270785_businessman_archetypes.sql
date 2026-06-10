-- ════════════════════════════════════════════════════════════════════
-- 20270785 — Businessman archetypes: wealth + age at creation
--
-- Per design: after gender + name, the Businessman picks who they are
-- ("And remind me of who you are:") before [Confirm]:
--
--   wealthy_entrepreneur  Wealth $65,000,000 · Age 60
--   seasoned_executive    Wealth  $2,000,000 · Age 50
--   youthful_salaryman    Wealth    $150,000 · Age 25
--
-- Values are applied HERE, server-side (same anti-tamper posture as
-- politician tier stats, 20270693) — the client card copy in
-- select-nation.html mirrors these numbers for display only. The
-- chosen key is stored in factions.entrepreneur_archetype (the
-- existing setup-archetype column; the businessman topbar already
-- selects it), so future career mechanics can branch on origin.
--
-- The previous create_businessman(uuid, text, text) (20270783) is
-- DROPPED, not replaced — adding a parameter creates an overload and
-- PostgREST refuses ambiguous RPC names. Body otherwise byte-faithful
-- to 20270783: same guards, honest refusals, primary-vs-linked
-- insert, nation_occupied mapping.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.create_businessman(uuid, text, text);

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

    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;
    IF v_nation.name NOT IN ('Melizea', 'Avelia', 'Montequilla', 'Sierramar') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_foundable');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

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

NOTIFY pgrst, 'reload schema';

COMMIT;
