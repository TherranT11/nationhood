-- ════════════════════════════════════════════════════════════════════
-- 20270667 — Multi-politician faction_id sweep, round 3
--
-- 20270665 closed nine stragglers from the original 20270661 sweep
-- but missed the three Community-Organizer "Local" RPCs:
--
--   • politician_fundraising_call(p_party_id)
--   • politician_civic_meeting(p_party_id)
--   • politician_office_hours(p_party_id)
--
-- The fundraising-call surface threw a 404 today:
--   "Could not find the function public.politician_fundraising_call
--    (p_faction_id, p_party_id) in the schema cache"
--
-- politician-home.html's handleMpAction has been passing both kwargs
-- to every action RPC since 20270661 landed. The five Community-
-- Organizer / City-Council "Local" RPCs that the 20270661 sweep
-- covered (door_knock, give_speech, mobilize_volunteers,
-- build_the_base, lobby_minister) all accept the kwarg. These three
-- never made the cut so PostgREST 404s on the signature mismatch.
--
-- Same fix shape as 20270661 / 20270665. p_faction_id is the second
-- argument; the SELECT becomes id-based with the (id = v_uid OR
-- linked_user_id = v_uid) ownership guard. Bodies otherwise
-- byte-faithful to 20270583 (latest definition for all three).
--
-- No client changes — handleMpAction already threads p_faction_id
-- on every spec.needsParty action.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. politician_civic_meeting(p_party_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_civic_meeting(uuid);

CREATE OR REPLACE FUNCTION public.politician_civic_meeting(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid               uuid := auth.uid();
    v_pol               factions%ROWTYPE;
    v_tick              int;
    v_roll              int;
    v_total             numeric;
    v_bracket           text;
    v_volunteer_delta   int := 0;
    v_pop_delta         numeric := 0;
    v_cred_delta        numeric := 0;
    v_vol_cap           numeric;
    v_new_vol           numeric;
    v_new_cred          numeric;
    v_new_pop           numeric;
    v_cooldown          int;
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
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_skill, 0);
    v_vol_cap := COALESCE(v_pol.politician_skill, 0) * 3;

    IF v_roll = 1 THEN
        v_bracket := 'crit_fail';
        v_volunteer_delta := -1;
    ELSIF v_total < 5 THEN
        v_bracket := 'fail';
        v_cred_delta := -0.5;
    ELSIF v_roll = 6 THEN
        v_bracket := 'crit';
        v_volunteer_delta := 2;
        v_pop_delta := 0.5;
    ELSE
        v_bracket := 'hit';
        v_volunteer_delta := 1;
    END IF;

    -- Volunteers: clamp at [0, cap]. The cap is recomputed AFTER any
    -- credibility delta so a fail+gain sequence doesn't free-overflow.
    -- Apply credibility first.
    IF v_cred_delta <> 0 THEN
        UPDATE factions
           SET politician_skill = GREATEST(0, COALESCE(politician_skill, 0) + v_cred_delta)
         WHERE id = v_pol.id
        RETURNING politician_skill INTO v_new_cred;
        v_vol_cap := v_new_cred * 3;
    END IF;
    IF v_volunteer_delta <> 0 THEN
        UPDATE factions
           SET volunteers = GREATEST(0, LEAST(v_vol_cap, COALESCE(volunteers, 0) + v_volunteer_delta))
         WHERE id = v_pol.id
        RETURNING volunteers INTO v_new_vol;
    END IF;
    IF v_pop_delta <> 0 THEN
        UPDATE factions
           SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
        RETURNING popularity_pct INTO v_new_pop;
    END IF;

    v_cooldown := v_tick + 1;
    UPDATE factions SET next_local_action_tick = v_cooldown WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'action',           'civic_meeting',
        'roll',             v_roll,
        'skill',      COALESCE(v_pol.politician_skill, 0),
        'total',            v_total,
        'bracket',          v_bracket,
        'volunteer_delta',  v_volunteer_delta,
        'skill_delta', v_cred_delta,
        'popularity_delta', v_pop_delta,
        'new_volunteers',   COALESCE(v_new_vol, COALESCE(v_pol.volunteers, 0)),
        'new_skill',  COALESCE(v_new_cred, COALESCE(v_pol.politician_skill, 0)),
        'new_popularity',   v_new_pop,
        'volunteer_cap',    v_vol_cap,
        'next_action_tick', v_cooldown
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_civic_meeting(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_civic_meeting(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 2. politician_fundraising_call(p_party_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_fundraising_call(uuid);

CREATE OR REPLACE FUNCTION public.politician_fundraising_call(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid               uuid := auth.uid();
    v_pol               factions%ROWTYPE;
    v_tick              int;
    v_roll              int;
    v_total             numeric;
    v_bracket           text;
    v_money_raised      bigint := 0;
    v_volunteers_mult   numeric;
    v_new_funds         bigint;
    v_new_cred          numeric;
    v_cooldown          int;
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
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    v_roll  := 1 + floor(random() * 10)::int;
    v_total := v_roll + COALESCE(v_pol.politician_skill, 0);
    v_volunteers_mult := 1 + COALESCE(v_pol.volunteers, 0) * 0.1;

    IF v_roll = 1 THEN
        v_bracket := 'crit_fail';
        UPDATE factions
           SET politician_skill = GREATEST(0, COALESCE(politician_skill, 0) - 1)
         WHERE id = v_pol.id
        RETURNING politician_skill INTO v_new_cred;
    ELSIF v_total < 5 THEN
        v_bracket := 'fail';
    ELSIF v_roll = 10 THEN
        v_bracket := 'crit';
        v_money_raised := (round(v_roll * 1000 * v_volunteers_mult * 2))::bigint;
        UPDATE factions
           SET politician_skill = COALESCE(politician_skill, 0) + 1
         WHERE id = v_pol.id
        RETURNING politician_skill INTO v_new_cred;
    ELSE
        v_bracket := 'hit';
        v_money_raised := (round(v_roll * 1000 * v_volunteers_mult))::bigint;
    END IF;

    IF v_money_raised > 0 THEN
        UPDATE factions
           SET party_funds = COALESCE(party_funds, 0) + v_money_raised
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
        RETURNING party_funds INTO v_new_funds;
    END IF;

    v_cooldown := v_tick + 1;
    UPDATE factions SET next_local_action_tick = v_cooldown WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'fundraising_call',
        'roll',                 v_roll,
        'skill',          COALESCE(v_pol.politician_skill, 0),
        'total',                v_total,
        'bracket',              v_bracket,
        'volunteers',           COALESCE(v_pol.volunteers, 0),
        'volunteers_multiplier', v_volunteers_mult,
        'money_raised',         v_money_raised,
        'party_funds_after',    v_new_funds,
        'new_skill',      v_new_cred,
        'next_action_tick',     v_cooldown
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_fundraising_call(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_fundraising_call(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 3. politician_office_hours(p_party_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_office_hours(uuid);

CREATE OR REPLACE FUNCTION public.politician_office_hours(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid               uuid := auth.uid();
    v_pol               factions%ROWTYPE;
    v_party_funds       bigint;
    v_tick              int;
    v_cost              bigint := 5000;
    v_roll              int;
    v_total             int;
    v_bracket           text;
    v_rep_delta         int := 0;
    v_cred_delta        numeric := 0;
    v_pop_delta         numeric := 0;
    v_new_funds         bigint;
    v_new_rep           int;
    v_new_cred          numeric;
    v_new_pop           numeric;
    v_cooldown          int;
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
    IF v_pol.next_local_action_tick IS NOT NULL
       AND v_pol.next_local_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_local_action_tick);
    END IF;

    SELECT party_funds INTO v_party_funds
      FROM factions
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_party_funds IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    IF v_party_funds < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_party_funds',
            'have', v_party_funds, 'need', v_cost);
    END IF;

    UPDATE factions
       SET party_funds = party_funds - v_cost
     WHERE id = p_party_id
    RETURNING party_funds INTO v_new_funds;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_reputation, 0);

    IF v_roll = 1 THEN
        v_bracket := 'crit_fail';
        v_rep_delta := -1;
    ELSIF v_total < 5 THEN
        v_bracket := 'fail';
        v_pop_delta := -0.5;
    ELSIF v_roll = 6 THEN
        v_bracket := 'crit';
        v_rep_delta := 1;
    ELSE
        v_bracket := 'hit';
        v_cred_delta := 0.5;
    END IF;

    IF v_rep_delta <> 0 THEN
        UPDATE factions
           SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta)
         WHERE id = v_pol.id
        RETURNING politician_reputation INTO v_new_rep;
    END IF;
    IF v_cred_delta <> 0 THEN
        UPDATE factions
           SET politician_skill = COALESCE(politician_skill, 0) + v_cred_delta
         WHERE id = v_pol.id
        RETURNING politician_skill INTO v_new_cred;
    END IF;
    IF v_pop_delta <> 0 THEN
        UPDATE factions
           SET popularity_pct = LEAST(popularity_cap_pct, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
        RETURNING popularity_pct INTO v_new_pop;
    END IF;

    v_cooldown := v_tick + 1;
    UPDATE factions SET next_local_action_tick = v_cooldown WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'action',           'office_hours',
        'roll',             v_roll,
        'reputation',       COALESCE(v_pol.politician_reputation, 0),
        'total',            v_total,
        'bracket',          v_bracket,
        'cost',             v_cost,
        'reputation_delta', v_rep_delta,
        'skill_delta', v_cred_delta,
        'popularity_delta', v_pop_delta,
        'party_funds_after', v_new_funds,
        'new_reputation',   v_new_rep,
        'new_skill',  v_new_cred,
        'new_popularity',   v_new_pop,
        'next_action_tick', v_cooldown
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_office_hours(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_office_hours(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
