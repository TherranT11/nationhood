-- ════════════════════════════════════════════════════════════════════
-- 20270929 — Enforce the cabinet ban on the Foreign Minister post
--
-- 20270928 stamps politician_cabinet_ban_until_tick on a politician who
-- loses a leadership challenge while holding a cabinet seat. The Foreign
-- Minister post is the only player-sought CABINET (Minister-tier) seat —
-- the other majors are seated by government formation, and Junior/Deputy
-- are sub-cabinet rungs — so gating politician_seek_fm_post is the
-- enforcement of "barred from cabinet". Re-emitted from 20270919, the
-- only change being the ban reject after the tick is read.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_seek_fm_post(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_tick   int;
    v_hog    head_of_government%ROWTYPE;
    v_is_player_hog boolean;
    v_admin  administrations%ROWTYPE;
    v_app_id uuid;
    v_mods   int;
    v_roll   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF lower(COALESCE(v_pol.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;
    IF v_pol.politician_foreign_minister_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_fm');
    END IF;
    IF EXISTS (SELECT 1 FROM factions
                WHERE nation_id = v_pol.nation_id
                  AND politician_foreign_minister_at_tick IS NOT NULL
                  AND abandoned_at IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'post_filled');
    END IF;
    IF EXISTS (SELECT 1 FROM politician_fm_applications
                WHERE applicant_faction_id = v_pol.id AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'application_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Cabinet ban (20270928): barred from cabinet after a failed leadership
    -- coup until politician_cabinet_ban_until_tick.
    IF v_pol.politician_cabinet_ban_until_tick IS NOT NULL
       AND v_pol.politician_cabinet_ban_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cabinet_banned',
            'until_tick', v_pol.politician_cabinet_ban_until_tick);
    END IF;

    SELECT * INTO v_hog FROM head_of_government
     WHERE nation_id = v_pol.nation_id
     ORDER BY created_at DESC LIMIT 1;
    v_is_player_hog := v_hog.id IS NOT NULL AND v_hog.candidate_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM factions
         WHERE id = v_hog.candidate_id
           AND linked_user_id IS NOT NULL
           AND abandoned_at IS NULL);

    IF v_is_player_hog THEN
        INSERT INTO politician_fm_applications
            (applicant_faction_id, target_nation_id, submitted_tick)
        VALUES (v_pol.id, v_pol.nation_id, v_tick)
        RETURNING id INTO v_app_id;
        RETURN jsonb_build_object('success', true, 'path', 'player_hog',
            'status', 'pending_review', 'application_id', v_app_id);
    END IF;

    -- NPC HoG: the junior-minister modifier scheme (20270669) —
    -- skill/5 + rep/5 (capped +10) + alignment, d20, threshold 28.
    v_mods := FLOOR(COALESCE(v_pol.politician_skill, 0) / 5)
            + LEAST(10, FLOOR(COALESCE(v_pol.politician_reputation, 0) / 5));
    SELECT * INTO v_admin FROM administrations
     WHERE nation_id = v_pol.nation_id AND ended_at_tick IS NULL
     ORDER BY started_at_tick DESC LIMIT 1;
    IF v_pol.politician_party_id IS NULL THEN
        v_mods := v_mods - 5;
    ELSIF v_admin.id IS NOT NULL AND v_admin.pm_party_id = v_pol.politician_party_id THEN
        v_mods := v_mods + 5;
    END IF;
    v_roll := 1 + FLOOR(random() * 20)::int + v_mods;

    IF v_roll >= 28 THEN
        BEGIN
            UPDATE factions SET politician_foreign_minister_at_tick = v_tick
             WHERE id = v_pol.id;
        EXCEPTION WHEN unique_violation THEN
            RETURN jsonb_build_object('success', false, 'reason', 'post_filled');
        END;
        -- One office at a time (20270919): vacate the civil-service track.
        PERFORM _politician_vacate_career_track(v_pol.id);
        INSERT INTO politician_fm_applications
            (applicant_faction_id, target_nation_id, submitted_tick,
             status, decided_by_path, decided_tick)
        VALUES (v_pol.id, v_pol.nation_id, v_tick, 'approved', 'npc_roll', v_tick);
        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
        VALUES (v_pol.id, v_tick, 'fm_appointed', '', jsonb_build_object('path', 'npc_roll'));
        RETURN jsonb_build_object('success', true, 'path', 'npc_roll',
            'status', 'approved', 'roll', v_roll);
    END IF;

    INSERT INTO politician_fm_applications
        (applicant_faction_id, target_nation_id, submitted_tick,
         status, decided_by_path, decided_tick)
    VALUES (v_pol.id, v_pol.nation_id, v_tick, 'declined', 'npc_roll', v_tick);
    RETURN jsonb_build_object('success', true, 'path', 'npc_roll',
        'status', 'declined', 'roll', v_roll);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_seek_fm_post(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_seek_fm_post(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
