-- ════════════════════════════════════════════════════════════════════
-- CORP LOANS v0 — second-pass audit fixes
-- ════════════════════════════════════════════════════════════════════
-- Two narrow fixes on top of 20270174:
--
-- 1. Same-tick double-bill in process_corp_loans. accept_corp_loan_request
--    creates a loan with started_at_tick = current and
--    last_payment_tick = NULL. If process_corp_loans then runs later in
--    the same tick (3.6f after 3.6e, before next phases — the exact
--    ordering depends on the advance-tick handler), the loan would
--    immediately be charged its first per-tick payment, so a player
--    who accepts mid-tick effectively receives the principal and then
--    is debited per_tick_payment a moment later. Order-dependent UX
--    on a transparent state machine = bad. Fix: add the
--    started_at_tick < v_tick gate to the service-loop WHERE so the
--    first charge always lands on the tick AFTER acceptance.
--
-- 2. Self-loan loophole in accept_corp_loan_request. Nothing in v0
--    explicitly prevented a Banking corp from accepting its own
--    loan request (it can — a Banking corp may own a Banking Office
--    in its own HQ nation, satisfying eligibility). Money flow nets
--    to zero (intra-faction debit + credit on the same row), but the
--    loan row exists and the tick processor cycles per-tick zero-
--    delta transactions until repayment. The UI client-filter
--    (r.borrower?.id !== id) hides own requests from the bank's
--    Active Projects but the RPC is still callable from the API.
--    Fix: server-side check borrower_corp_id != p_bank_corp_id.
--
-- Body otherwise verbatim from 20270174. Same signature, GRANT,
-- SECURITY DEFINER. Idempotent (CREATE OR REPLACE).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. accept_corp_loan_request — add self-loan rejection ───────

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
    v_has_bo           boolean;
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

    -- v0 audit: no self-loans. Eligibility check would pass for a
    -- Banking corp accepting its own request, but the loan would be
    -- a $0-net intra-faction transfer and clutter event_log forever.
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

    SELECT EXISTS (
        SELECT 1 FROM corp_buildings
         WHERE owner_corp_id = p_bank_corp_id
           AND nation_id     = v_borrower_corp.hq_nation_id
           AND building_type = 'banking_office'
           AND status        = 'completed'
    ) INTO v_has_bo;
    IF NOT v_has_bo THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_banking_office_in_nation');
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

-- ── 2. process_corp_loans — add started_at_tick < v_tick gate ───

CREATE OR REPLACE FUNCTION public.process_corp_loans(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r                  RECORD;
    v_tick             int;
    v_borrower_fac_id  uuid;
    v_lender_fac_id    uuid;
    v_expired          int := 0;
    v_paid             int := 0;
    v_defaulted        int := 0;
    v_repaid           int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR r IN
        SELECT id FROM corp_loan_requests
         WHERE status = 'pending' AND expires_at_tick <= v_tick
         FOR UPDATE
    LOOP
        UPDATE corp_loan_requests
           SET status = 'expired', finalized_at_tick = v_tick
         WHERE id = r.id;
        v_expired := v_expired + 1;
    END LOOP;

    -- v0 audit: started_at_tick < v_tick prevents same-tick double-
    -- bill. A loan accepted at tick T has its first per-tick charge
    -- at tick T+1 — borrower keeps the principal for one full tick
    -- before payments begin. last_payment_tick gate stays to prevent
    -- double-billing if this handler runs twice in one tick.
    FOR r IN
        SELECT id, borrower_corp_id, lender_corp_id, per_tick_payment,
               payments_remaining, total_paid
          FROM corp_loans
         WHERE status = 'active'
           AND payments_remaining > 0
           AND started_at_tick < v_tick
           AND (last_payment_tick IS NULL OR last_payment_tick < v_tick)
         FOR UPDATE
    LOOP
        SELECT owner_faction_id INTO v_borrower_fac_id
          FROM entrepreneur_corps WHERE id = r.borrower_corp_id;
        SELECT owner_faction_id INTO v_lender_fac_id
          FROM entrepreneur_corps WHERE id = r.lender_corp_id;

        IF v_borrower_fac_id IS NULL OR v_lender_fac_id IS NULL THEN
            UPDATE corp_loans
               SET status = 'defaulted', defaulted_at_tick = v_tick
             WHERE id = r.id;
            v_defaulted := v_defaulted + 1;
            CONTINUE;
        END IF;

        UPDATE factions
           SET party_funds = COALESCE(party_funds, 0) - r.per_tick_payment
         WHERE id = v_borrower_fac_id
           AND COALESCE(party_funds, 0) >= r.per_tick_payment;
        IF NOT FOUND THEN
            UPDATE corp_loans
               SET status = 'defaulted', defaulted_at_tick = v_tick
             WHERE id = r.id;
            v_defaulted := v_defaulted + 1;
            CONTINUE;
        END IF;

        UPDATE factions
           SET party_funds = COALESCE(party_funds, 0) + r.per_tick_payment
         WHERE id = v_lender_fac_id;

        UPDATE corp_loans
           SET payments_remaining = payments_remaining - 1,
               total_paid         = total_paid + r.per_tick_payment,
               last_payment_tick  = v_tick,
               status             = CASE WHEN payments_remaining - 1 = 0 THEN 'repaid' ELSE 'active' END
         WHERE id = r.id;

        IF r.payments_remaining - 1 = 0 THEN
            v_repaid := v_repaid + 1;
        ELSE
            v_paid := v_paid + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true,
        'expired',    v_expired,
        'paid',       v_paid,
        'repaid',     v_repaid,
        'defaulted',  v_defaulted,
        'tick',       v_tick);
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_corp_loans(int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270174 to restore the un-audited versions. The fixes
-- only TIGHTEN behaviour (no schema change, no data migration), so
-- rollback is safe — existing loans / requests are unaffected.
