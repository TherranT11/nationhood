-- ============================================================
-- 20270506 — politician_stand_for_election: free first-tick action
-- ============================================================
-- Player feedback: a politician who enters a race on tick N can't
-- door-knock or give a speech until tick N+1, because
-- politician_stand_for_election (20270452) bumps
-- next_member_action_tick = v_tick + 1 on commit. The UI then
-- reads "Already campaigned this tick — next action at tick N+1",
-- even though they never campaigned — they just signed up.
--
-- Design call: standing for election is administrative, not a
-- campaign action. A new candidate should get ONE campaign move
-- on the entry tick to set a tone (knock or speech). The 1-tick /
-- 3-tick action cooldowns then govern from there as normal.
--
-- Fix: drop the unconditional cooldown bump on race entry. If a
-- prior action left a future cooldown on next_member_action_tick,
-- it's preserved (we don't clobber it downwards either). The
-- response payload returns the existing value so the client can
-- update its banner without re-fetching factions.
--
-- Touches politician_stand_for_election(p_party_id uuid, p_tier text)
-- only. Everything else from 20270452 (MP entry fee, polling seed,
-- active_election insert, career event log) is preserved verbatim.
-- ============================================================

CREATE OR REPLACE FUNCTION public.politician_stand_for_election(p_party_id uuid, p_tier text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_shard_id  uuid;
    v_offer     politician_election_offers%ROWTYPE;
    v_next      int;
    v_resolve   int;
    v_district  text;
    v_opp_first text;
    v_opp_last  text;
    v_opp_blurb text;
    v_opp_pname text;
    v_your      int;
    v_opp       int;
    v_odds      int;
    v_win       int;
    v_lose      int;
    v_poll_you  int;
    v_poll_opp  int;
    v_poll_und  int;
    v_party_funds_before bigint;
    v_entry_fee bigint := 50000;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_tier NOT IN ('community','parliament') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    IF v_pol.politician_office IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_in_office',
            'office', v_pol.politician_office);
    END IF;

    SELECT current_tick, id INTO v_tick, v_shard_id FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF EXISTS (SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'race_in_progress');
    END IF;

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    SELECT * INTO v_offer FROM politician_election_offers WHERE politician_id = v_pol.id;
    IF v_offer.politician_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_offer');
    END IF;

    IF p_tier = 'community' THEN
        v_district  := v_offer.com_district;
        v_opp_first := v_offer.com_opp_first;
        v_opp_last  := v_offer.com_opp_last;
        v_opp_blurb := v_offer.com_opp_blurb;
        v_opp_pname := NULL;
        v_your      := v_offer.com_your_stat;
        v_opp       := v_offer.com_opp_stat;
        v_odds      := v_offer.com_odds_pct;
        v_win       := v_offer.com_stake_win;
        v_lose      := v_offer.com_stake_lose;
        v_resolve   := v_tick + 1;
    ELSE
        v_district  := v_offer.parl_district;
        v_opp_first := v_offer.parl_opp_first;
        v_opp_last  := v_offer.parl_opp_last;
        v_opp_blurb := v_offer.parl_opp_blurb;
        v_opp_pname := v_offer.parl_opp_party_name;
        v_your      := v_offer.parl_your_stat;
        v_opp       := v_offer.parl_opp_stat;
        v_odds      := v_offer.parl_odds_pct;
        v_win       := v_offer.parl_stake_win;
        v_lose      := v_offer.parl_stake_lose;
        v_resolve   := v_tick + 2;
    END IF;

    IF p_tier = 'parliament' THEN
        SELECT party_funds INTO v_party_funds_before
          FROM factions
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
         FOR UPDATE;
        IF v_party_funds_before IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
        END IF;
        IF v_party_funds_before < v_entry_fee THEN
            RETURN jsonb_build_object('success', false,
                'reason', 'insufficient_party_funds',
                'have', v_party_funds_before, 'need', v_entry_fee);
        END IF;
        UPDATE factions
           SET party_funds = party_funds - v_entry_fee
         WHERE id = p_party_id;
    END IF;

    -- Polling seed (20270399).
    v_poll_you := GREATEST(0, LEAST(100, v_odds - 8));
    v_poll_und := 15;
    v_poll_opp := GREATEST(0, 100 - v_poll_you - v_poll_und);

    INSERT INTO politician_active_election (
        politician_id, shard_id, race_tier, district,
        opp_first, opp_last, opp_blurb, opp_party_name,
        your_stat, opp_stat, win_odds_pct, stake_win, stake_lose,
        resolve_tick,
        polling_you_pct, polling_opp_pct, polling_undecided_pct,
        party_id
    ) VALUES (
        v_pol.id, v_shard_id, p_tier, v_district,
        v_opp_first, v_opp_last, v_opp_blurb, v_opp_pname,
        v_your, v_opp, v_odds, v_win, v_lose,
        v_resolve,
        v_poll_you, v_poll_opp, v_poll_und,
        p_party_id
    );

    DELETE FROM politician_election_offers WHERE politician_id = v_pol.id;

    -- 20270506: do NOT bump next_member_action_tick here. Standing
    -- for election is administrative; the player gets one campaign
    -- action on the entry tick. Existing cooldown (if any) stands.
    v_next := v_pol.next_member_action_tick;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'stood_for_election', v_district,
        jsonb_build_object(
            'race_tier',      p_tier,
            'opponent',       v_opp_first || ' ' || v_opp_last,
            'opp_party_name', v_opp_pname,
            'win_odds_pct',   v_odds,
            'entry_fee',      CASE WHEN p_tier = 'parliament' THEN v_entry_fee ELSE 0 END
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'race_tier', p_tier,
        'district', v_district,
        'opp_full_name', v_opp_first || ' ' || v_opp_last,
        'win_odds_pct', v_odds,
        'resolve_tick', v_resolve,
        'next_member_action_tick', v_next,
        'polling_you_pct', v_poll_you,
        'polling_opp_pct', v_poll_opp,
        'polling_undecided_pct', v_poll_und
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_stand_for_election(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.politician_stand_for_election(uuid, text) IS
    'Commit to a community or parliament race from the current offer. Parliament tier charges a $50K party-funds entry fee. As of 20270506, does NOT bump next_member_action_tick — entering the race is administrative, leaving the entry tick free for the first campaign action.';
