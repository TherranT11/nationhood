-- ══════════════════════════════════════════════════════════════
-- Finance Operations Phase C2: loan-request lifecycle RPCs
--
-- Five RPCs for the loan pipeline. Per-tick payment processing,
-- expiry handling, and overleverage drift hooks land in C4.
--
--   submit_loan_request    — borrower opens a request to N banks
--   approve_loan_request   — bank says yes (no cash moves yet)
--   decline_loan_request   — bank says no
--   pay_out_loan           — bank disburses, debt clock starts
--   cancel_loan_request    — borrower pulls out before approval
--
-- Adds 'pending_payout' to finance_loans.status so the loan can
-- exist in an "approved but not yet funded" state. This separates
-- the bank's two decisions: (1) accept the request, (2) actually
-- write the check. The Pay Out Loan action lives on the borrower's
-- Accepted Offer card.
-- ══════════════════════════════════════════════════════════════

-- ── Add pending_payout to the status CHECK ──
-- Drop+recreate the constraint (idempotent regardless of whether
-- 20260519 has been applied yet).
ALTER TABLE finance_loans DROP CONSTRAINT IF EXISTS finance_loans_status_check;
ALTER TABLE finance_loans
    ADD CONSTRAINT finance_loans_status_check
    CHECK (status IN ('pending_payout','active','paid','defaulted','foreclosed','called'));

