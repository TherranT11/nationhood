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
    when 'Regime'         then select economy->>'regime'        into v_raw from public.nations where id = p_nation;
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

-- True when ALL of a crisis definition's triggers hold for the nation. A trigger is
-- {target, op, value}; an unreadable target (null) fails the whole test. A crisis with
-- no triggers never auto-fires (admin/manual seeding only).
create or replace function public._crisis_triggers_met(p_nation text, p_def jsonb)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_trigs jsonb := p_def->'triggers'; v_t jsonb; v_cur numeric;
begin
  if v_trigs is null or jsonb_typeof(v_trigs) <> 'array' or jsonb_array_length(v_trigs) = 0 then
    return false;
  end if;
  for v_t in select value from jsonb_array_elements(v_trigs) loop
    v_cur := public._nation_stat_get(p_nation, v_t->>'target');
    if v_cur is null then return false; end if;
    if not public._crisis_cmp(v_cur, coalesce(v_t->>'op', '>='), coalesce((v_t->>'value')::numeric, 0)) then
      return false;
    end if;
  end loop;
  return true;
end $$;
revoke all on function public._crisis_triggers_met(text, jsonb) from public, anon, authenticated;

-- True when ANY of a crisis definition's `endIf` resolvers holds — the "Crisis immediately
-- ends if" conditions. Same {target, op, value} shape as triggers; an unreadable target is
-- skipped (doesn't resolve, doesn't block). No endIf → never auto-resolves.
create or replace function public._crisis_resolve_met(p_nation text, p_def jsonb)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_ends jsonb := p_def->'endIf'; v_t jsonb; v_cur numeric;
begin
  if v_ends is null or jsonb_typeof(v_ends) <> 'array' or jsonb_array_length(v_ends) = 0 then
    return false;
  end if;
  for v_t in select value from jsonb_array_elements(v_ends) loop
    v_cur := public._nation_stat_get(p_nation, v_t->>'target');
    if v_cur is not null
       and public._crisis_cmp(v_cur, coalesce(v_t->>'op', '>='), coalesce((v_t->>'value')::numeric, 0)) then
      return true;
    end if;
  end loop;
  return false;
end $$;
revoke all on function public._crisis_resolve_met(text, jsonb) from public, anon, authenticated;

