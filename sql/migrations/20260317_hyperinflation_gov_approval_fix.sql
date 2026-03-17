-- Fix Hyperinflation Emergency: government_approval effect from -2 to -1 per tick
-- The crisis was applying too harsh a government approval penalty.

UPDATE crisis_effects
SET change_per_tick = -1
WHERE target = 'government_approval'
  AND change_per_tick IN (-2, 1, 2)  -- catch both the intended -2 and any stale +1 value
  AND crisis_id = (
    SELECT id FROM crisis_templates WHERE name = 'Hyperinflation Emergency' LIMIT 1
  );
