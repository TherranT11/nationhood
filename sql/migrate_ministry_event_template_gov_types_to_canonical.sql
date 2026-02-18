-- One-time data migration: normalize ministry_event_templates.gov_types to canonical values.
-- Canonical set: Democracy, Autocracy, Presidential

BEGIN;

-- 1) Pre-migration audit: distinct nation government types currently present.
SELECT DISTINCT n.government_type
FROM nations n
ORDER BY 1;

-- 1) Pre-migration audit: distinct template government types currently present.
SELECT DISTINCT t.gov_type
FROM ministry_event_templates met
CROSS JOIN LATERAL unnest(COALESCE(met.gov_types, ARRAY[]::text[])) AS t(gov_type)
ORDER BY 1;

-- 2) Rewrite legacy ministry_event_templates.gov_types values to canonical exact strings.
-- Example mappings (explicit):
--   democratic / parliamentary democracy / parliamentarian -> Democracy
--   authoritarian / dictatorship / military junta       -> Autocracy
--   presidential republic / executive presidency         -> Presidential
WITH gov_type_map AS (
    SELECT *
    FROM (VALUES
        ('democracy', 'Democracy'),
        ('democratic', 'Democracy'),
        ('parliamentary', 'Democracy'),
        ('parliamentarian', 'Democracy'),
        ('parliamentary democracy', 'Democracy'),

        ('autocracy', 'Autocracy'),
        ('authoritarian', 'Autocracy'),
        ('authoritarianism', 'Autocracy'),
        ('dictatorship', 'Autocracy'),
        ('dictatorial', 'Autocracy'),
        ('military junta', 'Autocracy'),

        ('presidential', 'Presidential'),
        ('presidential republic', 'Presidential'),
        ('executive presidency', 'Presidential')
    ) AS m(legacy_key, canonical_value)
), expanded AS (
    SELECT
        met.id,
        met.event_key,
        gt.ord,
        gt.raw_gov_type,
        btrim(gt.raw_gov_type) AS trimmed_gov_type,
        gtm.canonical_value
    FROM ministry_event_templates met
    CROSS JOIN LATERAL unnest(COALESCE(met.gov_types, ARRAY[]::text[])) WITH ORDINALITY AS gt(raw_gov_type, ord)
    LEFT JOIN gov_type_map gtm
        ON lower(btrim(gt.raw_gov_type)) = gtm.legacy_key
), rewritten AS (
    SELECT
        e.id,
        ARRAY_AGG(
            COALESCE(e.canonical_value, e.trimmed_gov_type)
            ORDER BY e.ord
        ) FILTER (WHERE e.trimmed_gov_type <> '') AS rewritten_gov_types
    FROM expanded e
    GROUP BY e.id
), updated AS (
    UPDATE ministry_event_templates met
    SET gov_types = r.rewritten_gov_types
    FROM rewritten r
    WHERE met.id = r.id
      AND met.gov_types IS DISTINCT FROM r.rewritten_gov_types
    RETURNING met.id, met.event_key, met.gov_types
)
SELECT COUNT(*) AS templates_updated
FROM updated;

-- 3) Log/return templates that still contain unknown (non-canonical) gov types for manual cleanup.
WITH canonical_values AS (
    SELECT unnest(ARRAY['Democracy', 'Autocracy', 'Presidential']::text[]) AS gov_type
), unknown_templates AS (
    SELECT
        met.id,
        met.event_key,
        met.gov_types,
        ARRAY_AGG(DISTINCT gt.gov_type ORDER BY gt.gov_type) AS unknown_gov_types
    FROM ministry_event_templates met
    CROSS JOIN LATERAL unnest(COALESCE(met.gov_types, ARRAY[]::text[])) AS gt(gov_type)
    LEFT JOIN canonical_values cv
        ON gt.gov_type = cv.gov_type
    WHERE cv.gov_type IS NULL
      AND btrim(gt.gov_type) <> ''
    GROUP BY met.id, met.event_key, met.gov_types
)
SELECT *
FROM unknown_templates
ORDER BY event_key;

-- 4) Verification queries

-- 4a) Distinct nation government types.
SELECT DISTINCT n.government_type
FROM nations n
ORDER BY 1;

-- 4b) Distinct template government types after rewrite.
SELECT DISTINCT t.gov_type
FROM ministry_event_templates met
CROSS JOIN LATERAL unnest(COALESCE(met.gov_types, ARRAY[]::text[])) AS t(gov_type)
ORDER BY 1;

-- 4c) Count templates that still contain non-canonical gov types (must be 0).
WITH canonical_values AS (
    SELECT unnest(ARRAY['Democracy', 'Autocracy', 'Presidential']::text[]) AS gov_type
)
SELECT COUNT(DISTINCT met.id) AS templates_with_non_canonical_gov_types
FROM ministry_event_templates met
CROSS JOIN LATERAL unnest(COALESCE(met.gov_types, ARRAY[]::text[])) AS t(gov_type)
LEFT JOIN canonical_values cv
    ON t.gov_type = cv.gov_type
WHERE cv.gov_type IS NULL
  AND btrim(t.gov_type) <> '';

COMMIT;
