-- 152 · Public Debt dynamics (per tick + annual interest)
--
-- Every tick, a nation's Budget Balance moves its Public Debt by the annual balance / 12 (magnitude
-- floored to one decimal): a POSITIVE balance (surplus) pays the debt down (never below 0); a
-- NEGATIVE balance (deficit) adds to it — symmetric, so a running deficit grows the debt from 0.
-- Every JANUARY, the remaining Public Debt accrues 3% interest. Both called from _advance_tick (60).
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

create or replace function public._nation_budget_balance(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare
  v_gdp numeric; v_sum numeric := 0; r record; v_def jsonb; v_type text; v_opts jsonb;
  v_idx int; v_from int; i int; v_eff jsonb; v_v numeric;
begin
  select gdp into v_gdp from public.nations where id = p_nation;
  for r in select id, definition from public.policies
             where coalesce(definition->>'special', '') <> 'trade' loop
    v_def  := r.definition;
    v_type := coalesce(v_def->>'type', 'spectrum');
    v_opts := v_def->v_type;                                   -- the 'spectrum' or 'binary' array
    if v_opts is null or jsonb_typeof(v_opts) <> 'array' then continue; end if;
    v_idx  := public._nation_policy_option(p_nation, r.id);    -- the in-force option index
    v_from := case when v_type = 'spectrum' then 1 else v_idx end;   -- spectrum accumulates 1..idx
    for i in v_from .. v_idx loop                             -- no iterations when idx < from (e.g. base level)
      if v_opts->i is null then continue; end if;
      for v_eff in select value from jsonb_array_elements(coalesce(v_opts->i->'effects', '[]'::jsonb)) loop
        if v_eff->>'t' <> 'Budget Balance' then continue; end if;
        v_v := coalesce((v_eff->>'v')::numeric, 0);
        v_sum := v_sum + case when v_eff->>'unit' = 'gdp' then v_v / 100.0 * coalesce(v_gdp, 0) else v_v end;
      end loop;
    end loop;
  end loop;
  -- Running initiatives: this nation's standing share of each active programme's $bn/yr (as the
  -- enacting nation, (100 − share)%; as a joint partner, share%).
  for r in
    select coalesce((i.definition->>'budgetPerYear')::numeric, 0) as byear,
           coalesce(ni.partner_share, 0) as share, (ni.nation_id = p_nation) as is_owner
      from public.nation_initiatives ni
      join public.national_initiatives i on i.id = ni.initiative_id
     where ni.status = 'active' and (ni.nation_id = p_nation or ni.partner_nation = p_nation)
  loop
    v_sum := v_sum - case when r.is_owner then r.byear * (100 - r.share) / 100.0
                          else r.byear * r.share / 100.0 end;
  end loop;
  return v_sum;
end $$;
revoke all on function public._nation_budget_balance(text) from public, anon, authenticated;

-- Per-tick debt move: this month's balance = the annual Budget Balance / 12, magnitude floored to one
-- decimal. A surplus (>0) pays Public Debt (economy.debt) down, never below 0 (no-op at zero debt); a
-- deficit (<0) adds to it — growing the debt even from 0. A balance under ±1.2/yr rounds to 0 = no-op.
create or replace function public._apply_budget_balance(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_bal numeric; v_step numeric;
begin
  for r in select id from public.nations where coalesce(dormant, false) = false loop
    v_bal := public._nation_budget_balance(r.id);
    if v_bal is null or v_bal = 0 then continue; end if;
    v_step := floor(abs(v_bal) / 12.0 * 10) / 10;            -- monthly magnitude, rounded DOWN to 0.1
    if v_step <= 0 then continue; end if;
    if v_bal > 0 then
      update public.nations
         set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{debt}',
               to_jsonb(greatest(0, round(coalesce((economy->>'debt')::numeric, 0) - v_step, 1))))
       where id = r.id
         and coalesce((economy->>'debt')::numeric, 0) > 0;    -- nothing to pay down at zero debt
    else
      update public.nations
         set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{debt}',
               to_jsonb(round(coalesce((economy->>'debt')::numeric, 0) + v_step, 1)))
       where id = r.id;                                       -- a deficit grows the debt (from 0 if need be)
    end if;
  end loop;
end $$;
revoke all on function public._apply_budget_balance(int) from public, anon, authenticated;
drop function if exists public._apply_budget_surplus(int);   -- renamed (now moves debt both ways)

-- Annual interest: every January (tick 1 = Jan 1980, so (tick−1) mod 12 = 0), Public Debt grows
-- 3% — a $20bn debt gains $0.6bn. Result rounded to one decimal; zero-debt / dormant nations skip.
create or replace function public._apply_debt_interest(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if (p_tick - 1) % 12 <> 0 then return; end if;   -- January only
  update public.nations
     set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{debt}',
           to_jsonb(round(coalesce((economy->>'debt')::numeric, 0) * 1.03, 1)))
   where coalesce((economy->>'debt')::numeric, 0) > 0
     and coalesce(dormant, false) = false;
end $$;
revoke all on function public._apply_debt_interest(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
