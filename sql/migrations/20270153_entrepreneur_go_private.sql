-- ═══════════════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — go_private (take a public corp private)
-- ═══════════════════════════════════════════════════════════════════════════════
-- The inverse of go_public (20270152). The owner buys out EVERY
-- non-owner shareholder at a fixed +25% premium over the current share
-- price, then the corp delists:
--
--   • per holder payout = ceil(shares × share_price × 1.25)
--       ceil favours the holder — same rounding convention as
--       corp_trade (buyer pays ≥ exact).
--   • owner pays Σ(payouts) from party_funds → each holder's party_funds
--   • all corp_shareholdings rows are dropped (a private corp has none;
--     the owner's 100% is implicit via owner_faction_id, exactly like a
--     founded-private corp)
--   • owner RECLAIMS treasury_cash into party_funds — the corp's cash is
--     now wholly theirs; this is the exact inverse of go_public
--     materialising the seed into the treasury
--   • listing→'private', treasury_cash/shares_outstanding/share_price→NULL
--
-- Money is conserved: holders receive +Σpayouts; owner nets
-- −Σpayouts + treasury; the corp's treasury → 0. Net system Δ = 0.
--
-- This is NOT corp_trade: corp_trade SELL is a single holder selling
-- back to the treasury along the bonding curve (treasury pays, price
-- walks down). go_private is the owner compensating every other holder
-- from their own funds at a flat premium. Distinct mechanic.
--
-- Affordability is summed READ-ONLY before any write, so an
-- unaffordable buyout returns insufficient_funds with zero side
-- effects (a plpgsql RETURN does not roll back prior UPDATEs — they'd
-- commit; computing first is mandatory, not stylistic).
--
-- Lock order: corp row FOR UPDATE first (corp_trade's documented
-- "consistent global order") — this serialises ALL share mutations on
-- the corp (corp_trade / go_public also lock it first/at-all), so the
-- float cannot change between the cost sum and the payout. Faction
-- guard prelude is VERBATIM found_entrepreneur_corp (20270144) /
-- corp_trade (20270145) — keep the set in sync (the bug class that
-- broke hold_rally, 20270151).
--
-- v1 pairs with go_public for a reversible private⇄public toggle.
-- SECURITY DEFINER (financial columns are client-write-revoked,
-- corp_shareholdings has no write policy). Brand-new signature →
-- CREATE OR REPLACE only; additive, idempotent, no schema change.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.go_private(p_corp_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid     UUID := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_premium NUMERIC := 1.25;     -- fixed +25% take-private premium
    v_total   BIGINT;
    v_treas   BIGINT;
    v_pay     BIGINT;
    r         RECORD;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    -- Corp row first (consistent global order with corp_trade) — this
    -- serialises every share mutation on the corp, so the float is
    -- stable between the cost sum and the payout below.
    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id
     FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    -- Well-formed public corp (mirrors corp_trade's not_public guard).
    IF v_corp.listing <> 'public' OR v_corp.share_price IS NULL
       OR v_corp.shares_outstanding IS NULL OR v_corp.treasury_cash IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_public');
    END IF;

    -- Caller's entrepreneur faction. VERBATIM the prelude in
    -- found_entrepreneur_corp (20270144) / corp_trade (20270145) — keep
    -- the set in sync if the resolution rule ever changes.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    -- Cost = Σ per-holder ceil(shares × price × 1.25), non-owner only.
    -- READ-ONLY: computed before any write so an unaffordable buyout
    -- has zero side effects.
    SELECT COALESCE(SUM(ceil(shares::numeric * v_corp.share_price * v_premium)), 0)::bigint
      INTO v_total
      FROM corp_shareholdings
     WHERE corp_id = p_corp_id
       AND holder_faction_id <> v_fac.id
       AND shares > 0;

    IF COALESCE(v_fac.party_funds, 0) < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_total);
    END IF;

    -- Pay each non-owner holder the SAME per-row ceil; Σ == v_total
    -- exactly (same inputs, float frozen by the corp-row lock) → owner
    -- debit equals credits, money conserved.
    FOR r IN
        SELECT holder_faction_id, shares
          FROM corp_shareholdings
         WHERE corp_id = p_corp_id
           AND holder_faction_id <> v_fac.id
           AND shares > 0
    LOOP
        v_pay := ceil(r.shares::numeric * v_corp.share_price * v_premium)::bigint;
        UPDATE factions
           SET party_funds = COALESCE(party_funds, 0) + v_pay
         WHERE id = r.holder_faction_id;
    END LOOP;

    -- Private corps carry no shareholding rows (owner's 100% is
    -- implicit via owner_faction_id). Drop ALL rows — including the
    -- owner's own block, which dissolves with the public share model;
    -- the owner is not paid for their own shares (filtered above).
    DELETE FROM corp_shareholdings WHERE corp_id = p_corp_id;

    -- Owner: pay the buyout AND reclaim the treasury (now wholly theirs
    -- — exact inverse of go_public). floor() guards against creating
    -- money if treasury_cash ever carried a fraction (it doesn't —
    -- corp_trade keeps it whole-dollar — but never round it up).
    v_treas := floor(COALESCE(v_corp.treasury_cash, 0))::bigint;
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_total + v_treas
     WHERE id = v_fac.id;

    UPDATE entrepreneur_corps
       SET listing            = 'private',
           treasury_cash      = NULL,
           shares_outstanding = NULL,
           share_price        = NULL
     WHERE id = p_corp_id;

    RETURN jsonb_build_object(
        'success',            true,
        'corp_id',            p_corp_id,
        'listing',            'private',
        'bought_out',         v_total,
        'treasury_reclaimed', v_treas,
        'new_funds',          COALESCE(v_fac.party_funds, 0) - v_total + v_treas
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.go_private(UUID) TO authenticated;

COMMENT ON FUNCTION public.go_private(UUID) IS
    'Take a public entrepreneur corp private (ALPHA). Owner-only, public-only. Buys out every non-owner holder at ceil(shares×share_price×1.25) from the owner''s party_funds; owner reclaims treasury_cash; all corp_shareholdings dropped; listing→private, financial columns NULL. Money conserved. Inverse of go_public. Cost summed read-only before any write (insufficient_funds = zero side effects). Corp-row FOR UPDATE serialises against corp_trade/go_public. SECURITY DEFINER (financial columns client-write-revoked).';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- DROP FUNCTION IF EXISTS public.go_private(UUID); — no data migrated;
-- corps already taken private keep their private state. go_public
-- (20270152) is the forward pair.
