-- 20270661 split #09 of 10 — politician_run_political_ads(p_party_id, p_faction_id)
--
-- Standalone re-emit. DROP old (uuid) signature, CREATE new
-- (uuid, uuid) with p_faction_id ownership lookup. Body otherwise
-- byte-identical to 20270646.

BEGIN;

DROP FUNCTION IF EXISTS public.politician_run_political_ads(uuid);

CREATE OR REPLACE FUNCTION public.politician_run_political_ads(
    p_party_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    AD_COST    CONSTANT int := 1;
    FLAT_BONUS CONSTANT int := 6;
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_roll      int;
    v_total     int;
    v_race      politician_active_election%ROWTYPE;
    v_und_take  int;
    v_opp_take  int;
    v_new_cap   int;
    v_next      int;
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

    IF COALESCE(v_pol.politician_capital, 0) < AD_COST THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capital',
            'required', AD_COST,
            'have',     COALESCE(v_pol.politician_capital, 0));
    END IF;

    v_roll  := 1 + floor(random() * 10)::int;
    v_total := v_roll + FLAT_BONUS;
    v_next  := v_tick + 1;

    UPDATE factions
       SET politician_capital   = GREATEST(0, COALESCE(politician_capital, 0) - AD_COST),
           next_member_action_tick = v_next
     WHERE id = v_pol.id
    RETURNING politician_capital INTO v_new_cap;

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NOT NULL THEN
        v_und_take := LEAST(v_total, v_race.polling_undecided_pct);
        v_opp_take := v_total - v_und_take;
        UPDATE politician_active_election
           SET polling_you_pct       = LEAST(100, polling_you_pct + v_total),
               polling_undecided_pct = polling_undecided_pct - v_und_take,
               polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take)
         WHERE politician_id = v_pol.id;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'run_political_ads',
        'roll',                    v_roll,
        'polling_delta',           v_total,
        'cost',                    AD_COST,
        'politician_capital',      v_new_cap,
        'next_member_action_tick', v_next,
        'has_active_race',         v_race.politician_id IS NOT NULL
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_run_political_ads(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
