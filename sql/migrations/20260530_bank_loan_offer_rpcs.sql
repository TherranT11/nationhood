-- ══════════════════════════════════════════════════════════════
-- Loan Offers L2: counter-offer RPCs
--
-- Three new RPCs for the negotiation flow:
--   submit_loan_offer  — bank counters with rate + term
--   accept_loan_offer  — borrower picks one offer, others auto-reject
--   reject_loan_offer  — borrower turns one offer down individually
--
-- Drops the old approve_loan_request from C2 — no callers remain.
-- decline_loan_request stays (bank passes entirely without offering),
-- cancel_loan_request stays (borrower pulls out), pay_out_loan stays
-- (bank disburses after accept). submit_loan_request stays unchanged
-- — its requested_apr param is now informational; banks set their
-- own rate via the offer.
--
-- Lifecycle:
--   bank_loan_requests:  pending → approved (when an offer accepted)
--                              → declined (every bank passed)
--                              → expired
--                              → cancelled (borrower withdrew)
--   bank_loan_offers:    pending → accepted (borrower picked this one)
--                              → rejected (borrower said no)
--                              → auto_rejected (another offer accepted)
--                              → expired
--   bank_loans:          pending_payout (minted on accept) → active
--                              (pay_out_loan disburses) → paid/etc.
-- ══════════════════════════════════════════════════════════════

-- Drop old C2 RPC. Counter-offer flow replaces it entirely.
DROP FUNCTION IF EXISTS approve_loan_request(UUID, UUID);

