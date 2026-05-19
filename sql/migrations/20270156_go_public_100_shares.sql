-- ═══════════════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — go_public: fixed 100-share float (20 founder / 80 free)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Supersedes 20270155. Model change: a public corp now has a FIXED
-- supply of 100 shares for its public life — the founder is issued 20
-- (20%), the other 80 are the purchasable float. corp_trade no longer
-- mints/burns shares_outstanding (see 20270157); it moves shares
-- between the float and holders along the same ±5% curve.
--
--   shares_outstanding := 100   (constant; corp_trade never changes it)
--   share_price        := starting_capital / 100   (was /20)
--   founder holding    := 20    (was 20 of 20 = 100%; now 20 of 100 = 20%)
--   treasury_cash      := starting_capital   (unchanged; owner-funded)
--
-- Market cap = shares_outstanding × share_price = 100 × seed/100 = seed
-- at IPO — the valuation single source (computeEntrepreneurValuation)
-- stays correct with zero client change. CONSEQUENCE (intended,
-- confirmed): the founder is a 20% holder at IPO, NOT controlling; the
-- 80-share float is immediately buyable by anyone.
--
-- Conservation is unchanged from 20270155: owner −seed, treasury +seed.
-- Lock order (corp-first) and the verbatim faction guard are unchanged.
-- Body is otherwise identical to 20270155 — only the three numeric
-- constants (100 / seed÷100 / founder 20-of-100) differ.
--
-- BACKFILL (one-time, idempotent): existing public corps were created
-- under the old mint model where shares_outstanding == Σ(holdings)
-- (every old buy incremented both), so the new
-- available = shares_outstanding − Σheld would be 0 and trading would
-- be frozen. Normalise every public corp to the new basis:
--   shares_outstanding := 100, share_price := starting_capital/100.
-- For the realistic alpha state (a just-IPO'd, untraded corp: founder
-- holds 20, nobody else) this is exactly the new-IPO shape → 80
-- available, market cap = seed. For any corp that already traded under
-- the old curve this RESETS its discovered price to the 100-share
-- basis and its market cap to 100×price — acceptable in alpha (no
-- production data; documented, not silent). treasury_cash is left
-- alone (real money). Re-runnable.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.go_public(p_corp_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid    UUID := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_seed   BIGINT;
    v_price  NUMERIC;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    -- Corp row FIRST — consistent global order with corp_trade /
    -- go_private. listing is public (RLS SELECT-all), so returning
    -- already_public before the faction resolve discloses nothing.
    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id
     FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.listing <> 'private' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_public');
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

    -- The owner FUNDS the treasury with real money. starting_capital is
    -- NOT NULL (CHECK 5M..500M). Conservation: owner −seed, treasury
    -- +seed → reclaim/sell returns their own capital, never a mint.
    v_seed := v_corp.starting_capital;
    IF COALESCE(v_fac.party_funds, 0) < v_seed THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_seed);
    END IF;
    v_price := v_seed::numeric / 100;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_seed
     WHERE id = v_fac.id;

    -- Fixed 100-share supply for the corp's public life. corp_trade
    -- (20270157) never changes shares_outstanding — it moves shares
    -- between the float (available = 100 − Σheld) and holders.
    UPDATE entrepreneur_corps
       SET listing            = 'public',
           treasury_cash      = v_seed::numeric,
           shares_outstanding = 100,
           share_price        = v_price
     WHERE id = p_corp_id;

    -- Founder is issued 20 of 100 (20%); the other 80 are the float.
    -- ON CONFLICT keeps it idempotent/safe (a private corp has no row).
    INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
    VALUES (p_corp_id, v_fac.id, 20)
    ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = 20;

    RETURN jsonb_build_object(
        'success',            true,
        'corp_id',            p_corp_id,
        'listing',            'public',
        'shares_outstanding', 100,
        'share_price',        v_price,
        'treasury_cash',      v_seed,
        'spent',              v_seed,
        'new_funds',          COALESCE(v_fac.party_funds, 0) - v_seed
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.go_public(UUID) TO authenticated;

COMMENT ON FUNCTION public.go_public(UUID) IS
    'IPO an existing private entrepreneur corp (ALPHA, 20270156: fixed 100-share float). Owner-only, private-only, corp-first lock. Debits starting_capital from the owner; treasury=seed; shares_outstanding=100 (constant); share_price=seed/100; founder issued 20 (20%), 80 float. Conserved. SECURITY DEFINER.';

-- ── One-time backfill: existing public corps → the 100-share basis ──
UPDATE entrepreneur_corps
   SET shares_outstanding = 100,
       share_price        = starting_capital::numeric / 100
 WHERE listing = 'public';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270155 (20-share / seed÷20 / 100%-founder go_public). NOTE:
-- the backfill is NOT auto-reversible — corps normalised to 100 shares
-- keep that supply; reverting only the function does not restore old
-- shares_outstanding/share_price. Acceptable in alpha (no prod data).
