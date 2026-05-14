-- Fix: construction bids fail with
--   record "new" has no field "bidder_faction_id"
--
-- Root cause: migration 20261122_state_run_economy_corp_exodus
-- wired _trg_block_construction_bid_if_displaced onto
-- corp_contract_bids (BEFORE INSERT) but read NEW.bidder_faction_id
-- inside the function. The actual column on corp_contract_bids is
-- `faction_id`. `bidder_faction_id` is the column name used by the
-- sibling tables shipping_contract_bids and subsidiary_bids — likely
-- a copy-paste mismatch when wiring per-table trigger wrappers.
--
-- Net effect: every construction bid INSERT raised the field-missing
-- error before the displaced-corp check could even run, blocking
-- both displaced AND non-displaced corps from bidding.
--
-- The other per-table trigger wrappers in 20261122 use the right
-- column for their own table:
--   bank_loan_requests.requesting_faction_id   ✓
--   loan_negotiations.borrower_faction_id      ✓
--   strategic_alliances.founder_faction_id     ✓
--   alliance_members.faction_id                ✓
-- Only the construction-bid wrapper was wrong.
--
-- This migration is a one-line correction: rewrite the function
-- body to read NEW.faction_id. The trigger itself stays attached
-- to corp_contract_bids; CREATE OR REPLACE FUNCTION makes the
-- update idempotent and re-runnable without re-attaching anything.

CREATE OR REPLACE FUNCTION _trg_block_construction_bid_if_displaced()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM _raise_if_corp_displaced(NEW.faction_id, 'Construction bid');
    RETURN NEW;
END $$;

NOTIFY pgrst, 'reload schema';
