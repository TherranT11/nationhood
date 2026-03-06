-- RPC to reset all votes on a budget bill when allocations are amended on the floor.
-- Only callable for budget bills that are currently on the floor.
-- Resets bill_support records and vote tallies.

CREATE OR REPLACE FUNCTION reset_budget_floor_votes(p_bill_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_bill RECORD;
BEGIN
    -- Verify the bill exists, is a budget bill, and is on the floor
    SELECT id, bill_type, status INTO v_bill
    FROM bills WHERE id = p_bill_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bill not found';
    END IF;

    IF v_bill.bill_type != 'budget' THEN
        RAISE EXCEPTION 'Only budget bills can have floor votes reset';
    END IF;

    IF v_bill.status != 'floor' THEN
        RAISE EXCEPTION 'Bill must be on the floor to reset votes';
    END IF;

    -- Delete all bill_support records (votes)
    DELETE FROM bill_support WHERE bill_id = p_bill_id;

    -- Reset vote tallies and early resolution status
    UPDATE bills SET
        votes_for = 0,
        votes_against = 0,
        votes_abstain = 0,
        early_resolution_status = NULL,
        early_resolution_tick = NULL,
        voting_ends_tick = NULL
    WHERE id = p_bill_id;
END;
$$;

ALTER FUNCTION reset_budget_floor_votes(UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION reset_budget_floor_votes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_budget_floor_votes(UUID) TO service_role;
