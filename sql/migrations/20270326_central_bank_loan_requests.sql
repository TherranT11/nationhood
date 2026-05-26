-- ════════════════════════════════════════════════════════════════════
-- CENTRAL BANK LOANS — Governor approval flow (request → issue / reject)
-- ════════════════════════════════════════════════════════════════════
-- Previously request_central_bank_loan AUTO-ISSUED at the posted rate. Now an
-- entrepreneur's request creates a PENDING loan; the Governor of the Central
-- Bank reviews it and either ISSUES it (disburses + activates at the current
-- posted rate, re-checking lending capacity) or REJECTS it.
--
-- A pending loan carries outstanding = 0 (nothing disbursed yet): it can't be
-- counted as debt by any consumer and doesn't draw lending capacity (which only
-- sums status='active'). issue_central_bank_loan sets outstanding = principal.
-- The per-tick servicer (advance-corp-tick) already filters status='active', so
-- pending/rejected loans are never serviced — no tick-processor change.
--
-- Governor gate mirrors central_bank_set_rate (20270195): caller must own the
-- party seated as the loan-nation's Governor, and the 96-tick term must not have
-- expired. All three RPCs are SECURITY DEFINER (treasury / central_bank_loans
-- are client-write-revoked).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Allow the request lifecycle states.
ALTER TABLE public.central_bank_loans DROP CONSTRAINT IF EXISTS central_bank_loans_status_check;
ALTER TABLE public.central_bank_loans
    ADD CONSTRAINT central_bank_loans_status_check
    CHECK (status IN ('pending','active','repaid','defaulted','rejected'));

-- The Governor's queue + the notification builder read pending-by-nation.
CREATE INDEX IF NOT EXISTS idx_cb_loans_pending ON central_bank_loans (nation_id) WHERE status = 'pending';

