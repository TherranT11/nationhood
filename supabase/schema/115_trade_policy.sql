-- ===========================================================================
-- 115 · Trade Policy — the import-side modifiers (multiplier + tariff) a nation's
-- in-force trade rung applies. Depends on: 10 (nations.policies), 90 (policies,
-- _policy_options), 114 (economy_import). Run after 114.
--
-- The Trade Policy is an ordinary policies row tagged definition->>'special' = 'trade',
-- so it rides legislation + the per-tick effects engine like any policy. These helpers
-- expose the EXTRA per-rung modifiers the generic effects engine doesn't understand —
-- importMult (the buyer's sticker multiplier), tariff (% withheld from the seller and
-- banked as the buyer's customs revenue), and blocked (Autarky closes imports) — read at
-- import time by economy_import. The admin authors them in the Trade Policy tab.
-- ===========================================================================

-- The in-force trade rung's modifiers for a nation. Falls back to Managed Trade
-- (×1.0, no tariff, open) when no trade policy exists or the option is out of range.
create or replace function public._nation_trade_policy(p_nation text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_id uuid; v_def jsonb; v_opts jsonb; v_idx int; v_opt jsonb;
begin
  select id, definition into v_id, v_def from public.policies where definition->>'special' = 'trade' limit 1;
  if not found then
    return jsonb_build_object('importMult', 1, 'tariff', 0, 'blocked', false, 'name', 'Managed Trade');
  end if;
  v_opts := public._policy_options(v_def);
  if v_opts is null or jsonb_typeof(v_opts) <> 'array' or jsonb_array_length(v_opts) = 0 then
    return jsonb_build_object('importMult', 1, 'tariff', 0, 'blocked', false, 'name', 'Managed Trade');
  end if;
  v_idx := coalesce(
    (select (n.policies->>v_id::text)::int from public.nations n where n.id = p_nation),
    (v_def->>'defaultIdx')::int, 0);
  if v_idx < 0 or v_idx >= jsonb_array_length(v_opts) then v_idx := 0; end if;
  v_opt := v_opts->v_idx;
  return jsonb_build_object(
    'importMult', coalesce((v_opt->>'importMult')::numeric, 1),
    'tariff',     coalesce((v_opt->>'tariff')::numeric, 0),
    'blocked',    coalesce((v_opt->>'blocked')::boolean, false),
    'name',       coalesce(nullif(v_opt->>'name', ''), 'Trade'));
end $$;
revoke all on function public._nation_trade_policy(text) from public, anon, authenticated;

-- Client read: the in-force trade modifiers for a nation, so the Economy page can show
-- the real import cost (sticker × multiplier, tariff duty, net) before a Trade Minister buys.
create or replace function public.nation_trade_policy(p_nation text)
returns jsonb language sql stable security definer set search_path = public as $$
  select public._nation_trade_policy(p_nation);
$$;
grant execute on function public.nation_trade_policy(text) to authenticated;

notify pgrst, 'reload schema';
