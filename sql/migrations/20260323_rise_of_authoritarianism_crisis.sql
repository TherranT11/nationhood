-- Rise of Authoritarianism Crisis
-- Triggers when press freedom and civil liberties collapse while corruption runs rampant.
-- Represents a democratic backslide toward authoritarian rule — media is suppressed,
-- courts are captured, and civil liberties erode. Creates a vicious spiral that is
-- difficult (but not impossible) to escape through reform.

-- ═══════════════════════════════════════════════════════
-- 1. Crisis template (auto-triggered via stat check)
-- ═══════════════════════════════════════════════════════
INSERT INTO crisis_templates (id, name, description, is_active, crisis_type)
VALUES (
  '00000000-0000-0000-0000-000000000030',
  'Rise of Authoritarianism',
  'Democratic institutions are crumbling. The free press has been silenced, civil liberties are being stripped away, and corruption has captured the state. The nation is sliding toward authoritarian rule. Without urgent democratic reforms, the slide will accelerate.',
  true,
  'stat'
) ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- 2. Activation triggers (ALL must be met)
-- ═══════════════════════════════════════════════════════
INSERT INTO crisis_triggers (crisis_id, stat_key, operator, threshold)
VALUES
  -- Media suppressed
  ('00000000-0000-0000-0000-000000000030', 'press_freedom', 'lte', 25),
  -- Civil liberties eroded
  ('00000000-0000-0000-0000-000000000030', 'freedom_index', 'lte', 25),
  -- Institutions captured by corruption
  ('00000000-0000-0000-0000-000000000030', 'corruption', 'gte', 70);

-- ═══════════════════════════════════════════════════════
-- 3. Per-tick effects while active
-- ═══════════════════════════════════════════════════════
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick, stat_floor)
VALUES
  -- Authoritarian instability: regime is fragile
  ('00000000-0000-0000-0000-000000000030', 'nation', 'stability',                -0.5,  NULL),
  -- Media crackdown accelerates
  ('00000000-0000-0000-0000-000000000030', 'nation', 'press_freedom',            -0.3,     5),
  -- Courts lose independence
  ('00000000-0000-0000-0000-000000000030', 'nation', 'judicial_independence',    -0.4,     5),
  -- Civil liberties keep eroding
  ('00000000-0000-0000-0000-000000000030', 'nation', 'freedom_index',            -0.3,     5),
  -- Opposition grows restless
  ('00000000-0000-0000-0000-000000000030', 'nation', 'civil_unrest',              0.4,  NULL),
  -- Public distrust of government
  ('00000000-0000-0000-0000-000000000030', 'government_approval', NULL,          -0.5,  NULL),
  -- Global condemnation
  ('00000000-0000-0000-0000-000000000030', 'nation', 'international_reputation', -0.5,     5);

-- ═══════════════════════════════════════════════════════
-- 4. Recovery conditions (ALL must be met)
-- ═══════════════════════════════════════════════════════
INSERT INTO crisis_end_triggers (crisis_id, stat_key, operator, threshold)
VALUES
  -- Press must be meaningfully restored
  ('00000000-0000-0000-0000-000000000030', 'press_freedom', 'gte', 40),
  -- Civil liberties must recover
  ('00000000-0000-0000-0000-000000000030', 'freedom_index', 'gte', 40),
  -- Corruption must be reined in
  ('00000000-0000-0000-0000-000000000030', 'corruption', 'lte', 50);
