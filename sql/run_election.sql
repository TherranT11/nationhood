-- ============================================================
-- run_election(p_nation_id UUID, p_election_type TEXT DEFAULT 'parliamentary')
--
-- Voter-bloc-based election simulation.
--
-- 1. Loads voter blocs + party ideology axes
-- 2. For each bloc, runs a 4-step cascade to find eligible parties
-- 3. Distributes votes using approval × alignment weighting
-- 4. Allocates 120 seats via Largest Remainder (Hare Quota)
-- 5. Writes results to elections table + syncs factions.seats
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
    v_blocs        JSONB;
    v_parties      JSONB;
    v_tally        JSONB := '{}'::JSONB;  -- { party_id: vote_count }
    v_bloc         RECORD;
    v_party        RECORD;
    v_tags         TEXT[];
    v_step         INT;
    v_eligible_ids TEXT[];
    v_alignments   JSONB;  -- { party_id: [alignment_per_tag] }
    v_total_abstentions BIGINT := 0;
    v_abstentions  BIGINT;
    v_total_votes  BIGINT;
    v_seats        JSONB;
    v_results      JSONB;
    v_election_id  UUID;
    v_result_rows  JSONB := '[]'::JSONB;
    v_seat_rows    JSONB := '[]'::JSONB;
    v_election_type TEXT := LOWER(COALESCE(p_election_type, 'parliamentary'));
BEGIN
    IF v_election_type NOT IN ('parliamentary', 'presidential') THEN
        RAISE EXCEPTION 'Invalid election type: % (allowed: parliamentary, presidential)', p_election_type;
    END IF;

    -- ---- Load nation ----
    SELECT id, name, total_seats, eligible_voters
    INTO v_nation
    FROM nations
    WHERE id = p_nation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Nation not found: %', p_nation_id;
    END IF;

    v_total_seats := COALESCE(v_nation.total_seats, 120);

    -- ---- Load parties with ideology axes ----
    -- Build a JSON array of party objects
    SELECT COALESCE(jsonb_agg(row_to_json(t)::JSONB), '[]'::JSONB)
    INTO v_parties
    FROM (
        SELECT
            f.id,
            f.faction_name,
            COALESCE(f.approval_rating, 0) AS approval_rating,
            COALESCE(f.ideology_modifiers, '{}'::JSONB) AS ideology_modifiers,
            COALESCE(fi.liberty_equality, 0)           AS liberty_equality,
            COALESCE(fi.tradition_progress, 0)         AS tradition_progress,
            COALESCE(fi.security_freedom, 0)           AS security_freedom,
            COALESCE(fi.globalism_nationalism, 0)      AS globalism_nationalism,
            COALESCE(fi.individualism_collectivism, 0)  AS individualism_collectivism
        FROM factions f
        LEFT JOIN faction_ideology fi ON fi.faction_id = f.id
        WHERE f.nation_id = p_nation_id
          AND f.faction_type = 'party'
    ) t;

    IF jsonb_array_length(v_parties) = 0 THEN
        RAISE EXCEPTION 'No parties found for nation %', p_nation_id;
    END IF;

    -- Initialise tally to 0 for each party
    FOR v_party IN SELECT * FROM jsonb_array_elements(v_parties)
    LOOP
        v_tally := v_tally || jsonb_build_object(v_party.value->>'id', 0);
    END LOOP;

    -- ---- Compute voter bloc scale factor ----
    -- Blocs are generated from population, but elections use eligible_voters
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

        -- Run cascade + distribute (single call)
        SELECT r.step, r.abstentions, r.updated_tally
        INTO v_step, v_abstentions, v_tally
        FROM _election_process_bloc(v_parties, v_tags, v_bloc.voter_count, v_tally) r;

        v_total_abstentions := v_total_abstentions + COALESCE(v_abstentions, 0);
    END LOOP;
    END; -- close DECLARE block for v_bloc_scale

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
        v_election_type,
        'completed',
        v_results
    )
    RETURNING id INTO v_election_id;

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
-- _election_get_alignment(party JSONB, tag TEXT) → INT
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
    -- Map tag → axis key + direction
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
-- _election_process_bloc(parties JSONB, tags TEXT[], bloc_count INT, tally JSONB)
-- → TABLE(step INT, abstentions BIGINT, updated_tally JSONB)
--
-- Runs the 4-step cascade for one voter bloc and distributes votes.
-- ============================================================

