-- ════════════════════════════════════════════════════════════════════
-- Backfill building-delivery RFP budgets to NULL (audit follow-up to
-- 20270429)
--
-- 20270429 dropped the budget input from new building requests and
-- made the column nullable, but did not touch existing rows. Any
-- building-delivery contract created BEFORE the migration still
-- carries the budget set by its issuer, and ent_place_construction_bid's
-- over_budget check still fires against it. New bids on those legacy
-- rows would see a raw error string in the UI (RB_REASON didn't carry
-- a friendly message for over_budget either).
--
-- Strict reading of the user's directive — "remove the budget cap when
-- a corporation makes a building request" — covers existing requests
-- as well as future ones. Nulls the budget column on every
-- building-delivery row so the cap is gone end-to-end.
--
-- Filter precisely:
--   contract_type = 'private' AND building_type IS NOT NULL
-- Government infrastructure (contract_type = 'government', building_type
-- NULL) and private spec-tier labor jobs (contract_type = 'private',
-- building_type NULL) keep their existing budgets.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE ent_construction_contracts
   SET budget = NULL
 WHERE contract_type = 'private'
   AND building_type IS NOT NULL
   AND budget IS NOT NULL;

COMMIT;
