-- ===========================================================================
-- 297 · A reform Tag on Story Bills — the single source for grouping reforms.
--
-- Agendas can require "Enact N {Tag} Reforms" (authored as a requirement condition
-- {type:'bills_passed', tag, count} in the shared condition builder). For that to be evaluable, a Story
-- Bill needs to declare which reform family it belongs to. This adds nationverse_story_bills.tag — one of a
-- small authored vocabulary (Labor, Economic, Social, Environmental, Security, Institutional, Foreign; the
-- list lives in /backend, one source shared by the bill's Tag dropdown AND the agenda requirement's Tag
-- dropdown so they can't drift). Nullable — an untagged bill counts toward no reform requirement.
--
-- Authoring only, like the rest of the agenda/story-bill system (288, 276): nothing evaluates this yet. The
-- future agenda runtime counts passed bills where tag = the requirement's tag. Depends on: 276. Idempotent.
-- Apply after 296.
-- ===========================================================================

alter table public.nationverse_story_bills
  add column if not exists tag text;   -- reform family, e.g. 'Labor' (null = untagged)

notify pgrst, 'reload schema';