CREATE OR REPLACE FUNCTION _election_process_bloc(
    p_parties    JSONB,
    p_tags       TEXT[],
    p_bloc_count INT,
    p_tally      JSONB
)
RETURNS TABLE(step INT, abstentions BIGINT, updated_tally JSONB)
LANGUAGE plpgsql
AS $$
DECLARE
    v_eligible_ids TEXT[] := ARRAY[]::TEXT[];
    v_party        RECORD;
    v_aligns       INT[];
    v_positive     INT;
    v_tag_count    INT := array_length(p_tags, 1);
    v_step         INT := 0;
    v_alignment    INT;
    v_i            INT;
    v_tally        JSONB := p_tally;
    v_abstain      BIGINT := 0;
    v_voters       INT;
    v_abstain_rate NUMERIC;
BEGIN
    -- Handle Unaligned bloc (no tags)
    IF v_tag_count IS NULL OR v_tag_count = 0 THEN
        -- Step 0: 35% base abstention for unaligned blocs
        v_abstain := FLOOR(p_bloc_count * 0.35);
        v_voters := p_bloc_count - v_abstain;
        IF v_voters > 0 THEN
            v_tally := _election_distribute_votes_approval_only(p_parties, v_voters, v_tally);
        END IF;
        RETURN QUERY SELECT 0, v_abstain, v_tally;
        RETURN;
    END IF;

    -- Pre-compute alignments per party
    -- Try each cascade step

    -- ==== STEP 1: Full Ideology Match ====
    v_eligible_ids := ARRAY[]::TEXT[];
    FOR v_party IN SELECT * FROM jsonb_array_elements(p_parties)
    LOOP
        v_positive := 0;
        FOR v_i IN 1..v_tag_count LOOP
            v_alignment := _election_get_alignment(v_party.value, p_tags[v_i]);
            IF v_alignment > 0 THEN v_positive := v_positive + 1; END IF;
        END LOOP;

        IF v_tag_count <= 2 AND v_positive >= v_tag_count THEN
            v_eligible_ids := v_eligible_ids || (v_party.value->>'id');
        ELSIF v_tag_count >= 3 AND v_positive >= 2 THEN
            v_eligible_ids := v_eligible_ids || (v_party.value->>'id');
        END IF;
    END LOOP;

    IF array_length(v_eligible_ids, 1) > 0 THEN
        -- Step 1: 20% base abstention — most motivated voters
        v_abstain := FLOOR(p_bloc_count * 0.20);
        v_voters := p_bloc_count - v_abstain;
        IF v_voters > 0 THEN
            v_tally := _election_distribute_votes(p_parties, v_eligible_ids, p_tags, v_voters, v_tally);
        END IF;
        RETURN QUERY SELECT 1, v_abstain, v_tally;
        RETURN;
    END IF;

    -- ==== STEP 2: Partial Match ====
    v_eligible_ids := ARRAY[]::TEXT[];
    FOR v_party IN SELECT * FROM jsonb_array_elements(p_parties)
    LOOP
        FOR v_i IN 1..v_tag_count LOOP
            v_alignment := _election_get_alignment(v_party.value, p_tags[v_i]);
            IF v_alignment > 0 THEN
                v_eligible_ids := v_eligible_ids || (v_party.value->>'id');
                EXIT; -- one match is enough
            END IF;
        END LOOP;
    END LOOP;

    IF array_length(v_eligible_ids, 1) > 0 THEN
        -- Step 2: 28% base abstention — moderate motivation
        v_abstain := FLOOR(p_bloc_count * 0.28);
        v_voters := p_bloc_count - v_abstain;
        IF v_voters > 0 THEN
            v_tally := _election_distribute_votes(p_parties, v_eligible_ids, p_tags, v_voters, v_tally);
        END IF;
        RETURN QUERY SELECT 2, v_abstain, v_tally;
        RETURN;
    END IF;

    -- ==== STEP 3: No Active Opposition (alignment > -20) ====
    v_eligible_ids := ARRAY[]::TEXT[];
    FOR v_party IN SELECT * FROM jsonb_array_elements(p_parties)
    LOOP
        DECLARE
            v_ok BOOLEAN := TRUE;
        BEGIN
            FOR v_i IN 1..v_tag_count LOOP
                v_alignment := _election_get_alignment(v_party.value, p_tags[v_i]);
                IF v_alignment <= -20 THEN
                    v_ok := FALSE;
                    EXIT;
                END IF;
            END LOOP;
            IF v_ok THEN
                v_eligible_ids := v_eligible_ids || (v_party.value->>'id');
            END IF;
        END;
    END LOOP;

    IF array_length(v_eligible_ids, 1) > 0 THEN
        -- Step 3: 33% base abstention — lukewarm support
        v_abstain := FLOOR(p_bloc_count * 0.33);
        v_voters := p_bloc_count - v_abstain;
        IF v_voters > 0 THEN
            v_tally := _election_distribute_votes(p_parties, v_eligible_ids, p_tags, v_voters, v_tally);
        END IF;
        RETURN QUERY SELECT 3, v_abstain, v_tally;
        RETURN;
    END IF;

    -- ==== STEP 4: Forced choice / abstention ====
    -- Step 4: 75% abstain — deeply disaffected
    v_abstain := FLOOR(p_bloc_count * 0.75);
    DECLARE
        v_forced INT := p_bloc_count - v_abstain;
        v_best_id TEXT;
        v_best_approval INT := -1;
        v_cur_approval INT;
    BEGIN
        IF v_forced > 0 THEN
            FOR v_party IN SELECT * FROM jsonb_array_elements(p_parties)
            LOOP
                v_cur_approval := _election_effective_approval(v_party.value, p_tags)::INT;
                IF v_cur_approval > v_best_approval THEN
                    v_best_approval := v_cur_approval;
                    v_best_id := v_party.value->>'id';
                END IF;
            END LOOP;

            v_tally := jsonb_set(
                v_tally,
                ARRAY[v_best_id],
                to_jsonb(COALESCE((v_tally->>v_best_id)::BIGINT, 0) + v_forced)
            );
        END IF;
    END;

    RETURN QUERY SELECT 4, v_abstain, v_tally;
    RETURN;
