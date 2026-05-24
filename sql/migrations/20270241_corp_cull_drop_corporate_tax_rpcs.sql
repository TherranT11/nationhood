-- ════════════════════════════════════════════════════════════════════
-- Corp-cull (P2-completion) — drop the legacy corporate-tax action RPCs
-- ════════════════════════════════════════════════════════════════════
-- The only caller of these player-action RPCs was js/corp-tax-pressing-issues.js,
-- an orphaned legacy-corp frontend module (no surviving loader) deleted in the
-- same commit. Verified zero remaining callers (no tick, trigger, SQL, or
-- client reference). Each takes a single bill-id uuid.
--
-- NOTE: assess_corporate_taxes (the per-tick bill GENERATOR) is NOT dropped
-- here — it is still invoked by advance-corp-tick and is removed in Phase 4
-- with that tick block. corp_tax_bills (the table) drops in Phase 5.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.pay_corporate_tax_full(uuid);
DROP FUNCTION IF EXISTS public.cook_corporate_tax_books(uuid);
DROP FUNCTION IF EXISTS public.ignore_corporate_tax_bill(uuid);

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20261017_corp_tax_rpcs.sql to restore the three functions.
