-- ════════════════════════════════════════════════════════════════════
-- Corp-cull Phase 4e — drop the legacy faction bank-loan / finance-loan RPCs
-- ════════════════════════════════════════════════════════════════════
-- These were the legacy faction-corp loan ACTIONS (request → offer →
-- approve / decline / cancel → pay-out → close → pay-down), reached from the
-- now-deleted corp pages, plus close_bank_loan which advance-corp-tick's
-- bank-loan payment processor called (that processor was removed in the 4e
-- edge step). Verified zero callers for each: no client (.js/.html), no edge
-- (.ts), and no SQL function body or trigger (the loan-negotiation / agreement
-- RPCs do not call any of them).
--
-- The ENTREPRENEUR loan system is untouched — it runs on corp_loan_requests /
-- corp_loan_offers via offer_loan + the *_negotiation_* RPCs, none of which
-- are dropped here.
--
-- submit_loan_request has two live signatures (an 8-arg pre-collateral form
-- and the 9-arg +jsonb form added in 20260725); both are dropped.
--
-- DEPLOY ORDER: deploy advance-corp-tick (4e edge step, build marker
-- 2026-05-24-a) BEFORE applying this migration so the tick no longer calls
-- close_bank_loan.
--
-- NOT dropped here (deferred — entangled, their own pass):
--   • recompute_finance_stats + its ~22-caller legacy finance ecosystem
--     (syndicated lending / joint equity / alliance LC / mutual aid /
--      fire_finance_action / bankruptcy + lawsuit hooks)
--   • set_finance_active_loans_original_principal (trigger fn — drops with
--     finance_active_loans in Phase 5)
--   • the loan-negotiation RPCs + _fire_negotiation (need their own matrix;
--     js/loan-negotiation-modal.js appears unimported — confirm before drop)
-- Tables (bank_loans / bank_loan_requests / bank_loan_offers /
-- finance_active_loans / finance_loan_requests) drop in Phase 5.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.close_bank_loan(uuid, text);
DROP FUNCTION IF EXISTS public.approve_loan_request(uuid, uuid);
DROP FUNCTION IF EXISTS public.cancel_loan_request(uuid);
DROP FUNCTION IF EXISTS public.decline_loan_request(uuid, uuid);
DROP FUNCTION IF EXISTS public.bank_respond_to_loan_request(uuid, uuid, numeric, int, text);
DROP FUNCTION IF EXISTS public.submit_loan_request(uuid, uuid[], bigint, int, numeric, text, text, int);
DROP FUNCTION IF EXISTS public.submit_loan_request(uuid, uuid[], bigint, int, numeric, text, text, int, jsonb);
DROP FUNCTION IF EXISTS public.submit_loan_offer(uuid, uuid, numeric, int);
DROP FUNCTION IF EXISTS public.reject_loan_offer(uuid);
DROP FUNCTION IF EXISTS public.pay_out_loan(uuid);
DROP FUNCTION IF EXISTS public.pay_down_debt(uuid, uuid, bigint);

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ── Re-apply the defining migrations from git history:
--   20260522 (approve_loan_request / cancel_loan_request / decline_loan_request)
--   20260530 (submit_loan_offer / reject_loan_offer)
--   20260608 (close_bank_loan)
--   20260712 (pay_out_loan)
--   20260725 (submit_loan_request / bank_respond_to_loan_request)
--   20260729 (pay_down_debt)
