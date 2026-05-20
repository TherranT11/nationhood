-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — corp_dividend (CEO declares per-share payout)
-- ════════════════════════════════════════════════════════════════════
-- CEO of a PUBLIC corp declares a per-share dividend. The RPC computes
-- total = per_share × Σ(corp_shareholdings.shares for this corp),
-- debits treasury_cash by exactly that, credits each holder's
-- party_funds proportional to their shares. Money conserved by exact
-- integer math:
--   Σ(per-holder credits) = per_share × Σheld = total = treasury debit.
--
-- Private corps have no corp_shareholdings rows (the founder is the
-- implicit 100% owner; private has no share state) so there's nothing
-- to distribute — gate as not_public. Founders get paid like any other
-- holder; they hold 20 of the 100 shares post-go_public.
--
-- Design defaults locked in (spec):
--   • No explicit cooldown — treasury cap is the natural brake.
--   • No auto-adjustment to share_price — the bonding curve discovers
--     post-dividend prices via natural selling.
--   • History queryable via event_log filtered to trigger_key
--     'corp_dividend'; no dedicated history table.
--
-- Lock order: corp row FOR UPDATE FIRST (consistent global order with
-- corp_trade / go_public / go_private / corp_board_leave /
-- corp_board_request_join). Faction-guard prelude VERBATIM the one in
-- the rest of the entrepreneur set. SECURITY DEFINER because
-- treasury_cash + share_price columns are client-write-revoked
-- (20270144) and corp_shareholdings has no client write policy.
--
-- Idempotent (CREATE OR REPLACE). No schema / table changes.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.corp_dividend(p_corp_id UUID, p_per_share BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid        UUID := auth.uid();
    v_fac        factions%ROWTYPE;
    v_corp       entrepreneur_corps%ROWTYPE;
    v_held_sum   BIGINT;
    v_recipients INT;
    v_total      BIGINT;
    v_tick       INT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF p_per_share IS NULL OR p_per_share < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
    END IF;

    -- Corp row FIRST — consistent global order with the rest of the
    -- entrepreneur money RPCs. listing is public (RLS SELECT-all), so
    -- the not_public guard before the faction resolve discloses nothing.
    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id
     FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.listing <> 'public' OR v_corp.share_price IS NULL
       OR v_corp.shares_outstanding IS NULL OR v_corp.treasury_cash IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_public');
    END IF;

    -- Caller's entrepreneur faction. VERBATIM the prelude in
    -- found_entrepreneur_corp / corp_trade / go_public / go_private /
    -- corp_board_leave / corp_board_request_join — keep the set in sync.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- CEO-only (owner of record).
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    -- Sum eligible holdings + count distinct recipients in one read.
    -- Corp row is locked above so the float is stable for this txn.
    SELECT COALESCE(SUM(shares), 0)::bigint, COUNT(*)
      INTO v_held_sum, v_recipients
      FROM corp_shareholdings
     WHERE corp_id = p_corp_id AND shares > 0;

    -- Public corp without held shares would be a malformed post-IPO
    -- state (go_public seats the founder's 20); defensive.
    IF v_held_sum < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_recipients');
    END IF;

    v_total := p_per_share * v_held_sum;

    -- Treasury cover. Compare bigint v_total to numeric treasury_cash;
    -- floor()-cast the treasury for the comparison and the 'have' field
    -- to avoid creating money on a fractional treasury (corp_trade
    -- keeps it whole-dollar, but never round UP).
    IF v_total > floor(v_corp.treasury_cash)::bigint THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'have', floor(v_corp.treasury_cash)::bigint, 'need', v_total);
    END IF;

    -- Atomic: treasury debit + per-holder credits in one transaction.
    -- The UPDATE … FROM joins each shareholdings row to its faction
    -- and applies the per-holder amount in a single statement so the
    -- sum of credits is mechanically equal to v_total.
    UPDATE entrepreneur_corps
       SET treasury_cash = treasury_cash - v_total
     WHERE id = p_corp_id;

    UPDATE factions f
       SET party_funds = COALESCE(f.party_funds, 0) + (p_per_share * cs.shares)
      FROM corp_shareholdings cs
     WHERE cs.corp_id = p_corp_id
       AND cs.shares  > 0
       AND f.id = cs.holder_faction_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Dividend Declared',
        format('%s declared a dividend of $%s per share ($%s total to %s holder%s).',
               v_corp.name, p_per_share, v_total, v_recipients,
               CASE WHEN v_recipients = 1 THEN '' ELSE 's' END),
        'corporate', 'corp_dividend',
        jsonb_build_object(
            'corp_id',     p_corp_id,
            'corp_name',   v_corp.name,
            'per_share',   p_per_share,
            'total',       v_total,
            'recipients',  v_recipients,
            'shares_paid', v_held_sum
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',      true,
        'corp_id',      p_corp_id,
        'per_share',    p_per_share,
        'total',        v_total,
        'recipients',   v_recipients,
        'new_treasury', floor(v_corp.treasury_cash)::bigint - v_total
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.corp_dividend(UUID, BIGINT) TO authenticated;

COMMENT ON FUNCTION public.corp_dividend(UUID, BIGINT) IS
    'CEO declares a per-share dividend on a public entrepreneur corp. Debits treasury_cash by per_share × Σheld; credits each holder''s party_funds proportional to their shares (single UPDATE … FROM so the sum of credits == treasury debit exactly). CEO-only, public-only. No cooldown (treasury cap is the brake). No auto-adjustment to share_price. SECURITY DEFINER; corp-row FOR UPDATE serialises against corp_trade / go_public / go_private / corp_board_*.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- DROP FUNCTION IF EXISTS public.corp_dividend(UUID, BIGINT);
-- Safe: no schema/table changes; no migrated data.
