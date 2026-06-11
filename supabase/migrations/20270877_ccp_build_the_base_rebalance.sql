-- ════════════════════════════════════════════════════════════════════
-- 20270877 — ccp_build_the_base rebalance
--
-- Old 1d6 brackets: 1-2 +1 Volunteer / 3-4 +1 Reputation /
-- 5-6 both. Per user spec the action now always recruits:
--
--   1-2 → +0.5 Reputation AND +1 Volunteer
--   3-6 → +1   Reputation AND +1 Volunteer
--
-- Body otherwise byte-identical to 20270744; the 'bracket' field
-- drops from the response (every roll grants both stats, the
-- deltas tell the story) and the card copy + result formatter in
-- politician-home.html move in lockstep.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.ccp_build_the_base(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_roll          int;
    v_vol_delta     int := 0;
    v_rep_delta     numeric := 0;
    v_new_vol       int;
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
    IF v_pol.politician_office <> 'city_council_president' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ccp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    -- Rebalanced 20270877: every month of organising lands a
    -- Volunteer; the roll only decides how much Reputation came
    -- with it (1-2 -> +0.5, 3-6 -> +1).
    v_roll := 1 + floor(random() * 6)::int;
    v_vol_delta := 1;
    v_rep_delta := CASE WHEN v_roll <= 2 THEN 0.5 ELSE 1 END;

    UPDATE factions
       SET volunteers             = COALESCE(volunteers, 0)             + v_vol_delta,
           politician_reputation  = COALESCE(politician_reputation, 0)  + v_rep_delta,
           next_member_action_tick = v_tick + 1
     WHERE id = v_pol.id
    RETURNING volunteers, politician_reputation INTO v_new_vol, v_new_rep;

    RETURN jsonb_build_object(
        'success',          true,
        'action',           'ccp_build_the_base',
        'roll',             v_roll,
        'volunteer_delta',  v_vol_delta,
        'reputation_delta', v_rep_delta,
        'new_volunteers',   v_new_vol,
        'new_reputation',   v_new_rep,
        'next_action_tick', v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.ccp_build_the_base(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.ccp_build_the_base(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