-- Apply ONE crisis effect {t,v}. 'Crisis Meter' adjusts THIS instance's meter (floored at
-- 0); every other target rides _apply_policy_effect (schema/91) — the single source for
-- stat mapping, clamping, money scaling, the confidence-collapse hook, popularity floors.
create or replace function public._apply_crisis_effect(p_id uuid, p_nation text, p_eff jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if (p_eff->>'t') = 'Crisis Meter' then
    update public.nation_crises set meter = greatest(0, meter + coalesce((p_eff->>'v')::numeric, 0)) where id = p_id;
  else
    perform public._apply_policy_effect(p_nation, p_eff);
  end if;
end $$;
revoke all on function public._apply_crisis_effect(uuid, text, jsonb) from public, anon, authenticated;

-- Activate the dormant breakaway nation a 'new_nation' resolution points at: a real,
-- still-dormant nation (authored in the Nations tab, linked by id) is un-dormanted and
-- given a first-election schedule, then announced. Idempotent — a re-run finds it already
-- live and does nothing, so a nation can't be spawned twice.
create or replace function public._crisis_spawn_nation(p_origin text, p_new_nation text)
returns void language plpgsql security definer set search_path = public as $$
declare v_tick int; v_name text; v_oname text;
begin
  if nullif(p_new_nation, '') is null then return; end if;
  select name into v_name from public.nations where id = p_new_nation and dormant;
  if not found then return; end if;   -- not a dormant nation (gone, or already activated)
  select current_tick into v_tick from public.game_state where id;
  update public.nations
     set dormant = false,
         next_election_tick = coalesce(v_tick, 1) + 1 + floor(random() * 6)::int
   where id = p_new_nation;
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

-- The per-tick crisis pass (called by advance_tick, schema/60). FIRE: start any crisis
-- whose triggers are now met on a nation not already running it (fire-once in Phase 1).
-- GROW: climb each active crisis's meter by its stage growth (1 | 2 | 1d3); crossing the
-- stage's `at` escalates one stage (meter resets); reaching stage 5 goes terminal. Each
-- nation/crisis step is isolated so one bad row can't abort the rest; events narrate it.
create or replace function public._apply_crisis_tick(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_n text; v_c record; v_active record;
  v_def jsonb; v_stage jsonb; v_growth text; v_inc numeric; v_at numeric;
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
          insert into public.nation_crises (nation_id, crisis_id) values (v_n, v_c.id);   -- stage 1, meter 0 by default
          perform public._crisis_emerged_event(v_n, v_c.definition->>'name');
        end if;
      exception when others then
        raise warning 'tick %: crisis-fire failed for nation % crisis % — %', p_tick, v_n, v_c.id, sqlerrm;
      end;
    end loop;
  end loop;

  -- GROW + ESCALATE
  for v_active in
    select nc.id, nc.nation_id, nc.stage, nc.meter, c.definition
      from public.nation_crises nc join public.crises c on c.id = nc.crisis_id
     where nc.status = 'active'
  loop
    begin
      -- "Crisis immediately ends if": resolvers checked first, so even a persistent
      -- terminal crisis can subside once the nation recovers past an endIf threshold.
      if public._crisis_resolve_met(v_active.nation_id, v_active.definition) then
        update public.nation_crises set status = 'resolved' where id = v_active.id;
        insert into public.events (nation_id, party_id, kind, body, game_date, tone)
        values (v_active.nation_id, null, 'crisis',
                'The crisis has subsided: ' || coalesce(v_active.definition->>'name', 'Unnamed Crisis') || '.',
                public.current_game_date(), 'pos');
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
      if v_at is not null and (v_active.meter + v_inc) >= v_at then
        if v_active.stage + 1 >= 5 then
          perform public._crisis_reach_terminal(v_active.id, v_active.nation_id, v_def);
        else
          update public.nation_crises set stage = v_active.stage + 1, meter = 0
           where id = v_active.id;   -- meter resets: each stage is a fresh climb
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
-- 1 party action. The action is taken from the crisis's CURRENT stage. A 'law' action
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
begin
  v_p := public._begin_action(0);   -- lock caller's party, require >= 1 action

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

  update public.parties set actions_remaining = actions_remaining - 1 where id = v_p.id;
  insert into public.events (nation_id, party_id, kind, body, game_date, tone)
  values (v_nc.nation_id, v_p.id, 'crisis', v_body, public.current_game_date(), v_tone);

  select meter, stage into v_nc.meter, v_nc.stage from public.nation_crises where id = p_id;
  return jsonb_build_object('ok', v_ok, 'type', v_type, 'mech', v_mech,
    'roll', v_roll, 'stat', v_stat, 'total', v_total, 'needed', v_needed,
    'meter', v_nc.meter, 'stage', v_nc.stage, 'body', v_body,
    'actions', v_p.actions_remaining - 1);
end $$;
grant execute on function public.crisis_act(uuid, int, int) to authenticated;

-- Admin override: begin a crisis on a chosen nation right now, ignoring its triggers
-- (the Crisis Builder's "Enable crisis" button). (Re)starts it at stage 1, active, and
-- announces it — the normal tick takes over the escalation from there. Admin-only;
-- dormant nations are inert, so they're rejected.
create or replace function public.crisis_force_fire(p_crisis uuid, p_nation text)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text; v_dormant boolean;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select dormant into v_dormant from public.nations where id = p_nation;
  if not found then raise exception 'That nation does not exist.'; end if;
  if v_dormant then raise exception 'That nation is dormant — activate it before starting a crisis there.'; end if;
  select definition->>'name' into v_name from public.crises where id = p_crisis;
  if not found then raise exception 'That crisis no longer exists.'; end if;

  insert into public.nation_crises (nation_id, crisis_id, stage, meter, status)
       values (p_nation, p_crisis, 1, 0, 'active')
  on conflict (nation_id, crisis_id) do update set stage = 1, meter = 0, status = 'active';
  perform public._crisis_emerged_event(p_nation, v_name);
end $$;
grant execute on function public.crisis_force_fire(uuid, text) to authenticated;

notify pgrst, 'reload schema';
