-- ============================================================================
-- Rifles — military equipment catalog + per-army on-hand inventory.
-- ============================================================================
-- First slice of the Procurement subsystem (deferred back in 20270121).
--
-- rifle_models      : world catalog of rifle types. Each has Reliability /
--                     Lethality / Complexity stats; Quality is their average
--                     (GENERATED — never hand-entered, one source of truth).
--                     world_stock is the global supply available to procure.
-- army_rifle_inventory : an army faction's ON-HAND count of a given model.
--                     One rifle equips up to soldiers_per_rifle (1,000) troops.
--
-- SCOPE (per product decision): catalog + on-hand store + read paths only.
-- There is no buying flow yet, so army_rifle_inventory has NO write policy and
-- starts empty for every faction — on-hand is 0 until a procurement RPC (a
-- later pass) moves world_stock into an army's hands. The "1 rifle = 1,000
-- soldiers" rule is surfaced as an equip-capacity metric in the Order of Battle;
-- it does NOT yet hard-gate create_unit (that would block all unit formation
-- while stock is unreachable).
-- ============================================================================

BEGIN;

-- ── 1. Catalog ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rifle_models (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name               TEXT NOT NULL UNIQUE,
    origin             TEXT NOT NULL,                       -- nation/maker the model comes from
    reliability        NUMERIC(4,1) NOT NULL CHECK (reliability BETWEEN 0 AND 10),
    lethality          NUMERIC(4,1) NOT NULL CHECK (lethality  BETWEEN 0 AND 10),
    complexity         NUMERIC(4,1) NOT NULL CHECK (complexity BETWEEN 0 AND 10),
    -- Quality = the mean of the three stats, to one decimal. Computed, so it can
    -- never drift from the stats it summarises.
    quality            NUMERIC(4,1) GENERATED ALWAYS AS
                           (round((reliability + lethality + complexity) / 3.0, 1)) STORED,
    cost_raw           BIGINT NOT NULL CHECK (cost_raw >= 0),   -- per-rifle price, raw dollars ($1 shown = $1M)
    world_stock        INT NOT NULL DEFAULT 0 CHECK (world_stock >= 0),
    soldiers_per_rifle INT NOT NULL DEFAULT 1000 CHECK (soldiers_per_rifle > 0),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public, read-only catalog (mirrors army_units' read-all). Seeded here; no
-- client writes.
ALTER TABLE rifle_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rifle_models_read_all" ON rifle_models;
CREATE POLICY "rifle_models_read_all"
    ON rifle_models FOR SELECT TO authenticated USING (true);

-- ── 2. On-hand inventory ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS army_rifle_inventory (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id      UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    rifle_model_id  UUID NOT NULL REFERENCES rifle_models(id) ON DELETE CASCADE,
    quantity        INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_army_rifle UNIQUE (faction_id, rifle_model_id)
);

CREATE INDEX IF NOT EXISTS idx_army_rifle_inventory_faction
    ON army_rifle_inventory (faction_id);

-- Read-all (matches army_units / Order of Battle visibility). No write policy:
-- the future procurement RPC (SECURITY DEFINER) will be the sole writer.
ALTER TABLE army_rifle_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "army_rifle_inventory_read_all" ON army_rifle_inventory;
CREATE POLICY "army_rifle_inventory_read_all"
    ON army_rifle_inventory FOR SELECT TO authenticated USING (true);

-- ── 3. Seed the two launch rifles ────────────────────────────────────────────
-- Quality is generated: DR17 (3+4+6)/3 = 4.3, CCR-85 (5+6+8)/3 = 6.3.
INSERT INTO rifle_models (name, origin, reliability, lethality, complexity, cost_raw, world_stock)
VALUES
    ('Denkar DR17', 'Sangreza', 3, 4, 6, 200000, 57),
    ('CCR-85',      'Calveth',  5, 6, 8, 400000, 22)
ON CONFLICT (name) DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;
