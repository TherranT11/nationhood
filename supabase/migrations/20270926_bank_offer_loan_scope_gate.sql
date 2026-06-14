-- ════════════════════════════════════════════════════════════════════
-- 20270926 — Enforce loan-request lender scope at offer time
--
-- 20270925 added corp_bank_loan_requests.lender_scope (local | national)
-- and the Offer Loan board filters Local requests to same-nation banks —
-- but that's client-side only. Make the server the authority: a bank may
-- only offer on a Local request if it's headquartered in the borrower's
-- nation. bank_offer_loan re-emitted from 20270894, the only change being
-- the scope gate after the ownership check.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    v_req      corp_bank_loan_requests%ROWTYPE;
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
    SELECT * INTO v_req FROM corp_bank_loan_requests WHERE id = p_request_id FOR UPDATE;
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
    -- Lender scope (20270926): a Local request only takes offers from
    -- banks in the borrower's nation. The board client-filters too; this
    -- is the authority.
    IF v_req.lender_scope = 'local' AND v_bank.hq_nation_id IS DISTINCT FROM v_req.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'out_of_scope');
    END IF;
    -- No sheet, no lending — the offer's rate IS the posted prime.
    IF v_bank.bank_prime_rate_bps IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_rate_sheet');
    END IF;
    -- The Underwriting Desk caps the ticket (20270896 wiring):
    -- $20M per level. The Sovereign Desk (V) reaches the board's
    -- $100M ceiling — nothing is out of reach.
    IF v_req.amount > COALESCE(v_bank.bank_underwriting_tier, 1)::bigint * 20000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'underwriting_too_small',
            'cap', COALESCE(v_bank.bank_underwriting_tier, 1)::bigint * 20000000,
            'ask', v_req.amount);
    END IF;
    -- The Clearing House gates the longer paper (20270896 wiring):
    -- 12-tick terms always; Level I services 24, Level II services 36.
    IF (p_term_ticks = 24 AND COALESCE(v_bank.bank_clearing_tier, 0) < 1)
       OR (p_term_ticks = 36 AND COALESCE(v_bank.bank_clearing_tier, 0) < 2) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'clearing_too_small',
            'clearing_tier', COALESCE(v_bank.bank_clearing_tier, 0), 'term', p_term_ticks);
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
        INSERT INTO corp_bank_loan_offers (
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

NOTIFY pgrst, 'reload schema';

COMMIT;
