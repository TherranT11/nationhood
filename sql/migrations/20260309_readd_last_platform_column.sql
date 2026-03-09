-- Re-add last_platform JSONB column to faction_bloc_approval.
-- Previously dropped in 20260219 as unused. Now needed by narrative actions
-- (Champion, Build a Bridge) to store per-faction-bloc platform state that
-- the tick processor reads for ongoing effects (2x governance amplification,
-- bridge expiry/boost, etc.).

ALTER TABLE faction_bloc_approval
    ADD COLUMN IF NOT EXISTS last_platform JSONB DEFAULT '{}'::JSONB;
