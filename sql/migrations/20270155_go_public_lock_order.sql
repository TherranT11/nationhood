-- ═══════════════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — go_public lock-order alignment (deadlock class)
-- ═══════════════════════════════════════════════════════════════════════════════
-- 20270154's go_public locks the FACTION row first, then the corp row.
-- corp_trade (20270145) documents the convention "Lock the corp row
-- first (consistent global order)" and go_private (20270153) follows
-- it. go_public was the lone deviator: two transactions taking the
-- same {faction row, corp row} in opposite orders is the textbook
-- deadlock class (e.g. a stale tab firing go_public while go_private
-- runs on the same corp — each holds one row, waits for the other).
--
-- Postgres detects and aborts one txn (SECURITY DEFINER = atomic, full
-- rollback, no partial money movement; the client re-enables), so this
-- is a low-probability, DB-safe UX wart rather than a money/data
-- hazard — but it violates the codebase's own documented lock order.
-- Aligning go_public to corp-first puts all three money RPCs on ONE
-- order and removes the class entirely.
--
-- Body is LOGICALLY identical to 20270154 — same funding (owner debits
-- starting_capital → treasury), same guards/return. ONLY the lock
-- acquisition order changes:
--   20270154: faction FOR UPDATE → corp FOR UPDATE
--   20270155: corp FOR UPDATE → (already_public) → faction FOR UPDATE
-- The already_public check moves ahead of the faction resolve (needs
-- only the corp row, listing is public info — RLS is SELECT-all — so
-- no disclosure change; mirrors go_private's not_public-before-faction
-- ordering). Same signature → plain CREATE OR REPLACE; idempotent; no
-- schema change. Supersedes 20270154's body (apply both; final
-- go_public = this).
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
    'IPO an existing private entrepreneur corp (ALPHA, 20270155: corp-first lock order matching corp_trade/go_private). Owner-only, private-only. Debits starting_capital from the owner''s party_funds (insufficient_funds if uncovered) and seeds treasury_cash with it; shares_outstanding=20, share_price=seed/20, founder holds all 20. Conserved (closes the 20270152 mint). SECURITY DEFINER; FOR UPDATE corp row serialises double-fire.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270154 (faction-first lock order; reopens the deadlock
-- class but is logically equivalent). Reverting further to 20270152
-- also reopens the round-trip money mint.
