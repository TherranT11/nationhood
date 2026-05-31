-- ════════════════════════════════════════════════════════════════════
-- Audit fix on 20270448: accept_personal_loan_offer INSERT shape was
-- wrong against the actual personal_loans schema
--
-- The personal_loans table (20270426) is built around lazy interest
-- accrual + manual payment — no fixed-term amortization. Columns are:
--
--   borrower_faction_id   uuid
--   lender_corp_id        uuid
--   principal             bigint
--   apr_pct               numeric (0-50, percentage NOT ratio)
--   status                'active' | 'paid'
--   principal_remaining   bigint NOT NULL
--   accrued_interest_unpaid numeric NOT NULL DEFAULT 0
--   last_accrual_tick     int NOT NULL
--   requested_at_tick     int NOT NULL
--   closed_at_tick        int
--
-- 20270448's accept_personal_loan_offer INSERT instead wrote:
--   apr (column doesn't exist; should be apr_pct)
--   term_ticks (column doesn't exist)
--   per_tick_payment (column doesn't exist)
--   payments_remaining (column doesn't exist)
--   started_at_tick (column doesn't exist; should be requested_at_tick)
-- And it was missing principal_remaining + last_accrual_tick which are
-- NOT NULL. First attempt to accept an offer would have errored with
-- column-not-found / null-violation. The whole rebid feature was DOA
-- until this migration lands.
--
-- This migration is a single-RPC rewrite — CREATE OR REPLACE of
-- accept_personal_loan_offer with the INSERT matching the actual
-- schema. Other 20270448 functions are unaffected.
--
-- ── Scale conversion ────────────────────────────────────────────────
-- personal_loan_offers.apr is stored as a ratio (0-0.5) to match the
-- corp_loan_offers pattern. personal_loans.apr_pct is stored as a
-- percentage (0-50). The INSERT multiplies by 100 to convert.
--
-- ── term_ticks on the request ───────────────────────────────────────
-- term_ticks lives on personal_loan_requests as a borrower-side
-- preference banks read when pricing their offer — it does NOT flow
-- into the loan itself, because personal_loans has no per-tick
-- payment schedule. The accepted loan starts with the offered APR
-- and accrues until manually paid (via make_personal_loan_payment).
-- This is a deliberate scoping choice: keep the v1 servicing model;
-- only the bidding-layer is new.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.accept_personal_loan_offer(p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_offer        personal_loan_offers%ROWTYPE;
    v_req          personal_loan_requests%ROWTYPE;
    v_bank         entrepreneur_corps%ROWTYPE;
    v_bank_fac     factions%ROWTYPE;
    v_tick         int;
    v_loan_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_offer_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_offer FROM personal_loan_offers WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_pending');
    END IF;

    SELECT * INTO v_req FROM personal_loan_requests WHERE id = v_offer.request_id FOR UPDATE;
    IF v_req.id IS NULL OR v_req.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_pending');
    END IF;

    -- Caller must be the borrower.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_fac.id <> v_req.borrower_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_borrower');
    END IF;

    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = v_offer.bank_corp_id;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;

    SELECT * INTO v_bank_fac FROM factions WHERE id = v_bank.owner_faction_id FOR UPDATE;
    IF v_bank_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_owner_not_found');
    END IF;
    IF COALESCE(v_bank_fac.party_funds, 0) < v_req.principal THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_insufficient_funds',
            'have', COALESCE(v_bank_fac.party_funds, 0)::bigint, 'need', v_req.principal);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Lock borrower row too (after bank — stable order: borrower id is
    -- known; bank faction was already locked above).
    PERFORM 1 FROM factions WHERE id = v_fac.id FOR UPDATE;

    -- Cash transfer: bank owner → borrower.
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_req.principal
     WHERE id = v_bank_fac.id;
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_req.principal
     WHERE id = v_fac.id;

    -- Spawn the loan with the v1 lazy-accrual shape. apr_pct stores as
    -- percentage (offers carry ratio; multiply by 100). principal_remaining
    -- starts at full principal; accrued_interest_unpaid at 0;
    -- last_accrual_tick = requested_at_tick = now.
    INSERT INTO personal_loans (
        borrower_faction_id, lender_corp_id, principal, apr_pct,
        principal_remaining, accrued_interest_unpaid,
        last_accrual_tick, requested_at_tick, status
    ) VALUES (
        v_fac.id, v_bank.id, v_req.principal, v_offer.apr * 100,
        v_req.principal, 0,
        v_tick, v_tick, 'active'
    )
    RETURNING id INTO v_loan_id;

    -- Flip the accepted offer; auto-decline siblings.
    UPDATE personal_loan_offers
       SET status = 'accepted', finalized_at_tick = v_tick
     WHERE id = p_offer_id;
    UPDATE personal_loan_offers
       SET status = 'auto_declined', finalized_at_tick = v_tick
     WHERE request_id = v_req.id
       AND id <> p_offer_id
       AND status = 'pending';

    -- Flip the request.
    UPDATE personal_loan_requests
       SET status              = 'accepted',
           accepted_by_corp_id = v_bank.id,
           finalized_at_tick   = v_tick
     WHERE id = v_req.id;

    RETURN jsonb_build_object(
        'success',        true,
        'loan_id',        v_loan_id,
        'lender_corp_id', v_bank.id,
        'principal',      v_req.principal,
        'apr_pct',        v_offer.apr * 100
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.accept_personal_loan_offer(uuid) TO authenticated;

COMMENT ON FUNCTION public.accept_personal_loan_offer(uuid) IS
    'Borrower accepts a pending personal_loan_offer. Atomic: debits bank owner party_funds, credits borrower party_funds, spawns personal_loans row at offer.apr × 100 (ratio → percentage), flips accepted/sibling offers + request. Stable lock order (offer → request → bank faction → borrower). v1 servicing model — no per-tick schedule; loan accrues lazily until manually paid via make_personal_loan_payment.';

NOTIFY pgrst, 'reload schema';

COMMIT;
