-- Seed faction_ideology scores from each party's declared ideologies.
-- Each declared ideology (ideology_value_1, ideology_value_2) gets 30
-- in its direction on the corresponding axis. Undeclared axes stay 0.
-- Uses UPSERT so it works whether or not a faction_ideology row exists.
-- Run in Supabase SQL editor.

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

    -- liberty_equality: LIBERTY → -30, EQUALITY → +30
      (CASE UPPER(f.ideology_value_1) WHEN 'LIBERTY' THEN -30 WHEN 'EQUALITY' THEN 30 ELSE 0 END)
    + (CASE UPPER(f.ideology_value_2) WHEN 'LIBERTY' THEN -30 WHEN 'EQUALITY' THEN 30 ELSE 0 END),

    -- tradition_progress: TRADITION → -30, PROGRESS → +30
      (CASE UPPER(f.ideology_value_1) WHEN 'TRADITION' THEN -30 WHEN 'PROGRESS' THEN 30 ELSE 0 END)
    + (CASE UPPER(f.ideology_value_2) WHEN 'TRADITION' THEN -30 WHEN 'PROGRESS' THEN 30 ELSE 0 END),

    -- security_freedom: SECURITY → -30, FREEDOM → +30
      (CASE UPPER(f.ideology_value_1) WHEN 'SECURITY' THEN -30 WHEN 'FREEDOM' THEN 30 ELSE 0 END)
    + (CASE UPPER(f.ideology_value_2) WHEN 'SECURITY' THEN -30 WHEN 'FREEDOM' THEN 30 ELSE 0 END),

    -- globalism_nationalism: GLOBALISM → -30, NATIONALISM → +30
      (CASE UPPER(f.ideology_value_1) WHEN 'GLOBALISM' THEN -30 WHEN 'NATIONALISM' THEN 30 ELSE 0 END)
    + (CASE UPPER(f.ideology_value_2) WHEN 'GLOBALISM' THEN -30 WHEN 'NATIONALISM' THEN 30 ELSE 0 END),

    -- individualism_collectivism: INDIVIDUALISM → -30, COLLECTIVISM → +30
      (CASE UPPER(f.ideology_value_1) WHEN 'INDIVIDUALISM' THEN -30 WHEN 'COLLECTIVISM' THEN 30 ELSE 0 END)
    + (CASE UPPER(f.ideology_value_2) WHEN 'INDIVIDUALISM' THEN -30 WHEN 'COLLECTIVISM' THEN 30 ELSE 0 END)

FROM factions f
WHERE f.faction_type = 'party'
  AND (f.ideology_value_1 IS NOT NULL OR f.ideology_value_2 IS NOT NULL)
ON CONFLICT (faction_id) DO UPDATE SET
    liberty_equality          = EXCLUDED.liberty_equality,
    tradition_progress        = EXCLUDED.tradition_progress,
    security_freedom          = EXCLUDED.security_freedom,
    globalism_nationalism     = EXCLUDED.globalism_nationalism,
    individualism_collectivism = EXCLUDED.individualism_collectivism;
