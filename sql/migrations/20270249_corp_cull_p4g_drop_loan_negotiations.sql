-- ════════════════════════════════════════════════════════════════════
-- Corp-cull Phase 4g — drop the legacy loan-negotiation system
-- ════════════════════════════════════════════════════════════════════
-- loan_negotiations is legacy faction-corp: borrower/lender are factions and
-- fired_to_loan_id → bank_loans (the faction bank-loan table whose RPCs were
-- dropped in 4e). Its only client was js/loan-negotiation-modal.js, which had
-- no importer (deleted in this commit). The entrepreneur loan flow (offer_loan
-- + corp_loan_requests/offers) does not touch loan_negotiations.
--
-- Functions dropped (verified zero callers — client/edge/SQL; the negotiation
-- RPCs only called each other + _negotiation_caller_role/_fire_negotiation, and
-- the creator's caller bank_respond_to_loan_request was dropped in 4e/20270246):
--   create_loan_negotiation, update_negotiation_terms (both signatures),
--   set_negotiation_agreement, post_negotiation_message, mark_negotiation_seen,
--   abandon_negotiation, auto_abandon_stale_negotiations, _negotiation_caller_role,
--   _fire_negotiation, and the refund_escrow_on_faction_delete trigger + function.
--
-- The auto_abandon_stale_negotiations per-tick call was removed from
-- advance-corp-tick in this commit (it was mis-kept in 4e).
--
-- DEPLOY ORDER: deploy advance-corp-tick (build marker 2026-05-24-c) BEFORE
-- applying this migration so the tick no longer calls auto_abandon_stale_negotiations.
--
-- Tables loan_negotiations / loan_negotiation_messages drop in Phase 5.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP TRIGGER IF EXISTS trg_refund_escrow_on_faction_delete ON public.factions;
DROP FUNCTION IF EXISTS public.refund_escrow_on_faction_delete();

DROP FUNCTION IF EXISTS public.auto_abandon_stale_negotiations(integer);
DROP FUNCTION IF EXISTS public.abandon_negotiation(uuid, text);
DROP FUNCTION IF EXISTS public.set_negotiation_agreement(uuid, boolean);
DROP FUNCTION IF EXISTS public.post_negotiation_message(uuid, text);
DROP FUNCTION IF EXISTS public.mark_negotiation_seen(uuid);
DROP FUNCTION IF EXISTS public.update_negotiation_terms(uuid, bigint, numeric, integer, text, text);
DROP FUNCTION IF EXISTS public.update_negotiation_terms(uuid, bigint, numeric, integer, text, text, jsonb);
DROP FUNCTION IF EXISTS public.create_loan_negotiation(uuid, bigint, numeric, integer, text);
DROP FUNCTION IF EXISTS public._fire_negotiation(uuid, integer);
DROP FUNCTION IF EXISTS public._negotiation_caller_role(uuid, uuid);

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ── Re-apply from git history: 20260722 (phase1: create/update/
-- set/post/abandon/_negotiation_caller_role/refund_escrow trigger), 20260723
-- (phase5: auto_abandon/mark_seen), 20260724 (collateral: update_negotiation_terms
-- +jsonb), 20260815 (_fire_negotiation). Restore the auto_abandon_stale_negotiations
-- call + js/loan-negotiation-modal.js.
