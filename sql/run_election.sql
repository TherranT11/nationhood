-- ============================================================
-- run_election(p_nation_id UUID, p_election_type TEXT DEFAULT 'parliamentary')
--
-- Voter-bloc-based election simulation (Weighted Competition Model).
--
-- 1. Loads voter blocs + party ideology axes
-- 2. For each bloc, loads per-bloc approval from faction_bloc_approval
-- 3. ALL parties compete simultaneously for each bloc's voters:
--      softmax_weight = exp((preference_score - max) / K) × ideology_multiplier
--      ideology_multiplier = clamp(1.0 + avg_alignment × 0.02, 0.2, 2.0)
-- 4. Votes distributed proportionally by softmax weight (Largest Remainder)
-- 5. Allocates seats via Largest Remainder (Hare Quota)
-- 6. Writes results to elections table + syncs factions.seats
-- ============================================================

CREATE OR REPLACE FUNCTION run_election(
    p_nation_id UUID,
    p_election_type TEXT DEFAULT 'parliamentary'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_nation       RECORD;
    v_total_seats  INT;
    v_parties      JSONB;
    v_tally        JSONB := '{}'::JSONB;  -- { party_id: vote_count }
    v_bloc         RECORD;
    v_party        RECORD;
    v_tags         TEXT[];
    v_step         INT;
    v_total_abstentions BIGINT := 0;
    v_abstentions  BIGINT;
    v_total_votes  BIGINT;
    v_seats        JSONB;
    v_results      JSONB;
    v_result_rows  JSONB := '[]'::JSONB;
    v_seat_rows    JSONB := '[]'::JSONB;
    v_bloc_details JSONB := '[]'::JSONB;
    v_election_type TEXT := LOWER(COALESCE(p_election_type, 'parliamentary'));
    v_bloc_approvals JSONB;
    v_tally_before JSONB;
    v_bloc_party_votes JSONB;
    v_prev_votes BIGINT;
    v_new_votes BIGINT;
BEGIN
    IF v_election_type NOT IN ('parliamentary', 'presidential') THEN
        RAISE EXCEPTION 'Invalid election type: % (allowed: parliamentary, presidential)', p_election_type;
    END IF;

    -- ---- Load nation ----
    SELECT id, name, total_seats, population, eligible_voters
    INTO v_nation
    FROM nations
    WHERE id = p_nation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Nation not found: %', p_nation_id;
    END IF;

    v_total_seats := COALESCE(v_nation.total_seats, 120);

    -- ---- Load parties with ideology axes ----
    SELECT COALESCE(jsonb_agg(row_to_json(t)::JSONB), '[]'::JSONB)
    INTO v_parties
    FROM (
        SELECT
            f.id,
            f.faction_name,
            COALESCE(fi.liberty_equality, 0)           AS liberty_equality,
            COALESCE(fi.tradition_progress, 0)         AS tradition_progress,
            COALESCE(fi.security_freedom, 0)           AS security_freedom,
            COALESCE(fi.globalism_nationalism, 0)      AS globalism_nationalism,
            COALESCE(fi.individualism_collectivism, 0)  AS individualism_collectivism
        FROM factions f
        LEFT JOIN faction_ideology fi ON fi.faction_id = f.id
        WHERE f.nation_id = p_nation_id
          AND f.faction_type = 'party'
          AND f.is_npc = FALSE
    ) t;

    IF jsonb_array_length(v_parties) = 0 THEN
        RAISE EXCEPTION 'No parties found for nation %', p_nation_id;
    END IF;

    -- Initialise tally to 0 for each party
    FOR v_party IN SELECT * FROM jsonb_array_elements(v_parties)
    LOOP
        v_tally := v_tally || jsonb_build_object(v_party.value->>'id', 0);
    END LOOP;

    -- ---- Compute ideology saturation ----
    -- Count how many parties positively align with each ideology tag.
    -- Over-served ideologies get higher abstention (voter complacency);
    -- under-served get lower abstention (underdog motivation).
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
            FOR v_party IN SELECT * FROM jsonb_array_elements(v_parties) LOOP
                IF _election_get_alignment(v_party.value, v_stag) > 0 THEN
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

    -- ---- Compute voter bloc scale factor ----
    -- eligible_voters is a raw count (actual number of eligible voters).
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

    -- ---- Load voter blocs (scaled in-memory) ----
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

        -- Build per-bloc approval map: { party_id: approval }
        SELECT COALESCE(
            jsonb_object_agg(sub.party_id, sub.approval),
            '{}'::JSONB
        )
        INTO v_bloc_approvals
        FROM (
            SELECT
                (p.value->>'id') AS party_id,
                COALESCE(fba.preference_score, 40) AS approval
            FROM jsonb_array_elements(v_parties) AS p(value)
            LEFT JOIN faction_bloc_approval fba
                ON fba.faction_id = (p.value->>'id')::UUID
                AND fba.bloc_id = v_bloc.id
        ) sub;

        -- Weighted competition: all parties compete simultaneously
        v_tally_before := v_tally;
        SELECT r.step, r.abstentions, r.updated_tally
        INTO v_step, v_abstentions, v_tally
        FROM _election_process_bloc(v_parties, v_tags, v_bloc.voter_count, v_tally, v_bloc_approvals, v_saturation, v_avg_saturation) r;

        -- Snapshot bloc-level vote deltas with party identifiers + names for historical durability
        v_bloc_party_votes := '[]'::JSONB;
        FOR v_party IN SELECT * FROM jsonb_array_elements(v_parties)
        LOOP
            v_prev_votes := COALESCE((v_tally_before->>(v_party.value->>'id'))::BIGINT, 0);
            v_new_votes := COALESCE((v_tally->>(v_party.value->>'id'))::BIGINT, 0);
            v_bloc_party_votes := v_bloc_party_votes || jsonb_build_object(
                'party_id', v_party.value->>'id',
                'party_name', v_party.value->>'faction_name',
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
    END; -- close DECLARE block for v_bloc_scale
    END; -- close DECLARE block for v_saturation

    -- ---- Calculate total votes ----
    v_total_votes := 0;
    FOR v_party IN SELECT * FROM jsonb_each_text(v_tally)
    LOOP
        v_total_votes := v_total_votes + v_party.value::BIGINT;
    END LOOP;

    -- ---- Allocate seats (Largest Remainder / Hare Quota) ----
    v_seats := _election_allocate_seats(v_tally, v_total_votes, v_total_seats);

    -- ---- Build result arrays ----
    FOR v_party IN SELECT * FROM jsonb_array_elements(v_parties)
    LOOP
        DECLARE
            pid TEXT := v_party.value->>'id';
            pname TEXT := v_party.value->>'faction_name';
            pvotes BIGINT := COALESCE((v_tally->>pid)::BIGINT, 0);
            pseats INT := COALESCE((v_seats->>pid)::INT, 0);
            vpct NUMERIC := CASE WHEN v_total_votes > 0
                THEN ROUND((pvotes::NUMERIC / v_total_votes) * 100, 2)
                ELSE 0 END;
        BEGIN
            v_result_rows := v_result_rows || jsonb_build_object(
                'party_id', pid,
                'party_name', pname,
                'votes', pvotes,
                'vote_percentage', vpct,
                'seats', pseats
            );
            v_seat_rows := v_seat_rows || jsonb_build_object(
                'party_id', pid,
                'party_name', pname,
                'seats', pseats
            );
        END;
    END LOOP;

    v_results := jsonb_build_object(
        'votes', v_result_rows,
        'seats', v_seat_rows,
        'bloc_details', v_bloc_details,
        'total_votes_cast', v_total_votes,
        'total_abstentions', v_total_abstentions,
        'turnout_pct', CASE WHEN v_eligible > 0
            THEN ROUND((v_total_votes::NUMERIC / v_eligible) * 100, 2)
            ELSE 0 END
    );

    -- ---- Sync seats to factions ----
    FOR v_party IN SELECT * FROM jsonb_array_elements(v_seat_rows)
    LOOP
        UPDATE factions
        SET seats = (v_party.value->>'seats')::INT
        WHERE id = (v_party.value->>'party_id')::UUID;
    END LOOP;

    RETURN v_results;
END;
$$;


-- ============================================================
-- _election_get_alignment(party JSONB, tag TEXT) -> INT
--
-- Returns party's alignment score toward a specific ideology tag.
-- Positive = supports, negative = opposes.
-- ============================================================

CREATE OR REPLACE FUNCTION _election_get_alignment(p_party JSONB, p_tag TEXT)
RETURNS INT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    v_tag    TEXT := UPPER(p_tag);
    v_axis   TEXT;
    v_dir    INT;
    v_value  INT;
BEGIN
    -- Map tag -> axis key + direction
    CASE v_tag
        WHEN 'LIBERTY'        THEN v_axis := 'liberty_equality';           v_dir := -1;
        WHEN 'EQUALITY'       THEN v_axis := 'liberty_equality';           v_dir :=  1;
        WHEN 'TRADITION'      THEN v_axis := 'tradition_progress';         v_dir := -1;
        WHEN 'PROGRESS'       THEN v_axis := 'tradition_progress';         v_dir :=  1;
        WHEN 'SECURITY'       THEN v_axis := 'security_freedom';           v_dir := -1;
        WHEN 'FREEDOM'        THEN v_axis := 'security_freedom';           v_dir :=  1;
        WHEN 'GLOBALISM'      THEN v_axis := 'globalism_nationalism';      v_dir := -1;
        WHEN 'NATIONALISM'    THEN v_axis := 'globalism_nationalism';      v_dir :=  1;
        WHEN 'INDIVIDUALISM'  THEN v_axis := 'individualism_collectivism'; v_dir := -1;
        WHEN 'COLLECTIVISM'   THEN v_axis := 'individualism_collectivism'; v_dir :=  1;
        ELSE RETURN 0;
    END CASE;

    v_value := COALESCE((p_party->>v_axis)::INT, 0);
    RETURN v_value * v_dir;
END;
$$;


-- ============================================================
-- _election_process_bloc — Softmax Weighted Competition Model
--
-- ALL parties compete simultaneously for each voter bloc.
-- Preference scores are sharpened via softmax before distribution:
--   softmax_weight = exp((preference_score - max_score) / K) × ideology_multiplier
--   ideology_multiplier = clamp(1.0 + avg_alignment × 0.02, 0.2, 2.0)
--
-- K = 10 (softmax temperature, matching tick-system k_value).
-- This exponential sharpening amplifies small differences in preference_score
-- into meaningful vote share gaps, preventing near-uniform election results.
-- ============================================================

-- Drop all previous overloads
DROP FUNCTION IF EXISTS _election_process_bloc(JSONB, TEXT[], INT, JSONB);
DROP FUNCTION IF EXISTS _election_process_bloc(JSONB, TEXT[], BIGINT, JSONB);
DROP FUNCTION IF EXISTS _election_process_bloc(JSONB, TEXT[], INT, JSONB, JSONB);
DROP FUNCTION IF EXISTS _election_process_bloc(JSONB, TEXT[], INT, JSONB, JSONB, NUMERIC);
DROP FUNCTION IF EXISTS _election_process_bloc(JSONB, TEXT[], INT, JSONB, JSONB, JSONB, NUMERIC);

CREATE OR REPLACE FUNCTION _election_process_bloc(
    p_parties          JSONB,
    p_tags             TEXT[],
    p_bloc_count       INT,
    p_tally            JSONB,
    p_bloc_approvals   JSONB,
    p_saturation       JSONB DEFAULT '{}'::JSONB,
    p_avg_saturation   NUMERIC DEFAULT 1
)
RETURNS TABLE(step INT, abstentions BIGINT, updated_tally JSONB)
LANGUAGE plpgsql
AS $$
DECLARE
    v_party        RECORD;
    v_tag_count    INT := array_length(p_tags, 1);
    v_tally        JSONB := p_tally;
    v_abstain      BIGINT := 0;
    v_voters       INT;
    v_abstain_rate NUMERIC;
    v_i            INT;
    -- Saturation variables
    c_SAT_RATE     CONSTANT NUMERIC := 0.04;
    c_SAT_CAP      CONSTANT NUMERIC := 0.12;
    v_sat_sum      NUMERIC := 0;
    v_bloc_sat     NUMERIC := 0;
    v_sat_mod      NUMERIC := 0;
    -- Weighted competition variables
    c_IDEOLOGY_RATE  CONSTANT NUMERIC := 0.02;  -- multiplier per alignment unit
    c_MULT_MIN       CONSTANT NUMERIC := 0.2;   -- min ideology multiplier
    c_MULT_MAX       CONSTANT NUMERIC := 2.0;   -- max ideology multiplier
    -- Softmax sharpening (matches tick-system k_value default)
    c_K_TEMP         CONSTANT NUMERIC := 10;    -- softmax temperature
    v_max_approval   NUMERIC := 0;
    v_softmax_exp    NUMERIC;
    v_pid          TEXT;
    v_approval     NUMERIC;
    v_alignment    INT;
    v_align_sum    NUMERIC;
    v_align_avg    NUMERIC;
    v_multiplier   NUMERIC;
    v_weight       NUMERIC;
    v_total_weight NUMERIC := 0;
    v_weights      JSONB := '{}'::JSONB;
    v_allocated    INT := 0;
    v_exact        NUMERIC;
    v_floored      INT;
    v_fractionals  JSONB := '[]'::JSONB;
    v_remainder    INT;
    v_frac         RECORD;
BEGIN
    -- ---- Pre-compute saturation modifier for this bloc's tags ----
    IF v_tag_count IS NOT NULL AND v_tag_count > 0 AND p_saturation != '{}'::JSONB THEN
        FOR v_i IN 1..v_tag_count LOOP
            v_sat_sum := v_sat_sum + COALESCE((p_saturation->>UPPER(p_tags[v_i]))::NUMERIC, 0);
        END LOOP;
        v_bloc_sat := v_sat_sum / v_tag_count;
        v_sat_mod := (v_bloc_sat - p_avg_saturation) * c_SAT_RATE;
        v_sat_mod := GREATEST(-c_SAT_CAP, LEAST(c_SAT_CAP, v_sat_mod));
    END IF;

    -- ---- Handle Unaligned bloc (no tags) — distribute purely by approval ----
    IF v_tag_count IS NULL OR v_tag_count = 0 THEN
        v_abstain := FLOOR(p_bloc_count * 0.35);
        v_voters := p_bloc_count - v_abstain;
        IF v_voters > 0 THEN
            v_tally := _election_distribute_votes_approval_only(p_parties, v_voters, v_tally, p_bloc_approvals);
        END IF;
        RETURN QUERY SELECT 0, v_abstain, v_tally;
        RETURN;
    END IF;

    -- ---- Abstention: 22% base + saturation modifier ----
    v_abstain_rate := GREATEST(0.05, LEAST(0.85, 0.22 + v_sat_mod));
    v_abstain := FLOOR(p_bloc_count * v_abstain_rate);
    v_voters := p_bloc_count - v_abstain;

    IF v_voters <= 0 THEN
        RETURN QUERY SELECT 1, p_bloc_count::BIGINT, v_tally;
        RETURN;
    END IF;

    -- ---- Softmax Weighted Competition: ALL parties compete simultaneously ----
    -- First pass: find max approval for numerical stability
    FOR v_party IN SELECT * FROM jsonb_array_elements(p_parties)
    LOOP
        v_approval := COALESCE((p_bloc_approvals->>(v_party.value->>'id'))::NUMERIC, 40);
        IF v_approval > v_max_approval THEN v_max_approval := v_approval; END IF;
    END LOOP;

    -- Second pass: compute softmax-sharpened weights
    FOR v_party IN SELECT * FROM jsonb_array_elements(p_parties)
    LOOP
        v_pid := v_party.value->>'id';
        v_approval := COALESCE((p_bloc_approvals->>v_pid)::NUMERIC, 40);

        -- Softmax sharpening: exp((approval - max) / k)
        v_softmax_exp := EXP((v_approval - v_max_approval) / c_K_TEMP);

        -- Compute average alignment across bloc tags
        v_align_sum := 0;
        FOR v_i IN 1..v_tag_count LOOP
            v_alignment := _election_get_alignment(v_party.value, p_tags[v_i]);
            v_align_sum := v_align_sum + v_alignment;
        END LOOP;
        v_align_avg := v_align_sum / v_tag_count;

        -- ideology_multiplier = clamp(1.0 + avg_alignment × 0.02, 0.2, 2.0)
        v_multiplier := GREATEST(c_MULT_MIN, LEAST(c_MULT_MAX, 1.0 + v_align_avg * c_IDEOLOGY_RATE));

        -- Weight = softmax(approval) × ideology_multiplier
        v_weight := v_softmax_exp * v_multiplier;
        IF v_weight < 0 THEN v_weight := 0; END IF;

        v_weights := v_weights || jsonb_build_object(v_pid, v_weight);
        v_total_weight := v_total_weight + v_weight;
    END LOOP;

    -- Edge case: all weights are 0 — fall back to approval-only
    IF v_total_weight = 0 THEN
        v_tally := _election_distribute_votes_approval_only(p_parties, v_voters, v_tally, p_bloc_approvals);
        RETURN QUERY SELECT 1, v_abstain, v_tally;
        RETURN;
    END IF;

    -- ---- Distribute votes proportionally with Largest Remainder ----
    FOR v_party IN SELECT * FROM jsonb_array_elements(p_parties)
    LOOP
        v_pid := v_party.value->>'id';
        v_weight := COALESCE((v_weights->>v_pid)::NUMERIC, 0);
        v_exact := (v_voters::NUMERIC * v_weight) / v_total_weight;
        v_floored := FLOOR(v_exact);

        v_tally := jsonb_set(v_tally, ARRAY[v_pid],
            to_jsonb(COALESCE((v_tally->>v_pid)::BIGINT, 0) + v_floored));
        v_allocated := v_allocated + v_floored;

        v_fractionals := v_fractionals || jsonb_build_object(
            'id', v_pid,
            'frac', v_exact - v_floored
        );
    END LOOP;

    v_remainder := v_voters - v_allocated;

    IF v_remainder > 0 THEN
        FOR v_frac IN
            SELECT value->>'id' AS pid, (value->>'frac')::NUMERIC AS frac
            FROM jsonb_array_elements(v_fractionals)
            ORDER BY (value->>'frac')::NUMERIC DESC
            LIMIT v_remainder
        LOOP
            v_tally := jsonb_set(v_tally, ARRAY[v_frac.pid],
                to_jsonb(COALESCE((v_tally->>v_frac.pid)::BIGINT, 0) + 1));
        END LOOP;
    END IF;

    RETURN QUERY SELECT 1, v_abstain, v_tally;
    RETURN;
END;
$$;


-- ============================================================
-- Drop old functions no longer used in the weighted competition model
-- ============================================================
DROP FUNCTION IF EXISTS _election_effective_approval(JSONB, TEXT[]);
DROP FUNCTION IF EXISTS _election_distribute_votes(JSONB, TEXT[], TEXT[], INT, JSONB);
DROP FUNCTION IF EXISTS _election_distribute_votes(JSONB, TEXT[], TEXT[], BIGINT, JSONB);
DROP FUNCTION IF EXISTS _election_distribute_votes(JSONB, TEXT[], TEXT[], INT, JSONB, JSONB);
DROP FUNCTION IF EXISTS _election_distribute_votes(JSONB, TEXT[], TEXT[], BIGINT, JSONB, JSONB);


-- ============================================================
-- _election_distribute_votes_approval_only(parties, bloc_count, tally, bloc_approvals)
-- -> JSONB (updated tally)
--
-- For Unaligned blocs: distribute by softmax-sharpened approval rating.
-- Uses same K=10 temperature as the main election model.
-- ============================================================

DROP FUNCTION IF EXISTS _election_distribute_votes_approval_only(JSONB, INT, JSONB);
DROP FUNCTION IF EXISTS _election_distribute_votes_approval_only(JSONB, BIGINT, JSONB);
DROP FUNCTION IF EXISTS _election_distribute_votes_approval_only(JSONB, INT, JSONB, JSONB);
DROP FUNCTION IF EXISTS _election_distribute_votes_approval_only(JSONB, BIGINT, JSONB, JSONB);

CREATE OR REPLACE FUNCTION _election_distribute_votes_approval_only(
    p_parties        JSONB,
    p_bloc_count     INT,
    p_tally          JSONB,
    p_bloc_approvals JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_tally          JSONB := p_tally;
    v_party          RECORD;
    v_pid            TEXT;
    v_approval       NUMERIC;
    v_max_approval   NUMERIC := 0;
    v_softmax_exp    NUMERIC;
    v_total_weight   NUMERIC := 0;
    v_weights        JSONB := '{}'::JSONB;
    v_exact          NUMERIC;
    v_floored        INT;
    v_allocated      INT := 0;
    v_fractionals    JSONB := '[]'::JSONB;
    v_remainder      INT;
    v_frac           RECORD;
    v_count          INT := 0;
    c_K_TEMP         CONSTANT NUMERIC := 10;
BEGIN
    -- First pass: find max approval for softmax numerical stability
    FOR v_party IN SELECT * FROM jsonb_array_elements(p_parties)
    LOOP
        v_approval := COALESCE((p_bloc_approvals->>(v_party.value->>'id'))::NUMERIC, 40);
        IF v_approval > v_max_approval THEN v_max_approval := v_approval; END IF;
        v_count := v_count + 1;
    END LOOP;

    -- Second pass: compute softmax weights
    FOR v_party IN SELECT * FROM jsonb_array_elements(p_parties)
    LOOP
        v_pid := v_party.value->>'id';
        v_approval := COALESCE((p_bloc_approvals->>v_pid)::NUMERIC, 40);
        v_softmax_exp := EXP((v_approval - v_max_approval) / c_K_TEMP);
        v_weights := v_weights || jsonb_build_object(v_pid, v_softmax_exp);
        v_total_weight := v_total_weight + v_softmax_exp;
    END LOOP;

    -- Edge case: all weights are 0 (should not happen with softmax)
    IF v_total_weight = 0 THEN
        DECLARE
            v_even INT := FLOOR(p_bloc_count::NUMERIC / v_count);
            v_rem  INT := p_bloc_count - v_even * v_count;
            v_first TEXT;
        BEGIN
            FOR v_party IN SELECT * FROM jsonb_array_elements(p_parties)
            LOOP
                v_pid := v_party.value->>'id';
                IF v_first IS NULL THEN v_first := v_pid; END IF;
                v_tally := jsonb_set(v_tally, ARRAY[v_pid],
                    to_jsonb(COALESCE((v_tally->>v_pid)::BIGINT, 0) + v_even));
            END LOOP;
            IF v_rem > 0 AND v_first IS NOT NULL THEN
                v_tally := jsonb_set(v_tally, ARRAY[v_first],
                    to_jsonb(COALESCE((v_tally->>v_first)::BIGINT, 0) + v_rem));
            END IF;
            RETURN v_tally;
        END;
    END IF;

    -- Distribute proportionally by softmax-sharpened weights
    FOR v_party IN SELECT * FROM jsonb_array_elements(p_parties)
    LOOP
        v_pid := v_party.value->>'id';
        v_softmax_exp := COALESCE((v_weights->>v_pid)::NUMERIC, 0);
        v_exact := (p_bloc_count::NUMERIC * v_softmax_exp) / v_total_weight;
        v_floored := FLOOR(v_exact);

        v_tally := jsonb_set(v_tally, ARRAY[v_pid],
            to_jsonb(COALESCE((v_tally->>v_pid)::BIGINT, 0) + v_floored));
        v_allocated := v_allocated + v_floored;

        v_fractionals := v_fractionals || jsonb_build_object(
            'id', v_pid,
            'frac', v_exact - v_floored
        );
    END LOOP;

    v_remainder := p_bloc_count - v_allocated;

    IF v_remainder > 0 THEN
        FOR v_frac IN
            SELECT value->>'id' AS pid, (value->>'frac')::NUMERIC AS frac
            FROM jsonb_array_elements(v_fractionals)
            ORDER BY (value->>'frac')::NUMERIC DESC
            LIMIT v_remainder
        LOOP
            v_tally := jsonb_set(v_tally, ARRAY[v_frac.pid],
                to_jsonb(COALESCE((v_tally->>v_frac.pid)::BIGINT, 0) + 1));
        END LOOP;
    END IF;

    RETURN v_tally;
END;
$$;


-- ============================================================
-- _election_allocate_seats(tally JSONB, total_votes BIGINT, total_seats INT)
-- -> JSONB { party_id: seats }
--
-- Largest Remainder / Hare Quota seat allocation.
-- ============================================================

DROP FUNCTION IF EXISTS _election_allocate_seats(JSONB, BIGINT, INT);
DROP FUNCTION IF EXISTS _election_allocate_seats(JSONB, BIGINT, BIGINT);

CREATE OR REPLACE FUNCTION _election_allocate_seats(
    p_tally       JSONB,
    p_total_votes BIGINT,
    p_total_seats INT
)
RETURNS JSONB
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    v_seats         JSONB := '{}'::JSONB;
    v_entry         RECORD;
    v_quota         NUMERIC;
    v_raw           NUMERIC;
    v_guaranteed    INT;
    v_allocated     INT := 0;
    v_fractionals   JSONB := '[]'::JSONB;
    v_remaining     INT;
    v_frac          RECORD;
BEGIN
    IF p_total_votes = 0 THEN
        FOR v_entry IN SELECT key FROM jsonb_each_text(p_tally)
        LOOP
            v_seats := v_seats || jsonb_build_object(v_entry.key, 0);
        END LOOP;
        RETURN v_seats;
    END IF;

    v_quota := p_total_votes::NUMERIC / p_total_seats;

    FOR v_entry IN SELECT key, value::BIGINT AS votes FROM jsonb_each_text(p_tally)
    LOOP
        IF v_entry.votes = 0 THEN
            v_seats := v_seats || jsonb_build_object(v_entry.key, 0);
            CONTINUE;
        END IF;

        v_raw := v_entry.votes::NUMERIC / v_quota;
        v_guaranteed := FLOOR(v_raw);
        v_seats := v_seats || jsonb_build_object(v_entry.key, v_guaranteed);
        v_allocated := v_allocated + v_guaranteed;

        v_fractionals := v_fractionals || jsonb_build_object(
            'id', v_entry.key,
            'frac', v_raw - v_guaranteed
        );
    END LOOP;

    v_remaining := p_total_seats - v_allocated;

    IF v_remaining > 0 THEN
        FOR v_frac IN
            SELECT value->>'id' AS pid
            FROM jsonb_array_elements(v_fractionals)
            ORDER BY (value->>'frac')::NUMERIC DESC
            LIMIT v_remaining
        LOOP
            v_seats := jsonb_set(v_seats, ARRAY[v_frac.pid],
                to_jsonb(COALESCE((v_seats->>v_frac.pid)::INT, 0) + 1));
        END LOOP;
    END IF;

    RETURN v_seats;
END;
$$;
