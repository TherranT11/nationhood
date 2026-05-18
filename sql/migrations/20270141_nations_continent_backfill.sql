-- ═══════════════════════════════════════════════════════════════════════════════
-- NATIONS — authoritative continent backfill
-- ═══════════════════════════════════════════════════════════════════════════════
-- One source of truth for nation → continent. `nations.continent` was
-- only ever set for a handful of nations (20260327 + the Calveth/Flandis/
-- Vostia/Sierramar/Danwei inserts); Hajjara and Dravka were left NULL and
-- therefore silently mis-filed under Crucera by the `(continent ||
-- 'Crucera')` fallback in every continent-grouped screen. This sets the
-- canon continent for every real nation and re-affirms the rest so the
-- data is correct at the source instead of patched per-screen.
--
-- Idempotent (re-running sets the same values). Valdoria is intentionally
-- NOT touched — it is not a nation in the game, so it stays
-- continent = NULL and is excluded everywhere by `continent IS NOT NULL`.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE nations SET continent = 'Crucera'
 WHERE LOWER(name) IN
   ('avelia','sangreza','san estrella','montequilla','melizea','palvera','sierramar');

UPDATE nations SET continent = 'Meridian'
 WHERE LOWER(name) IN ('calveth','flandis','vostia','dravka');

UPDATE nations SET continent = 'Faresia'
 WHERE LOWER(name) = 'danwei';

UPDATE nations SET continent = 'Al-Makir'
 WHERE LOWER(name) = 'hajjara';

COMMIT;
