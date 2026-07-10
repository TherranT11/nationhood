-- ===========================================================================
-- 167 · Parliamentary reform bills — the ONE path that moves the reform level.
-- Depends on: 10 (nations.economy), 20 (parties.influence), 40 (_begin_action /
-- _lock_party / current_game_date), 81 (proposals + the floor-vote pipeline),
-- 91 (_nation_stat_add), 166 (_regime_type / _regime_reform / _set_regime). Run after 166.
--
-- A party proposes to advance (the next reform) or repeal (the topmost enacted reform).
-- Either creates an ordinary proposal (kind 'reform') that rides the existing legislature:
-- it queues on the agenda or goes straight to the floor, the chamber votes with its seats,
-- and _resolve_proposal (schema/81, extended here) applies it on pass. The reform's Influence
-- cost is charged at PROPOSAL and is NOT refunded if the vote fails — pressing the button
-- before counting votes burns real Influence. Passing sets a digestion lock (one reform per
-- few ticks). Reaching reform 15 in an autocracy/monarchy converts the nation to a full
-- democracy (the Handover / the Abolition).
--
-- Reform level 0–15 lives on economy.regime_reform (schema/166); this file is the only thing
-- that should move it now (the old ad-hoc movers stay for balance until retired). No stat
-- effects are attached to a reform yet — the level itself drives the tier label and the
-- one-party / authoritarian / absolute-monarchy gating, which is the whole mechanic for now.
-- ===========================================================================

-- The name of the n-th reform (1..15) for a regime type — the ONE server source, mirrored
-- client-side by REFORM_NAMES (reforms.js). Null outside 1..15 or for an unset type.
create or replace function public._reform_name(p_type text, p_n int)
returns text language sql immutable as $$
  select case when p_n < 1 or p_n > 15 then null else (
    case p_type
      when 'democracy' then array[
        'End Arbitrary Arrest','Published Legal Code','Independent Courts','Municipal Elections',
        'Legal Opposition','Eased Press Licensing','Right of Assembly','Free Press','Universal Suffrage',
        'Secret Ballot','Civilian Control of the Army','Term Limits','Constitutional Court',
        'Freedom of Information','Parliamentary Sovereignty']
      when 'monarchy' then array[
        'Great Charter','Council of Notables','Right of Petition','Judges Under Law','Consent of Estates',
        'Ministerial Responsibility','The Civil List','The Veto Withers','Constitutional Oath',
        'The Countersignature','The Chamber’s Choice','Prerogatives Enumerated','Estates Nationalized',
        'The Ceremonial Crown','The Abolition']
      when 'autocracy' then array[
        'End of Terror','Rehabilitations','Collective Leadership','Socialist Legality','Factions Legalized',
        'Licensed Press','Choice on the Ballot','Independent Associations','Archives Crack Open',
        'Independents May Stand','Leading Role Repealed','Opposition Legalized','The Tilted Election',
        'Party & State Divorced','The Handover']
    end)[p_n] end;
$$;

-- Advance cost: base 3 Influence, +2 per step (3, 5, 7 … 31 for the 15th). Repeal costs the
-- advance cost of the reform being undone, minus 2 (floored at 1). ONE source, mirrored by
-- reformCost / repealCost (reforms.js).
create or replace function public._reform_cost(p_n int)
returns int language sql immutable as $$ select 3 + 2 * (p_n - 1); $$;
create or replace function public._repeal_cost(p_n int)
returns int language sql immutable as $$ select greatest(1, public._reform_cost(p_n) - 2); $$;

-- The tick before which no new reform may be proposed — the digestion lock (constitutional
-- fatigue) set on each passed reform. Stored on economy.reform_lock_tick; 0 when never set.
create or replace function public._reform_lock_tick(p_economy jsonb)
returns int language sql immutable as $$ select coalesce(public._to_num(p_economy->>'reform_lock_tick'), 0)::int; $$;

-- How many ticks the chamber must digest one constitutional change before the next.
create or replace function public._reform_digestion_ticks()
returns int language sql immutable as $$ select 3; $$;

-- Apply a passed reform bill. Advance moves the reform level +1 (or converts at 15); repeal
-- moves it −1 (the topmost enacted reform), or — for a democracy already at reform 0 — abolishes
-- the republic and backslides to an autocracy (the mirror of the Handover). Either sets the
-- digestion lock and announces the change. Re-validated against the current regime so a stale bill
-- can't apply an illegal move (silently dropped). Only _resolve_proposal calls it (the vote is the gate).
create or replace function public._apply_reform(p_nation text, p_dir text)
returns void language plpgsql security definer set search_path = public as $$
declare v_eco jsonb; v_type text; v_reform int; v_nname text; v_tick int; v_name text;
        v_converted boolean := false; v_backslid boolean := false;
