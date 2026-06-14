-- ════════════════════════════════════════════════════════════════════
-- 20270925 — Loan requests carry a lender scope (Local / National)
--
-- When a corp files a loan request it now picks who may bid:
--   • national — any bank (the existing open-market behavior).
--   • local    — only banks headquartered in the borrower's own nation.
-- The Offer Loan board reads the scope to filter + label each request.
--
-- corp_request_loan gains p_lender_scope (defaults to 'national', so any
-- existing 2-arg caller keeps working). The 2-arg signature is dropped so
-- there's one function, not an overloaded pair.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.corp_bank_loan_requests
    ADD COLUMN IF NOT EXISTS lender_scope text NOT NULL DEFAULT 'national'
        CHECK (lender_scope IN ('local', 'national'));

DROP FUNCTION IF EXISTS public.corp_request_loan(uuid, bigint);

CREATE OR REPLACE FUNCTION public.corp_request_loan(
    p_corp_id      uuid,
    p_amount       bigint,
    p_lender_scope text DEFAULT 'national'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_corp  entrepreneur_corps%ROWTYPE;
    v_fac   factions%ROWTYPE;
    v_tick  int;
    v_id    uuid;
    v_scope text := lower(COALESCE(p_lender_scope, 'national'));
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_amount IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_amount < 100000 OR p_amount > 100000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount',
            'min', 100000, 'max', 100000000);
    END IF;
    IF v_scope NOT IN ('local', 'national') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_scope');
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

    IF EXISTS (SELECT 1 FROM corp_bank_loan_requests
                WHERE corp_id = p_corp_id AND status = 'open') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_already_open');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO corp_bank_loan_requests (corp_id, nation_id, amount, lender_scope, created_at_tick)
    VALUES (p_corp_id, v_corp.hq_nation_id, p_amount, v_scope, v_tick)
    RETURNING id INTO v_id;

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Filed a %s loan request for $%s on the credit market.', v_scope, p_amount));

    RETURN jsonb_build_object('success', true, 'request_id', v_id, 'amount', p_amount, 'lender_scope', v_scope);
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_request_loan(uuid, bigint, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_request_loan(uuid, bigint, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
