-- ═══════════════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — go_public (IPO an existing private corp)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Flips a private corp to public. This is NOT new math — it applies the
-- found_entrepreneur_corp public-branch setup (20270144) to an
-- already-existing private corp, then the existing corp_trade bonding
-- curve (20270145/146) does everything after:
--
--   • treasury_cash      := starting_capital   (the immutable seed)
--   • shares_outstanding := 20
--   • share_price        := starting_capital / 20
--   • founder holds all 20  → corp_shareholdings row
--
-- Money is conserved: the seed (starting_capital) already left the
-- founder's party_funds at founding (20270144 debits capital+fee for
-- private corps too). go_public does NOT debit again — it just
-- materialises that already-spent seed as the public AMM treasury.
-- Primary-only: no cash moves to the founder at IPO; they realise value
-- later via corp_trade sell. The founder starts at 100% (20/20) and
-- dilutes naturally as the market mints shares through corp_trade.
--
-- v1 is one-way (no go_private yet). Gate: caller owns the corp and it
-- is currently private. Faction-guard prelude is VERBATIM the one in
-- found_entrepreneur_corp / corp_trade (the codebase mandates these stay
-- in sync; diverging is the bug class that broke hold_rally — 20270151).
--
-- SECURITY DEFINER: share_price / shares_outstanding / treasury_cash are
-- client-write-revoked (20270144) and corp_shareholdings has no write
-- policy. FOR UPDATE on the corp row serialises a double-clicked IPO so
-- it cannot run twice. Brand-new signature → CREATE OR REPLACE only;
-- additive, idempotent, no schema change.
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
    v_price  NUMERIC;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    -- Caller's entrepreneur faction. VERBATIM the prelude in
    -- found_entrepreneur_corp (20270144) / corp_trade (20270145) — keep
    -- the three in sync if the resolution rule ever changes.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- Lock the corp row: serialises a double-fired IPO (the second
    -- caller sees listing='public' and bails on already_public).
    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id
     FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_corp.listing <> 'private' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_public');
    END IF;

    -- Identical to the 20270144 public branch: seed = starting_capital,
    -- 20 shares, price = seed / 20. starting_capital is NOT NULL
    -- (CHECK 5M..500M) so the share state is always well-formed.
    v_price := v_corp.starting_capital::numeric / 20;

    UPDATE entrepreneur_corps
       SET listing            = 'public',
           treasury_cash      = v_corp.starting_capital::numeric,
           shares_outstanding = 20,
           share_price        = v_price
     WHERE id = p_corp_id;

    -- Founder holds all 20. ON CONFLICT keeps it idempotent/safe even
    -- though a private corp has no prior shareholding row.
    INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
    VALUES (p_corp_id, v_fac.id, 20)
    ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = 20;

    RETURN jsonb_build_object(
        'success',            true,
        'corp_id',            p_corp_id,
        'listing',            'public',
        'shares_outstanding', 20,
        'share_price',        v_price,
        'treasury_cash',      v_corp.starting_capital::numeric
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.go_public(UUID) TO authenticated;

COMMENT ON FUNCTION public.go_public(UUID) IS
    'IPO an existing private entrepreneur corp (ALPHA). Owner-only, private-only, one-way (no go_private yet). Applies the found_entrepreneur_corp public setup: treasury_cash=starting_capital, shares_outstanding=20, share_price=starting_capital/20, founder holds all 20. No party_funds debit (the seed was already paid at founding — money conserved). SECURITY DEFINER (financial columns are client-write-revoked); FOR UPDATE on the corp row serialises double-fire. All post-IPO share/cash movement goes through corp_trade.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- DROP FUNCTION IF EXISTS public.go_public(UUID); — no data is migrated
-- (corps that already went public keep their public state; reverting
-- the function does not un-IPO them. go_private is a future phase).
