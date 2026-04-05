-- ============================================================
-- Strategic Oil Reserve System — Schema
-- ============================================================

-- 1. Add reserve column to nations
ALTER TABLE nations ADD COLUMN IF NOT EXISTS strategic_oil_reserve_mb INT NOT NULL DEFAULT 0;

-- 2. Active build cycles — each activation creates a row, supports stacking
CREATE TABLE IF NOT EXISTS energy_oil_build_cycles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    faction_id      UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    activated_on_tick INT NOT NULL,
    ticks_remaining INT NOT NULL DEFAULT 6,
    rate_per_tick   INT NOT NULL DEFAULT 0,       -- Mb added per tick (based on oil_and_gas + manufacturing_output)
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for tick processor: quickly find active cycles per nation
CREATE INDEX IF NOT EXISTS idx_oil_build_cycles_active
    ON energy_oil_build_cycles (nation_id, is_active)
    WHERE is_active = true;

-- RLS
ALTER TABLE energy_oil_build_cycles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read build cycles (needed for UI display)
CREATE POLICY "Authenticated users can read oil build cycles"
    ON energy_oil_build_cycles FOR SELECT
    TO authenticated
    USING (true);

-- Factions can insert their own build cycles
CREATE POLICY "Factions can insert own oil build cycles"
    ON energy_oil_build_cycles FOR INSERT
    TO authenticated
    WITH CHECK (faction_id = auth.uid());

-- Service role (tick processor) can update all cycles
CREATE POLICY "Service role can update oil build cycles"
    ON energy_oil_build_cycles FOR UPDATE
    TO service_role
    USING (true);

-- Service role (tick processor) can delete old inactive cycles
CREATE POLICY "Service role can delete oil build cycles"
    ON energy_oil_build_cycles FOR DELETE
    TO service_role
    USING (true);
