-- ===========================================================================
-- 273 · Nationverse modifiers — reusable modifier DEFINITIONS authored in /backend.
--
-- A modifier is a named bundle of effects. Every effect is built from the SAME reusable shape (no
-- per-modifier special-casing), mirroring the admin's Effect Builder:
--   { category, operation, target, value, timing, duration, frequency, conditions }
-- where category ∈ {National Statistic, Interest-Group Opinion, Party Approval, Policy,
-- Situation / Event, Role Action, Restriction} and operation ∈ the universal operation list
-- (Add, Subtract, Set, Multiply, Increase by %, Set minimum, Unlock, Hide, …).
--
-- This table stores the DEFINITIONS only; applying a modifier to a nation/role/etc. is a separate
-- engine built later. Auth reuses is_admin() (schema/10): public read, admin-only write.
-- Depends on: 10 (is_admin). Idempotent. Apply after 272.
-- ===========================================================================

create table if not exists public.nationverse_modifiers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  effects     jsonb not null default '[]'::jsonb,   -- [{category, operation, target, value, timing, duration, frequency, conditions}]
  created_at  timestamptz not null default now()
);

alter table public.nationverse_modifiers enable row level security;

grant select on public.nationverse_modifiers to anon, authenticated;
grant insert, update, delete on public.nationverse_modifiers to authenticated;

drop policy if exists "nv_mods_select_all" on public.nationverse_modifiers;
create policy "nv_mods_select_all" on public.nationverse_modifiers for select using (true);

drop policy if exists "nv_mods_insert_admin" on public.nationverse_modifiers;
create policy "nv_mods_insert_admin" on public.nationverse_modifiers for insert with check (public.is_admin());

drop policy if exists "nv_mods_update_admin" on public.nationverse_modifiers;
create policy "nv_mods_update_admin" on public.nationverse_modifiers for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "nv_mods_delete_admin" on public.nationverse_modifiers;
create policy "nv_mods_delete_admin" on public.nationverse_modifiers for delete using (public.is_admin());

notify pgrst, 'reload schema';
