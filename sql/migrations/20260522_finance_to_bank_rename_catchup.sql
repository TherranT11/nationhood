-- ══════════════════════════════════════════════════════════════
-- Catch-up: rename Phase C tables from finance_* to bank_*
--
-- Backstory: 20260519/20260520/20260521 were originally written
-- with finance_loan_requests / finance_loans, which collided with
-- the legacy finance_loan_requests table that the v2 simplification
-- was supposed to drop but didn't on this DB. The legacy table
-- still has 137 rows powering live shipping insurance / bonds /
-- equity. Cannot drop or rename it without breaking those.
--
-- Fix: rename our new pipeline to bank_* (more accurate semantics
-- anyway — these are specifically banking, not general finance).
-- The legacy finance_* tables are left 100% untouched.
--
-- This catch-up migration is destructive in a controlled way:
-- it drops only the half-applied bank pipeline state we created
-- (the finance_loans table that was successfully created since no
-- legacy table by that name existed, and the 5 RPCs that point at
-- the wrong tables). It does NOT touch the legacy finance_loan_*
-- tables.
--
-- Order:
--   1. DROP the bank-pipeline RPCs (point at wrong tables)
--   2. DROP finance_loans (our half-created table)
--   3. Re-run the schema + RPC creates against bank_* names
--      (full content of the renamed 20260519/20260520/20260521)
-- ══════════════════════════════════════════════════════════════

-- ── 1. Drop bank-pipeline RPCs that targeted the wrong tables ──
DROP FUNCTION IF EXISTS submit_loan_request(UUID, UUID[], BIGINT, INT, NUMERIC, TEXT, TEXT, INT);
DROP FUNCTION IF EXISTS approve_loan_request(UUID, UUID);
DROP FUNCTION IF EXISTS decline_loan_request(UUID, UUID);
DROP FUNCTION IF EXISTS pay_out_loan(UUID);
DROP FUNCTION IF EXISTS cancel_loan_request(UUID);

-- ── 2. Drop our half-created finance_loans table ──
-- IMPORTANT: this is OUR table from 20260519, NOT the legacy
-- finance_active_loans (different name, untouched). If by some
-- chance this table doesn't exist (20260519 never ran), IF EXISTS
-- makes the drop a no-op.
DROP TABLE IF EXISTS finance_loans;

