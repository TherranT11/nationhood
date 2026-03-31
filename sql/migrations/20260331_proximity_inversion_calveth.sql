-- ══════════════════════════════════════════════════════════════════════
-- Proximity Scale Inversion: 0 = bordering, 100 = far away
-- Previously: 100 = bordering, 0 = far. This migration inverts all values.
-- Formula: new_value = 100 - old_value
-- Also adds Calveth's proximity to all other nations.
-- ══════════════════════════════════════════════════════════════════════

-- Step 1: Invert ALL existing proximity values (100 - current)
UPDATE diplomatic_relations
SET proximity = 100 - COALESCE(proximity, 50);

-- Step 2: Set Calveth's distances to all nations
-- (You may adjust these values — 0 = bordering, 80 = far, 50 = moderate)

-- Calveth borders: Avelia (0 = bordering)
UPDATE diplomatic_relations SET proximity = 0
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'avelia'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'avelia'));

-- Calveth borders: Sangreza (0 = bordering)
UPDATE diplomatic_relations SET proximity = 0
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));

-- Calveth moderate distance: Montequilla (40)
UPDATE diplomatic_relations SET proximity = 40
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'));

-- Calveth moderate distance: San Estrella (50)
UPDATE diplomatic_relations SET proximity = 50
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'));

-- Calveth far: Melizea (70)
UPDATE diplomatic_relations SET proximity = 70
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'melizea'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'melizea'));

-- Calveth far: Palvera (80)
UPDATE diplomatic_relations SET proximity = 80
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));

-- Step 3: Verify all proximity values
SELECT
    na.name AS nation_a,
    nb.name AS nation_b,
    dr.proximity AS distance,
    CASE
        WHEN dr.proximity <= 10 THEN 'Bordering'
        WHEN dr.proximity <= 30 THEN 'Near'
        WHEN dr.proximity <= 60 THEN 'Moderate'
        WHEN dr.proximity <= 80 THEN 'Far'
        ELSE 'Very Far'
    END AS label
FROM diplomatic_relations dr
JOIN nations na ON dr.nation_a_id = na.id
JOIN nations nb ON dr.nation_b_id = nb.id
ORDER BY na.name, nb.name;