-- ─────────────────────────────────────────────────────────────
-- submit_loan_offer: bank counter-offers on a pending request
-- ─────────────────────────────────────────────────────────────
-- Floor: bank's corp_interest_rates (direct map: stat=5 → ≥5.0%).
-- Ceiling: 12.0 (hard cap, mirrors the mockup slider).
-- Overleverage gate: same as C2 — banks at corp_overleverage ≥ 8
-- can't extend new credit (Stressed state).
-- One offer per (request, bank): UNIQUE constraint on the table
-- catches double-submit; the explicit check below produces a
-- friendlier error message.
CREATE OR REPLACE FUNCTION submit_loan_offer(
    p_request_id          UUID,
    p_bank_faction_id     UUID,
    p_offered_apr         NUMERIC,
    p_offered_term_ticks  INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user        UUID := auth.uid();
    v_bank        factions%ROWTYPE;
    v_request     bank_loan_requests%ROWTYPE;
    v_floor       NUMERIC;
    v_existing_id UUID;
    v_tick        INT;
    v_offer_id    UUID;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Caller owns the bank.
    SELECT * INTO v_bank FROM factions WHERE id = p_bank_faction_id;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bank not found');
    END IF;
    IF v_bank.id <> v_user AND v_bank.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this bank');
    END IF;
    IF v_bank.faction_type <> 'corporation' OR v_bank.corp_sector <> 'Finance' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only Finance corporations can offer loans');
    END IF;

    -- Overleverage gate (Stressed at 8+, same as the dropped
    -- approve_loan_request).
    IF COALESCE(v_bank.corp_overleverage, 0) >= 8 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Bank is overleveraged — reduce exposure before offering new loans');
    END IF;

    -- Request must exist, be pending, and target this bank.
    SELECT * INTO v_request FROM bank_loan_requests WHERE id = p_request_id;
    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan request not found');
    END IF;
    IF v_request.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Request is %s, no longer accepting offers', v_request.status));
    END IF;
    IF NOT (p_bank_faction_id = ANY(v_request.target_bank_ids)) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bank was not invited to bid on this request');
    END IF;

    -- Term + APR validation.
    IF p_offered_term_ticks IS NULL OR p_offered_term_ticks <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Term must be > 0 ticks');
    END IF;
    IF p_offered_apr IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'APR is required');
    END IF;
    IF p_offered_apr > 12 THEN
        RETURN jsonb_build_object('success', false,
            'error', format('APR %s exceeds the 12.0%% hard cap', p_offered_apr));
    END IF;
    -- Floor: bank's own corp_interest_rates as a percent.
    v_floor := COALESCE(v_bank.corp_interest_rates, 0);
    IF p_offered_apr < v_floor THEN
        RETURN jsonb_build_object('success', false,
            'error', format('APR %s below your bank''s floor of %s%%', p_offered_apr, v_floor));
    END IF;

    -- One-shot guard. Friendlier than the UNIQUE constraint error.
    SELECT id INTO v_existing_id FROM bank_loan_offers
     WHERE request_id = p_request_id AND bank_faction_id = p_bank_faction_id;
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false,
            'error', 'You already submitted an offer on this request — reject it first to revise');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO bank_loan_offers (
        request_id, bank_faction_id, offered_apr, offered_term_ticks,
        status, expires_at_tick, created_at_tick
    ) VALUES (
        p_request_id, p_bank_faction_id, p_offered_apr, p_offered_term_ticks,
        'pending', v_request.expires_at_tick, v_tick
    ) RETURNING id INTO v_offer_id;

    RETURN jsonb_build_object(
        'success', true,
        'offer_id', v_offer_id,
        'expires_at_tick', v_request.expires_at_tick
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION submit_loan_offer(UUID, UUID, NUMERIC, INT) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- accept_loan_offer: borrower picks one offer
-- ─────────────────────────────────────────────────────────────
-- Atomic: flip the chosen offer → 'accepted', auto-reject the rest,
-- mint a bank_loans row in 'pending_payout', flip the request to
-- 'approved' with winning_bank_id. Optimistic lock on each step
-- prevents double-accept races.
CREATE OR REPLACE FUNCTION accept_loan_offer(
    p_offer_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user           UUID := auth.uid();
    v_offer          bank_loan_offers%ROWTYPE;
    v_request        bank_loan_requests%ROWTYPE;
    v_borrower       factions%ROWTYPE;
    v_tick           INT;
    v_loan_id        UUID;
    v_updated_count  INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_offer FROM bank_loan_offers WHERE id = p_offer_id;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Offer not found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Offer is %s; cannot accept', v_offer.status));
    END IF;

    SELECT * INTO v_request FROM bank_loan_requests WHERE id = v_offer.request_id;
    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan request not found');
    END IF;
    IF v_request.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Request is %s; cannot accept offers', v_request.status));
    END IF;

    -- Caller owns the borrower (request's requesting_faction_id).
    SELECT * INTO v_borrower FROM factions WHERE id = v_request.requesting_faction_id;
    IF v_borrower.id IS NULL OR
       (v_borrower.id <> v_user AND v_borrower.linked_user_id IS DISTINCT FROM v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this faction');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Optimistic flip: chosen offer → 'accepted'.
    UPDATE bank_loan_offers
       SET status            = 'accepted',
           resolved_at_tick  = v_tick,
           updated_at        = now()
     WHERE id     = p_offer_id
       AND status = 'pending';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Offer changed state before accept (accepted or expired by another path)');
    END IF;

    -- Auto-reject every other pending offer on this request.
    UPDATE bank_loan_offers
       SET status            = 'auto_rejected',
           resolved_at_tick  = v_tick,
           updated_at        = now()
     WHERE request_id = v_offer.request_id
       AND id        <> p_offer_id
       AND status     = 'pending';

    -- Flip request to 'approved' with the winning bank. Optimistic
    -- lock on status='pending' so a concurrent cancel/decline path
    -- can't collide silently.
    UPDATE bank_loan_requests
       SET status            = 'approved',
           winning_bank_id   = v_offer.bank_faction_id,
           resolved_at_tick  = v_tick,
           updated_at        = now()
     WHERE id     = v_offer.request_id
       AND status = 'pending';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        -- Roll the offer back. Rare race; the borrower will see the
        -- request as already-resolved on next refresh.
        UPDATE bank_loan_offers
           SET status = 'pending', resolved_at_tick = NULL
         WHERE id = p_offer_id;
        RETURN jsonb_build_object('success', false,
            'error', 'Request resolved by another action just now; try refresh');
    END IF;

    -- Mint the loan in 'pending_payout'. Terms snapshot from the
    -- accepted offer (not the request — the offer is what the
    -- borrower agreed to).
    INSERT INTO bank_loans (
        request_id, lender_faction_id, borrower_faction_id, nation_id,
        principal, apr, term_ticks, outstanding,
        status, issued_at_tick, matures_at_tick
    ) VALUES (
        v_offer.request_id,
        v_offer.bank_faction_id,
        v_request.requesting_faction_id,
        v_request.requesting_nation_id,
        v_request.principal,
        v_offer.offered_apr,
        v_offer.offered_term_ticks,
        v_request.principal,
        'pending_payout',
        v_tick,
        v_tick + v_offer.offered_term_ticks
    ) RETURNING id INTO v_loan_id;

    RETURN jsonb_build_object(
        'success',  true,
        'loan_id',  v_loan_id,
        'status',   'pending_payout',
        'message',  'Offer accepted. Lender uses Pay Out Loan to disburse.'
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION accept_loan_offer(UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- reject_loan_offer: borrower turns down one offer individually
-- ─────────────────────────────────────────────────────────────
-- Doesn't affect the parent request — other offers remain in play.
-- Borrower can reject one and still accept another from the same
-- request. The bank whose offer was rejected can't re-bid (UNIQUE
-- constraint), per the one-shot rule.
CREATE OR REPLACE FUNCTION reject_loan_offer(
    p_offer_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user           UUID := auth.uid();
    v_offer          bank_loan_offers%ROWTYPE;
    v_request        bank_loan_requests%ROWTYPE;
    v_borrower       factions%ROWTYPE;
    v_tick           INT;
    v_updated_count  INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_offer FROM bank_loan_offers WHERE id = p_offer_id;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Offer not found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Offer is %s; cannot reject', v_offer.status));
    END IF;

    SELECT * INTO v_request FROM bank_loan_requests WHERE id = v_offer.request_id;
    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan request not found');
    END IF;

    SELECT * INTO v_borrower FROM factions WHERE id = v_request.requesting_faction_id;
    IF v_borrower.id IS NULL OR
       (v_borrower.id <> v_user AND v_borrower.linked_user_id IS DISTINCT FROM v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this faction');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE bank_loan_offers
       SET status            = 'rejected',
           resolved_at_tick  = v_tick,
           updated_at        = now()
     WHERE id     = p_offer_id
       AND status = 'pending';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Offer changed state before reject');
    END IF;

    RETURN jsonb_build_object('success', true, 'offer_id', p_offer_id);
END;
$func$;

GRANT EXECUTE ON FUNCTION reject_loan_offer(UUID) TO authenticated;

COMMENT ON FUNCTION submit_loan_offer(UUID, UUID, NUMERIC, INT) IS
    'Bank counter-offer on a pending bank_loan_requests row. Floored at the bank''s corp_interest_rates, capped at 12. One offer per (request, bank).';
COMMENT ON FUNCTION accept_loan_offer(UUID) IS
    'Borrower accepts one offer. Atomically: flips this offer to accepted, auto-rejects every other pending offer on the request, flips the request to approved, mints a bank_loans row in pending_payout state.';
COMMENT ON FUNCTION reject_loan_offer(UUID) IS
    'Borrower turns down one offer individually. Other offers on the same request stay in play. Bank cannot re-bid (UNIQUE constraint).';
