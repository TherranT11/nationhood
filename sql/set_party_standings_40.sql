-- Set all party standings to 40% baseline in democratic nations
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pbumjalxclmegzckhqqr/sql

-- Step 1: Update factions.approval_rating for democratic nations
UPDATE factions
SET approval_rating = 40
WHERE nation_id IN (
    SELECT id FROM nations WHERE government_type IN ('Democracy', 'Presidential')
);

-- Step 2: Update per-bloc approval scores so derived approval also reflects 40%
UPDATE faction_bloc_approval
SET approval = 40
WHERE faction_id IN (
    SELECT f.id FROM factions f
    JOIN nations n ON f.nation_id = n.id
    WHERE n.government_type IN ('Democracy', 'Presidential')
);
