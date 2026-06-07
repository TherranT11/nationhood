-- 20270661 split #01 of 10 — politician_door_knock(p_party_id, p_faction_id)
--
-- Standalone re-emit. DROP old (uuid) signature, CREATE new
-- (uuid, uuid) with p_faction_id ownership lookup. Body otherwise
-- byte-identical to 20270653.

BEGIN;

DROP FUNCTION IF EXISTS public.politician_door_knock(uuid);

CREATE OR REPLACE FUNCTION public.politician_door_knock(
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
    v_inf           numeric;
    v_total         numeric;
    v_pop_delta     numeric;
    v_new_pop       numeric;
    v_next          int;
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

    v_roll  := 1 + floor(random() * 6)::int;
    v_inf   := COALESCE(v_pol.politician_influence, 0);
    v_total := v_roll + v_inf;

    v_pop_delta := CASE
        WHEN v_total <= 1 THEN -0.2
        WHEN v_total <  6 THEN  0.2
        ELSE                    0.3
    END;

    UPDATE factions
       SET popularity_pct = LEAST(COALESCE(popularity_cap_pct, 100),
                                  GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
    RETURNING popularity_pct INTO v_new_pop;

    IF v_new_pop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    v_next := v_tick + 1;
    UPDATE factions
       SET next_member_action_tick = v_next
     WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'door_knock',
        'roll',                    v_roll,
        'influence_used',          v_inf,
        'total',                   v_total,
        'popularity_delta',        v_pop_delta,
        'new_popularity',          v_new_pop,
        'next_member_action_tick', v_next
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_door_knock(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
