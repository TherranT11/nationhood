-- ═══════════════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — go_public funds the treasury with REAL money
-- ═══════════════════════════════════════════════════════════════════════════════
-- Conservation fix for 20270152. The original go_public set
-- treasury_cash = starting_capital with NO debit ("the seed already
-- left at founding"). That argument fails the moment the treasury is
-- extractable by the owner:
--
--   found (private)  → owner −(seed+fee), corp has NO treasury (sunk)
--   go_public        → treasury := seed, owner unchanged   ← conjured
--   reclaim treasury → owner +seed                          ← from nothing
--
-- The reclaim path exists via go_private (20270153) AND already via
-- corp_trade SELL (the owner holds the 20 founding shares; SELL pays
-- out of treasury). Round-trip = owner mints `seed` from nothing.
--
-- Root fix (chosen over patching go_private): going public is a real
-- capital event — the owner must FUND the AMM treasury with real
-- party_funds. go_public now debits starting_capital (insufficient_funds
-- if they can't cover it). Treasury is then real money the owner put
-- in; reclaiming it (go_private) or selling into it (corp_trade) returns
-- their own capital — conserved, no mint. The prior corp_trade-sell
-- leak is closed by the same change.
--
-- Asymmetry, by design: founding a PRIVATE corp sinks the seed (no
-- treasury created); a later IPO is a SEPARATE capital raise that funds
-- the treasury, so a found-private→go_public owner commits capital
-- twice. A born-public corp (found_entrepreneur_corp public branch)
-- still pays once at founding — that path already debited + seeded
-- atomically and is unchanged.
--
-- Body is otherwise identical to 20270152 (same signature → plain
-- CREATE OR REPLACE, no DROP; idempotent; no schema change). Apply in
-- the same batch as 20270153 (go_private) so the reclaim path is never
-- live against the un-funded treasury.
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

    -- The owner FUNDS the treasury with real money. starting_capital is
    -- NOT NULL (CHECK 5M..500M). Conservation: owner −seed, treasury
    -- +seed → reclaim/sell returns their own capital, never a mint.
    v_seed := v_corp.starting_capital;
    IF COALESCE(v_fac.party_funds, 0) < v_seed THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_seed);
    END IF;
    v_price := v_seed::numeric / 20;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_seed
     WHERE id = v_fac.id;

    UPDATE entrepreneur_corps
       SET listing            = 'public',
           treasury_cash      = v_seed::numeric,
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
        'treasury_cash',      v_seed,
        'spent',              v_seed,
        'new_funds',          COALESCE(v_fac.party_funds, 0) - v_seed
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.go_public(UUID) TO authenticated;

COMMENT ON FUNCTION public.go_public(UUID) IS
    'IPO an existing private entrepreneur corp (ALPHA, 20270154: owner FUNDS the treasury). Owner-only, private-only. Debits starting_capital from the owner''s party_funds (insufficient_funds if uncovered) and seeds treasury_cash with it; shares_outstanding=20, share_price=seed/20, founder holds all 20. Real money in → reclaim (go_private) / corp_trade-sell returns the owner''s own capital (conserved; closes the 20270152 mint). SECURITY DEFINER (financial columns client-write-revoked); FOR UPDATE on the corp row serialises double-fire.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270152_entrepreneur_go_public.sql (its body lacks the
-- party_funds debit + insufficient_funds gate). Note: reverting
-- reopens the round-trip money mint described above.
