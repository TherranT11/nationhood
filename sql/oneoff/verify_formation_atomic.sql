-- ═══════════════════════════════════════════════════════════════════════════════
-- Phase C smoke test — verify finalize_government_formation post-conditions
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this immediately after a live Form Government call against a
-- low-stakes nation to confirm the new RPC's atomic post-conditions.
-- Replace 'TestNation' below with whichever nation you used as the test.
-- Every section should return exactly one row (or the value shown).
-- If any section diverges, the migration broke something — ROLLBACK
-- the RPC migration and we re-cut.
--
-- The RPC's post-conditions, as Phase C now defines them:
--   1. Exactly one government_formations row at status='formed' for the
--      nation (the one that finalized).
--   2. Exactly one administrations row with ended_at_tick IS NULL.
--   3. Exactly one head_of_government row with active=true; PM party
--      matches formation.ministry_assignments.prime_minister.
--   4. Every ministry row populated by the formation has matching
--      minister_first_name from formation.minister_names, AND
--      minister_first_name IS NOT NULL on every assigned slot.
--   5. nations.failed_formation_attempts = 0.
--   6. Exactly one event_log row with event_name='PM_APPOINTED' fired
--      at the current tick.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Set this once and the rest of the script reads it.
\set test_nation '\'TestNation\''

-- ── 1. Formation status ─────────────────────────────────────────────────────
SELECT
    id, status, formed_at,
    ministry_assignments->>'prime_minister' AS pm_party_id
FROM public.government_formations
WHERE nation_id = (SELECT id FROM public.nations WHERE name = :test_nation)
  AND status = 'formed'
ORDER BY formed_at DESC NULLS LAST
LIMIT 1;
-- Expect: 1 row, status='formed', formed_at recently set.

-- ── 2. Active administration (exactly one) ──────────────────────────────────
SELECT
    id, admin_name, pm_party_id, started_at_tick, ended_at_tick
FROM public.administrations
WHERE nation_id = (SELECT id FROM public.nations WHERE name = :test_nation)
  AND ended_at_tick IS NULL;
-- Expect: 1 row, ended_at_tick IS NULL.

-- ── 3. Active HOG (exactly one), PM party matches formation ────────────────
SELECT
    hog.faction_id      AS pm_party_id,
    hog.first_name, hog.last_name, hog.appointed_tick, hog.active,
    f.ministry_assignments->>'prime_minister' AS formation_pm,
    (hog.faction_id::TEXT = f.ministry_assignments->>'prime_minister') AS pm_matches_formation
FROM public.head_of_government hog
JOIN public.government_formations f
  ON f.nation_id = hog.nation_id
 AND f.status = 'formed'
WHERE hog.nation_id = (SELECT id FROM public.nations WHERE name = :test_nation)
  AND hog.active = true;
-- Expect: 1 row, active=true, pm_matches_formation=true.

-- ── 4. Cabinet matches formation assignments ───────────────────────────────
-- For every non-PM key in formation.ministry_assignments, there must be
-- an active ministry row whose party_id and minister_first_name match.
WITH f AS (
    SELECT ministry_assignments, minister_names
    FROM public.government_formations
    WHERE nation_id = (SELECT id FROM public.nations WHERE name = :test_nation)
      AND status = 'formed'
    ORDER BY formed_at DESC LIMIT 1
)
SELECT
    expected.key                         AS ministry_key,
    expected.party_id                    AS expected_party_id,
    m.party_id                           AS actual_party_id,
    expected.expected_first_name         AS expected_first,
    m.minister_first_name                AS actual_first,
    (m.party_id::TEXT = expected.party_id) AS party_matches,
    (m.minister_first_name = expected.expected_first_name) AS name_matches
FROM (
    SELECT
        kv.key,
        kv.value AS party_id,
        ((SELECT minister_names FROM f) -> kv.key ->> 'first_name') AS expected_first_name
    FROM jsonb_each_text((SELECT ministry_assignments FROM f)) kv
    WHERE kv.key <> 'prime_minister'
      AND kv.value <> ''
) expected
LEFT JOIN public.ministries m
  ON m.nation_id = (SELECT id FROM public.nations WHERE name = :test_nation)
 AND m.ministry_key = expected.key
 AND m.is_active = true
ORDER BY expected.key;
-- Expect: every row has party_matches=true AND name_matches=true.
-- Any mismatch = the RPC's ministry-loop didn't write what the
-- formation said. Rollback and investigate.

-- ── 5. Failed-formation counter reset ───────────────────────────────────────
SELECT name, failed_formation_attempts
FROM public.nations
WHERE name = :test_nation;
-- Expect: failed_formation_attempts = 0.

-- ── 6. PM_APPOINTED event_log row at current tick ──────────────────────────
SELECT
    e.fired_at_tick,
    e.event_name,
    e.trigger_key,
    LEFT(e.description_used, 200) AS description,
    e.created_at
FROM public.event_log e
JOIN public.shard s ON s.name = 'Alpha Shard'
WHERE e.nation_id = (SELECT id FROM public.nations WHERE name = :test_nation)
  AND e.event_name = 'PM_APPOINTED'
  AND e.fired_at_tick >= s.current_tick - 1
ORDER BY e.created_at DESC
LIMIT 5;
-- Expect: at least one row at the tick the formation finalized.

-- ── 7. Sanity: no zombie ministers ──────────────────────────────────────────
-- After Phase C, every active ministry on a formed-government nation
-- must either have a populated minister or be intentionally vacant.
-- Cross-check: count of ministries with minister_first_name IS NOT NULL
-- should match count of non-PM ministry_assignments with a non-null
-- party_id in the formation. (PM is handled by HOG, not ministries
-- table for the row count purposes — though the prime_minister
-- ministry row exists too.)
SELECT
    'ministries with names'   AS bucket,
    COUNT(*) FILTER (WHERE m.minister_first_name IS NOT NULL AND m.ministry_key <> 'prime_minister') AS count
FROM public.ministries m
WHERE m.nation_id = (SELECT id FROM public.nations WHERE name = :test_nation)
  AND m.is_active = true
UNION ALL
SELECT
    'non-PM assignments in formation' AS bucket,
    (SELECT COUNT(*)
     FROM jsonb_each_text(
         (SELECT ministry_assignments
          FROM public.government_formations
          WHERE nation_id = (SELECT id FROM public.nations WHERE name = :test_nation)
            AND status = 'formed'
          ORDER BY formed_at DESC LIMIT 1)
     ) kv
     WHERE kv.key <> 'prime_minister' AND kv.value <> '')::BIGINT;
-- Expect: both buckets equal.
