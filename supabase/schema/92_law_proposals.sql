-- ===========================================================================
-- 92 · Law proposals (policy changes via the floor).
-- Depends on: 81 (proposals + _resolve_proposal dispatch + _begin_action/
-- _lock_party/_party_seats), 90 (policies + nations.policies). Run after 90.
--
-- A party proposes changing one of the nation's policies to a different option.
-- It rides the EXISTING proposal/vote machinery (schema/81): queued on the agenda
-- (free) or sent straight to the floor (2 Influence), every party votes with its
-- seats, and it passes the instant Aye-seats reach a chamber majority — the one
-- pass authority, _resolve_proposal, which dispatches kind='law' to _apply_law.
-- advance_tick (schema/60) already promotes/expires proposals kind-agnostically.
--
-- NOTE: passing a law FLIPS the nation's option for the policy and applies that
-- option's once-effects (schema/91). Per-tick effects are applied each month by a
-- later per-tick pass.
-- ===========================================================================

-- The "level" of a structured effect target for one option: the sum of that option's
-- STANDING (non-'once') effects on that target. Comparing it between the old and new
-- option gives the DIRECTION a law moves an axis (e.g. Tax Burden falling = a tax cut),
-- which directional convictions react to — see _apply_law. Only the SIGN matters here,
-- so raw authored amounts are summed (money scaling is a positive factor that can never
-- flip the sign). ONE source: reads the same effects that drive the nation's economy.
create or replace function public._option_axis_level(p_def jsonb, p_option int, p_axis text)
returns numeric language sql immutable set search_path = public as $$
  select case
    -- Tax Burden % is a LEVEL the option carries (its 'taxBurden' contribution), not a
    -- deltable effect — so the axis level for it is that contribution directly.
    when p_axis = 'Tax Burden %'
      then coalesce((public._policy_options(p_def) -> p_option ->> 'taxBurden')::numeric, 0)
    else coalesce((
      select sum((e->>'v')::numeric)
      from jsonb_array_elements(coalesce(public._policy_options(p_def) -> p_option -> 'effects', '[]'::jsonb)) e
      where e->>'t' = p_axis and coalesce(e->>'cad', 'tick') <> 'once'
    ), 0)
  end;
$$;

-- The signed amount a directional rule applies: the authored magnitude, ×|Δ| when scaled,
-- signed + when the axis moved the favoured way (dir 'up'/'down') and − on the opposite.
-- ONE place the directional formula lives — used by the conviction onLaw directional rules
-- (policies moved to per-option transitions; see the transition block in _apply_law).
create or replace function public._directional_amount(p_v numeric, p_scaled boolean, p_delta numeric, p_dir text)
returns numeric language sql immutable set search_path = public as $$
  select coalesce(p_v, 0)
       * case when coalesce(p_scaled, false) then abs(p_delta) else 1 end
       * case when (p_delta > 0) = (coalesce(p_dir, 'up') = 'up') then 1 else -1 end;
$$;

