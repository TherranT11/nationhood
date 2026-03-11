-- Snapshot faction->bloc presidential endorsements per election,
-- so transfer math is immutable for the election being resolved.

CREATE TABLE IF NOT EXISTS presidential_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    bloc_id UUID NOT NULL REFERENCES voter_blocs(id) ON DELETE CASCADE,
    preference_score NUMERIC NOT NULL,
    compatibility_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'snapshotted' CHECK (status IN ('snapshotted', 'consumed', 'archived', 'superseded')),
    snapshotted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    consumed_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (election_id, faction_id, bloc_id)
);

CREATE INDEX IF NOT EXISTS idx_pres_endorsements_election ON presidential_endorsements(election_id);
CREATE INDEX IF NOT EXISTS idx_pres_endorsements_nation_status ON presidential_endorsements(nation_id, status);

CREATE OR REPLACE FUNCTION snapshot_presidential_endorsements(
    p_nation_id UUID,
    p_election_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO presidential_endorsements (
        election_id,
        nation_id,
        faction_id,
        bloc_id,
        preference_score,
        compatibility_snapshot,
        status
    )
    SELECT
        p_election_id,
        p_nation_id,
        fba.faction_id,
        fba.bloc_id,
        COALESCE(fba.preference_score, 40),
        jsonb_build_object(
            'ideology_alignment', fba.ideology_alignment,
            'momentum', fba.momentum,
            'vote_share', fba.vote_share,
            'last_platform', fba.last_platform,
            'captured_at', now()
        ),
        'snapshotted'
    FROM faction_bloc_approval fba
    JOIN factions f
      ON f.id = fba.faction_id
     AND f.nation_id = p_nation_id
     AND f.faction_type = 'party'
     AND f.abandoned_at IS NULL
    JOIN voter_blocs vb
      ON vb.id = fba.bloc_id
     AND vb.nation_id = p_nation_id
     AND vb.is_active = true
    WHERE NOT EXISTS (
        SELECT 1
        FROM presidential_endorsements pe
        WHERE pe.election_id = p_election_id
    )
    ON CONFLICT (election_id, faction_id, bloc_id) DO NOTHING;
END;
$$;

-- Keep SQL source-of-truth in sync with runtime function.
CREATE OR REPLACE FUNCTION run_presidential_election(
    p_nation_id UUID,
    p_election_id UUID
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
    v_candidate_rows JSONB := '[]'::JSONB;
    v_bloc_details JSONB := '[]'::JSONB;
    v_bloc_party_votes JSONB;
    v_tally_before JSONB;
    v_prev_votes   BIGINT;
    v_new_votes    BIGINT;
    v_max_votes    BIGINT := -1;
    v_max_approval NUMERIC := -1;
    v_winner_id    TEXT;
    v_bloc_approvals JSONB;
    v_election_id UUID := p_election_id;
BEGIN
    SELECT id, name, population, eligible_voters
    INTO v_nation
    FROM nations
    WHERE id = p_nation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Nation not found: %', p_nation_id;
    END IF;

    IF v_election_id IS NULL THEN
        RAISE EXCEPTION 'Election id is required for presidential election snapshots';
    END IF;

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
          AND f.faction_type = 'party'
          AND f.abandoned_at IS NULL
    ) t;

    IF jsonb_array_length(v_candidates) = 0 THEN
        RAISE EXCEPTION 'No presidential candidates found for nation %', p_nation_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM presidential_endorsements pe WHERE pe.election_id = v_election_id
    ) THEN
        RAISE EXCEPTION 'No presidential endorsement snapshot found for election %', v_election_id;
    END IF;

    FOR v_cand IN SELECT * FROM jsonb_array_elements(v_candidates)
    LOOP
        v_tally := v_tally || jsonb_build_object(v_cand.value->>'id', 0);
    END LOOP;

    DECLARE
        v_saturation     JSONB := '{}'::JSONB;
        v_avg_saturation NUMERIC := 1;
        v_sat_count      INT;
        v_sat_total      NUMERIC := 0;
        v_sat_active     INT := 0;
        v_all_tags       TEXT[] := ARRAY['LIBERTY','EQUALITY','TRADITION','PROGRESS','SECURITY',
                                         'FREEDOM','GLOBALISM','NATIONALISM','INDIVIDUALISM','COLLECTIVISM'];
        v_stag           TEXT;
    BEGIN
        FOREACH v_stag IN ARRAY v_all_tags LOOP
            v_sat_count := 0;
            FOR v_cand IN SELECT * FROM jsonb_array_elements(v_candidates) LOOP
                IF _election_get_alignment(v_cand.value, v_stag) > 0 THEN
                    v_sat_count := v_sat_count + 1;
                END IF;
            END LOOP;
            v_saturation := v_saturation || jsonb_build_object(v_stag, v_sat_count);
            IF v_sat_count > 0 THEN
                v_sat_total := v_sat_total + v_sat_count;
                v_sat_active := v_sat_active + 1;
            END IF;
        END LOOP;
        IF v_sat_active > 0 THEN v_avg_saturation := v_sat_total / v_sat_active; END IF;

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

        SELECT COALESCE(
            jsonb_object_agg(sub.candidate_id, sub.approval),
            '{}'::JSONB
        )
        INTO v_bloc_approvals
        FROM (
            SELECT
                (c.value->>'id') AS candidate_id,
                COALESCE(pe.preference_score, 40) AS approval
            FROM jsonb_array_elements(v_candidates) AS c(value)
            LEFT JOIN presidential_endorsements pe
                ON pe.faction_id = (c.value->>'faction_id')::UUID
                AND pe.bloc_id = v_bloc.id
                AND pe.election_id = v_election_id
                AND pe.status IN ('snapshotted', 'consumed')
        ) sub;

        v_tally_before := v_tally;
        SELECT r.step, r.abstentions, r.updated_tally
        INTO v_step, v_abstentions, v_tally
        FROM _election_process_bloc(v_candidates, v_tags, v_bloc.voter_count, v_tally, v_bloc_approvals, v_saturation, v_avg_saturation) r;

        v_bloc_party_votes := '[]'::JSONB;
        FOR v_cand IN SELECT * FROM jsonb_array_elements(v_candidates)
        LOOP
            v_prev_votes := COALESCE((v_tally_before->>(v_cand.value->>'id'))::BIGINT, 0);
            v_new_votes := COALESCE((v_tally->>(v_cand.value->>'id'))::BIGINT, 0);
            v_bloc_party_votes := v_bloc_party_votes || jsonb_build_object(
                'party_id', v_cand.value->>'faction_id',
                'party_name', v_cand.value->>'faction_name',
                'votes', GREATEST(v_new_votes - v_prev_votes, 0)
            );
        END LOOP;

        v_bloc_details := v_bloc_details || jsonb_build_object(
            'bloc_id', v_bloc.id,
            'bloc_name', v_bloc.bloc_name,
            'voter_count', v_bloc.voter_count,
            'tags', to_jsonb(v_tags),
            'abstentions', COALESCE(v_abstentions, 0),
            'party_votes', v_bloc_party_votes
        );

        v_total_abstentions := v_total_abstentions + COALESCE(v_abstentions, 0);
    END LOOP;
    END;
    END;

    FOR v_cand IN SELECT * FROM jsonb_each_text(v_tally)
    LOOP
        v_total_votes := v_total_votes + v_cand.value::BIGINT;
    END LOOP;

    FOR v_cand IN SELECT * FROM jsonb_array_elements(v_candidates)
    LOOP
        DECLARE
            cid TEXT := v_cand.value->>'id';
            cvotes BIGINT := COALESCE((v_tally->>cid)::BIGINT, 0);
            capproval NUMERIC := COALESCE(
                (SELECT AVG(pe.preference_score)
                 FROM presidential_endorsements pe
                 WHERE pe.faction_id = (v_cand.value->>'faction_id')::UUID
                   AND pe.election_id = v_election_id
                   AND pe.status IN ('snapshotted', 'consumed')),
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

    UPDATE presidential_endorsements
    SET status = 'consumed',
        consumed_at = COALESCE(consumed_at, now()),
        updated_at = now()
    WHERE election_id = v_election_id
      AND status = 'snapshotted';

    v_results := jsonb_build_object(
        'presidential_candidates', v_candidate_rows,
        'bloc_details', v_bloc_details,
        'total_votes_cast', v_total_votes,
        'total_abstentions', v_total_abstentions,
        'turnout_pct', CASE WHEN v_nation.eligible_voters > 0
            THEN ROUND((v_total_votes::NUMERIC / v_nation.eligible_voters) * 100, 2)
            ELSE 0 END
    );

    RETURN v_results;
END;
$$;
