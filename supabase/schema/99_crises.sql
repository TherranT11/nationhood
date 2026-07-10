-- 99 · Crises (admin-authored)
-- World-readable, admin-only writes via is_admin() — the same pattern as policies
-- and convictions. The whole crisis is one JSONB definition per row: the canonical
-- object the admin Crisis Builder edits. A crisis fires when ALL its triggers are
-- true, then climbs a meter through five stages; management actions push it back
-- down, and reaching the terminal stage applies its effect.
--
--   definition = {
--     name, desc,
--     triggers: [ { target, op, value } ... ],              -- all must be true to fire
--     stages: [ stage1, stage2, stage3, stage4, stage5 ]    -- exactly five
--   }
--   stage 1-4 = { name, desc, growth (1 | 2 | 'd3'), at (escalation points),
--                 actions: [ action ... ] }
--   action (minister) = { type:'minister', decision, ministry, cause, mech ('roll'|'direct'),
--                         direct:[eff], stat, needed, success:[eff], failure:[eff],
--                         eventSuccess, eventFail }
--   action (law)      = { type:'law', lawName, lawEffect:[eff] }
--   stage 5 (terminal) = { descReached, reached:[eff], resolution ('persistent'|'ends') }
--   eff = { t (target), v (value) }   -- target e.g. 'Crisis Meter', 'Order', 'Budget'

