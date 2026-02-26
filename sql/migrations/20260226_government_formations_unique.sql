-- Prevent duplicate active government formation proposals from the same faction.
-- One faction can only have one active proposal per election at a time.

-- Step 1: Clean up existing duplicates — keep the oldest, delete the rest
DELETE FROM government_formations
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY election_id, proposed_by ORDER BY created_at ASC) AS rn
        FROM government_formations
        WHERE status = 'active'
    ) ranked
    WHERE rn > 1
);

-- Step 2: Partial unique index — only one active proposal per faction per election
CREATE UNIQUE INDEX IF NOT EXISTS uq_formation_active_proposer
    ON government_formations (election_id, proposed_by)
    WHERE status = 'active';
