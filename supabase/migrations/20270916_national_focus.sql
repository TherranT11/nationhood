-- ════════════════════════════════════════════════════════════════════
-- 20270916 — National Focus: the administration's posture
--
-- The Head Office page lets the Head of Government set the nation's
-- posture — Domestic / Diplomatic / Military. Stored on the active
-- administration (not nations, which would drag the nations_history
-- lockstep along) and defaulting to Domestic. Changing it carries a
-- 12-tick cooldown, and a Military posture costs the ruling party 2
-- approval (popularity_pct, the approval rating per 20270421) — leaving
-- Military returns the 2. Only the HoG may change it.
--
-- The −2 is a discrete toggle on the HoG's party, the same clamped
-- popularity_pct adjustment every other political action uses; it is
-- applied on the switch INTO Military and reverted on the switch OUT.
-- (A government change while Military is active leaves the old party's
-- −2 baked in — an accepted edge for now.)
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.administrations
    ADD COLUMN IF NOT EXISTS national_focus text NOT NULL DEFAULT 'domestic'
        CHECK (national_focus IN ('domestic', 'diplomatic', 'military')),
    ADD COLUMN IF NOT EXISTS national_focus_changed_at_tick int NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.set_national_focus(
    p_nation_id uuid,
    p_focus     text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_adm      administrations%ROWTYPE;
    v_hog_fac  uuid;
    v_party_id uuid;
    v_tick     int;
    v_old      text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_focus NOT IN ('domestic', 'diplomatic', 'military') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_focus');
    END IF;

    -- The active administration carries the focus; lock it for the
    -- compare-and-set below.
    SELECT * INTO v_adm FROM administrations
     WHERE nation_id = p_nation_id AND ended_at_tick IS NULL
     ORDER BY started_at_tick DESC NULLS LAST
     LIMIT 1
     FOR UPDATE;
    IF v_adm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_administration');
    END IF;

    -- Only the Head of Government may change focus.
    SELECT faction_id INTO v_hog_fac FROM head_of_government
     WHERE nation_id = p_nation_id AND active = true
     LIMIT 1;
    IF v_hog_fac IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_head_of_government');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM factions
                    WHERE id = v_hog_fac AND (id = v_uid OR linked_user_id = v_uid)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_head_of_government');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_old := COALESCE(v_adm.national_focus, 'domestic');
    IF v_old = p_focus THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_focused');
    END IF;
    IF v_tick < COALESCE(v_adm.national_focus_changed_at_tick, 0) + 12 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
            'ready_at_tick', COALESCE(v_adm.national_focus_changed_at_tick, 0) + 12);
    END IF;

    -- Military costs the ruling party 2 approval; leaving it returns the
    -- 2. The HoG's party is factions.politician_party_id on the holder.
    SELECT politician_party_id INTO v_party_id FROM factions WHERE id = v_hog_fac;
    IF v_party_id IS NOT NULL THEN
        IF p_focus = 'military' THEN
            UPDATE factions SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 2)
             WHERE id = v_party_id;
        ELSIF v_old = 'military' THEN
            UPDATE factions SET popularity_pct = LEAST(100, COALESCE(popularity_pct, 0) + 2)
             WHERE id = v_party_id;
        END IF;
    END IF;

    UPDATE administrations
       SET national_focus = p_focus,
           national_focus_changed_at_tick = v_tick
     WHERE id = v_adm.id;

    RETURN jsonb_build_object('success', true, 'focus', p_focus, 'changed_at_tick', v_tick);
END $$;

REVOKE EXECUTE ON FUNCTION public.set_national_focus(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.set_national_focus(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
