-- ===========================================================================
-- 139 · Government Agenda — the objectives a sitting government has taken on.
-- Slice 1 (assignment): a government holds up to THREE active national objectives, each drawn
-- from the authored pool (schema/134) for its nation. Assigning starts the "complete within N
-- ticks" countdown (deadline_tick = started_tick + the objective's ticks). Scoring the conditions
-- and paying out rewards is a later slice — this stores the assignment only.
--
-- Rows here are the ACTIVE agenda; dropping an objective deletes its row (a government may re-take
-- it later). World-readable (a nation's agenda is public); writes go through the HoG-gated RPCs
-- below, never the client directly.
-- Depends on: 60 (governments), 134 (objectives), 40 (_lock_party), 100 (_require_hog),
--   game_state (current_tick). Run after 134.
-- ===========================================================================

create table if not exists public.government_objectives (
  id            uuid primary key default gen_random_uuid(),
  government_id uuid not null references public.governments (id) on delete cascade,
  objective_id  uuid not null references public.objectives (id)  on delete cascade,
  started_tick  int  not null,
  deadline_tick int  not null,
  created_at    timestamptz not null default now(),
  unique (government_id, objective_id)              -- a government can't hold the same objective twice
);

alter table public.government_objectives enable row level security;
drop policy if exists "government_objectives_select_all" on public.government_objectives;
create policy "government_objectives_select_all" on public.government_objectives for select using (true);
-- Writes are RPC-only (objective_assign / objective_drop below are HoG-gated). No client policy.

-- The cap on how many objectives one government may hold at once. ONE source for the "up to three"
-- rule, read by the assign RPC (and the player agenda's "n of 3" via a mirror).
create or replace function public._agenda_cap()
returns int language sql immutable as $$ select 3 $$;

-- Put an objective on a government's agenda — the ONE source for "add an objective to a
-- government", used by the player RPC below AND the coalition auto-add on formation (schema/60).
-- Best-effort + idempotent: returns false (no error) when the objective is gone, not in the
-- government's nation pool (definition.nation = its nation or '' = all), the cap is reached, or it
-- is already held. On success it starts the countdown and drops a feed line. INTERNAL.
create or replace function public._agenda_add(p_gov uuid, p_objective uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_nation text; v_def jsonb; v_onation text; v_tick int; v_ticks int;
begin
  if p_gov is null or p_objective is null then return false; end if;
  select nation_id into v_nation from public.governments where id = p_gov and status = 'active';
  if v_nation is null then return false; end if;
  select definition into v_def from public.objectives where id = p_objective;
  if v_def is null then return false; end if;
  v_onation := coalesce(v_def->>'nation', '');
  if v_onation <> '' and v_onation <> v_nation then return false; end if;
  -- Crisis gate: an objective marked "only available if a crisis is active" can only be taken while
  -- that crisis is live on the nation (a nation_crises row, status 'active').
  if coalesce(v_def->>'requires_crisis', '') <> '' then
    if not exists (select 1 from public.nation_crises
                    where nation_id = v_nation and crisis_id = (v_def->>'requires_crisis')::uuid and status = 'active') then
      return false;
    end if;
  end if;
  if (select count(*) from public.government_objectives where government_id = p_gov) >= public._agenda_cap() then return false; end if;
  if exists (select 1 from public.government_objectives where government_id = p_gov and objective_id = p_objective) then return false; end if;

  select current_tick into v_tick from public.game_state where id;
  v_ticks := greatest(1, coalesce((v_def->>'ticks')::int, 12));
  insert into public.government_objectives (government_id, objective_id, started_tick, deadline_tick)
    values (p_gov, p_objective, v_tick, v_tick + v_ticks);
  insert into public.events (nation_id, kind, body, game_date)
    values (v_nation, 'government',
            'The government took on the objective “' || coalesce(nullif(v_def->>'name', ''), 'a national objective') || '”.',
            public.current_game_date());
  return true;
end $$;
revoke all on function public._agenda_add(uuid, uuid) from public, anon, authenticated;

-- Take on an objective (Head of Government, no action cost) via the one _agenda_add source.
create or replace function public.objective_assign(p_objective uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_gov public.governments%rowtype;
begin
  v_party := public._lock_party();
  select * into v_gov from public.governments where nation_id = v_party.nation_id and status = 'active';
  if not found then raise exception 'There is no sitting government to set an agenda for.'; end if;
  perform public._require_hog(v_party.nation_id, v_party.id);
  if not public._agenda_add(v_gov.id, p_objective) then
    raise exception 'Could not add that objective — it may already be on your agenda, the agenda may be full (%), or it is not available to your nation.', public._agenda_cap();
  end if;
  return jsonb_build_object('held', (select count(*) from public.government_objectives where government_id = v_gov.id), 'cap', public._agenda_cap());
end $$;
grant execute on function public.objective_assign(uuid) to authenticated;

-- Drop an objective from the agenda (Head of Government, no action cost). Deletes the row so it can
-- be re-taken later.
create or replace function public.objective_drop(p_objective uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_gov public.governments%rowtype; v_def jsonb; v_gone boolean;
begin
  v_party := public._lock_party();
  select * into v_gov from public.governments where nation_id = v_party.nation_id and status = 'active';
  if not found then raise exception 'There is no sitting government.'; end if;
  perform public._require_hog(v_party.nation_id, v_party.id);

  delete from public.government_objectives where government_id = v_gov.id and objective_id = p_objective;
  v_gone := found;
  if v_gone then
    select definition into v_def from public.objectives where id = p_objective;
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_party.nation_id, v_party.id, 'government',
              'The government dropped the objective “' || coalesce(nullif(v_def->>'name', ''), 'a national objective') || '”.',
              public.current_game_date());
  end if;
  return jsonb_build_object('dropped', v_gone);
end $$;
grant execute on function public.objective_drop(uuid) to authenticated;

-- Coalition auto-add: a negotiation may queue ONE national objective that the new government takes
-- on the moment it forms (_seat_government, schema/60, calls _agenda_add with this). Plain uuid (no
-- FK) so this file needn't be ordered after objectives; _agenda_add validates the objective exists.
alter table public.negotiations add column if not exists objective_id uuid;

-- The host sets (or clears, with null) the objective their coalition will take on if it forms.
-- Host-only, no action cost; the objective must belong to the negotiation's nation pool.
create or replace function public.coalition_set_objective(p_neg uuid, p_objective uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_n public.negotiations%rowtype; v_host public.parties%rowtype; v_onation text;
begin
  if auth.uid() is null then raise exception 'Not signed in.'; end if;
  select * into v_n from public.negotiations where id = p_neg;
  if not found then raise exception 'That negotiation is gone.'; end if;
  if v_n.status <> 'active' then raise exception 'This agreement is already locked.'; end if;
  select * into v_host from public.parties where id = v_n.host_party_id;
  if v_host.user_id is distinct from auth.uid() then raise exception 'Only the host can set the objective.'; end if;
  if p_objective is not null then
    select coalesce(definition->>'nation', '') into v_onation from public.objectives where id = p_objective;
    if not found then raise exception 'That objective no longer exists.'; end if;
    if v_onation <> '' and v_onation <> v_n.nation_id then raise exception 'That objective is not available to your nation.'; end if;
  end if;
  update public.negotiations set objective_id = p_objective where id = p_neg;
end $$;
grant execute on function public.coalition_set_objective(uuid, uuid) to authenticated;

-- The yearly cost of an empty agenda: each January, a sitting government holding NO objectives
-- loses −3% Government Confidence and −2% Party Popularity, through the single _apply_policy_effect
-- clamp (schema/91; confidence 0–100 with the collapse hook, popularity on the in-government
-- parties). Called from _advance_tick (schema/60); self-filters to January, a no-op otherwise.
-- (Note: an objective past its deadline still counts as held — expiry/scoring is a later slice.)
create or replace function public._resolve_agenda_neglect(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare n record; v_held int;
begin
  if (p_tick - 1) % 12 <> 0 then return; end if;   -- January only (tick 1, 13, 25, …)
  for n in
    select g.id as gov_id, g.nation_id
      from public.governments g
      join public.nations nat on nat.id = g.nation_id
     where g.status = 'active' and not coalesce(nat.dormant, false)
  loop
    select count(*) into v_held from public.government_objectives where government_id = n.gov_id;
    if v_held = 0 then
      perform public._apply_policy_effect(n.nation_id, jsonb_build_object('t', 'Government Confidence', 'v', -3));
      perform public._apply_policy_effect(n.nation_id, jsonb_build_object('t', 'Party Popularity', 'v', -2));
      insert into public.events (nation_id, kind, body, game_date)
        values (n.nation_id, 'government',
                'The government set no national objectives this year — confidence fell (−3%) and party popularity slipped (−2%).',
                public.current_game_date());
    end if;
  end loop;
end $$;
revoke all on function public._resolve_agenda_neglect(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
