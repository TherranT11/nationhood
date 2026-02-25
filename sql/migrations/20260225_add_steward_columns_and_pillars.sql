-- Add new steward columns for the expanded steward system.
-- New stats: estimated_loyalty, personal_wealth, exit_readiness
-- Lifecycle tracking: is_alive, created_at_tick, died_at_tick

ALTER TABLE stewards ADD COLUMN IF NOT EXISTS estimated_loyalty INTEGER NOT NULL DEFAULT 55;
ALTER TABLE stewards ADD COLUMN IF NOT EXISTS personal_wealth NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE stewards ADD COLUMN IF NOT EXISTS exit_readiness INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stewards ADD COLUMN IF NOT EXISTS is_alive BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE stewards ADD COLUMN IF NOT EXISTS created_at_tick INTEGER;
ALTER TABLE stewards ADD COLUMN IF NOT EXISTS died_at_tick INTEGER;

-- Update default values for standing and power_base on existing rows
-- (new spec: standing starts at 50, power_base starts at 20)
-- Only update rows that still have old defaults (40 and 30)

-- Add 2 new pillars: Foreign Patrons and Religious Establishment
-- These are seeded for all existing autocracy nations.
INSERT INTO regime_pillars (nation_id, pillar_key, pillar_name, support)
SELECT n.id, p.pillar_key, p.pillar_name,
       55 + floor(random() * 31)::int  -- random 55-85
FROM nations n
CROSS JOIN (VALUES
    ('foreign_patrons', 'Foreign Patrons'),
    ('religious',       'Religious Establishment')
) AS p(pillar_key, pillar_name)
WHERE n.government_type ILIKE '%autocra%'
   OR n.government_type ILIKE '%authoritarian%'
   OR n.government_type ILIKE '%dictat%'
   OR n.government_type ILIKE '%junta%'
ON CONFLICT (nation_id, pillar_key) DO NOTHING;
