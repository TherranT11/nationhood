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
-- effect_type catalogue  (✓ = applied in-game; the rest are authored but NOT yet enforced):
--   archetype_pop_ceiling | archetype_pop_floor   (effect_key = archetype name)              ✓
--   confidence_ceiling                            (no key)                                   ✓
--   confidence_formation                          (no key; signed — penalty < 0, bonus > 0)  ✓
--   stat_tick                                     (effect_key = nation stat; signed per-tick delta) ✓
--   resource_ceiling                              (effect_key = production resource)          ✓ (_apply_modifier_bounds)
--   stat_ceiling | stat_floor                     (effect_key = nation stat)                  ✓ (_apply_modifier_bounds)
--   regime_ceiling | regime_floor                 (no key)                                    — inert

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
-- The tick the modifier became active on this nation — drives 'duration' end
-- conditions. The admin UI stamps it at assignment (1 for any pre-existing row).
alter table public.nation_modifiers add column if not exists since_tick int not null default 1;

-- End conditions: a modifier assigned to a nation is automatically LIFTED (its
-- nation_modifiers row deleted) at tick advance once it has at least one end
-- condition AND every one of them is satisfied (AND, not OR). A modifier with no
-- end conditions never auto-ends — only the admin removes it. Each condition is a
-- read-only threshold check against the nation's live state.
create table if not exists public.modifier_end_conditions (
  id           uuid primary key default gen_random_uuid(),
  modifier_id  uuid not null references public.national_modifiers (id) on delete cascade,
  cond_type    text not null,                 -- stat | regime | resource | economy | confidence | duration
  cond_op      text not null default 'gte',   -- gte (at or above) | lte (at or below)
  cond_key     text,                          -- stat / resource / economy metric; null for regime, confidence, duration
  cond_value   numeric not null default 0     -- the threshold (rank, raw value, %, or months for duration)
);
create index if not exists modifier_end_conditions_modifier_idx on public.modifier_end_conditions (modifier_id);

-- RLS: world-readable (the game reads them to enforce, the admin UI to display);
-- only the admin writes. Mirrors the nations table.
alter table public.national_modifiers enable row level security;
alter table public.modifier_effects    enable row level security;
alter table public.modifier_end_conditions enable row level security;
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

drop policy if exists "mec_select_all"   on public.modifier_end_conditions;
create policy "mec_select_all"   on public.modifier_end_conditions for select using (true);
drop policy if exists "mec_insert_admin" on public.modifier_end_conditions;
create policy "mec_insert_admin" on public.modifier_end_conditions for insert with check (public.is_admin());
drop policy if exists "mec_update_admin" on public.modifier_end_conditions;
create policy "mec_update_admin" on public.modifier_end_conditions for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "mec_delete_admin" on public.modifier_end_conditions;
create policy "mec_delete_admin" on public.modifier_end_conditions for delete using (public.is_admin());

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

-- Bounds are enforced DIRECTIONALLY (callers in schema/40 pass old + freshly-
-- computed popularity): a raise is capped by the ceiling, a drop is held up by the
-- floor — but neither reverses the action. A party already outside its band is
-- grandfathered (the bound never yanks it back across its starting point), so a
-- raise never cuts and a drop never lifts. No matching modifier → p_new unchanged.

-- A raising action's result, capped by the archetype ceiling but never below where
-- it started (an over-cap party keeps its standing; the ceiling just blocks gains).
create or replace function public._mod_cap_raise(p_nation text, p_archetype text, p_old numeric, p_new numeric)
returns numeric language sql stable security definer set search_path = public as $$
  select greatest(p_old, least(p_new, coalesce(public._mod_archetype_pop_ceiling(p_nation, p_archetype), p_new)));
$$;