END;
$$;


-- ============================================================
-- _election_effective_approval(party JSONB, tags TEXT[])
-- → NUMERIC
--
-- Returns effective approval = base_approval + avg(matched tag modifiers).
-- For unaligned blocs (empty tags), returns base approval unchanged.
-- Clamped to [0, 100].
-- ============================================================

CREATE OR REPLACE FUNCTION _election_effective_approval(
    p_party JSONB,
    p_tags  TEXT[]
)
RETURNS NUMERIC
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    v_base       NUMERIC := COALESCE((p_party->>'approval_rating')::NUMERIC, 0);
    v_mods       JSONB   := COALESCE(p_party->'ideology_modifiers', '{}'::JSONB);
    v_tag_count  INT     := COALESCE(array_length(p_tags, 1), 0);
    v_sum        NUMERIC := 0;
    v_i          INT;
    v_tag        TEXT;
    v_mod_val    NUMERIC;
BEGIN
    IF v_tag_count = 0 THEN
        RETURN v_base;
    END IF;

    FOR v_i IN 1..v_tag_count LOOP
        v_tag := UPPER(p_tags[v_i]);
        v_mod_val := COALESCE((v_mods->>v_tag)::NUMERIC, 0);
        v_sum := v_sum + v_mod_val;
    END LOOP;

    RETURN GREATEST(0, LEAST(100, v_base + (v_sum / v_tag_count)));
END;
$$;


-- ============================================================
-- _election_distribute_votes(parties, eligible_ids, tags, bloc_count, tally)
-- → JSONB (updated tally)
--
-- Distributes votes using approval × alignment weighting.
-- ============================================================

