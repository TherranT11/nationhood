-- ============================================================================
-- Private equity: fixed 100-share cap (transfer model), replacing the old
-- 1000-share dilution-mint. A private corp's equity is 100 shares, period:
--   • founder bootstraps to 100 = 100% on the first investment;
--   • an accepted investment TRANSFERS equity_pct shares founder -> investor
--     (founder 75 / investor 25 for a 25% deal; total always 100). Cash still
--     funds the corp treasury (a capital raise, founder's stake is the source).
--   • sell-back returns the director's shares to the founder (cap stays 100),
--     corp pays the director from treasury at the book-value proportion.
-- Bodies copied from 20270212; only the share math changed.
-- ============================================================================

BEGIN;

-- ── Rebase existing private corps from the old 1000-base to the 100 cap ──
DO $$
DECLARE c RECORD; v_sum int;
BEGIN
  FOR c IN SELECT id, owner_faction_id, shares_outstanding FROM entrepreneur_corps
            WHERE listing = 'private' AND COALESCE(shares_outstanding, 0) > 0
  LOOP
    UPDATE corp_shareholdings
       SET shares = GREATEST(1, ROUND(shares * 100.0 / c.shares_outstanding))
     WHERE corp_id = c.id AND holder_faction_id <> c.owner_faction_id;
    SELECT COALESCE(SUM(shares), 0) INTO v_sum FROM corp_shareholdings
      WHERE corp_id = c.id AND holder_faction_id <> c.owner_faction_id;
    -- Founder absorbs the rounding remainder so the cap is exactly 100.
    INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
    VALUES (c.id, c.owner_faction_id, GREATEST(0, 100 - v_sum))
    ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = GREATEST(0, 100 - v_sum);
    UPDATE entrepreneur_corps SET shares_outstanding = 100 WHERE id = c.id;
  END LOOP;
END $$;

-- ── RPC: respond_corp_investment_offer (transfer, not mint) ──
CREATE OR REPLACE FUNCTION public.respond_corp_investment_offer(
    p_offer_id uuid,
    p_accept   boolean
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_offer     corp_investment_offers%ROWTYPE;
    v_corp      entrepreneur_corps%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_tick      int;
    v_dir_funds numeric;
    v_s0        int;
    v_n         int;
    BASE_SHARES constant int := 100;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_offer FROM corp_investment_offers WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_pending');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_offer.corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    -- Caller must be the corp owner (CEO).
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ceo');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF NOT p_accept THEN
        UPDATE corp_investment_offers
           SET status = 'rejected', resolved_tick = v_tick
         WHERE id = p_offer_id;
        RETURN jsonb_build_object('success', true, 'accepted', false);
    END IF;

    -- Accepting: corp must still be private.
    IF COALESCE(v_corp.listing, 'private') <> 'private' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_private');
    END IF;

    -- Director must still have the cash to invest.
    SELECT party_funds INTO v_dir_funds FROM factions
     WHERE id = v_offer.director_faction_id FOR UPDATE;
    IF COALESCE(v_dir_funds, 0) < v_offer.amount THEN
        RETURN jsonb_build_object('success', false, 'reason', 'director_insufficient_funds',
            'have', COALESCE(v_dir_funds, 0)::bigint, 'need', v_offer.amount::bigint);
    END IF;

    -- Fixed 100-share cap: on the first investment, bootstrap the founder to
    -- 100 = 100%. The cap never changes after that (no minting).
    IF v_corp.shares_outstanding IS NULL THEN
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (v_corp.id, v_corp.owner_faction_id, BASE_SHARES)
        ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = BASE_SHARES;
        UPDATE entrepreneur_corps SET shares_outstanding = BASE_SHARES WHERE id = v_corp.id;
    END IF;

    -- The investor receives equity_pct shares (= equity_pct% of the 100 cap),
    -- TRANSFERRED from the founder. The founder gives up the slice; the cash
    -- funds the corp treasury. The cap stays at 100 (no dilution mint).
    v_n := GREATEST(1, ROUND(v_offer.equity_pct));
    SELECT shares INTO v_s0 FROM corp_shareholdings
     WHERE corp_id = v_corp.id AND holder_faction_id = v_corp.owner_faction_id FOR UPDATE;
    IF COALESCE(v_s0, 0) < v_n THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_founder_equity',
            'founder_shares', COALESCE(v_s0, 0), 'need', v_n);
    END IF;

    -- Capital in: debit director Cash on Hand, credit corp treasury.
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_offer.amount
     WHERE id = v_offer.director_faction_id;
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + v_offer.amount,
           updated_at    = now()
     WHERE id = v_corp.id;

    -- Transfer the slice founder -> investor (cap unchanged).
    UPDATE corp_shareholdings SET shares = shares - v_n
     WHERE corp_id = v_corp.id AND holder_faction_id = v_corp.owner_faction_id;
    INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
    VALUES (v_corp.id, v_offer.director_faction_id, v_n)
    ON CONFLICT (corp_id, holder_faction_id)
        DO UPDATE SET shares = corp_shareholdings.shares + v_n;

    UPDATE corp_investment_offers
       SET status = 'accepted', resolved_tick = v_tick
     WHERE id = p_offer_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_offer.director_faction_id,
        'Corporate Investment',
        format('A director invested $%s into %s for %s%% equity.',
               to_char(v_offer.amount, 'FM999,999,999,999'), v_corp.name, v_offer.equity_pct),
        'business', 'corp_investment',
        jsonb_build_object('corp_id', v_corp.id, 'amount', v_offer.amount,
            'equity_pct', v_offer.equity_pct, 'shares_transferred', v_n,
            'shares_outstanding', BASE_SHARES),
        v_tick
    );

    RETURN jsonb_build_object('success', true, 'accepted', true,
        'shares_transferred', v_n, 'shares_outstanding', BASE_SHARES);
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_corp_investment_offer(uuid, boolean) TO authenticated;

