-- ============================================================
-- Setup Palvera diplomatic relations & proximity
-- ============================================================
-- Creates diplomatic_relations rows for all 5 Palvera pairs
-- and sets proximity values.
-- ============================================================

-- Step 1: Create diplomatic_relations rows for Palvera ↔ each nation
INSERT INTO diplomatic_relations (nation_a_id, nation_b_id)
SELECT LEAST(p.id, other.id), GREATEST(p.id, other.id)
FROM nations p
CROSS JOIN nations other
WHERE LOWER(p.name) = 'palvera'
  AND LOWER(other.name) != 'palvera'
  AND p.id != other.id
ON CONFLICT (nation_a_id, nation_b_id) DO NOTHING;

-- Step 2: Set proximity values

-- Bordering nations (100)
UPDATE diplomatic_relations SET proximity = 100
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));

UPDATE diplomatic_relations SET proximity = 100
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'montequilla'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'montequilla'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));

UPDATE diplomatic_relations SET proximity = 100
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'sangreza'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'sangreza'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));

-- Non-bordering nations (20)
UPDATE diplomatic_relations SET proximity = 20
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));

UPDATE diplomatic_relations SET proximity = 20
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'san estrella'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'san estrella'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));

-- Step 3: Verify
SELECT
    na.name AS nation_a,
    nb.name AS nation_b,
    dr.proximity,
    dr.relation_score
FROM diplomatic_relations dr
JOIN nations na ON na.id = dr.nation_a_id
JOIN nations nb ON nb.id = dr.nation_b_id
WHERE na.id = (SELECT id FROM nations WHERE LOWER(name) = 'palvera')
   OR nb.id = (SELECT id FROM nations WHERE LOWER(name) = 'palvera')
ORDER BY dr.proximity DESC;
