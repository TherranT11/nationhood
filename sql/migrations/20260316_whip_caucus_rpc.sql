-- ============================================================
-- whip_caucus RPC — Server-side caucus whip action
-- Replaces client-side direct table updates with a secure,
-- atomic server-side function.
-- ============================================================

CREATE OR REPLACE FUNCTION whip_caucus(
    p_faction_id UUID,
    p_caucus_faction_id UUID,
    p_bill_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caucus RECORD;
    v_disp RECORD;
    v_ap_cost INT;
    v_new_ap INT;
    v_new_rel INT;
    v_withheld INT;
    v_whip_large_threshold NUMERIC := 0.20;
    v_whip_ap_cost_base INT := 1;
    v_whip_ap_cost_large INT := 2;
    v_rel_whip INT := 3;
BEGIN
    -- Ownership check: only the faction's own player can whip
    IF auth.uid() IS NOT NULL AND p_faction_id != auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
    END IF;

    -- 1. Load and verify caucus faction
    SELECT id, party_id, name, seat_share, relationship_score
    INTO v_caucus
    FROM caucus_factions
    WHERE id = p_caucus_faction_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Caucus faction not found or inactive');
    END IF;

    IF v_caucus.party_id != p_faction_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Caucus faction does not belong to your party');
    END IF;

    -- 2. Load and verify disposition
    SELECT id, disposition, whipped
    INTO v_disp
    FROM caucus_dispositions
    WHERE caucus_faction_id = p_caucus_faction_id AND bill_id = p_bill_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No disposition found for this caucus on this bill');
    END IF;

    IF v_disp.disposition != 'nervous' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot whip a caucus that is ' || v_disp.disposition);
    END IF;

    IF v_disp.whipped THEN
        RETURN jsonb_build_object('success', false, 'error', 'This caucus has already been whipped on this bill');
    END IF;

    -- 3. Determine AP cost
    IF v_caucus.seat_share > v_whip_large_threshold THEN
        v_ap_cost := v_whip_ap_cost_large;
    ELSE
        v_ap_cost := v_whip_ap_cost_base;
    END IF;

    -- 4. Deduct AP (atomic)
    UPDATE factions
    SET action_points = action_points - v_ap_cost
    WHERE id = p_faction_id
      AND action_points >= v_ap_cost
    RETURNING action_points INTO v_new_ap;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient AP');
    END IF;

    -- 5. Update disposition to aligned + whipped
    UPDATE caucus_dispositions
    SET disposition = 'aligned', whipped = true, votes_affected = 0
    WHERE id = v_disp.id;

    -- 6. Update relationship score
    v_new_rel := LEAST(100, v_caucus.relationship_score + v_rel_whip);
    UPDATE caucus_factions
    SET relationship_score = v_new_rel
    WHERE id = p_caucus_faction_id;

    -- 7. Recalculate bill's caucus_votes_withheld
    SELECT COALESCE(SUM(votes_affected), 0) INTO v_withheld
    FROM caucus_dispositions
    WHERE bill_id = p_bill_id
      AND disposition = 'opposed'
      AND whipped = false;

    UPDATE bills
    SET caucus_votes_withheld = v_withheld
    WHERE id = p_bill_id;

    RETURN jsonb_build_object(
        'success', true,
        'ap_cost', v_ap_cost,
        'new_ap', v_new_ap,
        'new_relationship', v_new_rel
    );
END;
$$;

GRANT EXECUTE ON FUNCTION whip_caucus(UUID, UUID, UUID) TO authenticated;

-- ============================================================
-- Tighten RLS: remove direct UPDATE for authenticated users
-- Only service_role and the RPC (SECURITY DEFINER) can write.
-- ============================================================

DROP POLICY IF EXISTS caucus_factions_update ON caucus_factions;
DROP POLICY IF EXISTS caucus_dispositions_update ON caucus_dispositions;
