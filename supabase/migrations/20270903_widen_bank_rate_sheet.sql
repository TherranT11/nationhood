-- ════════════════════════════════════════════════════════════════════
-- 20270903 — Widen the bank rate-sheet pill sets
--
-- Doubles the granularity of the Set Interest Rate sheet (business-
-- corp.html). New chartered pill values (yearly, bps):
--   DEPOSIT RATE: 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5%  → 100..450
--   PRIME RATE:   2, 4, 5, 6, 8, 10, 12%           → 200..1200
--
-- bank_set_interest_rate re-emitted verbatim from 20270893 with ONLY
-- the two allowed-set checks (and their explanatory comment) widened.
-- The deposit/prime ranges now overlap, so the existing 'invalid_spread'
-- guard (deposit >= prime) does real work — kept unchanged. Client pill
-- arrays in business-corp.html match this set.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    -- The chartered pill values (yearly): deposits 1-4.5%, prime 2-12%.
    IF p_deposit_bps NOT IN (100, 150, 200, 250, 300, 350, 400, 450)
       OR p_prime_bps NOT IN (200, 400, 500, 600, 800, 1000, 1200) THEN
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
