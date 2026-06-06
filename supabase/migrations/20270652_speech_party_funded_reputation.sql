-- ════════════════════════════════════════════════════════════════════
-- 20270652 — Give a Speech: $50k party-funded, flat +0.3 Reputation
--
-- Was a 50/50 self-build pump: each call rolled skill-vs-capital and
-- granted +1 of whichever (20270591). Gated by the shared
-- next_member_action_tick (1-per-tick) AND a 3-tick speech-specific
-- next_speech_tick. Free at point of use — the cooldown was the only
-- limiter, and the action grew Skill/Capital deterministically over
-- ~60 ticks (the exploit surface the user is closing across the Party
-- Member redesign).
--
-- New shape: speech is now PARTY-FUNDED, deterministic, and pays out
-- in REPUTATION — the stat that had almost no growth path before
-- (politician_reputation moved on +0.3 from civil-servant paperwork
-- flag 20270630 / 20270631 and almost nowhere else for politicians).
--
--   Cost:   $50,000 from the party's party_funds treasury
--   Effect: +0.3 politician_reputation on the calling politician
--
-- The $50k cost replaces the 3-tick speech cooldown as the rate
-- limiter — a $2M seeded party can fund ~40 speeches before broke,
-- but every speech is treasury spend that competes with civic_meeting
-- payouts, election entry fees, defense allocations, etc. The shared
-- next_member_action_tick lock stays (Speech and Door Knock still
-- compete for the same per-tick action slot per politician).
--
-- Race-safety: the party row is locked FOR UPDATE before the funds
-- check + debit so two politicians can't both read $50k and both
-- successfully debit (classic check-then-act race). Insufficient
-- funds returns the existing 'insufficient_party_funds' reason code
-- — already wired into the client error toast (politician-home.html
-- line 2342).
--
-- politician_reputation column is numeric since 20270631, so the +0.3
-- delta accumulates cleanly instead of rounding to zero on int
-- assignment. No cap applied (matches submit_paperwork_routing
-- 20270630, which is the only other +0.3 rep writer in tree).
--
-- next_speech_tick is no longer stamped. Old stamps on existing rows
-- stay put but the new RPC doesn't read them; the client cooldown UI
-- block that displayed "Speech ready in N ticks" is removed in
-- lockstep so stale stamps don't render ghost cooldowns.
--
-- JSONB shape changes:
--   was: 'reward' ('skill'|'capital'), 'politician_skill',
--        'politician_capital', 'next_speech_tick'
--   now: 'cost', 'party_funds_after', 'reputation_delta',
--        'new_reputation'  (+ unchanged 'next_member_action_tick')
-- Client fmtSpeechResult re-rendered to match.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_give_speech(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    SPEECH_COST CONSTANT numeric := 50000;
    REP_DELTA   CONSTANT numeric := 0.3;
    v_uid        uuid := auth.uid();
    v_pol        factions%ROWTYPE;
    v_party      factions%ROWTYPE;
    v_tick       int;
    v_next       int;
    v_funds_after numeric;
    v_new_rep    numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- Shared 1-per-tick lock — Door Knock and Speech compete for the
    -- same per-politician action slot.
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    -- Lock the party row before checking + debiting funds. Without
    -- FOR UPDATE two simultaneous speeches at $50,001 of party_funds
    -- could both pass the check.
    SELECT * INTO v_party FROM factions
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_party.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    IF COALESCE(v_party.party_funds, 0) < SPEECH_COST THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_party_funds',
            'have', COALESCE(v_party.party_funds, 0), 'need', SPEECH_COST);
    END IF;

    v_next := v_tick + 1;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - SPEECH_COST
     WHERE id = p_party_id
    RETURNING party_funds INTO v_funds_after;

    UPDATE factions
       SET politician_reputation  = COALESCE(politician_reputation, 0) + REP_DELTA,
           next_member_action_tick = v_next
     WHERE id = v_pol.id
    RETURNING politician_reputation INTO v_new_rep;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'speech',
        'cost',                    SPEECH_COST,
        'party_funds_after',       v_funds_after,
        'reputation_delta',        REP_DELTA,
        'new_reputation',          v_new_rep,
        'next_member_action_tick', v_next
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_give_speech(uuid) TO authenticated;

COMMIT;
