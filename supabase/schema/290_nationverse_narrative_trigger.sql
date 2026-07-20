-- ===========================================================================
-- 290 · Narrative trigger: when the narrative fires (for the future automatic launch).
--
-- Replaces the generic condition list on narratives with a single structured `trigger` object authored in
-- /backend: { mode: 'immediate' } | { mode:'date', month, year } | { mode:'stats', stats:[{stat,value,dir}] }
-- (dir = 'higher' | 'lower'). Kept in its own column so its shape never conflates with the legacy
-- `triggers` array (left in place, now unused by narratives). Depends on: 277. Idempotent. Apply after 289.
-- ===========================================================================

alter table public.nationverse_narratives
  add column if not exists trigger jsonb not null default '{"mode":"immediate"}'::jsonb;

notify pgrst, 'reload schema';
