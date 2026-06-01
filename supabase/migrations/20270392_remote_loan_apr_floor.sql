-- ════════════════════════════════════════════════════════════════════
-- offer_loan — soft APR floor instead of hard banking-office gate
-- ════════════════════════════════════════════════════════════════════
-- Before this migration, offer_loan (20270177) hard-rejected any bid
-- from a bank corp without a completed Banking Office in the
-- borrower's HQ nation, returning reason 'no_banking_office_in_nation'.
-- The visible header comment on the lender-side render already said
-- "any banking corp can make an offer back — banking is a global
-- market, no per-nation gate" — the implementation was tighter than
-- the design intent.
--
-- New behaviour: remote lenders can bid, but must clear an APR floor:
--
--     floor% = nations.central_bank_interest_rate + 1.00
--
-- read off the borrower's HQ nation. CB rate is stored as a percentage
-- (NUMERIC(4,2) DEFAULT 5.00); p_apr arrives as a fraction (0.06 = 6%)
-- so we divide by 100 before comparing. Lenders WITH a local Banking
-- Office face no floor (existing 0..50% bounds still apply).
--
-- Below-floor submissions return 'apr_below_remote_floor' along with
-- the floor in PERCENT form so the client can render the exact number
-- in the error message ("Min APR for this loan: 6.00%"). Successful
-- submissions are indistinguishable from any other offer — the floor
-- is purely a gating check, not stored on the offer row.
--
-- Body otherwise verbatim from 20270177:214-345. Two new local vars
-- (v_cb_rate, v_floor_pct, v_floor), one swapped IF branch.
-- CREATE OR REPLACE, idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    v_has_bo           boolean;
    v_cb_rate          numeric;
    v_floor_pct        numeric;
    v_floor            numeric;
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

    -- Local-office check: completed Banking Office in borrower HQ nation.
    SELECT EXISTS (
        SELECT 1 FROM corp_buildings
         WHERE owner_corp_id = p_bank_corp_id
           AND nation_id     = v_borrower_corp.hq_nation_id
           AND building_type = 'banking_office'
           AND status        = 'completed'
    ) INTO v_has_bo;

    -- Soft floor for remote lenders: APR must be >= CB rate + 1% of the
    -- borrower's HQ nation. Local-office lenders are unrestricted beyond
    -- the existing 0..50% bounds. Defensive COALESCE in case a future
    -- migration ever drops the NOT NULL DEFAULT on central_bank_interest_rate.
    IF NOT v_has_bo THEN
        SELECT COALESCE(central_bank_interest_rate, 5.00) INTO v_cb_rate
          FROM nations WHERE id = v_borrower_corp.hq_nation_id;
        v_cb_rate   := COALESCE(v_cb_rate, 5.00);
        v_floor_pct := v_cb_rate + 1.00;
        v_floor     := v_floor_pct / 100;
        IF p_apr < v_floor THEN
            RETURN jsonb_build_object(
                'success',   false,
                'reason',    'apr_below_remote_floor',
                'floor_pct', v_floor_pct
            );
        END IF;
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
            'term_ticks',         v_request.term_ticks,
            'remote',             NOT v_has_bo
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',    true,
        'offer_id',   v_offer_id,
        'apr',        p_apr,
        'request_id', p_request_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.offer_loan(uuid, uuid, numeric) TO authenticated;

COMMENT ON FUNCTION public.offer_loan(uuid, uuid, numeric) IS
    'Banking corp''s owner submits a rate offer on a pending loan request. Any banking corp can bid; lenders without a completed Banking Office in the borrower HQ nation must clear an APR floor of (borrower nation''s central_bank_interest_rate + 1.00). Upserts via partial UNIQUE — revising the APR is a single round-trip.';

NOTIFY pgrst, 'reload schema';

COMMIT;
