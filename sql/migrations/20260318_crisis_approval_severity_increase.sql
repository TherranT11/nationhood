-- Increase crisis government_approval penalties.
-- Previous rebalance reduced all crises to -0.5/-1.0, which was too gentle.
-- With the events decay (10%/tick), these mild penalties reach equilibrium
-- around -5 to -10, meaning crises barely dent government approval.
--
-- New values make crises genuinely threatening to government survival.

-- Hyperinflation Emergency: -1.0 → -2.5 (most severe economic crisis)
UPDATE crisis_effects
SET change_per_tick = -2.5
WHERE target = 'government_approval'
  AND crisis_id = (
    SELECT id FROM crisis_templates WHERE name = 'Hyperinflation Emergency' LIMIT 1
  );

-- Sovereign Debt Crisis: -0.5 → -1.5
UPDATE crisis_effects
SET change_per_tick = -1.5
WHERE target = 'government_approval'
  AND crisis_id = (
    SELECT id FROM crisis_templates WHERE name = 'Sovereign Debt Crisis' LIMIT 1
  );

-- Currency Collapse: -0.5 → -2.0
UPDATE crisis_effects
SET change_per_tick = -2.0
WHERE target = 'government_approval'
  AND crisis_id = (
    SELECT id FROM crisis_templates WHERE name = 'Currency Collapse' LIMIT 1
  );

-- Sovereign Default: -0.5 → -1.5
UPDATE crisis_effects
SET change_per_tick = -1.5
WHERE target = 'government_approval'
  AND crisis_id = (
    SELECT id FROM crisis_templates WHERE name = 'Sovereign Default Crisis' LIMIT 1
  );

-- Economic Collapse: -0.5 → -2.0
UPDATE crisis_effects
SET change_per_tick = -2.0
WHERE target = 'government_approval'
  AND crisis_id = (
    SELECT id FROM crisis_templates WHERE name = 'Economic Collapse' LIMIT 1
  );
