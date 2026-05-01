-- ══════════════════════════════════════════════════════════════
-- Finance Operations Phase C2 — audit-pass fixes
--
-- Three bugs surfaced by the second-pass audit on the C1+C2
-- migrations (20260519, 20260520):
--
-- 1. decline_loan_request: v_all_declined math was wrong.
--    array_append(declined_by_bank_ids, p_bank_faction_id) was
--    used AFTER the UPDATE had already appended the bank,
--    double-counting it. Result: "all banks declined" never
--    fired, so requests with N targeted banks would only ever
--    flip to 'declined' via expiry, never via unanimous decline.
--    Fix: read post-UPDATE declined_by_bank_ids directly.
--
-- 2. pay_out_loan: lender cash deduct was non-atomic.
--    The cash check (IF v_lender.corp_cash_reserves < principal)
--    and the UPDATE that subtracts it were in separate
--    statements; concurrent activity on the lender (bid fees,
--    wages, another pay-out) could deplete cash between them and
--    push corp_cash_reserves negative.
--    Fix: combine into a single conditional UPDATE with
--    WHERE corp_cash_reserves >= principal, then GET DIAGNOSTICS
--    to detect the race.
--
-- 3. submit_loan_request: self-loan was permitted.
--    A Finance corp could target itself in target_bank_ids and
--    then approve its own request — money-loop bug.
--    Fix: reject if requesting_faction_id appears in
--    target_bank_ids.
--
-- Also: tag closed_at_tick / last_payment_tick on finance_loans
-- with a comment noting they're consumed by Phase C4 (per-tick
-- payment processor).
-- ══════════════════════════════════════════════════════════════

-- ── Bug 3 fix: prevent self-loan in submit_loan_request ──
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

    -- AUDIT FIX (Bug 3): block self-loan. A Finance corp targeting
    -- itself could approve its own request and create a money loop.
    IF p_requesting_faction_id = ANY(p_target_bank_ids) THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Cannot target your own corporation as a bank');
    END IF;

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

-- ── Bug 1 fix: correct v_all_declined check in decline_loan_request ──
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

    UPDATE finance_loan_requests
       SET declined_by_bank_ids = array_append(declined_by_bank_ids, p_bank_faction_id),
           updated_at            = now()
     WHERE id = p_request_id
       AND NOT (p_bank_faction_id = ANY(declined_by_bank_ids));

    -- AUDIT FIX (Bug 1): read POST-UPDATE declined_by_bank_ids directly.
    -- The previous version used array_append(declined_by_bank_ids,
    -- p_bank_faction_id), which double-counted the bank since the
    -- UPDATE had already appended it. Result: v_all_declined never
    -- evaluated true, so the status never flipped via this path.
    SELECT (
        SELECT count(*) FROM unnest(target_bank_ids) bid
                       WHERE bid = ANY(declined_by_bank_ids)
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

-- ── Bug 2 fix: atomic lender cash deduct in pay_out_loan ──
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- AUDIT FIX (Bug 2): atomic lender cash deduct. The previous version
    -- did the cash check on a stale read of v_lender, then a separate
    -- UPDATE — concurrent activity on the lender between the two could
    -- push corp_cash_reserves negative. Combine into one conditional
    -- UPDATE that filters on cash >= principal at write time.
    UPDATE factions
       SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) - v_loan.principal
     WHERE id = v_lender.id
       AND COALESCE(corp_cash_reserves, 0) >= v_loan.principal;
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient cash — bank cash dropped below $%s before payout',
                            to_char(v_loan.principal, 'FM999,999,999,999')));
    END IF;

    -- Borrower credit. No race concern (borrower is gaining cash).
    UPDATE factions
       SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_loan.principal
     WHERE id = v_borrower.id;

    -- Flip loan to active, optimistic lock so a double-click can't
    -- transfer twice. Term clock starts on payout, not approval.
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

-- ── Document the dead-state columns on finance_loans ──
COMMENT ON COLUMN finance_loans.last_payment_tick IS
    'Tick of the most recent amortization payment. Set by Phase C4 per-tick processor; NULL until first payment fires.';
COMMENT ON COLUMN finance_loans.closed_at_tick IS
    'Tick at which the loan reached a terminal state (paid / defaulted / foreclosed / called). Set by Phase C4; NULL while status = active.';
