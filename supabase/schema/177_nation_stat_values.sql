-- ===========================================================================
-- 177 · nation_stat_values — the ONE source for a nation's displayed stat values.
--
-- The Government / Growth / Bureaucracy pages recomputed each stat client-side (ministry_stats base +
-- Σ in-force policy contributions), which (a) duplicated the server's own stat math and (b) missed the
-- writable-stats delta layer (schema/175), so card stat effects were invisible. This RPC returns the
-- final displayed value of each requested stat, computed server-side, so the client reads instead of
-- recomputes. One function, one source.
--
--   Budget Balance → _nation_budget_balance (the $bn/yr flow — a derived figure, no delta applies)
--   Tax Burden     → _nation_tax_burden      (derived from policy, no authored base)
--   Public Debt    → economy.debt            (the real treasury debt a card changes directly)
--   everything else→ _nation_live_stat        (ministry_stats base + policy contributions + delta, 175)
--
-- "--" is preserved: a non-mirror stat with no base, no policy contribution and no delta returns NULL
-- (the client shows "--"); the three mirror stats (Growth/Prosperity/Rule of Law) always resolve
-- through their real-stat fallback. Public read — stat values are public nation data.
--
-- Depends on: 10 (nations), 47 (_nation_tax_burden), 152 (_nation_budget_balance, _nation_policy_stat),
-- 175 (_nation_live_stat with the delta term). Idempotent.
-- ===========================================================================

create or replace function public.nation_stat_values(p_nation text, p_stats text[])
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_out jsonb := '{}'::jsonb; s text; v numeric; n public.nations%rowtype;
begin
  select * into n from public.nations where id = p_nation;
  if not found then return v_out; end if;
  foreach s in array coalesce(p_stats, array[]::text[]) loop
    if s = 'Budget Balance' then
      v := public._nation_budget_balance(p_nation);
    elsif s = 'Tax Burden' then
      v := public._nation_tax_burden(p_nation);
    elsif s = 'Public Debt' then
      v := public._to_num(n.economy->>'debt');
    elsif public._to_num(n.ministry_stats->>s) is not null
       or public._to_num(n.stat_deltas->>s) is not null
       or coalesce(public._nation_policy_stat(p_nation, s), 0) <> 0
       or s in ('Growth', 'Prosperity', 'Rule of Law') then   -- mirrors always have a real backing
      v := public._nation_live_stat(p_nation, s);
    else
      v := null;   -- no base, no policy, no delta → the client renders "--"
    end if;
    if v is not null then v_out := jsonb_set(v_out, array[s], to_jsonb(round(v, 2))); end if;
  end loop;
  return v_out;
end $$;
grant execute on function public.nation_stat_values(text, text[]) to authenticated;

notify pgrst, 'reload schema';
