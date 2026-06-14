-- ════════════════════════════════════════════════════════════════════
-- 20270922 — Party Caucus & Allies (Phase 2): the MP floor franchise
--
-- Nation-page bills are committee_floor_votes, whose party division is
-- pre-locked by archetype at propose time. This lets full/senior MPs
-- actually vote, and their votes drive the party line:
--
--   • A party's human MP votes REPLACE its locked stance (majority wins;
--     a tie keeps the locked stance). Parties with no human MP voters
--     keep the archetype stance.
--   • A Senior MP who votes against the (final) party line peels
--     (1 + their allies) seats to the other side — capped at the party's
--     seats — and costs the party 0.5 popularity each.
--   • +0.2 Influence to every full/senior MP who voted the line.
--
-- _floor_vote_tally(vote, apply) is the single tally: cast_floor_vote
-- calls it (apply=false) to keep the displayed division live as MPs vote;
-- the resolver calls it once (apply=true) to bank the influence/popularity
-- and the final totals before deciding pass/fail.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.floor_vote_votes (
    floor_vote_id uuid NOT NULL REFERENCES public.committee_floor_votes(id) ON DELETE CASCADE,
    politician_id uuid NOT NULL REFERENCES public.factions(id)             ON DELETE CASCADE,
    party_id      uuid          REFERENCES public.factions(id)             ON DELETE SET NULL,
    position      text NOT NULL CHECK (position IN ('yes', 'no')),
    voted_at_tick int  NOT NULL,
    PRIMARY KEY (floor_vote_id, politician_id)
);
ALTER TABLE public.floor_vote_votes ENABLE ROW LEVEL SECURITY;
-- Votes are public political acts (the card shows them); writes via the RPC.
CREATE POLICY floor_vote_votes_read ON public.floor_vote_votes FOR SELECT USING (true);

-- ── _floor_vote_tally — one source for the division + effects ──────
CREATE OR REPLACE FUNCTION public._floor_vote_tally(p_vote_id uuid, p_apply_effects boolean)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_vote      committee_floor_votes%ROWTYPE;
    v_pv        jsonb;
    v_party_id  uuid;
    v_locked    text;
    v_seats     int;
    v_my        int;
    v_mn        int;
    v_pos       int;
    v_defect    int;
    v_defectors int;
    v_yes       int := 0;
    v_no        int := 0;
