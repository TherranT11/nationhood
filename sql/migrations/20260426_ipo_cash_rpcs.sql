-- ═══════════════════════════════════════════════════════════════════════════════
-- IPO CASH RPCs
-- ═══════════════════════════════════════════════════════════════════════════════
-- Background:
--   factions has an RLS policy `id = auth.uid()`, so a player can only update
--   their own row. International Party Organisation flows need to:
--     • credit cash to a different faction (back-channel transfer recipient,
--       fund-draw vote winner)
--     • debit the org's solidarity fund from any active member (not just the
--       president, who is the only auth.uid() that international_orgs RLS
--       permits to update)
--
--   Without these helpers the client-side updates would silently no-op under
--   RLS, leaving cash to disappear. These SECURITY DEFINER functions bypass
--   RLS while enforcing equivalent membership checks themselves.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ipo_credit_party_funds ──
-- Credit cash to a target faction. Caller must be an active member of the
-- given org, and the target must also be an active member.
CREATE OR REPLACE FUNCTION ipo_credit_party_funds(
    p_target_faction_id uuid,
    p_amount            bigint,
    p_org_id            uuid
) RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller        uuid := auth.uid();
    v_caller_member boolean;
    v_target_member boolean;
    v_new_funds     bigint;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM ipo_members
        WHERE org_id = p_org_id
          AND faction_id = v_caller
          AND is_active = true
    ) INTO v_caller_member;
    IF NOT v_caller_member THEN
        RAISE EXCEPTION 'Caller is not an active member of this organisation';
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM ipo_members
        WHERE org_id = p_org_id
          AND faction_id = p_target_faction_id
          AND is_active = true
    ) INTO v_target_member;
    IF NOT v_target_member THEN
        RAISE EXCEPTION 'Target faction is not an active member of this organisation';
    END IF;

    UPDATE factions
    SET    party_funds = COALESCE(party_funds, 0) + p_amount
    WHERE  id = p_target_faction_id
    RETURNING party_funds INTO v_new_funds;

    IF v_new_funds IS NULL THEN
        RAISE EXCEPTION 'Target faction not found';
    END IF;

    RETURN v_new_funds;
END;
$$;

GRANT EXECUTE ON FUNCTION ipo_credit_party_funds(uuid, bigint, uuid) TO authenticated;
COMMENT ON FUNCTION ipo_credit_party_funds(uuid, bigint, uuid) IS
    'Credit cash to a target IPO member. Caller and target must both be active members of the given org.';


-- ── ipo_debit_solidarity_fund ──
-- Atomically debit the org's solidarity fund. Caller must be an active member.
-- Returns the new balance, or raises if insufficient.
CREATE OR REPLACE FUNCTION ipo_debit_solidarity_fund(
    p_org_id uuid,
    p_amount bigint
) RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller        uuid := auth.uid();
    v_caller_member boolean;
    v_new_balance   bigint;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM ipo_members
        WHERE org_id = p_org_id
          AND faction_id = v_caller
          AND is_active = true
          AND role = 'member'
    ) INTO v_caller_member;
    IF NOT v_caller_member THEN
        RAISE EXCEPTION 'Caller is not an active member of this organisation';
    END IF;

    UPDATE international_orgs
    SET    solidarity_fund_balance = solidarity_fund_balance - p_amount
    WHERE  id = p_org_id
      AND  solidarity_fund_balance >= p_amount
    RETURNING solidarity_fund_balance INTO v_new_balance;

    IF v_new_balance IS NULL THEN
        RAISE EXCEPTION 'Insufficient fund balance or org not found';
    END IF;

    RETURN v_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION ipo_debit_solidarity_fund(uuid, bigint) TO authenticated;
COMMENT ON FUNCTION ipo_debit_solidarity_fund(uuid, bigint) IS
    'Atomically debit the IPO solidarity fund. Caller must be an active member of the org.';

COMMIT;
