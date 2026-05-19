-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR STOCK SYSTEM — corp_trade: fixed-supply float
-- ════════════════════════════════════════════════════════════════════
-- Supersedes 20270146. Pairs with go_public 20270156 (fixed 100-share
-- supply). corp_trade NO LONGER mints/burns shares_outstanding — supply
-- is constant (set at IPO). Shares move between the float and holders:
--
--   available = shares_outstanding − Σ(corp_shareholdings.shares)
--   BUY  N: requires N ≤ available; available shrinks by N
--   SELL N: requires N ≤ your holding; available grows by N
--
-- The bonding curve is UNCHANGED — same ±5% per share, same treasury
-- settlement, same ceil(buy)/floor(sell) treasury-favouring rounding,
-- same solvency guard, same lock order, same verbatim faction guard.
-- Money flow is byte-identical to 20270146, so the conservation /
-- audit guarantees are fully preserved. The ONLY changes:
--   • new read-only available = shares_outstanding − Σheld
--     (corp row is locked first → the sum is stable for the trade)
--   • BUY gains an `insufficient_float` gate (N ≤ available)
--   • the two `shares_outstanding = shares_outstanding ± p_quantity`
--     lines are removed (supply is fixed; selling returns to the float
--     implicitly because available is recomputed from Σheld each call)
--   • returns now report the constant shares_outstanding + `available`
--
-- Same signature → body-only CREATE OR REPLACE, no schema reload needed
-- for routing (GRANT re-stated for idempotency; NOTIFY kept harmless).
-- Idempotent. No schema/table changes.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION corp_trade(
    p_corp_id uuid, p_side text, p_quantity int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_r         numeric := 1.05;
    v_corp      entrepreneur_corps%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_factor    numeric;   -- F = rᴺ
    v_unit      numeric;   -- U = (F − 1)/(r − 1)
    v_amount    numeric;   -- exact cost (buy) or proceeds (sell)
    v_pay_n     numeric;   -- whole-dollar, treasury-favouring
    v_pay       bigint;
    v_new_price numeric;
    v_have      int;       -- seller's current holding
    v_owned     int;       -- holder's shares after the trade
    v_held      int;       -- Σ all holdings (for the fixed float)
    v_available int;       -- shares_outstanding − v_held
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

    -- Lock the corp row first (consistent global order). This serialises
    -- ALL trades on this corp, so the price/shares read below is fresh.
    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.listing <> 'public' OR v_corp.share_price IS NULL
       OR v_corp.shares_outstanding IS NULL OR v_corp.treasury_cash IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_public');
    END IF;

    -- Then the caller's entrepreneur faction. This guard prelude is
    -- VERBATIM the one in found_entrepreneur_corp (20270144) — keep the
    -- two in sync if the resolution rule changes. The codebase
    -- deliberately inlines this per-RPC (20270142: "Mirrors create_unit
    -- / allocate_defense_funds"); a shared SQL helper would be its own
    -- cross-cutting pass, not part of this feature.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- Fixed-supply float. shares_outstanding is constant (set at IPO by
    -- go_public); the corp row is locked above so this sum is stable.
    SELECT COALESCE(SUM(shares), 0) INTO v_held
      FROM corp_shareholdings WHERE corp_id = p_corp_id;
    v_available := v_corp.shares_outstanding - v_held;

    v_factor := power(v_r, p_quantity::numeric);   -- exact (integer exponent)
    v_unit   := (v_factor - 1) / (v_r - 1);

    IF p_side = 'buy' THEN
        IF p_quantity > v_available THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_float',
                'available', GREATEST(v_available, 0));
        END IF;

        v_amount    := v_corp.share_price * v_unit;
        v_pay_n     := ceil(v_amount);                 -- buyer pays ≥ exact
        v_new_price := v_corp.share_price * v_factor;   -- P · F

        IF COALESCE(v_fac.party_funds, 0) < v_pay_n THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
                'have', COALESCE(v_fac.party_funds, 0), 'need', v_pay_n);
        END IF;
        v_pay := v_pay_n::bigint;   -- safe: ≤ party_funds, which is bigint

        UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_pay
         WHERE id = v_fac.id;
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

    v_amount    := v_corp.share_price * v_unit / v_factor;   -- P · U / F
    v_pay_n     := floor(v_amount);                          -- seller gets ≤ exact
    v_new_price := v_corp.share_price / v_factor;             -- P / F

    -- Defensive: the model guarantees treasury ≥ proceeds, but it is
    -- money. Never let the treasury go negative.
    IF v_corp.treasury_cash < v_pay_n THEN
        RETURN jsonb_build_object('success', false, 'reason', 'treasury_insufficient');
    END IF;
    v_pay := v_pay_n::bigint;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_pay
     WHERE id = v_fac.id;
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

-- ── ROLLBACK ──
-- Re-apply 20270146 (re-enables shares_outstanding mint/burn and drops
-- the float cap). Only safe alongside reverting go_public to a minting
-- model; with the 100-share go_public (20270156) the old corp_trade
-- would mint past 100 again.
