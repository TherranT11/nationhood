-- ============================================================
-- _seed_electability(faction_id UUID)
--
-- Deterministic electability score (10-60) from a faction UUID.
-- Mirrors the JS seedElectability() function in politics.js.
-- ============================================================
CREATE OR REPLACE FUNCTION _seed_electability(p_faction_id UUID)
RETURNS INT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    v_hex  TEXT;
    v_seed BIGINT;
    v_base INT;
BEGIN
    v_hex := REPLACE(p_faction_id::TEXT, '-', '');
    v_seed := ('x' || SUBSTRING(v_hex FROM 17 FOR 8))::BIT(32)::BIGINT;
    v_base := 20 + (v_seed % 51)::INT;  -- 20-70
    RETURN GREATEST(0, v_base - 10);      -- 10-60
END;
$$;

-- ============================================================
-- run_election(p_nation_id UUID, p_election_type TEXT DEFAULT 'parliamentary')
--
-- Three Pillars election simulation.
--
-- Reads realized_vote_share from faction_electoral_standing (computed
-- each tick by the electorate engine). Converts shares to vote counts,
-- allocates seats via Largest Remainder / Hare Quota, syncs factions.seats.
--
-- No voter_blocs dependency — the electorate engine handles all spatial
-- competition, turnout, and ideology alignment internally.
-- ============================================================

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
    v_standing      RECORD;
    v_exact         NUMERIC;
    v_floored       BIGINT;
    v_allocated     BIGINT := 0;
    v_fractionals   JSONB := '[]'::JSONB;
    v_remainder     BIGINT;
    v_frac          RECORD;
    v_election_type TEXT := LOWER(COALESCE(p_election_type, 'parliamentary'));
    v_results       JSONB;
    v_total_realized NUMERIC := 0;
    v_target_votes  BIGINT;
    v_current_tick  INT;
    v_coalition     RECORD;
    v_coalition_ids UUID[];
    v_bonus_pct     NUMERIC;
    v_bonus_seats   INT;
    v_opp_ids       UUID[];
    v_total_opp     INT;
    v_to_transfer   INT;
    v_transferred   INT;
    v_reg_threshold INT;
    v_min_seats     INT;
    v_seats_freed   INT;
    v_total_surv    INT;
    v_gain          INT;
    v_dist          INT;
    v_idx           INT;
    v_pcount        INT;