begin
  select economy, name into v_eco, v_nname from public.nations where id = p_nation;
  if not found then return; end if;
  v_type := public._regime_type(v_eco);
  if v_type is null then return; end if;
  v_reform := public._regime_reform(v_eco);
  select current_tick into v_tick from public.game_state where id;

  if p_dir = 'advance' then
    if v_reform >= 15 then return; end if;                    -- track already complete
    v_name := public._reform_name(v_type, v_reform + 1);
    if v_reform + 1 >= 15 and v_type in ('autocracy', 'monarchy') then
      -- The final reform of an autocracy / monarchy is its Handover / Abolition: the old order
      -- gives way to a full democracy. _set_regime is the one type-flip writer.
      perform public._set_regime(p_nation, 'democracy', 9);
      perform public._sync_one_party_state(p_nation);         -- a one-party state becomes multiparty at once
      v_converted := true;
    else
      perform public._nation_stat_add(p_nation, 'economy', 'regime_reform', 1, 0, 15);
    end if;
  else  -- repeal
    if v_reform < 1 then
      -- Backslide: a democracy at the reform floor (Illiberal Democracy) that repeals its last
      -- protections collapses into a Competitive Autocracy (reform 9) — the mirror of the Handover.
      -- Only democracies can backslide; an autocracy/monarchy at reform 0 has nothing to repeal.
      if v_type <> 'democracy' then return; end if;
      perform public._set_regime(p_nation, 'autocracy', 9);
      perform public._sync_one_party_state(p_nation);
      v_backslid := true;
    else
      v_name := public._reform_name(v_type, v_reform);   -- repeal the topmost enacted reform
      perform public._nation_stat_add(p_nation, 'economy', 'regime_reform', -1, 0, 15);
    end if;
  end if;

  -- Digestion lock: the chamber can't take up another reform for a few ticks.
  update public.nations
     set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{reform_lock_tick}',
                             to_jsonb(v_tick + public._reform_digestion_ticks()), true)
   where id = p_nation;

  insert into public.events (nation_id, kind, body, game_date)
    values (p_nation, 'government',
            case when v_converted
                 then v_nname || ' completed its reform track with ' || coalesce(v_name, 'the final reform')
                      || ' — the old order gives way to a full democracy.'
                 when v_backslid
                 then v_nname || ' has abolished the republic — its last democratic protections repealed, the nation collapses into an autocracy.'
                 when p_dir = 'advance'
                 then v_nname || ' enacted a reform: ' || coalesce(v_name, 'a constitutional change') || '.'
                 else v_nname || ' repealed a reform: ' || coalesce(v_name, 'a constitutional change') || '.' end,
            public.current_game_date());
