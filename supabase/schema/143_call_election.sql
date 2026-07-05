-- ===========================================================================
-- 143 · Call Election — the head of government dissolves the legislature early.
-- Depends on: 60 (resolve_election, next_election_tick, governments, _advance_tick
-- resolver loop), 40 (_begin_action), 10 (nations). Run after 60.
--
-- A PM-only action (1 action, 12-tick cooldown). It schedules a snap election by
-- pulling the nation's next_election_tick forward to now; the clock resolves it on
-- the next tick through resolve_election — the sole seat-allocation source. In a
-- one-party state that resolver runs a Party Congress (factions of the ruling party
-- vie for standing); in a multiparty nation it runs a general election. Nothing here
-- re-implements seat maths, so both regimes stay in lockstep with scheduled elections.
-- ===========================================================================

alter table public.nations add column if not exists call_election_until_tick int;   -- 12-tick cooldown; null = ready

create or replace function public.call_election()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_party  public.parties%rowtype;
  v_gov    public.governments%rowtype;
  v_nation public.nations%rowtype;
  v_tick   int;
  v_cooldown constant int := 12;
begin
  v_party := public._begin_action(0);   -- locks the caller's party; requires >= 1 action

  select * into v_gov from public.governments
   where nation_id = v_party.nation_id and status = 'active' for update;
  if not found then raise exception 'There is no sitting government to dissolve.'; end if;
  if v_gov.formateur_party_id is distinct from v_party.id then
    raise exception 'Only the head of government can call an election.'; end if;

  select * into v_nation from public.nations where id = v_party.nation_id for update;
  select current_tick into v_tick from public.game_state where id;

  if v_nation.call_election_until_tick is not null and v_tick < v_nation.call_election_until_tick then
    raise exception 'An election was called recently — available again in % tick(s).',
      v_nation.call_election_until_tick - v_tick;
  end if;

  -- Pull the scheduled election forward: the tick resolver picks up any nation whose
  -- next_election_tick <= current_tick and runs resolve_election (which reschedules the
  -- following one). Same path a due election takes — one source, one seat allocator.
  update public.nations
     set next_election_tick = v_tick,
         call_election_until_tick = v_tick + v_cooldown
   where id = v_party.nation_id;

  update public.parties set actions_remaining = actions_remaining - 1 where id = v_party.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'election',
            v_party.name || ' called '
            || (case when v_nation.ruling_party is not null then 'a Party Congress' else 'a general election' end)
            || '. The nation goes to the polls next tick.',
            public.current_game_date());

  return jsonb_build_object('actions', v_party.actions_remaining - 1, 'until', v_tick + v_cooldown);
end $$;
grant execute on function public.call_election() to authenticated;

notify pgrst, 'reload schema';
