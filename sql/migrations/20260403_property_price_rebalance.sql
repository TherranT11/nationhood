-- Rebalance property prices: ~$100M per 1,000 employees (base)
-- Formula: capacity × $100,000 × style_multiplier
-- Style multipliers: Basic=1.0, Modern=1.4, Sustainable=1.6, Innovative=2.0, Heritage=1.3, Premium=2.5
-- Maintenance: ~0.7% of cost per month

UPDATE property_catalog SET
  base_cost = capacity * 100000 * CASE style
    WHEN 'Basic' THEN 1.0
    WHEN 'Modern' THEN 1.4
    WHEN 'Sustainable' THEN 1.6
    WHEN 'Innovative' THEN 2.0
    WHEN 'Heritage' THEN 1.3
    WHEN 'Premium' THEN 2.5
    ELSE 1.0
  END,
  base_maintenance = ROUND(capacity * 100000 * CASE style
    WHEN 'Basic' THEN 1.0
    WHEN 'Modern' THEN 1.4
    WHEN 'Sustainable' THEN 1.6
    WHEN 'Innovative' THEN 2.0
    WHEN 'Heritage' THEN 1.3
    WHEN 'Premium' THEN 2.5
    ELSE 1.0
  END * 0.007);

-- Sustainable gets 0.8× maintenance (green buildings save money)
UPDATE property_catalog SET base_maintenance = ROUND(base_maintenance * 0.8) WHERE style = 'Sustainable';

-- Heritage gets 1.3× maintenance (old buildings need more upkeep)
UPDATE property_catalog SET base_maintenance = ROUND(base_maintenance * 1.3) WHERE style = 'Heritage';