BEGIN
    SELECT * INTO v_vote FROM committee_floor_votes WHERE id = p_vote_id;
    IF v_vote.id IS NULL THEN
        RETURN jsonb_build_object('yes_seats', 0, 'no_seats', 0);
    END IF;

    FOR v_pv IN SELECT * FROM jsonb_array_elements(COALESCE(v_vote.party_votes, '[]'::jsonb)) LOOP
        v_party_id := (v_pv->>'party_id')::uuid;
        v_locked   := v_pv->>'stance';
        v_seats    := COALESCE((v_pv->>'seats')::int, 0);

        -- Human MP votes for this party on this floor vote.
        SELECT COUNT(*) FILTER (WHERE bv.position = 'yes'),
               COUNT(*) FILTER (WHERE bv.position = 'no')
          INTO v_my, v_mn
          FROM floor_vote_votes bv
          JOIN factions f ON f.id = bv.politician_id
         WHERE bv.floor_vote_id = p_vote_id
           AND f.politician_party_id = v_party_id
           AND f.politician_office IN ('full_mp', 'senior_mp');

        -- Human MPs replace the party line (tie keeps the locked stance).
        IF COALESCE(v_my, 0) + COALESCE(v_mn, 0) > 0 THEN
            v_pos := CASE WHEN v_my > v_mn THEN 1
                          WHEN v_mn > v_my THEN -1
                          ELSE CASE WHEN v_locked = 'yes' THEN 1 WHEN v_locked = 'no' THEN -1 ELSE 0 END END;
        ELSE
            v_pos := CASE WHEN v_locked = 'yes' THEN 1 WHEN v_locked = 'no' THEN -1 ELSE 0 END;
        END IF;

        -- Senior MP defectors peel (1 + allies) seats to the other side.
        v_defect    := 0;
        v_defectors := 0;
        IF v_pos <> 0 THEN
            SELECT COALESCE(SUM(1 + GREATEST(0, COALESCE(f.politician_allies, 0))), 0)::int,
                   COUNT(*)::int
              INTO v_defect, v_defectors
              FROM floor_vote_votes bv
              JOIN factions f ON f.id = bv.politician_id
             WHERE bv.floor_vote_id = p_vote_id
               AND f.politician_party_id = v_party_id
               AND f.politician_office = 'senior_mp'
               AND bv.position = CASE WHEN v_pos > 0 THEN 'no' ELSE 'yes' END;
            v_defect := LEAST(v_defect, v_seats);
        END IF;

        IF v_pos > 0 THEN
            v_yes := v_yes + GREATEST(0, v_seats - v_defect);
            v_no  := v_no  + v_defect;
        ELSIF v_pos < 0 THEN
            v_no  := v_no  + GREATEST(0, v_seats - v_defect);
            v_yes := v_yes + v_defect;
        END IF;

        IF p_apply_effects THEN
            -- +0.2 Influence to each full/senior MP who voted the line.
            IF v_pos <> 0 THEN
                UPDATE factions f
                   SET politician_influence = COALESCE(f.politician_influence, 0) + 0.2
                 WHERE f.politician_party_id = v_party_id
                   AND f.politician_office IN ('full_mp', 'senior_mp')
                   AND EXISTS (SELECT 1 FROM floor_vote_votes bv
                                WHERE bv.floor_vote_id = p_vote_id AND bv.politician_id = f.id
                                  AND bv.position = CASE WHEN v_pos > 0 THEN 'yes' ELSE 'no' END);
            END IF;
            -- Each Senior MP defection costs the party 0.5 popularity.
            IF v_defectors > 0 THEN
                UPDATE factions
                   SET popularity_pct = GREATEST(0, LEAST(100, COALESCE(popularity_pct, 0) - v_defectors * 0.5))
                 WHERE id = v_party_id;
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('yes_seats', v_yes, 'no_seats', v_no);
END $$;
REVOKE EXECUTE ON FUNCTION public._floor_vote_tally(uuid, boolean) FROM PUBLIC;

-- ── cast_floor_vote — an MP casts on a nation-page bill ────────────
CREATE OR REPLACE FUNCTION public.cast_floor_vote(p_floor_vote_id uuid, p_position text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_pol  factions%ROWTYPE;
    v_vote committee_floor_votes%ROWTYPE;
    v_tick int;
    v_t    jsonb;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_position NOT IN ('yes', 'no') THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_position'); END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid) AND faction_type = 'politician' AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_politician'); END IF;
    IF COALESCE(v_pol.politician_office, '') NOT IN ('full_mp', 'senior_mp') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;

    SELECT * INTO v_vote FROM committee_floor_votes WHERE id = p_floor_vote_id;
    IF v_vote.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'vote_not_found'); END IF;
    IF v_vote.status <> 'active' THEN RETURN jsonb_build_object('success', false, 'reason', 'vote_closed'); END IF;
    IF v_vote.nation_id <> v_pol.nation_id THEN RETURN jsonb_build_object('success', false, 'reason', 'wrong_nation'); END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO floor_vote_votes (floor_vote_id, politician_id, party_id, position, voted_at_tick)
    VALUES (p_floor_vote_id, v_pol.id, v_pol.politician_party_id, p_position, v_tick)
    ON CONFLICT (floor_vote_id, politician_id) DO UPDATE
        SET position = EXCLUDED.position, party_id = EXCLUDED.party_id, voted_at_tick = EXCLUDED.voted_at_tick;

    -- Keep the displayed division live; effects wait for resolution.
    v_t := _floor_vote_tally(p_floor_vote_id, false);
    UPDATE committee_floor_votes
       SET yes_seats = (v_t->>'yes_seats')::int, no_seats = (v_t->>'no_seats')::int
     WHERE id = p_floor_vote_id;

    RETURN jsonb_build_object('success', true, 'position', p_position,
        'yes_seats', (v_t->>'yes_seats')::int, 'no_seats', (v_t->>'no_seats')::int);
