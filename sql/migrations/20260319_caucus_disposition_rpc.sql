-- ============================================================
-- calculate_caucus_dispositions RPC
-- Server-side calculation of caucus dispositions for a bill
-- entering the floor. Called from client via supabase.rpc().
-- Runs as SECURITY DEFINER so it can write to caucus_dispositions
-- and bills.caucus_votes_withheld (which authenticated users cannot).
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_caucus_dispositions(p_bill_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_bill RECORD;
    v_caucus RECORD;
    v_coalition_party_ids UUID[];
    v_party_seats INT;
    v_axis_scores JSONB := '{}'::jsonb;
    v_primary_axis TEXT := NULL;
    v_max_abs NUMERIC := 0;
    v_tag TEXT;
    v_axis_key TEXT;
    v_direction INT;
    v_bill_score NUMERIC;
    v_favored_direction INT;
    v_effective_score NUMERIC;
    v_is_secondary BOOLEAN;
    v_rel_modifier NUMERIC;
    v_is_governing BOOLEAN;
    v_gov_mod NUMERIC;
    v_effective_nervous NUMERIC;
    v_effective_aligned NUMERIC;
    v_disposition TEXT;
    v_votes_affected INT;
    v_total_withheld INT := 0;
    v_disp_count INT := 0;
    -- Config constants (mirror CAUCUS_CONFIG in caucus.js)
    c_threshold_aligned NUMERIC := 0;
    c_threshold_nervous NUMERIC := -15;
    c_threshold_range NUMERIC := 20;
    c_non_governing_mod NUMERIC := 0.85;
BEGIN
    -- 1. Load the bill
    SELECT id, nation_id INTO v_bill
    FROM bills WHERE id = p_bill_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bill not found');
    END IF;

    -- 2. Extract ideology tags from bill_articles → policies
    --    Map each tag to axis_key + direction, sum per axis
    FOR v_tag IN
        SELECT UPPER(tag) FROM (
            SELECT jsonb_array_elements_text(p.ideologies) AS tag
            FROM bill_articles ba
            JOIN policies p ON p.id = ba.policy_id
            WHERE ba.bill_id = p_bill_id
              AND p.ideologies IS NOT NULL
              AND jsonb_typeof(p.ideologies) = 'array'
              AND jsonb_array_length(p.ideologies) > 0
            UNION ALL
            SELECT p.ideology AS tag
            FROM bill_articles ba
            JOIN policies p ON p.id = ba.policy_id
            WHERE ba.bill_id = p_bill_id
              AND (p.ideologies IS NULL OR jsonb_typeof(p.ideologies) != 'array' OR jsonb_array_length(p.ideologies) = 0)
              AND p.ideology IS NOT NULL
              AND p.ideology != ''
        ) sub
    LOOP
        -- Map ideology tag to axis + direction
        v_axis_key := CASE v_tag
            WHEN 'LIBERTY'         THEN 'liberty_equality'
            WHEN 'EQUALITY'        THEN 'liberty_equality'
            WHEN 'TRADITION'       THEN 'tradition_progress'
            WHEN 'PROGRESS'        THEN 'tradition_progress'
            WHEN 'SECURITY'        THEN 'security_freedom'
            WHEN 'FREEDOM'         THEN 'security_freedom'
            WHEN 'GLOBALISM'       THEN 'globalism_nationalism'
            WHEN 'NATIONALISM'     THEN 'globalism_nationalism'
            WHEN 'INDIVIDUALISM'   THEN 'individualism_collectivism'
            WHEN 'COLLECTIVISM'    THEN 'individualism_collectivism'
            ELSE NULL
        END;

        IF v_axis_key IS NULL THEN CONTINUE; END IF;

        v_direction := CASE v_tag
            WHEN 'LIBERTY'       THEN -1
            WHEN 'EQUALITY'      THEN  1
            WHEN 'TRADITION'     THEN -1
            WHEN 'PROGRESS'      THEN  1
            WHEN 'SECURITY'      THEN -1
            WHEN 'FREEDOM'       THEN  1
            WHEN 'GLOBALISM'     THEN -1
            WHEN 'NATIONALISM'   THEN  1
            WHEN 'INDIVIDUALISM' THEN -1
            WHEN 'COLLECTIVISM'  THEN  1
            ELSE 0
        END;

        v_axis_scores := jsonb_set(
            v_axis_scores,
            ARRAY[v_axis_key],
            to_jsonb(COALESCE((v_axis_scores->>v_axis_key)::numeric, 0) + v_direction)
        );
    END LOOP;

    -- 3. Find primary axis (highest absolute score)
    SELECT key, abs(val) INTO v_primary_axis, v_max_abs
    FROM (
        SELECT key, (value)::numeric AS val
        FROM jsonb_each_text(v_axis_scores)
    ) sub
    ORDER BY abs(val) DESC
    LIMIT 1;

    -- No ideology content → no caucus impact
    IF v_primary_axis IS NULL OR v_max_abs = 0 THEN
        RETURN jsonb_build_object('success', true, 'dispositions', 0, 'withheld', 0);
    END IF;

    -- 4. Load governing coalition party_ids
    SELECT party_ids INTO v_coalition_party_ids
    FROM active_coalitions
    WHERE nation_id = v_bill.nation_id
      AND dissolved_at IS NULL
    ORDER BY formed_at DESC
    LIMIT 1;

    -- 5. Process each active caucus faction
    FOR v_caucus IN
        SELECT cf.id, cf.party_id, cf.dominant_axis, cf.wing_end,
               cf.seat_share, cf.relationship_score
        FROM caucus_factions cf
        WHERE cf.nation_id = v_bill.nation_id
          AND cf.is_active = true
    LOOP
        v_bill_score := COALESCE((v_axis_scores->>v_caucus.dominant_axis)::numeric, 0);

        -- Bill doesn't touch this axis → not triggered
        IF v_bill_score = 0 THEN
            INSERT INTO caucus_dispositions (caucus_faction_id, bill_id, disposition, votes_affected, whipped)
            VALUES (v_caucus.id, p_bill_id, 'not_triggered', 0, false)
            ON CONFLICT (caucus_faction_id, bill_id)
            DO UPDATE SET disposition = 'not_triggered', votes_affected = 0, whipped = false;
            v_disp_count := v_disp_count + 1;
            CONTINUE;
        END IF;

        -- Determine direction preference
        v_favored_direction := CASE WHEN v_caucus.wing_end = 'left' THEN -1 ELSE 1 END;
        v_effective_score := v_bill_score * v_favored_direction;

        -- Secondary axis check
        v_is_secondary := v_caucus.dominant_axis != v_primary_axis;

        -- Relationship modifier
        v_rel_modifier := (v_caucus.relationship_score - 50.0) / 100.0 * c_threshold_range;

        -- Governing modifier
        v_is_governing := v_coalition_party_ids IS NOT NULL
                          AND v_caucus.party_id = ANY(v_coalition_party_ids);
        v_gov_mod := CASE WHEN v_is_governing THEN 1.0 ELSE c_non_governing_mod END;

        v_effective_nervous := (c_threshold_nervous + v_rel_modifier) * v_gov_mod;
        v_effective_aligned := c_threshold_aligned + v_rel_modifier;

        -- Determine disposition
        IF v_caucus.relationship_score = 0 THEN
            v_disposition := 'opposed';
        ELSIF v_effective_score >= v_effective_aligned THEN
            v_disposition := 'aligned';
        ELSIF v_effective_score >= v_effective_nervous OR v_is_secondary THEN
            v_disposition := 'nervous';
        ELSE
            v_disposition := 'opposed';
        END IF;

        -- Calculate votes affected
        IF v_disposition IN ('not_triggered', 'aligned') THEN
            v_votes_affected := 0;
        ELSE
            SELECT COALESCE(f.seats, 0) INTO v_party_seats
            FROM factions f WHERE f.id = v_caucus.party_id;
            v_votes_affected := ROUND(v_party_seats * v_caucus.seat_share);
        END IF;

        -- Upsert disposition
        INSERT INTO caucus_dispositions (caucus_faction_id, bill_id, disposition, votes_affected, whipped)
        VALUES (v_caucus.id, p_bill_id, v_disposition, v_votes_affected, false)
        ON CONFLICT (caucus_faction_id, bill_id)
        DO UPDATE SET disposition = v_disposition, votes_affected = v_votes_affected, whipped = false;

        IF v_disposition = 'opposed' THEN
            v_total_withheld := v_total_withheld + v_votes_affected;
        END IF;

        v_disp_count := v_disp_count + 1;
    END LOOP;

    -- 6. Update the bill's cached withheld count
    UPDATE bills SET caucus_votes_withheld = v_total_withheld WHERE id = p_bill_id;

    RETURN jsonb_build_object(
        'success', true,
        'dispositions', v_disp_count,
        'withheld', v_total_withheld
    );
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_caucus_dispositions(UUID) TO authenticated;