-- A passed law sets the nation's chosen option for the policy AND applies that
-- option's one-time (cadence='once') effects — the "costs money from the treasury"
-- moment. Per-tick effects are applied each month by the per-tick pass (later).
-- ONE place the per-nation option flip lives (called from _resolve_proposal on pass).
create or replace function public._apply_law(p_nation text, p_policy uuid, p_option int)
returns void language plpgsql security definer set search_path = public as $$
declare v_tick int; v_had_override boolean; v_old int; v_tags jsonb; v_old_tags jsonb; v_def jsonb; v_oldname text; v_newname text; v_opts jsonb; r record;
begin
  select current_tick into v_tick from public.game_state where id;
  select definition into v_def from public.policies where id = p_policy;
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

  -- Directional law: a conviction can react to the DIRECTION a structured effect target
  -- moves between the old and new option, instead of a static tag — the principled way to
  -- model "tax cut vs tax rise", which a destination tag can't capture (None→Low is a rise,
  -- High→Low a cut). For each held conviction onLaw rule that names an axis, compare the new
  -- vs old option's level on that axis: a move in the rule's favoured dir ('up'/'down')
  -- applies +v, the opposite move −v. The default in-force option is the 'from' position, so
  -- a first enactment off the default counts as a real move.
  if v_def is not null and v_old is not null and v_old <> p_option then
    for r in
      select pc.party_id, e.value as eff,
             public._option_axis_level(v_def, p_option, e.value->>'axis')
               - public._option_axis_level(v_def, v_old, e.value->>'axis') as delta
      from public.party_convictions pc
      join public.parties p2     on p2.id = pc.party_id and p2.nation_id = p_nation
      join public.convictions c  on c.id = pc.conviction_id
      cross join lateral jsonb_array_elements(coalesce(c.definition -> 'onLaw', '[]'::jsonb)) e
      where nullif(e.value->>'axis', '') is not null
    loop
      if r.delta = 0 then continue; end if;   -- the law didn't move this axis
      perform public._apply_conviction_effect(r.party_id, p_nation,
        jsonb_build_object('t', r.eff->>'t', 'v', to_jsonb(public._directional_amount(
          (r.eff->>'v')::numeric, (r.eff->>'scaled')::boolean, r.delta, r.eff->>'dir'))));
    end loop;
  end if;

  -- Transition effects on a move OLD→NEW. DOORWAY model: each option owns doorUp (effects when
  -- stepping UP into it from below) and doorDown (stepping DOWN into it from above); a multi-rung
  -- move sums the doorways it crosses (no size-of-move scaling). Reuses _apply_policy_effect so
  -- the stat/economy/government mapping stays in one place — and the raw doorway object is passed
  -- straight through, so a money doorway's own `scale` (flat / per-million / ×pop×prosperity) is
  -- honored exactly like an enactment effect's.
  -- FALLBACK: a policy not yet migrated to doorways (no doorUp/doorDown keys) still fires its
  -- legacy rung-specific `transitions` — open+save it in adminsetup to migrate; once every policy
  -- has doorways the else-branch below can be deleted.
  if v_def is not null and v_old is not null and v_old <> p_option then
    v_opts := public._policy_options(v_def);
    if jsonb_typeof(v_opts) = 'array'
       and exists (select 1 from jsonb_array_elements(v_opts) o where o.value ? 'doorUp' or o.value ? 'doorDown') then
      -- One source for the walk (also used by law_transition_preview): the crossed doorways.
      -- Pass the raw effect through so its `scale` rides along (flat when absent).
      for r in select value as t from jsonb_array_elements(public._doorway_effects(v_def, v_old, p_option)) loop
        perform public._apply_policy_effect(p_nation, r.t);
      end loop;
    else
      v_oldname := v_opts -> v_old    ->> 'name';
      v_newname := v_opts -> p_option ->> 'name';
      for r in
        select e.value as t from jsonb_array_elements(coalesce(v_opts -> p_option -> 'transitions', '[]'::jsonb)) e
        where e.value->>'dir' = 'from' and e.value->>'rung' = v_oldname
      loop
        perform public._apply_policy_effect(p_nation, jsonb_build_object('t', r.t->>'t', 'v', r.t->'v'));
      end loop;
      for r in
        select e.value as t from jsonb_array_elements(coalesce(v_opts -> v_old -> 'transitions', '[]'::jsonb)) e
        where e.value->>'dir' = 'to' and e.value->>'rung' = v_newname
      loop
        perform public._apply_policy_effect(p_nation, jsonb_build_object('t', r.t->>'t', 'v', r.t->'v'));
      end loop;
    end if;
  end if;
end $$;

-- The doorway effects a move p_from→p_to crosses, as a flat jsonb array of {t,v}: climbing
-- sums each crossed option's doorUp, cutting each crossed option's doorDown. ONE source for
-- the walk — _apply_law applies these; law_transition_preview returns them for the proposer.
-- Empty for no move, or a policy with no doorways (legacy transitions are handled separately).
create or replace function public._doorway_effects(p_def jsonb, p_from int, p_to int)
returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(e.value), '[]'::jsonb)
  from generate_series(
         case when p_to > p_from then p_from + 1 else p_to end,
         case when p_to > p_from then p_to else p_from - 1 end
       ) i
  cross join lateral jsonb_array_elements(
    coalesce(public._policy_options(p_def) -> i
             -> (case when p_to > p_from then 'doorUp' else 'doorDown' end), '[]'::jsonb)
  ) e;
$$;

