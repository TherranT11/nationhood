-- 20270661 split #02 of 10 — politician_give_speech(p_party_id, p_faction_id)
--
-- Standalone re-emit. DROP old (uuid) signature, CREATE new
-- (uuid, uuid) with p_faction_id ownership lookup. Body otherwise
-- byte-identical to 20270652.

BEGIN;

DROP FUNCTION IF EXISTS public.politician_give_speech(uuid);

CREATE OR REPLACE FUNCTION public.politician_give_speech(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
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
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

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

GRANT EXECUTE ON FUNCTION public.politician_give_speech(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
