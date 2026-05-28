-- ════════════════════════════════════════════════════════════════════
-- Hotfix: re-install corp_trade with the 1%-per-share flat-fill body.
--
-- The live database is observably running an earlier bonding-curve body
-- (v_r = 1.05, exponential): a buy of 1 share moves the price +5.00%,
-- and a sell of 6 shares moves it −25.38%, which is 1.05^(-6) to four
-- decimals — the exact pre-linear-curve formula. The UI text correctly
-- claims "the price then moves 1% per share" (per 20270199), but the
-- function backing the RPC doesn't match.
--
-- 20270178 (linear) and 20270199 (flat-fill, latest) both already set
-- v_pct = 0.01, so the codebase is correct — the live DB just never
-- applied them. This migration ensures the latest body lands the next
-- time pending migrations sync, regardless of which corp_trade version
-- the live DB was last sitting on. CREATE OR REPLACE is idempotent: if
-- 20270199 was applied after all, this is a byte-for-byte no-op.
--
-- ONE SOURCE OF TRUTH note: the function body below is intentionally a
-- duplicate of 20270199_corp_trade_flat_fill.sql. 20270199 remains the
-- canonical definition (its header documents the design choice); this
-- migration exists solely as a guard rail against the observed drift.
-- If 20270199's body changes in the future, this re-install must move
-- with it. Flagged for cleanup once we confirm migration sync is healthy.
--
-- Adjacent SOT violation worth flagging (NOT fixed here): the
-- liquidation_value() in 20270325 still hardcodes the old 1.05 bonding
-- curve. Under the linear 1%-per-share rule that formula no longer
-- inverts the sell side. Separate migration when the time comes; out of
-- scope for the immediate price-movement bug the user reported.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION corp_trade(
    p_corp_id uuid, p_side text, p_quantity int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pct       numeric := 0.01;   -- 1% per share
    v_corp      entrepreneur_corps%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_amount    numeric;   -- exact cost (buy) or proceeds (sell)
    v_pay_n     numeric;   -- whole-dollar, treasury-favouring
    v_pay       bigint;
    v_new_price numeric;
    v_have      int;       -- seller's current holding
    v_owned     int;       -- holder's shares after the trade
    v_held      int;       -- Σ all holdings (for the fixed float)
    v_available int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_side NOT IN ('buy','sell') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_side');
    END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 1000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.listing <> 'public' OR v_corp.share_price IS NULL
       OR v_corp.shares_outstanding IS NULL OR v_corp.treasury_cash IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_public');
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

    SELECT COALESCE(SUM(shares), 0) INTO v_held
      FROM corp_shareholdings WHERE corp_id = p_corp_id;
    v_available := v_corp.shares_outstanding - v_held;

    IF p_side = 'buy' THEN
        IF p_quantity > v_available THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_float',
                'available', GREATEST(v_available, 0));
        END IF;

        -- Flat fill: all N shares at the current price. The 1%-per-share
        -- move is applied to new_price below, not walked into the cost.
        v_amount    := v_corp.share_price * p_quantity;
        v_pay_n     := ceil(v_amount);                  -- buyer pays ≥ exact
        v_new_price := v_corp.share_price * (1 + v_pct * p_quantity);

        IF COALESCE(v_fac.party_funds, 0) < v_pay_n THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
                'have', COALESCE(v_fac.party_funds, 0), 'need', v_pay_n);
        END IF;
        v_pay := v_pay_n::bigint;

        UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_pay
         WHERE id = v_fac.id;

        PERFORM set_config('nh.price_change_source',   'trade_buy',           true);
        PERFORM set_config('nh.price_change_actor',    v_fac.id::text,        true);
        PERFORM set_config('nh.price_change_quantity', p_quantity::text,      true);

        UPDATE entrepreneur_corps
           SET treasury_cash = treasury_cash + v_pay,
               share_price    = v_new_price
         WHERE id = p_corp_id;
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (p_corp_id, v_fac.id, p_quantity)
        ON CONFLICT (corp_id, holder_faction_id)
        DO UPDATE SET shares = corp_shareholdings.shares + EXCLUDED.shares
        RETURNING shares INTO v_owned;

        RETURN jsonb_build_object('success', true,
            'corp_id', p_corp_id, 'side', 'buy', 'quantity', p_quantity,
            'spent', v_pay, 'new_price', v_new_price,
            'shares_owned', v_owned,
            'shares_outstanding', v_corp.shares_outstanding,
            'available', v_available - p_quantity,
            'new_funds', COALESCE(v_fac.party_funds, 0) - v_pay);
    END IF;

    -- ── SELL ────────────────────────────────────────────────────────
    SELECT shares INTO v_have FROM corp_shareholdings
     WHERE corp_id = p_corp_id AND holder_faction_id = v_fac.id
     FOR UPDATE;
    IF v_have IS NULL OR v_have < p_quantity THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_shares',
            'have', COALESCE(v_have, 0), 'need', p_quantity);
    END IF;

    v_new_price := v_corp.share_price * (1 - v_pct * p_quantity);
    -- Linear curve has a hard floor at p_quantity = 1/pct (= 100 at
    -- 1%). Anything ≥ that would drive the price to zero or negative.
    IF v_new_price <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'price_floor',
            'max_per_trade', floor(1 / v_pct)::int - 1);
    END IF;

    -- Flat fill: all N shares sold at the current price; the 1%-per-share
    -- drop is applied to new_price above, not walked into the proceeds.
    v_amount := v_corp.share_price * p_quantity;
    v_pay_n  := floor(v_amount);                       -- seller gets ≤ exact

    IF v_corp.treasury_cash < v_pay_n THEN
        RETURN jsonb_build_object('success', false, 'reason', 'treasury_insufficient');
    END IF;
    v_pay := v_pay_n::bigint;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_pay
     WHERE id = v_fac.id;

    PERFORM set_config('nh.price_change_source',   'trade_sell',          true);
    PERFORM set_config('nh.price_change_actor',    v_fac.id::text,        true);
    PERFORM set_config('nh.price_change_quantity', p_quantity::text,      true);

    UPDATE entrepreneur_corps
       SET treasury_cash = treasury_cash - v_pay,
           share_price    = v_new_price
     WHERE id = p_corp_id;
    UPDATE corp_shareholdings
       SET shares = shares - p_quantity
     WHERE corp_id = p_corp_id AND holder_faction_id = v_fac.id
    RETURNING shares INTO v_owned;

    RETURN jsonb_build_object('success', true,
        'corp_id', p_corp_id, 'side', 'sell', 'quantity', p_quantity,
        'proceeds', v_pay, 'new_price', v_new_price,
        'shares_owned', v_owned,
        'shares_outstanding', v_corp.shares_outstanding,
        'available', v_available + p_quantity,
        'new_funds', COALESCE(v_fac.party_funds, 0) + v_pay);
END;
$$;

GRANT EXECUTE ON FUNCTION corp_trade(uuid, text, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
