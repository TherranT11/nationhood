-- ════════════════════════════════════════════════════════════════════
-- Personal-loan paydown helper — SOT audit fix for 20270427
--
-- 20270427 introduced a second copy of the lazy-accrual + interest-
-- first-then-principal split + loan UPDATE + lender credit logic
-- inside buy_building's abandoned branch. The math is byte-for-byte
-- the same as make_personal_loan_payment from 20270426 — a textbook
-- SOT violation that the audit caught.
--
-- Fix: extract the logic into public.apply_personal_loan_paydown.
-- The helper is the canonical source going forward; both callers
-- (make_personal_loan_payment, buy_building) become thin wrappers
-- that handle their own cash routing around the call.
--
-- ── Helper contract ─────────────────────────────────────────────────
-- apply_personal_loan_paydown(loan_id, amount, tick, dry_run) returns:
--   {
--     total_applied:             bigint  -- = interest_paid + principal_paid
--     interest_paid:             bigint
--     principal_paid:            bigint
--     status_after:              text    -- 'active' | 'paid'
--     principal_remaining_after: bigint
--     accrued_interest_after:    bigint
--     lender_corp_id:            uuid    -- for the caller's audit log
--     no_active_loan:            bool    -- true when no loan to paydown
--   }
-- Math: same lazy-accrual + interest-first-then-principal split that
-- shipped in 20270426 + 20270427. Caps `amount` at outstanding
-- (interest_due + principal_remaining).
--
-- ── dry_run mode ────────────────────────────────────────────────────
-- p_dry_run = true → returns the split that WOULD apply, no UPDATEs.
-- Used by make_personal_loan_payment to check borrower funds against
-- the actual amount before committing. Apply call (dry_run=false)
-- re-runs the math deterministically since the loan row is locked
-- FOR UPDATE in both calls within the same transaction.
--
-- ── Lock order ──────────────────────────────────────────────────────
-- Helper locks personal_loans FOR UPDATE. Both callers' lock chains
-- (make_personal_loan_payment: loan → borrower faction; buy_building
-- abandoned: building → buyer_corp → caller_faction → loan → seller
-- faction) preserve the loan-before-borrower-faction ordering — no
-- deadlock surface between the two RPCs paying down the same loan.
--
-- ── Caller responsibility ──────────────────────────────────────────
-- Helper credits the lender (via lender_corp_id → owner_faction).
-- Helper does NOT debit the payer — that's the caller's job:
--   make_personal_loan_payment: debit borrower's party_funds by
--     total_applied.
--   buy_building (abandoned): buyer already debited via list_price;
--     remainder (price − total_applied) credits ex-owner's party_funds.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. The helper ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.apply_personal_loan_paydown(
    p_loan_id uuid,
    p_amount  bigint,
    p_tick    int,
    p_dry_run bool DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_loan             personal_loans%ROWTYPE;
    v_ticks_passed     int;
    v_new_interest     numeric;
    v_total_interest   numeric;
    v_int_due_bigint   bigint;
    v_cap              bigint;
    v_interest_paid    bigint;
    v_principal_paid   bigint;
    v_total_applied    bigint;
    v_new_status       text;
BEGIN
    SELECT * INTO v_loan FROM personal_loans
     WHERE id = p_loan_id AND status = 'active'
     FOR UPDATE;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('total_applied', 0, 'no_active_loan', true);
    END IF;

    v_ticks_passed   := GREATEST(0, p_tick - v_loan.last_accrual_tick);
    v_new_interest   := v_loan.principal_remaining
                      * v_loan.apr_pct / 100.0
                      / 144.0
                      * v_ticks_passed;
    v_total_interest := v_loan.accrued_interest_unpaid + v_new_interest;
    v_int_due_bigint := ROUND(v_total_interest)::bigint;

    -- Cap at outstanding (interest + principal).
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

        -- Credit lender corp's owner faction with total_applied.
        -- Lender corp deleted (lender_corp_id NULL) → portion sunk.
        IF v_loan.lender_corp_id IS NOT NULL AND v_total_applied > 0 THEN
            UPDATE factions f
               SET party_funds = COALESCE(party_funds, 0) + v_total_applied
              FROM entrepreneur_corps c
             WHERE c.id = v_loan.lender_corp_id AND f.id = c.owner_faction_id;
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

