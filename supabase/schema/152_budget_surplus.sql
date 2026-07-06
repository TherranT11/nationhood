-- 152 · Budget surplus → debt paydown (per tick)
--
-- Every tick, a nation with a POSITIVE Budget Balance pays down its Public Debt by the annual
-- balance / 12, floored to one decimal. Called from _advance_tick (schema/60).
--
-- Budget Balance is the net of every policy's in-force Budget Balance effect. _nation_budget_balance
-- MIRRORS policyBudgetContribution / nationBudgetBalance in policies.js (the client shows the same
-- figure in the top bar, Budget page and Government cell) — keep the two in sync:
--   · spectrum levels are transition deltas, so being at level N accumulates levels 1..N (base 0 has none)
--   · a binary policy uses its in-force state's effects
--   · a Budget Balance effect with unit 'gdp' is amount% of GDP; otherwise the flat amount in $bn
--   · trade policy (definition.special = 'trade') has no Budget Balance effects, so it's skipped
-- Depends on: 10 (nations.gdp/economy), 90 (policies), 92 (_nation_policy_option).

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
  return v_sum;
end $$;
revoke all on function public._nation_budget_balance(text) from public, anon, authenticated;

-- Per-tick paydown: a positive Budget Balance reduces Public Debt (economy.debt) by the annual
-- balance / 12, floored to one decimal; debt never drops below 0. Non-positive balance = no-op.
create or replace function public._apply_budget_surplus(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_bal numeric; v_pay numeric;
begin
  for r in select id from public.nations where coalesce(dormant, false) = false loop
    v_bal := public._nation_budget_balance(r.id);
    if v_bal is null or v_bal <= 0 then continue; end if;
    v_pay := floor(v_bal / 12.0 * 10) / 10;                   -- monthly paydown, rounded DOWN to 0.1
    if v_pay <= 0 then continue; end if;
    update public.nations
       set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{debt}',
             to_jsonb(greatest(0, round(coalesce((economy->>'debt')::numeric, 0) - v_pay, 1))))
     where id = r.id
       and coalesce((economy->>'debt')::numeric, 0) > 0;      -- nothing to pay down at zero debt
  end loop;
end $$;
revoke all on function public._apply_budget_surplus(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
