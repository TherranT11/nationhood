-- ════════════════════════════════════════════════════════════════════
-- 20270663 — Phase A.1.5: Party-bloc tally for committee report votes
--
-- Per user direction: each player MP's vote stands in for every
-- seat their party holds on the committee. NPCs of the same party
-- follow the first player from that party who votes. Parties with
-- no player on the committee abstain — their seats don't count
-- toward the tally or the threshold. Ties don't resolve (the bill
-- sits) — chair-override / tiebreaker is a future layer.
--
-- Tally model:
--   votable_seats = COUNT(*) FROM committee_members
--                    WHERE committee_id = X
--                      AND party_id IN (
--                          SELECT DISTINCT party_id FROM committee_members
--                           WHERE committee_id = X
--                             AND politician_faction_id IS NOT NULL
--                      )
--   threshold     = (votable_seats / 2) + 1
--   report_seats  = SUM(party_seats) WHERE first-player-vote-from-party = 'report'
--   table_seats   = SUM(party_seats) WHERE first-player-vote-from-party = 'table'
--
-- "First-player-vote-from-party" means: ORDER BY voted_at_tick ASC,
-- created_at ASC, take first vote per party_id. Subsequent same-party
-- player votes are recorded but don't change the bloc — they get
-- their seat counted into the first player's chosen side.
--
-- This re-emits mp_vote_on_report from 20270662 (audit-fixed in
-- 8cd73ee). The bill_report_votes schema, the membership gate, the
-- ownership guard, the FOR UPDATE lock, and the unique-violation
-- handling all stay. Only the tally + threshold computation changes.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.mp_vote_on_report(
    p_faction_id  uuid,
    p_proposal_id uuid,
    p_vote        text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_prop          committee_proposals%ROWTYPE;
    v_vote          text := lower(btrim(COALESCE(p_vote, '')));
    v_tick          int;
    v_votable_seats int := 0;
    v_report_count  int := 0;
    v_table_count   int := 0;
    v_threshold     int;
    v_resolved      text := NULL;
    v_party         RECORD;
    v_party_vote    text;
    v_party_seats   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_proposal_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF v_vote NOT IN ('report', 'table') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_vote');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_prop FROM committee_proposals
     WHERE id = p_proposal_id
     FOR UPDATE;
    IF v_prop.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_not_found');
    END IF;
    IF v_prop.status <> 'awaiting_report_vote' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_report_vote',
            'status', v_prop.status);
    END IF;

    PERFORM 1 FROM committee_members
     WHERE committee_id          = v_prop.committee_id
       AND politician_faction_id = v_pol.id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_committee_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    BEGIN
        INSERT INTO bill_report_votes
            (proposal_id, voter_faction_id, vote, voted_at_tick)
        VALUES
            (p_proposal_id, v_pol.id, v_vote, v_tick);
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_voted');
    END;

    -- ── Party-bloc tally ───────────────────────────────────────────
    -- For each party that has at least one player on this committee
    -- and at least one cast vote, accumulate their seat count to the
    -- side their first player voted for. Parties with no player driver
    -- abstain — their seats don't enter the tally or the threshold.
    FOR v_party IN
        SELECT DISTINCT cm.party_id
          FROM bill_report_votes brv
          JOIN committee_members cm
                 ON cm.politician_faction_id = brv.voter_faction_id
                AND cm.committee_id = v_prop.committee_id
         WHERE brv.proposal_id = p_proposal_id
           AND cm.party_id IS NOT NULL
    LOOP
        -- First player vote from this party (stable order: voted_at_tick,
        -- then created_at for same-tick ties).
        SELECT brv.vote INTO v_party_vote
          FROM bill_report_votes brv
          JOIN committee_members cm
                 ON cm.politician_faction_id = brv.voter_faction_id
                AND cm.committee_id = v_prop.committee_id
                AND cm.party_id = v_party.party_id
         WHERE brv.proposal_id = p_proposal_id
         ORDER BY brv.voted_at_tick ASC, brv.created_at ASC
         LIMIT 1;

        -- Total seats this party holds on the committee (player + NPC).
        SELECT COUNT(*) INTO v_party_seats
          FROM committee_members
         WHERE committee_id = v_prop.committee_id
           AND party_id     = v_party.party_id;

        IF v_party_vote = 'report' THEN
            v_report_count := v_report_count + v_party_seats;
        ELSIF v_party_vote = 'table' THEN
            v_table_count := v_table_count + v_party_seats;
        END IF;
    END LOOP;

    -- Votable seats: every committee seat whose party has at least one
    -- player on the committee. Parties with no player drift through as
    -- abstentions — neither side gets their weight.
    SELECT COUNT(*) INTO v_votable_seats
      FROM committee_members
     WHERE committee_id = v_prop.committee_id
       AND party_id     IS NOT NULL
       AND party_id     IN (
           SELECT DISTINCT party_id
             FROM committee_members
            WHERE committee_id          = v_prop.committee_id
              AND politician_faction_id IS NOT NULL
              AND party_id              IS NOT NULL
       );

    v_threshold := (v_votable_seats / 2) + 1;

    IF v_report_count >= v_threshold THEN
        UPDATE committee_proposals SET status = 'reported' WHERE id = p_proposal_id;
        v_resolved := 'reported';
    ELSIF v_table_count >= v_threshold THEN
        UPDATE committee_proposals SET status = 'tabled' WHERE id = p_proposal_id;
        v_resolved := 'tabled';
    END IF;

    RETURN jsonb_build_object(
        'success',       true,
        'proposal_id',   p_proposal_id,
        'vote',          v_vote,
        'report_count',  v_report_count,
        'table_count',   v_table_count,
        'votable_seats', v_votable_seats,
        'threshold',     v_threshold,
        'resolved',      v_resolved
    );
END $$;

COMMENT ON FUNCTION public.mp_vote_on_report(uuid, uuid, text) IS
    'Committee Report-vs-Table vote (Phase A.1.5, 20270663 supersedes 20270662). Each player MP''s vote stands in for every seat their party holds on the committee — NPCs of the same party follow the first player vote from that party. Parties with no player on the committee abstain (their seats don''t enter the tally or the denominator). First side to ⌊votable_seats / 2⌋ + 1 resolves. Ties don''t resolve; the bill sits.';

NOTIFY pgrst, 'reload schema';

COMMIT;
