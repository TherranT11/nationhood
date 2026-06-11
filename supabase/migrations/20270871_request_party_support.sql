-- ════════════════════════════════════════════════════════════════════
-- 20270871 — Request Party Support (the fourth campaign action)
--
-- 'To help win an upcoming election, you request the party spend
-- money from its war chest to help your election efforts.'
--
-- The candidate spends UP TO 6 Influence (their own
-- politician_influence). Every Influence spent has the party match
-- it with $50k from the war chest (party_funds) — when the chest
-- can't cover the full ask, the spend rounds DOWN to what it can
-- fund (minimum 1 block, else war_chest_empty), and only the funded
-- Influence is charged. Every $50k block rolls 1D6: a 4-6 lands
-- +2 Polling, applied with the same undecided-first split the rally
-- uses. Shares the campaign desk's 1-action-per-tick gate
-- (next_member_action_tick) and requires a live race — the party
-- doesn't write checks without a ballot.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_request_party_support(
    p_party_id   uuid,
    p_faction_id uuid,
    p_influence  int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_party     factions%ROWTYPE;
    v_race      politician_active_election%ROWTYPE;
    v_tick      int;
    v_blocks    int;
    v_roll      int;
    v_rolls     jsonb := '[]'::jsonb;
    v_hits      int := 0;
    v_delta     int;
    v_und_take  int;
    v_opp_take  int;
    v_next      int;
    i           int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_influence IS NULL OR p_influence < 1 OR p_influence > 6 THEN
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

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = v_pol.id;
    IF v_race.politician_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_active_race');
    END IF;

    IF FLOOR(COALESCE(v_pol.politician_influence, 0)) < p_influence THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_influence',
            'need', p_influence, 'have', FLOOR(COALESCE(v_pol.politician_influence, 0)));
    END IF;

    -- Lock the war chest; the spend rounds down to what it can fund.
    SELECT * INTO v_party FROM factions
     WHERE id = p_party_id AND faction_type = 'movement_party' AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_party.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    v_blocks := LEAST(p_influence, FLOOR(COALESCE(v_party.party_funds, 0) / 50000)::int);
    IF v_blocks < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'war_chest_empty',
            'war_chest', COALESCE(v_party.party_funds, 0));
    END IF;

    -- Every $50k block rolls 1D6 — 4-6 lands +2 Polling.
    FOR i IN 1..v_blocks LOOP
        v_roll := 1 + floor(random() * 6)::int;
        v_rolls := v_rolls || to_jsonb(v_roll);
        IF v_roll >= 4 THEN
            v_hits := v_hits + 1;
        END IF;
    END LOOP;
    v_delta := v_hits * 2;
    v_next  := v_tick + 1;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_blocks * 50000
     WHERE id = v_party.id;
    UPDATE factions
       SET politician_influence    = COALESCE(politician_influence, 0) - v_blocks,
           next_member_action_tick = v_next
     WHERE id = v_pol.id;

    IF v_delta > 0 THEN
        v_und_take := LEAST(v_delta, v_race.polling_undecided_pct);
        v_opp_take := v_delta - v_und_take;
        UPDATE politician_active_election
           SET polling_you_pct       = LEAST(100, polling_you_pct + v_delta),
               polling_undecided_pct = polling_undecided_pct - v_und_take,
               polling_opp_pct       = GREATEST(0, polling_opp_pct - v_opp_take)
         WHERE politician_id = v_pol.id;
    END IF;

    RETURN jsonb_build_object(
        'success',                 true,
        'action',                  'request_party_support',
        'influence_spent',         v_blocks,
        'war_chest_spent',         v_blocks * 50000,
        'rolls',                   v_rolls,
        'hits',                    v_hits,
        'polling_delta',           v_delta,
        'next_member_action_tick', v_next
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.politician_request_party_support(uuid, uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_request_party_support(uuid, uuid, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
