-- Migration: Backfill missing faction_ideology rows & reset stale preference_scores
--
-- Parties without a faction_ideology row get ideoScore=50 for every bloc,
-- locking preference_score at 50 permanently. This migration:
--   1. Seeds ideology axes from declared ideology values (±30 per axis)
--   2. Backfills centrist (all-zero) rows for parties with no declarations
--   3. Resets preference_score so the tick processor recalculates on next tick

-- ── Step 1: Seed from declared ideologies ──
-- Parties that chose ideology_value_1 / ideology_value_2 at creation get
-- meaningful axis positions. ON CONFLICT DO NOTHING preserves existing
-- rows from player actions (Take a Stand, Double Down).

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
    (CASE UPPER(f.ideology_value_1) WHEN 'LIBERTY' THEN -30 WHEN 'EQUALITY' THEN 30 ELSE 0 END)
  + (CASE UPPER(f.ideology_value_2) WHEN 'LIBERTY' THEN -30 WHEN 'EQUALITY' THEN 30 ELSE 0 END),

    (CASE UPPER(f.ideology_value_1) WHEN 'TRADITION' THEN -30 WHEN 'PROGRESS' THEN 30 ELSE 0 END)
  + (CASE UPPER(f.ideology_value_2) WHEN 'TRADITION' THEN -30 WHEN 'PROGRESS' THEN 30 ELSE 0 END),

    (CASE UPPER(f.ideology_value_1) WHEN 'SECURITY' THEN -30 WHEN 'FREEDOM' THEN 30 ELSE 0 END)
  + (CASE UPPER(f.ideology_value_2) WHEN 'SECURITY' THEN -30 WHEN 'FREEDOM' THEN 30 ELSE 0 END),

    (CASE UPPER(f.ideology_value_1) WHEN 'GLOBALISM' THEN -30 WHEN 'NATIONALISM' THEN 30 ELSE 0 END)
  + (CASE UPPER(f.ideology_value_2) WHEN 'GLOBALISM' THEN -30 WHEN 'NATIONALISM' THEN 30 ELSE 0 END),

    (CASE UPPER(f.ideology_value_1) WHEN 'INDIVIDUALISM' THEN -30 WHEN 'COLLECTIVISM' THEN 30 ELSE 0 END)
  + (CASE UPPER(f.ideology_value_2) WHEN 'INDIVIDUALISM' THEN -30 WHEN 'COLLECTIVISM' THEN 30 ELSE 0 END)
FROM factions f
WHERE f.faction_type = 'party'
  AND (f.ideology_value_1 IS NOT NULL OR f.ideology_value_2 IS NOT NULL)
ON CONFLICT (faction_id) DO NOTHING;

-- ── Step 2: Backfill centrist rows for parties with no declarations ──
-- Catches parties that had neither ideology_value_1 nor ideology_value_2.

INSERT INTO faction_ideology (faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism)
SELECT f.id, 0, 0, 0, 0, 0
FROM factions f
LEFT JOIN faction_ideology fi ON fi.faction_id = f.id
WHERE fi.faction_id IS NULL
  AND f.faction_type = 'party'
ON CONFLICT (faction_id) DO NOTHING;

-- ── Step 3: Reset stale preference_scores ──
-- Any faction_bloc_approval row stuck at exactly 50 with zero momentum
-- is likely stale from the missing-ideology bug. Reset to 0 so the tick
-- processor recalculates with the correct three-pillar formula.

UPDATE faction_bloc_approval
SET preference_score = 0
WHERE preference_score = 50
  AND (momentum IS NULL OR momentum = 0);