CREATE OR REPLACE FUNCTION _election_distribute_votes(
    p_parties      JSONB,
    p_eligible_ids TEXT[],
    p_tags         TEXT[],
    p_bloc_count   INT,
    p_tally        JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_tally        JSONB := p_tally;
    v_party        RECORD;
    v_tag_count    INT := array_length(p_tags, 1);
    v_weights      JSONB := '{}'::JSONB;
    v_total_weight NUMERIC := 0;
    v_alignment    INT;
    v_clamped      INT;
    v_align_sum    NUMERIC;
    v_align_score  NUMERIC;
    v_weight       NUMERIC;
    v_pid          TEXT;
    v_i            INT;
    v_allocated    INT := 0;
    v_exact        NUMERIC;
    v_floored      INT;
    v_fractionals  JSONB := '[]'::JSONB;
    v_remainder    INT;
    v_frac         RECORD;
BEGIN
    -- Calculate weights for eligible parties
    FOR v_party IN SELECT * FROM jsonb_array_elements(p_parties)
    LOOP
        v_pid := v_party.value->>'id';
        IF NOT (v_pid = ANY(p_eligible_ids)) THEN CONTINUE; END IF;

        v_align_sum := 0;
        IF v_tag_count IS NOT NULL AND v_tag_count > 0 THEN
            FOR v_i IN 1..v_tag_count LOOP
                v_alignment := _election_get_alignment(v_party.value, p_tags[v_i]);
                v_clamped := GREATEST(v_alignment, 1);
                v_align_sum := v_align_sum + v_clamped;
            END LOOP;
            v_align_score := v_align_sum / v_tag_count;
        ELSE
            v_align_score := 1;
        END IF;

        v_weight := _election_effective_approval(v_party.value, p_tags) * v_align_score;
        v_weights := v_weights || jsonb_build_object(v_pid, v_weight);
        v_total_weight := v_total_weight + v_weight;
    END LOOP;

    -- Edge case: all weights 0
    IF v_total_weight = 0 THEN
        DECLARE
            v_count INT := array_length(p_eligible_ids, 1);
            v_even  INT := FLOOR(p_bloc_count::NUMERIC / v_count);
            v_rem   INT := p_bloc_count - v_even * v_count;
        BEGIN
            FOREACH v_pid IN ARRAY p_eligible_ids LOOP
                v_tally := jsonb_set(v_tally, ARRAY[v_pid],
                    to_jsonb(COALESCE((v_tally->>v_pid)::BIGINT, 0) + v_even));
            END LOOP;
            IF v_rem > 0 THEN
                v_tally := jsonb_set(v_tally, ARRAY[p_eligible_ids[1]],
                    to_jsonb(COALESCE((v_tally->>p_eligible_ids[1])::BIGINT, 0) + v_rem));
            END IF;
            RETURN v_tally;
        END;
    END IF;

    -- Distribute proportionally with largest remainder
    FOREACH v_pid IN ARRAY p_eligible_ids LOOP
        v_weight := COALESCE((v_weights->>v_pid)::NUMERIC, 0);
        v_exact := (p_bloc_count::NUMERIC * v_weight) / v_total_weight;
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

    -- Sort fractionals descending by frac and award remainder seats
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
-- _election_distribute_votes_approval_only(parties, bloc_count, tally)
-- → JSONB (updated tally)
--
-- For Unaligned blocs: distribute purely by approval rating.
-- ============================================================

CREATE OR REPLACE FUNCTION _election_distribute_votes_approval_only(
    p_parties    JSONB,
    p_bloc_count INT,
    p_tally      JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_tally          JSONB := p_tally;
    v_party          RECORD;
    v_pid            TEXT;
    v_total_approval NUMERIC := 0;
    v_approval       NUMERIC;
    v_exact          NUMERIC;
    v_floored        INT;
    v_allocated      INT := 0;
    v_fractionals    JSONB := '[]'::JSONB;
    v_remainder      INT;
    v_frac           RECORD;
    v_count          INT := 0;
BEGIN
    -- Sum all approvals
    FOR v_party IN SELECT * FROM jsonb_array_elements(p_parties)
    LOOP
        v_total_approval := v_total_approval + COALESCE((v_party.value->>'approval_rating')::NUMERIC, 0);
        v_count := v_count + 1;
    END LOOP;

    -- Edge case: all 0 approval
    IF v_total_approval = 0 THEN
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

    -- Distribute proportionally by approval
    FOR v_party IN SELECT * FROM jsonb_array_elements(p_parties)
    LOOP
        v_pid := v_party.value->>'id';
        v_approval := COALESCE((v_party.value->>'approval_rating')::NUMERIC, 0);
        v_exact := (p_bloc_count::NUMERIC * v_approval) / v_total_approval;
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
-- → JSONB { party_id: seats }
--
-- Largest Remainder / Hare Quota seat allocation.
-- ============================================================

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
