-- Per-item budget allocations: individual institution funding and policy cut status
-- Each institution gets its own allocation amount, policies can be toggled as cut,
-- and a discretionary amount is available per ministry.

-- ===== budget_item_allocations: one row per institution/policy per budget bill =====
CREATE TABLE IF NOT EXISTS budget_item_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    fiscal_category TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('institution', 'policy')),
    item_id TEXT NOT NULL,          -- institution config id or policy UUID
    item_name TEXT NOT NULL,        -- display name
    allocation_amount DECIMAL DEFAULT 0,  -- funded amount (institutions only)
    needed_amount DECIMAL DEFAULT 0,      -- computed true cost
    is_cut BOOLEAN DEFAULT false,         -- whether this policy is cut (policies only)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(bill_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_budget_item_alloc_bill ON budget_item_allocations(bill_id);

-- RLS
ALTER TABLE budget_item_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budget_item_alloc_select" ON budget_item_allocations FOR SELECT USING (true);
CREATE POLICY "budget_item_alloc_insert" ON budget_item_allocations FOR INSERT WITH CHECK (true);
CREATE POLICY "budget_item_alloc_update" ON budget_item_allocations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "budget_item_alloc_delete" ON budget_item_allocations FOR DELETE USING (true);

-- Add discretionary column to budget_allocations
ALTER TABLE budget_allocations ADD COLUMN IF NOT EXISTS discretionary_amount DECIMAL DEFAULT 0;
