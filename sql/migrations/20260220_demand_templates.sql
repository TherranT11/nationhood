-- ==================== DEMAND TEMPLATES ====================
-- Stores editable demand templates for each voter bloc.
-- Replaces the hardcoded DONOR_DEMANDS object in game-common.js.
-- Managed via the admin panel Demands tab.

CREATE TABLE IF NOT EXISTS demand_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bloc_name       TEXT NOT NULL,              -- voter bloc name (e.g. 'Business Owners')
    demand_name     TEXT NOT NULL,              -- short name (e.g. 'Free Enterprise Deregulation Act')
    demand_text     TEXT NOT NULL,              -- full display text (supports {target_val} placeholder)
    demand_type     TEXT NOT NULL,              -- type category for fulfillment checking
    deadline        INT NOT NULL DEFAULT 20,    -- ticks allowed to fulfill
    conditions      JSONB NOT NULL DEFAULT '{}', -- structured conditions for tick-by-tick evaluation
    ideology_tags   TEXT[] DEFAULT '{}',         -- ideology tags this demand aligns with
    is_active       BOOLEAN DEFAULT true,
    sort_order      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_demand_templates_bloc ON demand_templates(bloc_name);
CREATE INDEX IF NOT EXISTS idx_demand_templates_active ON demand_templates(bloc_name, is_active);

-- RLS policies (permissive, matching other tables)
ALTER TABLE demand_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'demand_templates' AND policyname = 'demand_templates_select') THEN
        EXECUTE 'CREATE POLICY demand_templates_select ON demand_templates FOR SELECT USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'demand_templates' AND policyname = 'demand_templates_insert') THEN
        EXECUTE 'CREATE POLICY demand_templates_insert ON demand_templates FOR INSERT WITH CHECK (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'demand_templates' AND policyname = 'demand_templates_update') THEN
        EXECUTE 'CREATE POLICY demand_templates_update ON demand_templates FOR UPDATE USING (true)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'demand_templates' AND policyname = 'demand_templates_delete') THEN
        EXECUTE 'CREATE POLICY demand_templates_delete ON demand_templates FOR DELETE USING (true)';
    END IF;
END $$;