end $$;
revoke all on function public._apply_reform(text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPCs. Both charge the reform's Influence cost at proposal (never refunded on a failed vote)
-- and enforce the one-reform-at-a-time mutex + the digestion lock. Mirror propose_regime_change:
-- queue on the agenda (free of a floor action) or open a floor vote now, proposer auto-votes Aye.
-- ---------------------------------------------------------------------------

-- Shared guard: locks the proposer's party and returns its essentials + regime type, current
-- reform level, and the current tick, with the mutex + digestion-lock checks already applied.
-- Scalar OUT params (not the whole party row — a composite can't sit in a multi-item INTO list).
-- Raises on any block. Dropped first: an OUT-param row type can't be changed by create-or-replace.
drop function if exists public._reform_precheck(boolean);
create or replace function public._reform_precheck(p_to_floor boolean,
  out v_party_id uuid, out v_nation text, out v_influence numeric, out v_pname text,
  out v_type text, out v_reform int, out v_tick int)
language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_eco jsonb; v_lock int;
begin
  select current_tick into v_tick from public.game_state where id;
  if p_to_floor then
    v_p := public._begin_action(0);
    if public._party_seats(v_p.nation_id) = 0 then raise exception 'The assembly is vacant — hold an election before bringing measures to the floor.'; end if;
  else
    v_p := public._lock_party();
  end if;
  v_party_id := v_p.id; v_nation := v_p.nation_id; v_influence := v_p.influence; v_pname := v_p.name;

  select economy into v_eco from public.nations where id = v_nation;
  v_type := public._regime_type(v_eco);
  if v_type is null then raise exception 'This nation''s regime is not set — an admin must set it first.'; end if;
  v_reform := public._regime_reform(v_eco);

  if exists (select 1 from public.proposals
              where nation_id = v_nation and kind = 'reform' and status in ('agenda', 'voting')) then
    raise exception 'A reform bill is already before the chamber — one at a time.';
  end if;
  v_lock := public._reform_lock_tick(v_eco);
  if v_tick < v_lock then
    raise exception 'Constitutional fatigue — the chamber can''t take up another reform yet.';
  end if;
end $$;
revoke all on function public._reform_precheck(boolean) from public, anon, authenticated;

create or replace function public.propose_reform_advance(p_to_floor boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_party_id uuid; v_nation text; v_influence numeric; v_pname text; v_type text; v_reform int; v_tick int;
  v_n int; v_cost int; v_title text; v_pid uuid; v_res text; v_sched int;
begin
  select * into v_party_id, v_nation, v_influence, v_pname, v_type, v_reform, v_tick
    from public._reform_precheck(p_to_floor);
  if v_reform >= 15 then raise exception 'The reform track is complete — there is nothing left to advance.'; end if;

  v_n    := v_reform + 1;
  v_cost := public._reform_cost(v_n);
  if v_influence < v_cost then raise exception 'Not enough Influence (need %).', v_cost; end if;
  v_title := public._reform_name(v_type, v_n) || ' (Reform ' || v_n || ')';

  update public.parties set influence = influence - v_cost where id = v_party_id;   -- charged now, not refunded on a fail
  if not p_to_floor then v_sched := public._next_agenda_slot(v_nation, v_tick); end if;

  insert into public.proposals (nation_id, party_id, kind, title, payload, status, opened_tick, scheduled_tick)
    values (v_nation, v_party_id, 'reform', v_title,
            jsonb_build_object('dir', 'advance', 'n', v_n),
            case when p_to_floor then 'voting' else 'agenda' end,
            case when p_to_floor then v_tick else null end,
            case when p_to_floor then null else v_sched end)
    returning id into v_pid;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_party_id, 'government',
            v_pname || ' proposes a reform: ' || public._reform_name(v_type, v_n) || '.', public.current_game_date());

  if not p_to_floor then
    return jsonb_build_object('id', v_pid, 'status', 'agenda', 'scheduled_tick', v_sched, 'actions', v_influence - v_cost, 'cost', v_cost);
  end if;
  insert into public.proposal_votes (proposal_id, party_id, aye) values (v_pid, v_party_id, true);
  v_res := public._resolve_proposal(v_pid);
  return jsonb_build_object('id', v_pid, 'status', v_res, 'actions', v_influence - v_cost, 'cost', v_cost);
end $$;
grant execute on function public.propose_reform_advance(boolean) to authenticated;

create or replace function public.propose_reform_repeal(p_to_floor boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_party_id uuid; v_nation text; v_influence numeric; v_pname text; v_type text; v_reform int; v_tick int;
  v_cost int; v_title text; v_pid uuid; v_res text; v_sched int;
begin
  select * into v_party_id, v_nation, v_influence, v_pname, v_type, v_reform, v_tick
    from public._reform_precheck(p_to_floor);
  -- A democracy at reform 0 can still "repeal" — that's the backslide (abolish the republic →
  -- autocracy, applied in _apply_reform). Any other type at reform 0 has nothing to repeal.
  if v_reform < 1 and v_type <> 'democracy' then raise exception 'There is no reform to repeal.'; end if;

  v_cost := public._repeal_cost(greatest(1, v_reform));   -- reform 0 backslide costs the cheapest repeal
  if v_influence < v_cost then raise exception 'Not enough Influence (need %).', v_cost; end if;
  v_title := case when v_reform < 1 then 'Abolish the Republic'
                  else 'Repeal: ' || public._reform_name(v_type, v_reform) end;

  update public.parties set influence = influence - v_cost where id = v_party_id;   -- charged now, not refunded on a fail
  if not p_to_floor then v_sched := public._next_agenda_slot(v_nation, v_tick); end if;

  insert into public.proposals (nation_id, party_id, kind, title, payload, status, opened_tick, scheduled_tick)
    values (v_nation, v_party_id, 'reform', v_title,
            jsonb_build_object('dir', 'repeal', 'n', v_reform),
            case when p_to_floor then 'voting' else 'agenda' end,
            case when p_to_floor then v_tick else null end,
            case when p_to_floor then null else v_sched end)
    returning id into v_pid;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_party_id, 'government',
            v_pname || case when v_reform < 1 then ' moves to abolish the republic and impose an autocracy.'
                            else ' moves to repeal ' || public._reform_name(v_type, v_reform) || '.' end,
            public.current_game_date());

  if not p_to_floor then
    return jsonb_build_object('id', v_pid, 'status', 'agenda', 'scheduled_tick', v_sched, 'actions', v_influence - v_cost, 'cost', v_cost);
  end if;
  insert into public.proposal_votes (proposal_id, party_id, aye) values (v_pid, v_party_id, true);
  v_res := public._resolve_proposal(v_pid);
  return jsonb_build_object('id', v_pid, 'status', v_res, 'actions', v_influence - v_cost, 'cost', v_cost);
end $$;
grant execute on function public.propose_reform_repeal(boolean) to authenticated;

notify pgrst, 'reload schema';
