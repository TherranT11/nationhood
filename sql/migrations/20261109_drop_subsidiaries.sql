-- ════════════════════════════════════════════════════════════════
-- Tear down the entire subsidiary system
--
-- Removes all three subsidiary subsystems:
--   • Subsidiary Revenue — per-tick economics processor that
--     produced the [SubRevenue] log lines. corp_properties rows
--     where role='subsidiary' carried sub_cash and earned/lost
--     money each tick from a parent-rep × GDP × overhead formula.
--   • Subsidiary Services — Auto-rate Insurance + Loan rate engine.
--     subsidiary_auto_rates listed offerings; subsidiary_auto_policies
--     was the borrower↔lender contract.
--   • Subsidiary Sales — secondary marketplace for subsidiary
--     properties (subsidiary_sales + subsidiary_bids).
--
-- After this migration:
--   • No corp_properties row has role='subsidiary'
--   • The four subsidiary tables are gone (CASCADE clears any
--     stragglers in foreign references — the tables only reference
--     each other and corp_properties, all of which we're emptying)
--   • The two RPCs that mutated subsidiary_auto_policies are gone
--   • corp_properties.sub_cash column STAYS — processRegionalHqIncome
--     still uses it to track per-property income for Regional HQs
--     (role='regional_hq'), a separate legitimate system.
--
-- Migrations 20260404, 20260413_*, 20260425_*, etc. that originally
-- introduced these objects stay in the migration history (history
-- is append-only). Running them again on a fresh DB would re-create
-- the objects; running this migration on top would re-drop them.
-- All operations are idempotent so re-running is safe.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── Drop RPCs that touched subsidiary tables ─────────────────
DROP FUNCTION IF EXISTS public.accept_subsidiary_auto_policy_txn(UUID, UUID, UUID, NUMERIC, INT) CASCADE;
DROP FUNCTION IF EXISTS public.accept_subsidiary_auto_policy(UUID, UUID, UUID, NUMERIC, INT) CASCADE;
DROP FUNCTION IF EXISTS public.accept_subsidiary_auto_policy_txn CASCADE;
DROP FUNCTION IF EXISTS public.accept_subsidiary_auto_policy     CASCADE;

-- ── Drop subsidiary marketplace + auto-rate tables ──────────
DROP TABLE IF EXISTS public.subsidiary_bids           CASCADE;
DROP TABLE IF EXISTS public.subsidiary_sales          CASCADE;
DROP TABLE IF EXISTS public.subsidiary_auto_policies  CASCADE;
DROP TABLE IF EXISTS public.subsidiary_auto_rates     CASCADE;

-- ── Wipe subsidiary corp_properties rows ────────────────────
-- sub_cash column intentionally kept — processRegionalHqIncome
-- still uses it for Regional HQ property income.
DELETE FROM public.corp_properties WHERE role = 'subsidiary';

COMMIT;

NOTIFY pgrst, 'reload schema';
