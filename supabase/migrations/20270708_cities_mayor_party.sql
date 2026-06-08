-- ════════════════════════════════════════════════════════════════════
-- 20270708 — Cities: mayors belong to a party, not just an archetype
--
-- Per user direction the city mayor should be a member of an actual
-- political party (Movimiento Autonómico de Base for Puerto Rey's
-- "Communist / Leftist" mayor, etc.) — not just carry a free-text
-- archetype label. The archetype was a launch-time shortcut; now
-- that nations have real parties seated, the mayor display should
-- reflect that.
--
-- Schema add: cities.mayor_party_id uuid → factions(id), nullable
-- with ON DELETE SET NULL so disbanding a party doesn't cascade-
-- destroy the city row. Drives the Geography card render in
-- politician-nation.html (faction abbreviation + faction_name
-- embedded on the cities fetch).
--
-- Backfill, two passes:
--   1. Match mayor_archetype → factions.archetype within the same
--      nation. Most cities seeded by 20270660 + 20270707 picked
--      their archetype from the 10-archetype list, which aligns
--      with the values stored on movement_party factions. Where a
--      match exists, link.
--   2. For any city left NULL after pass 1, pick a random
--      movement_party in the same nation. The user spec on Puerto
--      Rey was "auto generate a party" — random fallback honours
--      that even when no archetype match is available. Cities in
--      nations with no parties at all stay NULL — UI falls back to
--      the archetype display.
--
-- mayor_archetype column is intentionally KEPT (not dropped). Two
-- reasons:
--   • Backward compatibility with politician-home.html's
--     [View City] modal (line 3856) which still reads it directly.
--   • Fallback for cities whose mayor_party_id can't be set
--     (nation has no parties yet).
-- The Geography card render prefers mayor_party.archetype when the
-- FK is set, falls through to mayor_archetype otherwise.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + WHERE mayor_party_id IS
-- NULL guards both backfill passes. Re-running is a no-op once the
-- column is populated.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ─────────────────────────────────────────────────────
ALTER TABLE public.cities
    ADD COLUMN IF NOT EXISTS mayor_party_id uuid
        REFERENCES public.factions(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.cities.mayor_party_id IS
    'FK to the movement_party faction the mayor is a member of (20270708). NULL = no party affiliation (legacy or party-less nation). Drives the mayor render in politician-nation.html''s Geography card; mayor_archetype is the legacy fallback.';

CREATE INDEX IF NOT EXISTS idx_cities_mayor_party_id
    ON public.cities(mayor_party_id) WHERE mayor_party_id IS NOT NULL;

-- ── 2. Backfill — pass 1: match by archetype ──────────────────────
UPDATE public.cities c
   SET mayor_party_id = (
       SELECT f.id
         FROM public.factions f
        WHERE f.nation_id    = c.nation_id
          AND f.faction_type = 'movement_party'
          AND f.abandoned_at IS NULL
          AND f.archetype    = c.mayor_archetype
        ORDER BY f.created_at ASC
        LIMIT 1
   )
 WHERE c.mayor_party_id IS NULL
   AND c.mayor_archetype IS NOT NULL;

-- ── 3. Backfill — pass 2: random party in the same nation ─────────
-- Picks the same party every time within a re-run because
-- ORDER BY random() is non-deterministic and we want idempotency.
-- Use ORDER BY created_at ASC and take the first remaining party as
-- a deterministic-but-arbitrary pick. Cities in nations with zero
-- movement_parties stay NULL.
UPDATE public.cities c
   SET mayor_party_id = (
       SELECT f.id
         FROM public.factions f
        WHERE f.nation_id    = c.nation_id
          AND f.faction_type = 'movement_party'
          AND f.abandoned_at IS NULL
        ORDER BY f.created_at ASC
        LIMIT 1
   )
 WHERE c.mayor_party_id IS NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
