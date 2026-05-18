-- ═══════════════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPORATIONS — standalone subsystem
-- ═══════════════════════════════════════════════════════════════════════════════
-- Corporations founded by an Entrepreneur faction. Deliberately SEPARATE
-- from the legacy faction_type='corporation' system (which is being
-- retired) — zero crossover, its own table. v1: founder owns 100%
-- (private); 'public'/IPO is modelled in the column but disabled in the
-- UI for now.
--
-- Money: founding cost (starting_capital + founding_fee) is deducted
-- from the entrepreneur's factions.party_funds (the one source for that
-- faction's money). starting_capital is the immutable seed; raw dollars
-- ($5M min .. $500M max → 5_000_000 .. 500_000_000); fee $1M.
-- Additive + idempotent. Public SELECT; writes restricted to the owner.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS entrepreneur_corps (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_faction_id  uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    name              text NOT NULL,
    industry          text NOT NULL CHECK (industry IN ('construction','banking','shipping')),
    hq                text NOT NULL,
    starting_capital  bigint NOT NULL CHECK (starting_capital BETWEEN 5000000 AND 500000000),
    founding_fee      bigint NOT NULL DEFAULT 1000000,
    listing           text NOT NULL DEFAULT 'private' CHECK (listing IN ('private','public')),
    founded_tick      int,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entrepreneur_corps_owner ON entrepreneur_corps (owner_faction_id);

COMMENT ON TABLE entrepreneur_corps IS
    'Entrepreneur-founded corporations. Standalone — no relation to the legacy faction_type=''corporation'' system. Founder owns 100% (listing=private); ''public'' reserved for a later IPO feature.';
COMMENT ON COLUMN entrepreneur_corps.starting_capital IS
    'Immutable seed capital in raw dollars (5_000_000..500_000_000). Deducted (with founding_fee) from the owner''s factions.party_funds at founding.';

-- ── updated_at not needed (no mutable fields in v1) ──

ALTER TABLE entrepreneur_corps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON entrepreneur_corps;
CREATE POLICY "Allow select for all" ON entrepreneur_corps
    FOR SELECT USING (true);

-- Writes only by the authenticated owner of the entrepreneur faction
-- (primary id = auth.uid() or a linked secondary faction).
DROP POLICY IF EXISTS "Owner writes" ON entrepreneur_corps;
CREATE POLICY "Owner writes" ON entrepreneur_corps
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM factions f
        WHERE f.id = entrepreneur_corps.owner_faction_id
          AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM factions f
        WHERE f.id = entrepreneur_corps.owner_faction_id
          AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
    ));

-- ── Atomic founding RPC ──────────────────────────────────────────────
-- Server-side: validates the caller owns the entrepreneur faction,
-- re-checks funds (never trust the client), deducts capital+fee from
-- party_funds and inserts the corp in one transaction. One source of
-- truth for the founding rule. Mirrors create_unit / allocate_defense_funds.
CREATE OR REPLACE FUNCTION found_entrepreneur_corp(
    p_industry text, p_hq text, p_name text, p_capital bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_fee    bigint := 1000000;
    v_cost   bigint;
    v_tick   int;
    v_id     uuid;
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
    IF p_hq IS NULL OR btrim(p_hq) = '' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hq_required');
    END IF;
    IF p_capital IS NULL OR p_capital < 5000000 OR p_capital > 500000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_capital');
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

    INSERT INTO entrepreneur_corps
        (owner_faction_id, name, industry, hq, starting_capital, founding_fee, listing, founded_tick)
    VALUES
        (v_fac.id, btrim(p_name), p_industry, btrim(p_hq), p_capital, v_fee, 'private', COALESCE(v_tick, 0))
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'corp_id', v_id,
        'spent', v_cost, 'new_funds', COALESCE(v_fac.party_funds, 0) - v_cost);
END;
$$;

GRANT EXECUTE ON FUNCTION found_entrepreneur_corp(text, text, text, bigint) TO authenticated;

COMMIT;
