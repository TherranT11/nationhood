-- ════════════════════════════════════════════════════════════════════
-- 20270917 — National Focus: per-posture approval cost
--
-- Each posture now carries its own ruling-party approval cost (off
-- popularity_pct): Domestic 0, Diplomatic −1, Military −3 (up from the
-- flat −2 Military in 20270916). set_national_focus re-emitted to revert
-- the OLD posture's cost and apply the NEW one on every change, so the
-- active posture's penalty is exactly what stands.
--
-- (The +1-action-per-turn perks the postures grant — Foreign Affairs on
-- Diplomatic, Defense on Military — are display-side until ministry
-- actions carry a real per-turn allowance.)
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    v_delta    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_focus NOT IN ('domestic', 'diplomatic', 'military') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_focus');
    END IF;

    SELECT * INTO v_adm FROM administrations
     WHERE nation_id = p_nation_id AND ended_at_tick IS NULL
     ORDER BY started_at_tick DESC NULLS LAST
     LIMIT 1
     FOR UPDATE;
    IF v_adm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_administration');
    END IF;

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

    -- Per-posture approval cost on the ruling party (politician_party_id):
    -- Domestic 0, Diplomatic 1, Military 3. Revert the old, apply the new
    -- so the active posture's penalty is exactly what stands.
    SELECT politician_party_id INTO v_party_id FROM factions WHERE id = v_hog_fac;
    v_delta := (CASE v_old   WHEN 'diplomatic' THEN 1 WHEN 'military' THEN 3 ELSE 0 END)
             - (CASE p_focus WHEN 'diplomatic' THEN 1 WHEN 'military' THEN 3 ELSE 0 END);
    IF v_party_id IS NOT NULL AND v_delta <> 0 THEN
        UPDATE factions
           SET popularity_pct = GREATEST(0, LEAST(100, COALESCE(popularity_pct, 0) + v_delta))
         WHERE id = v_party_id;
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
