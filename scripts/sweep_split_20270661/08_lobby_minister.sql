-- 20270661 split #08 of 10 — politician_lobby_minister(p_party_id, p_faction_id)
--
-- Standalone re-emit. DROP old (uuid) signature, CREATE new
-- (uuid, uuid) with p_faction_id ownership lookup. Body otherwise
-- byte-identical to 20270646.

BEGIN;

DROP FUNCTION IF EXISTS public.politician_lobby_minister(uuid);

CREATE OR REPLACE FUNCTION public.politician_lobby_minister(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_pol             factions%ROWTYPE;
    v_tick            int;
    v_roll            int;
    v_ministry_roll   int;
    v_ministry_slug   text;
    v_ministry_name   text;
    v_capital_delta   int := 0;
    v_rep_delta       numeric := 0;
    v_vol_delta       int := 0;
    v_inf_delta       int := -1;
    v_bracket         text;
    v_new_capital     numeric;
    v_new_influence   numeric;
    v_new_rep         numeric;
    v_new_volunteers  int;
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
    IF v_pol.next_lobby_minister_tick IS NOT NULL
       AND v_pol.next_lobby_minister_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'lobby_cooldown',
            'ready_at_tick', v_pol.next_lobby_minister_tick);
    END IF;
    IF COALESCE(v_pol.politician_influence, 0) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_influence',
            'have', COALESCE(v_pol.politician_influence, 0), 'need', 1);
    END IF;

    v_ministry_roll := 1 + floor(random() * 4)::int;
    v_ministry_slug := CASE v_ministry_roll
        WHEN 1 THEN 'defense'
        WHEN 2 THEN 'foreign_affairs'
        WHEN 3 THEN 'economic_development'
        WHEN 4 THEN 'interior'
    END;
    v_ministry_name := CASE v_ministry_roll
        WHEN 1 THEN 'Defense'
        WHEN 2 THEN 'Foreign Affairs & Trade'
        WHEN 3 THEN 'Economic Development'
        WHEN 4 THEN 'Interior'
    END;

    v_roll := 1 + floor(random() * 6)::int;
    IF v_roll = 1 THEN
        v_bracket := 'rebuffed';
        v_rep_delta := -1;
        v_vol_delta := -1;
    ELSIF v_roll >= 5 THEN
        v_bracket := 'delivered';
        v_capital_delta := 1;
        v_rep_delta := 1;
    ELSE
        v_bracket := 'null_result';
    END IF;

    UPDATE factions
       SET politician_influence         = GREATEST(0, COALESCE(politician_influence, 0) + v_inf_delta),
           politician_capital           = COALESCE(politician_capital, 0)         + v_capital_delta,
           politician_reputation        = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta),
           volunteers                   = GREATEST(0, COALESCE(volunteers, 0) + v_vol_delta),
           next_local_action_tick       = v_tick + 1,
           next_lobby_minister_tick     = v_tick + 3
     WHERE id = v_pol.id
    RETURNING politician_capital, politician_influence, politician_reputation, volunteers
        INTO v_new_capital, v_new_influence, v_new_rep, v_new_volunteers;

    RETURN jsonb_build_object(
        'success',           true,
        'action',            'lobby_minister',
        'roll',              v_roll,
        'bracket',           v_bracket,
        'ministry',          v_ministry_slug,
        'ministry_name',     v_ministry_name,
        'capital_delta',     v_capital_delta,
        'reputation_delta',  v_rep_delta,
        'influence_delta',   v_inf_delta,
        'volunteer_delta',   v_vol_delta,
        'new_capital',       v_new_capital,
        'new_influence',     v_new_influence,
        'new_reputation',    v_new_rep,
        'new_volunteers',    v_new_volunteers,
        'next_action_tick',          v_tick + 1,
        'next_lobby_minister_tick',  v_tick + 3
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_lobby_minister(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
