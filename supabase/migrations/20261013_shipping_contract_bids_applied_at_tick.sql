-- ════════════════════════════════════════════════════════════════
-- Add missing shipping_contract_bids.applied_at_tick column.
--
-- Reported: processTradeAgreementShipping in advance-corp-tick logs
--   [TradeAgreementShipping] bids fetch failed for <id>:
--   column shipping_contract_bids.applied_at_tick does not exist
-- on every closing trade-agreement contract. The auto-award path is
-- effectively dead until this lands.
--
-- Cause: every shipping_contract_bids RPC since 20260620
-- (place_shipping_bid, place_shipping_offer, the 20260622 phase-6
-- and 20260625 revise variants, and the live 20260940 tier-pricing
-- version) reads and writes applied_at_tick. No migration ever
-- created the column — dev DB was almost certainly patched by hand
-- and the matching ALTER never made it into source control. The
-- live edge function also sorts on it (advance-corp-tick:3519) and
-- uses it as the tie-breaker in the auto-award scorer (line 3558).
--
-- INT (nullable, no default). Existing rows stay NULL — they pre-
-- date the column and won't be compared (orderings put NULLs last
-- by default in ASC, and the JS-side fallback Number(undef)||0 keeps
-- the scorer well-behaved). New bids populate the column with the
-- current shard tick at insert/replace time.
--
-- Idempotent (ADD COLUMN IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE shipping_contract_bids
    ADD COLUMN IF NOT EXISTS applied_at_tick INT;

COMMENT ON COLUMN shipping_contract_bids.applied_at_tick IS
    'Shard tick at which the bid was applied or last replaced. Drives the auto-award tie-breaker (earliest applied_at_tick wins on identical scores). NULL on rows from before this column was added.';

NOTIFY pgrst, 'reload schema';

COMMIT;
