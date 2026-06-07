-- ════════════════════════════════════════════════════════════════════
-- 20270673 — File a Memo: reward shifts from +0.5 Experience to
--            +0.3 Reputation
--
-- User design change. FILE A MEMO previously paid +0.5 to
-- politician_skill (displayed as Experience per 8d3bd59). With the
-- age-year passive Experience accrual landing in 20270672, the
-- safe-grind slot for Experience is now the calendar — File A Memo
-- moves to a different stat axis so it stops competing with the
-- passive timer.
--
-- New behaviour: +0.3 politician_reputation, same 1-tick cooldown
-- shared with File Paperwork via next_civil_service_action_tick.
-- All other gates unchanged (must be a civil servant, must own the
-- faction row, cooldown still respected). Response shape swaps
-- skill_delta / new_skill for reputation_delta / new_reputation;
-- the client-side fmtMemoResult was updated in lockstep.
--
-- CREATE OR REPLACE rather than DROP + CREATE because the signature
-- is unchanged (still (p_faction_id uuid) → jsonb). Reapply-safe.
--
-- Apply after 20270672.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_file_a_memo(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_new_rep       numeric;
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
    IF v_pol.politician_ministry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_civil_service_action_tick IS NOT NULL
       AND v_pol.next_civil_service_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_civil_service_action_tick);
    END IF;

    UPDATE factions
       SET politician_reputation           = COALESCE(politician_reputation, 0) + 0.3,
           next_civil_service_action_tick  = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_reputation INTO v_new_rep;

    RETURN jsonb_build_object(
        'success',           true,
        'action',            'file_a_memo',
        'reputation_delta',  0.3,
        'new_reputation',    v_new_rep,
        'next_action_tick',  v_tick + 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_file_a_memo(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
