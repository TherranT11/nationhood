-- ===========================================================================
-- 276 · Nationverse Story Bills — Suzerain-style narrative bills (FIRST SLICE).
--
-- A Story Bill is a named narrative decision presented to the player. This first slice stores the
-- DEFINITION only (authoring in /backend); the runtime engine that presents a bill, checks its
-- triggers and applies a choice's effects is built later, on top of the planned Situation /
-- Conversation system. Scope of this slice is deliberately minimal:
--   name, internal_id, nation (null = Global/reusable), presented_by, flavor,
--   triggers jsonb  = [{type:'stat', stat, op, value} | {type:'modifier', name, state}
--                      | {type:'party', alignment, party}]   (only conditions that exist today)
--   choices jsonb   = [{key:'sign'|'veto', label, effects:[<the SAME reusable effect shape as
--                      nationverse_modifiers.effects — one source, built by the shared effect builder>]}]
-- Deferred (documented, not built): Situation/Conversation/Previous-Choices/Previous-Bills triggers,
-- Amend/Delay/Referendum choices, artwork, debate/arguments, and bill chains.
--
-- Auth reuses is_admin() (schema/10): public read, admin-only write. nation_id cascades so a
-- nation-scoped bill dies with its nation; Global bills (null nation_id) are unaffected.
-- Depends on: 10 (is_admin), 271 (nationverse_nations). Idempotent. Apply after 275.
-- ===========================================================================

create table if not exists public.nationverse_story_bills (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  internal_id  text,
  nation_id    uuid references public.nationverse_nations(id) on delete cascade,
  presented_by text,
  flavor       text,
  triggers     jsonb not null default '[]'::jsonb,
  choices      jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now()
);

alter table public.nationverse_story_bills enable row level security;

grant select on public.nationverse_story_bills to anon, authenticated;
grant insert, update, delete on public.nationverse_story_bills to authenticated;

drop policy if exists "nv_bills_select_all" on public.nationverse_story_bills;
create policy "nv_bills_select_all" on public.nationverse_story_bills for select using (true);

drop policy if exists "nv_bills_insert_admin" on public.nationverse_story_bills;
create policy "nv_bills_insert_admin" on public.nationverse_story_bills for insert with check (public.is_admin());

drop policy if exists "nv_bills_update_admin" on public.nationverse_story_bills;
create policy "nv_bills_update_admin" on public.nationverse_story_bills for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "nv_bills_delete_admin" on public.nationverse_story_bills;
create policy "nv_bills_delete_admin" on public.nationverse_story_bills for delete using (public.is_admin());

notify pgrst, 'reload schema';