-- ─────────────────────────────────────────────────────────────
-- submit_loan_request: borrower opens a request to N banks
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION submit_loan_request(
    p_requesting_faction_id UUID,
    p_target_bank_ids       UUID[],
    p_principal             BIGINT,
    p_term_ticks            INT,
    p_requested_apr         NUMERIC,
    p_risk_grade            TEXT  DEFAULT 'B',
    p_purpose               TEXT  DEFAULT NULL,
    p_expiry_ticks          INT   DEFAULT 6
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user      UUID := auth.uid();
    v_borrower  factions%ROWTYPE;
    v_tick      INT;
    v_bank_id   UUID;
    v_bank      factions%ROWTYPE;
    v_request_id UUID;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_borrower FROM factions WHERE id = p_requesting_faction_id;
    IF v_borrower.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Requesting faction not found');
    END IF;
    IF v_borrower.id <> v_user AND v_borrower.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this faction');
    END IF;
    -- Phase C2 supports corp borrowers only. Government / party borrowers
    -- need a separate cash-route in pay_out_loan and will land later.
    IF v_borrower.faction_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only corporations can request loans (this phase)');
    END IF;

    IF p_principal <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Principal must be > 0');
    END IF;
    IF p_term_ticks <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Term must be > 0 ticks');
    END IF;
    IF p_requested_apr < 0 OR p_requested_apr > 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'APR must be between 0 and 100');
    END IF;
    IF array_length(p_target_bank_ids, 1) IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Must target at least one bank');
    END IF;

    -- Validate every targeted bank: must be a Finance corp.
    FOREACH v_bank_id IN ARRAY p_target_bank_ids LOOP
        SELECT * INTO v_bank FROM factions WHERE id = v_bank_id;
        IF v_bank.id IS NULL THEN
            RETURN jsonb_build_object('success', false,
                'error', format('Target bank %s not found', v_bank_id));
        END IF;
        IF v_bank.faction_type <> 'corporation' OR v_bank.corp_sector <> 'Finance' THEN
            RETURN jsonb_build_object('success', false,
                'error', format('Target %s is not a Finance corporation', v_bank.faction_name));
        END IF;
    END LOOP;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO finance_loan_requests (
        requesting_faction_id, requesting_nation_id, target_bank_ids,
        principal, term_ticks, requested_apr, risk_grade, purpose,
        expires_at_tick, created_at_tick
    ) VALUES (
        p_requesting_faction_id, v_borrower.nation_id, p_target_bank_ids,
        p_principal, p_term_ticks, p_requested_apr,
        COALESCE(p_risk_grade, 'B'), p_purpose,
        v_tick + p_expiry_ticks, v_tick
    ) RETURNING id INTO v_request_id;

    RETURN jsonb_build_object(
        'success', true,
        'request_id', v_request_id,
        'expires_at_tick', v_tick + p_expiry_ticks
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION submit_loan_request(UUID, UUID[], BIGINT, INT, NUMERIC, TEXT, TEXT, INT)
    TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- approve_loan_request: bank accepts (no cash moves yet)
-- ─────────────────────────────────────────────────────────────
-- First-approval-wins via optimistic lock: UPDATE filters on
-- status='pending', so a second concurrent approval matches 0 rows.
-- Creates a finance_loans row in 'pending_payout' state. Cash
-- transfer happens later, in pay_out_loan.
--
-- Overleverage gate: per spec, banks at corp_overleverage >= 8
-- cannot approve new loans (Stressed state).
CREATE OR REPLACE FUNCTION approve_loan_request(
    p_request_id      UUID,
    p_bank_faction_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user     UUID := auth.uid();
    v_bank     factions%ROWTYPE;
    v_request  finance_loan_requests%ROWTYPE;
    v_tick     INT;
    v_loan_id  UUID;
    v_updated_count INT;
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
        RETURN jsonb_build_object('success', false, 'error', 'Only Finance corporations can approve loans');
    END IF;

    -- Overleverage gate (Stressed at 8+).
    IF COALESCE(v_bank.corp_overleverage, 0) >= 8 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Bank is overleveraged — reduce exposure before approving new loans');
    END IF;

    -- Request must exist, be pending, and target this bank.
    SELECT * INTO v_request FROM finance_loan_requests WHERE id = p_request_id;
    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan request not found');
    END IF;
    IF v_request.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Request is %s, no longer accepting approvals', v_request.status));
    END IF;
    IF NOT (p_bank_faction_id = ANY(v_request.target_bank_ids)) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bank was not invited to bid on this request');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- First-wins: optimistic lock on status='pending'.
    UPDATE finance_loan_requests
       SET status            = 'approved',
           winning_bank_id   = p_bank_faction_id,
           resolved_at_tick  = v_tick,
           updated_at        = now()
     WHERE id     = p_request_id
       AND status = 'pending';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Another bank approved first or the request changed state');
    END IF;

    -- Mint the loan in pending_payout state.
    INSERT INTO finance_loans (
        request_id, lender_faction_id, borrower_faction_id, nation_id,
        principal, apr, term_ticks, outstanding,
        status, issued_at_tick, matures_at_tick
    ) VALUES (
        p_request_id, p_bank_faction_id, v_request.requesting_faction_id, v_request.requesting_nation_id,
        v_request.principal, v_request.requested_apr, v_request.term_ticks, v_request.principal,
        'pending_payout', v_tick, v_tick + v_request.term_ticks
    ) RETURNING id INTO v_loan_id;

    RETURN jsonb_build_object(
        'success', true,
        'loan_id', v_loan_id,
        'status',  'pending_payout',
        'message', 'Approved. Use Pay Out Loan to disburse.'
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION approve_loan_request(UUID, UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- decline_loan_request: bank rejects
-- ─────────────────────────────────────────────────────────────
-- Per-bank decline tracking. When every targeted bank has declined,
-- the request flips to 'declined' so the borrower stops waiting.
CREATE OR REPLACE FUNCTION decline_loan_request(
    p_request_id      UUID,
    p_bank_faction_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user     UUID := auth.uid();
    v_bank     factions%ROWTYPE;
    v_request  finance_loan_requests%ROWTYPE;
    v_tick     INT;
    v_all_declined BOOLEAN;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    SELECT * INTO v_bank FROM factions WHERE id = p_bank_faction_id;
    IF v_bank.id IS NULL OR (v_bank.id <> v_user AND v_bank.linked_user_id IS DISTINCT FROM v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this bank');
    END IF;

    SELECT * INTO v_request FROM finance_loan_requests WHERE id = p_request_id;
    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan request not found');
    END IF;
    IF v_request.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Request is %s; cannot decline', v_request.status));
    END IF;
    IF NOT (p_bank_faction_id = ANY(v_request.target_bank_ids)) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bank was not invited to bid on this request');
    END IF;
    IF p_bank_faction_id = ANY(v_request.declined_by_bank_ids) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You already declined this request');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Append this bank to declined_by_bank_ids.
    UPDATE finance_loan_requests
       SET declined_by_bank_ids = array_append(declined_by_bank_ids, p_bank_faction_id),
           updated_at            = now()
     WHERE id = p_request_id
       AND NOT (p_bank_faction_id = ANY(declined_by_bank_ids));

    -- If every targeted bank has now declined, terminal-state the request.
    SELECT (
        SELECT count(*) FROM unnest(target_bank_ids) bid
                       WHERE bid = ANY(array_append(declined_by_bank_ids, p_bank_faction_id))
    ) = array_length(target_bank_ids, 1)
      INTO v_all_declined
      FROM finance_loan_requests
     WHERE id = p_request_id;

    IF v_all_declined THEN
        UPDATE finance_loan_requests
           SET status = 'declined',
               resolved_at_tick = v_tick
         WHERE id = p_request_id
           AND status = 'pending';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'all_banks_declined', v_all_declined
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION decline_loan_request(UUID, UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- pay_out_loan: bank disburses cash, debt clock starts
-- ─────────────────────────────────────────────────────────────
-- The Pay Out Loan action. Validates cash, transfers principal
-- from bank to borrower, flips loan to 'active'. Per the user's
-- spec: amortization runs from this point (Phase C4 will debit
-- per-tick payments).
CREATE OR REPLACE FUNCTION pay_out_loan(
    p_loan_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user     UUID := auth.uid();
    v_loan     finance_loans%ROWTYPE;
    v_lender   factions%ROWTYPE;
    v_borrower factions%ROWTYPE;
    v_tick     INT;
    v_updated_count INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_loan FROM finance_loans WHERE id = p_loan_id;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan not found');
    END IF;
    IF v_loan.status <> 'pending_payout' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Loan is %s; cannot pay out', v_loan.status));
    END IF;

    SELECT * INTO v_lender FROM factions WHERE id = v_loan.lender_faction_id;
    IF v_lender.id IS NULL OR (v_lender.id <> v_user AND v_lender.linked_user_id IS DISTINCT FROM v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own the lender bank');
    END IF;

    SELECT * INTO v_borrower FROM factions WHERE id = v_loan.borrower_faction_id;
    IF v_borrower.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Borrower no longer exists');
    END IF;

    -- Bank cash check.
    IF COALESCE(v_lender.corp_cash_reserves, 0) < v_loan.principal THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient cash — need $%s, have $%s',
                            to_char(v_loan.principal, 'FM999,999,999,999'),
                            to_char(v_lender.corp_cash_reserves, 'FM999,999,999,999')));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Transfer cash. Lender always a corp; borrower always a corp in C2.
    UPDATE factions
       SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) - v_loan.principal
     WHERE id = v_lender.id;
    UPDATE factions
       SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_loan.principal
     WHERE id = v_borrower.id;

    -- Flip loan to active, with optimistic lock so a double-click doesn't
    -- transfer twice. matures_at_tick is rebased to NOW + term_ticks
    -- because the term clock starts on payout, not on approval.
    UPDATE finance_loans
       SET status            = 'active',
           issued_at_tick    = v_tick,
           matures_at_tick   = v_tick + term_ticks,
           updated_at        = now()
     WHERE id     = p_loan_id
       AND status = 'pending_payout';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        -- Race: someone already paid out. Roll the cash back.
        UPDATE factions SET corp_cash_reserves = corp_cash_reserves + v_loan.principal WHERE id = v_lender.id;
        UPDATE factions SET corp_cash_reserves = corp_cash_reserves - v_loan.principal WHERE id = v_borrower.id;
        RETURN jsonb_build_object('success', false, 'error', 'Loan was already paid out');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'loan_id', p_loan_id,
        'principal_disbursed', v_loan.principal,
        'matures_at_tick', v_tick + v_loan.term_ticks
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION pay_out_loan(UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- cancel_loan_request: borrower pulls out before approval
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cancel_loan_request(
    p_request_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user    UUID := auth.uid();
    v_request finance_loan_requests%ROWTYPE;
    v_borrower factions%ROWTYPE;
    v_tick    INT;
    v_updated_count INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_request FROM finance_loan_requests WHERE id = p_request_id;
    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan request not found');
    END IF;
    SELECT * INTO v_borrower FROM factions WHERE id = v_request.requesting_faction_id;
    IF v_borrower.id IS NULL OR (v_borrower.id <> v_user AND v_borrower.linked_user_id IS DISTINCT FROM v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this faction');
    END IF;
    IF v_request.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Cannot cancel — request is %s', v_request.status));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE finance_loan_requests
       SET status = 'cancelled',
           resolved_at_tick = v_tick,
           updated_at = now()
     WHERE id     = p_request_id
       AND status = 'pending';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request changed state before cancel');
    END IF;

    RETURN jsonb_build_object('success', true, 'request_id', p_request_id);
END;
$func$;

GRANT EXECUTE ON FUNCTION cancel_loan_request(UUID) TO authenticated;
