-- Migration: Clean up orphaned budget bills and government shutdown crises
-- The budget system has been removed, but legacy data remains in the database.

BEGIN;

-- ============================================================
-- 1. AUDIT: Preview what will be removed
-- ============================================================

-- Show open budget bills that will be deleted
SELECT id, nation_id, bill_name, status, bill_type, proposed_tick
FROM bills
WHERE bill_type = 'budget'
  AND status IN ('committee', 'floor', 'president_desk');

-- Show active government shutdown crises
SELECT ac.id, ac.nation_id, ac.started_at_tick, ct.name
FROM active_crises ac
JOIN crisis_templates ct ON ct.id = ac.crisis_id
WHERE ac.crisis_id = '00000000-0000-0000-0000-000000000001';

-- Show nations with budget columns set
SELECT id, last_budget_tick, last_budget_bill_id, budget_reserves
FROM nations
WHERE last_budget_tick IS NOT NULL
   OR last_budget_bill_id IS NOT NULL
   OR budget_reserves != 0;

-- ============================================================
-- 2. DELETE child records for open budget bills
--    (budget_allocations has ON DELETE CASCADE, but bill_support
--     and bill_articles do not)
-- ============================================================

DELETE FROM bill_support
WHERE bill_id IN (
    SELECT id FROM bills
    WHERE bill_type = 'budget'
      AND status IN ('committee', 'floor', 'president_desk')
);

DELETE FROM bill_articles
WHERE bill_id IN (
    SELECT id FROM bills
    WHERE bill_type = 'budget'
      AND status IN ('committee', 'floor', 'president_desk')
);

-- ============================================================
-- 3. DELETE open budget bills
--    (budget_allocations rows cascade automatically)
-- ============================================================

DELETE FROM bills
WHERE bill_type = 'budget'
  AND status IN ('committee', 'floor', 'president_desk');

-- ============================================================
-- 4. REMOVE active government shutdown crises
-- ============================================================

DELETE FROM active_crises
WHERE crisis_id = '00000000-0000-0000-0000-000000000001';

-- ============================================================
-- 5. CLEAR nation budget tracking columns
-- ============================================================

UPDATE nations
SET last_budget_tick = NULL,
    last_budget_bill_id = NULL,
    budget_reserves = 0;

-- ============================================================
-- 6. VERIFY: All should return 0 rows
-- ============================================================

SELECT count(*) AS remaining_open_budget_bills
FROM bills
WHERE bill_type = 'budget'
  AND status IN ('committee', 'floor', 'president_desk');

SELECT count(*) AS remaining_shutdown_crises
FROM active_crises
WHERE crisis_id = '00000000-0000-0000-0000-000000000001';

SELECT count(*) AS nations_with_budget_data
FROM nations
WHERE last_budget_tick IS NOT NULL
   OR last_budget_bill_id IS NOT NULL
   OR budget_reserves != 0;

COMMIT;
