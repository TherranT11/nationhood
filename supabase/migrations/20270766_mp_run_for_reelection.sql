-- ════════════════════════════════════════════════════════════════════
-- 20270766 — politician_stand_for_election: incumbent MP re-election
--
-- User report: a sitting MP with N ticks left on their term has no
-- viable path forward when N is shorter than the Senior MP "full
-- term served" gate (parliamentary_term_ticks, typically 24). They
-- can't promote to Senior MP (term not yet served) and they can't
-- re-run for their seat (politician_stand_for_election bounces them
-- with reason 'already_in_office'). Their seat expires at the
-- general election and the ladder stalls.
--
-- Fix: lift the already_in_office gate when ALL of the following hold:
--
--   1. p_tier = 'parliament'  (no community downgrade for office holders)
--   2. v_pol.politician_office IN ('member_of_parliament','senior_mp')
--   3. The nation's next_election_tick is set, in the future or now,
--      AND within 5 ticks of the current tick.
--
-- Other office holders (mayor / CCM / CCP / community organizer)
-- still hit the gate as before. The Senior MP rung's separate
-- term-served check is unchanged — this is purely the re-run-as-MP
-- lane.
--
-- The election-offer RPC (politician_get_election_offer, 20270713)
-- already lacks an already_in_office gate, so the modal's offer
-- fetch works for incumbents without modification. The resolver and
-- entry-fee logic are untouched.
--
-- Body byte-faithful to 20270668's politician_stand_for_election
-- except for the gate replacement at the existing `IF v_pol.
-- politician_office IS NOT NULL` block. Same arg signature
-- (uuid, text, uuid), same GRANT/REVOKE.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_stand_for_election(
    p_party_id   uuid,
    p_tier       text,
    p_faction_id uuid
)
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
    v_election_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_tier NOT IN ('community','parliament') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick, id INTO v_tick, v_shard_id FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- 20270766: incumbent MP / Senior MP may run for re-election in
    -- the final 5 ticks of their term (tier='parliament' only). All
    -- other office holders, and community downgrades from any office,
    -- still hit the gate.
    IF v_pol.politician_office IS NOT NULL THEN
        SELECT next_election_tick INTO v_election_tick
          FROM nations WHERE id = v_pol.nation_id;
        IF NOT (
            p_tier = 'parliament'
            AND v_pol.politician_office IN ('member_of_parliament','senior_mp')
            AND v_election_tick IS NOT NULL
            AND v_election_tick >= v_tick
            AND v_election_tick - v_tick <= 5
        ) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'already_in_office',
                'office', v_pol.politician_office);
        END IF;
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
            'entry_fee',      CASE WHEN p_tier = 'parliament' THEN v_entry_fee ELSE 0 END,
            'is_reelection',  v_pol.politician_office IS NOT NULL
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

REVOKE EXECUTE ON FUNCTION public.politician_stand_for_election(uuid, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_stand_for_election(uuid, text, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
