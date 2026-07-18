-- ===========================================================================
-- 274 · Nationverse corporations — firms authored in /backend, headquartered in a new-universe nation.
--
-- Created against an EXISTING nationverse_nation (HQ). Each corp has a sector, a few numeric stats, and
-- an ownership cap table: a list of stakes, each held by a personality OR a nation, with a % share.
-- Ownership is jsonb ([{type:'personality'|'nation', id, share}]) rather than FK rows — the referenced
-- personalities/nations live in their own tables and are resolved by id at read time. Auth reuses
-- is_admin() (schema/10): public read, admin-only write.
-- Depends on: 10 (is_admin), 271 (nationverse_nations). Idempotent. Apply after 273.
-- ===========================================================================

create table if not exists public.nationverse_corporations (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  hq_nation_id     uuid references public.nationverse_nations(id) on delete cascade,   -- headquartered nation
  abbreviation     text,                                  -- 2–4 letters
  sector           text,
  capital          int,                                   -- -50..100
  growth           int,                                   -- -50..100
  special_resource int,                                   -- 0..20
  reputation       int,                                   -- -20..20
  ownership        jsonb not null default '[]'::jsonb,    -- [{type:'personality'|'nation', id, share}]
  created_at       timestamptz not null default now()
);
create index if not exists nationverse_corporations_hq_idx on public.nationverse_corporations(hq_nation_id);

alter table public.nationverse_corporations enable row level security;

grant select on public.nationverse_corporations to anon, authenticated;
grant insert, update, delete on public.nationverse_corporations to authenticated;

drop policy if exists "nv_corps_select_all" on public.nationverse_corporations;
create policy "nv_corps_select_all" on public.nationverse_corporations for select using (true);

drop policy if exists "nv_corps_insert_admin" on public.nationverse_corporations;
create policy "nv_corps_insert_admin" on public.nationverse_corporations for insert with check (public.is_admin());

drop policy if exists "nv_corps_update_admin" on public.nationverse_corporations;
create policy "nv_corps_update_admin" on public.nationverse_corporations for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "nv_corps_delete_admin" on public.nationverse_corporations;
create policy "nv_corps_delete_admin" on public.nationverse_corporations for delete using (public.is_admin());

notify pgrst, 'reload schema';
