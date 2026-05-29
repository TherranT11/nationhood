-- ════════════════════════════════════════════════════════════════════
-- STOOD FOR ELECTION — career event row at stand time
-- ════════════════════════════════════════════════════════════════════
-- When a politician commits to a race via politician_stand_for_election,
-- log a 'stood_for_election' career event so the Political Career
-- container on politician-home reads the beat alongside join/leave
-- party and the eventual won/lost row.
--
-- Event type added by this migration:
--   stood_for_election
--     target_name → district (community ward or parliament seat)
--     metadata:
--       race_tier      → 'community' | 'parliament' (drives the template)
--       opponent       → opp_first || ' ' || opp_last (snapshot)
--       opp_party_name → snapshot of opponent's party (parliament only)
--       win_odds_pct   → snapshot for after-the-fact analysis
--
-- The RPC body is identical to 20270398's except for the new INSERT
-- into politician_career_events between the next_member_action_tick
-- update and the RETURN. Stake / odds / district reads still come off
-- the offer row so the race-economy single-source-of-truth note in
-- 20270398 still holds.
--
-- One-time backfill at the bottom: any in-flight race without a
-- corresponding stood_for_election event gets one inserted, with
-- event_tick back-derived from resolve_tick (community = -1,
-- parliament = -2). Without this, an active race that started before
-- this migration would never log the new beat — the resolve RPC only
-- writes won/lost. Resolved races aren't backfilled (the
-- active_election row is gone by then; resurrecting it from won/lost
-- metadata would invent data we don't have).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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

    INSERT INTO politician_active_election (
        politician_id, shard_id, race_tier, district,
        opp_first, opp_last, opp_blurb, opp_party_name,
        your_stat, opp_stat, win_odds_pct, stake_win, stake_lose,
        resolve_tick
    ) VALUES (
        v_pol.id, v_shard_id, p_tier, v_district,
        v_opp_first, v_opp_last, v_opp_blurb, v_opp_pname,
        v_your, v_opp, v_odds, v_win, v_lose,
        v_resolve
    );

    DELETE FROM politician_election_offers WHERE politician_id = v_pol.id;

    v_next := v_tick + 1;
    UPDATE factions
       SET next_member_action_tick = v_next
     WHERE id = v_pol.id;

    -- NEW (20270402): log the stand-for-election beat to the career log so
    -- politician-home's Political Career container reads the decision the
    -- moment it's made. The eventual won_election / lost_election event
    -- still gets written by politician_resolve_due_elections, so the log
    -- ends up with the full arc: stood → won/lost.
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
        'next_member_action_tick', v_next
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_stand_for_election(uuid, text) TO authenticated;

-- ── Backfill ────────────────────────────────────────────────────────
-- Any in-flight race that started before this migration won't have a
-- stood_for_election row in the career log. Insert one for each,
-- back-deriving event_tick from resolve_tick: community races resolve
-- +1, parliament races resolve +2. The NOT EXISTS guard keeps this
-- idempotent if the migration re-runs.
INSERT INTO politician_career_events (
    faction_id, event_tick, event_type, target_name, metadata
)
SELECT
    ae.politician_id,
    ae.resolve_tick - CASE WHEN ae.race_tier = 'community' THEN 1 ELSE 2 END,
    'stood_for_election',
    ae.district,
    jsonb_build_object(
        'race_tier',      ae.race_tier,
        'opponent',       ae.opp_first || ' ' || ae.opp_last,
        'opp_party_name', ae.opp_party_name,
        'win_odds_pct',   ae.win_odds_pct
    )
  FROM politician_active_election ae
 WHERE NOT EXISTS (
     SELECT 1 FROM politician_career_events ce
      WHERE ce.faction_id = ae.politician_id
        AND ce.event_type = 'stood_for_election'
        AND ce.target_name = ae.district
 );

NOTIFY pgrst, 'reload schema';

COMMIT;
