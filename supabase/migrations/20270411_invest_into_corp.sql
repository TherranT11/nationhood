-- ════════════════════════════════════════════════════════════════════
-- invest_into_corp — founder pushes personal funds into corp treasury
-- ════════════════════════════════════════════════════════════════════
-- Inverse of withdraw_corp_treasury (20270233). A founder of a PRIVATE
-- corp can move money the other direction: from their personal
-- factions.party_funds (the entrepreneur's "Cash on Hand") into the
-- corp's entrepreneur_corps.treasury_cash. 1:1, no tax / cooldown,
-- gated only on the founder having enough personal cash and on the
-- corp being private (public corps raise capital via share issuance,
-- not founder injections — same shape distinction withdraw uses).
--
-- ── Mirror notes vs withdraw_corp_treasury ─────────────────────────
-- The two RPCs are intentionally symmetric:
--
--   WITHDRAW   corp.treasury_cash  -=  amount
--              fac.party_funds     +=  amount
--              gate: amount <= treasury − outstanding debt
--
--   INVEST     fac.party_funds     -=  amount     (this RPC)
--              corp.treasury_cash  +=  amount
--              gate: amount <= fac.party_funds
--
-- No outstanding-debt gate on the invest direction — paying down
-- corp debt with personal funds is a legitimate (and common) reason
-- to invest, so capping at treasury−debt would block the use case.
--
-- ── Concurrency ─────────────────────────────────────────────────────
-- Both rows (corp + faction) are taken FOR UPDATE in stable order
-- (corp first, founder second — same order as withdraw_corp_treasury)
-- so an INVEST and a concurrent WITHDRAW serialise cleanly rather
-- than deadlock. SECURITY DEFINER mirrors withdraw's pattern.
--
-- ── Event log ───────────────────────────────────────────────────────
-- One row with category='corporate' / trigger_key='corp_owner_invest',
-- matching the withdraw beat ('corp_owner_withdrawal') so the
-- corporate event feed reads both directions cleanly.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.invest_into_corp(p_corp_id UUID, p_amount BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       UUID := auth.uid();
    v_fac       factions%ROWTYPE;
    v_corp      entrepreneur_corps%ROWTYPE;
    v_funds     BIGINT;
    v_tick      INT;
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
    -- Public corps raise capital via share issuance, not founder cash
    -- injections (which would silently dilute the public float).
    IF v_corp.listing = 'public' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'use_share_issuance');
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

    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    -- Personal-cash gate. floor() so a fractional party_funds value
    -- doesn't permit an over-spend via int truncation either side.
    v_funds := floor(COALESCE(v_fac.party_funds, 0))::bigint;
    IF p_amount > v_funds THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_funds, 'need', p_amount);
    END IF;

    -- Atomic: debit founder's Cash on Hand, credit corp treasury.
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - p_amount
     WHERE id = v_fac.id;

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + p_amount
     WHERE id = p_corp_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Owner Investment',
        format('%s invested $%s of personal funds into %s.',
               COALESCE(v_fac.faction_name, 'The founder'), p_amount, v_corp.name),
        'corporate', 'corp_owner_invest',
        jsonb_build_object('corp_id', p_corp_id, 'corp_name', v_corp.name, 'amount', p_amount),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',      true,
        'corp_id',      p_corp_id,
        'amount',       p_amount,
        'new_treasury', floor(COALESCE(v_corp.treasury_cash, 0))::bigint + p_amount,
        'new_funds',    v_funds - p_amount
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.invest_into_corp(UUID, BIGINT) TO authenticated;

COMMENT ON FUNCTION public.invest_into_corp(UUID, BIGINT) IS
    'Founder/CEO of a PRIVATE corp injects personal party_funds → corp treasury_cash. '
    '1:1, no tax/cooldown. Gated only on the founder having enough personal cash and '
    'on the corp being private (public corps raise capital via share issuance). '
    'Mirrors withdraw_corp_treasury (20270233) in the inverse direction. SECURITY '
    'DEFINER; takes corp + faction rows FOR UPDATE in the same stable order so '
    'invest and withdraw serialise rather than deadlock.';

NOTIFY pgrst, 'reload schema';

COMMIT;
