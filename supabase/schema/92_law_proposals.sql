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

-- A passed law sets the nation's chosen option for the policy AND applies that
-- option's one-time (cadence='once') effects — the "costs money from the treasury"
-- moment. Per-tick effects are applied each month by the per-tick pass (later).
-- ONE place the per-nation option flip lives (called from _resolve_proposal on pass).
create or replace function public._apply_law(p_nation text, p_policy uuid, p_option int)
returns void language plpgsql security definer set search_path = public as $$
declare v_tick int; v_old int; v_def jsonb; v_oldname text; v_newname text; v_opts jsonb; r record;
begin
  select current_tick into v_tick from public.game_state where id;
  select definition into v_def from public.policies where id = p_policy;
  -- The option in force BEFORE this law, read before the flip.
  v_old := public._nation_policy_option(p_nation, p_policy);
  -- Flip the option AND stamp the enactment tick (policy_since) so finite-duration
  -- tick effects can age from here; an active enactment starts/resets that clock.
  update public.nations
     set policies     = jsonb_set(coalesce(policies, '{}'::jsonb),     array[p_policy::text], to_jsonb(p_option), true),
         policy_since = jsonb_set(coalesce(policy_since, '{}'::jsonb), array[p_policy::text], to_jsonb(v_tick),   true)
   where id = p_nation;
  perform public._apply_policy_option_effects(p_nation, p_policy, p_option, 'once');

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
    elsif jsonb_typeof(v_opts) = 'array'
       and exists (select 1 from jsonb_array_elements(v_opts) o where o.value ? 'transitions') then
      -- LEGACY explicit `transitions` (pre-doorway) — kept for any policy still authored that way.
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
    else
      -- Plain per-level `effects` (the adminsetup shape): apply the NET directional stat shift ONCE —
      -- cumulative(to) − cumulative(from). So leaving a −3 rung (D) for a −1 rung (B) nets +2, and the
      -- reverse move nets −2. These per-level stat effects are one-time rung-change shifts, NOT a
      -- recurring drain — the monthly sweep (schema/91) skips them; money stays standing there.
      for r in select value as t from jsonb_array_elements(public._policy_transition_effects(v_def, v_old, p_option)) loop
        perform public._apply_policy_effect(p_nation, r.t);
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

-- The NET, directional stat shift of a rung move for a plain per-level `effects` policy (the
-- adminsetup authoring shape — no doorUp/doorDown, no `transitions`). Model: each level's effect is
-- the per-step increment, being at rung N is the sum of levels 1..N (spectrum) or that state (binary),
-- and a MOVE applies cumulative(to) − cumulative(from). So D(−3)→B(−1) nets +2, B→D nets −2. MIRRORS
-- policyEffectChange in policies.js (the propose/bill preview). Excludes money (Budget/Debt/Income —
-- standing per-year fiscal, applied by the tick sweep), the derived Tax Burden, and the vote/government
-- popularity targets (driven by votes, not rung crossings). Returns aggregated {t, v} with v the signed
-- net, so _apply_law applies each stat once (no intermediate clamping across the crossed levels).
create or replace function public._policy_transition_effects(p_def jsonb, p_from int, p_to int)
returns jsonb language plpgsql immutable as $$
declare
  v_opts jsonb := public._policy_options(p_def);
  v_spectrum boolean := (p_def->>'type') = 'spectrum';
  v_totals jsonb := '{}'::jsonb; side record; i int; lo int; hi int; e jsonb; t text; val numeric;
begin
  if v_opts is null or jsonb_typeof(v_opts) <> 'array' then return '[]'::jsonb; end if;
  -- cumulative(to) [+] minus cumulative(from) [−]: sum each side's in-force levels, signed.
  for side in select * from (values (p_to, 1), (p_from, -1)) as s(idx, sgn) loop
    if v_spectrum then lo := 1; hi := side.idx; else lo := side.idx; hi := side.idx; end if;
    i := lo;
    while i <= hi loop
      for e in select value from jsonb_array_elements(coalesce(v_opts->i->'effects', '[]'::jsonb)) loop
        t := e->>'t';
        -- Only the plain per-step increments (no explicit cadence) are one-time rung shifts. An effect
        -- with an explicit cad is handled elsewhere and must NOT be double-applied: cad='once' by
        -- _apply_law's once-pass, cad='tick'/'year' by the monthly sweep (schema/91). Money is standing
        -- (tick sweep); Tax Burden is derived; Party Popularity is vote-driven (policyVotePopularity).
        continue when t is null
          or (e->>'cad') is not null
          or t in ('Budget','Debt','Income','Tax Burden','Party Popularity');
        val := coalesce((e->>'v')::numeric, 0) * side.sgn;
        v_totals := jsonb_set(v_totals, array[t], to_jsonb(coalesce((v_totals->>t)::numeric, 0) + val));
      end loop;
      i := i + 1;
    end loop;
  end loop;
  return (select coalesce(jsonb_agg(jsonb_build_object('t', key, 'v', (value)::numeric)), '[]'::jsonb)
          from jsonb_each_text(v_totals) where (value)::numeric <> 0);
