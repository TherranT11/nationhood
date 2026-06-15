-- ════════════════════════════════════════════════════════════════════
-- 20270937 — Personal loans converge on the treasury model + residence
--            collateral for businessmen
--
-- History: personal loans began (20270426) as an owner-funded mechanic —
-- the bank OWNER's party_funds moved to/from the borrower at a fixed,
-- then bid (20270448/20270449), APR. Separately, the corporate credit
-- market (20270894) + deposit ledger (20270897) established the bank's
-- CORP TREASURY, a posted prime rate sheet, executive actions and
-- deposit settlement as the house money model.
--
-- This migration converges personal loans onto that treasury model and
-- opens borrowing to BUSINESSMEN secured by their residence:
--   • Funding: the lender corp's TREASURY (not the owner's pocket).
--   • Pricing: the bank's posted prime (offers no longer carry a bid).
--   • Gates:   rate sheet + executive action + deposit settle + the
--              existing banking-office-in-borrower's-nation eligibility.
--   • Borrower: entrepreneur OR businessman.
--   • Secured: a businessman pledges his residence; the request (and
--              issue) is capped at its worth; an overdue secured loan
--              can be foreclosed — the residence is liquidated, the debt
--              recovered to treasury, any surplus returned, the home
--              lost, the loan closed 'seized'.
--
-- In-flight loans are preserved: personal_loans.funding_source backfills
-- to 'owner_funds', so their repayments keep crediting the owner who
-- actually funded them. Every NEW loan is 'treasury'. The canonical
-- paydown (apply_personal_loan_paydown, shared with buy_building)
-- branches on funding_source — one helper, both worlds.
--
-- Accounting: principal moving either way bypasses corp_cash_events
-- (not income); interest paid into a treasury loan IS bank income
-- (corp_cash_events, revenue_finance). Mirrors 20270894.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema — additive; existing rows keep their old behavior ───────
ALTER TABLE public.personal_loan_requests
    ADD COLUMN IF NOT EXISTS borrower_kind    text NOT NULL DEFAULT 'entrepreneur',
    ADD COLUMN IF NOT EXISTS collateral_name  text,
    ADD COLUMN IF NOT EXISTS collateral_value bigint;
ALTER TABLE public.personal_loan_requests DROP CONSTRAINT IF EXISTS personal_loan_requests_borrower_kind_check;
ALTER TABLE public.personal_loan_requests ADD  CONSTRAINT personal_loan_requests_borrower_kind_check
    CHECK (borrower_kind IN ('entrepreneur', 'businessman'));

ALTER TABLE public.personal_loans
    ADD COLUMN IF NOT EXISTS funding_source   text NOT NULL DEFAULT 'owner_funds',
    ADD COLUMN IF NOT EXISTS collateral_name  text,
    ADD COLUMN IF NOT EXISTS collateral_value bigint,
    ADD COLUMN IF NOT EXISTS due_tick         int;
ALTER TABLE public.personal_loans DROP CONSTRAINT IF EXISTS personal_loans_funding_source_check;
ALTER TABLE public.personal_loans ADD  CONSTRAINT personal_loans_funding_source_check
    CHECK (funding_source IN ('owner_funds', 'treasury'));
-- Open up 'seized' alongside the original active/paid.
ALTER TABLE public.personal_loans DROP CONSTRAINT IF EXISTS personal_loans_status_check;
ALTER TABLE public.personal_loans ADD  CONSTRAINT personal_loans_status_check
    CHECK (status IN ('active', 'paid', 'seized'));

-- ── 2. Borrower resolver — the caller's entrepreneur OR businessman ───
-- One source for "who is borrowing" across the read + create paths.
CREATE OR REPLACE FUNCTION public._personal_loan_borrower(p_uid uuid)
RETURNS public.factions
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT f.* FROM factions f
     WHERE f.faction_type IN ('entrepreneur', 'businessman')
       AND f.abandoned_at IS NULL
       AND (f.id = p_uid OR f.linked_user_id = p_uid)
     ORDER BY f.created_at ASC
     LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public._personal_loan_borrower(uuid) FROM PUBLIC;

