-- Strike acceptance: lock support for factions whose strikes were accepted,
-- and track struck policy IDs so they can't be re-added.

-- 1. Add locked flag to bill_support
ALTER TABLE bill_support ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT false;

-- 2. Add struck_policy_ids to bills (tracks policies removed via accepted strikes)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS struck_policy_ids UUID[] DEFAULT '{}';

-- 3. Update convert_conditional_vote to set locked = true
CREATE OR REPLACE FUNCTION convert_conditional_vote(
    p_bill_id UUID,
    p_faction_id UUID,
    p_seat_count INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Only the bill proposer can convert conditional votes
    IF NOT EXISTS (
        SELECT 1 FROM bills
        WHERE id = p_bill_id AND proposed_by = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only the bill proposer can convert conditional votes';
    END IF;

    -- Target faction must have an existing conditional vote
    IF NOT EXISTS (
        SELECT 1 FROM bill_support
        WHERE bill_id = p_bill_id AND faction_id = p_faction_id AND stance = 'conditional'
    ) THEN
        RAISE EXCEPTION 'No conditional vote found for this faction';
    END IF;

    UPDATE bill_support
    SET stance = 'accept', seat_count = p_seat_count, locked = true
    WHERE bill_id = p_bill_id AND faction_id = p_faction_id;
END;
$$;

ALTER FUNCTION convert_conditional_vote(UUID, UUID, INT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION convert_conditional_vote(UUID, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION convert_conditional_vote(UUID, UUID, INT) TO service_role;