-- A dropping action's result, held up by the archetype floor but never raised above
-- where it started (a below-floor party isn't lifted by being attacked/penalised).
create or replace function public._mod_floor_drop(p_nation text, p_archetype text, p_old numeric, p_new numeric)
returns numeric language sql stable security definer set search_path = public as $$
  select least(p_old, greatest(p_new, coalesce(public._mod_archetype_pop_floor(p_nation, p_archetype), p_new)));
$$;

-- The combined Rate Multiplier a nation's active modifiers apply to a key ('income' or a
-- production resource). Multipliers on the same key COMPOUND (×1.4 then ×0.9 → ×1.26); no modifier
-- → 1.0 (unchanged). Read at the points those rates are applied (income in schema/60, production in
-- schema/113). Only positive multipliers count — a 0/blank value is treated as "no effect".
create or replace function public._mod_rate_multiplier(p_nation text, p_key text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v numeric := 1; r record;
begin
  for r in
    select e.effect_value from public.nation_modifiers nm
      join public.modifier_effects e on e.modifier_id = nm.modifier_id
     where nm.nation_id = p_nation and e.effect_type = 'rate_multiplier'
       and e.effect_key = p_key and coalesce(e.effect_value, 0) > 0
  loop v := v * r.effect_value; end loop;
  return v;
end $$;
revoke all on function public._mod_rate_multiplier(text, text) from public, anon, authenticated;

-- Safe numeric cast: returns null instead of throwing on non-numeric text (e.g. a
-- legacy free-text regime like "Electoral Democracy"). Used by the end-condition
-- reader so one bad jsonb value can never abort advance_tick.
create or replace function public._to_num(p text)
returns numeric language sql immutable as $$
  select case when p ~ '^\s*-?[0-9]+(\.[0-9]+)?\s*$' then p::numeric else null end;
$$;

-- ===========================================================================
-- End-condition evaluation — true when a modifier should be LIFTED from a nation:
-- it has at least one end condition AND every one is satisfied. Read-only against
-- live nation state; called by advance_tick() (schema/60). p_since = the tick the
-- modifier became active on this nation (for 'duration'); p_tick = the new tick.
-- ===========================================================================
create or replace function public._modifier_end_met(p_mod uuid, p_nation text, p_since int, p_tick int)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_n public.nations%rowtype; c record; v_cur numeric; v_total int;
begin
  select count(*) into v_total from public.modifier_end_conditions where modifier_id = p_mod;
  if v_total = 0 then return false; end if;          -- no conditions → never auto-ends
  select * into v_n from public.nations where id = p_nation;
  if not found then return false; end if;

  for c in select * from public.modifier_end_conditions where modifier_id = p_mod loop
    v_cur := null;
    case c.cond_type
      when 'stat'       then v_cur := public._to_num(v_n.stats      ->> c.cond_key);
      when 'regime'     then v_cur := public._to_num(v_n.economy    ->> 'regime');
      when 'resource'   then v_cur := public._to_num(v_n.production ->> c.cond_key);
      when 'economy'    then
        v_cur := case c.cond_key
                   when 'gdp'        then v_n.gdp::numeric
                   when 'population' then v_n.population
                   else public._to_num(v_n.economy ->> c.cond_key)
                 end;
      when 'confidence' then
        select g.confidence into v_cur from public.governments g
          where g.nation_id = p_nation and g.status = 'active';
      when 'duration'   then v_cur := p_tick - p_since;   -- months active
      else return false;                                  -- unknown condition → never satisfied
    end case;
    if v_cur is null then return false; end if;           -- no value to test → condition unmet
    if c.cond_op = 'gte' then
      if v_cur < c.cond_value then return false; end if;
    else  -- 'lte'
      if v_cur > c.cond_value then return false; end if;
    end if;
  end loop;
  return true;   -- every condition satisfied
end $$;

-- ---------------------------------------------------------------------------
-- Passive per-tick stat effects: every nation's active modifiers apply their signed
-- per-tick delta to the named stat each tick. Most stats live in stats (1..20); the two
-- economy stats (unemployment / inflation) live in economy (0..100), so route + clamp each
-- to the right column — one place that mapping is decided. Clamped by _nation_stat_add
-- (schema/91). Called by advance_tick (schema/60). Unlike the floor/ceiling bounds, this is
-- an additive mutation — it needs no enforcement chokepoint, it just runs each tick.
-- ---------------------------------------------------------------------------
-- Nudge one nation stat by a signed amount, into its valid band — the ONE source the passive
-- per-tick and per-year modifier appliers share. Unemployment / inflation live in economy (0–100);
-- every other stat in stats (1–20).
create or replace function public._apply_modifier_stat_effect(p_nation text, p_key text, p_value numeric)
returns void language plpgsql security definer set search_path = public as $$
declare v_econ boolean := p_key in ('unemployment', 'inflation');
begin
  perform public._nation_stat_add(p_nation, case when v_econ then 'economy' else 'stats' end,
            p_key, p_value, case when v_econ then 0 else 1 end, case when v_econ then 100 else 20 end);
end $$;
revoke all on function public._apply_modifier_stat_effect(text, text, numeric) from public, anon, authenticated;

create or replace function public._apply_modifier_tick_effects()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    select nm.nation_id, e.effect_key, e.effect_value
      from public.nation_modifiers nm
      join public.modifier_effects e on e.modifier_id = nm.modifier_id
     where e.effect_type = 'stat_tick' and e.effect_key is not null and e.effect_value <> 0
  loop
    perform public._apply_modifier_stat_effect(r.nation_id, r.effect_key, r.effect_value);
  end loop;
end $$;
revoke all on function public._apply_modifier_tick_effects() from public, anon, authenticated;

-- Passive Per-YEAR stat effects: the same nudge as per-tick, but once a year (each January).
-- Self-filters to January from advance_tick (schema/60); a no-op the other eleven months.
create or replace function public._apply_modifier_year_effects(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if (p_tick - 1) % 12 <> 0 then return; end if;   -- January only (tick 1, 13, 25, …)
  for r in
    select nm.nation_id, e.effect_key, e.effect_value
      from public.nation_modifiers nm
      join public.modifier_effects e on e.modifier_id = nm.modifier_id
     where e.effect_type = 'stat_year' and e.effect_key is not null and e.effect_value <> 0
  loop
    perform public._apply_modifier_stat_effect(r.nation_id, r.effect_key, r.effect_value);
  end loop;
end $$;
revoke all on function public._apply_modifier_year_effects(int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- _apply_modifier_bounds(): the per-tick ENFORCEMENT chokepoint for the absolute bounds —
-- stat_floor / stat_ceiling (nation stats) and resource_ceiling (production). Runs LAST in
-- advance_tick (schema/60), after every stat-moving step, so the bound is the final word each
-- tick: a stat the month's economics pushed past a ceiling is pulled back to it, one held below
-- a floor is lifted to it. The TIGHTEST bound wins when a nation has several on one stat — the
-- lowest ceiling, the highest floor. The clamp reuses _nation_stat_add with a zero delta (it
-- already clamps the existing value into [lo, hi]); the two economy stats (unemployment /
-- inflation) live in economy, the rest in stats, and resources in production.
-- ---------------------------------------------------------------------------
create or replace function public._apply_modifier_bounds()
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_econ boolean;
begin
  -- Stat floors/ceilings → clamp each bounded nation stat into [tightest floor, tightest ceiling].
  for r in
    select nm.nation_id, e.effect_key as stat,
           max(e.effect_value) filter (where e.effect_type = 'stat_floor')   as flr,
           min(e.effect_value) filter (where e.effect_type = 'stat_ceiling') as ceil
      from public.nation_modifiers nm
      join public.modifier_effects e on e.modifier_id = nm.modifier_id
     where e.effect_type in ('stat_floor', 'stat_ceiling') and e.effect_key is not null
     group by nm.nation_id, e.effect_key
  loop
    v_econ := r.stat in ('unemployment', 'inflation');
    perform public._nation_stat_add(r.nation_id, case when v_econ then 'economy' else 'stats' end, r.stat, 0, r.flr, r.ceil);
  end loop;
  -- Resource floors/ceilings → clamp each bounded production resource into [tightest floor, tightest
  -- ceiling]. A floor holds output up (an export tier that can't collapse); a ceiling caps it.
  for r in
    select nm.nation_id, e.effect_key as res,
           max(e.effect_value) filter (where e.effect_type = 'resource_floor')   as flr,
           min(e.effect_value) filter (where e.effect_type = 'resource_ceiling') as ceil
      from public.nation_modifiers nm
      join public.modifier_effects e on e.modifier_id = nm.modifier_id
     where e.effect_type in ('resource_floor', 'resource_ceiling') and e.effect_key is not null
     group by nm.nation_id, e.effect_key
  loop
    perform public._nation_stat_add(r.nation_id, 'production', r.res, 0, r.flr, r.ceil);
  end loop;
end $$;
revoke all on function public._apply_modifier_bounds() from public, anon, authenticated;

notify pgrst, 'reload schema';
