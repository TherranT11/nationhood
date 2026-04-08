-- Atomic AP deduction: checks balance and deducts in a single statement.
-- Returns the new AP balance (>= 0) on success.
-- On insufficient AP, returns -(current_ap + 1) so the caller can decode the
-- real balance:  actual_ap = -(return_value) - 1.
-- This keeps the DB as the single source of truth for AP.
-- Run this in Supabase SQL editor.

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
        -- Return the actual balance so the client can display it accurately
        SELECT action_points INTO v_current_ap
        FROM factions WHERE id = p_faction_id;
        RETURN -(COALESCE(v_current_ap, 0) + 1);  -- encode as negative
    END IF;

    RETURN v_new_ap;
END;
$$;
