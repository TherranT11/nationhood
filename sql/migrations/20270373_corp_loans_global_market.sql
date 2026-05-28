-- ════════════════════════════════════════════════════════════════════
-- Remove the "Banking Office in borrower HQ nation" gate from loans.
--
-- Policy change: a loan request is broadcast to every banking corp,
-- and any banking corp can offer back, regardless of whether they own
-- a completed Banking Office in the borrower's HQ nation. Banking
-- becomes a global market — geography no longer constrains who can
-- lend to whom.
--
-- Two functions carry the v_has_bo guard today and both lose it here:
--
--   • offer_loan (20270177:286) — bank submits an APR offer on a
--     pending request. This is the live v1 path used by the
--     entrepreneur-corp.html "Make Offer" button.
--
--   • accept_corp_loan_request (20270175:122) — the legacy direct-
--     fund path (bank funds the request in one shot, no negotiation).
--     The current UI uses the offer/accept lifecycle instead, but the
--     RPC remains callable, so it loses the same gate to keep the
--     policy consistent across every loan path.
--
-- accept_loan_offer (20270177:356) never had a BO gate — the v1
-- design relied on offer_loan to enforce eligibility. With offer_loan
-- relaxed, no other gate needs touching.
--
-- Bodies otherwise byte-identical to their source migrations. Same
-- signature → CREATE OR REPLACE, idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── offer_loan (v1 path, body of 20270177:214-347 minus the BO block) ─
CREATE OR REPLACE FUNCTION public.offer_loan(
    p_request_id   uuid,
    p_bank_corp_id uuid,
    p_apr          numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_fac              factions%ROWTYPE;
    v_request          corp_loan_requests%ROWTYPE;
    v_borrower_corp    entrepreneur_corps%ROWTYPE;
    v_bank_corp        entrepreneur_corps%ROWTYPE;
    v_offer_id         uuid;
    v_tick             int;
    v_nation_name      text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_bank_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_apr IS NULL OR p_apr < 0 OR p_apr > 0.5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_apr');
    END IF;

    SELECT * INTO v_request FROM corp_loan_requests
     WHERE id = p_request_id FOR UPDATE;
    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_request.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_request.expires_at_tick <= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_expired');
    END IF;

    -- No self-offers — same intent as the v0 cannot_self_loan guard.
    IF p_bank_corp_id = v_request.borrower_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_self_loan');
    END IF;

    SELECT * INTO v_borrower_corp FROM entrepreneur_corps WHERE id = v_request.borrower_corp_id;
    IF v_borrower_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_corp_not_found');
    END IF;

    SELECT * INTO v_bank_corp FROM entrepreneur_corps WHERE id = p_bank_corp_id FOR UPDATE;
    IF v_bank_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;
    IF v_bank_corp.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_banking_corp');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_bank_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_bank_corp_owner');
    END IF;

    -- Upsert via the partial UNIQUE index. A bank's second offer on
    -- the same request just updates their pending row (revising
    -- APR) without a separate withdraw step.
    INSERT INTO corp_loan_offers
        (request_id, bank_corp_id, apr, status, placed_at_tick)
    VALUES
        (p_request_id, p_bank_corp_id, p_apr, 'pending', v_tick)
    ON CONFLICT (request_id, bank_corp_id) WHERE status = 'pending'
    DO UPDATE SET apr = EXCLUDED.apr, placed_at_tick = EXCLUDED.placed_at_tick
    RETURNING id INTO v_offer_id;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_borrower_corp.hq_nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_borrower_corp.hq_nation_id, v_fac.id,
        'Loan Offer Submitted',
        format('%s offers %s%% APR on %s''s $%s loan request.',
               v_bank_corp.name,
               to_char(p_apr * 100, 'FM99.99'),
               v_borrower_corp.name,
               to_char(v_request.principal, 'FM999,999,999,999')),
        'corporate', 'corp_loan_offer_submitted',
        jsonb_build_object(
            'offer_id',           v_offer_id,
            'request_id',         p_request_id,
            'bank_corp_id',       p_bank_corp_id,
            'bank_corp_name',     v_bank_corp.name,
            'borrower_corp_id',   v_request.borrower_corp_id,
            'borrower_corp_name', v_borrower_corp.name,
            'apr',                p_apr,
            'principal',          v_request.principal,
            'term_ticks',         v_request.term_ticks
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',   true,
        'offer_id',  v_offer_id,
        'apr',       p_apr,
        'request_id', p_request_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.offer_loan(uuid, uuid, numeric) TO authenticated;

-- ─── accept_corp_loan_request (legacy direct-fund, body of 20270175:37-209 minus BO block) ───
CREATE OR REPLACE FUNCTION public.accept_corp_loan_request(
    p_request_id   uuid,
    p_bank_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_fac              factions%ROWTYPE;
    v_request          corp_loan_requests%ROWTYPE;
    v_borrower_corp    entrepreneur_corps%ROWTYPE;
    v_bank_corp        entrepreneur_corps%ROWTYPE;
    v_borrower_fac_id  uuid;
    v_bank_fac_id      uuid;
    v_tick             int;
    v_per_tick         bigint;
    v_loan_id          uuid;
    v_bank_funds       bigint;
    v_nation_name      text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_bank_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_request FROM corp_loan_requests
     WHERE id = p_request_id FOR UPDATE;
    IF v_request.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_request.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_pending');
    END IF;

    IF p_bank_corp_id = v_request.borrower_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_self_loan');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_request.expires_at_tick <= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_expired');
    END IF;

    PERFORM id FROM entrepreneur_corps
     WHERE id IN (p_bank_corp_id, v_request.borrower_corp_id)
     ORDER BY id FOR UPDATE;

    SELECT * INTO v_borrower_corp FROM entrepreneur_corps WHERE id = v_request.borrower_corp_id;
    IF v_borrower_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_corp_not_found');
    END IF;
    IF v_borrower_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_orphan');
    END IF;
    v_borrower_fac_id := v_borrower_corp.owner_faction_id;

    SELECT * INTO v_bank_corp FROM entrepreneur_corps WHERE id = p_bank_corp_id;
    IF v_bank_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;
    IF v_bank_corp.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_banking_corp');
    END IF;
    IF v_bank_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_orphan');
    END IF;
    v_bank_fac_id := v_bank_corp.owner_faction_id;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_bank_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_bank_corp_owner');
    END IF;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_request.principal
     WHERE id = v_bank_fac_id
       AND COALESCE(party_funds, 0) >= v_request.principal;
    IF NOT FOUND THEN
        SELECT COALESCE(party_funds, 0) INTO v_bank_funds
          FROM factions WHERE id = v_bank_fac_id;
        RETURN jsonb_build_object('success', false, 'reason', 'bank_insufficient_funds',
            'have', COALESCE(v_bank_funds, 0), 'need', v_request.principal);
    END IF;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_request.principal
     WHERE id = v_borrower_fac_id;

    v_per_tick := GREATEST(1, ROUND(
        v_request.principal::numeric / v_request.term_ticks
        + v_request.principal::numeric * v_request.apr / 12
    )::bigint);

    INSERT INTO corp_loans
        (request_id, borrower_corp_id, lender_corp_id, principal, apr, term_ticks,
         per_tick_payment, payments_remaining, started_at_tick)
    VALUES
        (p_request_id, v_request.borrower_corp_id, p_bank_corp_id,
         v_request.principal, v_request.apr, v_request.term_ticks,
         v_per_tick, v_request.term_ticks, v_tick)
    RETURNING id INTO v_loan_id;

    UPDATE corp_loan_requests
       SET status = 'accepted', accepted_by_corp_id = p_bank_corp_id,
           finalized_at_tick = v_tick
     WHERE id = p_request_id;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_borrower_corp.hq_nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_borrower_corp.hq_nation_id, v_fac.id,
        'Loan Funded',
        format('%s funds $%s loan to %s in %s. %s ticks × $%s per tick.',
               v_bank_corp.name,
               to_char(v_request.principal, 'FM999,999,999,999'),
               v_borrower_corp.name, v_nation_name,
               v_request.term_ticks,
               to_char(v_per_tick, 'FM999,999,999,999')),
        'corporate', 'corp_loan_funded',
        jsonb_build_object(
            'loan_id',            v_loan_id,
            'request_id',         p_request_id,
            'borrower_corp_id',   v_request.borrower_corp_id,
            'borrower_corp_name', v_borrower_corp.name,
            'lender_corp_id',     p_bank_corp_id,
            'lender_corp_name',   v_bank_corp.name,
            'principal',          v_request.principal,
            'apr',                v_request.apr,
            'term_ticks',         v_request.term_ticks,
            'per_tick_payment',   v_per_tick
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',          true,
        'loan_id',          v_loan_id,
        'request_id',       p_request_id,
        'principal',        v_request.principal,
        'per_tick_payment', v_per_tick,
        'term_ticks',       v_request.term_ticks
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_corp_loan_request(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
