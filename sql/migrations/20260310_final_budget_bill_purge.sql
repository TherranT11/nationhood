-- Migration: Final purge of all budget bill remnants
-- Ensures no budget bills remain in the database and drops unused budget columns.
-- The budget bill system was removed but stale data may persist if prior migrations
-- were not applied or new budget bills somehow survived.

BEGIN;

-- 1. Delete child records for any surviving budget bills
DELETE FROM bill_support
WHERE bill_id IN (SELECT id FROM bills WHERE bill_type = 'budget');

DELETE FROM bill_articles
WHERE bill_id IN (SELECT id FROM bills WHERE bill_type = 'budget');

DELETE FROM bill_comments
WHERE bill_id IN (SELECT id FROM bills WHERE bill_type = 'budget');

DELETE FROM bill_amendment_requests
WHERE bill_id IN (SELECT id FROM bills WHERE bill_type = 'budget');

-- 2. Delete budget_item_allocations linked to budget bills
DELETE FROM budget_item_allocations
WHERE bill_id IN (SELECT id FROM bills WHERE bill_type = 'budget');

-- 3. Delete all budget bills
DELETE FROM bills WHERE bill_type = 'budget';

-- 4. Drop budget_allocations table if it still exists
DROP TABLE IF EXISTS budget_allocations;

-- 5. Clear and drop budget-specific nation columns
UPDATE nations SET last_budget_bill_id = NULL, last_budget_tick = NULL, budget_reserves = 0;
ALTER TABLE nations DROP COLUMN IF EXISTS last_budget_tick;
ALTER TABLE nations DROP COLUMN IF EXISTS budget_reserves;
-- Keep last_budget_bill_id for now — dropping a FK column requires careful CASCADE handling.
-- It is NULLed for all rows and no code references it after this cleanup.

-- 6. Remove any lingering government shutdown crisis data
DELETE FROM active_crises WHERE crisis_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM crisis_effects WHERE crisis_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM crisis_templates WHERE id = '00000000-0000-0000-0000-000000000001';

-- 7. Verify
SELECT count(*) AS remaining_budget_bills FROM bills WHERE bill_type = 'budget';

COMMIT;