END $$;
REVOKE EXECUTE ON FUNCTION public.cast_floor_vote(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cast_floor_vote(uuid, text) TO authenticated;

-- ── resolve_due_committee_floor_votes — re-emit (20270892) with the
-- MP tally banked once at the top of the loop, everything else verbatim ─
CREATE OR REPLACE FUNCTION public.resolve_due_committee_floor_votes()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick     int;
    v_vote     committee_floor_votes%ROWTYPE;
    v_prop     committee_proposals%ROWTYPE;
    v_pprop    committee_policy_proposals%ROWTYPE;
    v_passed   boolean;
    v_resolved int := 0;
    v_t        jsonb;
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
        -- MP franchise (20270922): bank the final division from the MP
        -- votes + Senior-MP seat split, applying influence/popularity once.
        v_t := _floor_vote_tally(v_vote.id, true);
        v_vote.yes_seats := (v_t->>'yes_seats')::int;
        v_vote.no_seats  := (v_t->>'no_seats')::int;

        v_passed := v_vote.yes_seats > v_vote.no_seats;

        UPDATE committee_floor_votes
           SET status        = CASE WHEN v_passed THEN 'passed' ELSE 'failed' END,
               yes_seats     = v_vote.yes_seats,
               no_seats      = v_vote.no_seats,
               resolved_tick = v_tick
         WHERE id = v_vote.id;

        IF v_vote.policy_proposal_id IS NOT NULL THEN
            -- ── Policy change ─────────────────────────────────────
            SELECT * INTO v_pprop FROM committee_policy_proposals
             WHERE id = v_vote.policy_proposal_id;
            UPDATE committee_policy_proposals
               SET status = CASE WHEN v_passed THEN 'enacted' ELSE 'failed' END
             WHERE id = v_vote.policy_proposal_id;

            IF v_passed AND v_pprop.id IS NOT NULL THEN
                IF EXISTS (
                    SELECT 1 FROM active_laws
                     WHERE nation_id = v_pprop.nation_id
                       AND policy_id = v_pprop.policy_id
                       AND COALESCE(is_reversal, false) = false
                ) THEN
                    UPDATE active_laws
                       SET selected_option_id = v_pprop.proposed_option_id,
                           passed_tick        = v_tick
                     WHERE nation_id = v_pprop.nation_id
                       AND policy_id = v_pprop.policy_id
                       AND COALESCE(is_reversal, false) = false;
                ELSE
                    INSERT INTO active_laws (nation_id, policy_id, selected_option_id, passed_tick, is_reversal)
                    VALUES (v_pprop.nation_id, v_pprop.policy_id, v_pprop.proposed_option_id, v_tick, false);
                END IF;
            END IF;

            INSERT INTO bills (nation_id, proposed_by, proposed_tick, bill_name, bill_type,
                               status, voting_ends_tick, passed_tick, votes_for, votes_against, preamble)
            VALUES (v_vote.nation_id, v_pprop.author_faction_id, v_vote.started_at_tick,
                    v_vote.bill_name, 'committee_floor',
                    CASE WHEN v_passed THEN 'passed' ELSE 'failed' END,
                    v_vote.resolve_at_tick, v_tick, v_vote.yes_seats, v_vote.no_seats,
                    CASE WHEN v_passed
                         THEN format('The chamber adopts %s, sponsored by %s, %s seats to %s. The law takes effect immediately.',
                                     v_vote.bill_name, v_vote.sponsor_name,
                                     v_vote.yes_seats, v_vote.no_seats)
                         ELSE format('The chamber rejects %s, sponsored by %s, %s seats to %s.',
                                     v_vote.bill_name, v_vote.sponsor_name,
                                     v_vote.no_seats, v_vote.yes_seats)
                    END);
        ELSE
            -- ── Statute / amendment (unchanged from 20270883) ─────
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
        END IF;

        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'resolved', v_resolved, 'tick', v_tick);
END $$;

REVOKE EXECUTE ON FUNCTION public.resolve_due_committee_floor_votes() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.resolve_due_committee_floor_votes() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