-- 2. request_central_bank_loan → create a PENDING request (no cash, no capacity draw).
DROP FUNCTION IF EXISTS public.request_central_bank_loan(uuid, bigint, integer);
CREATE OR REPLACE FUNCTION public.request_central_bank_loan(
    p_corp_id UUID, p_principal BIGINT, p_term_ticks INT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid    UUID := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_nation nations%ROWTYPE;
    v_tick   INT;
    v_id     UUID;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF p_principal IS NULL OR p_principal < 1 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;
    IF p_term_ticks IS NULL OR p_term_ticks < 12 OR p_term_ticks > 240 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_term'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    -- Caller must own the borrowing corp (VERBATIM the entrepreneur prelude).
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur'); END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_corp.hq_nation_id;
    IF v_nation.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_nation'); END IF;
    IF v_nation.central_bank_interest_rate IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_central_bank');
    END IF;

    -- One open request per corp at a time.
    IF EXISTS (SELECT 1 FROM central_bank_loans
                WHERE borrower_corp_id = v_corp.id AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Pending: outstanding 0 (nothing disbursed), rate/started_tick are
    -- placeholders set authoritatively at issue.
    INSERT INTO central_bank_loans
        (nation_id, borrower_corp_id, principal, outstanding, interest_rate, term_ticks, status, started_tick)
    VALUES (v_nation.id, v_corp.id, p_principal, 0, v_nation.central_bank_interest_rate, p_term_ticks, 'pending', v_tick)
    RETURNING id INTO v_id;

    INSERT INTO event_log (nation_id, faction_id, event_name, description_used, category, trigger_key, effects_applied, fired_at_tick)
    VALUES (v_nation.id, v_fac.id, 'Central Bank Loan Requested',
            format('%s requested a $%s Central Bank loan over %s ticks.', v_corp.name, p_principal, p_term_ticks),
            'corporate', 'central_bank_loan_requested',
            jsonb_build_object('loan_id', v_id, 'corp_id', v_corp.id, 'principal', p_principal, 'term_ticks', p_term_ticks),
            v_tick);

    RETURN jsonb_build_object('success', true, 'status', 'pending', 'loan_id', v_id,
                              'principal', p_principal, 'term_ticks', p_term_ticks);
END; $$;

GRANT EXECUTE ON FUNCTION public.request_central_bank_loan(UUID, BIGINT, INT) TO authenticated;

COMMENT ON FUNCTION public.request_central_bank_loan(UUID, BIGINT, INT) IS
    'Files a PENDING Central Bank loan request for the corp''s home-nation bank (no disbursement). The seated Governor issues or rejects it. Owner-only; one pending request per corp. SECURITY DEFINER.';

-- 3. issue_central_bank_loan — Governor approves: disburse + activate.
CREATE OR REPLACE FUNCTION public.issue_central_bank_loan(p_loan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller      UUID := auth.uid();
    v_loan        central_bank_loans%ROWTYPE;
    v_nation      nations%ROWTYPE;
    v_tick        INT;
    v_capacity    BIGINT;
    v_outstanding BIGINT;
    v_available   BIGINT;
BEGIN
    IF v_caller IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_loan FROM central_bank_loans WHERE id = p_loan_id FOR UPDATE;
    IF v_loan.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'loan_not_found'); END IF;
    IF v_loan.status <> 'pending' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_pending'); END IF;

    -- Caller must own the party seated as THIS loan-nation's Governor.
    SELECT n.* INTO v_nation
      FROM nations n JOIN factions f ON f.id = n.central_bank_governor_party_id
     WHERE n.id = v_loan.nation_id AND (f.id = v_caller OR f.linked_user_id = v_caller)
     FOR UPDATE;
    IF v_nation.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_governor'); END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_nation.central_bank_governor_term_end_tick, 0) <= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'term_expired');
    END IF;

    -- Re-check lending capacity at issue time (only active loans draw it down).
    v_capacity := COALESCE(v_nation.central_bank_discretionary, 0) * 100;
    SELECT COALESCE(SUM(outstanding), 0) INTO v_outstanding
      FROM central_bank_loans WHERE nation_id = v_nation.id AND status = 'active';
    v_available := v_capacity - v_outstanding;
    IF v_loan.principal > v_available THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_capacity',
            'available', GREATEST(v_available, 0), 'requested', v_loan.principal);
    END IF;

    -- Disburse to the corp treasury; activate at the CURRENT posted rate, term starts now.
    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + v_loan.principal
     WHERE id = v_loan.borrower_corp_id;

    UPDATE central_bank_loans
       SET status = 'active', outstanding = v_loan.principal,
           interest_rate = v_nation.central_bank_interest_rate, started_tick = v_tick
     WHERE id = v_loan.id;

    INSERT INTO event_log (nation_id, faction_id, event_name, description_used, category, trigger_key, effects_applied, fired_at_tick)
    SELECT v_nation.id, c.owner_faction_id, 'Central Bank Loan Issued',
           format('%s borrowed $%s from the Central Bank at %s%% over %s ticks.',
                  c.name, v_loan.principal, to_char(v_nation.central_bank_interest_rate, 'FM999990.00'), v_loan.term_ticks),
           'corporate', 'central_bank_loan_issued',
           jsonb_build_object('loan_id', v_loan.id, 'corp_id', c.id, 'principal', v_loan.principal,
                              'rate', v_nation.central_bank_interest_rate, 'term_ticks', v_loan.term_ticks),
           v_tick
      FROM entrepreneur_corps c WHERE c.id = v_loan.borrower_corp_id;

    RETURN jsonb_build_object('success', true, 'loan_id', v_loan.id, 'status', 'active',
                              'principal', v_loan.principal, 'rate', v_nation.central_bank_interest_rate,
                              'available_after', v_available - v_loan.principal);
END; $$;

GRANT EXECUTE ON FUNCTION public.issue_central_bank_loan(UUID) TO authenticated;

COMMENT ON FUNCTION public.issue_central_bank_loan(UUID) IS
    'Governor approves a pending Central Bank loan: disburses principal to the corp treasury and activates it at the current posted rate, re-checking lending capacity. Governor-only (seated, in-term). SECURITY DEFINER.';

-- 4. reject_central_bank_loan — Governor declines.
CREATE OR REPLACE FUNCTION public.reject_central_bank_loan(p_loan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_loan   central_bank_loans%ROWTYPE;
    v_nation nations%ROWTYPE;
    v_tick   INT;
BEGIN
    IF v_caller IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_loan FROM central_bank_loans WHERE id = p_loan_id FOR UPDATE;
    IF v_loan.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'loan_not_found'); END IF;
    IF v_loan.status <> 'pending' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_pending'); END IF;

    SELECT n.* INTO v_nation
      FROM nations n JOIN factions f ON f.id = n.central_bank_governor_party_id
     WHERE n.id = v_loan.nation_id AND (f.id = v_caller OR f.linked_user_id = v_caller)
     FOR UPDATE;
    IF v_nation.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_governor'); END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_nation.central_bank_governor_term_end_tick, 0) <= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'term_expired');
    END IF;

    UPDATE central_bank_loans SET status = 'rejected' WHERE id = v_loan.id;

    INSERT INTO event_log (nation_id, faction_id, event_name, description_used, category, trigger_key, effects_applied, fired_at_tick)
    SELECT v_nation.id, c.owner_faction_id, 'Central Bank Loan Rejected',
           format('The Central Bank rejected %s''s $%s loan request.', c.name, v_loan.principal),
           'corporate', 'central_bank_loan_rejected',
           jsonb_build_object('loan_id', v_loan.id, 'corp_id', c.id, 'principal', v_loan.principal),
           v_tick
      FROM entrepreneur_corps c WHERE c.id = v_loan.borrower_corp_id;

    RETURN jsonb_build_object('success', true, 'loan_id', v_loan.id, 'status', 'rejected');
END; $$;

GRANT EXECUTE ON FUNCTION public.reject_central_bank_loan(UUID) TO authenticated;

COMMENT ON FUNCTION public.reject_central_bank_loan(UUID) IS
    'Governor declines a pending Central Bank loan request (marks rejected, no disbursement). Governor-only (seated, in-term). SECURITY DEFINER.';

NOTIFY pgrst, 'reload schema';

COMMIT;
