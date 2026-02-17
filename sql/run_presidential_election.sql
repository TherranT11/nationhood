-- ============================================================
-- run_presidential_election(p_nation_id UUID)
--
-- Candidate-based presidential election simulation.
--
-- 1. Loads selected presidential candidates + parent faction ideology
-- 2. Builds "virtual party" objects per candidate (faction profile + candidate bonus)
-- 3. For each bloc, loads per-bloc approval from faction_bloc_approval
-- 4. Runs same voter-bloc 4-step cascade as parliamentary elections
-- 5. Tallies popular votes per candidate (no seat allocation)
-- 6. Writes results to elections table
-- ============================================================

CREATE OR REPLACE FUNCTION run_presidential_election(
    p_nation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_nation       RECORD;
    v_candidates   JSONB;
    v_tally        JSONB := '{}'::JSONB;
    v_bloc         RECORD;
    v_cand         RECORD;
    v_tags         TEXT[];
    v_step         INT;
    v_abstentions  BIGINT;
    v_total_abstentions BIGINT := 0;
    v_total_votes  BIGINT := 0;
    v_results      JSONB;
    v_election_id  UUID;
    v_candidate_rows JSONB := '[]'::JSONB;
    v_max_votes    BIGINT := -1;
    v_max_approval NUMERIC := -1;
    v_winner_id    TEXT;
    v_bloc_approvals JSONB;
BEGIN
    -- ---- Load nation ----
    SELECT id, name, eligible_voters
    INTO v_nation
    FROM nations
    WHERE id = p_nation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Nation not found: %', p_nation_id;
    END IF;

    -- ---- Build candidate "virtual party" objects ----
    -- Each candidate inherits their faction's ideology profile + a +15 bonus
    -- on their personal ideology axis. This lets us reuse the existing
    -- _election_process_bloc / _election_distribute_votes helpers unchanged.
    -- Note: approval_rating and ideology_modifiers are no longer loaded here;
    -- per-bloc approval is fetched from faction_bloc_approval in the bloc loop.
    SELECT COALESCE(jsonb_agg(row_to_json(t)::JSONB), '[]'::JSONB)
    INTO v_candidates
    FROM (
        SELECT
            pc.id::TEXT AS id,
            pc.first_name || ' ' || pc.last_name AS candidate_name,
            pc.faction_id,
            f.faction_name,
            pc.ideology,
            pc.trait_key,
            -- Inherit party axes with candidate ideology bonus (+15 on personal axis)
            -- For globalism_nationalism, negate ideology_direction (JS/SQL convention mismatch)
            LEAST(100, GREATEST(-100,
                COALESCE(fi.liberty_equality, 0) +
                CASE WHEN pc.ideology_axis = 'liberty_equality'
                     THEN 15 * pc.ideology_direction ELSE 0 END
            )) AS liberty_equality,
            LEAST(100, GREATEST(-100,
                COALESCE(fi.tradition_progress, 0) +
                CASE WHEN pc.ideology_axis = 'tradition_progress'
                     THEN 15 * pc.ideology_direction ELSE 0 END
            )) AS tradition_progress,
            LEAST(100, GREATEST(-100,
                COALESCE(fi.security_freedom, 0) +
                CASE WHEN pc.ideology_axis = 'security_freedom'
                     THEN 15 * pc.ideology_direction ELSE 0 END
            )) AS security_freedom,
            LEAST(100, GREATEST(-100,
                COALESCE(fi.globalism_nationalism, 0) +
                CASE WHEN pc.ideology_axis = 'globalism_nationalism'
                     THEN 15 * (pc.ideology_direction * -1) ELSE 0 END
            )) AS globalism_nationalism,
            LEAST(100, GREATEST(-100,
                COALESCE(fi.individualism_collectivism, 0) +
                CASE WHEN pc.ideology_axis = 'individualism_collectivism'
                     THEN 15 * pc.ideology_direction ELSE 0 END
            )) AS individualism_collectivism
        FROM pm_candidates pc
        JOIN factions f ON f.id = pc.faction_id
        LEFT JOIN faction_ideology fi ON fi.faction_id = pc.faction_id
        WHERE pc.nation_id = p_nation_id
          AND pc.candidate_type = 'presidential'
          AND pc.selected = true
    ) t;

    IF jsonb_array_length(v_candidates) = 0 THEN
        RAISE EXCEPTION 'No presidential candidates found for nation %', p_nation_id;
    END IF;

    -- ---- Initialise tally to 0 for each candidate ----
    FOR v_cand IN SELECT * FROM jsonb_array_elements(v_candidates)
    LOOP
        v_tally := v_tally || jsonb_build_object(v_cand.value->>'id', 0);
    END LOOP;

    -- ---- Compute voter bloc scale factor ----
    DECLARE
        v_total_bloc_voters BIGINT;
        v_eligible          BIGINT := COALESCE(v_nation.eligible_voters, 0);
        v_bloc_scale        NUMERIC := 1;
    BEGIN
        IF v_eligible > 0 THEN
            SELECT COALESCE(SUM(voter_count), 0) INTO v_total_bloc_voters
            FROM voter_blocs WHERE nation_id = p_nation_id AND is_active = TRUE;
            IF v_total_bloc_voters > 0 THEN
                v_bloc_scale := v_eligible::NUMERIC / v_total_bloc_voters;
            END IF;
        END IF;

    -- ---- Process voter blocs (reusing existing cascade) ----
    FOR v_bloc IN
        SELECT id, bloc_name, ROUND(voter_count * v_bloc_scale)::INT AS voter_count,
               ideology_1, ideology_2, ideology_3, ideology_4, ideology_5,
               is_active
        FROM voter_blocs
        WHERE nation_id = p_nation_id AND is_active = TRUE
    LOOP
        IF COALESCE(v_bloc.voter_count, 0) <= 0 THEN
            CONTINUE;
        END IF;

        -- Collect non-null, non-Unaligned tags
        v_tags := ARRAY[]::TEXT[];
        IF v_bloc.ideology_1 IS NOT NULL AND v_bloc.ideology_1 != 'Unaligned' THEN
            v_tags := v_tags || UPPER(v_bloc.ideology_1);
        END IF;
        IF v_bloc.ideology_2 IS NOT NULL AND v_bloc.ideology_2 != 'Unaligned' THEN
            v_tags := v_tags || UPPER(v_bloc.ideology_2);
        END IF;
        IF v_bloc.ideology_3 IS NOT NULL AND v_bloc.ideology_3 != 'Unaligned' THEN
            v_tags := v_tags || UPPER(v_bloc.ideology_3);
        END IF;
        IF v_bloc.ideology_4 IS NOT NULL AND v_bloc.ideology_4 != 'Unaligned' THEN
            v_tags := v_tags || UPPER(v_bloc.ideology_4);
        END IF;
        IF v_bloc.ideology_5 IS NOT NULL AND v_bloc.ideology_5 != 'Unaligned' THEN
            v_tags := v_tags || UPPER(v_bloc.ideology_5);
        END IF;

        -- Build per-bloc approval map for candidates (keyed by candidate ID, looked up by faction_id)
        SELECT COALESCE(
            jsonb_object_agg(sub.candidate_id, sub.approval),
            '{}'::JSONB
        )
        INTO v_bloc_approvals
        FROM (
            SELECT
                (c.value->>'id') AS candidate_id,
                COALESCE(fba.approval, 40) AS approval
            FROM jsonb_array_elements(v_candidates) AS c(value)
            LEFT JOIN faction_bloc_approval fba
                ON fba.faction_id = (c.value->>'faction_id')::UUID
                AND fba.bloc_id = v_bloc.id
        ) sub;

        -- Run cascade + distribute (candidates used in place of parties)
        SELECT r.step, r.abstentions, r.updated_tally
        INTO v_step, v_abstentions, v_tally
        FROM _election_process_bloc(v_candidates, v_tags, v_bloc.voter_count, v_tally, v_bloc_approvals) r;

        v_total_abstentions := v_total_abstentions + COALESCE(v_abstentions, 0);
    END LOOP;
    END; -- close DECLARE block for v_bloc_scale

    -- ---- Calculate total votes ----
    FOR v_cand IN SELECT * FROM jsonb_each_text(v_tally)
    LOOP
        v_total_votes := v_total_votes + v_cand.value::BIGINT;
    END LOOP;

    -- ---- Determine winner (highest votes, tiebreak by avg faction_bloc_approval) ----
    FOR v_cand IN SELECT * FROM jsonb_array_elements(v_candidates)
    LOOP
        DECLARE
            cid TEXT := v_cand.value->>'id';
            cvotes BIGINT := COALESCE((v_tally->>cid)::BIGINT, 0);
            capproval NUMERIC := COALESCE(
                (SELECT AVG(fba.approval)
                 FROM faction_bloc_approval fba
                 WHERE fba.faction_id = (v_cand.value->>'faction_id')::UUID),
                40
            );
        BEGIN
            IF cvotes > v_max_votes OR (cvotes = v_max_votes AND capproval > v_max_approval) THEN
                v_max_votes := cvotes;
                v_max_approval := capproval;
                v_winner_id := cid;
            END IF;
        END;
    END LOOP;

    -- ---- Build result array ----
    FOR v_cand IN SELECT * FROM jsonb_array_elements(v_candidates)
    LOOP
        DECLARE
            cid TEXT := v_cand.value->>'id';
            cvotes BIGINT := COALESCE((v_tally->>cid)::BIGINT, 0);
            vpct NUMERIC := CASE WHEN v_total_votes > 0
                THEN ROUND((cvotes::NUMERIC / v_total_votes) * 100, 2)
                ELSE 0 END;
        BEGIN
            v_candidate_rows := v_candidate_rows || jsonb_build_object(
                'candidate_id', cid,
                'candidate_name', v_cand.value->>'candidate_name',
                'faction_id', v_cand.value->>'faction_id',
                'party_name', v_cand.value->>'faction_name',
                'ideology', v_cand.value->>'ideology',
                'trait_key', v_cand.value->>'trait_key',
                'votes', cvotes,
                'vote_percentage', vpct,
                'winner', (cid = v_winner_id)
            );
        END;
    END LOOP;

    v_results := jsonb_build_object(
        'presidential_candidates', v_candidate_rows,
        'total_votes_cast', v_total_votes,
        'total_abstentions', v_total_abstentions,
        'turnout_pct', CASE WHEN COALESCE(v_nation.eligible_voters, 0) > 0
            THEN ROUND((v_total_votes::NUMERIC / v_nation.eligible_voters) * 100, 2)
            ELSE 0 END
    );

    -- ---- Write election record ----
    INSERT INTO elections (nation_id, election_tick, election_type, status, results)
    VALUES (
        p_nation_id,
        COALESCE((SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), 0),
        'presidential',
        'completed',
        v_results
    )
    RETURNING id INTO v_election_id;

    RETURN v_results;
END;
$$;