-- ── RPC: sell_corp_equity (return shares to founder, cap unchanged) ──
CREATE OR REPLACE FUNCTION public.sell_corp_equity(
    p_corp_id uuid,
    p_shares  int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_corp   entrepreneur_corps%ROWTYPE;
    v_fac    factions%ROWTYPE;
    v_held   int;
    v_book   numeric;
    v_price  bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_shares IS NULL OR p_shares < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    -- The founder withdraws via treasury / dividends, not equity sell-back.
    IF v_fac.id = v_corp.owner_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'is_owner');
    END IF;

    SELECT shares INTO v_held FROM corp_shareholdings
     WHERE corp_id = p_corp_id AND holder_faction_id = v_fac.id FOR UPDATE;
    IF COALESCE(v_held, 0) < p_shares THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_shares',
            'held', COALESCE(v_held, 0));
    END IF;
    IF COALESCE(v_corp.shares_outstanding, 0) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shares');
    END IF;

    v_book  := entrepreneur_corp_book_value(p_corp_id);
    v_price := ROUND(v_book * p_shares::numeric / v_corp.shares_outstanding::numeric)::bigint;

    IF COALESCE(v_corp.treasury_cash, 0) < v_price THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'have', COALESCE(v_corp.treasury_cash, 0)::bigint, 'need', v_price);
    END IF;

    -- Sell-back on the fixed cap: the corp pays the director from treasury at
    -- the book-value proportion; the shares return to the FOUNDER (the cap
    -- stays at 100, the founder un-dilutes) rather than being burned.
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_price,
           updated_at    = now()
     WHERE id = p_corp_id;

    UPDATE corp_shareholdings SET shares = shares - p_shares
     WHERE corp_id = p_corp_id AND holder_faction_id = v_fac.id;
    DELETE FROM corp_shareholdings
     WHERE corp_id = p_corp_id AND holder_faction_id = v_fac.id AND shares <= 0;

    INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
    VALUES (p_corp_id, v_corp.owner_faction_id, p_shares)
    ON CONFLICT (corp_id, holder_faction_id)
        DO UPDATE SET shares = corp_shareholdings.shares + p_shares;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_price
     WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true, 'shares_sold', p_shares,
        'proceeds', v_price, 'book_value', v_book::bigint);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sell_corp_equity(uuid, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
