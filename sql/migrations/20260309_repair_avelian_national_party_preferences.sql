-- Migration: Repair stuck preference_scores for Avelian National Party
-- Faction ID: 67bd70f7-1e49-41c4-986b-4634688037a3
--
-- Root cause: faction_bloc_approval rows were seeded with preference_score=40
-- (the default from ensureBlocApprovals) but the three-pillar engine's per-row
-- UPDATE was silently failing — PostgREST returns success even when 0 rows
-- are matched, so no error was ever raised.
--
-- This migration:
--   1. Ensures faction_ideology row exists with proper values
--   2. Deletes orphaned faction_bloc_approval rows (stale bloc_ids)
--   3. Deletes ALL faction_bloc_approval rows for this faction (nuclear reset)
--   4. Re-seeds fresh rows from active voter_blocs
--   5. The next tick's three-pillar calculation will compute proper values

-- ── Step 1: Ensure faction_ideology row exists ──
-- If missing, seed from declared ideology values. If already exists, leave it.
INSERT INTO faction_ideology (
    faction_id,
    liberty_equality,
    tradition_progress,
    security_freedom,
    globalism_nationalism,
    individualism_collectivism
)
SELECT
    f.id,
    COALESCE(
        (CASE UPPER(f.ideology_value_1) WHEN 'LIBERTY' THEN -30 WHEN 'EQUALITY' THEN 30 ELSE 0 END) +
        (CASE UPPER(f.ideology_value_2) WHEN 'LIBERTY' THEN -30 WHEN 'EQUALITY' THEN 30 ELSE 0 END), 0),
    COALESCE(
        (CASE UPPER(f.ideology_value_1) WHEN 'TRADITION' THEN -30 WHEN 'PROGRESS' THEN 30 ELSE 0 END) +
        (CASE UPPER(f.ideology_value_2) WHEN 'TRADITION' THEN -30 WHEN 'PROGRESS' THEN 30 ELSE 0 END), 0),
    COALESCE(
        (CASE UPPER(f.ideology_value_1) WHEN 'SECURITY' THEN -30 WHEN 'FREEDOM' THEN 30 ELSE 0 END) +
        (CASE UPPER(f.ideology_value_2) WHEN 'SECURITY' THEN -30 WHEN 'FREEDOM' THEN 30 ELSE 0 END), 0),
    COALESCE(
        (CASE UPPER(f.ideology_value_1) WHEN 'GLOBALISM' THEN -30 WHEN 'NATIONALISM' THEN 30 ELSE 0 END) +
        (CASE UPPER(f.ideology_value_2) WHEN 'GLOBALISM' THEN -30 WHEN 'NATIONALISM' THEN 30 ELSE 0 END), 0),
    COALESCE(
        (CASE UPPER(f.ideology_value_1) WHEN 'INDIVIDUALISM' THEN -30 WHEN 'COLLECTIVISM' THEN 30 ELSE 0 END) +
        (CASE UPPER(f.ideology_value_2) WHEN 'INDIVIDUALISM' THEN -30 WHEN 'COLLECTIVISM' THEN 30 ELSE 0 END), 0)
FROM factions f
WHERE f.id = '67bd70f7-1e49-41c4-986b-4634688037a3'
ON CONFLICT (faction_id) DO NOTHING;

-- ── Step 2: Nuclear reset — delete all faction_bloc_approval rows ──
DELETE FROM faction_bloc_approval
WHERE faction_id = '67bd70f7-1e49-41c4-986b-4634688037a3';

-- ── Step 3: Re-seed from active voter_blocs ──
-- Sets preference_score to 0 (not 40) so the three-pillar engine's stuck-row
-- detection won't re-trigger, and the first calculation will write fresh values.
INSERT INTO faction_bloc_approval (faction_id, bloc_id, preference_score, ideology_alignment, momentum, vote_share)
SELECT
    '67bd70f7-1e49-41c4-986b-4634688037a3',
    vb.id,
    0,    -- Will be recalculated on next tick
    0,    -- Will be recalculated on next tick
    0,    -- Fresh start
    0     -- Will be recalculated on next tick
FROM voter_blocs vb
WHERE vb.nation_id = (
    SELECT nation_id FROM factions WHERE id = '67bd70f7-1e49-41c4-986b-4634688037a3'
)
AND vb.is_active = true
ON CONFLICT (faction_id, bloc_id) DO UPDATE SET
    preference_score = 0,
    ideology_alignment = 0,
    momentum = 0,
    vote_share = 0;

-- ── Step 4: Also fix any other factions with the same stuck pattern ──
-- Broader sweep: reset any faction_bloc_approval row that's stuck at seed defaults.
UPDATE faction_bloc_approval
SET
    preference_score = 0,
    ideology_alignment = 0,
    vote_share = 0
WHERE preference_score = 40
  AND ideology_alignment = 50
  AND (vote_share = 0 OR vote_share IS NULL);
