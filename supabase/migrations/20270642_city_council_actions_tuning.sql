-- ════════════════════════════════════════════════════════════════════
-- 20270642 — City Council Member actions: post-ship tuning
--
-- Three numeric tweaks the user lined up after 20270641 shipped:
--
--   1. politician_mobilize_volunteers: popularity multiplier drops
--      from 0.1 → 0.05 per Volunteer. Same shape — 1 Capital cost,
--      same caps + gates — only the per-Volunteer popularity bump
--      halves.
--
--   2. politician_lobby_minister: cooldown shortens 8 ticks → 3
--      ticks (the per-action reroll gate; the per-tick lock is
--      untouched).
--
--   3. politician_lobby_minister: the rebuffed roll (1) now also
--      decrements volunteers by 1, on top of the existing
--      -1 Reputation. The minister's public dressing-down costs
--      you a volunteer who walks. Volunteers floor at 0.
--
-- politician_build_the_base is unchanged.
--
-- Apply after 20270641.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. politician_mobilize_volunteers — 0.05 multiplier ───────────
CREATE OR REPLACE FUNCTION public.politician_mobilize_volunteers(p_party_id uuid)
RETURNS jsonb
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
    IF COALESCE(v_pol.politician_influence, 0) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capital',
            'have', COALESCE(v_pol.politician_influence, 0), 'need', 1);
    END IF;

    -- 20270642: multiplier 0.1 → 0.05 per Volunteer.
    v_pop_delta := 0.05 * v_volunteers;

    UPDATE factions
       SET politician_influence       = GREATEST(0, COALESCE(politician_influence, 0) - 1),
           next_local_action_tick     = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_capital;

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
GRANT EXECUTE ON FUNCTION public.politician_mobilize_volunteers(uuid) TO authenticated;

-- ── 2. politician_lobby_minister — 3-tick cooldown, rebuff costs a volunteer ─
CREATE OR REPLACE FUNCTION public.politician_lobby_minister(p_party_id uuid)
RETURNS jsonb
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
    IF COALESCE(v_pol.political_capital, 0) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_influence',
            'have', COALESCE(v_pol.political_capital, 0), 'need', 1);
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
        -- 20270642: rebuff now also peels off a volunteer (floored).
        v_vol_delta := -1;
    ELSIF v_roll >= 5 THEN
        v_bracket := 'delivered';
        v_capital_delta := 1;
        v_rep_delta := 1;
    ELSE
        v_bracket := 'null_result';
    END IF;

    -- 20270642: cooldown 8 → 3 ticks.
    UPDATE factions
       SET political_capital            = GREATEST(0, COALESCE(political_capital, 0) + v_inf_delta),
           politician_influence         = COALESCE(politician_influence, 0)         + v_capital_delta,
           politician_reputation        = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta),
           volunteers                   = GREATEST(0, COALESCE(volunteers, 0) + v_vol_delta),
           next_local_action_tick       = v_tick + 1,
           next_lobby_minister_tick     = v_tick + 3
     WHERE id = v_pol.id
    RETURNING politician_influence, political_capital, politician_reputation, volunteers
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
        'next_action_tick',      v_tick + 1,
        'next_lobby_minister_tick', v_tick + 3
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_lobby_minister(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
