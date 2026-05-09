-- ════════════════════════════════════════════════════════════════
-- corp_contracts.crews_working — the present-tense crew deployment
--
-- 20261029 collapsed crew assignment into bid time on the theory
-- that a separate deploy action was friction every new corp tripped
-- on. That fixed the trip-up but left legacy over-committed corps
-- (Hong Hua: 16 crews_committed across 8 active contracts on 6
-- owned crews) silently progressing all jobs at full speed — the
-- physics of the world was wrong.
--
-- This migration brings deployment back as a separate signal with
-- stricter caps and clearer naming:
--
--   • crews_committed (corp_contract_bids) stays as the bid-time
--     PROMISE that drives price + timeline multipliers.
--   • crews_working (corp_contracts, NEW) is the present-tense
--     deployment. Defaults to 0 — the player must deploy after
--     winning. The tick processor stalls any contract where
--     crews_working = 0.
--   • set_crews_working RPC enforces:
--       - 0 ≤ p_crews ≤ bid.crews_committed (you can't deploy more
--         than you committed; the timeline is locked from bid time
--         so over-deployment buys nothing)
--       - SUM(crews_working) across this corp's active contracts
--         + p_crews on this one ≤ corp_work_crews
--     Both bounds are checked together so a parallel call can't
--     squeeze through.
--
-- Backfill: every existing active corp_contract starts at
-- crews_working = 0. Owners have to log in and deploy. This is
-- the price of bringing the world back into physics consistency
-- — Hong Hua's 8 contracts all stall until that corp's owner
-- spreads crews across them.
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.corp_contracts
    ADD COLUMN IF NOT EXISTS crews_working INT NOT NULL DEFAULT 0;

DO $$ BEGIN
    ALTER TABLE public.corp_contracts
        ADD CONSTRAINT corp_contracts_crews_working_nonneg
        CHECK (crews_working >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN public.corp_contracts.crews_working IS
    'Present-tense crews physically deployed on this contract. 0 means the contract stalls (no progress, no cost) until the owner deploys via set_crews_working. Bounded by bid.crews_committed on the per-contract side, and by SUM ≤ corp.corp_work_crews on the aggregate side. Replaces the 20261029-dropped crews_assigned with stricter enforcement and a clearer name.';


-- ── set_crews_working RPC ──────────────────────────────────────
DROP FUNCTION IF EXISTS public.set_crews_working(UUID, INT);

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

    -- The accepted bid carries crews_committed, the cap on per-
    -- contract deployment.
    SELECT * INTO v_bid FROM corp_contract_bids
     WHERE contract_id = p_contract_id AND status = 'accepted';
    IF v_bid.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No accepted bid found for this contract');
    END IF;

    -- Lock the corp row so concurrent set_crews_working calls
    -- can't both pass the aggregate cap before either commits.
    SELECT * INTO v_corp FROM factions WHERE id = v_bid.faction_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Winning corporation not found');
    END IF;
    IF v_corp.id <> v_user
       AND COALESCE(v_corp.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this contract');
    END IF;

    -- Per-contract cap: can't deploy more than the bid committed.
    -- Over-deployment would buy nothing (timeline is locked from
    -- bid time) so cap at committed.
    IF p_crews > COALESCE(v_bid.crews_committed, 0) THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Cannot deploy %s crews — bid committed %s. Over-deployment doesn''t accelerate the contract.',
                p_crews, v_bid.crews_committed));
    END IF;

    -- Aggregate cap: sum across this corp's OTHER active contracts
    -- plus the new value must not exceed corp_work_crews. Other
    -- contracts excluded so re-deploying a contract you already
    -- have crews on doesn't double-count.
    SELECT COALESCE(SUM(c.crews_working), 0) INTO v_other_working
      FROM corp_contracts c
      JOIN corp_contract_bids b
        ON b.contract_id = c.id AND b.status = 'accepted'
     WHERE b.faction_id = v_corp.id
       AND c.status = 'active'
       AND c.id <> p_contract_id;

    v_owned := COALESCE(v_corp.corp_work_crews, 0);
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

COMMENT ON FUNCTION set_crews_working(UUID, INT) IS
    'Player-facing crew deployment for active contracts. Enforces (0 ≤ p_crews ≤ bid.crews_committed) per-contract and (SUM across active contracts ≤ corp_work_crews) aggregate. Locks the corp row to serialise parallel calls. Tick processor in advance-corp-tick stalls any contract where crews_working = 0.';

COMMIT;

NOTIFY pgrst, 'reload schema';
