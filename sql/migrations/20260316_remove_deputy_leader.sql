-- Remove Deputy Leader role entirely.
-- Party Whip remains as a static name-only position (no candidates, no traits).

-- Drop deputy columns from factions
ALTER TABLE factions
    DROP COLUMN IF EXISTS deputy_first_name,
    DROP COLUMN IF EXISTS deputy_last_name,
    DROP COLUMN IF EXISTS deputy_age;

-- Remove persisted deputy and whip candidates (whip no longer uses candidate system)
DELETE FROM leadership_candidates WHERE role IN ('deputy', 'whip');

-- Update the role constraint on leadership_candidates to only allow 'leader'
ALTER TABLE leadership_candidates
    DROP CONSTRAINT IF EXISTS leadership_candidates_role_check;

ALTER TABLE leadership_candidates
    ADD CONSTRAINT leadership_candidates_role_check CHECK (role IN ('leader'));
