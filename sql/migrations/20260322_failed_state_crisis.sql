-- Failed State Crisis
-- Triggers when stability hits 0. Simulates total state failure (Somalia, Afghanistan).
-- Nation enters a vicious cycle of collapsing services, rising crime, and international
-- isolation until stability is restored to 15.

-- ═══════════════════════════════════════════════════════
-- 1. Crisis template (auto-triggered via stat check)
-- ═══════════════════════════════════════════════════════
INSERT INTO crisis_templates (id, name, description, is_active, crisis_type)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  'Failed State',
  'The state has collapsed. Government institutions have ceased to function, basic services are unavailable, and lawlessness reigns. International actors treat the nation as a failed state. Order must be restored before recovery can begin.',
  true,
  'stat'
) ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- 2. Activation trigger: stability hits 0
-- ═══════════════════════════════════════════════════════
INSERT INTO crisis_triggers (crisis_id, stat_key, operator, threshold)
VALUES
  ('00000000-0000-0000-0000-000000000011', 'stability', 'lte', 0);

-- ═══════════════════════════════════════════════════════
-- 3. Per-tick effects while active
-- ═══════════════════════════════════════════════════════
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick, stat_floor)
VALUES
  -- Chaos spreads: civil unrest rises
  ('00000000-0000-0000-0000-000000000011', 'nation', 'civil_unrest',              0.5,  NULL),
  -- Government becomes irrelevant
  ('00000000-0000-0000-0000-000000000011', 'government_approval', NULL,           -1.0,  NULL),
  -- Pariah state: international isolation
  ('00000000-0000-0000-0000-000000000011', 'nation', 'international_reputation', -0.5,    5),
  -- Healthcare collapses
  ('00000000-0000-0000-0000-000000000011', 'nation', 'healthcare_quality',       -0.3,    5),
  -- Education breaks down
  ('00000000-0000-0000-0000-000000000011', 'nation', 'literacy',                 -0.2,   10),
  -- Lawlessness
  ('00000000-0000-0000-0000-000000000011', 'nation', 'crime_rate',                0.3,   NULL),
  -- Capital flight
  ('00000000-0000-0000-0000-000000000011', 'nation', 'foreign_investment',       -0.5,    5);

-- ═══════════════════════════════════════════════════════
-- 4. Recovery condition: stability must reach 15
-- ═══════════════════════════════════════════════════════
INSERT INTO crisis_end_triggers (crisis_id, stat_key, operator, threshold)
VALUES
  ('00000000-0000-0000-0000-000000000011', 'stability', 'gte', 15);
