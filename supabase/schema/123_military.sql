-- ===========================================================================
-- 123 · Military standing — the data behind the Conflict page. Each nation holds a
-- number of military bases (shown on the Conflict page, set in the admin nation editor).
-- A nation's CONTINENT is NOT stored here — it's derived from the hex map's Continents
-- layer (schema/124), the single source for geography. There is no war mechanic yet, so
-- every continent reads "no active conflicts" — this is just the bases column + a seed.
-- Depends on: 10 (nations). nations is already world-readable, so no new policies.
-- ===========================================================================

alter table public.nations add column if not exists military_bases int not null default 1;  -- every nation starts with one

-- Seed the current world by name (adjust the names if yours differ; a non-match is a no-op).
update public.nations set military_bases = 3 where name in ('Severia', 'Vesperia');

notify pgrst, 'reload schema';
