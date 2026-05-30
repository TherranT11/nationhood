-- ════════════════════════════════════════════════════════════════════
-- Restore polling seed on politician_stand_for_election
-- ════════════════════════════════════════════════════════════════════
-- 20270399 added three polling columns to politician_active_election
-- (polling_you_pct, polling_opp_pct, polling_undecided_pct) and seeded
-- them inside politician_stand_for_election:
--     polling_you = win_odds_pct - 8
--     polling_und = 15
--     polling_opp = 100 - polling_you - polling_undecided
--
-- 20270402 (Career log: stood_for_election event) replaced
-- politician_stand_for_election by copying 20270398's body verbatim
-- and inserting the new career_events row at the bottom. That copy
-- silently regressed the INSERT into politician_active_election back
-- to the pre-20270399 shape — the three polling columns dropped off
-- the column list + values list, so every race created since 20270402
-- has been inserted with the schema-default polling row of 0/0/0.
--
-- The Pressing Issues "Current Polling" bar correctly reads
-- polling_you_pct / polling_opp_pct / polling_undecided_pct, but with
-- all three at 0 it renders YOU 0% · OPP 0% · UNDECIDED 0% — the
-- screenshot the user flagged.
--
-- ── Fix ─────────────────────────────────────────────────────────────
-- 1. Re-author politician_stand_for_election with the polling seed
--    AND the career-event INSERT both intact. This is the canonical
--    body going forward; if a future migration touches the function
--    again it must include both blocks (the comment block at the top
--    of the function spells this out).
-- 2. Backfill any in-flight race that still has the broken default
--    polling row (all three columns = 0) using the same seed formula
--    against the stored win_odds_pct. Idempotent — skips races where
--    the player has already moved the polling via door_knock /
--    give_speech (those rows won't all be 0 anymore).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Re-author the RPC ────────────────────────────────────────────
-- Body = 20270402's body + the three polling locals from 20270399 +
-- the three polling columns back on the INSERT.
--
-- If you change this function again: KEEP the polling seed (v_poll_*
-- locals + the three columns on the INSERT) AND the
-- politician_career_events INSERT at the bottom. Both are required.
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

    -- Polling seed (20270399 — restored here after 20270402 dropped it).
    -- you = win_odds - 8 (8-point launch deficit per the design's
    -- "initial poll had you N points behind"). undecided = 15 flat.
    -- opp absorbs the rest. All three clamp at [0, 100]; win_odds is
    -- clamped to [15, 85] upstream so the math stays well inside.
    v_poll_you := GREATEST(0, LEAST(100, v_odds - 8));
    v_poll_und := 15;
    v_poll_opp := GREATEST(0, 100 - v_poll_you - v_poll_und);

    INSERT INTO politician_active_election (
        politician_id, shard_id, race_tier, district,
        opp_first, opp_last, opp_blurb, opp_party_name,
        your_stat, opp_stat, win_odds_pct, stake_win, stake_lose,
        resolve_tick,
        polling_you_pct, polling_opp_pct, polling_undecided_pct
    ) VALUES (
        v_pol.id, v_shard_id, p_tier, v_district,
        v_opp_first, v_opp_last, v_opp_blurb, v_opp_pname,
        v_your, v_opp, v_odds, v_win, v_lose,
        v_resolve,
        v_poll_you, v_poll_opp, v_poll_und
    );

    DELETE FROM politician_election_offers WHERE politician_id = v_pol.id;

    v_next := v_tick + 1;
    UPDATE factions
       SET next_member_action_tick = v_next
     WHERE id = v_pol.id;

    -- 20270402: log the stand beat to the career events table so the
    -- Political Career container reads the decision the moment it's
    -- made. The resolve RPC writes won/lost separately on resolution.
    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'stood_for_election', v_district,
        jsonb_build_object(
            'race_tier',      p_tier,
            'opponent',       v_opp_first || ' ' || v_opp_last,
            'opp_party_name', v_opp_pname,
            'win_odds_pct',   v_odds
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

-- ── 2. Backfill in-flight races stuck at the broken default ─────────
-- Only touches rows where all three polling columns are still 0,
-- which is the unique fingerprint of the broken-seed insert (a real
-- post-seed row has polling_you > 0 from the win_odds clamp, and a
-- row where the player has campaigned won't have all three at 0
-- either). Idempotent — re-runs touch zero rows after the first run.
UPDATE politician_active_election
   SET polling_you_pct       = GREATEST(0, LEAST(100, win_odds_pct - 8)),
       polling_undecided_pct = 15,
       polling_opp_pct       = GREATEST(0, 100 - GREATEST(0, LEAST(100, win_odds_pct - 8)) - 15)
 WHERE polling_you_pct       = 0
   AND polling_opp_pct       = 0
   AND polling_undecided_pct = 0;

NOTIFY pgrst, 'reload schema';

COMMIT;
