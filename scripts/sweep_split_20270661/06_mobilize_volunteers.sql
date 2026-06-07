-- 20270661 split #06 of 10 — politician_mobilize_volunteers(p_party_id, p_faction_id)
--
-- Standalone re-emit. DROP old (uuid) signature, CREATE new
-- (uuid, uuid) with p_faction_id ownership lookup. Body otherwise
-- byte-identical to 20270646.

BEGIN;

DROP FUNCTION IF EXISTS public.politician_mobilize_volunteers(uuid);

CREATE OR REPLACE FUNCTION public.politician_mobilize_volunteers(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_volunteers    int;
    v_pop_delta     numeric;
    v_new_capital   numeric;
    v_new_pop       numeric;
    v_party_name    text;
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

    v_volunteers := COALESCE(v_pol.volunteers, 0);
    IF v_volunteers < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_volunteers');
    END IF;
    IF COALESCE(v_pol.politician_capital, 0) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capital',
            'have', COALESCE(v_pol.politician_capital, 0), 'need', 1);
    END IF;

    v_pop_delta := 0.05 * v_volunteers;

    UPDATE factions
       SET politician_capital       = GREATEST(0, COALESCE(politician_capital, 0) - 1),
           next_local_action_tick   = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_capital INTO v_new_capital;

    UPDATE factions
       SET popularity_pct = LEAST(popularity_cap_pct,
                                  GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
    RETURNING popularity_pct, faction_name INTO v_new_pop, v_party_name;

    RETURN jsonb_build_object(
        'success',         true,
        'action',          'mobilize_volunteers',
        'volunteers',      v_volunteers,
        'popularity_delta', v_pop_delta,
        'new_popularity',  v_new_pop,
        'new_capital',     v_new_capital,
        'party_name',      v_party_name,
        'next_action_tick', v_tick + 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_mobilize_volunteers(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
