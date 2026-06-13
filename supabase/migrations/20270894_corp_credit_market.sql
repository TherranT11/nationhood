-- ════════════════════════════════════════════════════════════════════
-- 20270894 — The credit market: loan requests, bank offers, manual
--            repayment (banking executive action #2)
--
-- User spec + AskUserQuestion rulings:
--   • Any non-bank corp files a loan request (free — asking for
--     money isn't running the company). One open ask per corp.
--   • OFFER LOAN (the bank's day action): browse the open board,
--     pick a request, offer at YOUR POSTED PRIME (locked — the rate
--     sheet is the one source; repricing means re-posting it), set
--     the term (12/24/36 ticks), demand one of the borrower's five
--     assets as collateral, add comments.
--   • The borrower accepts an offer — a COMMITMENT, not a payment.
--   • ISSUE LOAN (the bank's day action #3): the bank picks one of
--     its accepted offers and disburses — only then do funds move
--     bank → borrower and the loan originates, rate LOCKED at the
--     offered prime, the clock starting at issuance.
--   • Repayment is MANUAL (user ruling): the borrower pays when
--     they choose. Interest accrues lazily — simple interest on the
--     outstanding balance, rate/12 per tick (a tick is a month) —
--     computed at payment time. No timers, no sweeps.
--
-- Accounting (one-source seams):
--   • Principal moving in either direction is NEVER income — it
--     bypasses corp_cash_events so the tax base stays honest.
--   • Interest paid IS income for the bank (corp_cash_events,
--     category revenue_finance) and a deductible expense for the
--     borrower (_corp_log_expense).
--
-- Out of scope (future actions): collateral seizure on overdue
-- loans — past due_tick the loan just reads OVERDUE; the collateral
-- field records what the bank may one day collect.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. The open board ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.corp_loan_requests (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id         uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    nation_id       uuid REFERENCES public.nations(id) ON DELETE SET NULL,
    amount          bigint NOT NULL CHECK (amount >= 100000 AND amount <= 50000000),
    status          text NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'funded', 'withdrawn')),
    created_at_tick int NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS corp_loan_requests_one_open_per_corp
    ON public.corp_loan_requests (corp_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS corp_loan_requests_open_idx
    ON public.corp_loan_requests (status, created_at_tick DESC);

CREATE TABLE IF NOT EXISTS public.corp_loan_offers (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id       uuid NOT NULL REFERENCES public.corp_loan_requests(id) ON DELETE CASCADE,
    bank_corp_id     uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    amount           bigint NOT NULL,
    rate_bps         int NOT NULL,
    term_ticks       int NOT NULL CHECK (term_ticks IN (12, 24, 36)),
    collateral_asset text NOT NULL,
    comments         text CHECK (comments IS NULL OR length(comments) <= 300),
    -- accepted = the borrower committed; issued = the bank disbursed
    -- and the corp_bank_loans row exists.
    status           text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'accepted', 'declined', 'issued')),
    created_at_tick  int NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS corp_loan_offers_one_pending_per_bank
    ON public.corp_loan_offers (request_id, bank_corp_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS corp_loan_offers_request_idx
    ON public.corp_loan_offers (request_id, status);

CREATE TABLE IF NOT EXISTS public.corp_bank_loans (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_corp_id     uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    borrower_corp_id uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    request_id       uuid REFERENCES public.corp_loan_requests(id) ON DELETE SET NULL,
    offer_id         uuid REFERENCES public.corp_loan_offers(id)   ON DELETE SET NULL,
    principal        bigint NOT NULL,
    rate_bps         int NOT NULL,
    term_ticks       int NOT NULL,
    originated_tick  int NOT NULL,
    due_tick         int NOT NULL,
    -- Outstanding principal + interest accrued-but-unpaid. Accrual
    -- is lazy: brought current inside corp_pay_loan, stamped by
    -- last_accrual_tick. balance×rate/12 per elapsed tick.
    balance          numeric NOT NULL,
    accrued_interest numeric NOT NULL DEFAULT 0,
    last_accrual_tick int NOT NULL,
    collateral_asset text,
    status           text NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'repaid')),
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS corp_bank_loans_borrower_idx
    ON public.corp_bank_loans (borrower_corp_id, status);
CREATE INDEX IF NOT EXISTS corp_bank_loans_bank_idx
    ON public.corp_bank_loans (bank_corp_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS corp_bank_loans_one_per_offer
    ON public.corp_bank_loans (offer_id) WHERE offer_id IS NOT NULL;

-- The credit market is public record — every row readable, every
-- write through the definer functions below.
ALTER TABLE public.corp_loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corp_loan_offers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corp_bank_loans         ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS corp_loan_requests_select ON public.corp_loan_requests;
CREATE POLICY corp_loan_requests_select ON public.corp_loan_requests
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS corp_loan_offers_select ON public.corp_loan_offers;
CREATE POLICY corp_loan_offers_select ON public.corp_loan_offers
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS corp_bank_loans_select ON public.corp_bank_loans;
CREATE POLICY corp_bank_loans_select ON public.corp_bank_loans
    FOR SELECT TO authenticated USING (true);

-- ── 2. Shared internals ───────────────────────────────────────────
-- Owner resolution for a corp's controlling faction — businessman
-- and legacy entrepreneur owners both qualify (construction corps
-- from the entrepreneur era are still player-run).
CREATE OR REPLACE FUNCTION public._corp_owner_faction(p_corp_owner uuid, p_uid uuid)
RETURNS public.factions
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT f.* FROM factions f
     WHERE f.id = p_corp_owner
       AND (f.id = p_uid OR f.linked_user_id = p_uid)
       AND f.faction_type IN ('businessman', 'entrepreneur')
       AND f.abandoned_at IS NULL
     LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public._corp_owner_faction(uuid, uuid) FROM PUBLIC;

-- The collateral menu per borrower industry — one source for what a
-- bank may demand (mirrors the five asset ladders).
CREATE OR REPLACE FUNCTION public._loan_collateral_menu(p_industry text)
RETURNS text[]
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_industry
        WHEN 'construction' THEN ARRAY['project_management', 'heavy_equipment',
                                       'supply_material', 'system_design',
                                       'regulatory_compliance']
        WHEN 'automotive'   THEN ARRAY['design_studio', 'assembly', 'data_center',
                                       'parts_depot', 'franchise']
        ELSE ARRAY[]::text[]
    END
$$;
REVOKE EXECUTE ON FUNCTION public._loan_collateral_menu(text) FROM PUBLIC;

-- ── 3. The borrower files an ask ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.corp_request_loan(
    p_corp_id uuid,
    p_amount  bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_corp entrepreneur_corps%ROWTYPE;
    v_fac  factions%ROWTYPE;
    v_tick int;
    v_id   uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_amount IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_amount < 100000 OR p_amount > 50000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount',
            'min', 100000, 'max', 50000000);
    END IF;

    -- Corp lock serializes the one-open-request check.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry = 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'banks_dont_borrow');
    END IF;

    v_fac := _corp_owner_faction(v_corp.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    IF EXISTS (SELECT 1 FROM corp_loan_requests
                WHERE corp_id = p_corp_id AND status = 'open') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_already_open');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO corp_loan_requests (corp_id, nation_id, amount, created_at_tick)
    VALUES (p_corp_id, v_corp.hq_nation_id, p_amount, v_tick)
    RETURNING id INTO v_id;

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Filed a loan request for $%s on the credit market.', p_amount));

    RETURN jsonb_build_object('success', true, 'request_id', v_id, 'amount', p_amount);
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_request_loan(uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_request_loan(uuid, bigint) TO authenticated;

-- ── 4. ... or pulls it ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.corp_withdraw_loan_request(
    p_request_id uuid,
    p_corp_id    uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_req  corp_loan_requests%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_fac  factions%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_req FROM corp_loan_requests
     WHERE id = p_request_id AND corp_id = p_corp_id FOR UPDATE;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_closed');
    END IF;
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    v_fac := _corp_owner_faction(v_corp.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    UPDATE corp_loan_requests SET status = 'withdrawn' WHERE id = p_request_id;
    UPDATE corp_loan_offers SET status = 'declined'
     WHERE request_id = p_request_id AND status = 'pending';
    RETURN jsonb_build_object('success', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_withdraw_loan_request(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_withdraw_loan_request(uuid, uuid) TO authenticated;

-- ── 5. OFFER LOAN — the bank's executive action ───────────────────
CREATE OR REPLACE FUNCTION public.bank_offer_loan(
    p_request_id       uuid,
    p_bank_corp_id     uuid,
    p_term_ticks       int,
    p_collateral_asset text,
    p_comments         text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_bank     entrepreneur_corps%ROWTYPE;
    v_borrower entrepreneur_corps%ROWTYPE;
    v_fac      factions%ROWTYPE;
    v_req      corp_loan_requests%ROWTYPE;
    v_tick     int;
    v_id       uuid;
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

    -- Lock the request FIRST — the accept path takes the same lock
    -- first, so a simultaneous accept and offer serialize instead of
    -- deadlocking, and no offer can land on a just-funded request.
    SELECT * INTO v_req FROM corp_loan_requests WHERE id = p_request_id FOR UPDATE;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_closed');
    END IF;

    -- Then the bank: allowance + treasury checks serialize.
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
    -- No sheet, no lending — the offer's rate IS the posted prime.
    IF v_bank.bank_prime_rate_bps IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_rate_sheet');
    END IF;
    -- Bring the deposit ledger current (20270897) — the treasury
    -- gate below must see interest paid and flows landed.
    PERFORM _bank_settle_deposits(p_bank_corp_id);
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id;

    SELECT * INTO v_borrower FROM entrepreneur_corps WHERE id = v_req.corp_id;
    -- Lending to your own corp at your own prime is money laundering
    -- with extra steps.
    IF v_borrower.owner_faction_id = v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'self_dealing');
    END IF;
    IF p_collateral_asset IS NULL
       OR NOT (p_collateral_asset = ANY (_loan_collateral_menu(v_borrower.industry))) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_collateral');
    END IF;

    -- The vault must be able to fund what it dangles. Re-checked at
    -- acceptance — this gate just keeps fantasy offers off the board.
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
        INSERT INTO corp_loan_offers (
            request_id, bank_corp_id, amount, rate_bps, term_ticks,
            collateral_asset, comments, created_at_tick
        ) VALUES (
            p_request_id, p_bank_corp_id, v_req.amount, v_bank.bank_prime_rate_bps,
            p_term_ticks, p_collateral_asset, NULLIF(btrim(COALESCE(p_comments, '')), ''), v_tick
        ) RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_already_pending');
    END;

    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_bank_corp_id;

    PERFORM _log_corp_history(p_bank_corp_id, v_tick,
        format('Offered %s a $%s loan — %s%% prime, %s ticks.',
               v_borrower.name, v_req.amount, v_bank.bank_prime_rate_bps / 100, p_term_ticks));

    RETURN jsonb_build_object('success', true, 'offer_id', v_id,
        'amount', v_req.amount, 'rate_bps', v_bank.bank_prime_rate_bps,
        'term_ticks', p_term_ticks);
END $$;

REVOKE EXECUTE ON FUNCTION public.bank_offer_loan(uuid, uuid, int, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bank_offer_loan(uuid, uuid, int, text, text) TO authenticated;

-- ── 6. The borrower accepts — a commitment, not a payment ─────────
CREATE OR REPLACE FUNCTION public.corp_accept_loan_offer(
    p_offer_id uuid,
    p_corp_id  uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_offer    corp_loan_offers%ROWTYPE;
    v_req      corp_loan_requests%ROWTYPE;
    v_borrower entrepreneur_corps%ROWTYPE;
    v_fac      factions%ROWTYPE;
    v_tick     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_offer FROM corp_loan_offers WHERE id = p_offer_id;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    -- Lock the request: two simultaneous accepts serialize here.
    SELECT * INTO v_req FROM corp_loan_requests
     WHERE id = v_offer.request_id FOR UPDATE;
    IF v_req.corp_id IS DISTINCT FROM p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_your_request');
    END IF;
    IF v_req.status <> 'open' OR v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_closed');
    END IF;

    SELECT * INTO v_borrower FROM entrepreneur_corps WHERE id = p_corp_id;
    v_fac := _corp_owner_faction(v_borrower.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- No money moves here. The bank disburses with ISSUE LOAN; the
    -- loan's clock starts at issuance, not acceptance.
    UPDATE corp_loan_offers SET status = 'accepted' WHERE id = p_offer_id;
    UPDATE corp_loan_offers SET status = 'declined'
     WHERE request_id = v_req.id AND status = 'pending';
    UPDATE corp_loan_requests SET status = 'funded' WHERE id = v_req.id;

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Accepted a $%s loan offer — awaiting disbursement.', v_offer.amount));
    PERFORM _log_corp_history(v_offer.bank_corp_id, v_tick,
        format('%s accepted the $%s offer — issue the loan to disburse.',
               v_borrower.name, v_offer.amount));

    RETURN jsonb_build_object('success', true, 'offer_id', p_offer_id,
        'amount', v_offer.amount, 'status', 'awaiting_issuance');
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_accept_loan_offer(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_accept_loan_offer(uuid, uuid) TO authenticated;

-- ── 6b. ISSUE LOAN — the bank disburses (executive action #3) ─────
CREATE OR REPLACE FUNCTION public.bank_issue_loan(
    p_offer_id     uuid,
    p_bank_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_bank     entrepreneur_corps%ROWTYPE;
    v_borrower entrepreneur_corps%ROWTYPE;
    v_offer    corp_loan_offers%ROWTYPE;
    v_fac      factions%ROWTYPE;
    v_tick     int;
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

    -- Bring the deposit ledger current (20270897) before the
    -- funding check — issuing lends real, settled cash.
    PERFORM _bank_settle_deposits(p_bank_corp_id);
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id;

    -- Lock the offer: a double-issue serializes here and the loser
    -- sees status=issued.
    SELECT * INTO v_offer FROM corp_loan_offers WHERE id = p_offer_id FOR UPDATE;
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

    SELECT * INTO v_borrower FROM entrepreneur_corps
     WHERE id = (SELECT corp_id FROM corp_loan_requests WHERE id = v_offer.request_id)
     FOR UPDATE;
    IF v_borrower.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_gone');
    END IF;

    -- Principal is not income for the borrower and not an expense
    -- for the bank — straight treasury moves, no cash events, so the
    -- corporate tax base stays honest.
    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) - v_offer.amount,
           exec_action_tick = v_tick
     WHERE id = p_bank_corp_id;
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + v_offer.amount
     WHERE id = v_borrower.id;

    INSERT INTO corp_bank_loans (
        bank_corp_id, borrower_corp_id, request_id, offer_id,
        principal, rate_bps, term_ticks,
        originated_tick, due_tick,
        balance, last_accrual_tick, collateral_asset
    ) VALUES (
        p_bank_corp_id, v_borrower.id, v_offer.request_id, v_offer.id,
        v_offer.amount, v_offer.rate_bps, v_offer.term_ticks,
        v_tick, v_tick + v_offer.term_ticks,
        v_offer.amount, v_tick, v_offer.collateral_asset
    ) RETURNING id INTO v_loan_id;

    UPDATE corp_loan_offers SET status = 'issued' WHERE id = p_offer_id;

    PERFORM _log_corp_history(p_bank_corp_id, v_tick,
        format('Issued the $%s loan to %s — %s%% prime, due tick %s.',
               v_offer.amount, v_borrower.name, v_offer.rate_bps / 100, v_tick + v_offer.term_ticks));
    PERFORM _log_corp_history(v_borrower.id, v_tick,
        format('Received $%s from %s — %s%% prime, due tick %s.',
               v_offer.amount, v_bank.name, v_offer.rate_bps / 100, v_tick + v_offer.term_ticks));

    RETURN jsonb_build_object('success', true, 'loan_id', v_loan_id,
        'amount', v_offer.amount, 'due_tick', v_tick + v_offer.term_ticks);
END $$;

REVOKE EXECUTE ON FUNCTION public.bank_issue_loan(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bank_issue_loan(uuid, uuid) TO authenticated;

-- ── 7. Manual repayment ───────────────────────────────────────────
-- Interest accrues lazily at payment time: balance × rate/12 per
-- elapsed tick since last accrual. Payments clear accrued interest
-- first, then principal; overpayment clamps to what is owed. The
-- interest slice is the only money that touches the books.
CREATE OR REPLACE FUNCTION public.corp_pay_loan(
    p_loan_id uuid,
    p_corp_id uuid,
    p_amount  bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_loan      corp_bank_loans%ROWTYPE;
    v_borrower  entrepreneur_corps%ROWTYPE;
    v_bank      entrepreneur_corps%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_tick      int;
    v_accrued   numeric;
    v_interest  numeric;
    v_principal numeric;
    v_charge    numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_loan_id IS NULL OR p_amount IS NULL OR p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_loan FROM corp_bank_loans
     WHERE id = p_loan_id AND borrower_corp_id = p_corp_id FOR UPDATE;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_not_found');
    END IF;
    IF v_loan.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_settled');
    END IF;

    SELECT * INTO v_borrower FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    v_fac := _corp_owner_faction(v_borrower.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Bring interest current.
    v_accrued := v_loan.accrued_interest
        + v_loan.balance * v_loan.rate_bps / 10000.0 / 12.0
          * GREATEST(0, v_tick - v_loan.last_accrual_tick);

    -- Split the payment: interest first, then principal, clamped to
    -- what's actually owed.
    v_interest  := LEAST(p_amount, v_accrued);
    v_principal := LEAST(p_amount - v_interest, v_loan.balance);
    v_charge    := ROUND(v_interest + v_principal);
    IF v_charge <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nothing_owed');
    END IF;
    IF FLOOR(COALESCE(v_borrower.treasury_cash, 0))::bigint < v_charge THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_charge, 'have', FLOOR(COALESCE(v_borrower.treasury_cash, 0))::bigint);
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_charge
     WHERE id = p_corp_id;
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = v_loan.bank_corp_id FOR UPDATE;
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + v_charge
     WHERE id = v_loan.bank_corp_id;

    -- The interest slice: bank income (taxable), borrower expense
    -- (deductible). Principal stays off both books.
    IF ROUND(v_interest) > 0 THEN
        INSERT INTO corp_cash_events (corp_id, tick, category, label, delta, nation_id)
        VALUES (v_loan.bank_corp_id, v_tick, 'revenue_finance',
                format('Loan interest — %s', v_borrower.name),
                ROUND(v_interest), v_bank.hq_nation_id);
        PERFORM _corp_log_expense(p_corp_id, ROUND(v_interest)::bigint);
    END IF;

    UPDATE corp_bank_loans
       SET accrued_interest  = v_accrued - v_interest,
           balance           = balance - v_principal,
           last_accrual_tick = v_tick,
           status            = CASE WHEN balance - v_principal <= 0
                                     AND v_accrued - v_interest <= 0
                                    THEN 'repaid' ELSE 'active' END
     WHERE id = p_loan_id;

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Paid $%s on the %s loan ($%s interest, $%s principal).',
               v_charge, v_bank.name, ROUND(v_interest), ROUND(v_principal)));

    RETURN jsonb_build_object('success', true,
        'paid',           v_charge,
        'interest_paid',  ROUND(v_interest),
        'principal_paid', ROUND(v_principal),
        'balance',        ROUND(v_loan.balance - v_principal),
        'accrued',        ROUND(v_accrued - v_interest),
        'status',         CASE WHEN v_loan.balance - v_principal <= 0
                                AND v_accrued - v_interest <= 0
                               THEN 'repaid' ELSE 'active' END);
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_pay_loan(uuid, uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_pay_loan(uuid, uuid, bigint) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
