-- Rebalance government_approval drops for Sovereign Debt Crisis and Currency Collapse
-- Both should drop at -0.5/tick to match the standard crisis penalty.
-- Sovereign Default already at -0.5, Hyperinflation stays at -1.0 (unique).

-- Sovereign Debt Crisis: government_approval from -1.0 to -0.5
UPDATE crisis_effects
SET change_per_tick = -0.5
WHERE target = 'government_approval'
  AND crisis_id = (
    SELECT id FROM crisis_templates WHERE name = 'Sovereign Debt Crisis' LIMIT 1
  );

-- Currency Collapse: government_approval from -1.5 to -0.5
UPDATE crisis_effects
SET change_per_tick = -0.5
WHERE target = 'government_approval'
  AND crisis_id = (
    SELECT id FROM crisis_templates WHERE name = 'Currency Collapse' LIMIT 1
  );
