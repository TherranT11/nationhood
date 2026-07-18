-- ===========================================================================
-- 277 · Nationverse Narratives — the orchestrator (FIRST SLICE, fixed shape).
--
-- A Narrative is a triggered story: an opening conversation, a set of player choices (each with a short
-- response conversation), then a decision whose options carry effects. It reuses the SAME building blocks
-- as the rest of the backend — the shared trigger builder and the shared effect builder — so nothing is
-- re-implemented. This slice stores the DEFINITION only; the runtime engine that plays a narrative,
-- checks its triggers, and applies a decision option's effects is built later.
--
--   triggers jsonb = [{type:'stat',stat,op,value} | {type:'modifier',name,state} | {type:'party',alignment,party}
--                     | {type:'role',role,state} | {type:'narrative',name,state}]   (shared trigger shape)
--   opening  jsonb = { speaker, role, lines:[...] }   (lines shown one at a time; player Continues through)
--   choices  jsonb = [{ label, response }]                     (player choices → response conversation)
--   decision jsonb = { prompt, options:[{ label, effects:[<shared effect shape>] }] }
--     (Create Story Bill / Unlock Narrative / Hidden Variable are just effect categories on those effects.)
--
-- Deferred (documented, not built): arbitrary deep branching graphs, the visual flow graph, portrait
-- uploads, and the runtime engine. The fixed opening→choices→decision shape covers the canonical example.
-- Auth reuses is_admin() (schema/10): public read, admin-only write. nation_id cascades (Global = null).
-- Depends on: 10 (is_admin), 271 (nationverse_nations). Idempotent. Apply after 276.
-- ===========================================================================

create table if not exists public.nationverse_narratives (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  internal_id text,
  nation_id   uuid references public.nationverse_nations(id) on delete cascade,
  category    text,
  priority    int not null default 0,
  triggers    jsonb not null default '[]'::jsonb,
  opening     jsonb not null default '{}'::jsonb,
  choices     jsonb not null default '[]'::jsonb,
  decision    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

alter table public.nationverse_narratives enable row level security;

grant select on public.nationverse_narratives to anon, authenticated;
grant insert, update, delete on public.nationverse_narratives to authenticated;

drop policy if exists "nv_narr_select_all" on public.nationverse_narratives;
create policy "nv_narr_select_all" on public.nationverse_narratives for select using (true);

drop policy if exists "nv_narr_insert_admin" on public.nationverse_narratives;
create policy "nv_narr_insert_admin" on public.nationverse_narratives for insert with check (public.is_admin());

drop policy if exists "nv_narr_update_admin" on public.nationverse_narratives;
create policy "nv_narr_update_admin" on public.nationverse_narratives for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "nv_narr_delete_admin" on public.nationverse_narratives;
create policy "nv_narr_delete_admin" on public.nationverse_narratives for delete using (public.is_admin());

notify pgrst, 'reload schema';
