-- Ministry Crisis system: budget-linked crises that fire when ministry funding
-- drops below a threshold percentage of fulfilled cost.
--
-- Extends the existing crisis_templates table with:
--   crisis_type: 'stat' (default, existing behavior) or 'ministry'
--   fiscal_category: which ministry's budget to watch (e.g. 'Healthcare')
--   funding_threshold_pct: activation threshold (e.g. 60 = fires when funded < 60%)
--   recovery_threshold_pct: deactivation threshold (e.g. 80 = resolves when funded >= 80%)
--   institution_ids: optional JSON array of institution IDs for context (e.g. ["hospitals","workforce"])

ALTER TABLE crisis_templates ADD COLUMN IF NOT EXISTS crisis_type TEXT DEFAULT 'stat';
ALTER TABLE crisis_templates ADD COLUMN IF NOT EXISTS fiscal_category TEXT;
ALTER TABLE crisis_templates ADD COLUMN IF NOT EXISTS funding_threshold_pct NUMERIC;
ALTER TABLE crisis_templates ADD COLUMN IF NOT EXISTS recovery_threshold_pct NUMERIC;
ALTER TABLE crisis_templates ADD COLUMN IF NOT EXISTS institution_ids JSONB DEFAULT '[]'::jsonb;
