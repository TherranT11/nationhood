-- ===========================================================================
-- National Modifiers — admin-defined effects attached to nations.
--
-- Stage 1 (this file): storage + assignment + admin CRUD (writes go straight to
-- these tables, gated by is_admin() RLS — same pattern as nations). Enforcement
-- (the ceilings/floors/penalties actually applying in-game) lands later in the
-- relevant resolver / action functions, which read these rows.
-- ===========================================================================

create table if not exists public.national_modifiers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  color         text not null default 'yellow',  -- red | yellow | green → the UI container colour
  description   text,
  effect_type   text not null,                   -- see the catalogue below
  effect_key    text,                            -- target id (archetype / resource / stat); null for confidence & regime
  effect_value  numeric not null default 0,      -- the ceiling / floor / penalty-or-bonus amount
  created_at    timestamptz not null default now()
);
-- effect_type catalogue:
--   archetype_pop_ceiling | archetype_pop_floor   (effect_key = archetype id)
--   resource_ceiling                              (effect_key = production resource)
--   stat_ceiling | stat_floor                     (effect_key = nation stat)
--   confidence_ceiling                            (no key)
--   confidence_formation                          (no key; signed — penalty < 0, bonus > 0)
--   regime_ceiling | regime_floor                 (no key)

-- Many-to-many: a modifier can be assigned to several nations, a nation can carry several.
create table if not exists public.nation_modifiers (
  nation_id    text not null references public.nations (id) on delete cascade,
  modifier_id  uuid not null references public.national_modifiers (id) on delete cascade,
  primary key (nation_id, modifier_id)
);
create index if not exists nation_modifiers_nation_idx on public.nation_modifiers (nation_id);

-- RLS: world-readable (the game reads them to enforce, the admin UI to display);
-- only the admin writes. Mirrors the nations table.
alter table public.national_modifiers enable row level security;
alter table public.nation_modifiers   enable row level security;

drop policy if exists "nm_select_all"   on public.national_modifiers;
create policy "nm_select_all"   on public.national_modifiers for select using (true);
drop policy if exists "nm_insert_admin" on public.national_modifiers;
create policy "nm_insert_admin" on public.national_modifiers for insert with check (public.is_admin());
drop policy if exists "nm_update_admin" on public.national_modifiers;
create policy "nm_update_admin" on public.national_modifiers for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "nm_delete_admin" on public.national_modifiers;
create policy "nm_delete_admin" on public.national_modifiers for delete using (public.is_admin());

drop policy if exists "nmod_select_all"   on public.nation_modifiers;
create policy "nmod_select_all"   on public.nation_modifiers for select using (true);
drop policy if exists "nmod_insert_admin" on public.nation_modifiers;
create policy "nmod_insert_admin" on public.nation_modifiers for insert with check (public.is_admin());
drop policy if exists "nmod_delete_admin" on public.nation_modifiers;
create policy "nmod_delete_admin" on public.nation_modifiers for delete using (public.is_admin());

-- ===========================================================================
-- Stage 2 enforcement readers — the ONE place each modifier kind is reduced.
-- Internal helpers, read straight from the (world-readable) tables.
-- ===========================================================================

-- Government Confidence on formation: penalties/bonuses SUM (signed).
create or replace function public._mod_confidence_formation(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(m.effect_value), 0)
    from public.nation_modifiers nm
    join public.national_modifiers m on m.id = nm.modifier_id
   where nm.nation_id = p_nation and m.effect_type = 'confidence_formation';
$$;

-- Government Confidence ceiling: the most restrictive (min); 100 when uncapped.
create or replace function public._mod_confidence_ceiling(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(min(m.effect_value), 100)
    from public.nation_modifiers nm
    join public.national_modifiers m on m.id = nm.modifier_id
   where nm.nation_id = p_nation and m.effect_type = 'confidence_ceiling';
$$;
