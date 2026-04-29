-- =========================================================================
-- Add UNIQUE (nation_id, policy_id) constraints + repair Citizenship rows.
--
-- ROOT CAUSE
-- ----------
-- policyadmin.html's savePolicy uses Supabase upserts of the shape:
--     supabase.from('active_laws')
--             .upsert(records, { onConflict: 'nation_id,policy_id' })
--     supabase.from('nation_policies')
--             .upsert(records, { onConflict: 'nation_id,policy_id' })
--
-- ON CONFLICT requires a UNIQUE or EXCLUSION constraint covering the
-- specified columns. The live schema for active_laws + nation_policies
-- doesn't have one (only the PRIMARY KEY on id), so PostgREST returns
-- "no unique or exclusion constraint matching the ON CONFLICT
-- specification" and the upsert errors silently — the user's policy
-- save appears to succeed but the per-nation rows are never written.
--
-- This migration:
--   1. Adds the missing UNIQUE constraints — future policyadmin saves
--      will write rows correctly.
--   2. Backfills any missing Citizenship Framework Act row for the 13
--      nations + repairs existing rows whose selected_option_id is wrong.
--
-- Idempotent: re-runs no-op when the constraint already exists or the
-- rows are already correct.
-- =========================================================================

-- ── Step 1: UNIQUE constraints on active_laws and nation_policies ────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'active_laws'::regclass
          AND conname = 'active_laws_nation_id_policy_id_key'
    ) THEN
        -- Drop any duplicate (nation_id, policy_id) rows first so the
        -- ALTER doesn't fail with "could not create unique index".
        -- Keeps the row with the most recent passed_tick.
        DELETE FROM active_laws a
        USING active_laws b
        WHERE a.nation_id = b.nation_id
          AND a.policy_id = b.policy_id
          AND a.id <> b.id
          AND (
              COALESCE(a.passed_tick, 0) < COALESCE(b.passed_tick, 0)
              OR (COALESCE(a.passed_tick, 0) = COALESCE(b.passed_tick, 0)
                  AND a.id < b.id)
          );
        ALTER TABLE active_laws
            ADD CONSTRAINT active_laws_nation_id_policy_id_key
            UNIQUE (nation_id, policy_id);
        RAISE NOTICE 'Added UNIQUE (nation_id, policy_id) on active_laws';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'nation_policies'::regclass
          AND conname = 'nation_policies_nation_id_policy_id_key'
    ) THEN
        DELETE FROM nation_policies a
        USING nation_policies b
        WHERE a.nation_id = b.nation_id
          AND a.policy_id = b.policy_id
          AND a.id <> b.id
          AND (
              COALESCE(a.activated_at_tick, 0) < COALESCE(b.activated_at_tick, 0)
              OR (COALESCE(a.activated_at_tick, 0) = COALESCE(b.activated_at_tick, 0)
                  AND a.id < b.id)
          );
        ALTER TABLE nation_policies
            ADD CONSTRAINT nation_policies_nation_id_policy_id_key
            UNIQUE (nation_id, policy_id);
        RAISE NOTICE 'Added UNIQUE (nation_id, policy_id) on nation_policies';
    END IF;
END $$;

-- ── Step 2: Backfill / repair Citizenship Framework rows ────────────────
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
        po.id AS option_id,
        m.nation_name,
        m.option_name
    FROM mapping m
    JOIN policy         p  ON TRUE
    JOIN nations        n  ON n.name = m.nation_name
    JOIN policy_options po ON po.policy_id = p.id AND po.option_name = m.option_name
)
-- Insert nation_policies rows for nations missing one.
INSERT INTO nation_policies (
    nation_id, policy_id, selected_option_id,
    status, activated_at_tick, effects_started, effects_completed
)
SELECT r.nation_id, r.policy_id, r.option_id, 'active', 0, true, true
FROM resolved r
ON CONFLICT (nation_id, policy_id)
DO UPDATE SET
    selected_option_id = EXCLUDED.selected_option_id,
    status = 'active';

-- Insert active_laws rows for nations missing one.
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
    JOIN policy         p  ON TRUE
    JOIN nations        n  ON n.name = m.nation_name
    JOIN policy_options po ON po.policy_id = p.id AND po.option_name = m.option_name
)
INSERT INTO active_laws (nation_id, policy_id, selected_option_id, passed_tick)
SELECT r.nation_id, r.policy_id, r.option_id, 0
FROM resolved r
ON CONFLICT (nation_id, policy_id)
DO UPDATE SET selected_option_id = EXCLUDED.selected_option_id;

-- ── Verify: every nation should have a citizenship row pointing at the
-- expected option. Names that didn't match in the JOIN appear as NULL. ──
SELECT
    n.name AS nation,
    np.selected_option_id IS NOT NULL AS has_nation_policy,
    al.selected_option_id IS NOT NULL AS has_active_law,
    po.option_name        AS resolved_option
FROM nations n
LEFT JOIN nation_policies np
    ON np.nation_id = n.id
    AND np.policy_id = (SELECT id FROM policies WHERE policy_name = 'Citizenship Framework Act' LIMIT 1)
LEFT JOIN active_laws al
    ON al.nation_id = n.id
    AND al.policy_id = (SELECT id FROM policies WHERE policy_name = 'Citizenship Framework Act' LIMIT 1)
LEFT JOIN policy_options po
    ON po.id = al.selected_option_id
ORDER BY n.name;
