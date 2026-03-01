-- ============================================================
-- Sovereign Default System
-- Migration: 20260301_sovereign_default.sql
--
-- Creates tables for tracking sovereign default resolutions
-- and their history, adds nation-level debt tracking columns,
-- and inserts crisis templates for debt-related crises.
-- ============================================================

-- ==================== NEW TABLES ====================

-- default_resolutions: tracks active and historical default proposals
CREATE TABLE IF NOT EXISTS default_resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    proposed_by_faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    proposed_by_player_id UUID REFERENCES auth.users(id),
    default_type TEXT NOT NULL,
    repayment_rate NUMERIC,
    austerity_commitments JSONB DEFAULT '[]'::jsonb,
    bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'proposed',
    debt_at_proposal NUMERIC NOT NULL,
    gdp_at_proposal NUMERIC NOT NULL,
    debt_to_gdp_at_proposal NUMERIC NOT NULL,
    created_at_tick INTEGER NOT NULL,
    resolved_at_tick INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_default_type CHECK (default_type IN ('full', 'partial_restructuring')),
    CONSTRAINT chk_default_status CHECK (status IN ('proposed', 'voting', 'passed', 'failed', 'cancelled')),
    CONSTRAINT chk_repayment_rate CHECK (
        (default_type = 'full' AND repayment_rate IS NULL) OR
        (default_type = 'partial_restructuring' AND repayment_rate BETWEEN 0.3 AND 0.7)
    )
);

-- default_history: immutable record of executed defaults (for cooldown enforcement)
CREATE TABLE IF NOT EXISTS default_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    default_resolution_id UUID REFERENCES default_resolutions(id) ON DELETE SET NULL,
    default_type TEXT NOT NULL,
    repayment_rate NUMERIC,
    debt_before NUMERIC NOT NULL,
    debt_after NUMERIC NOT NULL,
    executed_at_tick INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_default_resolutions_nation ON default_resolutions(nation_id);
CREATE INDEX IF NOT EXISTS idx_default_resolutions_status ON default_resolutions(status);
CREATE INDEX IF NOT EXISTS idx_default_resolutions_bill ON default_resolutions(bill_id);
CREATE INDEX IF NOT EXISTS idx_default_history_nation ON default_history(nation_id);

-- ==================== NATION TABLE ADDITIONS ====================

-- last_default_tick: when the nation last executed a sovereign default (for cooldown)
ALTER TABLE nations ADD COLUMN IF NOT EXISTS last_default_tick INTEGER;

-- debt_service_burden: 0.0-0.4 multiplier recalculated each tick
-- Reduces government spending effectiveness when debt-to-GDP > 100%
ALTER TABLE nations ADD COLUMN IF NOT EXISTS debt_service_burden NUMERIC DEFAULT 0;

-- credit_locked_out: true when credit <= 5 — nation cannot borrow
ALTER TABLE nations ADD COLUMN IF NOT EXISTS credit_locked_out BOOLEAN DEFAULT false;

-- ==================== CRISIS TEMPLATES ====================

-- Sovereign Default Crisis (mandatory, 20+ tick duration)
-- Activated programmatically when a default resolution passes
-- NOT activated by stat triggers — is_active = false prevents template-based auto-activation
INSERT INTO crisis_templates (id, name, description, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Sovereign Default Crisis',
    'The nation has defaulted on its sovereign debt obligations. International markets have lost confidence. Credit access is severely restricted and the economy faces a prolonged recovery period.',
    false  -- Programmatically managed, not auto-triggered
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Sovereign Default Crisis effects (recovery per tick)
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick, stat_floor)
VALUES
    ('00000000-0000-0000-0000-000000000002', 'nation', 'credit', 0.5, 25),
    ('00000000-0000-0000-0000-000000000002', 'nation', 'foreign_investment', 0.3, 30),
    ('00000000-0000-0000-0000-000000000002', 'nation', 'currency_strength', 0.5, NULL),
    ('00000000-0000-0000-0000-000000000002', 'nation', 'inflation', -0.3, NULL),
    ('00000000-0000-0000-0000-000000000002', 'nation', 'interest_rates', -0.5, NULL),
    ('00000000-0000-0000-0000-000000000002', 'nation', 'trade_balance', 0.2, NULL),
    ('00000000-0000-0000-0000-000000000002', 'government_approval', NULL, -0.5, NULL)
ON CONFLICT DO NOTHING;

-- Sovereign Default Crisis end triggers (ALL must be met + 20 tick minimum)
INSERT INTO crisis_end_triggers (crisis_id, stat_key, operator, threshold)
VALUES
    ('00000000-0000-0000-0000-000000000002', 'credit', 'gte', 20),
    ('00000000-0000-0000-0000-000000000002', 'currency_strength', 'gte', 20),
    ('00000000-0000-0000-0000-000000000002', 'inflation', 'lte', 50),
    ('00000000-0000-0000-0000-000000000002', 'gdp_growth', 'gte', 50)
ON CONFLICT DO NOTHING;

