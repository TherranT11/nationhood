-- ══════════════════════════════════════════════════════════════════════
-- Proximity Scale Inversion: 0 = bordering, 100 = far away
-- Previously: 100 = bordering, 0 = far. This migration inverts all values.
-- Formula: new_value = 100 - old_value
-- Also sets Calveth's distances to all other nations.
-- ══════════════════════════════════════════════════════════════════════

-- Step 1: Invert ALL existing proximity values (100 - current)
UPDATE diplomatic_relations
SET proximity = 100 - COALESCE(proximity, 50);

-- Step 2: Set Calveth distances (island nation, far northeast — overseas from everyone)
-- Scale: 0 = bordering, 100 = far away

-- San Estrella (72) — closest mainland, northeast coast faces Calveth
UPDATE diplomatic_relations SET proximity = 72
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'));

-- Avelia (75) — northeastern mainland, slightly further inland
UPDATE diplomatic_relations SET proximity = 75
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'avelia'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'avelia'));

-- Montequilla (78) — central mainland
UPDATE diplomatic_relations SET proximity = 78
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'));

-- Melizea (80) — western mainland
UPDATE diplomatic_relations SET proximity = 80
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'melizea'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'melizea'));

-- Sangreza (82) — southern mainland, long ocean route
UPDATE diplomatic_relations SET proximity = 82
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));

-- Palvera (85) — far southwest, opposite corner of the map
UPDATE diplomatic_relations SET proximity = 85
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
