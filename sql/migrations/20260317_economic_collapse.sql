-- Economic Collapse: GDP floor system
-- 1. Add starting_gdp column to track each nation's baseline GDP
-- 2. Create Economic Collapse mega-crisis template (programmatic activation)

-- ═══════════════════════════════════════════════════════
-- 1. starting_gdp column
-- ═══════════════════════════════════════════════════════
ALTER TABLE nations ADD COLUMN IF NOT EXISTS starting_gdp NUMERIC;

-- Backfill: snapshot current GDP as starting value for existing nations
UPDATE nations SET starting_gdp = gdp WHERE starting_gdp IS NULL;

-- ═══════════════════════════════════════════════════════
-- 2. Economic Collapse crisis template
-- ═══════════════════════════════════════════════════════
INSERT INTO crisis_templates (id, name, description, is_active, crisis_type)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'Economic Collapse',
  'The economy has catastrophically collapsed. GDP has fallen to critical levels, triggering emergency restructuring. All existing economic crises are superseded.',
  false,
  'stat'
) ON CONFLICT (id) DO NOTHING;

-- Per-tick effects during collapse
INSERT INTO crisis_effects (id, crisis_id, target, stat_key, change_per_tick, stat_floor)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000010', 'nation', 'stability', -0.3, NULL),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000010', 'government_approval', NULL, -0.5, NULL);

-- Recovery conditions (ALL must be met)
INSERT INTO crisis_end_triggers (id, crisis_id, stat_key, operator, threshold)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000010', 'gdp_growth', 'gte', 52),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000010', 'credit', 'gte', 25);
