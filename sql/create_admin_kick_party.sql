-- RPC function to properly disband/kick a faction from a nation.
-- Zeros seats, redistributes to remaining parties, nulls nation_id,
-- cleans up child records, and fails orphaned bills.
-- Runs as SECURITY DEFINER (bypasses RLS).
--
-- Run this in Supabase SQL editor (safe to re-run).

DROP FUNCTION IF EXISTS admin_kick_party(uuid, uuid);

CREATE FUNCTION admin_kick_party(p_faction_id UUID, p_nation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
    result     JSONB := '{}'::JSONB;
    cnt        BIGINT;
    v_nation   RECORD;
    v_total    INT;
    v_old_seats INT;
    v_sum      INT;
    v_vacant   INT;
    v_factions RECORD;
    v_quota    NUMERIC;
    v_raw      NUMERIC;
    v_guaranteed INT;
    v_allocated INT := 0;
    v_remaining INT;
    -- Arrays for Largest Remainder redistribution
    v_ids      UUID[];
    v_cur      INT[];
    v_new      INT[];
    v_frac     NUMERIC[];
    v_idx      INT;
    v_best_idx INT;
    v_best_frac NUMERIC;
    i          INT;
    v_len      INT;
BEGIN
    -- ---- 1. Fetch nation ----
    SELECT id, name, total_seats, ruling_faction_id, government_type
    INTO v_nation
    FROM nations WHERE id = p_nation_id;

    IF v_nation IS NULL THEN
        RAISE EXCEPTION 'Nation % not found', p_nation_id;
    END IF;

    v_total := COALESCE(v_nation.total_seats, 120);

    -- ---- 2. Get faction's current seats and zero them ----
    SELECT COALESCE(seats, 0) INTO v_old_seats
    FROM factions WHERE id = p_faction_id;

    UPDATE factions SET seats = 0 WHERE id = p_faction_id;
    result := result || jsonb_build_object('zeroed_seats', v_old_seats);

    -- ---- 3. Redistribute vacant seats (Largest Remainder / Hamilton) ----
    -- Gather remaining parties (excluding the kicked one)
    SELECT array_agg(f.id ORDER BY f.id),
           array_agg(COALESCE(f.seats, 0) ORDER BY f.id)
    INTO v_ids, v_cur
    FROM factions f
    WHERE f.nation_id = p_nation_id
      AND f.faction_type = 'party'
      AND f.id != p_faction_id;

    v_len := COALESCE(array_length(v_ids, 1), 0);

    IF v_len > 0 THEN
        v_sum := 0;
        FOR i IN 1..v_len LOOP
            v_sum := v_sum + v_cur[i];
        END LOOP;

        v_vacant := v_total - v_sum;

        IF v_vacant > 0 THEN
            -- Initialise new-seats and fractional arrays
            v_new  := array_fill(0, ARRAY[v_len]);
            v_frac := array_fill(0.0::NUMERIC, ARRAY[v_len]);
            v_allocated := 0;

            IF v_sum = 0 THEN
                -- Edge case: all at 0 — distribute evenly
                FOR i IN 1..v_len LOOP
                    v_new[i] := v_total / v_len;
                END LOOP;
                v_remaining := v_total - (v_total / v_len) * v_len;
                FOR i IN 1..v_remaining LOOP
                    v_new[i] := v_new[i] + 1;
                END LOOP;
            ELSE
                -- Standard Largest Remainder
                v_quota := v_sum::NUMERIC / v_total;
                FOR i IN 1..v_len LOOP
                    v_raw := v_cur[i]::NUMERIC / v_quota;
                    v_guaranteed := floor(v_raw)::INT;
                    v_new[i] := v_guaranteed;
                    v_frac[i] := v_raw - v_guaranteed;
                    v_allocated := v_allocated + v_guaranteed;
                END LOOP;

                v_remaining := v_total - v_allocated;
                -- Award remaining seats to highest fractional remainders
                FOR r IN 1..v_remaining LOOP
                    v_best_idx := 1;
                    v_best_frac := -1;
                    FOR i IN 1..v_len LOOP
                        IF v_frac[i] > v_best_frac THEN
                            v_best_frac := v_frac[i];
                            v_best_idx := i;
                        END IF;
                    END LOOP;
                    v_new[v_best_idx] := v_new[v_best_idx] + 1;
                    v_frac[v_best_idx] := -1; -- consumed
                END LOOP;
            END IF;

            -- Apply new seat counts
            FOR i IN 1..v_len LOOP
                IF v_new[i] != v_cur[i] THEN
                    UPDATE factions SET seats = v_new[i] WHERE id = v_ids[i];
                END IF;
            END LOOP;

            result := result || jsonb_build_object('seats_redistributed', v_vacant);
        END IF;
    END IF;

    -- ---- 4. Vacate ministries held by this faction ----
    UPDATE ministries
    SET party_id = NULL,
        minister_first_name = NULL,
        minister_last_name = NULL,
        minister_age = NULL
    WHERE nation_id = p_nation_id
      AND party_id = p_faction_id
      AND is_active = true;
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt > 0 THEN result := result || jsonb_build_object('ministries_vacated', cnt); END IF;

    -- ---- 5. Remove from coalition formations ----
    UPDATE government_formations
    SET party_ids = array_remove(party_ids, p_faction_id)
    WHERE nation_id = p_nation_id
      AND p_faction_id = ANY(party_ids)
      AND status IN ('formed', 'caretaker');
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt > 0 THEN result := result || jsonb_build_object('coalitions_updated', cnt); END IF;

    -- ---- 5b. Dissolve active coalitions led by kicked party ----
    DELETE FROM active_coalitions WHERE lead_party_id = p_faction_id;
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt > 0 THEN result := result || jsonb_build_object('active_coalitions_dissolved', cnt); END IF;

    -- ---- 5c. Remove pending coalition proposals ----
    BEGIN
        EXECUTE format('DELETE FROM coalition_proposals WHERE faction_id = %L', p_faction_id);
        GET DIAGNOSTICS cnt = ROW_COUNT;
        IF cnt > 0 THEN result := result || jsonb_build_object('coalition_proposals_removed', cnt); END IF;
    EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
    END;

    -- ---- 6. Fail open bills proposed by this faction ----
    UPDATE bills SET status = 'failed'
    WHERE nation_id = p_nation_id
      AND proposed_by = p_faction_id
      AND status IN ('committee', 'floor');
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt > 0 THEN result := result || jsonb_build_object('bills_failed', cnt); END IF;

    -- ---- 7. Core disband — null nation_id, reset stats ----
    UPDATE factions SET
        nation_id = NULL,
        abandoned_at = now(),
        action_points = 0,
        last_seen_tick = NULL,
        founded_tick = NULL
    WHERE id = p_faction_id;
    result := result || jsonb_build_object('faction_disbanded', true);

    -- ---- 8. Clean up child records ----
    DELETE FROM faction_ideology WHERE faction_id = p_faction_id;
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt > 0 THEN result := result || jsonb_build_object('faction_ideology', cnt); END IF;

    DELETE FROM ideology_history WHERE faction_id = p_faction_id;
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt > 0 THEN result := result || jsonb_build_object('ideology_history', cnt); END IF;

    DELETE FROM bill_comments WHERE faction_id = p_faction_id;
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt > 0 THEN result := result || jsonb_build_object('bill_comments', cnt); END IF;

    DELETE FROM bill_amendment_requests WHERE faction_id = p_faction_id;
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt > 0 THEN result := result || jsonb_build_object('bill_amendment_requests', cnt); END IF;

    DELETE FROM bill_support WHERE faction_id = p_faction_id;
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt > 0 THEN result := result || jsonb_build_object('bill_support', cnt); END IF;

    DELETE FROM campaign_actions WHERE party_id = p_faction_id;
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt > 0 THEN result := result || jsonb_build_object('campaign_actions', cnt); END IF;

    -- These tables may not exist in all deployments, so wrap in exception handlers
    BEGIN
        EXECUTE format('DELETE FROM fundraiser_promises WHERE party_id = %L', p_faction_id);
        GET DIAGNOSTICS cnt = ROW_COUNT;
        IF cnt > 0 THEN result := result || jsonb_build_object('fundraiser_promises', cnt); END IF;
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    BEGIN
        EXECUTE format('DELETE FROM donor_trust WHERE party_id = %L', p_faction_id);
        GET DIAGNOSTICS cnt = ROW_COUNT;
        IF cnt > 0 THEN result := result || jsonb_build_object('donor_trust', cnt); END IF;
    EXCEPTION WHEN undefined_table THEN NULL;
    END;

    RETURN result;
END;
$fn$;