end $$;

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

-- Propose a policy change → the bill goes to COMMITTEE (schema/154), not straight to the floor.
-- Charges the scaled proposal cost in Influence (_proposal_cost — the policy's own authored influence
-- scaled by how many rungs the change moves). From committee the proposer pushes it to the floor.
-- p_title / p_intro are the optional heading + introductory article; blank → the title falls back
-- to "Policy → Option" and there's no intro. Returns { id, status:'committee', cost, actions }.
drop function if exists public.propose_law(uuid, int, boolean);
drop function if exists public.propose_law(uuid, int, boolean, text, text);
create or replace function public.propose_law(p_policy uuid, p_option int,
  p_title text default null, p_intro text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_party public.parties%rowtype; v_name text; v_opt text; v_def jsonb;
  v_tick int; v_curopt int; v_levels int; v_cost int; v_pid uuid;
  v_title text; v_intro text;
begin
  select policy_name, option_name into v_name, v_opt from public._check_law(p_policy, p_option);
  select definition into v_def from public.policies where id = p_policy;
  select current_tick into v_tick from public.game_state where id;
  -- Bill heading: the authored title, else the canonical "Policy → Option" label. Both length-capped
  -- server-side (the client also caps) so a crafted call can't store a huge string.
  v_title := left(coalesce(nullif(btrim(p_title), ''), v_name || ' → ' || v_opt), 120);
  v_intro := left(nullif(btrim(p_intro), ''), 400);

  v_party := public._begin_action(0);   -- lock the party, require >= 1 Influence

  -- A party with no legislature seats has no standing to author a bill (client greys it out too).
  if v_party.seats < 1 then raise exception 'A party with no legislature seats cannot propose a bill.'; end if;

  -- No-op guard: don't let a party spend Influence to propose the option already in force.
  v_curopt := public._nation_policy_option(v_party.nation_id, p_policy);
  if v_curopt = p_option then raise exception 'That policy is already set to that option.'; end if;

  -- Cost = the policy's own authored Influence (definition.influence) scaled by the number of rungs
  -- the change moves (_proposal_cost). Each policy sets its own base — there's no game-wide setting.
  v_levels := abs(p_option - v_curopt);
  v_cost := public._proposal_cost(coalesce((v_def->>'influence')::int, 0), v_levels);

  -- One live bill per policy. Lock the nation row (the no-confidence idiom) so two parties can't both
  -- slip a competing bill in, then refuse if one is already in committee, on the agenda, or on the floor.
  perform 1 from public.nations where id = v_party.nation_id for update;
  if exists (select 1 from public.proposals
               where nation_id = v_party.nation_id and kind = 'law'
                 and status in ('committee', 'voting', 'agenda')
                 and payload->>'policy_id' = p_policy::text) then
    raise exception 'A bill to change this policy is already before the chamber — it must resolve first.';
  end if;
  -- A change to this policy that passed and is still being implemented (schema/155) also locks it.
  if exists (select 1 from public.nation_law_implementations
               where nation_id = v_party.nation_id and policy_id = p_policy) then
    raise exception 'A change to this policy is already being implemented — wait for it to take effect.';
  end if;

  insert into public.proposals (nation_id, party_id, kind, title, payload, status, opened_tick)
    values (v_party.nation_id, v_party.id, 'law', v_title,
            jsonb_build_object('policy_id', p_policy, 'option_idx', p_option, 'policy_name', v_name, 'option_name', v_opt)
              || case when v_intro is null then '{}'::jsonb else jsonb_build_object('intro', v_intro) end,
            'committee', v_tick)   -- opened_tick = when it entered committee; the 6-tick expiry ages from here
    returning id into v_pid;

  return jsonb_build_object('id', v_pid, 'status', 'committee', 'cost', v_cost, 'actions', v_party.influence);
end $$;
grant execute on function public.propose_law(uuid, int, text, text) to authenticated;

notify pgrst, 'reload schema';
