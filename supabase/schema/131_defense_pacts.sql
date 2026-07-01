-- ===========================================================================
-- 131 · Mutual defence pacts — the alliance between two nations that lets each build a
-- military base on the other's soil (the Abroad option, a later slice) and, in time,
-- deploy there. A pact is symmetric and unique per pair: one row, nations stored in a
-- canonical order (nation_a < nation_b) so (A,B) and (B,A) can never both exist.
--
-- SCOPE NOTE: the player-facing signing flow (the Foreign Affairs Minister proposes, the
-- other nation accepts) is NOT built yet. For now pacts are seeded by the admin (RLS below
-- gates writes to is_admin, like nations), which is enough to stand up Abroad + Deploy. The
-- Foreign-Minister propose/accept RPCs will later write to this same table.
-- Depends on: 10 (nations, is_admin). Run after 10.
-- ===========================================================================

create table if not exists public.defense_pacts (
  id         uuid primary key default gen_random_uuid(),
  nation_a   text not null references public.nations (id) on delete cascade,
  nation_b   text not null references public.nations (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint defense_pacts_order check (nation_a < nation_b),   -- canonical order → no dupes or reversed pairs
  unique (nation_a, nation_b)
);

-- World-readable (alliances are public — the Conflict page shows them). Writes are admin-only
-- for now (the seeding path); the Foreign-Minister flow will add a security-definer RPC later.
alter table public.defense_pacts enable row level security;
grant select on public.defense_pacts to authenticated;
grant insert, delete on public.defense_pacts to authenticated;
drop policy if exists "defense_pacts_select_all" on public.defense_pacts;
create policy "defense_pacts_select_all" on public.defense_pacts for select using (true);
drop policy if exists "defense_pacts_insert_admin" on public.defense_pacts;
create policy "defense_pacts_insert_admin" on public.defense_pacts for insert with check (public.is_admin());
drop policy if exists "defense_pacts_delete_admin" on public.defense_pacts;
create policy "defense_pacts_delete_admin" on public.defense_pacts for delete using (public.is_admin());

-- Do these two nations hold a mutual defence pact? ONE source for the check — order-agnostic,
-- read by Abroad base-building (and later Deploy). Given as (x, y) in any order.
create or replace function public._have_defense_pact(p_x text, p_y text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.defense_pacts
     where nation_a = least(p_x, p_y) and nation_b = greatest(p_x, p_y)
  );
$$;
grant execute on function public._have_defense_pact(text, text) to authenticated;

notify pgrst, 'reload schema';
