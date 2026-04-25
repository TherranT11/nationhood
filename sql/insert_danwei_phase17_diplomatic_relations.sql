-- ============================================================
-- Danwei diplomatic relations — Phase 17 of new-nation walkthrough
-- ============================================================
-- Fans out one neutral relationship row from Danwei to every
-- existing nation. Run AFTER insert_danwei.sql (Phase 2) so the
-- nations row exists. Idempotent — INSERT … ON CONFLICT DO NOTHING.
--
-- Relationship defaults (all schema defaults, set explicitly so the
-- intent is auditable):
--   - relation_type     = 'neutral'
--   - relation_score    = 30  (neutral)
--   - embassy_status_a/b = 'open'
--   - active_treaties   = '[]'
--
-- Proximity (0 = bordering, 100 = far). Faresia is a new third
-- continent across the ocean from Meridian/Crucera/Flandis. Per-pair
-- distances reflect specific lore-anchored geography:
--
--   Hajjara         65   (closest — eastern Meridian, near Faresia)
--   Vostia          71
--   Dravka          71
--   Calveth         73
--   Flandis         75
--   Avelia          91   (Crucera mainland — far)
--   Sierramar       93
--   San Estrella    92
--   Melizea         92
--   Montequilla     93
--   Palvera         94
--   Sangreza        95   (farthest — opposite-corner Crucera)
--
-- Pattern matches insert_sierramar.sql / insert_vostia.sql canonical
-- (LEAST, GREATEST) ordering so the (a, b) pair is unique per the
-- schema's implicit constraint.
-- ============================================================

INSERT INTO diplomatic_relations (
    nation_a_id, nation_b_id, relation_type, relation_score, proximity
)
SELECT
    LEAST(dw.id, n.id),
    GREATEST(dw.id, n.id),
    'neutral',
    30,
    CASE LOWER(n.name)
        WHEN 'hajjara'      THEN 65
        WHEN 'vostia'       THEN 71
        WHEN 'dravka'       THEN 71
        WHEN 'calveth'      THEN 73
        WHEN 'flandis'      THEN 75
        WHEN 'avelia'       THEN 91
        WHEN 'sierramar'    THEN 93
        WHEN 'san estrella' THEN 92
        WHEN 'melizea'      THEN 92
        WHEN 'montequilla'  THEN 93
        WHEN 'palvera'      THEN 94
        WHEN 'sangreza'     THEN 95
        ELSE 90  -- safety default for any future nation seeded before this script
    END
FROM nations dw
CROSS JOIN nations n
WHERE LOWER(dw.name) = 'danwei'
  AND n.id != dw.id
ON CONFLICT (nation_a_id, nation_b_id) DO NOTHING;

-- Verify: every Danwei pair, sorted by proximity (closest first).
SELECT
    na.name              AS nation_a,
    nb.name              AS nation_b,
    dr.relation_type,
    dr.relation_score,
    dr.proximity,
    CASE
        WHEN dr.proximity = 0  THEN 'Bordering'
        WHEN dr.proximity <= 30 THEN 'Near'
        WHEN dr.proximity <= 60 THEN 'Moderate'
        WHEN dr.proximity <= 80 THEN 'Far'
        ELSE                        'Very Far'
    END                  AS distance_label
  FROM diplomatic_relations dr
  JOIN nations na ON na.id = dr.nation_a_id
  JOIN nations nb ON nb.id = dr.nation_b_id
 WHERE LOWER(na.name) = 'danwei'
    OR LOWER(nb.name) = 'danwei'
 ORDER BY dr.proximity ASC;

-- Sanity check: row count must equal (active nations - 1).
SELECT
    (SELECT COUNT(*) FROM nations WHERE LOWER(name) != 'danwei')           AS expected,
    (SELECT COUNT(*) FROM diplomatic_relations dr
        WHERE dr.nation_a_id = (SELECT id FROM nations WHERE LOWER(name) = 'danwei')
           OR dr.nation_b_id = (SELECT id FROM nations WHERE LOWER(name) = 'danwei')) AS actual;
