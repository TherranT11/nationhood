-- Set all party standings to randomized baseline (30-50%) in democratic nations
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pbumjalxclmegzckhqqr/sql

-- Step 1: Update factions.approval_rating for democratic nations (base 40)
UPDATE factions
SET approval_rating = 40
WHERE nation_id IN (
    SELECT id FROM nations WHERE government_type IN ('Democracy', 'Presidential')
);

-- Step 2: Randomize per-bloc approval ±10 around baseline 40 so the first election isn't a flat tie
UPDATE faction_bloc_approval
SET approval = 30 + floor(random() * 21)   -- random integer 30..50
WHERE faction_id IN (
    SELECT f.id FROM factions f
    JOIN nations n ON f.nation_id = n.id
    WHERE n.government_type IN ('Democracy', 'Presidential')
);

-- Step 3: Recalculate derived approval_rating from the now-randomized per-bloc values
-- (Weighted average: sum(approval × population_weight) / 100)
UPDATE factions f
SET approval_rating = sub.derived
FROM (
    SELECT fba.faction_id,
           ROUND(SUM(fba.approval * vb.population_weight) / 100) AS derived
    FROM faction_bloc_approval fba
    JOIN voter_blocs vb ON vb.id = fba.bloc_id
    WHERE vb.is_active = true
    GROUP BY fba.faction_id
) sub
WHERE f.id = sub.faction_id
  AND f.nation_id IN (
      SELECT id FROM nations WHERE government_type IN ('Democracy', 'Presidential')
  );