-- Sovereign Debt Crisis (auto-triggered by programmatic check: debt-to-GDP >= 200% AND credit <= 15)
-- is_active = false because trigger depends on computed ratio, not simple stat threshold
INSERT INTO crisis_templates (id, name, description, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'Sovereign Debt Crisis',
    'Unsustainable national debt has triggered a sovereign debt crisis. Foreign lenders are withdrawing, the currency is under pressure, and economic growth is stalling. The government must address the debt situation or face further deterioration.',
    false  -- Programmatically managed (debt-to-GDP ratio check)
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Sovereign Debt Crisis effects
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick, stat_floor)
VALUES
    ('00000000-0000-0000-0000-000000000003', 'nation', 'foreign_investment', -1.5, 8),
    ('00000000-0000-0000-0000-000000000003', 'nation', 'currency_strength', -1.0, 10),
    ('00000000-0000-0000-0000-000000000003', 'nation', 'gdp_growth', -1.5, 20),
    ('00000000-0000-0000-0000-000000000003', 'nation', 'stability', -0.5, 20),
    ('00000000-0000-0000-0000-000000000003', 'government_approval', NULL, -1.0, NULL)
ON CONFLICT DO NOTHING;

-- Sovereign Debt Crisis end triggers
INSERT INTO crisis_end_triggers (crisis_id, stat_key, operator, threshold)
VALUES
    ('00000000-0000-0000-0000-000000000003', 'credit', 'gte', 30)
ON CONFLICT DO NOTHING;

-- Currency Collapse Crisis (auto-triggered by stat threshold)
INSERT INTO crisis_templates (id, name, description, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    'Currency Collapse',
    'The national currency has collapsed in value. Imports are prohibitively expensive, inflation is spiraling, and foreign investors are fleeing. Drastic monetary and fiscal measures are needed to restore confidence.',
    true  -- Auto-triggered by stat threshold
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true;

-- Currency Collapse triggers
INSERT INTO crisis_triggers (crisis_id, stat_key, operator, threshold)
VALUES
    ('00000000-0000-0000-0000-000000000004', 'currency_strength', 'lte', 12)
ON CONFLICT DO NOTHING;

-- Currency Collapse effects
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick, stat_floor)
VALUES
    ('00000000-0000-0000-0000-000000000004', 'nation', 'inflation', 3.0, NULL),
    ('00000000-0000-0000-0000-000000000004', 'nation', 'foreign_investment', -2.0, 5),
    ('00000000-0000-0000-0000-000000000004', 'nation', 'trade_balance', -1.5, 5),
    ('00000000-0000-0000-0000-000000000004', 'nation', 'standard_of_living', -1.0, 15),
    ('00000000-0000-0000-0000-000000000004', 'government_approval', NULL, -1.5, NULL)
ON CONFLICT DO NOTHING;

-- Currency Collapse end triggers
INSERT INTO crisis_end_triggers (crisis_id, stat_key, operator, threshold)
VALUES
    ('00000000-0000-0000-0000-000000000004', 'currency_strength', 'gte', 25)
ON CONFLICT DO NOTHING;

-- Hyperinflation Emergency (auto-triggered by stat threshold)
INSERT INTO crisis_templates (id, name, description, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000005',
    'Hyperinflation Emergency',
    'Prices are spiraling out of control. The cost of basic goods doubles daily, savings are worthless, and civil unrest is growing. The government must take emergency measures to stabilize the economy.',
    true  -- Auto-triggered by stat threshold
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true;

-- Hyperinflation triggers
INSERT INTO crisis_triggers (crisis_id, stat_key, operator, threshold)
VALUES
    ('00000000-0000-0000-0000-000000000005', 'inflation', 'gte', 80)
ON CONFLICT DO NOTHING;

-- Hyperinflation effects
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick, stat_floor)
VALUES
    ('00000000-0000-0000-0000-000000000005', 'nation', 'currency_strength', -2.5, 3),
    ('00000000-0000-0000-0000-000000000005', 'nation', 'standard_of_living', -2.0, 10),
    ('00000000-0000-0000-0000-000000000005', 'nation', 'happiness', -1.5, 10),
    ('00000000-0000-0000-0000-000000000005', 'nation', 'foreign_investment', -1.5, 5),
    ('00000000-0000-0000-0000-000000000005', 'nation', 'civil_unrest', 1.5, NULL),
    ('00000000-0000-0000-0000-000000000005', 'government_approval', NULL, -2.0, NULL)
ON CONFLICT DO NOTHING;

-- Hyperinflation end triggers
INSERT INTO crisis_end_triggers (crisis_id, stat_key, operator, threshold)
VALUES
    ('00000000-0000-0000-0000-000000000005', 'inflation', 'lte', 65)
ON CONFLICT DO NOTHING;

-- ==================== RLS POLICIES ====================

ALTER TABLE default_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_history ENABLE ROW LEVEL SECURITY;

-- default_resolutions: all authenticated can read (defaults are public knowledge)
CREATE POLICY "default_resolutions_select_all"
    ON default_resolutions FOR SELECT
    TO authenticated
    USING (true);

-- default_resolutions: insert/update restricted to authenticated users
-- (Fine-grained PM/President check happens in application code)
CREATE POLICY "default_resolutions_insert"
    ON default_resolutions FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "default_resolutions_update"
    ON default_resolutions FOR UPDATE
    TO authenticated
    USING (true);

-- default_history: read-only for all authenticated
CREATE POLICY "default_history_select_all"
    ON default_history FOR SELECT
    TO authenticated
    USING (true);

-- default_history: insert allowed (system writes from client-side or edge function)
CREATE POLICY "default_history_insert"
    ON default_history FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Grant service_role full access for edge function processing
GRANT ALL ON default_resolutions TO service_role;
GRANT ALL ON default_history TO service_role;
