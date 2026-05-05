-- ═══════════════════════════════════════════════════════════════════════════════
-- Vacate zombie ministers — every nation with no active admin
-- ═══════════════════════════════════════════════════════════════════════════════
-- Mirrors orphanCabinet (js/game/elections.js:769) exactly — same four
-- columns get nulled, is_active stays true. Scope: every nation whose
-- most recent administration row has ended_at_tick set (or has no admin
-- at all). Sangreza was the visible offender (Pacheco admin ended at
-- tick 49, ministry rows still showed names from that admin).
--
-- Two close-admin paths in the engine call closeAdministration WITHOUT
-- calling orphanCabinet alongside (elections.js:920 coalition_collapse
-- via vacancy timeout, political-actions.js:2191 gov collapse). Anywhere
-- those paths fired in the past, ministers stayed populated. This script
-- catches every accumulated zombie. The Phase B JS fix that consolidates
-- close+vacate prevents new zombies from accumulating.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Preview ──────────────────────────────────────────────────────────────────
-- Per-nation count of ministers about to be vacated. If you see a name
-- here that you EXPECT to currently have a live cabinet, abort with
-- ROLLBACK and surface the discrepancy first.
SELECT
    n.name                                                                AS nation,
    COUNT(*) FILTER (WHERE m.minister_first_name IS NOT NULL)             AS zombie_ministers
FROM public.nations n
JOIN public.ministries m ON m.nation_id = n.id AND m.is_active = true
WHERE NOT EXISTS (
    SELECT 1 FROM public.administrations a
    WHERE a.nation_id = n.id AND a.ended_at_tick IS NULL
)
GROUP BY n.name
HAVING COUNT(*) FILTER (WHERE m.minister_first_name IS NOT NULL) > 0
ORDER BY n.name;

-- ── Vacate ───────────────────────────────────────────────────────────────────
UPDATE public.ministries
SET minister_first_name = NULL,
    minister_last_name  = NULL,
    minister_age        = NULL,
    party_id            = NULL
WHERE is_active = true
  AND minister_first_name IS NOT NULL
  AND nation_id IN (
      SELECT n.id FROM public.nations n
      WHERE NOT EXISTS (
          SELECT 1 FROM public.administrations a
          WHERE a.nation_id = n.id AND a.ended_at_tick IS NULL
      )
  );

-- ── Verify ───────────────────────────────────────────────────────────────────
-- Should return zero rows after the UPDATE.
SELECT
    n.name                                                                AS nation,
    COUNT(*) FILTER (WHERE m.minister_first_name IS NOT NULL)             AS remaining_zombies
FROM public.nations n
JOIN public.ministries m ON m.nation_id = n.id AND m.is_active = true
WHERE NOT EXISTS (
    SELECT 1 FROM public.administrations a
    WHERE a.nation_id = n.id AND a.ended_at_tick IS NULL
)
GROUP BY n.name
HAVING COUNT(*) FILTER (WHERE m.minister_first_name IS NOT NULL) > 0;

COMMIT;
