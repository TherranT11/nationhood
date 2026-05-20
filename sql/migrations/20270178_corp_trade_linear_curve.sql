-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR STOCK SYSTEM — corp_trade: linear ±1%-per-share curve
-- ════════════════════════════════════════════════════════════════════
-- Supersedes the exponential bonding curve in 20270157 / 20270164.
-- New rule (player-facing): one share traded moves the price by 1
-- percentage point; eight shares move it by eight. No compounding.
--
--   BUY  N : new_price = P · (1 + 0.01·N)
--             cost     = P · N · (1 + 0.01·(N−1)/2)
--                      = the arithmetic-mean of share #1's price
--                        (P) and share #N's price (P·(1+0.01·(N−1)))
--                        times N — the discrete linear ladder.
--   SELL N : new_price = P · (1 − 0.01·N)
--             proceeds = P · N · (1 − 0.01·(N−1)/2)
--
-- Treasury-favouring rounding (ceil on buy / floor on sell), the
-- fixed-supply float (shares_outstanding − Σheld), the lock order
-- (corp row → caller faction), and the source-attribution session
-- vars consumed by _trg_record_share_price_change (20270164) are all
-- byte-identical to the prior body. Only the pricing math changes.
--
-- New guard: SELL N is rejected with reason='price_floor' if it would
-- drive new_price ≤ 0 (i.e. N ≥ 100 on the linear curve). With a
-- 100-share float (set by go_public, 20270156) this only triggers if
-- a sole holder tries to dump every share in one trade — a tighter
-- ceiling than the lossless exponential, but the linear curve has
-- nowhere for the price to live below zero.
--
-- Same signature → body-only CREATE OR REPLACE; no schema reload
-- needed for routing (GRANT re-stated for idempotency).
-- Idempotent. No schema/table changes.
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

        -- Linear ladder: share #k costs P·(1 + pct·(k−1)).
        -- Sum k=1..N = P · N · (1 + pct·(N−1)/2). Closed-form, exact.
        v_amount    := v_corp.share_price * p_quantity
                       * (1 + v_pct * (p_quantity - 1) / 2);
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

    -- Sell ladder: share #k goes for P·(1 − pct·(k−1)).
    -- Sum k=1..N = P · N · (1 − pct·(N−1)/2).
    v_amount := v_corp.share_price * p_quantity
                * (1 - v_pct * (p_quantity - 1) / 2);
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

COMMENT ON FUNCTION corp_trade(uuid, text, int) IS
    'Linear ±1%-per-share bonding curve (20270178). One share moves the price by 1pp; N shares move it by N. Cost/proceeds use the arithmetic-mean of the share ladder; rounding favours treasury (ceil buy / floor sell). Fixed-supply float — sells return shares to the float, buys remove them. SELL is rejected (price_floor) if it would drop new_price ≤ 0 (N ≥ 100). Source-attribution session vars consumed by _trg_record_share_price_change.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- -- Re-apply 20270164's corp_trade body to restore the exponential
-- -- ±5% bonding curve (r = 1.05, F = rᴺ, U = (F−1)/(r−1)). Money
-- -- flow + lock order are byte-identical between the two bodies, so
-- -- the swap is reversible at any time.
-- COMMIT;
