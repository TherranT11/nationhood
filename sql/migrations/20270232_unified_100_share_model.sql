-- ════════════════════════════════════════════════════════════════════
-- UNIFIED 100-SHARE MODEL — one denominator for every entrepreneur corp
-- ════════════════════════════════════════════════════════════════════
-- There is no 1000-share model. Every corp's cap table is denominated in
-- 100 shares, period. This replaces the three irreconcilable denominators
-- (NULL private / 1000 director-bootstrap / 100 public) that let go_public
-- corrupt the cap table (held > outstanding) and let the founder pocket a
-- director's capital that was supposedly "raised into the corp".
--
-- The model now:
--   • Private corp, no investors: shares_outstanding stays NULL = the
--     founder implicitly owns 100% (read everywhere as 100/100). The
--     explicit 100-share table materialises LAZILY on first investment or
--     IPO — no founding-flow change, no blanket backfill of plain corps.
--
--   • Director buy-in (respond_corp_investment_offer): a SECONDARY SALE.
--     The director buys equity FROM THE FOUNDER — the founder sells N
--     shares (N = the requested equity_pct, since % of 100 == shares), the
--     cash lands in the FOUNDER's personal Cash on Hand (party_funds), the
--     treasury is untouched, and shares_outstanding stays 100. Equity is
--     therefore quantised to whole percent (1 share = 1%); the offer's
--     fractional pct rounds to the nearest share.
--
--   • Director sell-back (sell_corp_equity): the inverse. The director
--     sells shares back TO THE FOUNDER at the book-value-proportional price;
--     the founder pays from personal cash; shares transfer (not burnt) so
--     the total stays 100. (This also removes the old bug where a founder
--     draining the treasury stranded the director's treasury-funded exit.)
--
--   • go_public: always 100 shares total. A sole-founder corp → founder 20,
--     80 public float (unchanged). A director-invested corp → ALL existing
--     holders scaled proportionally into 20 insider shares (directors keep
--     ≥1, founder absorbs the rounding remainder), 80 float. Never leaves
--     held > outstanding.
--
--   • withdraw_corp_treasury is deliberately UNCHANGED — the founder can
--     always draw the treasury freely, even with directors on the cap
--     table (per design: caveat emptor for investing in a founder-run
--     private corp; equity cash-flows are founder-personal, not treasury).
--
-- entrepreneur_corp_book_value() is unchanged (still treasury + Σ building
-- cost − Σ debt); sell-back still prices off it. CREATE OR REPLACE only.
--
-- A one-time backfill at the end normalises any EXISTING private corp that
-- is still on a non-100 base (legacy 1000-model director investments) down
-- to 100, preserving each holder's proportion. Idempotent — re-running
-- skips corps already at 100.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════
-- respond_corp_investment_offer — CEO accepts: founder SELLS equity
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
    v_uid            uuid := auth.uid();
    v_offer          corp_investment_offers%ROWTYPE;
    v_corp           entrepreneur_corps%ROWTYPE;
    v_fac            factions%ROWTYPE;
    v_tick           int;
    v_dir_funds      numeric;
    v_founder_shares int;
    v_n              int;     -- shares the founder sells to the director
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

    -- Director must still have the cash.
    SELECT party_funds INTO v_dir_funds FROM factions
     WHERE id = v_offer.director_faction_id FOR UPDATE;
    IF COALESCE(v_dir_funds, 0) < v_offer.amount THEN
        RETURN jsonb_build_object('success', false, 'reason', 'director_insufficient_funds',
            'have', COALESCE(v_dir_funds, 0)::bigint, 'need', v_offer.amount::bigint);
    END IF;

    -- Materialise the lazy 100-share cap table (founder = 100) the first
    -- time anyone takes a stake. Plain private corps carry NULL until here.
    IF v_corp.shares_outstanding IS NULL THEN
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (v_corp.id, v_corp.owner_faction_id, 100)
        ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = 100;
        UPDATE entrepreneur_corps SET shares_outstanding = 100 WHERE id = v_corp.id;
        v_corp.shares_outstanding := 100;
    END IF;

    -- Shares to sell = requested equity_pct of the fixed 100-share company
    -- (pct% of 100 == pct shares; quantised to whole percent, min 1).
    v_n := GREATEST(1, ROUND(v_offer.equity_pct))::int;

    -- The founder must hold enough to sell.
    SELECT shares INTO v_founder_shares FROM corp_shareholdings
     WHERE corp_id = v_corp.id AND holder_faction_id = v_corp.owner_faction_id FOR UPDATE;
    IF COALESCE(v_founder_shares, 0) < v_n THEN
        RETURN jsonb_build_object('success', false, 'reason', 'founder_insufficient_shares',
            'have', COALESCE(v_founder_shares, 0), 'need', v_n);
    END IF;

    -- SECONDARY SALE: the director pays the FOUNDER personally; shares move
    -- founder → director. Treasury and shares_outstanding are untouched.
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_offer.amount
     WHERE id = v_offer.director_faction_id;
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_offer.amount
     WHERE id = v_corp.owner_faction_id;

    UPDATE corp_shareholdings SET shares = shares - v_n
     WHERE corp_id = v_corp.id AND holder_faction_id = v_corp.owner_faction_id;
    INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
    VALUES (v_corp.id, v_offer.director_faction_id, v_n)
    ON CONFLICT (corp_id, holder_faction_id)
        DO UPDATE SET shares = corp_shareholdings.shares + v_n;

    UPDATE corp_investment_offers
       SET status = 'accepted', resolved_tick = v_tick
     WHERE id = p_offer_id;
    UPDATE entrepreneur_corps SET updated_at = now() WHERE id = v_corp.id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_offer.director_faction_id,
        'Corporate Investment',
        format('A director acquired %s%% of %s from the founder for $%s.',
               v_n, v_corp.name, to_char(v_offer.amount, 'FM999,999,999,999')),
        'business', 'corp_investment',
        jsonb_build_object('corp_id', v_corp.id, 'amount', v_offer.amount,
            'equity_pct', v_n, 'shares_sold', v_n,
            'founder_shares_remaining', v_founder_shares - v_n),
        v_tick
    );

    RETURN jsonb_build_object('success', true, 'accepted', true,
        'shares_sold', v_n, 'founder_shares_remaining', v_founder_shares - v_n);
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_corp_investment_offer(uuid, boolean) TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- sell_corp_equity — director sells shares back TO THE FOUNDER
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
    v_uid           uuid := auth.uid();
    v_corp          entrepreneur_corps%ROWTYPE;
    v_fac           factions%ROWTYPE;
    v_held          int;
    v_book          numeric;
    v_price         bigint;
    v_founder_funds numeric;
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

    -- The FOUNDER buys the shares back from personal Cash on Hand, keeping
    -- the total at shares_outstanding (no burn, treasury untouched).
    SELECT party_funds INTO v_founder_funds FROM factions
     WHERE id = v_corp.owner_faction_id FOR UPDATE;
    IF COALESCE(v_founder_funds, 0) < v_price THEN
        RETURN jsonb_build_object('success', false, 'reason', 'founder_insufficient_funds',
            'have', COALESCE(v_founder_funds, 0)::bigint, 'need', v_price);
    END IF;

    -- Transfer shares director → founder; founder pays the director.
    UPDATE corp_shareholdings SET shares = shares - p_shares
     WHERE corp_id = p_corp_id AND holder_faction_id = v_fac.id;
    DELETE FROM corp_shareholdings
     WHERE corp_id = p_corp_id AND holder_faction_id = v_fac.id AND shares <= 0;
    INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
    VALUES (p_corp_id, v_corp.owner_faction_id, p_shares)
    ON CONFLICT (corp_id, holder_faction_id)
        DO UPDATE SET shares = corp_shareholdings.shares + p_shares;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_price
     WHERE id = v_corp.owner_faction_id;
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_price
     WHERE id = v_fac.id;

    UPDATE entrepreneur_corps SET updated_at = now() WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'shares_sold', p_shares,
        'proceeds', v_price, 'book_value', v_book::bigint);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sell_corp_equity(uuid, int) TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- go_public — private → public IPO, always 100 shares / 80 float
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.go_public(
    p_corp_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid             UUID := auth.uid();
    v_fac             factions%ROWTYPE;
    v_corp            entrepreneur_corps%ROWTYPE;
    v_price           NUMERIC;
    v_treas           NUMERIC;
    v_dir_insider     int;
    v_founder_insider int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
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

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_corp.listing <> 'private' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_public');
    END IF;

    -- Share price anchored to current cash; 100 shares so valuation = treasury.
    v_treas := COALESCE(v_corp.treasury_cash, v_corp.starting_capital::numeric);
    v_price := v_treas / 100;

    IF v_corp.shares_outstanding IS NULL THEN
        -- Sole-founder private corp: founder 20, 80 public float.
        UPDATE entrepreneur_corps
           SET listing            = 'public',
               shares_outstanding = 100,
               share_price        = v_price,
               updated_at         = now()
         WHERE id = p_corp_id;

        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (p_corp_id, v_fac.id, 20)
        ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = 20;
    ELSE
        -- Director-invested: scale ALL existing holders proportionally into a
        -- 20-share insider pool (directors keep ≥1 — no silent wipe), founder
        -- absorbs the rounding remainder; the other 80 become the float.
        SELECT COALESCE(SUM(GREATEST(1, ROUND(shares * 20.0 / v_corp.shares_outstanding))), 0)::int
          INTO v_dir_insider
          FROM corp_shareholdings
         WHERE corp_id = p_corp_id
           AND holder_faction_id <> v_corp.owner_faction_id
           AND shares > 0;

        UPDATE corp_shareholdings
           SET shares = GREATEST(1, ROUND(shares * 20.0 / v_corp.shares_outstanding))::int
         WHERE corp_id = p_corp_id
           AND holder_faction_id <> v_corp.owner_faction_id
           AND shares > 0;

        v_founder_insider := GREATEST(0, 20 - v_dir_insider);
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (p_corp_id, v_corp.owner_faction_id, v_founder_insider)
        ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = v_founder_insider;

        DELETE FROM corp_shareholdings WHERE corp_id = p_corp_id AND shares <= 0;

        UPDATE entrepreneur_corps
           SET listing            = 'public',
               shares_outstanding = 100,
               share_price        = v_price,
               updated_at         = now()
         WHERE id = p_corp_id;
    END IF;

    RETURN jsonb_build_object(
        'success',            true,
        'corp_id',            p_corp_id,
        'listing',            'public',
        'shares_outstanding', 100,
        'share_price',        v_price,
        'treasury_cash',      v_treas
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.go_public(UUID) TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- One-time backfill: normalise legacy non-100 PRIVATE corps to 100.
-- (Director investments taken under the old 1000-share bootstrap.)
-- Preserves each holder's proportion; founder absorbs the remainder.
-- Idempotent — corps already at exactly 100 are skipped.
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
    r           RECORD;
    v_dir_total int;
    v_founder   int;
BEGIN
    FOR r IN
        SELECT id, owner_faction_id, shares_outstanding
          FROM entrepreneur_corps
         WHERE COALESCE(listing, 'private') = 'private'
           AND shares_outstanding IS NOT NULL
           AND shares_outstanding <> 100
    LOOP
        SELECT COALESCE(SUM(GREATEST(1, ROUND(shares * 100.0 / r.shares_outstanding))), 0)::int
          INTO v_dir_total
          FROM corp_shareholdings
         WHERE corp_id = r.id
           AND holder_faction_id <> r.owner_faction_id
           AND shares > 0;

        UPDATE corp_shareholdings
           SET shares = GREATEST(1, ROUND(shares * 100.0 / r.shares_outstanding))::int
         WHERE corp_id = r.id
           AND holder_faction_id <> r.owner_faction_id
           AND shares > 0;

        v_founder := GREATEST(0, 100 - v_dir_total);
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (r.id, r.owner_faction_id, v_founder)
        ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = v_founder;

        DELETE FROM corp_shareholdings WHERE corp_id = r.id AND shares <= 0;

        UPDATE entrepreneur_corps
           SET shares_outstanding = 100, updated_at = now()
         WHERE id = r.id;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Restores the previous function bodies from 20270212 (director investment,
-- 1000-share bootstrap + treasury-funded buyback) and 20270226 (go_public
-- 20/80). Re-apply those two migrations to roll back the functions. The
-- backfill (cap tables rescaled to 100) is NOT reversible — the pre-rescale
-- share counts are not retained.
