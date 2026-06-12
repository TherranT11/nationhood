-- ════════════════════════════════════════════════════════════════════
-- 20270883 — The chamber floor vote becomes a real vote
--
-- User spec ('Need to make this a reality'): when a committee sends
-- a bill to the floor, the final reading is now a public 3-tick
-- chamber vote in the nation's Voting section — the ambassador-
-- confirmation pattern — instead of an instant invisible seat tally
-- that could die 0-0 with no record anywhere.
--
--   • committee_floor_votes — division locked at creation, public
--     for the window (same shape as ambassador_confirmation_votes).
--     Division rule: the SPONSOR'S OWN PARTY banks its seats YES
--     (generalizing the Tax Holiday ruling — your caucus backs your
--     bill); support-archetype parties YES; oppose-archetype NO;
--     every other seated party rolls 1D2 — the same neutral rule
--     committee motions already use. No silent 0-0 deaths.
--
--   • _committee_resolve_floor re-emitted (same signature, both
--     PERFORM call sites untouched): it now OPENS the chamber vote
--     and returns 'on_floor'; the proposal sits at status on_floor
--     for the window.
--
--   • resolve_due_committee_floor_votes() — lazy sweep (fired from
--     the nation Voting section + politician-home loads): enacts or
--     fails the proposal, stamps the floor_* columns, mints the Tax
--     Holiday on enacted holiday proposals (block moved here from
--     the old resolve_floor), and writes a terminal bills row so
--     the Laws page's Recent Results shows the outcome either way.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. The chamber record ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.committee_floor_votes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       uuid NOT NULL,
    proposal_id     uuid NOT NULL REFERENCES public.committee_proposals(id) ON DELETE CASCADE,
    bill_name       text NOT NULL,
    category        text,
    sponsor_name    text,
    -- The division, locked at creation: [{party_id, stance, seats}].
    party_votes     jsonb NOT NULL DEFAULT '[]',
    yes_seats       int NOT NULL DEFAULT 0,
    no_seats        int NOT NULL DEFAULT 0,
    chamber_size    int NOT NULL DEFAULT 0,
    status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'passed', 'failed')),
    started_at_tick int NOT NULL,
    resolve_at_tick int NOT NULL,
    resolved_tick   int,
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS committee_floor_votes_active_idx
    ON public.committee_floor_votes (nation_id) WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS committee_floor_votes_one_active_per_proposal
    ON public.committee_floor_votes (proposal_id) WHERE status = 'active';

ALTER TABLE public.committee_floor_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.committee_floor_votes;
CREATE POLICY "Allow select for all" ON public.committee_floor_votes FOR SELECT USING (true);
-- No INSERT/UPDATE policies — writes go through the definer
-- functions below only.

