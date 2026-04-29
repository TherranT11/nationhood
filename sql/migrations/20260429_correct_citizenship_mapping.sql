-- =========================================================================
-- Correct the Citizenship Framework Act mapping.
--
-- The previous backfill assumed option_order in the DB matches the "Option
-- N" labels in the policyadmin UI (1-indexed). It doesn't — option_order
-- is 0-indexed (or otherwise offset), so every nation ended up shifted
-- one option to the right (e.g. Melizea got Open Citizenship instead of
-- Birthright Citizenship).
--
-- This migration matches by option_name, which is unambiguous and
-- independent of indexing.
--
-- Correct mapping per the policyadmin Starting Status grid:
--   Avelia        → Restricted Naturalization
--   Calveth       → Restricted Naturalization
--   Danwei        → Blood-Based Citizenship (Jus Sanguinis)
--   Dravka        → Open Citizenship
--   Flandis       → Restricted Naturalization
--   Hajjara       → Blood-Based Citizenship (Jus Sanguinis)
--   Melizea       → Birthright Citizenship (Jus Soli)
--   Montequilla   → Birthright Citizenship (Jus Soli)
--   Palvera       → Open Citizenship
--   San Estrella  → Tiered Civic Citizenship
--   Sangreza      → Blood-Based Citizenship (Jus Sanguinis)
--   Sierramar     → Blood-Based Citizenship (Jus Sanguinis)
--   Vostia        → Blood-Based Citizenship (Jus Sanguinis)
--
-- Idempotent — re-running just no-ops if rows are already correct.
-- =========================================================================

-- Update existing nation_policies rows to point at the correct option.
WITH policy AS (
    SELECT id FROM policies WHERE policy_name = 'Citizenship Framework Act' LIMIT 1
),
mapping(nation_name, option_name) AS (VALUES
    ('Avelia',        'Restricted Naturalization'),
    ('Calveth',       'Restricted Naturalization'),
    ('Danwei',        'Blood-Based Citizenship (Jus Sanguinis)'),
    ('Dravka',        'Open Citizenship'),
    ('Flandis',       'Restricted Naturalization'),
    ('Hajjara',       'Blood-Based Citizenship (Jus Sanguinis)'),
    ('Melizea',       'Birthright Citizenship (Jus Soli)'),
    ('Montequilla',   'Birthright Citizenship (Jus Soli)'),
    ('Palvera',       'Open Citizenship'),
    ('San Estrella',  'Tiered Civic Citizenship'),
    ('Sangreza',      'Blood-Based Citizenship (Jus Sanguinis)'),
    ('Sierramar',     'Blood-Based Citizenship (Jus Sanguinis)'),
    ('Vostia',        'Blood-Based Citizenship (Jus Sanguinis)')
),
resolved AS (
    SELECT
        n.id  AS nation_id,
        p.id  AS policy_id,
        po.id AS option_id
    FROM mapping m
    JOIN policy           p  ON TRUE
    JOIN nations          n  ON n.name = m.nation_name
    JOIN policy_options   po ON po.policy_id = p.id AND po.option_name = m.option_name
)
UPDATE nation_policies np
SET selected_option_id = r.option_id, status = 'active'
FROM resolved r
WHERE np.nation_id = r.nation_id AND np.policy_id = r.policy_id;

-- Update existing active_laws rows to point at the correct option.
WITH policy AS (
    SELECT id FROM policies WHERE policy_name = 'Citizenship Framework Act' LIMIT 1
),
mapping(nation_name, option_name) AS (VALUES
    ('Avelia',        'Restricted Naturalization'),
    ('Calveth',       'Restricted Naturalization'),
    ('Danwei',        'Blood-Based Citizenship (Jus Sanguinis)'),
    ('Dravka',        'Open Citizenship'),
    ('Flandis',       'Restricted Naturalization'),
    ('Hajjara',       'Blood-Based Citizenship (Jus Sanguinis)'),
    ('Melizea',       'Birthright Citizenship (Jus Soli)'),
    ('Montequilla',   'Birthright Citizenship (Jus Soli)'),
    ('Palvera',       'Open Citizenship'),
    ('San Estrella',  'Tiered Civic Citizenship'),
    ('Sangreza',      'Blood-Based Citizenship (Jus Sanguinis)'),
    ('Sierramar',     'Blood-Based Citizenship (Jus Sanguinis)'),
    ('Vostia',        'Blood-Based Citizenship (Jus Sanguinis)')
),
resolved AS (
    SELECT
        n.id  AS nation_id,
        p.id  AS policy_id,
        po.id AS option_id
    FROM mapping m
    JOIN policy           p  ON TRUE
    JOIN nations          n  ON n.name = m.nation_name
    JOIN policy_options   po ON po.policy_id = p.id AND po.option_name = m.option_name
)
UPDATE active_laws al
SET selected_option_id = r.option_id
FROM resolved r
WHERE al.nation_id = r.nation_id AND al.policy_id = r.policy_id;

-- Verify result. Every nation should map to its expected option.
SELECT n.name AS nation, po.option_name, al.selected_option_id IS NOT NULL AS has_active_law
FROM nations n
LEFT JOIN active_laws al
    ON al.nation_id = n.id
    AND al.policy_id = (SELECT id FROM policies WHERE policy_name = 'Citizenship Framework Act' LIMIT 1)
LEFT JOIN policy_options po ON po.id = al.selected_option_id
ORDER BY n.name;
