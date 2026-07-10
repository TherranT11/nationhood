-- ===========================================================================
-- 106 · Electoral Threshold as a floor bill.
-- Depends on: 10 (nations.electoral_threshold), 60 (resolve_election already
-- enforces the threshold — it allocates seats only to parties at/above it), 81
-- (proposals + the floor-vote pipeline), 91 (_nation_stat_add). Run after 105.
--
-- The threshold is the minimum vote share a party must clear to take any seats;
-- parties below it are shut out and their seats fall to those who cleared it.
-- Until now it was admin-set only (nations.electoral_threshold, default 0). This
-- adds the ONE gameplay path that changes it: a floor bill (proposal kind
-- 'threshold') the chamber votes on like any other measure.
--
-- Enforcement stays where it already lives — resolve_election (schema/60) is the
-- only reader. This file only adds the WRITER (a passed bill). Nothing here duplicates
-- the seat-allocation rule, and the bar no longer moves the regime.
-- ===========================================================================

-- Apply a passed threshold bill: set nations.electoral_threshold. The bar's effect is the seat
-- allocation itself (resolve_election, schema/60, shuts out parties below it) — it no longer
-- moves the regime. Reform level is owned solely by the reform bills (schema/167); the old
-- "raising the bar costs a rank of regime" coupling was retired with them. Only _resolve_proposal
-- calls this (the floor vote is the gate).
create or replace function public._apply_threshold(p_nation text, p_pct int)
returns void language plpgsql security definer set search_path = public as $$
declare v_nname text;
begin
  select name into v_nname from public.nations where id = p_nation;
  if not found then return; end if;

  update public.nations set electoral_threshold = p_pct where id = p_nation;
  insert into public.events (nation_id, kind, body, game_date)
    values (p_nation, 'government',
            v_nname || ' set the electoral threshold to ' || p_pct || '% — parties below it win no seats.',
            public.current_game_date());
end $$;
revoke all on function public._apply_threshold(text, int) from public, anon, authenticated;

-- Propose a change to the electoral threshold. Mirrors propose_regime_change: queue on the
-- agenda (free) or open a floor vote now (1 action), proposer auto-votes Aye, then tally.
-- The bill carries on a simple majority like any measure; _apply_threshold runs on pass.
create or replace function public.propose_threshold(p_pct int, p_to_floor boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party public.parties%rowtype; v_cur int; v_curtick int; v_pid uuid; v_res text; v_sched int;
begin
  if p_pct not in (0, 3, 5, 8, 10, 15) then raise exception 'That is not a valid electoral threshold.'; end if;
  select current_tick into v_curtick from public.game_state where id;

  if p_to_floor then
    v_party := public._begin_action(0);          -- requires >= 1 action
    if public._party_seats(v_party.nation_id) = 0 then raise exception 'The assembly is vacant — hold an election before bringing measures to the floor.'; end if;
  else
    v_party := public._lock_party();
  end if;

  select coalesce(electoral_threshold, 0)::int into v_cur from public.nations where id = v_party.nation_id;
  if v_cur = p_pct then raise exception '%', 'The electoral threshold is already ' || p_pct || '%.'; end if;

  if not p_to_floor then
    v_sched := public._next_agenda_slot(v_party.nation_id, v_curtick);
  end if;

  insert into public.proposals (nation_id, party_id, kind, title, payload, status, opened_tick, scheduled_tick)
    values (v_party.nation_id, v_party.id, 'threshold',
            'Electoral Threshold → ' || p_pct || '%',
            jsonb_build_object('pct', p_pct),
            case when p_to_floor then 'voting' else 'agenda' end,
            case when p_to_floor then v_curtick else null end,
            case when p_to_floor then null else v_sched end)
    returning id into v_pid;

  if not p_to_floor then
    return jsonb_build_object('id', v_pid, 'status', 'agenda', 'scheduled_tick', v_sched, 'actions', v_party.influence);
  end if;

  insert into public.proposal_votes (proposal_id, party_id, aye) values (v_pid, v_party.id, true);
  v_res := public._resolve_proposal(v_pid);
  return jsonb_build_object('id', v_pid, 'status', v_res, 'actions', v_party.influence);
end $$;
grant execute on function public.propose_threshold(int, boolean) to authenticated;

notify pgrst, 'reload schema';
