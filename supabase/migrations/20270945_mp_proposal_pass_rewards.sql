-- ════════════════════════════════════════════════════════════════════
-- 20270945 — Proposer reward: pass a statute or policy → +1 Exp, +1 Influence
--
-- When a floor vote resolves as PASSED, the MP who authored it earns
-- +1 Experience (politician_skill) and +1 Influence (politician_influence).
-- Applies to both kinds the resolver already handles:
--   • policy / law change  → committee_policy_proposals.author_faction_id
--   • statute / amendment  → committee_proposals.author_faction_id
--
-- Gated on the author still holding an MP office at resolution — junior
-- (member_of_parliament), full (full_mp), or senior_mp — matching the
-- "as an MP" framing. A proposer who has since moved to an appointed office
-- (minister / PM) does not collect; only MPs can propose in the first place.
--
-- Fires exactly once per vote: the resolver flips status active→passed/failed
-- under FOR UPDATE SKIP LOCKED, so a resolved row is never revisited. No cap
-- on either stat (consistent with the existing +0.2 influence / +1 skill
-- awards), so a plain COALESCE(col,0)+1 is correct.
--
-- Re-emits resolve_due_committee_floor_votes verbatim from 20270922 (the MP
-- franchise version) with the single reward block added at the end of the
-- per-vote loop body.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    v_author   uuid;
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
        v_author := NULL;

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
            v_author := v_pprop.author_faction_id;
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
            v_author := v_prop.author_faction_id;
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

        -- Proposer reward (20270945): a passed bill earns its MP author
        -- +1 Experience and +1 Influence. Gated on a current MP office so
        -- only sitting MPs collect.
        IF v_passed AND v_author IS NOT NULL THEN
            UPDATE factions
               SET politician_skill     = COALESCE(politician_skill, 0)     + 1,
                   politician_influence = COALESCE(politician_influence, 0) + 1
             WHERE id = v_author
               AND faction_type = 'politician'
               AND politician_office IN ('member_of_parliament', 'full_mp', 'senior_mp');
        END IF;

        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'resolved', v_resolved, 'tick', v_tick);
END $$;

REVOKE EXECUTE ON FUNCTION public.resolve_due_committee_floor_votes() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.resolve_due_committee_floor_votes() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
