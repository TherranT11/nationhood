-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR STOCK SYSTEM — Phase 3: corp_trade (buy)
-- ════════════════════════════════════════════════════════════════════
-- Atomic share trade against the corp treasury — the corp is the
-- market maker (no order book). Phase 3 implements the BUY side; the
-- p_side='sell' branch is wired but disabled until Phase 4. Defining
-- the final signature now means Phase 4 only swaps the body — no
-- signature change, no PostgREST reload, no client change.
--
-- Bonding curve, +5% per share. Buying N from price P (r = 1.05):
--   cost   = P · (rᴺ − 1)/(r − 1)        (closed form, no loop)
--   price →  P · rᴺ
-- Cost is ceil'd to whole dollars because factions.party_funds is
-- bigint; the buyer pays exactly what the treasury receives, so cash
-- is conserved. share_price stays exact numeric (authoritative — the
-- UI rounds for display only).
--
-- One source of truth: entrepreneur_corps.share_price /
-- shares_outstanding / treasury_cash and corp_shareholdings.shares are
-- mutated ONLY here. RLS already blocks client writes (Phase 1 /
-- 20270144: column REVOKE + corp_shareholdings has no write policy);
-- this SECURITY DEFINER function runs as owner and is the sole writer.
--
-- Funds are compared in numeric BEFORE the bigint cast so a
-- pathological huge quantity returns insufficient_funds instead of a
-- numeric-overflow error. Locking order (deadlock-safe, keep
-- consistent): corp row first, then the buyer's faction row.
--
-- Idempotent (CREATE OR REPLACE). No schema/table changes — 20270144
-- already added the columns, corp_shareholdings, RLS and the REVOKE.
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
    v_factor    numeric;
    v_cost      numeric;
    v_pay_n     numeric;
    v_pay       bigint;
    v_new_price numeric;
    v_owned     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_side NOT IN ('buy','sell') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_side');
    END IF;
    IF p_side = 'sell' THEN
        -- Phase 4 fills this branch (same signature → no migration churn).
        RETURN jsonb_build_object('success', false, 'reason', 'sell_not_enabled');
    END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 1000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    -- Lock the corp row first (consistent global order).
    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.listing <> 'public' OR v_corp.share_price IS NULL
       OR v_corp.shares_outstanding IS NULL OR v_corp.treasury_cash IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_public');
    END IF;

    -- Then the caller's entrepreneur faction (same resolution as
    -- found_entrepreneur_corp).
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    v_factor    := power(v_r, p_quantity::numeric);                       -- rᴺ
    v_cost      := v_corp.share_price * (v_factor - 1) / (v_r - 1);
    v_pay_n     := ceil(v_cost);                                          -- whole dollars
    v_new_price := v_corp.share_price * v_factor;

    IF COALESCE(v_fac.party_funds, 0) < v_pay_n THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_pay_n);
    END IF;
    v_pay := v_pay_n::bigint;   -- safe: ≤ party_funds, which is bigint

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_pay
     WHERE id = v_fac.id;

    UPDATE entrepreneur_corps
       SET treasury_cash      = treasury_cash + v_pay,
           shares_outstanding = shares_outstanding + p_quantity,
           share_price        = v_new_price
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
        'shares_outstanding', v_corp.shares_outstanding + p_quantity,
        'new_funds', COALESCE(v_fac.party_funds, 0) - v_pay);
END;
$$;

GRANT EXECUTE ON FUNCTION corp_trade(uuid, text, int) TO authenticated;

COMMIT;

-- New RPC → PostgREST must pick it up. Same convention as 20270143/144.
NOTIFY pgrst, 'reload schema';
