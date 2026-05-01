-- ══════════════════════════════════════════════════════════════
-- Replace run_election: vote share from sector popularity
--
-- Retires the momentum/engagement softmax pipeline. Vote share is
-- now computed directly from faction_sector_popularity using the
-- Total Weighted Popularity formula already documented on the
-- sectors table:
--
--     TWP_party = SUM over active sectors of
--                 (popularity × weight × base_turnout)
--
--     party_share = TWP_party / total_TWP_in_nation
--     party_votes = ROUND(party_share × eligible_voters × 0.65)
--
-- The 0.65 turnout factor matches VOTING_AGE_SHARE elsewhere in
-- the codebase. Per-sector base_turnout already captures
-- sector-level engagement differentials inside the TWP formula.
--
-- Seat allocation still uses the existing _election_allocate_seats
-- helper (Largest Remainder / Hare Quota).
--
-- Idempotent: CREATE OR REPLACE on the same signature.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION run_election(
    p_nation_id UUID,
    p_election_type TEXT DEFAULT 'parliamentary'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_nation        RECORD;
    v_total_seats   INT;
    v_eligible      BIGINT;
    v_tally         JSONB := '{}'::JSONB;
    v_total_votes   BIGINT := 0;
    v_total_abstentions BIGINT := 0;
    v_seats         JSONB;
    v_result_rows   JSONB := '[]'::JSONB;
    v_seat_rows     JSONB := '[]'::JSONB;
    v_party         RECORD;
    v_total_twp     NUMERIC := 0;
    v_target_votes  BIGINT;
    v_share         NUMERIC;
    v_exact         NUMERIC;
    v_floored       BIGINT;
    v_allocated     BIGINT := 0;
    v_fractionals   JSONB := '[]'::JSONB;
    v_remainder     BIGINT;
    v_frac          RECORD;
    v_election_type TEXT := LOWER(COALESCE(p_election_type, 'parliamentary'));
    v_results       JSONB;
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
    v_eligible    := COALESCE(v_nation.eligible_voters, 0);
    v_target_votes := ROUND(v_eligible * 0.65)::BIGINT;

    -- ---- Compute Total Weighted Popularity per party ----
    -- Joins faction_sector_popularity to sectors so weight + base_turnout
    -- multiply through. Inactive sectors are excluded.
    FOR v_party IN
        SELECT
            f.id,
            f.faction_name,
            COALESCE(SUM(
                fsp.popularity::NUMERIC * s.weight::NUMERIC * s.base_turnout
            ), 0) AS twp
          FROM factions f
          LEFT JOIN faction_sector_popularity fsp ON fsp.faction_id = f.id
          LEFT JOIN sectors s
                 ON s.id = fsp.sector_id
                AND s.nation_id = p_nation_id
                AND s.is_active = TRUE
         WHERE f.nation_id    = p_nation_id
           AND f.faction_type = 'party'
           AND f.abandoned_at IS NULL
         GROUP BY f.id, f.faction_name
    LOOP
        v_total_twp := v_total_twp + v_party.twp;
        v_fractionals := v_fractionals || jsonb_build_object(
            'id', v_party.id::TEXT,
            'faction_name', v_party.faction_name,
            'twp', v_party.twp
        );
    END LOOP;

    -- ---- Convert TWP shares into per-party vote counts ----
    IF v_total_twp = 0 THEN
        -- Fallback: every party at 0 popularity → uniform split.
        FOR v_frac IN SELECT * FROM jsonb_array_elements(v_fractionals)
        LOOP
            v_floored := v_target_votes / GREATEST(1, jsonb_array_length(v_fractionals));
            v_tally := v_tally || jsonb_build_object(v_frac.value->>'id', v_floored);
            v_allocated := v_allocated + v_floored;
        END LOOP;
    ELSE
        FOR v_frac IN SELECT * FROM jsonb_array_elements(v_fractionals)
        LOOP
            v_share := (v_frac.value->>'twp')::NUMERIC / v_total_twp;
            v_exact := v_share * v_target_votes;
            v_floored := FLOOR(v_exact);
            v_tally := v_tally || jsonb_build_object(v_frac.value->>'id', v_floored);
            v_allocated := v_allocated + v_floored;
        END LOOP;

        -- Largest-remainder distribution of leftover votes.
        v_remainder := v_target_votes - v_allocated;
        IF v_remainder > 0 THEN
            FOR v_frac IN
                SELECT
                    val.value->>'id' AS pid,
                    ((val.value->>'twp')::NUMERIC / v_total_twp) * v_target_votes
                        - FLOOR(((val.value->>'twp')::NUMERIC / v_total_twp) * v_target_votes) AS frac
                  FROM jsonb_array_elements(v_fractionals) val
                 ORDER BY frac DESC, (val.value->>'id')::TEXT ASC
                 LIMIT v_remainder
            LOOP
                v_tally := jsonb_set(v_tally, ARRAY[v_frac.pid],
                    to_jsonb(COALESCE((v_tally->>v_frac.pid)::BIGINT, 0) + 1));
            END LOOP;
        END IF;
    END IF;

    -- ---- Total votes (capped at eligible) + abstentions ----
    v_total_votes := 0;
    FOR v_party IN SELECT key, value::BIGINT AS votes FROM jsonb_each_text(v_tally)
    LOOP
        v_total_votes := v_total_votes + v_party.votes;
    END LOOP;
    IF v_total_votes > v_eligible THEN
        v_total_votes := v_eligible;
    END IF;
    v_total_abstentions := GREATEST(0, v_eligible - v_total_votes);

    -- ---- Seat allocation (Largest Remainder / Hare Quota) ----
    v_seats := _election_allocate_seats(v_tally, v_total_votes, v_total_seats);

    -- ---- Build result arrays ----
    FOR v_frac IN SELECT * FROM jsonb_array_elements(v_fractionals)
    LOOP
        DECLARE
            pid TEXT := v_frac.value->>'id';
            pname TEXT := v_frac.value->>'faction_name';
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
        'bloc_details', '[]'::JSONB,
        'total_votes_cast', v_total_votes,
        'total_abstentions', v_total_abstentions,
        'turnout_pct', CASE WHEN v_eligible > 0
            THEN ROUND((v_total_votes::NUMERIC / v_eligible) * 100, 2)
            ELSE 0 END
    );

    -- ---- Zero seats for excluded (inactive) parties ----
    UPDATE factions
       SET seats = 0
     WHERE nation_id    = p_nation_id
       AND faction_type = 'party'
       AND id NOT IN (
           SELECT (je.value->>'party_id')::UUID
             FROM jsonb_array_elements(v_seat_rows) je
       );

    -- ---- Sync seats to participating factions ----
    FOR v_party IN SELECT * FROM jsonb_array_elements(v_seat_rows)
    LOOP
        UPDATE factions
           SET seats = (v_party.value->>'seats')::INT
         WHERE id = (v_party.value->>'party_id')::UUID;
    END LOOP;

    RETURN v_results;
END;
$$;

COMMENT ON FUNCTION run_election(UUID, TEXT) IS
  'Vote share computed from faction_sector_popularity × sectors.weight × sectors.base_turnout (Total Weighted Popularity). Replaces the dead momentum/engagement softmax pipeline. Allocates seats via Largest Remainder / Hare Quota.';
