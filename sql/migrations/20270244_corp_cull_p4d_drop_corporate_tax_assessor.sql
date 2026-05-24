-- ════════════════════════════════════════════════════════════════════
-- Corp-cull Phase 4d — drop the legacy corporate-tax assessor
-- ════════════════════════════════════════════════════════════════════
-- The per-tick corp-tax assessment call (assess_corporate_taxes, every 12
-- ticks) was removed from advance-corp-tick in this commit, along with the
-- legacy corp-economy processors (property effects, regional-HQ income,
-- monthly income, reputation decay). assess_corporate_taxes now has zero
-- callers (the pay/cook/ignore action RPCs were dropped in 20270241).
--
-- The corp_tax_bills table it wrote drops in Phase 5.
--
-- DEPLOY ORDER: deploy advance-corp-tick before applying this migration.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.assess_corporate_taxes(int);

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ── Re-apply 20261017 (assess_corporate_taxes) + restore the
-- assessment call in advance-corp-tick from git history.
