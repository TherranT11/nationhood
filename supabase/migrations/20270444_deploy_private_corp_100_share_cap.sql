-- ════════════════════════════════════════════════════════════════════
-- Deploy the fixed 100-share private-equity model
--
-- 20270212 shipped a 1000-share dilution-mint model for private-corp
-- director investments:
--   bootstrap founder to 1000 shares (= 100%)
--   on a 25% investment: mint 333 new shares, give them to the
--   investor, total becomes 1333 (founder dilutes from 100% to 75%)
--
-- 20270232 and then 20270255 replaced that with a fixed 100-share
-- transfer model:
--   bootstrap founder to 100 (= 100%)
--   on a 25% investment: transfer 25 founder shares to the investor,
--   total stays at 100 (no minting, no dilution beyond the explicit
--   transfer)
--
-- Both replacement migrations live in sql/migrations/ — the LEGACY
-- folder. The CI workflow only deploys supabase/migrations/**, so
-- 20270232 and 20270255 were never auto-applied. The live database
-- still runs the 20270212 dilution-mint code.
--
-- Symptom: a private corp accepts a director's 45% offer and ends up
-- with founder=1000 shares, director=818 shares, shares_outstanding=
-- 1818. Math is correct for the old formula (ROUND(1000 × 45 / 55) =
-- 818) but the corp's cap table is supposed to be 100 shares total.
--
-- This migration ports the 20270255 bodies into supabase/migrations/
-- so they actually deploy, plus reruns the 20270232 backfill that
-- normalises legacy dilution-minted private corps to the 100-share
-- cap (preserves each holder's proportion; founder absorbs the
-- rounding remainder). Backfill is idempotent — re-runs are safe.
--
-- go_public is intentionally left alone in this migration; it's
-- already shipping the 20-share v1 from 20270226 and the related
-- behaviour is orthogonal to the private-equity bug.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Backfill: normalise legacy 1000-base private corps to 100 ────
-- For each private corp with shares_outstanding ≠ 100 and ≠ NULL:
-- rescale each holder's shares to its proportional share of 100, then
-- absorb the rounding remainder into the founder so the total stays
-- exactly 100. NULL shares_outstanding (corps that never took an
-- investment) is skipped — they stay implicit-100% to the founder.
-- Idempotent: corps already at exactly 100 are filtered out.
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
        -- Sum directors' rescaled shares first (before any UPDATE).
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

        -- Founder absorbs the rounding remainder so the cap is exactly 100.
        v_founder := GREATEST(0, 100 - v_dir_total);
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (r.id, r.owner_faction_id, v_founder)
        ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = v_founder;

        -- Sweep zero / negative rows (e.g. Pieter Wolff style empty director slots).
        DELETE FROM corp_shareholdings WHERE corp_id = r.id AND shares <= 0;

        UPDATE entrepreneur_corps
           SET shares_outstanding = 100, updated_at = now()
         WHERE id = r.id;
    END LOOP;
END $$;

-- ── 2. respond_corp_investment_offer — 100-cap fixed-transfer model ─
-- Body lifted verbatim from sql/migrations/20270255 so the deployed
-- function matches the design that's already documented there.
-- Bootstrap founder=100 lazily on first accepted offer; subsequent
-- accepts TRANSFER equity_pct shares founder→investor; total stays at
-- 100. Cash still funds the corp treasury — the equity transfer is the
-- source of value for the investor.
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

    -- Investor receives equity_pct shares (= equity_pct% of the 100 cap),
    -- TRANSFERRED from the founder. The founder gives up the slice; the
    -- cash funds the corp treasury. The cap stays at 100 (no dilution mint).
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

    -- Transfer the slice founder → investor (cap unchanged).
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

COMMENT ON FUNCTION public.respond_corp_investment_offer(uuid, boolean) IS
    'CEO accepts/rejects a corp_investment_offer on a private corp. On accept: TRANSFER equity_pct shares from founder to investor (cap stays at 100, no dilution mint). Cash funds corp treasury. Replaces the 20270212 1000-share dilution-mint behaviour. Deployed via 20270444 — sql/migrations/20270232 and 20270255 had the same body but never auto-deployed.';

-- ── 3. sell_corp_equity — 100-cap, shares return to founder ─────────
-- Body lifted verbatim from sql/migrations/20270255. Director sells N
-- of their shares back; corp pays from treasury at book-value
-- proportion; shares return to the FOUNDER (un-diluting them) so the
-- cap stays at 100 rather than being burned.
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

    -- Sell-back on the fixed cap: corp pays director from treasury at the
    -- book-value proportion; shares return to the FOUNDER (un-dilutes them).
    -- shares_outstanding stays at 100.
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

COMMENT ON FUNCTION public.sell_corp_equity(uuid, int) IS
    'Director sells N held shares of a private corp back. Corp pays from treasury at book-value proportion; shares return to FOUNDER (un-diluting them). shares_outstanding stays at 100. Replaces the 20270212 burn behaviour. Deployed via 20270444.';

NOTIFY pgrst, 'reload schema';

COMMIT;
