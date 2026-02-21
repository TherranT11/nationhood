-- Budget Bill system: auto-generated annual budget allocations
-- Each January tick, a budget bill is created for each nation.
-- Government coalition members can adjust ministry allocations.
-- Passes with simple majority in 3 ticks.

-- ===== budget_allocations: one row per ministry per budget bill =====
CREATE TABLE IF NOT EXISTS budget_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    fiscal_category TEXT NOT NULL,          -- e.g. 'Healthcare', 'Defense', etc.
    allocation_amount DECIMAL DEFAULT 0,    -- player-set allocation (raw dollars)
    fulfilled_cost DECIMAL DEFAULT 0,       -- computed "true cost" of this ministry (raw dollars)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(bill_id, fiscal_category)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_budget_allocations_bill ON budget_allocations(bill_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_nation ON budget_allocations(nation_id);

-- ===== Add budget columns to nations table =====
-- last_budget_tick: tick when the last budget passed (used to detect "no budget" penalty)
-- last_budget_bill_id: reference to the most recent budget bill
-- budget_reserves: unspent surplus from previous budget (carries forward)
ALTER TABLE nations ADD COLUMN IF NOT EXISTS last_budget_tick INT DEFAULT NULL;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS last_budget_bill_id UUID DEFAULT NULL;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS budget_reserves DECIMAL DEFAULT 0;

-- ===== RLS policies =====
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_allocations_select" ON budget_allocations
    FOR SELECT USING (true);

CREATE POLICY "budget_allocations_insert" ON budget_allocations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "budget_allocations_update" ON budget_allocations
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "budget_allocations_delete" ON budget_allocations
    FOR DELETE USING (true);
