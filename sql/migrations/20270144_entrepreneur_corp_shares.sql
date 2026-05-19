-- ═══════════════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — public listing: share state + founder shareholding
-- ═══════════════════════════════════════════════════════════════════════════════
-- v1 forced every corp to listing='private' (founder owns 100%, no share
-- model). Phase 1 of the stock system enables founding a *public* corp:
--
--   • founder seeds capital  → corp.treasury_cash = seed
--   • 20 shares are issued   → shares_outstanding = 20
--   • starting share price   = seed / 20
--   • founder holds all 20   → corp_shareholdings row
--
-- The three new columns are NULL for private corps (not share-modelled).
-- corp_shareholdings is the ONE source of who owns what. share_price /
-- shares_outstanding / treasury_cash are mutable ONLY via SECURITY
-- DEFINER RPCs — column-level UPDATE is revoked from clients so the
-- owner cannot tamper with their own price (matters once Phase 3 trading
-- lands; closing the door now avoids a silent landmine).
--
-- No buy/sell yet (Phase 3/4). No backfill — existing private corps keep
-- the new columns NULL. Additive + idempotent. The found_entrepreneur_corp
-- signature gains p_listing, so PostgREST's schema cache is reloaded
-- (same convention as 20270142/20270143).
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE entrepreneur_corps
    ADD COLUMN IF NOT EXISTS treasury_cash      numeric,
    ADD COLUMN IF NOT EXISTS shares_outstanding int,
    ADD COLUMN IF NOT EXISTS share_price        numeric;

COMMENT ON COLUMN entrepreneur_corps.treasury_cash IS
    'Public corps only: live cash pool (AMM treasury). NULL for private. Seeded = starting_capital at founding.';
COMMENT ON COLUMN entrepreneur_corps.shares_outstanding IS
    'Public corps only: total shares in existence (20 at founding). NULL for private.';
COMMENT ON COLUMN entrepreneur_corps.share_price IS
    'Public corps only: current price per share. Starts starting_capital/20. NULL for private. Set only by RPC.';

-- Clients may never write the financial columns directly (RLS is
-- row-level, not column-level; the owner has FOR ALL on this table).
REVOKE UPDATE (treasury_cash, shares_outstanding, share_price)
    ON entrepreneur_corps FROM authenticated;

-- ── Shareholdings: one row per (corp, holder). Single source of truth ──
CREATE TABLE IF NOT EXISTS corp_shareholdings (
    corp_id           uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    holder_faction_id uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    shares            int  NOT NULL CHECK (shares >= 0),
    PRIMARY KEY (corp_id, holder_faction_id)
);

CREATE INDEX IF NOT EXISTS idx_corp_shareholdings_holder
    ON corp_shareholdings (holder_faction_id);

COMMENT ON TABLE corp_shareholdings IS
    'Who owns how many shares of each public entrepreneur corp. The one source for ownership; written only by SECURITY DEFINER RPCs (no client write policy).';

ALTER TABLE corp_shareholdings ENABLE ROW LEVEL SECURITY;

-- Read-all (mirrors entrepreneur_corps). No write policy → with RLS on,
-- clients cannot write; only SECURITY DEFINER functions (run as owner) can.
DROP POLICY IF EXISTS "Allow select for all" ON corp_shareholdings;
CREATE POLICY "Allow select for all" ON corp_shareholdings
    FOR SELECT USING (true);

-- ── Founding RPC: now takes p_listing; public path seeds share state ──
-- Signature change (adds p_listing) → drop the old 4-arg version and
-- reload PostgREST, same as 20270142/20270143.
DROP FUNCTION IF EXISTS found_entrepreneur_corp(text, uuid, text, bigint);

CREATE OR REPLACE FUNCTION found_entrepreneur_corp(
    p_industry text, p_hq_nation_id uuid, p_name text, p_capital bigint, p_listing text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_fac       factions%ROWTYPE;
    v_fee       bigint := 1000000;
    v_cost      bigint;
    v_tick      int;
    v_id        uuid;
    v_nation_ok boolean;
    v_listing   text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_industry NOT IN ('construction','banking','shipping') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_industry');
    END IF;
    IF p_name IS NULL OR btrim(p_name) = '' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_required');
    END IF;
    IF p_hq_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hq_required');
    END IF;
    -- Real, placeable nation = exists and has an assigned continent.
    SELECT (continent IS NOT NULL) INTO v_nation_ok
      FROM nations WHERE id = p_hq_nation_id;
    IF v_nation_ok IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_hq_nation');
    END IF;
    IF p_capital IS NULL OR p_capital < 5000000 OR p_capital > 500000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_capital');
    END IF;
    v_listing := lower(COALESCE(NULLIF(btrim(p_listing), ''), 'private'));
    IF v_listing NOT IN ('private','public') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_listing');
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

    v_cost := p_capital + v_fee;
    IF COALESCE(v_fac.party_funds, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_cost WHERE id = v_fac.id;

    -- Public: seed treasury, issue 20 shares, price = seed/20. Private:
    -- the three share columns stay NULL (CASE with no ELSE → NULL).
    INSERT INTO entrepreneur_corps
        (owner_faction_id, name, industry, hq_nation_id, starting_capital, founding_fee,
         listing, founded_tick, treasury_cash, shares_outstanding, share_price)
    VALUES
        (v_fac.id, btrim(p_name), p_industry, p_hq_nation_id, p_capital, v_fee,
         v_listing, COALESCE(v_tick, 0),
         CASE WHEN v_listing = 'public' THEN p_capital::numeric END,
         CASE WHEN v_listing = 'public' THEN 20 END,
         CASE WHEN v_listing = 'public' THEN p_capital::numeric / 20 END)
    RETURNING id INTO v_id;

    IF v_listing = 'public' THEN
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (v_id, v_fac.id, 20);
    END IF;

    RETURN jsonb_build_object('success', true, 'corp_id', v_id, 'listing', v_listing,
        'spent', v_cost, 'new_funds', COALESCE(v_fac.party_funds, 0) - v_cost);
END;
$$;

GRANT EXECUTE ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) TO authenticated;

COMMIT;

-- PostgREST routes RPCs by cached argument names; adding p_listing is a
-- signature change, so the schema cache must be reloaded or callers get
-- "Could not find the function ... in the schema cache". Same convention
-- as 20270142/20270143. Idempotent.
NOTIFY pgrst, 'reload schema';
