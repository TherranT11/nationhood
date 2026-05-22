-- ════════════════════════════════════════════════════════════════════
-- CORP DIRECTOR INVESTMENT — Offer Investment + Sell Equity (private only)
-- ════════════════════════════════════════════════════════════════════
-- A board Director of a PRIVATELY held entrepreneur corp can offer to
-- invest $X for Y% equity. The offer's valuation auto-computes as the
-- post-money figure X ÷ (Y/100). The CEO (owner) accepts/rejects it from
-- their Pressing Issues. On accept:
--   • $X is debited from the Director's Cash on Hand (factions.party_funds)
--     and added to the corp treasury_cash (capital in),
--   • new shares are minted so the Director ends at Y%, diluting the
--     founder + any existing holders proportionally.
-- Directors can later [Sell Equity]: the corp buys their shares back from
-- treasury at (their shares ÷ total) × the corp's DYNAMIC book value
-- (cash + property − debt), burning the shares (founder un-dilutes). The
-- sale is blocked if treasury can't cover it.
--
-- PRIVATE corps have no share model in v1 (shares_outstanding NULL). The
-- first accepted investment BOOTSTRAPS one: a 1000-share base = 100% to
-- the founder, then dilutes from there. corp_shareholdings stays the one
-- source of ownership.
--
-- No equity cap — the CEO's accept/reject is the only gate (per spec).
--
-- ── ONE-SOURCE-OF-TRUTH NOTE ─────────────────────────────────────
-- entrepreneur_corp_book_value() below mirrors the JS computeCorpRecommended
-- in entrepreneur-corp.html (treasury_cash + Σ corp_buildings.cost_paid −
-- Σ outstanding corp_loans). The buyback price MUST be computed server-side
-- (clients can't be trusted with payout math), and that JS valuation can't
-- run in SQL — so this is a deliberate second implementation. If the book
-- value formula changes, update BOTH. (Accepted trade-off; flagged.)
--
-- Idempotent. Additive table/columns; CREATE OR REPLACE on functions.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Server-side book value (mirror of JS computeCorpRecommended) ──
CREATE OR REPLACE FUNCTION public.entrepreneur_corp_book_value(p_corp_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT GREATEST(0, ROUND(
          COALESCE((SELECT treasury_cash FROM entrepreneur_corps WHERE id = p_corp_id), 0)
        + COALESCE((SELECT SUM(cost_paid) FROM corp_buildings WHERE owner_corp_id = p_corp_id), 0)
        - COALESCE((SELECT SUM(GREATEST(0, principal - COALESCE(total_paid, 0)))
                      FROM corp_loans
                     WHERE borrower_corp_id = p_corp_id
                       AND status IN ('approved', 'active')), 0)
    ));
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_corp_book_value(uuid) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_corp_book_value(uuid) IS
    'Dynamic book value of an entrepreneur corp: treasury_cash + Σ corp_buildings.cost_paid − Σ outstanding corp_loans (>= 0). SQL mirror of JS computeCorpRecommended (entrepreneur-corp.html); keep both in sync. Drives the Sell Equity buyback price.';

-- ── Pending investment offers ────────────────────────────────────
CREATE TABLE IF NOT EXISTS corp_investment_offers (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id             uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    director_faction_id uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    amount              numeric NOT NULL CHECK (amount > 0),
    equity_pct          numeric NOT NULL CHECK (equity_pct > 0 AND equity_pct < 100),
    valuation           numeric NOT NULL,
    status              text NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_tick        int NOT NULL,
    resolved_tick       int,
    created_at          timestamptz NOT NULL DEFAULT now()
);

-- One open offer per (corp, director) at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_corp_investment_offers_one_pending
    ON corp_investment_offers (corp_id, director_faction_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_corp_investment_offers_corp_status
    ON corp_investment_offers (corp_id, status);

COMMENT ON TABLE corp_investment_offers IS
    'Director→CEO equity investment proposals on private entrepreneur corps. Written only by SECURITY DEFINER RPCs (offer_corp_investment / respond_corp_investment_offer). Read-all so the CEO sees them in Pressing Issues.';

ALTER TABLE corp_investment_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON corp_investment_offers;
CREATE POLICY "Allow select for all" ON corp_investment_offers
    FOR SELECT USING (true);
-- No write policy: RPC-only (mirrors corp_shareholdings).

-- ════════════════════════════════════════════════════════════════
-- RPC 1: offer_corp_investment — Director proposes $X for Y%
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.offer_corp_investment(
    p_corp_id    uuid,
    p_amount     numeric,
    p_equity_pct numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_corp  entrepreneur_corps%ROWTYPE;
    v_fac   factions%ROWTYPE;
    v_tick  int;
    v_val   numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
    END IF;
    IF p_equity_pct IS NULL OR p_equity_pct <= 0 OR p_equity_pct >= 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_equity');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF COALESCE(v_corp.listing, 'private') <> 'private' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_private');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- Must hold a board seat (corp_board_seats excludes the owner/CEO).
    IF NOT EXISTS (SELECT 1 FROM corp_board_seats
                    WHERE corp_id = p_corp_id AND member_faction_id = v_fac.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_director');
    END IF;

    v_val := ROUND(p_amount * 100.0 / p_equity_pct);   -- post-money valuation
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- One pending offer per director: replace terms if one already exists.
    UPDATE corp_investment_offers
       SET amount = p_amount, equity_pct = p_equity_pct, valuation = v_val,
           created_tick = v_tick
     WHERE corp_id = p_corp_id AND director_faction_id = v_fac.id AND status = 'pending';
    IF NOT FOUND THEN
        INSERT INTO corp_investment_offers
            (corp_id, director_faction_id, amount, equity_pct, valuation, status, created_tick)
        VALUES (p_corp_id, v_fac.id, p_amount, p_equity_pct, v_val, 'pending', v_tick);
    END IF;

    RETURN jsonb_build_object('success', true, 'valuation', v_val,
                              'amount', p_amount, 'equity_pct', p_equity_pct);
END;
$$;

GRANT EXECUTE ON FUNCTION public.offer_corp_investment(uuid, numeric, numeric) TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- RPC 2: respond_corp_investment_offer — CEO accepts/rejects
-- ════════════════════════════════════════════════════════════════
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
    BASE_SHARES constant int := 1000;
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

    -- Bootstrap a share model on the first investment (private corps have none).
    IF v_corp.shares_outstanding IS NULL THEN
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (v_corp.id, v_corp.owner_faction_id, BASE_SHARES)
        ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = BASE_SHARES;
        v_s0 := BASE_SHARES;
    ELSE
        v_s0 := v_corp.shares_outstanding;
    END IF;

    -- Shares to mint so the director ends at equity_pct of the new total.
    v_n := GREATEST(1, ROUND(v_s0 * v_offer.equity_pct / (100 - v_offer.equity_pct)));

    -- Capital in: debit director Cash on Hand, credit corp treasury.
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_offer.amount
     WHERE id = v_offer.director_faction_id;
    UPDATE entrepreneur_corps
       SET treasury_cash      = COALESCE(treasury_cash, 0) + v_offer.amount,
           shares_outstanding = v_s0 + v_n,
           updated_at         = now()
     WHERE id = v_corp.id;

    -- Mint the director's shares.
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
            'equity_pct', v_offer.equity_pct, 'shares_minted', v_n,
            'shares_outstanding', v_s0 + v_n),
        v_tick
    );

    RETURN jsonb_build_object('success', true, 'accepted', true,
        'shares_minted', v_n, 'shares_outstanding', v_s0 + v_n);
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_corp_investment_offer(uuid, boolean) TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- RPC 3: sell_corp_equity — Director sells shares back to the corp
-- ════════════════════════════════════════════════════════════════
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

    -- Buy back: corp pays from treasury, shares are burned, director paid out.
    UPDATE entrepreneur_corps
       SET treasury_cash      = COALESCE(treasury_cash, 0) - v_price,
           shares_outstanding = shares_outstanding - p_shares,
           updated_at         = now()
     WHERE id = p_corp_id;

    UPDATE corp_shareholdings SET shares = shares - p_shares
     WHERE corp_id = p_corp_id AND holder_faction_id = v_fac.id;
    DELETE FROM corp_shareholdings
     WHERE corp_id = p_corp_id AND holder_faction_id = v_fac.id AND shares <= 0;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_price
     WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true, 'shares_sold', p_shares,
        'proceeds', v_price, 'book_value', v_book::bigint);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sell_corp_equity(uuid, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.sell_corp_equity(uuid, int);
-- DROP FUNCTION IF EXISTS public.respond_corp_investment_offer(uuid, boolean);
-- DROP FUNCTION IF EXISTS public.offer_corp_investment(uuid, numeric, numeric);
-- DROP TABLE IF EXISTS corp_investment_offers;
-- DROP FUNCTION IF EXISTS public.entrepreneur_corp_book_value(uuid);
-- COMMIT;
