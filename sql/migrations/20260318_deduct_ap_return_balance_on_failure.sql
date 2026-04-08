-- deduct_ap: return actual AP balance on failure instead of bare -1.
-- On success: returns new balance (>= 0).
-- On failure: returns -(current_ap + 1), so caller decodes via -(val) - 1.

CREATE OR REPLACE FUNCTION deduct_ap(
    p_faction_id UUID,
    p_cost INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_ap INT;
    v_current_ap INT;
BEGIN
    UPDATE factions
    SET action_points = action_points - p_cost
    WHERE id = p_faction_id
      AND action_points >= p_cost
    RETURNING action_points INTO v_new_ap;

    IF NOT FOUND THEN
        SELECT action_points INTO v_current_ap
        FROM factions WHERE id = p_faction_id;
        RETURN -(COALESCE(v_current_ap, 0) + 1);
    END IF;

    RETURN v_new_ap;
END;
$$;
