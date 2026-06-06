-- 20270661 split #07 of 10 — politician_build_the_base(p_party_id, p_faction_id)
--
-- Standalone re-emit. DROP old (uuid) signature, CREATE new
-- (uuid, uuid) with p_faction_id ownership lookup. Body otherwise
-- byte-identical to 20270646.

BEGIN;

DROP FUNCTION IF EXISTS public.politician_build_the_base(uuid);

CREATE OR REPLACE FUNCTION public.politician_build_the_base(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_roll          int;
    v_cap_delta     int := 0;
    v_new_capital   numeric;
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
    IF v_pol.politician_office IS DISTINCT FROM 'city_council_member' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_city_council');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    v_roll := 1 + floor(random() * 6)::int;
    IF v_roll = 6 THEN
        v_cap_delta := 2;
    ELSIF v_roll >= 2 THEN
        v_cap_delta := 1;
    END IF;

    UPDATE factions
       SET politician_capital       = COALESCE(politician_capital, 0) + v_cap_delta,
           next_local_action_tick   = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_capital INTO v_new_capital;

    RETURN jsonb_build_object(
        'success',         true,
        'action',          'build_the_base',
        'roll',            v_roll,
        'capital_delta',   v_cap_delta,
        'new_capital',     v_new_capital,
        'next_action_tick', v_tick + 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_build_the_base(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