COMMENT ON FUNCTION public.apply_personal_loan_paydown(uuid, bigint, int, bool) IS
    'Canonical paydown for an active personal_loan. Lazy-accrues interest on principal_remaining, splits incoming amount interest-first-then-principal (capped at outstanding), updates the loan row, credits the lender corp''s owner faction. Does NOT debit the payer — caller routes their own cash. dry_run=true returns the split without writing.';
-- Internal helper — not granted to authenticated. SECURITY DEFINER
-- callers (make_personal_loan_payment, buy_building) reach it via
-- owner-privilege, no client-direct invocation.

-- ── 2. Re-author make_personal_loan_payment using the helper ────────
-- Validation, ownership check, locking are unchanged. The math +
-- loan write + lender credit are replaced by two helper calls
-- (dry-run for the funds-check, then apply for real).
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

    -- Lock the loan + the borrower in lock-order (loan first, then
    -- faction) — same order in apply_personal_loan_paydown and
    -- buy_building's abandoned branch.
    SELECT * INTO v_loan FROM personal_loans WHERE id = p_loan_id FOR UPDATE;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_not_found');
    END IF;
    IF v_loan.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'loan_not_active');
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
    IF v_fac.id <> v_loan.borrower_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_borrower');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, v_loan.last_accrual_tick);

    -- Preview the paydown to learn what would actually be taken.
    v_preview := apply_personal_loan_paydown(p_loan_id, p_amount, v_tick, true);
    v_actual  := (v_preview->>'total_applied')::bigint;

    IF COALESCE(v_fac.party_funds, 0) < v_actual THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_actual);
    END IF;

    -- Apply for real. Math is deterministic from the same locked row;
    -- v_actual stays the same.
    v_result := apply_personal_loan_paydown(p_loan_id, p_amount, v_tick, false);

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_actual
     WHERE id = v_fac.id;

    RETURN jsonb_build_object(
        'success',           true,
        'loan_id',           p_loan_id,
        'paid',              v_actual,
        'interest_paid',     (v_result->>'interest_paid')::bigint,
        'principal_paid',    (v_result->>'principal_paid')::bigint,
        'principal_remaining', (v_result->>'principal_remaining_after')::bigint,
        'accrued_interest',  (v_result->>'accrued_interest_after')::bigint,
        'status',            v_result->>'status_after'
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.make_personal_loan_payment(uuid, bigint) TO authenticated;

-- ── 3. Re-author buy_building using the helper ──────────────────────
-- Body = 20270427 + abandoned-branch loan-paydown collapsed into one
-- helper call. Locking, ownership checks, normal-sale path,
-- previous_owner_faction_id clear, event log are byte-for-byte
-- identical to 20270427.
CREATE OR REPLACE FUNCTION public.buy_building(
    p_building_id   uuid,
    p_buyer_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_fac              factions%ROWTYPE;
    v_building         corp_buildings%ROWTYPE;
    v_buyer_corp       entrepreneur_corps%ROWTYPE;
    v_seller_corp      entrepreneur_corps%ROWTYPE;
    v_seller_fac_id    uuid;
    v_price            bigint;
    v_tick             int;
    v_nation_name      text;
    v_abandoned        bool := false;
    v_loan_id          uuid;
    v_paydown          jsonb;
    v_to_loan          bigint := 0;
    v_int_paid         bigint := 0;
    v_prin_paid        bigint := 0;
    v_to_party_funds   bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_building_id IS NULL OR p_buyer_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_building FROM corp_buildings
     WHERE id = p_building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.list_price IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_for_sale');
    END IF;
    IF v_building.status <> 'completed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_completed');
    END IF;

    IF v_building.owner_corp_id IS NULL THEN
        IF v_building.previous_owner_faction_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_seller');
        END IF;
        v_abandoned     := true;
        v_seller_fac_id := v_building.previous_owner_faction_id;
    ELSE
        IF p_buyer_corp_id = v_building.owner_corp_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'cannot_buy_own_building');
        END IF;
    END IF;
    v_price := v_building.list_price;

    IF v_abandoned THEN
        PERFORM id FROM entrepreneur_corps WHERE id = p_buyer_corp_id FOR UPDATE;
    ELSE
        PERFORM id FROM entrepreneur_corps
         WHERE id IN (p_buyer_corp_id, v_building.owner_corp_id)
         ORDER BY id FOR UPDATE;
    END IF;

    SELECT * INTO v_buyer_corp FROM entrepreneur_corps WHERE id = p_buyer_corp_id;
    IF v_buyer_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_corp_not_found');
    END IF;
    IF v_buyer_corp.industry <> 'real_estate' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_not_real_estate');
    END IF;

    IF NOT v_abandoned THEN
        SELECT * INTO v_seller_corp FROM entrepreneur_corps WHERE id = v_building.owner_corp_id;
        IF v_seller_corp.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'seller_corp_not_found');
        END IF;
        IF v_seller_corp.owner_faction_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'seller_orphan');
        END IF;
        v_seller_fac_id := v_seller_corp.owner_faction_id;
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
    IF v_buyer_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_buyer_corp_owner');
    END IF;

    IF COALESCE(v_fac.party_funds, 0) < v_price THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_price);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_price
     WHERE id = v_fac.id;

    IF v_abandoned THEN
        -- Lock order: (loan → seller faction). The helper acquires the
        -- loan FOR UPDATE; the subsequent UPDATE to seller faction
        -- implicitly takes that row's lock. Same order as
        -- make_personal_loan_payment so concurrent RPCs paying down
        -- the same loan can't deadlock.
        SELECT id INTO v_loan_id FROM personal_loans
         WHERE borrower_faction_id = v_seller_fac_id AND status = 'active'
         LIMIT 1;

        IF v_loan_id IS NOT NULL THEN
            v_paydown   := apply_personal_loan_paydown(v_loan_id, v_price, v_tick, false);
            v_to_loan   := (v_paydown->>'total_applied')::bigint;
            v_int_paid  := (v_paydown->>'interest_paid')::bigint;
            v_prin_paid := (v_paydown->>'principal_paid')::bigint;
        END IF;

        v_to_party_funds := v_price - v_to_loan;
        IF v_to_party_funds > 0 THEN
            -- If the seller faction was hard-deleted between bankruptcy
            -- and this sale (rare — would mean ON DELETE SET NULL on
            -- previous_owner_faction_id failed somehow), the UPDATE
            -- affects 0 rows and the remainder is sunk. Acceptable
            -- carryover.
            UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_to_party_funds
             WHERE id = v_seller_fac_id;
        END IF;
    ELSE
        UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_price
         WHERE id = v_seller_fac_id;
    END IF;

    UPDATE corp_buildings
       SET owner_corp_id              = p_buyer_corp_id,
           list_price                 = NULL,
           previous_owner_faction_id  = NULL
     WHERE id = p_building_id;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_building.nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        CASE WHEN v_abandoned THEN 'Abandoned Building Acquired' ELSE 'Building Acquired' END,
        CASE WHEN v_abandoned
             THEN format('%s acquires abandoned %s in %s for $%s. $%s → loan paydown, $%s → ex-owner.',
                         v_buyer_corp.name, v_building.name, v_nation_name,
                         to_char(v_price, 'FM999,999,999,999'),
                         to_char(v_to_loan, 'FM999,999,999,999'),
                         to_char(v_to_party_funds, 'FM999,999,999,999'))
             ELSE format('%s acquires %s in %s from %s for $%s.',
                         v_buyer_corp.name, v_building.name, v_nation_name,
                         v_seller_corp.name, to_char(v_price, 'FM999,999,999,999'))
        END,
        'corporate', 'building_purchased',
        jsonb_build_object(
            'building_id',      p_building_id,
            'building_name',    v_building.name,
            'buyer_corp_id',    p_buyer_corp_id,
            'buyer_corp_name',  v_buyer_corp.name,
            'seller_corp_id',   v_seller_corp.id,
            'seller_corp_name', v_seller_corp.name,
            'price',            v_price,
            'tier',             v_building.tier,
            'abandoned',        v_abandoned,
            'loan_paydown',     v_to_loan,
            'to_party_funds',   v_to_party_funds
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'building_id',       p_building_id,
        'price',             v_price,
        'new_owner_corp_id', p_buyer_corp_id,
        'seller_corp_id',    v_seller_corp.id,
        'abandoned',         v_abandoned,
        'loan_paydown',      v_to_loan,
        'to_party_funds',    v_to_party_funds,
        'new_funds',         COALESCE(v_fac.party_funds, 0) - v_price
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.buy_building(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
