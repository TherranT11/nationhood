-- ============================================================
-- Backfill every OPEN administration row that carries the
-- pre-20260422 data gap (null stats_at_start / pm_party_name /
-- head_of_state / head_of_state_title).
--
-- Background: the old finalize_government_formation RPC didn't
-- write pm_party_id / pm_party_name / head_of_state /
-- hos_election_method at INSERT time. The 2026-04-22 patch
-- (20260422_finalize_formation_hos_pm_party_fields.sql) fixes
-- that for FUTURE inserts, but historical rows that were already
-- open carry blank fields. The UI falls back to the nation row
-- for visible fields, but the Parties-subtab governance-score
-- panel relies on administrations.stats_at_start being set —
-- otherwise it shows "No governance data yet" and the score
-- stays at 0 forever.
--
-- This migration runs four independent passes against every
-- open admin row (`ended_at_tick IS NULL`). Each pass only
-- touches rows that are genuinely missing the field, so it's
-- safe to re-run — already-complete rows are untouched.
--
--   Pass 1: stats_at_start  ← closest nations_history snapshot
--                             at or before started_at_tick
--                             (falls back to earliest available
--                             snapshot if none pre-date started)
--   Pass 2: pm_party_name   ← factions.faction_name via
--                             administrations.pm_party_id
--   Pass 3: head_of_state   ← nations.head_of_state_first_name +
--                             last_name. Also fixes the specific
--                             pre-patch quirk where head_of_state
--                             was populated with the PM's name by
--                             mistake (detected as
--                             head_of_state = prime_minister).
--   Pass 4: head_of_state_title ← nations.head_of_state_title
--   Pass 5: nations.head_of_state_title itself — for any
--                             non-hereditary nation that has a
--                             HoS name but no title, default to
--                             'President'. Hereditary nations
--                             (monarchies) are skipped because
--                             the correct title depends on the
--                             monarch's gender.
--
-- Safe to re-run: every UPDATE is guarded by `IS NULL` / equality
-- checks so filled rows are never overwritten.
-- ============================================================

-- ═════════════════════════════════════════════════════════════
-- Pass 1 — stats_at_start from nations_history
-- ═════════════════════════════════════════════════════════════
-- Prefer a snapshot at or before the admin's started_at_tick.
-- If no snapshot exists on or before, fall back to the earliest
-- snapshot we have for this nation (better than nothing — the
-- delta will overcount tenure by a few ticks but governance
-- score is directional, not forensic).

UPDATE administrations a
SET stats_at_start = (
    SELECT jsonb_build_object(
        'gdp',                         h.gdp,
        'gdp_growth',                  h.gdp_growth,
        'unemployment',                h.unemployment,
        'inflation',                   h.inflation,
        'stability',                   h.stability,
        'happiness',                   h.happiness,
        'healthcare_accessibility',    h.healthcare_accessibility,
        'literacy',                    h.literacy,
        'physical_infrastructure',     h.physical_infrastructure,
        'corruption',                  h.corruption,
        'civil_unrest',                h.civil_unrest,
        'carbon_emissions',            h.carbon_emissions,
        'income_inequality',           h.income_inequality,
        'cost_of_living',              h.cost_of_living,
        'standard_of_living',          h.standard_of_living,
        'crime_rate',                  h.crime_rate,
        'manufacturing_output',        h.manufacturing_output,
        'foreign_investment',          h.foreign_investment,
        'terrorism',                   h.terrorism,
        'renewable_energy_percentage', h.renewable_energy_percentage,
        'beds_per_100k',               h.beds_per_100k
    )
    FROM nations_history h
    WHERE h.nation_id = a.nation_id
    ORDER BY
        -- prefer on-or-before, closest first; otherwise earliest available
        CASE WHEN h.tick <= a.started_at_tick THEN 0 ELSE 1 END,
        ABS(h.tick - a.started_at_tick)
    LIMIT 1
),
    updated_at = now()
WHERE a.ended_at_tick IS NULL
  AND a.stats_at_start IS NULL;


-- ═════════════════════════════════════════════════════════════
-- Pass 2 — pm_party_name from factions
-- ═════════════════════════════════════════════════════════════

UPDATE administrations a
SET pm_party_name = f.faction_name,
    updated_at = now()
FROM factions f
WHERE a.pm_party_id = f.id
  AND a.ended_at_tick IS NULL
  AND a.pm_party_id IS NOT NULL
  AND (a.pm_party_name IS NULL OR a.pm_party_name = '');


-- ═════════════════════════════════════════════════════════════
-- Pass 3 — head_of_state from nations
-- ═════════════════════════════════════════════════════════════
-- Two triggers: null head_of_state, OR head_of_state wrongly set
-- to the PM's name (the Pacheco pattern — pre-patch RPC bug).

UPDATE administrations a
SET head_of_state = NULLIF(TRIM(
        COALESCE(n.head_of_state_first_name, '') || ' ' ||
        COALESCE(n.head_of_state_last_name, '')
    ), ''),
    updated_at = now()
FROM nations n
WHERE a.nation_id = n.id
  AND a.ended_at_tick IS NULL
  AND (
      a.head_of_state IS NULL
      OR a.head_of_state = ''
      OR a.head_of_state = a.prime_minister  -- PM name leaked into HoS field
  );


-- ═════════════════════════════════════════════════════════════
-- Pass 5 — nations.head_of_state_title default for non-monarchies
-- ═════════════════════════════════════════════════════════════
-- Runs BEFORE Pass 4 so admin rows can inherit the freshly-set
-- nation title. Hereditary nations are skipped (title depends on
-- monarch gender — leave for manual review).

UPDATE nations
SET head_of_state_title = 'President'
WHERE head_of_state_title IS NULL
  AND hos_election_method IS DISTINCT FROM 'hereditary'
  AND NULLIF(TRIM(
      COALESCE(head_of_state_first_name, '') || ' ' ||
      COALESCE(head_of_state_last_name, '')
  ), '') IS NOT NULL;


-- ═════════════════════════════════════════════════════════════
-- Pass 4 — head_of_state_title on admin from nation
-- ═════════════════════════════════════════════════════════════

UPDATE administrations a
SET head_of_state_title = n.head_of_state_title,
    updated_at = now()
FROM nations n
WHERE a.nation_id = n.id
  AND a.ended_at_tick IS NULL
  AND a.head_of_state_title IS NULL
  AND n.head_of_state_title IS NOT NULL;


-- ═════════════════════════════════════════════════════════════
-- VERIFY — one row per nation; each column should show 0 gaps
-- ═════════════════════════════════════════════════════════════

SELECT
    n.name AS nation,
    a.admin_name,
    a.started_at_tick,
    a.stats_at_start IS NULL                          AS missing_snapshot,
    a.pm_party_name IS NULL                           AS missing_pm_party,
    (a.head_of_state IS NULL OR a.head_of_state = '') AS missing_hos_name,
    a.head_of_state_title IS NULL                     AS missing_hos_title,
    a.head_of_state = a.prime_minister                AS hos_equals_pm
FROM administrations a
JOIN nations n ON n.id = a.nation_id
WHERE a.ended_at_tick IS NULL
ORDER BY n.name;
