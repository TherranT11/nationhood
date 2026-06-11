-- ════════════════════════════════════════════════════════════════════
-- 20270868 — The Foreign Minister (the dedicated post)
--
-- A new cabinet post (design ruling): ONE Foreign Minister per
-- nation, held by a player politician. The post is the counterpart
-- for the Ambassador rank's [Meeting] and [Issue Statement] — and
-- the home-side censure pen.
--
-- Appointment mirrors the junior-minister flow (20270669): the
-- politician SEEKS the post from their nation's FM&T desk; a PLAYER
-- Head of Government gets the application as a Pressing Issues card
-- to appoint or decline; an NPC HoG resolves it on the spot with the
-- same modifier scheme (skill/5 + min(10, rep/5) + alignment, d20,
-- threshold 28). The partial unique index is the structural backstop
-- for one-FM-per-nation; abandoning the faction vacates the post.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_foreign_minister_at_tick int;

COMMENT ON COLUMN public.factions.politician_foreign_minister_at_tick IS
    'Set when this politician holds their nation''s Foreign Minister post (20270868). One per nation — see factions_one_fm_per_nation.';

CREATE UNIQUE INDEX IF NOT EXISTS factions_one_fm_per_nation
    ON public.factions (nation_id)
    WHERE politician_foreign_minister_at_tick IS NOT NULL AND abandoned_at IS NULL;

CREATE TABLE IF NOT EXISTS public.politician_fm_applications (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    target_nation_id     uuid NOT NULL,
    submitted_tick       int  NOT NULL,
    status               text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    decided_by_path      text CHECK (decided_by_path IS NULL OR decided_by_path IN ('player_hog', 'npc_roll')),
    decided_tick         int,
    created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS politician_fm_applications_pending_idx
    ON public.politician_fm_applications (target_nation_id) WHERE status = 'pending';

ALTER TABLE public.politician_fm_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.politician_fm_applications;
CREATE POLICY "Allow select for all" ON public.politician_fm_applications
    FOR SELECT USING (true);

-- ── politician_seek_fm_post ───────────────────────────────────────
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

-- ── politician_decide_fm_application — the player HoG's pen ───────
CREATE OR REPLACE FUNCTION public.politician_decide_fm_application(
    p_faction_id     uuid,
    p_application_id uuid,
    p_accept         boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_decider factions%ROWTYPE;
    v_app     politician_fm_applications%ROWTYPE;
    v_hog     head_of_government%ROWTYPE;
    v_tick    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_application_id IS NULL OR p_accept IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    SELECT * INTO v_decider FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_decider.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_app FROM politician_fm_applications
     WHERE id = p_application_id FOR UPDATE;
    IF v_app.id IS NULL OR v_app.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_pending');
    END IF;

    SELECT * INTO v_hog FROM head_of_government
     WHERE nation_id = v_app.target_nation_id
     ORDER BY created_at DESC LIMIT 1;
    IF v_hog.id IS NULL OR v_hog.candidate_id IS DISTINCT FROM v_decider.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_hog');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF NOT p_accept THEN
        UPDATE politician_fm_applications
           SET status = 'declined', decided_by_path = 'player_hog', decided_tick = v_tick
         WHERE id = v_app.id;
        RETURN jsonb_build_object('success', true, 'accepted', false);
    END IF;

    BEGIN
        UPDATE factions SET politician_foreign_minister_at_tick = v_tick
         WHERE id = v_app.applicant_faction_id AND abandoned_at IS NULL;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'reason', 'applicant_gone');
        END IF;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'post_filled');
    END;

    UPDATE politician_fm_applications
       SET status = 'approved', decided_by_path = 'player_hog', decided_tick = v_tick
     WHERE id = v_app.id;
    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (v_app.applicant_faction_id, v_tick, 'fm_appointed', '',
            jsonb_build_object('path', 'player_hog'));

    RETURN jsonb_build_object('success', true, 'accepted', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_decide_fm_application(uuid, uuid, boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_decide_fm_application(uuid, uuid, boolean) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
