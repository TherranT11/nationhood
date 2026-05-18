-- ═══════════════════════════════════════════════════════════════════════════════
-- PROVINCES PHASE 1 — per-nation provinces + per-province sector weights
-- ═══════════════════════════════════════════════════════════════════════════════
-- Purpose:
--   Establishes admin-managed `provinces` and `province_sector_weights` so an
--   admin can split each sector's national weight across the nation's
--   provinces ("partition" model: per sector, Σ province weights = the
--   nation-level sectors.weight, enforced in the admin Provinces tab).
--
--   Phase 1 is INVISIBLE TO GAMEPLAY. No game logic reads these tables — the
--   election engine still consumes sectors.weight exactly as before. The
--   admin Provinces tab writes them; the election-map province panels read
--   them for display only. Wiring province weights into per-province election
--   results is a later, separately-scoped phase.
--
-- Conventions:
--   * public SELECT, admin-only writes (mirrors `sectors`).
--   * province_sector_weights.weight is 0-3 (0 = sector absent in that
--     province) — deliberately wider than sectors.weight's 1-3 floor.
--   * provinces seeded from the formerly-hardcoded NATION_MAP_PROVINCES so
--     the election map keeps showing the same provinces after it switches
--     to reading this table.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provinces (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       uuid NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    name            text NOT NULL,
    display_order   smallint NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (nation_id, name)
);

CREATE INDEX IF NOT EXISTS idx_provinces_nation ON provinces (nation_id);

COMMENT ON TABLE provinces IS
    'Per-nation provinces, admin-managed via the admin Provinces tab. Phase 1 is display-only; no game logic reads this.';

CREATE TABLE IF NOT EXISTS province_sector_weights (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    province_id uuid NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
    sector_id   uuid NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
    weight      smallint NOT NULL DEFAULT 0
                    CHECK (weight BETWEEN 0 AND 3),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (province_id, sector_id)
);

CREATE INDEX IF NOT EXISTS idx_psw_province ON province_sector_weights (province_id);
CREATE INDEX IF NOT EXISTS idx_psw_sector   ON province_sector_weights (sector_id);

COMMENT ON TABLE province_sector_weights IS
    'A province''s weight for one sector. Partition model: per sector, Σ over the nation''s provinces should equal sectors.weight (enforced in the admin Provinces tab, surfaced as drift on the election map). A missing row means weight 0.';
COMMENT ON COLUMN province_sector_weights.weight IS
    'Per-province sector weight 0-3. 0 = sector absent in that province. Wider than sectors.weight (1-3) on purpose.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. updated_at maintenance
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_provinces_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS provinces_set_updated_at ON provinces;
CREATE TRIGGER provinces_set_updated_at
    BEFORE UPDATE ON provinces
    FOR EACH ROW EXECUTE FUNCTION trg_provinces_set_updated_at();

DROP TRIGGER IF EXISTS psw_set_updated_at ON province_sector_weights;
CREATE TRIGGER psw_set_updated_at
    BEFORE UPDATE ON province_sector_weights
    FOR EACH ROW EXECUTE FUNCTION trg_provinces_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS POLICIES — public read, admin-only write (mirrors `sectors`)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE province_sector_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON provinces;
CREATE POLICY "Allow select for all" ON provinces
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin writes" ON provinces;
CREATE POLICY "Admin writes" ON provinces
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Allow select for all" ON province_sector_weights;
CREATE POLICY "Allow select for all" ON province_sector_weights
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin writes" ON province_sector_weights;
CREATE POLICY "Admin writes" ON province_sector_weights
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SEED — provinces from the formerly-hardcoded NATION_MAP_PROVINCES
--    (idempotent; weights are left unset — admin partitions them in the tab)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO provinces (nation_id, name, display_order)
SELECT n.id, seed.name, seed.display_order
FROM nations n
JOIN (
    VALUES
        ('Avelia',  'Valeranza',  1),
        ('Calveth', 'Auplandet',  1),
        ('Calveth', 'Borastadt',  2),
        ('Calveth', 'Cousheim',   3),
        ('Calveth', 'Folenberg',  4)
) AS seed(nation_name, name, display_order)
    ON seed.nation_name = n.name
ON CONFLICT (nation_id, name) DO NOTHING;

COMMIT;
