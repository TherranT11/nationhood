-- ══════════════════════════════════════════════════════════════════════
-- Fix proximity scale: 0 = bordering, 100 = far away
-- Sets all nation-pair proximity values definitively.
-- Also ensures diplomatic_relations rows exist for ALL nation pairs.
-- ══════════════════════════════════════════════════════════════════════

-- Step 0: Ensure every nation pair has a diplomatic_relations row (default relation_score=30)
INSERT INTO diplomatic_relations (nation_a_id, nation_b_id)
SELECT LEAST(a.id, b.id), GREATEST(a.id, b.id)
FROM nations a
CROSS JOIN nations b
WHERE a.id < b.id
ON CONFLICT (nation_a_id, nation_b_id) DO NOTHING;

-- ── BORDERING NATIONS (proximity = 0) ──
-- Crucera mainland neighbors that share direct land/maritime borders

-- Avelia ↔ Melizea
UPDATE diplomatic_relations SET proximity = 0
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'melizea'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'melizea'));

-- Avelia ↔ San Estrella
UPDATE diplomatic_relations SET proximity = 0
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'));

-- Avelia ↔ Montequilla
UPDATE diplomatic_relations SET proximity = 0
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'));

-- Melizea ↔ Montequilla
UPDATE diplomatic_relations SET proximity = 0
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'));

-- San Estrella ↔ Sangreza
UPDATE diplomatic_relations SET proximity = 0
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'san estrella'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'san estrella'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));

-- San Estrella ↔ Montequilla
UPDATE diplomatic_relations SET proximity = 0
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'san estrella'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'san estrella'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'));

-- Sangreza ↔ Montequilla
UPDATE diplomatic_relations SET proximity = 0
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'sangreza'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'sangreza'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'));

-- Melizea ↔ Palvera
UPDATE diplomatic_relations SET proximity = 0
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));

-- Montequilla ↔ Palvera
UPDATE diplomatic_relations SET proximity = 0
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'montequilla'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'montequilla'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));

-- Sangreza ↔ Palvera
UPDATE diplomatic_relations SET proximity = 0
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'sangreza'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'sangreza'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));


-- ── NON-BORDERING MAINLAND (proximity = 80) ──
-- Same continent but no shared border

-- Avelia ↔ Sangreza
UPDATE diplomatic_relations SET proximity = 80
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));

-- Melizea ↔ San Estrella
UPDATE diplomatic_relations SET proximity = 80
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'));

-- Melizea ↔ Sangreza
UPDATE diplomatic_relations SET proximity = 80
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));

-- Avelia ↔ Palvera
UPDATE diplomatic_relations SET proximity = 80
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));

-- San Estrella ↔ Palvera
UPDATE diplomatic_relations SET proximity = 80
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'san estrella'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'san estrella'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));


-- ── OVERSEAS NATIONS (Calveth — island nation, far from everyone) ──

-- Calveth ↔ San Estrella (72 — closest mainland)
UPDATE diplomatic_relations SET proximity = 72
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'));

-- Calveth ↔ Avelia (75)
UPDATE diplomatic_relations SET proximity = 75
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'avelia'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'avelia'));

-- Calveth ↔ Montequilla (78)
UPDATE diplomatic_relations SET proximity = 78
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'));

-- Calveth ↔ Melizea (80)
UPDATE diplomatic_relations SET proximity = 80
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'melizea'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'melizea'));

-- Calveth ↔ Sangreza (82)
UPDATE diplomatic_relations SET proximity = 82
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));

-- Calveth ↔ Palvera (85 — far southwest, opposite corner)
UPDATE diplomatic_relations SET proximity = 85
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'calveth'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));


-- ── OVERSEAS NATIONS (Flandis — island nation, set distances) ──

-- Flandis ↔ Avelia (70 — closest mainland)
UPDATE diplomatic_relations SET proximity = 70
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'flandis'), (SELECT id FROM nations WHERE LOWER(name) = 'avelia'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'flandis'), (SELECT id FROM nations WHERE LOWER(name) = 'avelia'));

-- Flandis ↔ Melizea (73)
UPDATE diplomatic_relations SET proximity = 73
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'flandis'), (SELECT id FROM nations WHERE LOWER(name) = 'melizea'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'flandis'), (SELECT id FROM nations WHERE LOWER(name) = 'melizea'));

-- Flandis ↔ San Estrella (76)
UPDATE diplomatic_relations SET proximity = 76
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'flandis'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'flandis'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'));

-- Flandis ↔ Montequilla (78)
UPDATE diplomatic_relations SET proximity = 78
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'flandis'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'flandis'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'));

-- Flandis ↔ Sangreza (82)
UPDATE diplomatic_relations SET proximity = 82
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'flandis'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'flandis'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));

-- Flandis ↔ Palvera (84)
UPDATE diplomatic_relations SET proximity = 84
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'flandis'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'flandis'), (SELECT id FROM nations WHERE LOWER(name) = 'palvera'));

-- Flandis ↔ Calveth (15 — both island nations, close neighbors)
UPDATE diplomatic_relations SET proximity = 15
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'flandis'), (SELECT id FROM nations WHERE LOWER(name) = 'calveth'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'flandis'), (SELECT id FROM nations WHERE LOWER(name) = 'calveth'));


-- ── VERIFY ──
SELECT
    na.name AS nation_a,
    nb.name AS nation_b,
    dr.proximity AS distance,
    CASE
        WHEN dr.proximity = 0 THEN 'Bordering'
        WHEN dr.proximity <= 30 THEN 'Near'
        WHEN dr.proximity <= 60 THEN 'Moderate'
        WHEN dr.proximity <= 80 THEN 'Far'
        ELSE 'Very Far'
    END AS label
FROM diplomatic_relations dr
JOIN nations na ON dr.nation_a_id = na.id
JOIN nations nb ON dr.nation_b_id = nb.id
ORDER BY dr.proximity ASC, na.name, nb.name;
