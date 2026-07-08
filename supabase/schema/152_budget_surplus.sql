-- 152 · Public Debt dynamics (per tick + annual interest)
--
-- Every tick, a nation's Budget Balance moves its Public Debt by the annual balance / 12 (magnitude
-- floored to one decimal): a POSITIVE balance (surplus) pays the debt down (never below 0); a
-- NEGATIVE balance (deficit) adds to it — symmetric, so a running deficit grows the debt from 0.
-- Every JANUARY, the remaining Public Debt accrues 5% interest. Both called from _advance_tick (60).
--
-- Budget Balance is the net of every policy's in-force Budget Balance effect MINUS every running
-- national initiative's standing $bn/yr cost. _nation_budget_balance MIRRORS nationBudgetContributions
-- / nationBudgetBalance in policies.js (the client shows the same figure in the top bar, Budget page
-- and Government cell) — keep the two in sync:
--   · spectrum levels are transition deltas, so being at level N accumulates levels 1..N (base 0 has none)
--   · a binary policy uses its in-force state's effects
--   · a Budget Balance effect with unit 'gdp' is amount% of GDP; otherwise the flat amount in $bn
--   · trade policy (definition.special = 'trade') has no Budget Balance effects, so it's skipped
--   · a running initiative (schema/141) subtracts its authored budgetPerYear; a joint project splits it —
--     the enacting nation bears (100 − partner_share)%, the partner covers partner_share%
-- Depends on: 10 (nations.gdp/economy), 90 (policies), 92 (_nation_policy_option), 141 (nation_initiatives).

