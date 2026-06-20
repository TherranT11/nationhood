-- ===========================================================================
-- National Modifiers — admin-defined effects attached to nations.
--
-- A modifier is a named, coloured container (national_modifiers) that carries
-- one OR MORE effects (modifier_effects). Each effect is its own row — ONE
-- SOURCE per effect — so a single modifier (e.g. "War Economy") can raise a
-- militarist popularity ceiling, cap a resource, and dock formation confidence
-- all at once.
--
-- Stage 1: storage + assignment + admin CRUD (writes go straight to these
-- tables, gated by is_admin() RLS — same pattern as nations). Enforcement (the
-- ceilings/floors/penalties actually applying in-game) lands in the relevant
-- resolver / action functions, which read these rows via the helpers below.
-- ===========================================================================

create table if not exists public.national_modifiers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  color         text not null default 'yellow',  -- red | yellow | green → the UI container colour
  description   text,
  created_at    timestamptz not null default now()
);

-- One row per effect on a modifier.
create table if not exists public.modifier_effects (
  id            uuid primary key default gen_random_uuid(),
  modifier_id   uuid not null references public.national_modifiers (id) on delete cascade,
  effect_type   text not null,                   -- see the catalogue below
  effect_key    text,                            -- target id (archetype / resource / stat); null for confidence & regime
  effect_value  numeric not null default 0       -- the ceiling / floor / penalty-or-bonus amount
);
create index if not exists modifier_effects_modifier_idx on public.modifier_effects (modifier_id);
-- effect_type catalogue:
--   archetype_pop_ceiling | archetype_pop_floor   (effect_key = archetype name)
--   resource_ceiling                              (effect_key = production resource)
--   stat_ceiling | stat_floor                     (effect_key = nation stat)
--   confidence_ceiling                            (no key)
--   confidence_formation                          (no key; signed — penalty < 0, bonus > 0)
--   regime_ceiling | regime_floor                 (no key)

-- One-time migration: earlier the single effect lived as scalar columns on
-- national_modifiers. Move any such effect into the child table, then drop the
-- old columns. Safe to re-run — once the columns are gone this block is a no-op.
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'national_modifiers'
                and column_name = 'effect_type') then
    insert into public.modifier_effects (modifier_id, effect_type, effect_key, effect_value)
      select id, effect_type, effect_key, coalesce(effect_value, 0)
        from public.national_modifiers
       where effect_type is not null;
    alter table public.national_modifiers drop column effect_type;
    alter table public.national_modifiers drop column effect_key;
    alter table public.national_modifiers drop column effect_value;
  end if;
end $$;

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
alter table public.modifier_effects    enable row level security;
alter table public.nation_modifiers    enable row level security;

drop policy if exists "nm_select_all"   on public.national_modifiers;
create policy "nm_select_all"   on public.national_modifiers for select using (true);
drop policy if exists "nm_insert_admin" on public.national_modifiers;
create policy "nm_insert_admin" on public.national_modifiers for insert with check (public.is_admin());
drop policy if exists "nm_update_admin" on public.national_modifiers;
create policy "nm_update_admin" on public.national_modifiers for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "nm_delete_admin" on public.national_modifiers;
create policy "nm_delete_admin" on public.national_modifiers for delete using (public.is_admin());

drop policy if exists "me_select_all"   on public.modifier_effects;
create policy "me_select_all"   on public.modifier_effects for select using (true);
drop policy if exists "me_insert_admin" on public.modifier_effects;
create policy "me_insert_admin" on public.modifier_effects for insert with check (public.is_admin());
drop policy if exists "me_update_admin" on public.modifier_effects;
create policy "me_update_admin" on public.modifier_effects for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "me_delete_admin" on public.modifier_effects;
create policy "me_delete_admin" on public.modifier_effects for delete using (public.is_admin());

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
  select coalesce(sum(e.effect_value), 0)
    from public.nation_modifiers nm
    join public.modifier_effects e on e.modifier_id = nm.modifier_id
   where nm.nation_id = p_nation and e.effect_type = 'confidence_formation';
$$;

-- Government Confidence ceiling: the most restrictive (min); 100 when uncapped.
create or replace function public._mod_confidence_ceiling(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(min(e.effect_value), 100)
    from public.nation_modifiers nm
    join public.modifier_effects e on e.modifier_id = nm.modifier_id
   where nm.nation_id = p_nation and e.effect_type = 'confidence_ceiling';
$$;

-- Archetype popularity ceiling for an archetype in a nation: the most restrictive
-- (min) of any applicable ceiling modifier; null when there is none (uncapped).
create or replace function public._mod_archetype_pop_ceiling(p_nation text, p_archetype text)
returns numeric language sql stable security definer set search_path = public as $$
  select min(e.effect_value)
    from public.nation_modifiers nm
    join public.modifier_effects e on e.modifier_id = nm.modifier_id
   where nm.nation_id = p_nation and e.effect_type = 'archetype_pop_ceiling' and e.effect_key = p_archetype;
$$;

-- Archetype popularity floor: the most generous (max); null when there is none.
create or replace function public._mod_archetype_pop_floor(p_nation text, p_archetype text)
returns numeric language sql stable security definer set search_path = public as $$
  select max(e.effect_value)
    from public.nation_modifiers nm
    join public.modifier_effects e on e.modifier_id = nm.modifier_id
   where nm.nation_id = p_nation and e.effect_type = 'archetype_pop_floor' and e.effect_key = p_archetype;
$$;

-- Clamp a proposed popularity into the archetype modifier band [floor, ceiling].
-- The ONE place the two readers above are combined: callers (the leader actions
-- in schema/40) pass their freshly-computed popularity through this before saving,
-- so an archetype's cap/floor is enforced at every write. No modifier → no change
-- (each bound coalesces to the input). If a ceiling sits below a floor, the
-- ceiling wins (most restrictive). Internal — not granted to clients.
create or replace function public._mod_clamp_pop(p_nation text, p_archetype text, p_pop numeric)
returns numeric language sql stable security definer set search_path = public as $$
  select least(
           greatest(p_pop, coalesce(public._mod_archetype_pop_floor(p_nation, p_archetype), p_pop)),
           coalesce(public._mod_archetype_pop_ceiling(p_nation, p_archetype), p_pop)
         );
$$;

notify pgrst, 'reload schema';
