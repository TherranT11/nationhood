-- ════════════════════════════════════════════════════════════════
-- crew_capacity_summary — single source of truth for crew math
--
-- The cap calculation (floor(corp_work_crews) - sum_of_other_working)
-- lived in two places: a JS helper inside showCrewsModal computing
-- freeCapacity for the modal max-input cap, AND the equivalent
-- subtraction inside set_crews_working for the server-side
-- validation. Same data, same arithmetic, two writers — drift risk.
--
-- This migration extracts the math into one STABLE function that
-- both the client (display + UI cap) and set_crews_working (server
-- enforcement) call. set_crews_working still wraps the corp row in
-- SELECT FOR UPDATE so concurrent deploy calls serialize; the
-- helper just produces the numbers.
--
-- Returns:
--   {
--     "owned":          NUMERIC — corp_work_crews on the corp row
--     "deployed_other": INT     — sum of crews_working across this
--                                 corp's other active contracts
--     "free_for_this":  INT     — GREATEST(0, floor(owned) -
--                                            deployed_other)
--   }
--
-- p_exclude_contract_id is the contract being deployed/redeployed;
-- it's excluded from "deployed_other" so re-deploying a contract
-- doesn't double-count its own existing crews. Pass NULL to get
-- the full deployment summary (no exclusion).
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.crew_capacity_summary(
    p_corp_id              UUID,
    p_exclude_contract_id  UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_owned NUMERIC;
    v_other INT;
BEGIN
    SELECT COALESCE(corp_work_crews, 0) INTO v_owned
      FROM factions WHERE id = p_corp_id;
    IF v_owned IS NULL THEN
        v_owned := 0;
    END IF;

    SELECT COALESCE(SUM(c.crews_working), 0) INTO v_other
      FROM corp_contracts c
      JOIN corp_contract_bids b
        ON b.contract_id = c.id AND b.status = 'accepted'
     WHERE b.faction_id = p_corp_id
       AND c.status = 'active'
       AND (p_exclude_contract_id IS NULL OR c.id <> p_exclude_contract_id);

    RETURN jsonb_build_object(
        'owned',          v_owned,
        'deployed_other', v_other,
        'free_for_this',  GREATEST(0, FLOOR(v_owned)::INT - v_other)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.crew_capacity_summary(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.crew_capacity_summary(UUID, UUID) IS
    'Single source of truth for the crew-deployment cap math. Returns {owned, deployed_other, free_for_this} for a corp, optionally excluding one contract from the "deployed_other" tally. set_crews_working calls this for its server-side cap; the aviation-operations Manage Crews modal calls it for the UI cap. Same numbers, one calculation.';


-- Replace set_crews_working to call the helper instead of inlining
-- the SUM query and floor math.
CREATE OR REPLACE FUNCTION set_crews_working(
    p_contract_id UUID,
    p_crews       INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_contract corp_contracts%ROWTYPE;
    v_bid corp_contract_bids%ROWTYPE;
    v_corp factions%ROWTYPE;
    v_summary JSONB;
    v_other_working INT;
    v_owned NUMERIC;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF p_crews IS NULL OR p_crews < 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Crews must be a non-negative integer');
    END IF;

    SELECT * INTO v_contract FROM corp_contracts WHERE id = p_contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Crews can only be assigned to active contracts');
    END IF;

    SELECT * INTO v_bid FROM corp_contract_bids
     WHERE contract_id = p_contract_id AND status = 'accepted';
    IF v_bid.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No accepted bid found for this contract');
    END IF;

    -- Lock the corp row so concurrent set_crews_working calls
    -- serialize through this function for the same corp.
    SELECT * INTO v_corp FROM factions WHERE id = v_bid.faction_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Winning corporation not found');
    END IF;
    IF v_corp.id <> v_user
       AND COALESCE(v_corp.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this contract');
    END IF;

    -- Per-contract cap: can't deploy more than the bid committed.
    IF p_crews > COALESCE(v_bid.crews_committed, 0) THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Cannot deploy %s crews — bid committed %s. Over-deployment doesn''t accelerate the contract.',
                p_crews, v_bid.crews_committed));
    END IF;

    -- Aggregate cap: read the same numbers the client reads via
    -- crew_capacity_summary(). Single source for the math.
    v_summary := crew_capacity_summary(v_corp.id, p_contract_id);
    v_other_working := (v_summary->>'deployed_other')::INT;
    v_owned := (v_summary->>'owned')::NUMERIC;

    IF v_other_working + p_crews > v_owned THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Crew capacity exhausted — you have %s deployed on other active contracts and own %s Work Crews, so this contract can use at most %s.',
                v_other_working, v_owned, GREATEST(0, FLOOR(v_owned)::INT - v_other_working)));
    END IF;

    UPDATE corp_contracts
       SET crews_working = p_crews
     WHERE id = p_contract_id;

    RETURN jsonb_build_object(
        'success',           true,
        'crews_working',     p_crews,
        'crews_committed',   v_bid.crews_committed,
        'other_working',     v_other_working,
        'corp_work_crews',   v_owned
    );
END;
$$;

GRANT EXECUTE ON FUNCTION set_crews_working(UUID, INT) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