-- The cumulative in-force contribution of every policy to one stat — the SQL mirror of
-- policyInForceEffects/policyStatContribution (policies.js): a spectrum accumulates its crossed levels
-- 1..idx (base level 0 has none), a binary uses its in-force state, a 'gdp'-unit effect is amount% of
-- GDP, and trade policy is skipped. ONE server source for a nation's policy-driven stat total — read by
-- _nation_budget_balance, the bureaucracy/implementation maths (schema/155), and every ministry stat.
create or replace function public._nation_policy_stat(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare
  v_gdp numeric; v_sum numeric := 0; r record; v_type text; v_opts jsonb;
  v_idx int; v_from int; i int; v_eff jsonb; v_v numeric;
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
        v_v := coalesce((v_eff->>'v')::numeric, 0);
        v_sum := v_sum + case when v_eff->>'unit' = 'gdp' then v_v / 100.0 * coalesce(v_gdp, 0) else v_v end;
      end loop;
    end loop;
  end loop;
  return v_sum;
end $$;
revoke all on function public._nation_policy_stat(text, text) from public, anon, authenticated;

create or replace function public._nation_budget_balance(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_sum numeric; r record; v_yc numeric;
begin
  v_sum := public._nation_policy_stat(p_nation, 'Budget Balance');   -- Σ every policy's Budget Balance effect
  -- Running initiatives: this nation's standing share of each active programme's $bn/yr (as the
  -- enacting nation, (100 − share)%; as a joint partner, share%). The cost is a flat $bn or a % of the
  -- ENACTING nation's GDP (definition.budgetUnit), so resolve it against that nation's gdp (nn.gdp).
  for r in
    select coalesce((i.definition->>'budgetPerYear')::numeric, 0) as byear,
           i.definition->>'budgetUnit' as bunit, coalesce(nn.gdp, 0) as owner_gdp,
           coalesce(ni.partner_share, 0) as share, (ni.nation_id = p_nation) as is_owner
      from public.nation_initiatives ni
      join public.national_initiatives i  on i.id  = ni.initiative_id
      join public.nations             nn on nn.id = ni.nation_id
     where ni.status = 'active' and (ni.nation_id = p_nation or ni.partner_nation = p_nation)
  loop
    v_yc := case when r.bunit = 'gdp' then r.byear / 100.0 * r.owner_gdp else r.byear end;
    v_sum := v_sum - case when r.is_owner then v_yc * (100 - r.share) / 100.0
                          else v_yc * r.share / 100.0 end;
  end loop;
  return v_sum;
end $$;
revoke all on function public._nation_budget_balance(text) from public, anon, authenticated;

-- Per-tick debt move: this month's balance = the annual Budget Balance / 12, magnitude floored to one
-- decimal. A surplus (>0) pays Public Debt (economy.debt) down, never below 0 (no-op at zero debt); a
-- deficit (<0) adds to it — growing the debt even from 0. A balance under ±1.2/yr rounds to 0 = no-op.
create or replace function public._apply_budget_balance(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_bal numeric; v_step numeric; v_old numeric; v_new numeric; v_cur text;
begin
  for r in select id, economy from public.nations where coalesce(dormant, false) = false loop
    v_bal := public._nation_budget_balance(r.id);
    if v_bal is null or v_bal = 0 then continue; end if;
    v_step := floor(abs(v_bal) / 12.0 * 10) / 10;            -- monthly magnitude, rounded DOWN to 0.1
    if v_step <= 0 then continue; end if;
    v_old := coalesce((r.economy->>'debt')::numeric, 0);
    v_cur := coalesce(r.economy->>'currency', '$');
    if v_bal > 0 then
      if v_old <= 0 then continue; end if;                   -- nothing to pay down at zero debt
      v_new := greatest(0, round(v_old - v_step, 1));
    else
      v_new := round(v_old + v_step, 1);                     -- a deficit grows the debt (from 0 if need be)
    end if;
    update public.nations set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{debt}', to_jsonb(v_new)) where id = r.id;
    -- Budget-ledger line (kind 'budget' = not newsworthy, so it shows on the Budget page but not the news).
    insert into public.events (nation_id, kind, body, game_date, tone, debt_after)
      values (r.id, 'budget',
        'Budget Balance of ' || v_cur || trim_scale(round(v_bal, 1)) || 'B/yr '
          || case when v_bal > 0 then 'paid down ' || v_cur || trim_scale(v_step) || 'B of debt'
                  else 'added ' || v_cur || trim_scale(v_step) || 'B to the debt' end
          || ', debt now ' || v_cur || trim_scale(v_new) || 'B.',
        public.current_game_date(), case when v_bal > 0 then 'pos' else 'neg' end, v_new);
  end loop;
end $$;
revoke all on function public._apply_budget_balance(int) from public, anon, authenticated;
drop function if exists public._apply_budget_surplus(int);   -- renamed (now moves debt both ways)

-- Annual interest: every January (tick 1 = Jan 1980, so (tick−1) mod 12 = 0), Public Debt accrues
-- interest — and the rate ESCALATES with debt-to-GDP, so a runaway debt compounds faster (a spiral
-- that's hard to climb out of). Base 5%; over 100% of GDP it doubles to 10% (credit downgrade); over
-- 200% it's 15% (sovereign debt spiral). The matching one-off stat pain lands in the January malaise
-- pass (schema/125). Result rounded to one decimal; zero-debt / dormant nations skip.
create or replace function public._apply_debt_interest(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_old numeric; v_rate numeric; v_add numeric; v_new numeric; v_cur text;
begin
  if (p_tick - 1) % 12 <> 0 then return; end if;   -- January only
  for r in select id, economy, gdp from public.nations
            where coalesce((economy->>'debt')::numeric, 0) > 0 and coalesce(dormant, false) = false loop
    v_old  := (r.economy->>'debt')::numeric;
    v_rate := case
                when r.gdp > 0 and v_old > r.gdp * 2 then 0.15   -- > 200% of GDP (sovereign debt spiral)
                when r.gdp > 0 and v_old > r.gdp     then 0.10   -- > 100% of GDP (credit downgrade)
                else 0.05                                        -- base
              end;
    v_new := round(v_old * (1 + v_rate), 1);
    v_add := round(v_new - v_old, 1);
    v_cur := coalesce(r.economy->>'currency', '$');
    update public.nations set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{debt}', to_jsonb(v_new)) where id = r.id;
    insert into public.events (nation_id, kind, body, game_date, tone, debt_after)
      values (r.id, 'budget',
        'Debt interest added ' || (v_rate * 100)::int || '% (' || v_cur || trim_scale(v_add) || 'B), debt now ' || v_cur || trim_scale(v_new) || 'B.',
        public.current_game_date(), 'neg', v_new);
  end loop;
end $$;
revoke all on function public._apply_debt_interest(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
