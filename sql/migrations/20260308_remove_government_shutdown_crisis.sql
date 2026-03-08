-- ============================================================
-- Remove Government Shutdown crisis from the game
-- ============================================================
-- Budgets are no longer a core mechanic, so the government
-- shutdown crisis is being removed entirely.

-- 1. Delete any active government shutdown crises
DELETE FROM active_crises
WHERE crisis_id = '00000000-0000-0000-0000-000000000001';

-- 2. Delete crisis end triggers
DELETE FROM crisis_end_triggers
WHERE crisis_id = '00000000-0000-0000-0000-000000000001';

-- 3. Delete crisis effects
DELETE FROM crisis_effects
WHERE crisis_id = '00000000-0000-0000-0000-000000000001';

-- 4. Delete crisis triggers
DELETE FROM crisis_triggers
WHERE crisis_id = '00000000-0000-0000-0000-000000000001';

-- 5. Delete the crisis template itself
DELETE FROM crisis_templates
WHERE id = '00000000-0000-0000-0000-000000000001';
