-- ════════════════════════════════════════════════════════════════════
-- 20270893 — Banking executive action #1: Set Interest Rate
--
-- The bank's rate sheet: two posted prices that everything else in
-- the banking kit will hang off. The DEPOSIT RATE (yearly, what the
-- bank pays savers — the cost of funding) and the PRIME RATE
-- (yearly, what its loans price from). The spread between them is
-- the business. Rates persist until re-posted; posting burns the
-- day's executive action (the same exec_action_tick gate every
-- industry uses — that IS the cooldown, per design ruling). Future
-- loans lock their rate at origination, so re-posting the sheet can
-- never reprice an existing book.
--
-- Stored in basis points (200 = 2%) so the columns stay integers.
-- NULL = the bank has never posted a sheet. No money moves here —
-- deposit gathering and lending are the follow-up actions.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS bank_deposit_rate_bps int,
    ADD COLUMN IF NOT EXISTS bank_prime_rate_bps   int;

COMMENT ON COLUMN public.entrepreneur_corps.bank_deposit_rate_bps IS
    'Banking rate sheet (20270893): yearly deposit rate in basis points (what the bank pays savers). NULL until the bank first posts a sheet via bank_set_interest_rate.';
COMMENT ON COLUMN public.entrepreneur_corps.bank_prime_rate_bps IS
    'Banking rate sheet (20270893): yearly prime rate in basis points (the benchmark its loans price from). NULL until first posted.';

CREATE OR REPLACE FUNCTION public.bank_set_interest_rate(
    p_corp_id     uuid,
    p_deposit_bps int,
    p_prime_bps   int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_deposit_bps IS NULL OR p_prime_bps IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    -- The chartered pill values (yearly): deposits 1-4%, prime 6-12%.
    IF p_deposit_bps NOT IN (100, 200, 300, 400)
       OR p_prime_bps NOT IN (600, 800, 1000, 1200) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rate');
    END IF;
    -- Belt and braces: the pill sets can never overlap, but the rule
    -- ("never pay savers more than borrowers pay you") is a doctrine,
    -- not an accident of today's values.
    IF p_deposit_bps >= p_prime_bps THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_spread');
    END IF;

    -- Lock the corp row: the allowance check must serialize.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Settle the deposit ledger at the OLD rate before repricing
    -- (20270897) — the elapsed window was lived under the old sheet.
    PERFORM _bank_settle_deposits(p_corp_id);

    UPDATE entrepreneur_corps
       SET bank_deposit_rate_bps = p_deposit_bps,
           bank_prime_rate_bps   = p_prime_bps,
           exec_action_tick      = v_tick
     WHERE id = p_corp_id;

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Posted the rate sheet — deposits at %s%%, prime at %s%%.',
               p_deposit_bps / 100, p_prime_bps / 100));

    RETURN jsonb_build_object('success', true,
        'deposit_bps', p_deposit_bps,
        'prime_bps',   p_prime_bps);
END $$;

REVOKE EXECUTE ON FUNCTION public.bank_set_interest_rate(uuid, int, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bank_set_interest_rate(uuid, int, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
