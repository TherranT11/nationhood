-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — withdraw_corp_treasury (founder pulls cash out)
-- ════════════════════════════════════════════════════════════════════
-- The founder/CEO of a PRIVATE corp moves money from the corp treasury
-- (entrepreneur_corps.treasury_cash) into their personal Cash on Hand
-- (factions.party_funds — the field the entrepreneur top bar + corp_dividend
-- both use). Private corps are 100% founder-owned with no shareholders, so
-- the owner can draw freely; public corps distribute via corp_dividend
-- (per-share) instead and are gated out here.
--
-- 1:1 transfer, no tax, no cooldown — the treasury balance is the natural
-- brake, exactly like corp_dividend. Atomic: debit treasury, credit
-- party_funds in one transaction.
--
-- Lock order + faction-guard prelude are VERBATIM the rest of the
-- entrepreneur money set (corp_dividend / corp_trade / go_public / …):
-- corp row FOR UPDATE first, then resolve the caller's entrepreneur
-- faction. SECURITY DEFINER because treasury_cash is client-write-revoked
-- (20270144).
--
-- Idempotent (CREATE OR REPLACE). No schema / table changes.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.withdraw_corp_treasury(p_corp_id UUID, p_amount BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid    UUID := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_avail  BIGINT;
    v_tick   INT;
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

    -- Corp row FIRST — consistent global lock order with the rest of the
    -- entrepreneur money RPCs.
    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id
     FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    -- Public corps pay shareholders via corp_dividend, not direct draws.
    IF v_corp.listing = 'public' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'use_dividend');
    END IF;

    -- Caller's entrepreneur faction. VERBATIM the prelude in corp_dividend /
    -- found_entrepreneur_corp / corp_trade — keep the set in sync.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- Founder / CEO / sole owner of record.
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    -- Treasury cover. floor() so a fractional treasury never rounds UP into
    -- money that isn't there (matches corp_dividend).
    v_avail := floor(COALESCE(v_corp.treasury_cash, 0))::bigint;
    IF p_amount > v_avail THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'have', v_avail, 'need', p_amount);
    END IF;

    -- Atomic: debit corp treasury, credit founder's personal Cash on Hand.
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
        'new_treasury', v_avail - p_amount,
        'new_funds',    COALESCE(v_fac.party_funds, 0) + p_amount
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.withdraw_corp_treasury(UUID, BIGINT) TO authenticated;

COMMENT ON FUNCTION public.withdraw_corp_treasury(UUID, BIGINT) IS
    'Founder/CEO of a PRIVATE entrepreneur corp moves money from treasury_cash into their personal party_funds (Cash on Hand). 1:1, no tax/cooldown (treasury is the brake). Owner-only, private-only (public corps use corp_dividend). SECURITY DEFINER; corp-row FOR UPDATE serialises against corp_dividend / corp_trade / go_public / go_private.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- DROP FUNCTION IF EXISTS public.withdraw_corp_treasury(UUID, BIGINT);
