-- ══════════════════════════════════════════════════════════════
-- Atomic seat-change RPC for foundational bills (and any other path
-- that needs to resize a parliament).
--
-- Replaces the JS-side multi-statement loop in bills.js that updated
-- nations.total_seats and then UPDATEd each faction.seats one at a
-- time. Any failure in the middle of that loop left total_seats and
-- the per-faction seats out of sync (the bug that produced
-- "100 total seats / parties summing to 500" reports).
--
-- All work happens inside a single transaction:
--   1. Lock the nations row so concurrent enactments serialize.
--   2. Update nations.total_seats.
--   3. Pick the redistribution method:
--      - election_votes:        last completed parliamentary election's vote totals
--      - proportional_existing: scale current faction.seats to the new total
--      - even_distribution:     all parties were at 0 seats; spread evenly
--      - no_parties:            no party factions exist; total_seats only
--   4. Apply Largest Remainder (Hare Quota) so the per-faction
--      integer seats sum to exactly p_new_total_seats.
-- If any UPDATE in step 3 errors, the entire transaction rolls back —
-- nations.total_seats reverts and faction.seats stays untouched.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION enact_seat_change(
    p_nation_id        UUID,
    p_new_total_seats  INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_total      INT;
    v_results        JSONB;
    v_votes          JSONB;
    v_total_votes    BIGINT := 0;
    v_old_sum        BIGINT := 0;
    v_quota          NUMERIC;
    v_guaranteed     INT;
    v_allocated      INT := 0;
    v_fractionals    JSONB := '[]'::JSONB;
    v_remaining      INT;
    v_party          RECORD;
    v_method         TEXT;
    v_party_count    INT;
    v_per            INT;
    v_rem            INT;
    v_idx            INT;
BEGIN
    IF p_new_total_seats IS NULL OR p_new_total_seats <= 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'p_new_total_seats must be a positive integer');
    END IF;

    -- ── 1. Lock nation row + capture old total ──
    SELECT total_seats INTO v_old_total
    FROM nations
    WHERE id = p_nation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Nation not found');
    END IF;

    -- ── 2. Update total_seats ──
    UPDATE nations SET total_seats = p_new_total_seats WHERE id = p_nation_id;

    IF v_old_total = p_new_total_seats THEN
        RETURN jsonb_build_object(
            'success', true,
            'method', 'no_change',
            'old_total_seats', v_old_total,
            'new_total_seats', p_new_total_seats
        );
    END IF;

    -- ── 3a. Try election-vote redistribution ──
    SELECT results INTO v_results
    FROM elections
    WHERE nation_id = p_nation_id
      AND status = 'completed'
      AND election_type = 'parliamentary'
    ORDER BY election_tick DESC
    LIMIT 1;

    IF v_results IS NOT NULL AND v_results ? 'votes' THEN
        v_votes := v_results -> 'votes';

        -- Tally total votes from either array form ([{party_id, votes}, ...])
        -- or object form ({party_id: votes, ...}).
        IF jsonb_typeof(v_votes) = 'array' THEN
            SELECT COALESCE(SUM(COALESCE((e ->> 'votes')::BIGINT, 0)), 0)
            INTO v_total_votes
            FROM jsonb_array_elements(v_votes) e;
        ELSIF jsonb_typeof(v_votes) = 'object' THEN
            SELECT COALESCE(SUM(COALESCE(value::TEXT::BIGINT, 0)), 0)
            INTO v_total_votes
            FROM jsonb_each(v_votes);
        END IF;

        IF v_total_votes > 0 THEN
            -- Zero-out every party first so anyone with no votes ends at 0.
            UPDATE factions SET seats = 0
            WHERE nation_id = p_nation_id AND faction_type = 'party';

            v_allocated := 0;
            v_fractionals := '[]'::JSONB;

            IF jsonb_typeof(v_votes) = 'array' THEN
                FOR v_party IN
                    SELECT (e ->> 'party_id')::UUID AS id,
                           COALESCE((e ->> 'votes')::BIGINT, 0) AS votes
                    FROM jsonb_array_elements(v_votes) e
                LOOP
                    IF v_party.votes <= 0 THEN CONTINUE; END IF;
                    v_quota := (v_party.votes::NUMERIC / v_total_votes) * p_new_total_seats;
                    v_guaranteed := FLOOR(v_quota)::INT;
                    v_allocated := v_allocated + v_guaranteed;
                    UPDATE factions SET seats = v_guaranteed
                    WHERE id = v_party.id AND nation_id = p_nation_id;
                    v_fractionals := v_fractionals || jsonb_build_object(
                        'id',   v_party.id::text,
                        'frac', v_quota - v_guaranteed
                    );
                END LOOP;
            ELSE
                FOR v_party IN
                    SELECT (key)::UUID AS id,
                           COALESCE(value::TEXT::BIGINT, 0) AS votes
                    FROM jsonb_each(v_votes)
                LOOP
                    IF v_party.votes <= 0 THEN CONTINUE; END IF;
                    v_quota := (v_party.votes::NUMERIC / v_total_votes) * p_new_total_seats;
                    v_guaranteed := FLOOR(v_quota)::INT;
                    v_allocated := v_allocated + v_guaranteed;
                    UPDATE factions SET seats = v_guaranteed
                    WHERE id = v_party.id AND nation_id = p_nation_id;
                    v_fractionals := v_fractionals || jsonb_build_object(
                        'id',   v_party.id::text,
                        'frac', v_quota - v_guaranteed
                    );
                END LOOP;
            END IF;

            v_remaining := p_new_total_seats - v_allocated;
            IF v_remaining > 0 THEN
                FOR v_party IN
                    SELECT (val ->> 'id')::UUID AS id
                    FROM jsonb_array_elements(v_fractionals) val
                    ORDER BY (val ->> 'frac')::NUMERIC DESC, (val ->> 'id')::TEXT ASC
                    LIMIT v_remaining
                LOOP
                    UPDATE factions SET seats = seats + 1
                    WHERE id = v_party.id AND nation_id = p_nation_id;
                END LOOP;
            END IF;

            v_method := 'election_votes';
        END IF;
    END IF;

    -- ── 3b. Fallback: proportional rescale of existing seats ──
    IF v_method IS NULL THEN
        SELECT COALESCE(SUM(seats), 0) INTO v_old_sum
        FROM factions
        WHERE nation_id = p_nation_id AND faction_type = 'party';

        SELECT COUNT(*) INTO v_party_count
        FROM factions
        WHERE nation_id = p_nation_id AND faction_type = 'party';

        IF v_party_count = 0 THEN
            v_method := 'no_parties';
        ELSIF v_old_sum = 0 THEN
            -- Distribute evenly when nobody had any seats to scale from.
            v_per := p_new_total_seats / v_party_count;
            v_rem := p_new_total_seats - v_per * v_party_count;
            v_idx := 0;
            FOR v_party IN
                SELECT id FROM factions
                WHERE nation_id = p_nation_id AND faction_type = 'party'
                ORDER BY id
            LOOP
                UPDATE factions
                SET seats = v_per + (CASE WHEN v_idx < v_rem THEN 1 ELSE 0 END)
                WHERE id = v_party.id;
                v_idx := v_idx + 1;
            END LOOP;
            v_method := 'even_distribution';
        ELSE
            v_allocated := 0;
            v_fractionals := '[]'::JSONB;

            -- Zero out anyone who had 0 seats already (they stay at 0).
            FOR v_party IN
                SELECT id, seats FROM factions
                WHERE nation_id = p_nation_id AND faction_type = 'party' AND seats > 0
                ORDER BY seats DESC, id
            LOOP
                v_quota := (v_party.seats::NUMERIC / v_old_sum) * p_new_total_seats;
                v_guaranteed := FLOOR(v_quota)::INT;
                v_allocated := v_allocated + v_guaranteed;
                UPDATE factions SET seats = v_guaranteed WHERE id = v_party.id;
                v_fractionals := v_fractionals || jsonb_build_object(
                    'id',   v_party.id::text,
                    'frac', v_quota - v_guaranteed
                );
            END LOOP;

            v_remaining := p_new_total_seats - v_allocated;
            IF v_remaining > 0 THEN
                FOR v_party IN
                    SELECT (val ->> 'id')::UUID AS id
                    FROM jsonb_array_elements(v_fractionals) val
                    ORDER BY (val ->> 'frac')::NUMERIC DESC, (val ->> 'id')::TEXT ASC
                    LIMIT v_remaining
                LOOP
                    UPDATE factions SET seats = seats + 1 WHERE id = v_party.id;
                END LOOP;
            END IF;

            v_method := 'proportional_existing';
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'method', v_method,
        'old_total_seats', v_old_total,
        'new_total_seats', p_new_total_seats
    );
END;
$$;

GRANT EXECUTE ON FUNCTION enact_seat_change(UUID, INT) TO authenticated, service_role;

COMMENT ON FUNCTION enact_seat_change(UUID, INT) IS
  'Atomically resizes a nation parliament. Updates nations.total_seats and rescales every party faction.seats in a single transaction so the two cannot drift. Picks redistribution method in order: last-election vote totals → proportional rescale of existing seats → even distribution → no-op (no parties). Uses Largest Remainder (Hare Quota) to keep integer sums exact.';