-- ── 2. _committee_resolve_floor — now opens the chamber vote ─────
CREATE OR REPLACE FUNCTION public._committee_resolve_floor(
    p_proposal_id uuid,
    p_tick        int
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_prop          committee_proposals%ROWTYPE;
    v_party         RECORD;
    v_sponsor_party uuid;
    v_sponsor_name  text;
    v_stance        text;
    v_votes         jsonb := '[]'::jsonb;
    v_yes           int := 0;
    v_no            int := 0;
    v_chamber       int := 0;
BEGIN
    SELECT * INTO v_prop FROM committee_proposals WHERE id = p_proposal_id;
    IF v_prop.id IS NULL THEN
        RETURN NULL;
    END IF;
    -- Idempotent: an open reading for this bill already stands.
    IF EXISTS (SELECT 1 FROM committee_floor_votes
                WHERE proposal_id = p_proposal_id AND status = 'active') THEN
        RETURN 'on_floor';
    END IF;

    -- Sponsor's party: the Tax Holiday snapshot when present
    -- (holiday_params.proposer_party_id), else the author's current
    -- party. Their seats bank YES — your caucus backs your bill.
    SELECT NULLIF(btrim(COALESCE(f.leader_first_name, '') || ' ' ||
                        COALESCE(f.leader_last_name, '')), ''),
           f.politician_party_id
      INTO v_sponsor_name, v_sponsor_party
      FROM factions f WHERE f.id = v_prop.author_faction_id;
    IF v_prop.holiday_params IS NOT NULL
       AND (v_prop.holiday_params->>'proposer_party_id') IS NOT NULL THEN
        v_sponsor_party := (v_prop.holiday_params->>'proposer_party_id')::uuid;
    END IF;

    FOR v_party IN
        SELECT f.id, f.archetype, COALESCE(f.seats, 0) AS seats
          FROM factions f
         WHERE f.faction_type = 'movement_party'
           AND f.nation_id    = v_prop.nation_id
           AND f.abandoned_at IS NULL
           AND COALESCE(f.seats, 0) > 0
    LOOP
        IF v_party.id = v_sponsor_party THEN
            v_stance := 'yes';
        ELSIF v_party.archetype IS NOT NULL AND v_party.archetype = ANY (
            SELECT jsonb_array_elements_text(COALESCE(v_prop.support_archetypes, '[]'::jsonb))) THEN
            v_stance := 'yes';
        ELSIF v_party.archetype IS NOT NULL AND v_party.archetype = ANY (
            SELECT jsonb_array_elements_text(COALESCE(v_prop.oppose_archetypes, '[]'::jsonb))) THEN
            v_stance := 'no';
        ELSE
            -- Neutral bloc rolls 1D2 — the same rule committee
            -- motions use for unaligned NPC seats.
            v_stance := CASE WHEN random() < 0.5 THEN 'yes' ELSE 'no' END;
        END IF;
        v_votes   := v_votes || jsonb_build_object(
            'party_id', v_party.id, 'stance', v_stance, 'seats', v_party.seats);
        v_chamber := v_chamber + v_party.seats;
        IF v_stance = 'yes' THEN
            v_yes := v_yes + v_party.seats;
        ELSE
            v_no := v_no + v_party.seats;
        END IF;
    END LOOP;

    INSERT INTO committee_floor_votes (
        nation_id, proposal_id, bill_name, category, sponsor_name,
        party_votes, yes_seats, no_seats, chamber_size,
        started_at_tick, resolve_at_tick
    ) VALUES (
        v_prop.nation_id, v_prop.id, v_prop.section, v_prop.category,
        COALESCE(v_sponsor_name, 'a member of the chamber'),
        v_votes, v_yes, v_no, v_chamber,
        p_tick, p_tick + 3
    );

    RETURN 'on_floor';
END $$;

REVOKE EXECUTE ON FUNCTION public._committee_resolve_floor(uuid, int) FROM PUBLIC;

-- ── 3. The sweep ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.resolve_due_committee_floor_votes()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick     int;
    v_vote     committee_floor_votes%ROWTYPE;
    v_prop     committee_proposals%ROWTYPE;
    v_passed   boolean;
    v_resolved int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', 0, 'reason', 'no_shard');
    END IF;

    FOR v_vote IN
        SELECT * FROM committee_floor_votes
         WHERE status = 'active' AND resolve_at_tick <= v_tick
         ORDER BY resolve_at_tick ASC
         FOR UPDATE SKIP LOCKED
    LOOP
        v_passed := v_vote.yes_seats > v_vote.no_seats;

        UPDATE committee_floor_votes
           SET status        = CASE WHEN v_passed THEN 'passed' ELSE 'failed' END,
               resolved_tick = v_tick
         WHERE id = v_vote.id;

        SELECT * INTO v_prop FROM committee_proposals WHERE id = v_vote.proposal_id;
        UPDATE committee_proposals
           SET status                 = CASE WHEN v_passed THEN 'enacted' ELSE 'failed' END,
               floor_yes_seats        = v_vote.yes_seats,
               floor_no_seats         = v_vote.no_seats,
               floor_resolved_at_tick = v_tick
         WHERE id = v_vote.proposal_id;

        -- Tax Holiday Act (20270873): an enacted holiday proposal
        -- mints the holiday, starting at the year of enactment. One
        -- active holiday per nation.
        IF v_passed AND v_prop.holiday_params IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1 FROM corporate_tax_holidays h
                 WHERE h.nation_id = v_prop.nation_id
                   AND (2000 + v_tick / 12) < h.start_year + h.years) THEN
                INSERT INTO corporate_tax_holidays (
                    nation_id, source_proposal_id, pct, years, sectors, start_year, created_at_tick
                ) VALUES (
                    v_prop.nation_id, v_prop.id,
                    (v_prop.holiday_params->>'pct')::int,
                    (v_prop.holiday_params->>'years')::int,
                    CASE WHEN v_prop.holiday_params->'sectors' = 'null'::jsonb THEN NULL
                         ELSE ARRAY(SELECT jsonb_array_elements_text(v_prop.holiday_params->'sectors')) END,
                    2000 + v_tick / 12, v_tick
                );
            END IF;
        END IF;

        -- Terminal record — Recent Results on the Laws page shows
        -- the outcome either way. No more silent deaths.
        INSERT INTO bills (nation_id, proposed_by, proposed_tick, bill_name, bill_type,
                           status, voting_ends_tick, passed_tick, votes_for, votes_against, preamble)
        VALUES (v_vote.nation_id, v_prop.author_faction_id, v_vote.started_at_tick,
                format('%s (%s Code)', v_vote.bill_name, initcap(COALESCE(v_vote.category, 'statute'))),
                'committee_floor',
                CASE WHEN v_passed THEN 'passed' ELSE 'failed' END,
                v_vote.resolve_at_tick, v_tick, v_vote.yes_seats, v_vote.no_seats,
                CASE WHEN v_passed
                     THEN format('The chamber enacts %s, sponsored by %s, %s seats to %s. It enters the %s Code.',
                                 v_vote.bill_name, v_vote.sponsor_name,
                                 v_vote.yes_seats, v_vote.no_seats,
                                 initcap(COALESCE(v_vote.category, 'statute')))
                     ELSE format('The chamber rejects %s, sponsored by %s, %s seats to %s.',
                                 v_vote.bill_name, v_vote.sponsor_name,
                                 v_vote.no_seats, v_vote.yes_seats)
                END);

        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'resolved', v_resolved, 'tick', v_tick);
END $$;

REVOKE EXECUTE ON FUNCTION public.resolve_due_committee_floor_votes() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.resolve_due_committee_floor_votes() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
