-- ════════════════════════════════════════════════════════════════════
-- AP CULL — Phase C, step 1: drop the AP RPCs and the ap_ledger table
-- ════════════════════════════════════════════════════════════════════
-- The Action Points system is fully removed from the client (Phase B) and
-- from the tick processor (advance-tick regenerated with no AP). These
-- objects now have no live caller/reader:
--   • deduct_ap / accumulate_ap — the only callers were the tick (now AP-free
--     after redeploy) and adopt_platform (de-AP'd back in 20270103). The
--     gameplay RPCs that touch AP (protest/whip/endorsement/construction)
--     manipulate the factions.action_points COLUMN directly, NOT via these
--     functions, so dropping the functions does not affect them.
--   • ap_ledger — no INSERT writer remains (the tick no longer logs AP) and
--     the client AP-history dropdown was removed.
--
-- ⚠️ DEPLOY ORDER: run this ONLY AFTER the AP-free advance-tick is deployed
--    (merge to main triggers `supabase functions deploy advance-tick`). The
--    currently-running tick still calls deduct_ap; dropping it before the new
--    tick is live would error every tick until redeploy.
--
-- The factions.action_points COLUMN is intentionally NOT dropped here — it is
-- still referenced by several live gameplay RPCs (party creation, protests,
-- whip, endorsement, construction bids). Dropping the column requires
-- re-pointing those first; that is a separate, carefully-reviewed migration.
--
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.deduct_ap(uuid, integer);
DROP FUNCTION IF EXISTS public.accumulate_ap(uuid, integer, integer);

-- ap_ledger has only an outbound FK to factions (ON DELETE CASCADE) and no
-- inbound references; the dedup unique index drops with the table.
DROP TABLE IF EXISTS public.ap_ledger;

COMMIT;

-- ── ROLLBACK ──
-- The functions were no-ops (deduct_ap → 999999, accumulate_ap → 0) and
-- ap_ledger was append-only history. To restore, re-run 20260935
-- (ap_deprecation_phase_a) for the functions and 20260330 for the table.