BEGIN
    IF v_election_type NOT IN ('parliamentary', 'presidential') THEN
        RAISE EXCEPTION 'Invalid election type: % (allowed: parliamentary, presidential)', p_election_type;
    END IF;

    -- ---- Load nation ----
    SELECT id, name, total_seats, population, eligible_voters,
           electoral_commission_reform, party_registration_threshold
    INTO v_nation
    FROM nations
    WHERE id = p_nation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Nation not found: %', p_nation_id;
    END IF;

    v_total_seats := COALESCE(v_nation.total_seats, 120);
    v_eligible := COALESCE(v_nation.eligible_voters, 0);

    SELECT COALESCE(current_tick, 0) INTO v_current_tick
    FROM shard WHERE name = 'Alpha Shard';

    -- ---- Load parties with electoral standings ----
    -- Join factions → faction_electoral_standing to get realized_vote_share
    FOR v_party IN
        SELECT
            f.id,
            f.faction_name,
            COALESCE(fes.contested_vote_share, 0) AS contested_vote_share,
            COALESCE(fes.turnout_rate, 0.65) AS turnout_rate,
            COALESCE(fes.party_approval, 0) AS party_approval
        FROM factions f
        LEFT JOIN faction_electoral_standing fes
            ON fes.faction_id = f.id AND fes.nation_id = p_nation_id
        WHERE f.nation_id = p_nation_id
          AND f.faction_type = 'party'
          AND f.abandoned_at IS NULL
    LOOP
        -- Convert contested_vote_share × turnout_rate to actual vote count
        -- (realized_vote_share is renormalized to sum=1, which gives ~100% turnout)
        v_exact := v_eligible::NUMERIC * v_party.contested_vote_share * v_party.turnout_rate;
        v_floored := FLOOR(v_exact);

        v_tally := v_tally || jsonb_build_object(v_party.id::TEXT, v_floored);
        v_allocated := v_allocated + v_floored;
        v_total_realized := v_total_realized + (v_party.contested_vote_share * v_party.turnout_rate);

        v_fractionals := v_fractionals || jsonb_build_object(
            'id', v_party.id::TEXT,
            'frac', v_exact - v_floored,
            'faction_name', v_party.faction_name,
            'party_approval', v_party.party_approval
        );
    END LOOP;

    -- Distribute remainder votes via largest remainder
    v_target_votes := ROUND(v_eligible * LEAST(1, v_total_realized));
    v_remainder := v_target_votes - v_allocated;

    IF v_remainder > 0 THEN
        FOR v_frac IN
            SELECT value->>'id' AS pid
            FROM jsonb_array_elements(v_fractionals)
            ORDER BY (value->>'frac')::NUMERIC DESC
            LIMIT v_remainder
        LOOP
            v_tally := jsonb_set(v_tally, ARRAY[v_frac.pid],
                to_jsonb(COALESCE((v_tally->>v_frac.pid)::BIGINT, 0) + 1));
        END LOOP;
    END IF;

    -- ---- Calculate total votes ----
    v_total_votes := 0;
    FOR v_party IN SELECT key, value::BIGINT AS votes FROM jsonb_each_text(v_tally)
    LOOP
        v_total_votes := v_total_votes + v_party.votes;
    END LOOP;

    v_total_abstentions := GREATEST(0, v_eligible - v_total_votes);

    -- ---- Allocate seats (Largest Remainder / Hare Quota) ----
    v_seats := _election_allocate_seats(v_tally, v_total_votes, v_total_seats);

    -- ---- Electoral Commission Reform: ruling coalition seat bonus ----
    IF v_nation.electoral_commission_reform THEN
        SELECT ARRAY(
            SELECT unnest(party_ids)
            FROM government_formations
            WHERE nation_id = p_nation_id
              AND status IN ('formed', 'caretaker')
            ORDER BY created_at DESC
            LIMIT 1
        ) INTO v_coalition_ids;

        IF v_coalition_ids IS NOT NULL AND array_length(v_coalition_ids, 1) > 0 THEN
            -- Random 5–10% bonus using tick-seeded determinism
            v_bonus_pct := 0.05 + (((v_current_tick * 2654435761) % 1000)::NUMERIC / 1000.0) * 0.05;
            v_bonus_seats := ROUND(v_total_seats * v_bonus_pct)::INT;

            IF v_bonus_seats > 0 THEN
                -- Sum opposition seats
                v_total_opp := 0;
                FOR v_frac IN SELECT key AS pid FROM jsonb_each_text(v_seats)
                LOOP
                    IF NOT (v_frac.pid::UUID = ANY(v_coalition_ids)) THEN
                        v_total_opp := v_total_opp + COALESCE((v_seats->>v_frac.pid)::INT, 0);
                    END IF;
                END LOOP;

                IF v_total_opp > 0 THEN
                    v_to_transfer := LEAST(v_bonus_seats, v_total_opp);
                    v_transferred := 0;

                    -- Subtract proportionally from opposition
                    FOR v_frac IN SELECT key AS pid FROM jsonb_each_text(v_seats)
                    LOOP
                        IF NOT (v_frac.pid::UUID = ANY(v_coalition_ids)) THEN
                            DECLARE
                                cur_seats INT := COALESCE((v_seats->>v_frac.pid)::INT, 0);
                                loss INT;
                            BEGIN
                                IF cur_seats > 0 THEN
                                    loss := LEAST(ROUND(v_to_transfer::NUMERIC * cur_seats / v_total_opp)::INT, cur_seats);
                                    v_seats := jsonb_set(v_seats, ARRAY[v_frac.pid], to_jsonb(cur_seats - loss));
                                    v_transferred := v_transferred + loss;
                                END IF;
                            END;
                        END IF;
                    END LOOP;

                    -- Distribute to coalition proportionally
                    v_total_surv := 0;
                    FOR v_frac IN SELECT key AS pid FROM jsonb_each_text(v_seats)
                    LOOP
                        IF v_frac.pid::UUID = ANY(v_coalition_ids) THEN
                            v_total_surv := v_total_surv + COALESCE((v_seats->>v_frac.pid)::INT, 0);
                        END IF;
                    END LOOP;

                    v_dist := 0;
                    v_pcount := array_length(v_coalition_ids, 1);
                    v_idx := 0;
                    FOR v_frac IN SELECT key AS pid FROM jsonb_each_text(v_seats)
                    LOOP
                        IF v_frac.pid::UUID = ANY(v_coalition_ids) THEN
                            v_idx := v_idx + 1;
                            DECLARE
                                cur_seats INT := COALESCE((v_seats->>v_frac.pid)::INT, 0);
                            BEGIN
                                IF v_idx = v_pcount THEN
                                    v_gain := v_transferred - v_dist;
                                ELSIF v_total_surv > 0 THEN
                                    v_gain := ROUND(v_transferred::NUMERIC * cur_seats / v_total_surv)::INT;
                                ELSE
                                    v_gain := ROUND(v_transferred::NUMERIC / v_pcount)::INT;
                                END IF;
                                v_seats := jsonb_set(v_seats, ARRAY[v_frac.pid], to_jsonb(cur_seats + v_gain));
                                v_dist := v_dist + v_gain;
                            END;
                        END IF;
                    END LOOP;
                END IF;
            END IF;
        END IF;
    END IF;

    -- ---- Political Party Registration Act: reallocate seats below threshold ----
    v_reg_threshold := COALESCE(v_nation.party_registration_threshold, 0);
    IF v_reg_threshold > 0 THEN
        v_min_seats := CEIL(v_total_seats::NUMERIC * v_reg_threshold / 100)::INT;
        v_seats_freed := 0;

        -- Zero out parties below threshold and mark them as disbanded
        FOR v_frac IN SELECT key AS pid FROM jsonb_each_text(v_seats)
        LOOP
            DECLARE
                cur_seats INT := COALESCE((v_seats->>v_frac.pid)::INT, 0);
            BEGIN
                IF cur_seats > 0 AND cur_seats < v_min_seats THEN
                    v_seats_freed := v_seats_freed + cur_seats;
                    v_seats := jsonb_set(v_seats, ARRAY[v_frac.pid], to_jsonb(0));
                    -- C3 fix: mark faction as registration_act_disbanded
                    UPDATE factions
                    SET registration_act_disbanded = true
                    WHERE id = v_frac.pid::UUID;
                END IF;
            END;
        END LOOP;

        IF v_seats_freed > 0 THEN
            -- Redistribute freed seats proportionally to survivors
            v_total_surv := 0;
            FOR v_frac IN SELECT key AS pid FROM jsonb_each_text(v_seats)
            LOOP
                v_total_surv := v_total_surv + COALESCE((v_seats->>v_frac.pid)::INT, 0);
            END LOOP;

            v_dist := 0;
            v_pcount := (SELECT COUNT(*) FROM jsonb_each_text(v_seats) WHERE value::INT > 0);
            v_idx := 0;
            FOR v_frac IN SELECT key AS pid FROM jsonb_each_text(v_seats) WHERE value::INT > 0
            LOOP
                v_idx := v_idx + 1;
                DECLARE
                    cur_seats INT := COALESCE((v_seats->>v_frac.pid)::INT, 0);
                BEGIN
                    IF v_idx = v_pcount THEN
                        v_gain := v_seats_freed - v_dist;
                    ELSIF v_total_surv > 0 THEN
                        v_gain := ROUND(v_seats_freed::NUMERIC * cur_seats / v_total_surv)::INT;
                    ELSE
                        v_gain := ROUND(v_seats_freed::NUMERIC / v_pcount)::INT;
                    END IF;
                    v_seats := jsonb_set(v_seats, ARRAY[v_frac.pid], to_jsonb(cur_seats + v_gain));
                    v_dist := v_dist + v_gain;
                END;
            END LOOP;
        END IF;
    END IF;

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
    WHERE nation_id = p_nation_id
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
