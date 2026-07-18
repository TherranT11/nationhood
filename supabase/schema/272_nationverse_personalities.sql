-- ===========================================================================
-- 272 · Nationverse personalities — named figures tied to a new-universe nation.
--
-- The /backend admin panel's "Personalities" tool creates these against an EXISTING nationverse_nation
-- (chosen from a dropdown), so unlike the Nation Creator (atomic create) they are independent rows with
-- real add/edit/delete. Each has a name, starting age, description, and a role (a party politician —
-- 'Politician of Party 1..5', positional to the nation's party slots — or a fixed role like Oligarch,
-- Warlord, Monarch, …). Auth reuses is_admin() (schema/10): public read, admin-only write.
-- Depends on: 10 (is_admin), 271 (nationverse_nations). Idempotent. Apply after 271.
-- ===========================================================================

create table if not exists public.nationverse_personalities (
  id           uuid primary key default gen_random_uuid(),
  nation_id    uuid not null references public.nationverse_nations(id) on delete cascade,
  name         text not null,
  starting_age int,
  description  text,
  role         text,
  created_at   timestamptz not null default now()
);
create index if not exists nationverse_personalities_nation_idx on public.nationverse_personalities(nation_id);

alter table public.nationverse_personalities enable row level security;

grant select on public.nationverse_personalities to anon, authenticated;
grant insert, update, delete on public.nationverse_personalities to authenticated;

drop policy if exists "nv_pers_select_all" on public.nationverse_personalities;
create policy "nv_pers_select_all" on public.nationverse_personalities for select using (true);

drop policy if exists "nv_pers_insert_admin" on public.nationverse_personalities;
create policy "nv_pers_insert_admin" on public.nationverse_personalities for insert with check (public.is_admin());

drop policy if exists "nv_pers_update_admin" on public.nationverse_personalities;
create policy "nv_pers_update_admin" on public.nationverse_personalities for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "nv_pers_delete_admin" on public.nationverse_personalities;
create policy "nv_pers_delete_admin" on public.nationverse_personalities for delete using (public.is_admin());

notify pgrst, 'reload schema';