-- ── 3. get_my_personal_loan — generalize borrower; surface collateral ─
CREATE OR REPLACE FUNCTION public.get_my_personal_loan()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid            uuid := auth.uid();
    v_fac            factions%ROWTYPE;
    v_loan           personal_loans%ROWTYPE;
    v_tick           int;
    v_ticks_passed   int;
    v_new_interest   numeric;
    v_total_interest numeric;
    v_lender_name    text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('has_loan', false, 'reason', 'not_authenticated');
    END IF;

    v_fac := _personal_loan_borrower(v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('has_loan', false, 'reason', 'no_borrower');
    END IF;

    SELECT * INTO v_loan FROM personal_loans
     WHERE borrower_faction_id = v_fac.id AND status = 'active'
     LIMIT 1;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('has_loan', false);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, v_loan.last_accrual_tick);
    v_ticks_passed := GREATEST(0, v_tick - v_loan.last_accrual_tick);
    v_new_interest := v_loan.principal_remaining * v_loan.apr_pct / 100.0 / 144.0 * v_ticks_passed;
    v_total_interest := v_loan.accrued_interest_unpaid + v_new_interest;

    SELECT name INTO v_lender_name FROM entrepreneur_corps WHERE id = v_loan.lender_corp_id;

    RETURN jsonb_build_object(
        'has_loan',            true,
        'loan_id',             v_loan.id,
        'principal',           v_loan.principal,
        'principal_remaining', v_loan.principal_remaining,
        'apr_pct',             v_loan.apr_pct,
        'accrued_interest',    ROUND(v_total_interest)::bigint,
        'total_owed',          v_loan.principal_remaining + ROUND(v_total_interest)::bigint,
        'lender_corp_name',    v_lender_name,
        'funding_source',      v_loan.funding_source,
        'collateral_name',     v_loan.collateral_name,
        'collateral_value',    v_loan.collateral_value,
        'due_tick',            v_loan.due_tick,
        'requested_at_tick',   v_loan.requested_at_tick,
        'current_tick',        v_tick
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_personal_loan() TO authenticated;

-- ── 4. open_personal_loan_request — entrepreneur or businessman ───────
-- Businessman requests are secured: capped at the residence's worth,
-- collateral snapshot taken for the board.
CREATE OR REPLACE FUNCTION public.open_personal_loan_request(
    p_principal     bigint,
    p_term_ticks    int,
    p_bidding_ticks int DEFAULT 6
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_fac        factions%ROWTYPE;
    v_tick       int;
    v_worth      bigint;
    v_coll_name  text;
    v_coll_value bigint;
    v_req_id     uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_principal IS NULL OR p_principal < 100000 OR p_principal > 25000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_principal');
    END IF;
    IF p_term_ticks IS NULL OR p_term_ticks < 12 OR p_term_ticks > 240 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_term');
    END IF;
    IF p_bidding_ticks IS NULL OR p_bidding_ticks < 1 OR p_bidding_ticks > 48 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_bidding_window');
    END IF;

    v_fac := _personal_loan_borrower(v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_borrower');
    END IF;
    -- Lock the borrower row to serialize the one-pending / one-active gates.
    SELECT * INTO v_fac FROM factions WHERE id = v_fac.id FOR UPDATE;
    IF v_fac.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    -- Secured against the residence for businessmen.
    IF v_fac.faction_type = 'businessman' THEN
        v_worth := FLOOR(GREATEST(0, COALESCE(v_fac.biz_residence_worth, 0)))::bigint;
        IF v_worth < 100000 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_collateral');
        END IF;
        IF p_principal > v_worth THEN
            RETURN jsonb_build_object('success', false, 'reason', 'exceeds_collateral',
                'cap', v_worth, 'ask', p_principal);
        END IF;
        v_coll_name  := v_fac.biz_residence_name;
        v_coll_value := v_worth;
    END IF;

    IF EXISTS (SELECT 1 FROM personal_loans
                WHERE borrower_faction_id = v_fac.id AND status = 'active') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_already_active');
    END IF;
    IF EXISTS (SELECT 1 FROM personal_loan_requests
                WHERE borrower_faction_id = v_fac.id AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_already_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO personal_loan_requests
        (borrower_faction_id, principal, term_ticks, placed_at_tick, expires_at_tick,
         borrower_kind, collateral_name, collateral_value)
    VALUES
        (v_fac.id, p_principal, p_term_ticks, v_tick, v_tick + p_bidding_ticks,
         v_fac.faction_type, v_coll_name, v_coll_value)
    RETURNING id INTO v_req_id;

    RETURN jsonb_build_object(
        'success', true, 'request_id', v_req_id, 'principal', p_principal,
        'term_ticks', p_term_ticks, 'expires_at_tick', v_tick + p_bidding_ticks,
        'borrower_kind', v_fac.faction_type, 'collateral_value', v_coll_value);
END;
$$;
GRANT EXECUTE ON FUNCTION public.open_personal_loan_request(bigint, int, int) TO authenticated;

-- ── 5. offer_personal_loan — posted prime, treasury-gated ─────────────
-- The bid APR is gone: the offer carries the bank's posted prime
-- (stored in offers.apr as a ratio so the board's reads are unchanged).
-- Costs an executive action; gated on the rate sheet, settled treasury,
-- and the existing banking-office-in-borrower's-nation eligibility.
DROP FUNCTION IF EXISTS public.offer_personal_loan(uuid, uuid, numeric);
CREATE OR REPLACE FUNCTION public.offer_personal_loan(
    p_request_id   uuid,
    p_bank_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_bank     entrepreneur_corps%ROWTYPE;
    v_req      personal_loan_requests%ROWTYPE;
    v_borrower factions%ROWTYPE;
    v_tick     int;
    v_apr      numeric;
    v_offer_id uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_bank_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock order request → bank (matches accept) to stay deadlock-free.
    SELECT * INTO v_req FROM personal_loan_requests WHERE id = p_request_id FOR UPDATE;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_pending');
    END IF;

    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id FOR UPDATE;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;
    IF v_bank.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_banking_corp');
    END IF;
    v_fac := _corp_owner_faction(v_bank.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    IF v_bank.bank_prime_rate_bps IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_rate_sheet');
    END IF;
    v_apr := v_bank.bank_prime_rate_bps / 10000.0;
    IF v_apr > 0.5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'prime_rate_too_high', 'cap_bps', 5000);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_tick > v_req.expires_at_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_expired');
    END IF;

    -- Eligibility: bank HQ in borrower's nation + a completed banking_office there.
    SELECT * INTO v_borrower FROM factions WHERE id = v_req.borrower_faction_id;
    IF v_borrower.nation_id IS NULL OR v_bank.hq_nation_id <> v_borrower.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_mismatch');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM corp_buildings
         WHERE owner_corp_id = v_bank.id
           AND nation_id     = v_borrower.nation_id
           AND building_type = 'banking_office'
           AND status        = 'completed'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_banking_office');
    END IF;

    -- No lending to a borrower the bank's account also controls.
    IF v_borrower.id = v_uid OR v_borrower.linked_user_id = v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'self_dealing');
    END IF;

    -- Settle deposits, then the treasury must cover the ticket.
    PERFORM _bank_settle_deposits(p_bank_corp_id);
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id;
    IF FLOOR(COALESCE(v_bank.treasury_cash, 0))::bigint < v_req.principal THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_req.principal, 'have', FLOOR(COALESCE(v_bank.treasury_cash, 0))::bigint);
    END IF;
    IF COALESCE(v_bank.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    INSERT INTO personal_loan_offers (request_id, bank_corp_id, apr, placed_at_tick)
    VALUES (p_request_id, p_bank_corp_id, v_apr, v_tick)
    ON CONFLICT (request_id, bank_corp_id) WHERE status = 'pending'
        DO UPDATE SET apr = EXCLUDED.apr, placed_at_tick = EXCLUDED.placed_at_tick
    RETURNING id INTO v_offer_id;

    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_bank_corp_id;

    PERFORM _log_corp_history(p_bank_corp_id, v_tick,
        format('Offered a personal loan of $%s at %s%% prime.',
               v_req.principal, v_bank.bank_prime_rate_bps / 100));

    RETURN jsonb_build_object('success', true, 'offer_id', v_offer_id,
        'request_id', p_request_id, 'apr', v_apr);
END;
$$;
GRANT EXECUTE ON FUNCTION public.offer_personal_loan(uuid, uuid) TO authenticated;

-- ── 6. accept_personal_loan_offer — disburse from treasury ────────────
CREATE OR REPLACE FUNCTION public.accept_personal_loan_offer(p_offer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_offer    personal_loan_offers%ROWTYPE;
    v_req      personal_loan_requests%ROWTYPE;
    v_borrower factions%ROWTYPE;
    v_bank     entrepreneur_corps%ROWTYPE;
    v_tick     int;
    v_worth    bigint;
    v_loan_id  uuid;
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

    -- Caller must control the request's borrower faction.
    SELECT * INTO v_borrower FROM factions
     WHERE id = v_req.borrower_faction_id
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type IN ('entrepreneur', 'businessman')
     FOR UPDATE;
    IF v_borrower.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_borrower');
    END IF;

    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = v_offer.bank_corp_id FOR UPDATE;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;

    PERFORM _bank_settle_deposits(v_bank.id);
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = v_offer.bank_corp_id;
    IF FLOOR(COALESCE(v_bank.treasury_cash, 0))::bigint < v_req.principal THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_insufficient_treasury',
            'have', FLOOR(COALESCE(v_bank.treasury_cash, 0))::bigint, 'need', v_req.principal);
    END IF;

    -- Re-verify the residence still covers a secured ticket.
    IF v_req.borrower_kind = 'businessman' THEN
        v_worth := FLOOR(GREATEST(0, COALESCE(v_borrower.biz_residence_worth, 0)))::bigint;
        IF v_req.principal > v_worth THEN
            RETURN jsonb_build_object('success', false, 'reason', 'under_collateralized',
                'cap', v_worth, 'ask', v_req.principal);
        END IF;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Cash: treasury → borrower. Principal is not income — no event.
    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) - v_req.principal
     WHERE id = v_bank.id;
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_req.principal
     WHERE id = v_borrower.id;

    INSERT INTO personal_loans (
        borrower_faction_id, lender_corp_id, principal, apr_pct,
        principal_remaining, accrued_interest_unpaid, last_accrual_tick,
        requested_at_tick, status, funding_source,
        collateral_name, collateral_value, due_tick
    ) VALUES (
        v_borrower.id, v_bank.id, v_req.principal, v_offer.apr * 100,
        v_req.principal, 0, v_tick,
        v_tick, 'active', 'treasury',
        v_req.collateral_name, v_req.collateral_value, v_tick + v_req.term_ticks
    ) RETURNING id INTO v_loan_id;

    UPDATE personal_loan_offers SET status = 'accepted', finalized_at_tick = v_tick
     WHERE id = p_offer_id;
    UPDATE personal_loan_offers SET status = 'auto_declined', finalized_at_tick = v_tick
     WHERE request_id = v_req.id AND id <> p_offer_id AND status = 'pending';
    UPDATE personal_loan_requests
       SET status = 'accepted', accepted_by_corp_id = v_bank.id, finalized_at_tick = v_tick
     WHERE id = v_req.id;

    PERFORM _log_corp_history(v_bank.id, v_tick,
        format('Issued a $%s personal loan from treasury, due tick %s.',
               v_req.principal, v_tick + v_req.term_ticks));

    RETURN jsonb_build_object('success', true, 'loan_id', v_loan_id,
        'lender_corp_id', v_bank.id, 'principal', v_req.principal,
        'apr_pct', v_offer.apr * 100, 'due_tick', v_tick + v_req.term_ticks);
END;
$$;
GRANT EXECUTE ON FUNCTION public.accept_personal_loan_offer(uuid) TO authenticated;

-- ── 7. apply_personal_loan_paydown — route the credit by funding ──────
-- Treasury loans repay the corp treasury (interest = bank income);
-- legacy owner-funds loans repay the owner. Interface unchanged, so
-- make_personal_loan_payment and buy_building keep working untouched.
CREATE OR REPLACE FUNCTION public.apply_personal_loan_paydown(
    p_loan_id uuid,
    p_amount  bigint,
    p_tick    int,
    p_dry_run bool DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_loan           personal_loans%ROWTYPE;
    v_ticks_passed   int;
    v_new_interest   numeric;
    v_total_interest numeric;
    v_int_due_bigint bigint;
    v_cap            bigint;
    v_interest_paid  bigint;
    v_principal_paid bigint;
    v_total_applied  bigint;
    v_new_status     text;
BEGIN
    SELECT * INTO v_loan FROM personal_loans
     WHERE id = p_loan_id AND status = 'active'
     FOR UPDATE;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('total_applied', 0, 'no_active_loan', true);
    END IF;

    v_ticks_passed   := GREATEST(0, p_tick - v_loan.last_accrual_tick);
    v_new_interest   := v_loan.principal_remaining * v_loan.apr_pct / 100.0 / 144.0 * v_ticks_passed;
    v_total_interest := v_loan.accrued_interest_unpaid + v_new_interest;
    v_int_due_bigint := ROUND(v_total_interest)::bigint;

    v_cap            := LEAST(GREATEST(0, p_amount), v_int_due_bigint + v_loan.principal_remaining);
    v_interest_paid  := LEAST(v_cap, v_int_due_bigint);
    v_principal_paid := LEAST(v_cap - v_interest_paid, v_loan.principal_remaining);
    v_total_applied  := v_interest_paid + v_principal_paid;

    v_new_status := CASE
        WHEN (v_loan.principal_remaining - v_principal_paid) = 0
         AND (v_total_interest - v_interest_paid) <= 0.5
        THEN 'paid'
        ELSE 'active'
    END;

    IF NOT p_dry_run THEN
        UPDATE personal_loans
           SET principal_remaining     = principal_remaining - v_principal_paid,
               accrued_interest_unpaid = GREATEST(0, v_total_interest - v_interest_paid),
               last_accrual_tick       = p_tick,
               status                  = v_new_status,
               closed_at_tick          = CASE WHEN v_new_status = 'paid' THEN p_tick ELSE NULL END
         WHERE id = p_loan_id;

        IF v_loan.lender_corp_id IS NOT NULL AND v_total_applied > 0 THEN
            IF v_loan.funding_source = 'treasury' THEN
                -- Treasury takes the whole payment; interest is income.
                UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + v_total_applied
                 WHERE id = v_loan.lender_corp_id;
                IF v_interest_paid > 0 THEN
                    INSERT INTO corp_cash_events (corp_id, tick, category, label, delta, nation_id)
                    SELECT v_loan.lender_corp_id, p_tick, 'revenue_finance',
                           'Personal loan interest', v_interest_paid, hq_nation_id
                      FROM entrepreneur_corps WHERE id = v_loan.lender_corp_id;
                END IF;
            ELSE
                -- Legacy: credit the owner who funded the loan from pocket.
                UPDATE factions f
                   SET party_funds = COALESCE(party_funds, 0) + v_total_applied
                  FROM entrepreneur_corps c
                 WHERE c.id = v_loan.lender_corp_id AND f.id = c.owner_faction_id;
            END IF;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'total_applied',             v_total_applied,
        'interest_paid',             v_interest_paid,
        'principal_paid',            v_principal_paid,
        'status_after',              v_new_status,
        'principal_remaining_after', v_loan.principal_remaining - v_principal_paid,
        'accrued_interest_after',    GREATEST(0, ROUND(v_total_interest - v_interest_paid)::bigint),
        'lender_corp_id',            v_loan.lender_corp_id,
        'no_active_loan',            false
    );
END;
$$;
-- Internal only. It moves the loan + credits the lender WITHOUT debiting
-- the payer (callers route their own cash), so a direct client call would
-- forgive debt / mint money. EXECUTE defaults to PUBLIC — lock it down.
-- (Closes a hole open since 20270428, which never revoked it.)
REVOKE EXECUTE ON FUNCTION public.apply_personal_loan_paydown(uuid, bigint, int, bool) FROM PUBLIC;

-- ── 8. make_personal_loan_payment — generalize the borrower check ─────
CREATE OR REPLACE FUNCTION public.make_personal_loan_payment(
    p_loan_id uuid,
    p_amount  bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_loan    personal_loans%ROWTYPE;
    v_tick    int;
    v_preview jsonb;
    v_result  jsonb;
    v_actual  bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
    END IF;

    -- Lock order loan → borrower faction (matches the helper + foreclose).
    SELECT * INTO v_loan FROM personal_loans WHERE id = p_loan_id FOR UPDATE;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_not_found');
    END IF;
    IF v_loan.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_not_active');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_loan.borrower_faction_id
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type IN ('entrepreneur', 'businessman')
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_borrower');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, v_loan.last_accrual_tick);

    v_preview := apply_personal_loan_paydown(p_loan_id, p_amount, v_tick, true);
    v_actual  := (v_preview->>'total_applied')::bigint;

    IF COALESCE(v_fac.party_funds, 0) < v_actual THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_actual);
    END IF;

    v_result := apply_personal_loan_paydown(p_loan_id, p_amount, v_tick, false);

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_actual
     WHERE id = v_fac.id;

    RETURN jsonb_build_object(
        'success', true, 'loan_id', p_loan_id, 'paid', v_actual,
        'interest_paid',       (v_result->>'interest_paid')::bigint,
        'principal_paid',      (v_result->>'principal_paid')::bigint,
        'principal_remaining', (v_result->>'principal_remaining_after')::bigint,
        'accrued_interest',    (v_result->>'accrued_interest_after')::bigint,
        'status',              v_result->>'status_after');
END;
$$;
GRANT EXECUTE ON FUNCTION public.make_personal_loan_payment(uuid, bigint) TO authenticated;

-- ── 9. foreclose_personal_loan — overdue secured loans only ───────────
-- Lender-initiated, lazy (no tick sweep). Past the due tick with a
-- balance owed: liquidate the residence, recover the debt to treasury,
-- return any surplus, the borrower loses the home, the loan closes.
CREATE OR REPLACE FUNCTION public.foreclose_personal_loan(
    p_loan_id      uuid,
    p_bank_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_loan        personal_loans%ROWTYPE;
    v_borrower    factions%ROWTYPE;
    v_bank        entrepreneur_corps%ROWTYPE;
    v_fac         factions%ROWTYPE;
    v_tick        int;
    v_ticks       int;
    v_interest    numeric;
    v_outstanding bigint;
    v_worth       bigint;
    v_recovered   bigint;
    v_surplus     bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_loan_id IS NULL OR p_bank_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock order loan → borrower faction → bank (matches accept/payment).
    SELECT * INTO v_loan FROM personal_loans
     WHERE id = p_loan_id AND lender_corp_id = p_bank_corp_id FOR UPDATE;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_not_found');
    END IF;
    IF v_loan.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_not_active');
    END IF;
    IF v_loan.collateral_value IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_secured');
    END IF;

    SELECT * INTO v_borrower FROM factions WHERE id = v_loan.borrower_faction_id FOR UPDATE;

    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id FOR UPDATE;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    v_fac := _corp_owner_faction(v_bank.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_loan.due_tick IS NULL OR v_tick <= v_loan.due_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_overdue',
            'due_tick', v_loan.due_tick, 'tick', v_tick);
    END IF;

    -- Bring interest current to size the claim (same /144 accrual).
    v_ticks      := GREATEST(0, v_tick - v_loan.last_accrual_tick);
    v_interest   := v_loan.accrued_interest_unpaid
                  + v_loan.principal_remaining * v_loan.apr_pct / 100.0 / 144.0 * v_ticks;
    v_outstanding := GREATEST(0, v_loan.principal_remaining + ROUND(v_interest))::bigint;

    v_worth     := FLOOR(GREATEST(0, COALESCE(v_borrower.biz_residence_worth, 0)))::bigint;
    v_recovered := LEAST(v_worth, v_outstanding);
    v_surplus   := GREATEST(0, v_worth - v_outstanding);

    -- Recovery to treasury (principal recovery, not income).
    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + v_recovered
     WHERE id = p_bank_corp_id;
    -- Borrower loses the home; surplus over the debt returns to them.
    UPDATE factions
       SET biz_residence_worth = 0,
           biz_residence_name  = NULL,
           party_funds         = COALESCE(party_funds, 0) + v_surplus
     WHERE id = v_borrower.id;

    UPDATE personal_loans
       SET status = 'seized', principal_remaining = 0, accrued_interest_unpaid = 0,
           last_accrual_tick = v_tick, closed_at_tick = v_tick
     WHERE id = p_loan_id;

    PERFORM _log_corp_history(p_bank_corp_id, v_tick,
        format('Foreclosed an overdue personal loan — seized %s, recovered $%s of $%s owed.',
               COALESCE(v_loan.collateral_name, 'the residence'), v_recovered, v_outstanding));

    RETURN jsonb_build_object('success', true, 'recovered', v_recovered,
        'surplus', v_surplus, 'outstanding', v_outstanding, 'collateral_value', v_worth);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.foreclose_personal_loan(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.foreclose_personal_loan(uuid, uuid) TO authenticated;

-- ── 10. Retire the legacy owner-funds auto-accept path ────────────────
-- Superseded by the offer market; no UI caller. Dropping it removes the
-- last fixed-rate, owner-funded origination path.
DROP FUNCTION IF EXISTS public.request_personal_loan(bigint);

NOTIFY pgrst, 'reload schema';

COMMIT;