create table if not exists public.crises (
  id         uuid primary key default gen_random_uuid(),
  definition jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.crises enable row level security;

drop policy if exists "crises_select_all"   on public.crises;
create policy "crises_select_all"   on public.crises for select using (true);
drop policy if exists "crises_insert_admin" on public.crises;
create policy "crises_insert_admin" on public.crises for insert with check (public.is_admin());
drop policy if exists "crises_update_admin" on public.crises;
create policy "crises_update_admin" on public.crises for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "crises_delete_admin" on public.crises;
create policy "crises_delete_admin" on public.crises for delete using (public.is_admin());

-- ===========================================================================
-- Crisis RUNTIME — Phase 1: firing + escalation (no player actions yet).
-- A crisis fires on a nation when ALL its triggers are true, then climbs a meter by the
-- active stage's growth each tick; crossing the stage's `at` escalates to the next stage
-- and the meter RESETS (each stage is a fresh climb — Phase-1 decision, flagged for
-- review before the management UI lands). Reaching stage 5 applies its `reached` effects;
-- 'ends' resolves the instance, 'persistent' leaves it standing. Driven from advance_tick
-- via _apply_crisis_tick (schema/60). Player management actions (the meter-DOWN side) and
-- re-fire semantics are Phase 2 — Phase 1 fires once per nation per crisis.
-- ===========================================================================

-- Per-nation live crisis state. World-readable (like nations/events); NO client writes —
-- only the security-definer runtime touches it. One row per (nation, crisis): Phase 1
-- fires once, so a plain UNIQUE holds.
create table if not exists public.nation_crises (
  id           uuid primary key default gen_random_uuid(),
  nation_id    text not null references public.nations (id) on delete cascade,
  crisis_id    uuid not null references public.crises (id) on delete cascade,
  stage        int  not null default 1,           -- 1..5 (5 = terminal)
  meter        numeric not null default 0,        -- climbs by the stage growth; resets on escalation
  status       text not null default 'active',    -- 'active' | 'resolved'
  created_at   timestamptz not null default now(),
  unique (nation_id, crisis_id)
);

-- Custom crisis stats (admin-authored per crisis: definition.customStats = [{name,start,growth}]).
-- stat_values holds THIS instance's live value per stat name {name: 0..100}, seeded from `start`
-- on fire and nudged by `growth` each tick; laws/minister actions and thresholds move it via the
-- 'stat:<name>' effect target. fired_thresholds records the indices of "If STAT reaches X then Y"
-- rules that have already fired on this instance, so each fires ONCE.
alter table public.nation_crises add column if not exists stat_values      jsonb not null default '{}'::jsonb;
alter table public.nation_crises add column if not exists fired_thresholds  jsonb not null default '[]'::jsonb;

alter table public.nation_crises enable row level security;
drop policy if exists "nation_crises_select_all" on public.nation_crises;
create policy "nation_crises_select_all" on public.nation_crises for select using (true);
-- (No insert/update/delete policy: clients never write; the runtime is security definer.)

-- Read a nation stat by its authored display name, for trigger evaluation. MIRRORS the
-- target map in _apply_policy_effect (schema/91) — keep the two in sync. Returns null for
-- unknown/derived targets (Tax Burden %, Business Climate aren't stored), so a trigger on
-- one simply never passes rather than firing on a value that doesn't exist.
create or replace function public._nation_stat_get(p_nation text, p_target text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_raw text;
begin
  case p_target
    when 'Prosperity'     then select stats->>'prosperity'      into v_raw from public.nations where id = p_nation;
    when 'Welfare'        then select stats->>'welfare'         into v_raw from public.nations where id = p_nation;
    when 'Growth'         then select stats->>'growth'          into v_raw from public.nations where id = p_nation;
    when 'Order'          then select stats->>'order'           into v_raw from public.nations where id = p_nation;
    when 'Image'          then select stats->>'image'           into v_raw from public.nations where id = p_nation;
    when 'Unemployment %' then select economy->>'unemployment'  into v_raw from public.nations where id = p_nation;
    when 'Inflation %'    then select economy->>'inflation'     into v_raw from public.nations where id = p_nation;
    when 'Regime'         then select economy->>'regime_reform' into v_raw from public.nations where id = p_nation;
    when 'Budget'         then select economy->>'budget'        into v_raw from public.nations where id = p_nation;
    when 'Debt'           then select economy->>'debt'          into v_raw from public.nations where id = p_nation;
    when 'Income'         then select economy->>'income'        into v_raw from public.nations where id = p_nation;
    when 'Energy'         then select production->>'energy'      into v_raw from public.nations where id = p_nation;
    when 'Food'           then select production->>'food'        into v_raw from public.nations where id = p_nation;
    when 'Minerals'       then select production->>'minerals'    into v_raw from public.nations where id = p_nation;
    when 'Goods'          then select production->>'goods'        into v_raw from public.nations where id = p_nation;
    when 'Services'       then select production->>'services'    into v_raw from public.nations where id = p_nation;
    when 'Diplomacy'      then select production->>'diplomacy'    into v_raw from public.nations where id = p_nation;
    when 'Government Confidence' then
      select confidence::text into v_raw from public.governments where nation_id = p_nation and status = 'active';
    else return null;   -- unknown or derived target → unevaluable
  end case;
  if v_raw is null or v_raw !~ '^-?[0-9]+(\.[0-9]+)?$' then return null; end if;
  return v_raw::numeric;
end $$;
revoke all on function public._nation_stat_get(text, text) from public, anon, authenticated;

-- ONE op-comparison for crisis conditions (triggers + the "ends if" resolvers). Accepts
-- both the ASCII (<=, >=) and the UI's unicode (≤, ≥) forms — the Crisis Builder emits the
-- unicode ones, so handling them here is what makes ≤/≥ conditions actually evaluate.
create or replace function public._crisis_cmp(p_cur numeric, p_op text, p_val numeric)
returns boolean language sql immutable as $$
  select case p_op
    when '<'  then p_cur <  p_val
    when '<=' then p_cur <= p_val   when '≤' then p_cur <= p_val
    when '>'  then p_cur >  p_val
    when '>=' then p_cur >= p_val   when '≥' then p_cur >= p_val
    when '='  then p_cur =  p_val   when '==' then p_cur =  p_val
    when '!=' then p_cur <> p_val
    else false end;
$$;
revoke all on function public._crisis_cmp(numeric, text, numeric) from public, anon, authenticated;

-- True when a crisis definition's triggers hold for the nation. definition.triggerMode picks
-- the match: 'all' (default — every trigger must hold, AND) or 'any' (at least one holds, OR).
-- A trigger is {target, op, value}; an unreadable target (null) simply doesn't hold. A crisis
-- with no triggers never auto-fires (admin/manual seeding only).
create or replace function public._crisis_triggers_met(p_nation text, p_def jsonb)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_trigs jsonb := p_def->'triggers'; v_t jsonb; v_cur numeric; v_any boolean; v_met boolean;
begin
  if v_trigs is null or jsonb_typeof(v_trigs) <> 'array' or jsonb_array_length(v_trigs) = 0 then
    return false;
  end if;
  v_any := coalesce(p_def->>'triggerMode', 'all') = 'any';   -- absent → 'all' (existing crises)
  for v_t in select value from jsonb_array_elements(v_trigs) loop
    v_cur := public._nation_stat_get(p_nation, v_t->>'target');
    v_met := v_cur is not null and public._crisis_cmp(v_cur, coalesce(v_t->>'op', '>='), coalesce((v_t->>'value')::numeric, 0));
    if v_any then
      if v_met then return true; end if;          -- OR: first hit fires it
    else
      if not v_met then return false; end if;     -- AND: first miss fails the test
    end if;
  end loop;
  return not v_any;   -- AND with no misses → true; OR with no hits → false
end $$;
revoke all on function public._crisis_triggers_met(text, jsonb) from public, anon, authenticated;

-- Custom crisis stats. _crisis_seed_stats builds a fresh {name: start} value map from a crisis
-- definition (clamped 0..100), stamped onto nation_crises.stat_values when the crisis fires.
-- _crisis_grow_stats returns the map advanced one tick — each stat's current value (or its start
-- if not yet present) plus its `growth`, re-clamped 0..100. Both drop orphaned keys (only the
-- currently-defined stats survive) and dedupe by name, so a renamed/removed stat can't linger.
create or replace function public._crisis_seed_stats(p_def jsonb)
returns jsonb language sql stable as $$
  select coalesce(jsonb_object_agg(name, val), '{}'::jsonb) from (
    select distinct on (s->>'name') s->>'name' as name,
           least(100, greatest(0, coalesce((s->>'start')::numeric, 0))) as val
      from jsonb_array_elements(coalesce(p_def->'customStats', '[]'::jsonb)) s
     where nullif(s->>'name', '') is not null
  ) q;
$$;
revoke all on function public._crisis_seed_stats(jsonb) from public, anon, authenticated;

create or replace function public._crisis_grow_stats(p_def jsonb, p_sv jsonb)
returns jsonb language sql stable as $$
  select coalesce(jsonb_object_agg(name, val), '{}'::jsonb) from (
    select distinct on (s->>'name') s->>'name' as name,
           least(100, greatest(0,
             coalesce((p_sv->>(s->>'name'))::numeric, coalesce((s->>'start')::numeric, 0))
             + coalesce((s->>'growth')::numeric, 0))) as val
      from jsonb_array_elements(coalesce(p_def->'customStats', '[]'::jsonb)) s
     where nullif(s->>'name', '') is not null
  ) q;
$$;
revoke all on function public._crisis_grow_stats(jsonb, jsonb) from public, anon, authenticated;

-- True when a crisis definition's `endIf` resolvers hold — the "Crisis immediately ends if"
-- conditions. definition.endMode picks the match: 'any' (default — any holds, OR) or 'all'
-- (every one holds, AND). Same {target, op, value} shape; a 'stat:<name>' target reads THIS
-- instance's custom stat from p_sv, every other target the nation's live stat. An unreadable
-- target doesn't hold. No endIf → never auto-resolves.
drop function if exists public._crisis_resolve_met(text, jsonb);   -- superseded by the (text,jsonb,jsonb) form
create or replace function public._crisis_resolve_met(p_nation text, p_def jsonb, p_sv jsonb)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_ends jsonb := p_def->'endIf'; v_t jsonb; v_cur numeric; v_all boolean; v_met boolean; v_tgt text;
begin
  if v_ends is null or jsonb_typeof(v_ends) <> 'array' or jsonb_array_length(v_ends) = 0 then
    return false;
  end if;
  v_all := coalesce(p_def->>'endMode', 'any') = 'all';   -- absent → 'any' (existing crises)
  for v_t in select value from jsonb_array_elements(v_ends) loop
    v_tgt := v_t->>'target';
    if left(coalesce(v_tgt, ''), 5) = 'stat:' then
      v_cur := public._to_num(p_sv->>substr(v_tgt, 6));   -- a custom crisis stat (this instance)
    else
      v_cur := public._nation_stat_get(p_nation, v_tgt);
    end if;
    v_met := v_cur is not null and public._crisis_cmp(v_cur, coalesce(v_t->>'op', '>='), coalesce((v_t->>'value')::numeric, 0));
    if v_all then
      if not v_met then return false; end if;     -- AND: first miss → not all met
    else
      if v_met then return true; end if;          -- OR: first hit resolves it
    end if;
  end loop;
  return v_all;   -- AND with no misses → true; OR with no hits → false
end $$;
revoke all on function public._crisis_resolve_met(text, jsonb, jsonb) from public, anon, authenticated;

-- Add a delta to a nation's on-hand stockpile of one resource (energy/food/minerals/goods/
-- services/military), floored at 0. ONE source for moving on_hand from a crisis — used by the
-- on-hand effect targets and the action resource-cost deduction.
create or replace function public._nation_onhand_add(p_nation text, p_res text, p_delta numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.nations
     set on_hand = jsonb_set(coalesce(on_hand, '{}'::jsonb), array[p_res],
                             to_jsonb(greatest(0, coalesce((on_hand->>p_res)::numeric, 0) + coalesce(p_delta, 0))))
   where id = p_nation;
end $$;
revoke all on function public._nation_onhand_add(text, text, numeric) from public, anon, authenticated;

-- Apply ONE crisis effect {t,v}. 'Crisis Meter' adjusts THIS instance's meter (floored at 0);
-- every other target — stats, economy, production, and "<Resource> on hand" stockpiles — rides
-- _apply_policy_effect (schema/91), the single source for stat mapping, clamping, money scaling,
-- on-hand routing, the confidence-collapse hook and popularity floors.
create or replace function public._apply_crisis_effect(p_id uuid, p_nation text, p_eff jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_key text;
begin
  if (p_eff->>'t') = 'Crisis Meter' then
    update public.nation_crises set meter = greatest(0, meter + coalesce((p_eff->>'v')::numeric, 0)) where id = p_id;
  elsif (p_eff->>'t') = 'End Crisis' then
    -- Resolve THIS instance outright (value ignored). The tick re-reads status and announces it;
    -- from a player/stage action the crisis simply ends. Idempotent — only an active row resolves.
    update public.nation_crises set status = 'resolved' where id = p_id and status = 'active';
  elsif left(coalesce(p_eff->>'t', ''), 5) = 'stat:' then
    -- A custom crisis stat on THIS instance: nudge stat_values[<name>], clamped 0..100.
    v_key := substr(p_eff->>'t', 6);
    update public.nation_crises
       set stat_values = jsonb_set(coalesce(stat_values, '{}'::jsonb), array[v_key],
             to_jsonb(least(100, greatest(0, coalesce((stat_values->>v_key)::numeric, 0) + coalesce((p_eff->>'v')::numeric, 0)))))
     where id = p_id;
  else
    perform public._apply_policy_effect(p_nation, p_eff);
  end if;
end $$;
revoke all on function public._apply_crisis_effect(uuid, text, jsonb) from public, anon, authenticated;

-- "If [STAT] reaches [X] then [Y]" threshold rules (definition.thresholds = [{stat,op,value,
-- effects:[eff]}]). Each fires ONCE per instance: for every rule not yet in p_fired whose custom
-- stat now satisfies its op/value, apply its effects and record the rule's index. Returns the
-- updated fired-index array (the caller persists it). Effects ride _apply_crisis_effect (one
-- source), so a rule can move another custom stat, the Crisis Meter, or a national stat.
create or replace function public._crisis_fire_thresholds(p_id uuid, p_nation text, p_def jsonb, p_sv jsonb, p_fired jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ths jsonb := p_def->'thresholds'; v_t jsonb; v_i int := 0; v_cur numeric; v_eff jsonb; v_fired jsonb := coalesce(p_fired, '[]'::jsonb);
begin
  if v_ths is null or jsonb_typeof(v_ths) <> 'array' then return v_fired; end if;
  for v_t in select value from jsonb_array_elements(v_ths) loop
    if not (v_fired @> to_jsonb(v_i)) then         -- skip rules already fired on this instance
      v_cur := public._to_num(p_sv->>(v_t->>'stat'));
      if v_cur is not null and public._crisis_cmp(v_cur, coalesce(v_t->>'op', '>='), coalesce((v_t->>'value')::numeric, 0)) then
        for v_eff in select value from jsonb_array_elements(coalesce(v_t->'effects', '[]'::jsonb)) loop
          perform public._apply_crisis_effect(p_id, p_nation, v_eff);
        end loop;
        v_fired := v_fired || to_jsonb(v_i);
      end if;
    end if;
    v_i := v_i + 1;
  end loop;
  return v_fired;
end $$;
revoke all on function public._crisis_fire_thresholds(uuid, text, jsonb, jsonb, jsonb) from public, anon, authenticated;

-- Apply a stage's "Effect when stage activated" list (definition stage.onActivate) — the effects
-- that land the moment the crisis enters that stage (on fire for stage 1, on escalation for 2-4).
-- Each effect rides _apply_crisis_effect (one source), so a stat/resource/Crisis-Meter target
-- behaves exactly as it does for actions and the terminal stage's `reached`.
create or replace function public._apply_stage_activate(p_id uuid, p_nation text, p_stage jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_eff jsonb;
begin
  for v_eff in select value from jsonb_array_elements(coalesce(p_stage->'onActivate', '[]'::jsonb)) loop
    perform public._apply_crisis_effect(p_id, p_nation, v_eff);
  end loop;
end $$;
revoke all on function public._apply_stage_activate(uuid, text, jsonb) from public, anon, authenticated;

-- Activate the dormant breakaway nation a 'new_nation' resolution points at: a real,
-- still-dormant nation (authored in the Nations tab, linked by id) is un-dormanted and
-- given a first-election schedule, then announced. Idempotent — a re-run finds it already
-- live and does nothing, so a nation can't be spawned twice.
create or replace function public._crisis_spawn_nation(p_origin text, p_new_nation text)
returns void language plpgsql security definer set search_path = public as $$
declare v_tick int; v_name text; v_oname text; v_pop numeric;
begin
  if nullif(p_new_nation, '') is null then return; end if;
  select name, population into v_name, v_pop from public.nations where id = p_new_nation and dormant;
  if not found then return; end if;   -- not a dormant nation (gone, or already activated)
  select current_tick into v_tick from public.game_state where id;
  update public.nations
     set dormant = false,
         next_election_tick = coalesce(v_tick, 1) + 1 + floor(random() * 6)::int
   where id = p_new_nation;
  -- The breakaway's people secede FROM the origin: the origin loses the new nation's population
  -- (floored at 0). The dormant guard above makes this run once — a re-run finds it already live.
  update public.nations
     set population = greatest(0, coalesce(population, 0) - coalesce(v_pop, 0))
   where id = p_origin;
  select name into v_oname from public.nations where id = p_origin;
  insert into public.events (nation_id, party_id, kind, body, game_date, tone)
  values (p_new_nation, null, 'crisis',
          'A new nation has emerged from the crisis in ' || coalesce(v_oname, p_origin) || ': ' || v_name || '.',
          public.current_game_date(), 'warn');
end $$;
revoke all on function public._crisis_spawn_nation(text, text) from public, anon, authenticated;

-- Reaching stage 5: mark the terminal stage, apply its `reached` effects (via
-- _apply_crisis_effect), then resolve — 'ends' marks the instance resolved, 'persistent'
-- leaves it standing, and 'new_nation' spawns the linked breakaway and resolves.
create or replace function public._crisis_reach_terminal(p_id uuid, p_nation text, p_def jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_term jsonb := p_def->'stages'->4; v_eff jsonb; v_res text;
begin
  update public.nation_crises set stage = 5, meter = 0 where id = p_id;
  for v_eff in select value from jsonb_array_elements(coalesce(v_term->'reached', '[]'::jsonb)) loop
    perform public._apply_crisis_effect(p_id, p_nation, v_eff);
  end loop;
  v_res := coalesce(v_term->>'resolution', 'persistent');
  if v_res = 'new_nation' then
    perform public._crisis_spawn_nation(p_nation, v_term->>'newNation');
    update public.nation_crises set status = 'resolved' where id = p_id;   -- the breakaway resolves the crisis
  elsif v_res = 'ends' then
    update public.nation_crises set status = 'resolved' where id = p_id;
  end if;
  insert into public.events (nation_id, party_id, kind, body, game_date, tone)
  values (p_nation, null, 'crisis',
          'A crisis has reached its breaking point: ' || coalesce(p_def->>'name', 'Unnamed Crisis') || '.',
          public.current_game_date(), 'neg');
end $$;
revoke all on function public._crisis_reach_terminal(uuid, text, jsonb) from public, anon, authenticated;

-- The "a crisis has emerged" feed line — ONE source, written both when the tick fires a
-- crisis and when an admin force-fires one (crisis_force_fire).
create or replace function public._crisis_emerged_event(p_nation text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.events (nation_id, party_id, kind, body, game_date, tone)
  values (p_nation, null, 'crisis',
          'A crisis has emerged: ' || coalesce(p_name, 'Unnamed Crisis') || '.',
          public.current_game_date(), 'warn');
end $$;
revoke all on function public._crisis_emerged_event(text, text) from public, anon, authenticated;

-- The "a crisis has subsided" feed line — ONE source, written both when an endIf resolver holds
-- and when an End Crisis threshold/effect resolves the instance.
create or replace function public._crisis_subsided_event(p_nation text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.events (nation_id, party_id, kind, body, game_date, tone)
  values (p_nation, null, 'crisis',
          'The crisis has subsided: ' || coalesce(p_name, 'Unnamed Crisis') || '.',
          public.current_game_date(), 'pos');
end $$;
revoke all on function public._crisis_subsided_event(text, text) from public, anon, authenticated;

-- The per-tick crisis pass (called by advance_tick, schema/60). FIRE: start any crisis
-- whose triggers are now met on a nation not already running it (fire-once in Phase 1).
-- GROW: climb each active crisis's meter by its stage growth (1 | 2 | 1d3); crossing the
-- stage's `at` escalates one stage (meter resets); reaching stage 5 goes terminal. Each
-- nation/crisis step is isolated so one bad row can't abort the rest; events narrate it.
create or replace function public._apply_crisis_tick(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_n text; v_c record; v_active record; v_new_id uuid;
  v_def jsonb; v_stage jsonb; v_growth text; v_inc numeric; v_at numeric;
  v_sv jsonb; v_fired jsonb; v_meter numeric; v_status text;
begin
  -- FIRE  (dormant nations are inert — they neither host crises nor get auto-scheduled)
  for v_n in select id from public.nations where not coalesce(dormant, false) loop
    for v_c in select id, definition from public.crises loop
      begin
        -- A nation-scoped crisis (definition.nation set) only fires on its chosen nation;
        -- an unscoped crisis stays global.
        if nullif(v_c.definition->>'nation', '') is not null and v_c.definition->>'nation' <> v_n then
          continue;
        end if;
        if exists (select 1 from public.nation_crises where nation_id = v_n and crisis_id = v_c.id) then
          continue;   -- Phase 1: fire once per nation per crisis
        end if;
        if public._crisis_triggers_met(v_n, v_c.definition) then
          insert into public.nation_crises (nation_id, crisis_id, stat_values)   -- stage 1, meter 0 by default; custom stats seeded
            values (v_n, v_c.id, public._crisis_seed_stats(v_c.definition))
            returning id into v_new_id;
          perform public._apply_stage_activate(v_new_id, v_n, v_c.definition->'stages'->0);   -- stage 1's on-activation effects
          perform public._crisis_emerged_event(v_n, v_c.definition->>'name');
        end if;
      exception when others then
        raise warning 'tick %: crisis-fire failed for nation % crisis % — %', p_tick, v_n, v_c.id, sqlerrm;
      end;
    end loop;
  end loop;

  -- GROW + ESCALATE
  for v_active in
    select nc.id, nc.nation_id, nc.stage, nc.meter, nc.stat_values, nc.fired_thresholds, c.definition
      from public.nation_crises nc join public.crises c on c.id = nc.crisis_id
     where nc.status = 'active'
  loop
    begin
      -- Custom crisis stats advance one tick (grow by each stat's per-tick growth), then any
      -- "If STAT reaches X then Y" threshold that just crossed fires once. Both run even at the
      -- terminal stage, so a persistent crisis's stats keep moving and can still resolve it.
      v_sv := public._crisis_grow_stats(v_active.definition, v_active.stat_values);
      if v_sv is distinct from v_active.stat_values then
        update public.nation_crises set stat_values = v_sv where id = v_active.id;
      end if;
      v_fired := public._crisis_fire_thresholds(v_active.id, v_active.nation_id, v_active.definition, v_sv, v_active.fired_thresholds);
      if v_fired is distinct from v_active.fired_thresholds then
        update public.nation_crises set fired_thresholds = v_fired where id = v_active.id;
      end if;
      -- Threshold effects may have moved custom stats, the meter, or ended the crisis (an End
      -- Crisis effect) — re-read all three, so the checks below see this tick's threshold changes.
      select stat_values, meter, status into v_sv, v_meter, v_status from public.nation_crises where id = v_active.id;
      if v_status = 'resolved' then   -- an End Crisis threshold effect resolved it this tick
        perform public._crisis_subsided_event(v_active.nation_id, v_active.definition->>'name');
        continue;
      end if;
      -- "Crisis immediately ends if": resolvers checked next, so even a persistent terminal
      -- crisis can subside once the nation (or a custom stat) recovers past an endIf threshold.
      if public._crisis_resolve_met(v_active.nation_id, v_active.definition, v_sv) then
        update public.nation_crises set status = 'resolved' where id = v_active.id;
        perform public._crisis_subsided_event(v_active.nation_id, v_active.definition->>'name');
        continue;
      end if;
      if v_active.stage >= 5 then continue; end if;   -- terminal: inert until Phase 2
      v_def    := v_active.definition;
      v_stage  := v_def->'stages'->(v_active.stage - 1);   -- stages is 0-indexed
      v_growth := coalesce(v_stage->>'growth', '1');
      v_inc    := case when v_growth = 'd3' then floor(random() * 3)::int + 1
                       else coalesce(v_growth::numeric, 1) end;
      v_at     := nullif(v_stage->>'at', '')::numeric;
      update public.nation_crises set meter = meter + v_inc where id = v_active.id;
      if v_at is not null and (v_meter + v_inc) >= v_at then
        if v_active.stage + 1 >= 5 then
          perform public._crisis_reach_terminal(v_active.id, v_active.nation_id, v_def);
        else
          update public.nation_crises set stage = v_active.stage + 1, meter = 0
           where id = v_active.id;   -- meter resets: each stage is a fresh climb
          -- the newly-entered stage's on-activation effects (stages is 0-indexed: new stage = v_active.stage)
          perform public._apply_stage_activate(v_active.id, v_active.nation_id, v_def->'stages'->v_active.stage);
          insert into public.events (nation_id, party_id, kind, body, game_date, tone)
          values (v_active.nation_id, null, 'crisis',
                  'A crisis has escalated: ' || coalesce(v_def->>'name', 'Unnamed Crisis') || ' — '
                  || coalesce(v_def->'stages'->v_active.stage->>'name', 'Stage ' || (v_active.stage + 1)) || '.',
                  public.current_game_date(), 'neg');
        end if;
      end if;
    exception when others then
      raise warning 'tick %: crisis-grow failed for instance % — %', p_tick, v_active.id, sqlerrm;
    end;
  end loop;
end $$;
revoke all on function public._apply_crisis_tick(int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- crisis_act(crisis, action): the head of government manages an active crisis. Only the
-- formateur of the nation's active government may act (same gate as agenda_enact); costs
-- 2 party actions. The action is taken from the crisis's CURRENT stage. A 'law' action
-- applies its lawEffect; a 'minister' action is either 'direct' (apply direct effects) or
-- 'roll' — 1d20 + the head of government's competency (the `stat`) >= `needed` picks the
-- success or failure effects. Effects ride _apply_crisis_effect (one source); escalation is
-- NOT recomputed here — it stays solely in the tick, so a failure that lifts the meter past
-- `at` escalates on the next tick. Events narrate the outcome.
-- ---------------------------------------------------------------------------
drop function if exists public.crisis_act(uuid, int);   -- superseded by the stage-guarded signature
create or replace function public.crisis_act(p_id uuid, p_action int, p_stage int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_nc public.nation_crises%rowtype; v_gov public.governments%rowtype;
  v_def jsonb; v_stage jsonb; v_acts jsonb; v_a jsonb; v_effs jsonb; v_eff jsonb;
  v_type text; v_mech text := ''; v_col text; v_stat int := 0; v_roll int := 0;
  v_needed int := 0; v_total int := 0; v_ok boolean := true; v_body text; v_tone text;
  v_c jsonb; v_res text; v_amt numeric;
begin
  v_p := public._begin_action(0);   -- lock caller's party, require >= 1 action
  if v_p.influence < 2 then raise exception 'Not enough Influence (need 2).'; end if;

  select * into v_nc from public.nation_crises where id = p_id and status = 'active';
  if not found then raise exception 'That crisis is no longer active.'; end if;
  -- Reject a stale click: if the crisis escalated (on a tick) since the page rendered, the
  -- action the player saw belongs to a different stage. Make them refresh, don't misapply.
  if v_nc.stage is distinct from p_stage then
    raise exception 'This crisis has escalated since you opened it — refresh and try again.';
  end if;

  select * into v_gov from public.governments where nation_id = v_nc.nation_id and status = 'active';
  if not found then raise exception 'There is no sitting government to manage this crisis.'; end if;
  if v_gov.formateur_party_id is distinct from v_p.id then
    raise exception 'Only the head of government can manage a national crisis.';
  end if;

  select definition into v_def from public.crises where id = v_nc.crisis_id;
  v_stage := v_def->'stages'->(v_nc.stage - 1);
  v_acts  := v_stage->'actions';
  if v_acts is null or jsonb_typeof(v_acts) <> 'array' or p_action < 0 or p_action >= jsonb_array_length(v_acts) then
    raise exception 'That crisis action is unavailable.';
  end if;
  v_a := v_acts->p_action;
  v_type := v_a->>'type';

  -- On-hand resource cost (e.g. "expend 1 Military"): require the stockpile, then spend it on
  -- attempt — whatever the roll. Gated before any effect lands, so a shortfall blocks the action
  -- cleanly (nothing is applied or deducted). Only minister actions carry a `cost` list.
  for v_c in select value from jsonb_array_elements(coalesce(v_a->'cost', '[]'::jsonb)) loop
    v_res := v_c->>'r'; v_amt := coalesce((v_c->>'n')::numeric, 0);
    if v_amt > 0 and coalesce((select (on_hand->>v_res)::numeric from public.nations where id = v_nc.nation_id), 0) < v_amt then
      raise exception '%', 'Not enough ' || initcap(coalesce(v_res, 'resource')) || ' on hand to take this action (need ' || (v_c->>'n') || ').';
    end if;
  end loop;
  for v_c in select value from jsonb_array_elements(coalesce(v_a->'cost', '[]'::jsonb)) loop
    if coalesce((v_c->>'n')::numeric, 0) > 0 then
      perform public._nation_onhand_add(v_nc.nation_id, v_c->>'r', -(v_c->>'n')::numeric);
    end if;
  end loop;

  if v_type = 'law' then
    v_effs := coalesce(v_a->'lawEffect', '[]'::jsonb);
    v_body := 'The government passed ' || coalesce(nullif(v_a->>'lawName', ''), 'emergency legislation')
              || ' against the ' || coalesce(v_def->>'name', 'crisis') || '.';
    v_tone := 'pos';
  else
    v_mech := coalesce(v_a->>'mech', 'roll');
    if v_mech = 'direct' then
      v_effs := coalesce(v_a->'direct', '[]'::jsonb);
      v_body := coalesce(nullif(v_a->>'eventSuccess', ''),
                  'The government acted on the ' || coalesce(v_def->>'name', 'crisis') || '.');
      v_tone := 'pos';
    else
      -- 1d20 + the head of government's competency named by `stat` (maps to politicians'
      -- cha/acu/gui/res/com — mirrors COMPETENCIES in util.js).
      v_col := case v_a->>'stat' when 'Charisma' then 'cha' when 'Acumen' then 'acu'
                                 when 'Guile' then 'gui' when 'Resolve' then 'res'
                                 when 'Image' then 'com' else 'cha' end;
      execute format('select coalesce(%I, 0) from public.politicians where party_id = $1 and status = ''Party Leader'' order by created_at limit 1', v_col)
        into v_stat using v_gov.formateur_party_id;
      v_stat   := coalesce(v_stat, 0);
      v_roll   := floor(random() * 20)::int + 1;
      v_needed := coalesce((v_a->>'needed')::int, 12);
      v_total  := v_roll + v_stat;
      v_ok     := v_total >= v_needed;
      v_effs   := coalesce(v_a->(case when v_ok then 'success' else 'failure' end), '[]'::jsonb);
      v_body   := coalesce(nullif(v_a->>(case when v_ok then 'eventSuccess' else 'eventFail' end), ''),
                    'The government''s response to the ' || coalesce(v_def->>'name', 'crisis')
                    || (case when v_ok then ' succeeded.' else ' fell short.' end));
      v_tone   := case when v_ok then 'pos' else 'neg' end;
    end if;
  end if;

  for v_eff in select value from jsonb_array_elements(v_effs) loop
    perform public._apply_crisis_effect(p_id, v_nc.nation_id, v_eff);
  end loop;

  update public.parties set influence = influence - 2 where id = v_p.id;
  insert into public.events (nation_id, party_id, kind, body, game_date, tone)
  values (v_nc.nation_id, v_p.id, 'crisis', v_body, public.current_game_date(), v_tone);

  select meter, stage into v_nc.meter, v_nc.stage from public.nation_crises where id = p_id;
  return jsonb_build_object('ok', v_ok, 'type', v_type, 'mech', v_mech,
    'roll', v_roll, 'stat', v_stat, 'total', v_total, 'needed', v_needed,
    'meter', v_nc.meter, 'stage', v_nc.stage, 'body', v_body,
    'actions', v_p.influence - 2);
end $$;
grant execute on function public.crisis_act(uuid, int, int) to authenticated;

-- Admin override: begin a crisis on a chosen nation right now, ignoring its triggers
-- (the Crisis Builder's "Enable crisis" button). (Re)starts it at stage 1, active, and
-- announces it — the normal tick takes over the escalation from there. Admin-only;
-- dormant nations are inert, so they're rejected.
create or replace function public.crisis_force_fire(p_crisis uuid, p_nation text)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text; v_dormant boolean; v_def jsonb; v_id uuid;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select dormant into v_dormant from public.nations where id = p_nation;
  if not found then raise exception 'That nation does not exist.'; end if;
  if v_dormant then raise exception 'That nation is dormant — activate it before starting a crisis there.'; end if;
  select definition into v_def from public.crises where id = p_crisis;
  if not found then raise exception 'That crisis no longer exists.'; end if;
  v_name := v_def->>'name';

  insert into public.nation_crises (nation_id, crisis_id, stage, meter, status, stat_values, fired_thresholds)
       values (p_nation, p_crisis, 1, 0, 'active', public._crisis_seed_stats(v_def), '[]'::jsonb)
  on conflict (nation_id, crisis_id) do update set stage = 1, meter = 0, status = 'active',
       stat_values = public._crisis_seed_stats(v_def), fired_thresholds = '[]'::jsonb
  returning id into v_id;
  perform public._apply_stage_activate(v_id, p_nation, v_def->'stages'->0);   -- stage 1's on-activation effects
  perform public._crisis_emerged_event(p_nation, v_name);
end $$;
grant execute on function public.crisis_force_fire(uuid, text) to authenticated;

notify pgrst, 'reload schema';
