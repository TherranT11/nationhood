-- =========================================================================
-- Backfill active_laws + nation_policies for the Citizenship Framework Act.
--
-- The policyadmin Starting Status grid was set up with each nation pointing
-- at a specific option (e.g. Melizea → Birthright), but the save wasn't
-- persisted for every nation, so laws.html / government.html report
-- "0 enacted" and "Active: None" for those nations. This migration
-- writes the mapping deterministically using nation name + option_order.
--
-- Mapping per the policyadmin "Starting Status" screenshot (option_order):
--   Avelia        → 2  (Restricted Naturalization)
--   Calveth       → 2
--   Danwei        → 1  (Blood-Based)
--   Dravka        → 4
--   Flandis       → 2
--   Hajjara       → 1
--   Melizea       → 3  (Birthright Citizenship — Jus Soli)
--   Montequilla   → 3
--   Palvera       → 4
--   San Estrella  → 5
--   Sangreza      → 1
--   Sierramar     → 1
--   Vostia        → 1
--
-- Idempotent: ON CONFLICT DO NOTHING / DO UPDATE keeps re-runs safe.
-- =========================================================================

WITH policy AS (
    SELECT id FROM policies WHERE policy_name = 'Citizenship Framework Act' LIMIT 1
),
mapping(nation_name, option_order) AS (VALUES
    ('Avelia',        2),
    ('Calveth',       2),
    ('Danwei',        1),
    ('Dravka',        4),
    ('Flandis',       2),
    ('Hajjara',       1),
    ('Melizea',       3),
    ('Montequilla',   3),
    ('Palvera',       4),
    ('San Estrella',  5),
    ('Sangreza',      1),
    ('Sierramar',     1),
    ('Vostia',        1)
),
resolved AS (
    SELECT
        n.id   AS nation_id,
        p.id   AS policy_id,
        po.id  AS option_id
    FROM mapping m
    JOIN policy           p  ON TRUE
    JOIN nations          n  ON n.name = m.nation_name
    JOIN policy_options   po ON po.policy_id = p.id AND po.option_order = m.option_order
)
INSERT INTO nation_policies (
    nation_id, policy_id, selected_option_id,
    status, activated_at_tick, effects_started, effects_completed
)
SELECT nation_id, policy_id, option_id, 'active', 0, true, true
FROM resolved
ON CONFLICT (nation_id, policy_id)
DO UPDATE SET selected_option_id = EXCLUDED.selected_option_id, status = 'active';

WITH policy AS (
    SELECT id FROM policies WHERE policy_name = 'Citizenship Framework Act' LIMIT 1
),
mapping(nation_name, option_order) AS (VALUES
    ('Avelia',        2),
    ('Calveth',       2),
    ('Danwei',        1),
    ('Dravka',        4),
    ('Flandis',       2),
    ('Hajjara',       1),
    ('Melizea',       3),
    ('Montequilla',   3),
    ('Palvera',       4),
    ('San Estrella',  5),
    ('Sangreza',      1),
    ('Sierramar',     1),
    ('Vostia',        1)
),
resolved AS (
    SELECT
        n.id   AS nation_id,
        p.id   AS policy_id,
        po.id  AS option_id
    FROM mapping m
    JOIN policy           p  ON TRUE
    JOIN nations          n  ON n.name = m.nation_name
    JOIN policy_options   po ON po.policy_id = p.id AND po.option_order = m.option_order
)
INSERT INTO active_laws (nation_id, policy_id, selected_option_id, passed_tick)
SELECT nation_id, policy_id, option_id, 0
FROM resolved
ON CONFLICT (nation_id, policy_id)
DO UPDATE SET selected_option_id = EXCLUDED.selected_option_id;

-- Verify result
SELECT n.name AS nation, po.option_name, al.selected_option_id IS NOT NULL AS has_active_law
FROM nations n
LEFT JOIN active_laws al
    ON al.nation_id = n.id
    AND al.policy_id = (SELECT id FROM policies WHERE policy_name = 'Citizenship Framework Act' LIMIT 1)
LEFT JOIN policy_options po ON po.id = al.selected_option_id
ORDER BY n.name;
