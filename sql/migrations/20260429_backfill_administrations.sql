-- =========================================================================
-- Backfill open administrations rows for every nation that doesn't have one,
-- and ensure RLS lets the frontend read them.
--
-- Symptom: Government -> Past Administrations shows
-- "No administrations recorded for {nation} yet" for nations whose admin
-- row was never written by elections.js / inauguratePresident (i.e. every
-- nation that hasn't had an election fire yet). The frontend reads
-- administrations directly, so the page is correctly blank for those
-- nations — but it also can't show the CURRENT government.
--
-- This migration:
--   1. Ensures RLS SELECT is open on administrations + gov_approval_log
--      (so the table reads + the approval-arc reads both succeed).
--   2. Inserts an open administrations row for every nation lacking one,
--      pulling PM/HoS/coalition data from the live game tables. The
--      started_at_tick is set to 0 so the row reads as "from the start
--      of the game" until a future election closes and replaces it.
-- =========================================================================

-- ── Step 1: RLS ──────────────────────────────────────────────────────────
DO $$
DECLARE
    tbl TEXT;
    has_rls BOOLEAN;
    pol_exists BOOLEAN;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['administrations', 'gov_approval_log'])
    LOOP
        SELECT relrowsecurity INTO has_rls
        FROM pg_class
        WHERE relname = tbl AND relnamespace = 'public'::regnamespace;
        IF has_rls IS NULL THEN
            RAISE NOTICE '% does not exist — skipping', tbl;
            CONTINUE;
        END IF;
        IF NOT has_rls THEN
            RAISE NOTICE '% has RLS off — no policy needed', tbl;
            CONTINUE;
        END IF;

        SELECT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = tbl AND policyname = 'Allow select for all'
        ) INTO pol_exists;
        IF NOT pol_exists THEN
            EXECUTE format('CREATE POLICY "Allow select for all" ON %I FOR SELECT USING (true)', tbl);
            RAISE NOTICE 'Created SELECT policy for %', tbl;
        END IF;
    END LOOP;
END $$;

-- ── Step 2: Backfill open admin rows ─────────────────────────────────────
-- For each nation without an open admin row (ended_at_tick IS NULL), build
-- a row that captures the current government state so the Past
-- Administrations page reads cleanly. Uses head_of_government for the PM
-- and active_coalitions for the seat distribution.

INSERT INTO administrations (
    nation_id,
    admin_name,
    head_of_state,
    prime_minister,
    pm_party_name,
    pm_party_id,
    coalition_parties,
    total_seats,
    government_type,
    started_at_tick,
    started_at_date,
    approval_at_start,
    head_of_state_title,
    stats_at_start
)
SELECT
    n.id AS nation_id,
    -- "Smith Administration" (or "Founding Administration" for vacancies)
    COALESCE(
        NULLIF(TRIM(hog.last_name), ''),
        'Founding'
    ) || ' Administration' AS admin_name,
    -- Head of state name (concatenate first + last, fall back to '—')
    NULLIF(TRIM(
        COALESCE(n.head_of_state_first_name, '') || ' ' ||
        COALESCE(n.head_of_state_last_name, '')
    ), '') AS head_of_state,
    -- Prime minister name
    NULLIF(TRIM(
        COALESCE(hog.first_name, '') || ' ' ||
        COALESCE(hog.last_name, '')
    ), '') AS prime_minister,
    pmf.faction_name AS pm_party_name,
    hog.faction_id AS pm_party_id,
    -- Coalition parties, expanded from active_coalitions.party_ids
    COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
            'party_id',  f.id,
            'party_name', f.faction_name,
            'seats',      f.seats
        ))
        FROM unnest(ac.party_ids) pid(party_id)
        JOIN factions f ON f.id = pid.party_id
    ), '[]'::jsonb) AS coalition_parties,
    COALESCE(ac.total_seats, 0) AS total_seats,
    COALESCE(n.government_type, 'Parliamentary Republic') AS government_type,
    0 AS started_at_tick,
    -- Try to derive a "started" date from game start; fall back to a placeholder
    'January, 2000' AS started_at_date,
    50 AS approval_at_start,
    COALESCE(n.head_of_state_title, 'President') AS head_of_state_title,
    -- Snapshot of nation stats at backfill time
    jsonb_build_object(
        'gdp',                      n.gdp,
        'literacy',                 n.literacy,
        'happiness',                n.happiness,
        'inflation',                n.inflation,
        'stability',                n.stability,
        'civil_unrest',             n.civil_unrest,
        'unemployment',             n.unemployment,
        'standard_of_living',       n.standard_of_living
    ) AS stats_at_start
FROM nations n
LEFT JOIN head_of_government hog
    ON hog.nation_id = n.id AND hog.active = true
LEFT JOIN factions pmf
    ON pmf.id = hog.faction_id
LEFT JOIN active_coalitions ac
    ON ac.nation_id = n.id AND ac.dissolved_at IS NULL
WHERE NOT EXISTS (
    SELECT 1 FROM administrations a
    WHERE a.nation_id = n.id AND a.ended_at_tick IS NULL
);

-- ── Verify: every nation should now have one open administrations row ──
SELECT
    n.name        AS nation,
    a.admin_name,
    a.prime_minister,
    a.head_of_state,
    a.total_seats,
    a.started_at_tick,
    a.ended_at_tick
FROM nations n
LEFT JOIN administrations a
    ON a.nation_id = n.id AND a.ended_at_tick IS NULL
ORDER BY n.name;