-- RPC: the one-time transition (doorway) cost of a proposed move, for the proposal preview.
-- Returns the raw {t, v, scale?} effects; the client renders each with its own scale (flat when absent).
create or replace function public.law_transition_preview(p_policy uuid, p_from int, p_to int)
returns jsonb language sql stable security definer set search_path = public as $$
  select public._doorway_effects(definition, p_from, p_to) from public.policies where id = p_policy;
$$;
grant execute on function public.law_transition_preview(uuid, int, int) to anon, authenticated;

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
-- p_title / p_intro are the optional bill heading + introductory article authored on
-- the propose page; blank → the title falls back to "Policy → Option" and no intro.
drop function if exists public.propose_law(uuid, int, boolean);
create or replace function public.propose_law(p_policy uuid, p_option int, p_to_floor boolean,
  p_title text default null, p_intro text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_party public.parties%rowtype; v_name text; v_opt text;
  v_cur int; v_sched int; v_pid uuid; v_res text;
  v_title text; v_intro text;
begin
  select policy_name, option_name into v_name, v_opt from public._check_law(p_policy, p_option);
  select current_tick into v_cur from public.game_state where id;
  -- Bill heading: the authored title, else the canonical "Policy → Option" label. Both are
  -- length-capped server-side (the client also caps) so a crafted call can't store a huge string.
  v_title := left(coalesce(nullif(btrim(p_title), ''), v_name || ' → ' || v_opt), 120);
  v_intro := left(nullif(btrim(p_intro), ''), 400);

  if p_to_floor then
    v_party := public._begin_action(0);          -- locks the party, requires Influence
    if v_party.influence < 2 then raise exception 'Bringing a bill to the floor costs 2 Influence.'; end if;
  else
    v_party := public._lock_party();
    select greatest(v_cur + 1, coalesce(max(scheduled_tick), v_cur) + 1)
      into v_sched
      from public.proposals where nation_id = v_party.nation_id and status = 'agenda';
  end if;

  -- A party that holds no legislature seats has no standing on the floor — it cannot
  -- author a bill (whether queued on the agenda or sent straight to the floor). The
  -- client also greys the propose buttons out; this is the server-authoritative gate.
  if v_party.seats < 1 then raise exception 'A party with no legislature seats cannot propose a bill.'; end if;

  -- No-op guard: don't let a party spend Influence to propose the option already in force.
  if public._nation_policy_option(v_party.nation_id, p_policy) = p_option then
    raise exception 'That policy is already set to that option.';
  end if;

  -- One pending bill per policy. Lock the nation row (the no-confidence idiom) so two parties
  -- can't both slip in a competing bill for the same policy, then refuse if one is already on
  -- the floor or the agenda — it must resolve before another can change the same policy.
  perform 1 from public.nations where id = v_party.nation_id for update;
  if exists (select 1 from public.proposals
               where nation_id = v_party.nation_id and kind = 'law'
                 and status in ('voting', 'agenda')
                 and payload->>'policy_id' = p_policy::text) then
    raise exception 'A bill to change this policy is already before the chamber — it must resolve first.';
  end if;

  insert into public.proposals (nation_id, party_id, kind, title, payload, status, opened_tick, scheduled_tick)
    values (v_party.nation_id, v_party.id, 'law',
            v_title,
            jsonb_build_object('policy_id', p_policy, 'option_idx', p_option, 'policy_name', v_name, 'option_name', v_opt)
              || case when v_intro is null then '{}'::jsonb else jsonb_build_object('intro', v_intro) end,
            case when p_to_floor then 'voting' else 'agenda' end,
            case when p_to_floor then v_cur else null end,
            case when p_to_floor then null else v_sched end)
    returning id into v_pid;

  if not p_to_floor then
    return jsonb_build_object('id', v_pid, 'status', 'agenda', 'scheduled_tick', v_sched, 'actions', v_party.influence);
  end if;

  update public.parties set influence = influence - 2 where id = v_party.id;   -- bringing a bill to the floor costs 2 Influence
  insert into public.proposal_votes (proposal_id, party_id, aye) values (v_pid, v_party.id, true);
  v_res := public._resolve_proposal(v_pid);
  return jsonb_build_object('id', v_pid, 'status', v_res, 'actions', v_party.influence - 2);
end $$;
grant execute on function public.propose_law(uuid, int, boolean, text, text) to authenticated;

notify pgrst, 'reload schema';
