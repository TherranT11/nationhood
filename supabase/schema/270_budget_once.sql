-- ===========================================================================
-- 270 · Budget Balance "One Time" — a discrete Public Debt hit on enactment.
--
-- Until now a policy option's Budget Balance effect was ALWAYS a standing per-year line ($ flat or %
-- of GDP), summed forever by _nation_budget_balance and bled into Public Debt every tick. This adds a
-- third authoring mode: unit='once'. A one-time Budget Balance effect is a single Public Debt change
-- applied the instant the option is enacted — "enacting this policy adds $5B to the national debt,
-- once" — and NOT an ongoing balance line.
--
-- Where it fires: _apply_law's once moment (a passed law bill flips the nation's option). The one-time
-- amount moves Public Debt directly — a cost (negative) is ADDED to the national debt; a windfall
-- (positive) pays it down, never below 0 — and leaves one 'budget' ledger event. It is NOT applied on
-- the initial admin nation setup (that writes nations.policies directly, never _apply_law), so a
-- one-time cost only lands when the policy is legislated in.
--
-- Where it is EXCLUDED (so it never double-counts as a standing line):
--   · _nation_policy_stat (schema/210)          — the standing Budget Balance sum skips unit='once'
--   · _policy_transition_effects (schema/92)     — the rung-move net-diff preview skips unit='once'
--   · policyInForceEffects (policies.js)         — the client mirror of both (separate edit)
--
-- Redefines reproduce each function's LATEST body verbatim (210 for _nation_policy_stat, 92 for the two
-- others) with ONLY the one-time handling added. Depends on: 92, 152, 210. Idempotent. Apply after 210.
-- ===========================================================================

set check_function_bodies = off;

-- ---- _nation_policy_stat (verbatim from schema/210) + skip unit='once' ------------------------------
-- A unit='once' Budget Balance effect is a one-time enactment cost, never a standing contribution to
-- any stat total, so the policy-walk summer ignores it in both modes (standing and gdp-revenue-only).
drop function if exists public._nation_policy_stat(text, text, boolean);
create or replace function public._nation_policy_stat(p_nation text, p_stat text, p_gdp_revenue_only boolean default false)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare
  v_gdp numeric; v_sum numeric := 0; r record; v_type text; v_opts jsonb;
  v_idx int; v_from int; i int; v_eff jsonb; v_v numeric; v_c numeric;
begin
  select gdp into v_gdp from public.nations where id = p_nation;
  for r in select id, definition from public.policies
             where coalesce(definition->>'special', '') <> 'trade' loop
    v_type := coalesce(r.definition->>'type', 'spectrum');
    v_opts := r.definition->v_type;                            -- the 'spectrum' or 'binary' array
    if v_opts is null or jsonb_typeof(v_opts) <> 'array' then continue; end if;
    v_idx  := public._nation_policy_option(p_nation, r.id);    -- the in-force option index
    v_from := case when v_type = 'spectrum' then 1 else v_idx end;   -- spectrum accumulates 1..idx
    for i in v_from .. v_idx loop                             -- no iterations when idx < from (e.g. base level)
      if v_opts->i is null then continue; end if;
      for v_eff in select value from jsonb_array_elements(coalesce(v_opts->i->'effects', '[]'::jsonb)) loop
        if v_eff->>'t' <> p_stat then continue; end if;
        if v_eff->>'unit' = 'once' then continue; end if;      -- one-time enactment hit, not a standing line
        v_v := coalesce((v_eff->>'v')::numeric, 0);
        if p_gdp_revenue_only then
          -- Only the POSITIVE % of GDP contributions — the tax revenue Corruption can eat into.
          if v_eff->>'unit' = 'gdp' then
            v_c := v_v / 100.0 * coalesce(v_gdp, 0);
            if v_c > 0 then v_sum := v_sum + v_c; end if;
          end if;
        else
          v_sum := v_sum + case when v_eff->>'unit' = 'gdp' then v_v / 100.0 * coalesce(v_gdp, 0) else v_v end;
        end if;
      end loop;
    end loop;
  end loop;
  return v_sum;
end $$;
revoke all on function public._nation_policy_stat(text, text, boolean) from public, anon, authenticated;

-- ---- _policy_transition_effects (verbatim from schema/92) + skip unit='once' -------------------------
-- A one-time Budget Balance effect is applied whole by _apply_law's once moment, so it must NOT also
-- appear in the rung-move net-diff (which would show it as a standing change and flip its sign on reversal).
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
        -- A unit='once' Budget Balance effect is applied whole on enactment (schema/270), never as a rung shift.
        continue when t is null
          or (e->>'cad') is not null
          or (e->>'unit') = 'once'
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

-- ---- _apply_law (verbatim from schema/92) + one-time Budget Balance hit ------------------------------
create or replace function public._apply_law(p_nation text, p_policy uuid, p_option int)
returns void language plpgsql security definer set search_path = public as $$
declare v_tick int; v_old int; v_def jsonb; v_oldname text; v_newname text; v_opts jsonb; r record;
        v_once numeric; v_cur text; v_debt0 numeric; v_debt numeric; v_moved numeric;
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

  -- One-time Budget Balance hit: a Budget Balance effect authored as unit='once' is a discrete Public
  -- Debt change applied the moment the option is enacted — NOT a standing per-year line
  -- (_nation_policy_stat / policies.js exclude unit='once' from the balance). Sum the newly-in-force
  -- option's one-time Budget Balance effects: a cost (negative) is ADDED to the national debt; a windfall
  -- (positive) pays it down, never below 0. One 'budget' ledger event records the actual move.
  if v_def is not null then
    select coalesce(sum((e->>'v')::numeric), 0) into v_once
      from jsonb_array_elements(coalesce((public._policy_options(v_def)->p_option)->'effects', '[]'::jsonb)) e
     where e->>'t' = 'Budget Balance' and e->>'unit' = 'once';
    if coalesce(v_once, 0) <> 0 then
      select coalesce(economy->>'currency', '$'), coalesce((economy->>'debt')::numeric, 0)
        into v_cur, v_debt0 from public.nations where id = p_nation;
      v_debt  := greatest(0, round(v_debt0 - v_once, 1));   -- cost (v_once<0) grows debt; windfall pays it down, floor 0
      v_moved := abs(v_debt - v_debt0);
      if v_moved > 0 then
        update public.nations set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{debt}', to_jsonb(v_debt)) where id = p_nation;
        insert into public.events (nation_id, kind, body, game_date, tone, debt_after)
          values (p_nation, 'budget',
            'Enacting ' || coalesce(v_def->>'name', 'a policy')
              || case when v_once > 0 then ' paid down ' || v_cur || trim_scale(v_moved) || 'B of national debt.'
                      else ' added ' || v_cur || trim_scale(v_moved) || 'B to the national debt.' end,
            public.current_game_date(), case when v_once > 0 then 'pos' else 'neg' end, v_debt);
      end if;
    end if;
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

notify pgrst, 'reload schema';
