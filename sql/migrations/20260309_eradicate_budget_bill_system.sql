-- Migration: Complete Eradication of Budget Bill System
-- Removes all budget bill data, the budget_allocations table,
-- and the government shutdown crisis template.
-- PRESERVES: budget_item_allocations (used by institution funding system),
--            last_budget_bill_id column (referenced by funding queries).

BEGIN;

-- ============================================================
-- 1. DELETE all budget bill child records
-- ============================================================

DELETE FROM bill_support
WHERE bill_id IN (SELECT id FROM bills WHERE bill_type = 'budget');

DELETE FROM bill_articles
WHERE bill_id IN (SELECT id FROM bills WHERE bill_type = 'budget');

-- budget_allocations rows will cascade when the table is dropped,
-- but clean them first for safety
DELETE FROM budget_allocations
WHERE bill_id IN (SELECT id FROM bills WHERE bill_type = 'budget');

-- ============================================================
-- 2. DELETE all budget bills (open + historical)
-- ============================================================

DELETE FROM bills WHERE bill_type = 'budget';

-- ============================================================
-- 3. DROP budget_allocations table
--    (budget_item_allocations is KEPT for institution funding)
-- ============================================================

DROP TABLE IF EXISTS budget_allocations;

-- ============================================================
-- 4. REMOVE government shutdown crisis template + effects
-- ============================================================

DELETE FROM active_crises
WHERE crisis_id = '00000000-0000-0000-0000-000000000001';

DELETE FROM crisis_effects
WHERE crisis_id = '00000000-0000-0000-0000-000000000001';

DELETE FROM crisis_templates
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================================
-- 5. CLEAR nation budget tracking columns
-- ============================================================

UPDATE nations
SET last_budget_tick = NULL,
    budget_reserves = 0;

-- ============================================================
-- 6. VERIFY
-- ============================================================

SELECT count(*) AS remaining_budget_bills
FROM bills WHERE bill_type = 'budget';

SELECT count(*) AS remaining_shutdown_crises
FROM active_crises
WHERE crisis_id = '00000000-0000-0000-0000-000000000001';

COMMIT;
