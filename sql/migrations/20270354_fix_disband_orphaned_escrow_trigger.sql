-- ════════════════════════════════════════════════════════════════════
-- Fix disband_party: drop the orphaned escrow refund trigger
-- ════════════════════════════════════════════════════════════════════
-- Disbanding a party calls disband_party → DELETE FROM factions, which fires
-- the AFTER DELETE trigger trg_refund_escrow_on_faction_delete. That trigger's
-- function (refund_escrow_on_faction_delete) reads loan_negotiations to refund
-- a deleted faction's escrow — but the legacy loan-negotiation system was torn
-- down in the corp cull (loan_negotiations dropped in 20270251). The trigger
-- was meant to be dropped alongside it in 20270249; where that drop didn't land,
-- the trigger now references a missing table and every faction delete fails with
-- 'relation "loan_negotiations" does not exist' — blocking disband.
--
-- The legacy faction loan system is dead (no table, no data to refund), so the
-- trigger is pure breakage. Drop it (idempotent — a no-op if 20270249 already
-- removed it).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP TRIGGER IF EXISTS trg_refund_escrow_on_faction_delete ON public.factions;
DROP FUNCTION IF EXISTS public.refund_escrow_on_faction_delete();

NOTIFY pgrst, 'reload schema';

COMMIT;
