-- ════════════════════════════════════════════════════════════════════
-- Party-business motion cooldown — 3-tick rate limit
--
-- Each successful invocation of propose_party_motion (any of the
-- three rank-and-file motions: amend_description, change_slogan,
-- modernize_image) now stamps factions.next_party_motion_tick =
-- current_tick + 3 on the proposer's row. Subsequent attempts inside
-- that window reject with reason='motion_cooldown' until the tick
-- catches up.
--
-- Scope: PER POLITICIAN, SHARED across all three motion types. One
-- motion locks out all three for 3 ticks; other actions (door-knock,
-- give-speech, stand-for-election) are unaffected.
--
-- When the timer starts:
--   • After the motion is logged to party_motions, regardless of
--     outcome (passed / failed_petition / failed_vote). A petition
--     refusal still counts as "you used your motion" — otherwise a
--     player could spam-retry until the deputy cosigns.
--   • Validation rejects (empty_text, slogan_too_long, etc) do NOT
--     start the timer. The player made a typo, not an attempt.
--
-- REVOKE UPDATE on the column so the RPC is the only writer (same
-- posture as politician_office in 20270418). Without the revoke the
-- 20260302 "Factions update own" policy would let a client direct-
-- UPDATE the column to clear their cooldown.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, REVOKE re-runs cleanly,
-- propose_party_motion is CREATE OR REPLACE.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ───────────────────────────────────────────────────────
ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS next_party_motion_tick int;

COMMENT ON COLUMN factions.next_party_motion_tick IS
    'Earliest tick at which this politician may propose another party-business motion. Set to current_tick + 3 by propose_party_motion on any logged outcome (passed/failed_petition/failed_vote). NULL = no cooldown active. Same per-politician, shared-across-all-three-motions scope as the Party Business cards on party.html. REVOKE on the column means SECURITY DEFINER RPC is the only writer.';

-- Same security posture as politician_office (20270418): clients must
-- not be able to direct-clear their own cooldown via the
-- "Factions update own" policy (20260302).
REVOKE UPDATE (next_party_motion_tick) ON factions FROM PUBLIC, anon, authenticated;

-- ── 2. propose_party_motion ─────────────────────────────────────────
-- Body = 20270403 + cooldown check (early) + cooldown stamp (after
-- motion log). The rest of the function — payload validation, deputy
-- roll, vote roll, apply-on-pass, party_motions INSERT, return payload
-- — is byte-for-byte the same.
CREATE OR REPLACE FUNCTION public.propose_party_motion(
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
    IF p_motion_type NOT IN ('amend_description','change_slogan','modernize_image') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_motion_type');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    v_party_id := v_pol.politician_party_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Cooldown check (20270419) — gate before any state write. Stale
    -- tabs hit this and surface the same reason the client-side
    -- disabled-card hint already shows.
    IF v_pol.next_party_motion_tick IS NOT NULL
       AND v_pol.next_party_motion_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'motion_cooldown',
            'ready_at_tick', v_pol.next_party_motion_tick,
            'current_tick',  v_tick);
    END IF;

    -- Payload shape per motion type.
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

    -- Petition phase: deputy leader 1D2 cosign.
    v_deputy_roll := 1 + floor(random() * 2)::int;
    IF v_deputy_roll = 1 THEN
        v_outcome := 'failed_petition';
        v_yes_pct := NULL;
    ELSE
        -- Vote phase: 1D100 → yes-percentage.
        v_yes_pct := 1 + floor(random() * 100)::int;
        v_outcome := CASE WHEN v_yes_pct > 50 THEN 'passed' ELSE 'failed_vote' END;
    END IF;

    -- Apply on pass.
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

    -- Cooldown stamp (20270419) — only AFTER the motion is logged.
    -- Validation rejects above this point don't reach here, so a typo
    -- doesn't burn the cooldown.
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

GRANT EXECUTE ON FUNCTION public.propose_party_motion(text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
