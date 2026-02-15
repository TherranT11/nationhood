-- Atomic AP deduction: checks balance and deducts in a single statement.
-- Returns the new AP balance, or -1 if insufficient funds.
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
BEGIN
    UPDATE factions
    SET action_points = action_points - p_cost
    WHERE id = p_faction_id
      AND action_points >= p_cost
    RETURNING action_points INTO v_new_ap;

    IF NOT FOUND THEN
        RETURN -1;  -- insufficient AP
    END IF;

    RETURN v_new_ap;
END;
$$;
