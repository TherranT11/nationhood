-- ===========================================================================
-- 302 · Narratives target a ROLE within a nation, not a fixed personality.
--
-- A narrative is now authored for "Head of Government of Sordogne" rather than for "Alessandro Moretti":
-- nationverse_narratives.role is a role/office label (Head of Government, Opposition Leader, Oligarch,
-- Politician, … — one source with the personality office/role dropdowns in /backend). At launch it resolves
-- to whichever CLAIMED personality currently holds that role in the narrative's nation (303), so the same
-- narrative follows the position as people move through it.
--
-- personality_id (283) stays as a legacy fallback for any narrative authored before this — 303 uses `role`
-- when set, else the old personality_id. Nullable. Depends on: 277 (nation_id), 283. Idempotent. Apply after 301.
-- ===========================================================================

alter table public.nationverse_narratives
  add column if not exists role text;   -- targeted role label (null = none / legacy personality_id used)

notify pgrst, 'reload schema';
