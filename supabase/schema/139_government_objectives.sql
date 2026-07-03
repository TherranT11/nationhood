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

-- Take on an objective (Head of Government, no action cost). Caps at _agenda_cap() active, and the
-- objective must belong to the nation's pool (definition.nation = this nation, or '' = available to
-- all). Starts the countdown from the current tick.
create or replace function public.objective_assign(p_objective uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_gov public.governments%rowtype;
        v_def jsonb; v_onation text; v_tick int; v_ticks int; v_have int;
begin
  v_party := public._lock_party();
  select * into v_gov from public.governments where nation_id = v_party.nation_id and status = 'active';
  if not found then raise exception 'There is no sitting government to set an agenda for.'; end if;
  perform public._require_hog(v_party.nation_id, v_party.id);

  select definition into v_def from public.objectives where id = p_objective;
  if v_def is null then raise exception 'That objective no longer exists.'; end if;
  v_onation := coalesce(v_def->>'nation', '');
  if v_onation <> '' and v_onation <> v_party.nation_id then
    raise exception 'That objective is not available to your nation.'; end if;

  select count(*) into v_have from public.government_objectives where government_id = v_gov.id;
  if v_have >= public._agenda_cap() then
    raise exception 'Your government already holds the maximum of % objectives.', public._agenda_cap(); end if;
  if exists (select 1 from public.government_objectives where government_id = v_gov.id and objective_id = p_objective) then
    raise exception 'That objective is already on your agenda.'; end if;

  select current_tick into v_tick from public.game_state where id;
  v_ticks := greatest(1, coalesce((v_def->>'ticks')::int, 12));
  insert into public.government_objectives (government_id, objective_id, started_tick, deadline_tick)
    values (v_gov.id, p_objective, v_tick, v_tick + v_ticks);

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'government',
            'The government took on the objective “' || coalesce(nullif(v_def->>'name', ''), 'a national objective') || '”.',
            public.current_game_date());
  return jsonb_build_object('held', v_have + 1, 'cap', public._agenda_cap());
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

notify pgrst, 'reload schema';
