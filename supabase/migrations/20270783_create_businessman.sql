-- ════════════════════════════════════════════════════════════════════
-- 20270783 — create_businessman: Businessman (alpha) character creation
--
-- Phase 2 of the Businessman path (faction-select card + origin
-- picker landed client-side): picking a nation on select-nation.html
-- now opens the gender + generated-name modal and this RPC creates
-- the faction row, landing the player on businessman-home.html.
--
-- Model: a factions row with faction_type = 'businessman', nation-
-- BOUND (nation_id set — unlike entrepreneurs, a businessman belongs
-- to the nation whose corporate ladder they'll climb). party_funds
-- starts at 0 — "start from scratch" is the archetype's promise; the
-- topbar's CASH ON HAND reads this column, same as entrepreneurs.
-- leader_age 25 (young hire, same as the Tier-A politician start).
--
-- Patterns reused from create_politician_with_tier_stats (20270729 /
-- 20270782):
--   • primary-vs-linked insert: first character takes id = auth.uid();
--     additional characters get a fresh uuid + linked_user_id, with
--     the ON CONFLICT upsert reactivating an abandoned primary row.
--   • honest refusals: an active businessman here → 'already_in_nation';
--     a banned one → 'banned_in_nation' (a ban must not be dodgeable
--     by re-rolling).
--   • unique_violation → 'nation_occupied': businessman rows carry
--     nation_id, so idx_factions_one_nonpolitician_per_user_per_nation
--     (20270374) enforces the standing one-non-politician-faction-per-
--     nation rule against a party/military held there.
--
-- Allowed origins mirror BUSINESSMAN_ALLOWED_NATIONS in
-- select-nation.html (the entrepreneur trio + Sierramar). If this
-- list should become admin-toggleable, mirror the
-- nations.foundable_for_corp column pattern instead of widening it
-- here.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
                abandoned_at,
                leader_first_name, leader_last_name, leader_age,
                founded_tick,
                linked_user_id
            ) VALUES (
                v_faction_id, 'businessman',
                v_first || ' ' || v_last,
                p_nation_id, v_nation.name,
                0, 0, 0,
                NULL,
                v_first, v_last, 25,
                v_tick,
                v_uid
            );
        ELSE
            INSERT INTO factions (
                id, faction_type, faction_name,
                nation_id, nation,
                seats, action_points, party_funds,
                abandoned_at,
                leader_first_name, leader_last_name, leader_age,
                founded_tick,
                linked_user_id
            ) VALUES (
                v_faction_id, 'businessman',
                v_first || ' ' || v_last,
                p_nation_id, v_nation.name,
                0, 0, 0,
                NULL,
                v_first, v_last, 25,
                v_tick,
                NULL
            )
            ON CONFLICT (id) DO UPDATE SET
                faction_type      = EXCLUDED.faction_type,
                faction_name      = EXCLUDED.faction_name,
                nation_id         = EXCLUDED.nation_id,
                nation            = EXCLUDED.nation,
                seats             = EXCLUDED.seats,
                action_points     = EXCLUDED.action_points,
                party_funds       = EXCLUDED.party_funds,
                abandoned_at      = NULL,
                leader_first_name = EXCLUDED.leader_first_name,
                leader_last_name  = EXCLUDED.leader_last_name,
                leader_age        = EXCLUDED.leader_age,
                founded_tick      = EXCLUDED.founded_tick,
                linked_user_id    = NULL;
        END IF;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_occupied');
    END;

    RETURN jsonb_build_object(
        'success',    true,
        'faction_id', v_faction_id
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.create_businessman(uuid, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_businessman(uuid, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
