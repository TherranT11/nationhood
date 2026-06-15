-- ════════════════════════════════════════════════════════════════════
-- 20270936 — The personal credit market: banks lend to businessmen
--
-- The corporate credit market (20270894) lets banks lend to CORPS; this
-- is its sibling for PEOPLE. A businessman pledges his residence and
-- posts a personal loan request; a player bank offers at its posted
-- prime; the bank issues (treasury → the borrower's Cash on Hand); the
-- borrower repays manually from party_funds with the same lazy
-- simple-interest accrual; and an overdue loan can be foreclosed by the
-- lender, liquidating the residence to recover the debt.
--
-- Design (AskUserQuestion rulings): player banks lend · secured against
-- the RESIDENCE (v1; shareholdings collateral is a later increment) ·
-- manual lazy-interest repayment. Kept simpler than the corp market:
-- reuses the bank's rate sheet + executive action + treasury gates, but
-- drops the underwriting/clearing tiers and the clearing-house skim.
--
-- Accounting (one-source seams, same as 20270894):
--   • Principal moving either way is NEVER income — it bypasses
--     corp_cash_events so the lender's tax base stays honest.
--   • Interest paid IS income for the bank (corp_cash_events,
--     revenue_finance). The borrower is a person with no corporate P&L,
--     so there is no deductible-expense mirror.
--
-- Secured: the request (and re-checked at issue) is capped at the
-- residence's worth. A borrower holds at most one personal loan at a
-- time — you can only pledge the one home once.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. The board ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.personal_loan_requests (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    nation_id          uuid REFERENCES public.nations(id) ON DELETE SET NULL,
    amount             bigint NOT NULL CHECK (amount >= 100000 AND amount <= 100000000),
    -- Snapshot of the pledged residence at request time (display only;
    -- issue re-reads the live worth as the real cap).
    collateral_name    text,
    collateral_value   bigint NOT NULL,
    status             text NOT NULL DEFAULT 'open'
                           CHECK (status IN ('open', 'funded', 'withdrawn')),
    created_at_tick    int NOT NULL,
    created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS personal_loan_requests_one_open
    ON public.personal_loan_requests (borrower_faction_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS personal_loan_requests_open_idx
    ON public.personal_loan_requests (status, created_at_tick DESC);

CREATE TABLE IF NOT EXISTS public.personal_loan_offers (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id       uuid NOT NULL REFERENCES public.personal_loan_requests(id) ON DELETE CASCADE,
    bank_corp_id     uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    amount           bigint NOT NULL,
    rate_bps         int NOT NULL,
    term_ticks       int NOT NULL CHECK (term_ticks IN (12, 24, 36)),
    comments         text CHECK (comments IS NULL OR length(comments) <= 300),
    status           text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'accepted', 'declined', 'issued')),
    created_at_tick  int NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS personal_loan_offers_one_pending_per_bank
    ON public.personal_loan_offers (request_id, bank_corp_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS personal_loan_offers_request_idx
    ON public.personal_loan_offers (request_id, status);

CREATE TABLE IF NOT EXISTS public.personal_loans (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_corp_id        uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    borrower_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    request_id          uuid REFERENCES public.personal_loan_requests(id) ON DELETE SET NULL,
    offer_id            uuid REFERENCES public.personal_loan_offers(id)   ON DELETE SET NULL,
    principal           bigint NOT NULL,
    rate_bps            int NOT NULL,
    term_ticks          int NOT NULL,
    originated_tick     int NOT NULL,
    due_tick            int NOT NULL,
    -- Lazy accrual: balance × rate/12 per elapsed tick, brought current
    -- inside personal_pay_loan / bank_seize_personal_loan.
    balance             numeric NOT NULL,
    accrued_interest    numeric NOT NULL DEFAULT 0,
    last_accrual_tick   int NOT NULL,
    collateral_name     text,
    collateral_value    bigint NOT NULL,
    status              text NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'repaid', 'seized')),
    created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS personal_loans_one_active_per_borrower
    ON public.personal_loans (borrower_faction_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS personal_loans_bank_idx
    ON public.personal_loans (bank_corp_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS personal_loans_one_per_offer
    ON public.personal_loans (offer_id) WHERE offer_id IS NOT NULL;

-- Public record — every row readable, every write through the definers.
ALTER TABLE public.personal_loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_loan_offers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_loans         ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS personal_loan_requests_select ON public.personal_loan_requests;
CREATE POLICY personal_loan_requests_select ON public.personal_loan_requests
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS personal_loan_offers_select ON public.personal_loan_offers;
CREATE POLICY personal_loan_offers_select ON public.personal_loan_offers
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS personal_loans_select ON public.personal_loans;
CREATE POLICY personal_loans_select ON public.personal_loans
    FOR SELECT TO authenticated USING (true);

-- Borrower resolution — the caller's businessman faction.
CREATE OR REPLACE FUNCTION public._personal_borrower(p_faction_id uuid, p_uid uuid)
RETURNS public.factions
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT f.* FROM factions f
     WHERE f.id = p_faction_id
       AND (f.id = p_uid OR f.linked_user_id = p_uid)
       AND f.faction_type = 'businessman'
       AND f.abandoned_at IS NULL
     LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public._personal_borrower(uuid, uuid) FROM PUBLIC;

-- ── 2. The borrower files an ask (pledging the residence) ─────────────
CREATE OR REPLACE FUNCTION public.personal_request_loan(
    p_faction_id uuid,
    p_amount     bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_fac factions%ROWTYPE;
    v_worth bigint;
    v_tick int;
    v_id uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_amount IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_amount < 100000 OR p_amount > 100000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount',
            'min', 100000, 'max', 100000000);
    END IF;

    -- Lock the borrower row — serializes the one-open / one-active checks.
    SELECT * INTO v_fac FROM factions WHERE id = p_faction_id FOR UPDATE;
    IF v_fac.id IS NULL OR v_fac.faction_type <> 'businessman'
       OR NOT (v_fac.id = v_uid OR v_fac.linked_user_id = v_uid)
       OR v_fac.abandoned_at IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    -- Secured against the residence — can't borrow more than it's worth.
    v_worth := FLOOR(GREATEST(0, COALESCE(v_fac.biz_residence_worth, 0)))::bigint;
    IF v_worth < 100000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_collateral');
    END IF;
    IF p_amount > v_worth THEN
        RETURN jsonb_build_object('success', false, 'reason', 'exceeds_collateral',
            'cap', v_worth, 'ask', p_amount);
    END IF;

    IF EXISTS (SELECT 1 FROM personal_loans
                WHERE borrower_faction_id = p_faction_id AND status = 'active') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_already_active');
    END IF;
    IF EXISTS (SELECT 1 FROM personal_loan_requests
                WHERE borrower_faction_id = p_faction_id AND status = 'open') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_already_open');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO personal_loan_requests (
        borrower_faction_id, nation_id, amount, collateral_name, collateral_value, created_at_tick)
    VALUES (p_faction_id, v_fac.nation_id, p_amount,
            v_fac.biz_residence_name, v_worth, v_tick)
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'request_id', v_id, 'amount', p_amount);
END $$;

REVOKE EXECUTE ON FUNCTION public.personal_request_loan(uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.personal_request_loan(uuid, bigint) TO authenticated;

-- ── 3. ... or pulls it ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.personal_withdraw_loan_request(
    p_request_id uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_req personal_loan_requests%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_req FROM personal_loan_requests
     WHERE id = p_request_id AND borrower_faction_id = p_faction_id FOR UPDATE;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF (_personal_borrower(p_faction_id, v_uid)).id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_req.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_closed');
    END IF;

    UPDATE personal_loan_requests SET status = 'withdrawn' WHERE id = p_request_id;
    UPDATE personal_loan_offers SET status = 'declined'
     WHERE request_id = p_request_id AND status = 'pending';
    RETURN jsonb_build_object('success', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.personal_withdraw_loan_request(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.personal_withdraw_loan_request(uuid, uuid) TO authenticated;

-- ── 4. OFFER — the bank's executive action ────────────────────────────
CREATE OR REPLACE FUNCTION public.bank_offer_personal_loan(
    p_request_id   uuid,
    p_bank_corp_id uuid,
    p_term_ticks   int,
    p_comments     text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_bank entrepreneur_corps%ROWTYPE;
    v_fac  factions%ROWTYPE;
    v_req  personal_loan_requests%ROWTYPE;
    v_tick int;
    v_id   uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_bank_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_term_ticks IS NULL OR p_term_ticks NOT IN (12, 24, 36) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_term');
    END IF;
    IF p_comments IS NOT NULL AND length(p_comments) > 300 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'comments_too_long');
    END IF;

    -- Lock the request first (accept takes it first too → no deadlock).
    SELECT * INTO v_req FROM personal_loan_requests WHERE id = p_request_id FOR UPDATE;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_closed');
    END IF;

    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id FOR UPDATE;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_bank.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
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

    -- No lending to yourself: a bank can't fund a borrower controlled by
    -- the same account.
    IF EXISTS (SELECT 1 FROM factions
                WHERE id = v_req.borrower_faction_id
                  AND (id = v_uid OR linked_user_id = v_uid)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'self_dealing');
    END IF;

    -- Settle deposits, then the treasury must be able to fund the ticket
    -- (re-checked at issue — this keeps fantasy offers off the board).
    PERFORM _bank_settle_deposits(p_bank_corp_id);
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id;
    IF FLOOR(COALESCE(v_bank.treasury_cash, 0))::bigint < v_req.amount THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_req.amount, 'have', FLOOR(COALESCE(v_bank.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_bank.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    BEGIN
        INSERT INTO personal_loan_offers (
            request_id, bank_corp_id, amount, rate_bps, term_ticks, comments, created_at_tick
        ) VALUES (
            p_request_id, p_bank_corp_id, v_req.amount, v_bank.bank_prime_rate_bps,
            p_term_ticks, NULLIF(btrim(COALESCE(p_comments, '')), ''), v_tick
        ) RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_already_pending');
    END;

    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_bank_corp_id;

    PERFORM _log_corp_history(p_bank_corp_id, v_tick,
        format('Offered a personal loan of $%s — %s%% prime, %s ticks.',
               v_req.amount, v_bank.bank_prime_rate_bps / 100, p_term_ticks));

    RETURN jsonb_build_object('success', true, 'offer_id', v_id,
        'amount', v_req.amount, 'rate_bps', v_bank.bank_prime_rate_bps, 'term_ticks', p_term_ticks);
END $$;

REVOKE EXECUTE ON FUNCTION public.bank_offer_personal_loan(uuid, uuid, int, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bank_offer_personal_loan(uuid, uuid, int, text) TO authenticated;

-- ── 5. The borrower accepts — a commitment, not a payment ─────────────
CREATE OR REPLACE FUNCTION public.personal_accept_loan_offer(
    p_offer_id   uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_offer personal_loan_offers%ROWTYPE;
    v_req   personal_loan_requests%ROWTYPE;
    v_tick  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_offer FROM personal_loan_offers WHERE id = p_offer_id;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    SELECT * INTO v_req FROM personal_loan_requests WHERE id = v_offer.request_id FOR UPDATE;
    IF v_req.borrower_faction_id IS DISTINCT FROM p_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_request');
    END IF;
    IF (_personal_borrower(p_faction_id, v_uid)).id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_req.status <> 'open' OR v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_closed');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- No money moves here — the bank disburses with ISSUE.
    UPDATE personal_loan_offers SET status = 'accepted' WHERE id = p_offer_id;
    UPDATE personal_loan_offers SET status = 'declined'
     WHERE request_id = v_req.id AND status = 'pending';
    UPDATE personal_loan_requests SET status = 'funded' WHERE id = v_req.id;

    PERFORM _log_corp_history(v_offer.bank_corp_id, v_tick,
        format('A borrower accepted the $%s personal offer — issue to disburse.', v_offer.amount));

    RETURN jsonb_build_object('success', true, 'offer_id', p_offer_id,
        'amount', v_offer.amount, 'status', 'awaiting_issuance');
END $$;

REVOKE EXECUTE ON FUNCTION public.personal_accept_loan_offer(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.personal_accept_loan_offer(uuid, uuid) TO authenticated;

-- ── 6. ISSUE — the bank disburses (executive action) ──────────────────
CREATE OR REPLACE FUNCTION public.bank_issue_personal_loan(
    p_offer_id     uuid,
    p_bank_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_bank     entrepreneur_corps%ROWTYPE;
    v_borrower factions%ROWTYPE;
    v_offer    personal_loan_offers%ROWTYPE;
    v_req      personal_loan_requests%ROWTYPE;
    v_fac      factions%ROWTYPE;
    v_tick     int;
    v_worth    bigint;
    v_loan_id  uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_offer_id IS NULL OR p_bank_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id FOR UPDATE;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_bank.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;
    v_fac := _corp_owner_faction(v_bank.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    PERFORM _bank_settle_deposits(p_bank_corp_id);
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id;

    SELECT * INTO v_offer FROM personal_loan_offers WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL OR v_offer.bank_corp_id <> p_bank_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.status <> 'accepted' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_accepted');
    END IF;
    IF FLOOR(COALESCE(v_bank.treasury_cash, 0))::bigint < v_offer.amount THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_offer.amount, 'have', FLOOR(COALESCE(v_bank.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_bank.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    SELECT * INTO v_req FROM personal_loan_requests WHERE id = v_offer.request_id;
    SELECT * INTO v_borrower FROM factions WHERE id = v_req.borrower_faction_id FOR UPDATE;
    IF v_borrower.id IS NULL OR v_borrower.abandoned_at IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_gone');
    END IF;
    -- One active personal loan per borrower (the home is pledged once).
    IF EXISTS (SELECT 1 FROM personal_loans
                WHERE borrower_faction_id = v_borrower.id AND status = 'active') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_already_borrowing');
    END IF;
    -- Re-check the collateral still covers the ticket at disbursement.
    v_worth := FLOOR(GREATEST(0, COALESCE(v_borrower.biz_residence_worth, 0)))::bigint;
    IF v_offer.amount > v_worth THEN
        RETURN jsonb_build_object('success', false, 'reason', 'under_collateralized',
            'cap', v_worth, 'ask', v_offer.amount);
    END IF;

    -- Principal is not income/expense — straight cash moves, no events.
    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) - v_offer.amount,
           exec_action_tick = v_tick
     WHERE id = p_bank_corp_id;
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) + v_offer.amount
     WHERE id = v_borrower.id;

    INSERT INTO personal_loans (
        bank_corp_id, borrower_faction_id, request_id, offer_id,
        principal, rate_bps, term_ticks, originated_tick, due_tick,
        balance, last_accrual_tick, collateral_name, collateral_value
    ) VALUES (
        p_bank_corp_id, v_borrower.id, v_offer.request_id, v_offer.id,
        v_offer.amount, v_offer.rate_bps, v_offer.term_ticks, v_tick, v_tick + v_offer.term_ticks,
        v_offer.amount, v_tick, v_borrower.biz_residence_name, v_worth
    ) RETURNING id INTO v_loan_id;

    UPDATE personal_loan_offers SET status = 'issued' WHERE id = p_offer_id;

    PERFORM _log_corp_history(p_bank_corp_id, v_tick,
        format('Issued a $%s personal loan — %s%% prime, due tick %s.',
               v_offer.amount, v_offer.rate_bps / 100, v_tick + v_offer.term_ticks));

    RETURN jsonb_build_object('success', true, 'loan_id', v_loan_id,
        'amount', v_offer.amount, 'due_tick', v_tick + v_offer.term_ticks);
END $$;

REVOKE EXECUTE ON FUNCTION public.bank_issue_personal_loan(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bank_issue_personal_loan(uuid, uuid) TO authenticated;

-- ── 7. Manual repayment (from Cash on Hand) ───────────────────────────
-- Interest accrues lazily: balance × rate/12 per elapsed tick. Payments
-- clear interest first, then principal, clamped to what's owed. The
-- interest slice is the bank's income; principal stays off the books.
CREATE OR REPLACE FUNCTION public.personal_pay_loan(
    p_loan_id    uuid,
    p_faction_id uuid,
    p_amount     bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_loan      personal_loans%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_bank      entrepreneur_corps%ROWTYPE;
    v_tick      int;
    v_accrued   numeric;
    v_interest  numeric;
    v_principal numeric;
    v_charge    numeric;
    v_repaid    boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_loan_id IS NULL OR p_amount IS NULL OR p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_loan FROM personal_loans
     WHERE id = p_loan_id AND borrower_faction_id = p_faction_id FOR UPDATE;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_not_found');
    END IF;
    IF v_loan.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_settled');
    END IF;

    SELECT * INTO v_fac FROM factions WHERE id = p_faction_id FOR UPDATE;
    IF (_personal_borrower(p_faction_id, v_uid)).id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_accrued := v_loan.accrued_interest
        + v_loan.balance * v_loan.rate_bps / 10000.0 / 12.0
          * GREATEST(0, v_tick - v_loan.last_accrual_tick);

    v_interest  := LEAST(p_amount, v_accrued);
    v_principal := LEAST(p_amount - v_interest, v_loan.balance);
    v_charge    := ROUND(v_interest + v_principal);
    IF v_charge <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nothing_owed');
    END IF;
    IF FLOOR(COALESCE(v_fac.party_funds, 0))::bigint < v_charge THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'need', v_charge, 'have', FLOOR(COALESCE(v_fac.party_funds, 0))::bigint);
    END IF;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_charge
     WHERE id = p_faction_id;

    -- Credit the lender; the interest slice is taxable bank income.
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = v_loan.bank_corp_id FOR UPDATE;
    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + v_charge
     WHERE id = v_loan.bank_corp_id;
    IF ROUND(v_interest) > 0 AND v_bank.id IS NOT NULL THEN
        INSERT INTO corp_cash_events (corp_id, tick, category, label, delta, nation_id)
        VALUES (v_loan.bank_corp_id, v_tick, 'revenue_finance',
                'Personal loan interest', ROUND(v_interest), v_bank.hq_nation_id);
    END IF;

    v_repaid := (v_loan.balance - v_principal <= 0) AND (v_accrued - v_interest <= 0);
    UPDATE personal_loans
       SET accrued_interest  = v_accrued - v_interest,
           balance           = balance - v_principal,
           last_accrual_tick = v_tick,
           status            = CASE WHEN v_repaid THEN 'repaid' ELSE 'active' END
     WHERE id = p_loan_id;

    RETURN jsonb_build_object('success', true,
        'paid',           v_charge,
        'interest_paid',  ROUND(v_interest),
        'principal_paid', ROUND(v_principal),
        'balance',        ROUND(v_loan.balance - v_principal),
        'accrued',        ROUND(v_accrued - v_interest),
        'status',         CASE WHEN v_repaid THEN 'repaid' ELSE 'active' END);
END $$;

REVOKE EXECUTE ON FUNCTION public.personal_pay_loan(uuid, uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.personal_pay_loan(uuid, uuid, bigint) TO authenticated;

-- ── 8. Foreclosure — the lender seizes an OVERDUE loan ────────────────
-- Lazy and lender-initiated (no tick sweep). Only past the due tick with
-- a balance still owed. Liquidates the residence: the bank recovers the
-- outstanding (capped at the home's worth), any surplus returns to the
-- borrower, the borrower loses the home, the loan closes 'seized'.
CREATE OR REPLACE FUNCTION public.bank_seize_personal_loan(
    p_loan_id      uuid,
    p_bank_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_loan      personal_loans%ROWTYPE;
    v_bank      entrepreneur_corps%ROWTYPE;
    v_borrower  factions%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_tick      int;
    v_outstanding numeric;
    v_worth     bigint;
    v_recovered bigint;
    v_surplus   bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_loan_id IS NULL OR p_bank_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock order loan → borrower faction → bank, matching personal_pay_loan
    -- so a concurrent repay and foreclosure on the same loan can't deadlock.
    SELECT * INTO v_loan FROM personal_loans
     WHERE id = p_loan_id AND bank_corp_id = p_bank_corp_id FOR UPDATE;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_not_found');
    END IF;
    IF v_loan.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_settled');
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
    IF v_tick <= v_loan.due_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_overdue',
            'due_tick', v_loan.due_tick, 'tick', v_tick);
    END IF;

    -- Bring interest current to size the claim.
    v_outstanding := v_loan.balance + v_loan.accrued_interest
        + v_loan.balance * v_loan.rate_bps / 10000.0 / 12.0
          * GREATEST(0, v_tick - v_loan.last_accrual_tick);
    v_outstanding := GREATEST(0, ROUND(v_outstanding));

    v_worth := FLOOR(GREATEST(0, COALESCE(v_borrower.biz_residence_worth, 0)))::bigint;

    v_recovered := LEAST(v_worth, v_outstanding::bigint);
    v_surplus   := GREATEST(0, v_worth - v_outstanding::bigint);

    -- Bank recovers from the liquidation (principal recovery, not income).
    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) + v_recovered
     WHERE id = p_bank_corp_id;
    -- Borrower loses the home; any surplus over the debt comes back to them.
    UPDATE factions
       SET biz_residence_worth = 0,
           biz_residence_name  = NULL,
           party_funds         = COALESCE(party_funds, 0) + v_surplus
     WHERE id = v_borrower.id;

    UPDATE personal_loans
       SET status = 'seized', balance = 0, accrued_interest = 0, last_accrual_tick = v_tick
     WHERE id = p_loan_id;

    PERFORM _log_corp_history(p_bank_corp_id, v_tick,
        format('Foreclosed an overdue personal loan — seized %s, recovered $%s of $%s owed.',
               COALESCE(v_loan.collateral_name, 'the residence'), v_recovered, v_outstanding));

    RETURN jsonb_build_object('success', true,
        'recovered', v_recovered, 'surplus', v_surplus,
        'outstanding', v_outstanding::bigint, 'collateral_value', v_worth);
END $$;

REVOKE EXECUTE ON FUNCTION public.bank_seize_personal_loan(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bank_seize_personal_loan(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
