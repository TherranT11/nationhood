-- ════════════════════════════════════════════════════════════════════
-- 20270935 — Owner Draw for businessmen + deposit-safe withdrawal
--
-- A businessman's only personal money is party_funds (Cash on Hand), but
-- withdraw_corp_treasury (20270233) resolved the caller as
-- faction_type='entrepreneur' only — so a businessman who owns a corp
-- (e.g. a bank) had no way to pull equity back out. invest_into_corp was
-- already widened to businessmen (20270802); this does the same for the
-- withdraw side, mirroring that function's faction-resolution exactly.
--
-- Re-emit of 20270233's withdraw_corp_treasury with TWO changes:
--   1. Owner faction = any entrepreneur/businessman of the caller,
--      preferring the one that owns this corp (verbatim the 20270802
--      invest_into_corp prelude).
--   2. Withdrawable now also subtracts bank_deposits — customer money
--      parked in treasury_cash (a liability, 20270897). 0 for every
--      non-bank corp, so behaviour there is unchanged; for a bank the
--      ledger is settled first so the figure is exact, and depositors'
--      cash can never be pocketed. Borrowed money was already excluded
--      via entrepreneur_corp_outstanding_debt.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.withdraw_corp_treasury(p_corp_id UUID, p_amount BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid      UUID := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_treasury BIGINT;
    v_debt     numeric;
    v_deposits bigint;
    v_avail    BIGINT;
    v_tick     INT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF p_amount IS NULL OR p_amount < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    -- Public corps pay shareholders via corp_dividend, not direct draws.
    IF v_corp.listing = 'public' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'use_dividend');
    END IF;

    -- Owner faction — entrepreneur OR businessman, preferring the one that
    -- owns this corp (verbatim invest_into_corp, 20270802).
    SELECT * INTO v_fac FROM factions
     WHERE faction_type IN ('entrepreneur', 'businessman')
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY (id = v_corp.owner_faction_id) DESC, created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    -- A bank's deposit base sits inside treasury_cash; settle the ledger
    -- first (the same touch every banking action makes) so bank_deposits
    -- is current, then re-read the row.
    IF v_corp.industry = 'banking' THEN
        PERFORM _bank_settle_deposits(p_corp_id);
        SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    END IF;

    -- Withdrawable = treasury MINUS what the corp owes (loans) MINUS
    -- customer deposits (bank liability; 0 for non-banks). Borrowed money
    -- and depositors' cash stay put; the owner pockets only equity above
    -- liabilities.
    v_treasury := floor(COALESCE(v_corp.treasury_cash, 0))::bigint;
    v_debt     := entrepreneur_corp_outstanding_debt(p_corp_id);
    v_deposits := floor(GREATEST(0, COALESCE(v_corp.bank_deposits, 0)))::bigint;
    v_avail    := GREATEST(0, floor(COALESCE(v_corp.treasury_cash, 0) - v_debt - v_deposits))::bigint;
    IF p_amount > v_avail THEN
        RETURN jsonb_build_object('success', false, 'reason', 'exceeds_withdrawable',
            'have', v_avail, 'need', p_amount,
            'treasury', v_treasury, 'debt', floor(v_debt)::bigint, 'deposits', v_deposits);
    END IF;

    -- Atomic: debit corp treasury, credit owner's personal Cash on Hand.
    UPDATE entrepreneur_corps
       SET treasury_cash = treasury_cash - p_amount
     WHERE id = p_corp_id;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) + p_amount
     WHERE id = v_fac.id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Owner Withdrawal',
        format('%s withdrew $%s from %s to personal funds.',
               COALESCE(v_fac.faction_name, 'The founder'), p_amount, v_corp.name),
        'corporate', 'corp_owner_withdrawal',
        jsonb_build_object('corp_id', p_corp_id, 'corp_name', v_corp.name, 'amount', p_amount),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',      true,
        'corp_id',      p_corp_id,
        'amount',       p_amount,
        'new_treasury', v_treasury - p_amount,
        'new_funds',    COALESCE(v_fac.party_funds, 0) + p_amount
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.withdraw_corp_treasury(UUID, BIGINT) TO authenticated;

COMMENT ON FUNCTION public.withdraw_corp_treasury(UUID, BIGINT) IS
    'Owner (entrepreneur OR businessman) of a PRIVATE corp draws treasury → personal party_funds, capped at floor(treasury − outstanding_debt − bank_deposits) so borrowed money and customer deposits can''t be pocketed. Banks settle their deposit ledger first. 1:1, no tax/cooldown. Public corps use corp_dividend. SECURITY DEFINER; corp-row FOR UPDATE serialises against corp_dividend / corp_trade / go_public.';

NOTIFY pgrst, 'reload schema';

COMMIT;
