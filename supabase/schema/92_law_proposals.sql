-- ===========================================================================
-- 92 · Law proposals (policy changes via the floor).
-- Depends on: 81 (proposals + _resolve_proposal dispatch + _begin_action/
-- _lock_party/_party_seats), 90 (policies + nations.policies). Run after 90.
--
-- A party proposes changing one of the nation's policies to a different option.
-- It rides the EXISTING proposal/vote machinery (schema/81): queued on the agenda
-- (free) or sent straight to the floor (1 action), every party votes with its
-- seats, and it passes the instant Aye-seats reach a chamber majority — the one
-- pass authority, _resolve_proposal, which dispatches kind='law' to _apply_law.
-- advance_tick (schema/60) already promotes/expires proposals kind-agnostically.
--
-- NOTE: passing a law FLIPS the nation's option for the policy. The option's
-- mechanical once-effects (stat/budget changes) are applied by the effects engine
-- in a later migration; this file is only the per-nation option flip + the RPC.
-- ===========================================================================

-- A passed law sets the nation's chosen option for the policy. ONE place the
-- per-nation option flip lives (called from _resolve_proposal on pass).
create or replace function public._apply_law(p_nation text, p_policy uuid, p_option int)
returns void language sql security definer set search_path = public as $$
  update public.nations
     set policies = jsonb_set(coalesce(policies, '{}'::jsonb), array[p_policy::text], to_jsonb(p_option), true)
   where id = p_nation;
$$;

-- Validate a policy + option index against the stored definition; return the
-- policy's and option's display names (for the proposal title/payload).
create or replace function public._check_law(p_policy uuid, p_option int,
  out policy_name text, out option_name text)
language plpgsql security definer set search_path = public as $$
declare v_def jsonb; v_opts jsonb;
begin
  select definition into v_def from public.policies where id = p_policy;
  if v_def is null then raise exception 'No such policy.'; end if;
  policy_name := coalesce(v_def->>'name', 'Policy');
  v_opts := v_def->(coalesce(v_def->>'type', 'spectrum'));   -- the 'spectrum' or 'binary' option array
  if v_opts is null or jsonb_typeof(v_opts) <> 'array'
     or p_option < 0 or p_option >= jsonb_array_length(v_opts) then
    raise exception 'Invalid policy option.';
  end if;
  option_name := coalesce(v_opts->p_option->>'name', 'Option ' || (p_option + 1));
end $$;

-- The nation's option currently in force for a policy: the stored override, else
-- the policy's own default. ONE source for "what option is this nation on".
create or replace function public._nation_policy_option(p_nation text, p_policy uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(
    (n.policies->>p_policy::text)::int,
    case when (pol.definition->>'type') = 'binary'
         then coalesce((pol.definition->>'binDefault')::int, 0)
         else coalesce((pol.definition->>'defaultIdx')::int, 0) end)
  from public.nations n cross join public.policies pol
  where n.id = p_nation and pol.id = p_policy;
$$;

-- Propose a policy change. p_to_floor=false → queue on the agenda (free); true →
-- open a floor vote now (1 action), proposer auto-votes Aye, then tally. Mirrors
-- propose_declaration so the action cost + vote rules stay server-authoritative.
create or replace function public.propose_law(p_policy uuid, p_option int, p_to_floor boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_party public.parties%rowtype; v_name text; v_opt text;
  v_cur int; v_sched int; v_pid uuid; v_res text;
begin
  select policy_name, option_name into v_name, v_opt from public._check_law(p_policy, p_option);
  select current_tick into v_cur from public.game_state where id;

  if p_to_floor then
    v_party := public._begin_action(0);          -- requires >= 1 action
    if public._party_seats(v_party.nation_id) = 0 then raise exception 'The assembly is vacant — hold an election before bringing measures to the floor.'; end if;
  else
    v_party := public._lock_party();
    select greatest(v_cur + 1, coalesce(max(scheduled_tick), v_cur) + 1)
      into v_sched
      from public.proposals where nation_id = v_party.nation_id and status = 'agenda';
  end if;

  -- No-op guard: don't let a party spend an action to propose the option already in force.
  if public._nation_policy_option(v_party.nation_id, p_policy) = p_option then
    raise exception 'That policy is already set to that option.';
  end if;

  insert into public.proposals (nation_id, party_id, kind, title, payload, status, opened_tick, scheduled_tick)
    values (v_party.nation_id, v_party.id, 'law',
            v_name || ' → ' || v_opt,
            jsonb_build_object('policy_id', p_policy, 'option_idx', p_option, 'policy_name', v_name, 'option_name', v_opt),
            case when p_to_floor then 'voting' else 'agenda' end,
            case when p_to_floor then v_cur else null end,
            case when p_to_floor then null else v_sched end)
    returning id into v_pid;

  if not p_to_floor then
    return jsonb_build_object('id', v_pid, 'status', 'agenda', 'scheduled_tick', v_sched, 'actions', v_party.actions_remaining);
  end if;

  update public.parties set actions_remaining = actions_remaining - 1 where id = v_party.id;
  insert into public.proposal_votes (proposal_id, party_id, aye) values (v_pid, v_party.id, true);
  v_res := public._resolve_proposal(v_pid);
  return jsonb_build_object('id', v_pid, 'status', v_res, 'actions', v_party.actions_remaining - 1);
end $$;
grant execute on function public.propose_law(uuid, int, boolean) to authenticated;

notify pgrst, 'reload schema';