-- ── 3. Create bank_loan_requests + bank_loans ──
CREATE TABLE IF NOT EXISTS bank_loan_requests (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    requesting_faction_id UUID         NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    requesting_nation_id  UUID         NOT NULL REFERENCES nations(id),
    target_bank_ids       UUID[]       NOT NULL DEFAULT '{}',
    principal             BIGINT       NOT NULL CHECK (principal > 0),
    term_ticks            INT          NOT NULL CHECK (term_ticks > 0),
    requested_apr         NUMERIC(6,3) NOT NULL CHECK (requested_apr >= 0 AND requested_apr <= 100),
    risk_grade            TEXT         NOT NULL DEFAULT 'B'
                              CHECK (risk_grade IN ('AAA','AA','A','BBB','BB','B','CCC','CC','C','D')),
    purpose               TEXT,
    status                TEXT         NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','approved','declined','expired','cancelled')),
    expires_at_tick       INT          NOT NULL,
    winning_bank_id       UUID         REFERENCES factions(id) ON DELETE SET NULL,
    declined_by_bank_ids  UUID[]       NOT NULL DEFAULT '{}',
    created_at_tick       INT          NOT NULL,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    resolved_at_tick      INT,
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blr_requesting_faction ON bank_loan_requests (requesting_faction_id);
CREATE INDEX IF NOT EXISTS idx_blr_status            ON bank_loan_requests (status);
CREATE INDEX IF NOT EXISTS idx_blr_expires           ON bank_loan_requests (expires_at_tick);
CREATE INDEX IF NOT EXISTS idx_blr_target_banks_gin  ON bank_loan_requests USING GIN (target_bank_ids);

CREATE TABLE IF NOT EXISTS bank_loans (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id          UUID         NOT NULL UNIQUE REFERENCES bank_loan_requests(id),
    lender_faction_id   UUID         NOT NULL REFERENCES factions(id) ON DELETE RESTRICT,
    borrower_faction_id UUID         NOT NULL REFERENCES factions(id) ON DELETE RESTRICT,
    nation_id           UUID         NOT NULL REFERENCES nations(id),
    principal           BIGINT       NOT NULL CHECK (principal > 0),
    apr                 NUMERIC(6,3) NOT NULL CHECK (apr >= 0 AND apr <= 100),
    term_ticks          INT          NOT NULL CHECK (term_ticks > 0),
    outstanding         BIGINT       NOT NULL CHECK (outstanding >= 0),
    payments_missed     INT          NOT NULL DEFAULT 0 CHECK (payments_missed >= 0),
    status              TEXT         NOT NULL DEFAULT 'pending_payout',
    issued_at_tick      INT          NOT NULL,
    matures_at_tick     INT          NOT NULL,
    last_payment_tick   INT,
    closed_at_tick      INT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER TABLE bank_loans DROP CONSTRAINT IF EXISTS bank_loans_status_check;
ALTER TABLE bank_loans ADD CONSTRAINT bank_loans_status_check
    CHECK (status IN ('pending_payout','active','paid','defaulted','foreclosed','called'));
CREATE INDEX IF NOT EXISTS idx_bloans_lender   ON bank_loans (lender_faction_id);
CREATE INDEX IF NOT EXISTS idx_bloans_borrower ON bank_loans (borrower_faction_id);
CREATE INDEX IF NOT EXISTS idx_bloans_status   ON bank_loans (status);

ALTER TABLE bank_loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_loans         ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bank_loan_requests_read_all" ON bank_loan_requests;
CREATE POLICY "bank_loan_requests_read_all"
    ON bank_loan_requests FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "bank_loans_read_all" ON bank_loans;
CREATE POLICY "bank_loans_read_all"
    ON bank_loans FOR SELECT TO authenticated USING (true);

COMMENT ON COLUMN bank_loans.last_payment_tick IS
    'Tick of the most recent amortization payment. Set by Phase C4 per-tick processor; NULL until first payment fires.';
COMMENT ON COLUMN bank_loans.closed_at_tick IS
    'Tick at which the loan reached a terminal state (paid / defaulted / foreclosed / called). Set by Phase C4; NULL while status = active.';

-- ── 4. Re-create the 5 RPCs targeting bank_* tables (with the
--    audit fixes from 20260521 already folded in) ──

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

    INSERT INTO bank_loan_requests (
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
    v_request  bank_loan_requests%ROWTYPE;
    v_tick     INT;
    v_loan_id  UUID;
    v_updated_count INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

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

    IF COALESCE(v_bank.corp_overleverage, 0) >= 8 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Bank is overleveraged — reduce exposure before approving new loans');
    END IF;

    SELECT * INTO v_request FROM bank_loan_requests WHERE id = p_request_id;
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

    UPDATE bank_loan_requests
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

    INSERT INTO bank_loans (
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
    v_request  bank_loan_requests%ROWTYPE;
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

    SELECT * INTO v_request FROM bank_loan_requests WHERE id = p_request_id;
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

    UPDATE bank_loan_requests
       SET declined_by_bank_ids = array_append(declined_by_bank_ids, p_bank_faction_id),
           updated_at            = now()
     WHERE id = p_request_id
       AND NOT (p_bank_faction_id = ANY(declined_by_bank_ids));

    SELECT (
        SELECT count(*) FROM unnest(target_bank_ids) bid
                       WHERE bid = ANY(declined_by_bank_ids)
    ) = array_length(target_bank_ids, 1)
      INTO v_all_declined
      FROM bank_loan_requests
     WHERE id = p_request_id;

    IF v_all_declined THEN
        UPDATE bank_loan_requests
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


CREATE OR REPLACE FUNCTION pay_out_loan(
    p_loan_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user     UUID := auth.uid();
    v_loan     bank_loans%ROWTYPE;
    v_lender   factions%ROWTYPE;
    v_borrower factions%ROWTYPE;
    v_tick     INT;
    v_updated_count INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_loan FROM bank_loans WHERE id = p_loan_id;
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

    -- Atomic lender debit (audit fix from 20260521).
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

    UPDATE factions
       SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_loan.principal
     WHERE id = v_borrower.id;

    UPDATE bank_loans
       SET status            = 'active',
           issued_at_tick    = v_tick,
           matures_at_tick   = v_tick + term_ticks,
           updated_at        = now()
     WHERE id     = p_loan_id
       AND status = 'pending_payout';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
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


CREATE OR REPLACE FUNCTION cancel_loan_request(
    p_request_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user    UUID := auth.uid();
    v_request bank_loan_requests%ROWTYPE;
    v_borrower factions%ROWTYPE;
    v_tick    INT;
    v_updated_count INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_request FROM bank_loan_requests WHERE id = p_request_id;
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

    UPDATE bank_loan_requests
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

NOTIFY pgrst, 'reload schema';
