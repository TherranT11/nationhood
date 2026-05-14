-- Debt-to-GDP band crises: Strained / Crisis / Collapse.
--
-- Three new crisis_templates rows, plus their crisis_effects.
-- Unlike stat-based crises, these are activated programmatically by
-- processDebtToGdpBands in the advance-tick handler, because the
-- generic crisis_triggers system only supports single-stat thresholds
-- (operator + threshold on one stat_key) and we need a computed
-- ratio (debt / gdp).
--
-- is_active=false marks them as programmatic: processCrises in the
-- handler explicitly skips activation for these (existing convention,
-- see "programmatic crises are activated elsewhere" comment in
-- processCrises). The handler will insert/delete active_crises rows
-- as nations cross thresholds; processCrises will then apply the
-- crisis_effects below as if they were any other crisis.
--
-- Storage units: post-migrations 20261206 + 20261207, both
-- nation.debt and nation.gdp are stored as abstract integers in $B.
-- So ratio = debt / gdp directly. A nation with debt=768, gdp=443.4
-- yields ratio 1.732 → 173% → Crisis band.
--
-- Bands:
--   100% ≤ ratio < 200%  →  Public Debt Warning  (the "Strained" band)
--   200% ≤ ratio < 300%  →  Debt Crisis
--   300% ≤ ratio         →  Sovereign Collapse
--
-- Bands are mutually exclusive — only one of the three rows ever
-- exists for a nation at a time. The handler enforces this.
--
-- The crises surface in the Nation card on the Administrative subtab
-- of government.html automatically via the existing adm2LoadCrises
-- pipeline (no new UI code).

-- ═══════════════════════════════════════════════════════
-- 1. Templates
-- ═══════════════════════════════════════════════════════
INSERT INTO crisis_templates (id, name, description, is_active, crisis_type)
VALUES (
  '00000000-0000-0000-0000-000000000040',
  'Public Debt Warning',
  'Debt-to-GDP has crossed 100%. Public approval, standard of living, immigration, and GDP growth are eroding under the fiscal burden.',
  false,
  'stat'
) ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_active = EXCLUDED.is_active,
      crisis_type = EXCLUDED.crisis_type;

INSERT INTO crisis_templates (id, name, description, is_active, crisis_type)
VALUES (
  '00000000-0000-0000-0000-000000000041',
  'Debt Crisis',
  'Debt-to-GDP has crossed 200%. Erosion of core indicators has accelerated as confidence in the nation''s fiscal trajectory collapses.',
  false,
  'stat'
) ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_active = EXCLUDED.is_active,
      crisis_type = EXCLUDED.crisis_type;

INSERT INTO crisis_templates (id, name, description, is_active, crisis_type)
VALUES (
  '00000000-0000-0000-0000-000000000042',
  'Sovereign Collapse',
  'Debt-to-GDP has crossed 300%. The state itself is destabilising — institutional capacity weakens while unrest, crime, and corruption rise.',
  false,
  'stat'
) ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_active = EXCLUDED.is_active,
      crisis_type = EXCLUDED.crisis_type;

-- ═══════════════════════════════════════════════════════
-- 2. Per-tick effects
-- ═══════════════════════════════════════════════════════
-- Idempotent: clear any prior effect rows for these three templates
-- before re-inserting, so re-running the migration converges.
DELETE FROM crisis_effects WHERE crisis_id IN (
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000041',
  '00000000-0000-0000-0000-000000000042'
);

-- Strained (100-200%): X stats lose 0.3/tick each.
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick, stat_floor)
VALUES
  ('00000000-0000-0000-0000-000000000040', 'nation', 'public_approval',    -0.3, NULL),
  ('00000000-0000-0000-0000-000000000040', 'nation', 'standard_of_living', -0.3, NULL),
  ('00000000-0000-0000-0000-000000000040', 'nation', 'immigration',        -0.3, NULL),
  ('00000000-0000-0000-0000-000000000040', 'nation', 'gdp_growth',         -0.3, NULL);

-- Crisis (200-300%): X stats lose 0.6/tick each.
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick, stat_floor)
VALUES
  ('00000000-0000-0000-0000-000000000041', 'nation', 'public_approval',    -0.6, NULL),
  ('00000000-0000-0000-0000-000000000041', 'nation', 'standard_of_living', -0.6, NULL),
  ('00000000-0000-0000-0000-000000000041', 'nation', 'immigration',        -0.6, NULL),
  ('00000000-0000-0000-0000-000000000041', 'nation', 'gdp_growth',         -0.6, NULL);

-- Collapse (300%+): X stats lose 0.6/tick + Y stats shift 0.4/tick toward catastrophe.
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick, stat_floor)
VALUES
  ('00000000-0000-0000-0000-000000000042', 'nation', 'public_approval',    -0.6, NULL),
  ('00000000-0000-0000-0000-000000000042', 'nation', 'standard_of_living', -0.6, NULL),
  ('00000000-0000-0000-0000-000000000042', 'nation', 'immigration',        -0.6, NULL),
  ('00000000-0000-0000-0000-000000000042', 'nation', 'gdp_growth',         -0.6, NULL),
  ('00000000-0000-0000-0000-000000000042', 'nation', 'state_apparatus',    -0.4, NULL),
  ('00000000-0000-0000-0000-000000000042', 'nation', 'unrest',              0.4, NULL),
  ('00000000-0000-0000-0000-000000000042', 'nation', 'crime',               0.4, NULL),
  ('00000000-0000-0000-0000-000000000042', 'nation', 'corruption',          0.4, NULL);

-- No crisis_triggers / crisis_end_triggers rows: activation and end
-- are owned by processDebtToGdpBands in the tick handler. PostgREST
-- doesn't need to know about that — it just serves the templates +
-- effects + active_crises rows the handler maintains.

NOTIFY pgrst, 'reload schema';
