-- ============================================================
-- run_presidential_election(p_nation_id UUID, p_election_id UUID)
--
-- Three Pillars presidential election simulation.
--
-- Reads realized_vote_share from faction_electoral_standing for each
-- candidate's parent faction. Distributes votes proportionally,
-- determines winner by popular vote.
--
-- No voter_blocs dependency — the electorate engine handles all spatial
-- competition, turnout, and ideology alignment internally.
-- ============================================================

CREATE OR REPLACE FUNCTION run_presidential_election(
    p_nation_id UUID,
    p_election_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_nation        RECORD;
    v_eligible      BIGINT;
    v_tally         JSONB := '{}'::JSONB;
    v_total_votes   BIGINT := 0;
    v_total_abstentions BIGINT := 0;
    v_results       JSONB;
    v_candidate_rows JSONB := '[]'::JSONB;
    v_cand          RECORD;
    v_standing      RECORD;
    v_max_votes     BIGINT := -1;
    v_max_approval  NUMERIC := -1;
    v_winner_id     TEXT;
    v_election_id   UUID := p_election_id;
    v_current_tick  INT;
    -- Vote distribution
    v_faction_votes JSONB := '{}'::JSONB;  -- { faction_id: total_faction_votes }
    v_faction_cands JSONB := '{}'::JSONB;  -- { faction_id: candidate_count }
    v_fid           TEXT;
    v_fvotes        BIGINT;
    v_cand_count    INT;
    v_per_cand      BIGINT;
    v_assigned      BIGINT;
    v_total_realized NUMERIC := 0;
BEGIN
    -- ---- Load nation ----
    SELECT id, name, population, eligible_voters
    INTO v_nation
    FROM nations
    WHERE id = p_nation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Nation not found: %', p_nation_id;
    END IF;

    v_eligible := COALESCE(v_nation.eligible_voters, 0);

    IF v_election_id IS NULL THEN
        RAISE EXCEPTION 'Election id is required for presidential election snapshots';
    END IF;

    SELECT COALESCE(current_tick, 0) INTO v_current_tick
    FROM shard WHERE name = 'Alpha Shard';

    -- ---- Load candidates with faction vote shares ----
    -- Each candidate inherits their faction's realized_vote_share.
    -- Multiple candidates from same faction split votes evenly.
    FOR v_cand IN
        SELECT
            pc.id::TEXT AS candidate_id,
            pc.first_name || ' ' || pc.last_name AS candidate_name,
            pc.faction_id::TEXT AS faction_id,
            f.faction_name,
            pc.ideology,
            pc.trait_key,
            COALESCE(fes.realized_vote_share, 0) AS realized_vote_share,
            COALESCE(fes.party_approval, 0) AS party_approval
        FROM pm_candidates pc
        JOIN factions f ON f.id = pc.faction_id
        LEFT JOIN faction_electoral_standing fes
            ON fes.faction_id = pc.faction_id AND fes.nation_id = p_nation_id
        WHERE pc.nation_id = p_nation_id
          AND pc.candidate_type = 'presidential'
          AND pc.selected = true
          AND f.faction_type = 'party'
          AND f.abandoned_at IS NULL
          AND (
              f.last_seen_tick IS NULL
              OR v_current_tick - f.last_seen_tick < 12
          )
    LOOP
        -- Track faction vote totals and candidate counts for splitting
        v_fid := v_cand.faction_id;
        IF NOT v_faction_votes ? v_fid THEN
            v_fvotes := ROUND(v_eligible::NUMERIC * v_cand.realized_vote_share);
            v_faction_votes := v_faction_votes || jsonb_build_object(v_fid, v_fvotes);
            v_faction_cands := v_faction_cands || jsonb_build_object(v_fid, 0);
            v_total_realized := v_total_realized + v_cand.realized_vote_share;
        END IF;
        v_faction_cands := jsonb_set(v_faction_cands, ARRAY[v_fid],
            to_jsonb(COALESCE((v_faction_cands->>v_fid)::INT, 0) + 1));

        -- Init tally
        v_tally := v_tally || jsonb_build_object(v_cand.candidate_id, 0);

        -- Accumulate candidate info for result building
        v_candidate_rows := v_candidate_rows || jsonb_build_object(
            'candidate_id', v_cand.candidate_id,
            'candidate_name', v_cand.candidate_name,
            'faction_id', v_cand.faction_id,
            'party_name', v_cand.faction_name,
            'ideology', v_cand.ideology,
            'trait_key', v_cand.trait_key,
            'party_approval', v_cand.party_approval
        );
    END LOOP;

    IF jsonb_array_length(v_candidate_rows) = 0 THEN
        RAISE EXCEPTION 'No presidential candidates found for nation %', p_nation_id;
    END IF;

    -- ---- Distribute faction votes among candidates ----
    -- Split each faction's votes evenly among its candidates, remainder to first
    FOR v_cand IN SELECT * FROM jsonb_array_elements(v_candidate_rows)
    LOOP
        v_fid := v_cand.value->>'faction_id';
        v_fvotes := COALESCE((v_faction_votes->>v_fid)::BIGINT, 0);
        v_cand_count := COALESCE((v_faction_cands->>v_fid)::INT, 1);
        v_per_cand := v_fvotes / v_cand_count;

        v_tally := jsonb_set(v_tally,
            ARRAY[v_cand.value->>'candidate_id'],
            to_jsonb(v_per_cand));
    END LOOP;

    -- Assign remainders to first candidate per faction
    DECLARE
        v_seen_factions JSONB := '{}'::JSONB;
    BEGIN
        FOR v_cand IN SELECT * FROM jsonb_array_elements(v_candidate_rows)
        LOOP
            v_fid := v_cand.value->>'faction_id';
            IF NOT v_seen_factions ? v_fid THEN
                v_seen_factions := v_seen_factions || jsonb_build_object(v_fid, true);
                v_fvotes := COALESCE((v_faction_votes->>v_fid)::BIGINT, 0);
                v_cand_count := COALESCE((v_faction_cands->>v_fid)::INT, 1);
                v_per_cand := v_fvotes / v_cand_count;
                v_assigned := v_per_cand * v_cand_count;
                IF v_assigned < v_fvotes THEN
                    v_tally := jsonb_set(v_tally,
                        ARRAY[v_cand.value->>'candidate_id'],
                        to_jsonb(COALESCE((v_tally->>(v_cand.value->>'candidate_id'))::BIGINT, 0) + (v_fvotes - v_assigned)));
                END IF;
            END IF;
        END LOOP;
    END;

    -- ---- Calculate total votes ----
    FOR v_cand IN SELECT key, value::BIGINT AS votes FROM jsonb_each_text(v_tally)
    LOOP
        v_total_votes := v_total_votes + v_cand.votes;
    END LOOP;

    v_total_abstentions := GREATEST(0, v_eligible - v_total_votes);

    -- ---- Determine winner (highest votes, tiebreak by party_approval) ----
    FOR v_cand IN SELECT * FROM jsonb_array_elements(v_candidate_rows)
    LOOP
        DECLARE
            cid TEXT := v_cand.value->>'candidate_id';
            cvotes BIGINT := COALESCE((v_tally->>cid)::BIGINT, 0);
            capproval NUMERIC := COALESCE((v_cand.value->>'party_approval')::NUMERIC, 0);
        BEGIN
            IF cvotes > v_max_votes OR (cvotes = v_max_votes AND capproval > v_max_approval) THEN
                v_max_votes := cvotes;
                v_max_approval := capproval;
                v_winner_id := cid;
            END IF;
        END;
    END LOOP;

    -- ---- Build final result array ----
    DECLARE
        v_final_candidates JSONB := '[]'::JSONB;
    BEGIN
        FOR v_cand IN SELECT * FROM jsonb_array_elements(v_candidate_rows)
        LOOP
            DECLARE
                cid TEXT := v_cand.value->>'candidate_id';
                cvotes BIGINT := COALESCE((v_tally->>cid)::BIGINT, 0);
                vpct NUMERIC := CASE WHEN v_total_votes > 0
                    THEN ROUND((cvotes::NUMERIC / v_total_votes) * 100, 2)
                    ELSE 0 END;
            BEGIN
                v_final_candidates := v_final_candidates || jsonb_build_object(
                    'candidate_id', cid,
                    'candidate_name', v_cand.value->>'candidate_name',
                    'faction_id', v_cand.value->>'faction_id',
                    'party_name', v_cand.value->>'party_name',
                    'ideology', v_cand.value->>'ideology',
                    'trait_key', v_cand.value->>'trait_key',
                    'votes', cvotes,
                    'vote_percentage', vpct,
                    'winner', (cid = v_winner_id)
                );
            END;
        END LOOP;

        -- Mark endorsements as consumed
        UPDATE presidential_endorsements
        SET status = 'consumed',
            consumed_at = COALESCE(consumed_at, now())
        WHERE election_id = v_election_id
          AND status = 'snapshotted';

        v_results := jsonb_build_object(
            'presidential_candidates', v_final_candidates,
            'bloc_details', '[]'::JSONB,
            'total_votes_cast', v_total_votes,
            'total_abstentions', v_total_abstentions,
            'turnout_pct', CASE WHEN v_eligible > 0
                THEN ROUND((v_total_votes::NUMERIC / v_eligible) * 100, 2)
                ELSE 0 END
        );

        RETURN v_results;
    END;
END;
$$;
