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
-- NOTE: passing a law FLIPS the nation's option for the policy and applies that
-- option's once-effects (schema/91). Per-tick effects are applied each month by a
-- later per-tick pass.
-- ===========================================================================

-- A passed law sets the nation's chosen option for the policy AND applies that
-- option's one-time (cadence='once') effects — the "costs money from the treasury"
-- moment. Per-tick effects are applied each month by the per-tick pass (later).
-- ONE place the per-nation option flip lives (called from _resolve_proposal on pass).
create or replace function public._apply_law(p_nation text, p_policy uuid, p_option int)
returns void language plpgsql security definer set search_path = public as $$
declare v_tick int; v_had_override boolean; v_old int; v_tags jsonb; v_old_tags jsonb; r record;
begin
  select current_tick into v_tick from public.game_state where id;
  -- The option in force BEFORE this law, and whether it was an actual prior enactment
  -- (a stored override) rather than the untouched default — only a law that was passed
  -- can later be "repealed". Read both before the flip.
  select (policies ? (p_policy::text)) into v_had_override from public.nations where id = p_nation;
  v_old := public._nation_policy_option(p_nation, p_policy);
  -- Flip the option AND stamp the enactment tick (policy_since) so finite-duration
  -- tick effects can age from here; an active enactment starts/resets that clock.
  update public.nations
     set policies     = jsonb_set(coalesce(policies, '{}'::jsonb),     array[p_policy::text], to_jsonb(p_option), true),
         policy_since = jsonb_set(coalesce(policy_since, '{}'::jsonb), array[p_policy::text], to_jsonb(v_tick),   true)
   where id = p_nation;
  perform public._apply_policy_option_effects(p_nation, p_policy, p_option, 'once');

  -- Identity-tagged law (gain): fire every adopted conviction's onLaw effect whose tag
  -- matches a tag on the enacted option, for each party in the nation that holds it.
  -- Reactive to a passed law (like onAdopt). _apply_conviction_effect lives in schema/94
  -- (loaded after this file) — plpgsql resolves it at runtime, so the forward ref is fine.
  select public._policy_options(definition) -> p_option -> 'tags' into v_tags
    from public.policies where id = p_policy;
  if jsonb_typeof(v_tags) = 'array' and jsonb_array_length(v_tags) > 0 then
    for r in
      select pc.party_id, e.value as eff
      from public.party_convictions pc
      join public.parties p2     on p2.id = pc.party_id and p2.nation_id = p_nation
      join public.convictions c  on c.id = pc.conviction_id
      cross join lateral jsonb_array_elements(coalesce(c.definition -> 'onLaw', '[]'::jsonb)) e
      where (e.value ->> 'tag') in (select t from jsonb_array_elements_text(v_tags) t)
    loop
      perform public._apply_conviction_effect(r.party_id, p_nation, r.eff);
    end loop;
  end if;

  -- Reverse (mirror): the previously-passed option is now repealed. Fire the INVERSE of
  -- any onLaw effect flagged 'sym' whose tag was on that old option, so a party gives
  -- back the standing it gained while that law was in force. Skips the never-enacted
  -- default (it was never passed, so it can't be repealed).
  if v_had_override and v_old is not null and v_old <> p_option then
    select public._policy_options(definition) -> v_old -> 'tags' into v_old_tags
      from public.policies where id = p_policy;
    if jsonb_typeof(v_old_tags) = 'array' and jsonb_array_length(v_old_tags) > 0 then
      for r in
        select pc.party_id, e.value as eff
        from public.party_convictions pc
        join public.parties p2     on p2.id = pc.party_id and p2.nation_id = p_nation
        join public.convictions c  on c.id = pc.conviction_id
        cross join lateral jsonb_array_elements(coalesce(c.definition -> 'onLaw', '[]'::jsonb)) e
        where coalesce((e.value ->> 'sym')::boolean, false)
          and (e.value ->> 'tag') in (select t from jsonb_array_elements_text(v_old_tags) t)
      loop
        perform public._apply_conviction_effect(r.party_id, p_nation,
          jsonb_build_object('t', r.eff ->> 't', 'v', to_jsonb(- coalesce((r.eff ->> 'v')::numeric, 0))));
      end loop;
    end if;
  end if;
end $$;

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
  v_opts := public._policy_options(v_def);
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
