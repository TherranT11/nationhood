-- ════════════════════════════════════════════════════════════════════
-- 20270582 — propose_party_motion: take politician faction explicitly
--
-- Reported bug: a politician who's a member of party X gets
-- 'not_member' from propose_party_motion even though party.html
-- correctly shows the "You are a member" tag on party X and renders
-- the proposal panel. Root cause is a SoT split on "which of the
-- caller's politicians is currently acting":
--
--   • Client (js/politician-topbar.js bootstrapPolitician) picks the
--     politician matching sessionStorage.active_faction_id and falls
--     back to the first non-abandoned politician faction.
--   • Server (propose_party_motion, body unchanged since 20270419)
--     picks the OLDEST politician via
--       SELECT * FROM factions
--        WHERE (id = auth.uid() OR linked_user_id = auth.uid())
--          AND faction_type = 'politician'
--          AND abandoned_at IS NULL
--        ORDER BY created_at ASC LIMIT 1
--
-- If the account has more than one politician — e.g. an older
-- independent reroll lying around before the current politician
-- joined a party — the server resolves to the older one, whose
-- politician_party_id is NULL, and the proposal fails with
-- 'not_member' even though the active politician is a member.
--
-- Fix at the source of truth: take p_faction_id as the first
-- argument and validate the caller owns it. The client already
-- has ctx.faction.id from bootstrapPolitician — pass it through.
-- Removes the heuristic entirely. Same pattern draw_court_case,
-- start_appeal, list_active_trials_for_advocate, list_appealable_cases
-- already use.
--
-- The 3-argument signature is dropped and replaced with a 4-argument
-- one. PostgREST callers must pass p_faction_id; there's only one
-- caller (party.html) and it's updated in the same commit.
--
-- (Note: the same SoT split lives in several other politician RPCs
-- that still pick "oldest politician" — politician_give_speech,
-- politician_door_knock, politician_civic_meeting, etc. Each one
-- would need this same surgery to be correct under multi-politician
-- accounts. Flagging as a broader cleanup; not in scope for this fix.)
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.propose_party_motion(text, text, text);

CREATE OR REPLACE FUNCTION public.propose_party_motion(
    p_faction_id   uuid,
    p_motion_type  text,
    p_payload_text text DEFAULT NULL,
    p_payload_url  text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_party_id     uuid;
    v_tick         int;
    v_deputy_roll  int;
    v_yes_pct      int;
    v_outcome      text;
    v_motion_id    uuid;
    v_next         int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF p_motion_type NOT IN ('amend_description','change_slogan','modernize_image') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_motion_type');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    v_party_id := v_pol.politician_party_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_party_motion_tick IS NOT NULL
       AND v_pol.next_party_motion_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'motion_cooldown',
            'ready_at_tick', v_pol.next_party_motion_tick,
            'current_tick',  v_tick);
    END IF;

    IF p_motion_type IN ('amend_description','change_slogan') THEN
        IF p_payload_text IS NULL OR length(trim(p_payload_text)) = 0 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'empty_text');
        END IF;
        IF p_motion_type = 'amend_description' AND length(p_payload_text) > 2000 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'description_too_long');
        END IF;
        IF p_motion_type = 'change_slogan' AND length(p_payload_text) > 140 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'slogan_too_long');
        END IF;
    ELSE
        IF p_payload_url IS NULL OR length(trim(p_payload_url)) = 0 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'empty_url');
        END IF;
    END IF;

    v_deputy_roll := 1 + floor(random() * 2)::int;
    IF v_deputy_roll = 1 THEN
        v_outcome := 'failed_petition';
        v_yes_pct := NULL;
    ELSE
        v_yes_pct := 1 + floor(random() * 100)::int;
        v_outcome := CASE WHEN v_yes_pct > 50 THEN 'passed' ELSE 'failed_vote' END;
    END IF;

    IF v_outcome = 'passed' THEN
        IF p_motion_type = 'amend_description' THEN
            UPDATE factions SET party_description = p_payload_text WHERE id = v_party_id;
        ELSIF p_motion_type = 'change_slogan' THEN
            UPDATE factions SET party_slogan = p_payload_text WHERE id = v_party_id;
        ELSE
            UPDATE factions SET custom_logo_url = p_payload_url WHERE id = v_party_id;
        END IF;
    END IF;

    INSERT INTO party_motions (
        party_id, proposer_id, motion_type, payload_text, payload_url,
        outcome, deputy_roll, vote_yes_pct, created_tick
    ) VALUES (
        v_party_id, v_pol.id, p_motion_type, p_payload_text, p_payload_url,
        v_outcome, v_deputy_roll, v_yes_pct, v_tick
    ) RETURNING id INTO v_motion_id;

    -- Cooldown stamp only AFTER the motion is logged; validation
    -- rejects above this point don't burn it.
    v_next := v_tick + 3;
    UPDATE factions
       SET next_party_motion_tick = v_next
     WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'motion_id',        v_motion_id,
        'motion_type',      p_motion_type,
        'outcome',          v_outcome,
        'deputy_roll',      v_deputy_roll,
        'vote_yes_pct',     v_yes_pct,
        'next_motion_tick', v_next
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.propose_party_motion(uuid, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
