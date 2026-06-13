-- ════════════════════════════════════════════════════════════════════
-- 20270896 — Banking executive action #5: Logistical Overhaul,
--            and the five bank assets
--
-- The asset ladder, on the shared construction price ladder
-- (yard_upgrade_cost — Level I $7M when built from 0, II $10M,
-- III $16M, IV $25M, V $40M), one level per action, tax-package
-- discount parity with the other industries' overhauls (20270890).
--
-- The five assets. BRANCH NETWORK went live with the deposit ledger
-- (20270897 — pool share + drift speed); THE VAULT went live in the
-- crash (20270895 — writedown armor, run shelter, the Level V
-- flight-to-quality refuge); the UNDERWRITING DESK caps the loan
-- ticket in bank_offer_loan (20270894 — $20M per level, Sovereign
-- Desk reaching the board's $100M ceiling); the TRADING DESK
-- sweetens subprime payouts +10%/level (20270895); the CLEARING
-- HOUSE is TIERS ONLY for now (user ruling):
--   • BRANCH NETWORK   (bank_branch_tier, floor 1)
--   • VAULT            (bank_vault_tier, floor 1)
--   • UNDERWRITING DESK (bank_underwriting_tier, floor 1)
--   • TRADING DESK     (bank_trading_tier, floor 0)
--   • CLEARING HOUSE   (bank_clearing_tier, floor 0)
--
-- No banks exist in prod yet (founding lands in this same merge),
-- so the column defaults ARE the founding floors — no backfill.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS bank_branch_tier       int NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS bank_vault_tier        int NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS bank_underwriting_tier int NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS bank_trading_tier      int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bank_clearing_tier     int NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.bank_logistical_overhaul(
    p_corp_id uuid,
    p_asset   text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_tier     int;
    v_cost     bigint;
    v_tax_city uuid;
    v_tick     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_asset NOT IN
       ('branch_network', 'vault', 'underwriting', 'trading_desk', 'clearing_house') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;
    v_fac := _corp_owner_faction(v_corp.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    v_tier := COALESCE(CASE p_asset
        WHEN 'branch_network' THEN v_corp.bank_branch_tier
        WHEN 'vault'          THEN v_corp.bank_vault_tier
        WHEN 'underwriting'   THEN v_corp.bank_underwriting_tier
        WHEN 'trading_desk'   THEN v_corp.bank_trading_tier
        WHEN 'clearing_house' THEN v_corp.bank_clearing_tier
    END, 0);
    IF v_tier >= 5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'max_tier');
    END IF;

    -- The shared price ladder — yard_upgrade_cost is the one source
    -- across all three industries' overhauls.
    v_cost := yard_upgrade_cost(v_tier + 1);
    IF v_cost IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'max_tier');
    END IF;

    -- Bring the deposit ledger current (20270897) — the treasury
    -- gate below must see interest paid and flows landed.
    PERFORM _bank_settle_deposits(p_corp_id);
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;

    -- City tax package (20270890): an active package in the HQ city
    -- discounts the spend 10%; consumed only when the action lands.
    v_tax_city := _tax_package_city(v_corp.hq_nation_id, v_corp.hq_city);
    IF v_tax_city IS NOT NULL THEN
        v_cost := ROUND(v_cost * 0.90);
    END IF;

    IF FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    UPDATE entrepreneur_corps SET
        treasury_cash          = COALESCE(treasury_cash, 0) - v_cost,
        exec_action_tick       = v_tick,
        bank_branch_tier       = CASE WHEN p_asset = 'branch_network' THEN v_tier + 1 ELSE bank_branch_tier END,
        bank_vault_tier        = CASE WHEN p_asset = 'vault'          THEN v_tier + 1 ELSE bank_vault_tier END,
        bank_underwriting_tier = CASE WHEN p_asset = 'underwriting'   THEN v_tier + 1 ELSE bank_underwriting_tier END,
        bank_trading_tier      = CASE WHEN p_asset = 'trading_desk'   THEN v_tier + 1 ELSE bank_trading_tier END,
        bank_clearing_tier     = CASE WHEN p_asset = 'clearing_house' THEN v_tier + 1 ELSE bank_clearing_tier END
     WHERE id = p_corp_id;

    IF v_tax_city IS NOT NULL THEN
        PERFORM _consume_tax_package_charge(v_tax_city);
    END IF;

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Logistical Overhaul — upgraded the %s asset to Level %s ($%s).',
               replace(p_asset, '_', ' '), v_tier + 1, v_cost));

    RETURN jsonb_build_object('success', true,
        'asset', p_asset, 'tier', v_tier + 1, 'cost', v_cost,
        'tax_package_applied', v_tax_city IS NOT NULL);
END $$;

REVOKE EXECUTE ON FUNCTION public.bank_logistical_overhaul(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bank_logistical_overhaul(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
