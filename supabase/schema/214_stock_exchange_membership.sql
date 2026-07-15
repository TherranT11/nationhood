-- ===========================================================================
-- 214 · Stock exchanges become a shared, joinable entity — found / join / leave.
--
-- Until now a "stock exchange" was just a flag + name on the founder's own economy jsonb. To let
-- OTHER nations list on it, the exchange is now its own row (public.stock_exchanges), and a nation's
-- membership is a pointer on its economy: economy.stock_market = { exchange_id, role } — role 'host'
-- (the founder) or 'member' (a joiner). One membership per nation; absent = not listed. That pointer
-- is the ONE source of a nation's membership; the exchange's identity (name/abbr/host) is the ONE
-- source in the table. The Price Rating is unchanged — still computed from the nation's own stats.
--
-- Actions (all Finance-minister-gated):
--   found_stock_exchange(name, abbr) — create an exchange, host it. RoL>=60, +8 Growth, 2 AP. (reworked)
--   join_stock_exchange(exchange)    — list on another nation's exchange. Relations>=7 with the host, 2 AP.
--   leave_stock_exchange()           — a member leaves (the host can't; dissolving is a later feature). 1 AP.
-- Each posts its event. Upkeep (in _nation_budget_balance, the ONE budget source): host 1% of GDP/yr,
-- member 0.2% of GDP/yr.
--
-- Migrates any exchange founded under the old {active,name,abbr} shape (211-213) into the table. Depends
-- on: 40, 91, 114, 137 (nation_relations), 175, 212 (_nation_budget_balance), 10. Idempotent. Apply AFTER 213.
-- ===========================================================================

set check_function_bodies = off;

-- The exchange entity. Public read (an exchange is public knowledge). Writes are RPC-only.
create table if not exists public.stock_exchanges (
  id           uuid primary key default gen_random_uuid(),
  host_nation  text not null references public.nations (id) on delete cascade,
  name         text not null,
  abbr         text not null,
  founded_tick int,
  created_at   timestamptz not null default now()
);
create index if not exists stock_exchanges_host_idx on public.stock_exchanges (host_nation);
alter table public.stock_exchanges enable row level security;
drop policy if exists "stock_exchanges_select_all" on public.stock_exchanges;
create policy "stock_exchanges_select_all" on public.stock_exchanges for select using (true);

-- Transition: fold any exchange founded under the old shape into the new table + pointer.
do $$
declare r record; v_ex uuid; v_tick int;
begin
  select current_tick into v_tick from public.game_state where id;
  for r in select id, economy->'stock_market' as sm from public.nations
            where coalesce((economy->'stock_market'->>'active')::boolean, false)
              and (economy->'stock_market'->>'exchange_id') is null loop
    insert into public.stock_exchanges (host_nation, name, abbr, founded_tick)
      values (r.id, coalesce(r.sm->>'name', 'Stock Exchange'), coalesce(r.sm->>'abbr', 'SX'), v_tick)
      returning id into v_ex;
    update public.nations set economy = jsonb_set(economy, '{stock_market}',
      jsonb_build_object('exchange_id', v_ex, 'role', 'host'), true) where id = r.id;
  end loop;
end $$;

-- FOUND — create an exchange and host it. (Reworked from 213 to write the table + pointer.)
create or replace function public.found_stock_exchange(p_name text, p_abbr text)
returns void language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_rol numeric; v_name text; v_abbr text; v_nname text;
        v_ex uuid; v_tick int; v_listed boolean;
begin
  v_name := btrim(coalesce(p_name, '')); v_abbr := upper(btrim(coalesce(p_abbr, '')));
  if v_name = '' then raise exception 'Name the stock exchange.'; end if;
  if v_abbr = '' then raise exception 'The exchange needs a ticker abbreviation.'; end if;

  v_p := public._begin_action(0); perform public._spend_action_point(v_p.id);   -- 2 AP total
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Treasury') then
    raise exception 'Only the Minister of Finance can found a stock exchange.'; end if;
  v_rol := coalesce(public._nation_live_stat(v_nation, 'Rule of Law'), 0);
  if v_rol < 60 then raise exception 'Founding a stock exchange requires Rule of Law 60 — yours is %.', round(v_rol); end if;

  select (economy->'stock_market'->>'exchange_id') is not null into v_listed
    from public.nations where id = v_nation for update;
  if coalesce(v_listed, false) then raise exception 'Your nation already lists on a stock exchange.'; end if;

  select current_tick into v_tick from public.game_state where id;
  insert into public.stock_exchanges (host_nation, name, abbr, founded_tick)
    values (v_nation, left(v_name, 60), left(v_abbr, 6), v_tick) returning id into v_ex;
  update public.nations set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{stock_market}',
    jsonb_build_object('exchange_id', v_ex, 'role', 'host'), true) where id = v_nation;
  perform public._nation_stat_add(v_nation, 'stats', 'growth', 8, 1, 100);

  select name into v_nname from public.nations where id = v_nation;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'party',
      'The nation of ' || coalesce(v_nname, v_nation) || ' has officially opened the ' || left(v_name, 60) ||
      ', officially listing as the ' || left(v_abbr, 6) || '.', public.current_game_date());
end $$;
revoke all on function public.found_stock_exchange(text, text) from public, anon, authenticated;
grant execute on function public.found_stock_exchange(text, text) to authenticated;

-- JOIN — list on another nation's exchange. Relations >= 7 with the host, 2 AP.
create or replace function public.join_stock_exchange(p_exchange uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_host text; v_exname text; v_rel int; v_listed boolean; v_nname text;
  v_min_relation constant int := 7;   -- KNOB: relations (1–10) needed with the host to list on its exchange
begin
  v_p := public._begin_action(0); perform public._spend_action_point(v_p.id);   -- 2 AP total
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Treasury') then
    raise exception 'Only the Minister of Finance can join a stock exchange.'; end if;

  select host_nation, name into v_host, v_exname from public.stock_exchanges where id = p_exchange;
  if v_host is null then raise exception 'No such stock exchange.'; end if;
  if v_host = v_nation then raise exception 'That is your own exchange.'; end if;

  select (economy->'stock_market'->>'exchange_id') is not null into v_listed
    from public.nations where id = v_nation for update;
  if coalesce(v_listed, false) then raise exception 'Your nation already lists on an exchange — leave it first.'; end if;

  select value into v_rel from public.nation_relations
    where nation_a = least(v_nation, v_host) and nation_b = greatest(v_nation, v_host);
  if coalesce(v_rel, 5) < v_min_relation then
    raise exception 'Joining % needs relations of at least % with its host (currently %).', v_exname, v_min_relation, coalesce(v_rel, 5); end if;

  update public.nations set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{stock_market}',
    jsonb_build_object('exchange_id', p_exchange, 'role', 'member'), true) where id = v_nation;

  select name into v_nname from public.nations where id = v_nation;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'party',
      'The nation of ' || coalesce(v_nname, v_nation) || ' has joined the ' || v_exname || '.', public.current_game_date());
end $$;
revoke all on function public.join_stock_exchange(uuid) from public, anon, authenticated;
grant execute on function public.join_stock_exchange(uuid) to authenticated;

-- LEAVE — a member drops its listing (the host can't leave its own exchange — dissolving is a later feature). 1 AP.
create or replace function public.leave_stock_exchange()
returns void language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_ex uuid; v_role text; v_exname text; v_nname text;
begin
  v_p := public._begin_action(0);   -- 1 AP
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Treasury') then
    raise exception 'Only the Minister of Finance can leave a stock exchange.'; end if;

  select nullif(economy->'stock_market'->>'exchange_id', '')::uuid, economy->'stock_market'->>'role'
    into v_ex, v_role from public.nations where id = v_nation for update;
  if v_ex is null then raise exception 'Your nation does not list on any exchange.'; end if;
  if v_role = 'host' then raise exception 'You founded this exchange — you can''t leave it.'; end if;

  select name into v_exname from public.stock_exchanges where id = v_ex;
  update public.nations set economy = economy #- '{stock_market}' where id = v_nation;

  select name into v_nname from public.nations where id = v_nation;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'party',
      'The nation of ' || coalesce(v_nname, v_nation) || ' has left the ' || coalesce(v_exname, 'stock exchange') || '.', public.current_game_date());
end $$;
revoke all on function public.leave_stock_exchange() from public, anon, authenticated;
grant execute on function public.leave_stock_exchange() to authenticated;

-- Budget Balance upkeep now reads the membership ROLE: host 1% of GDP/yr, member 0.2%. Only change from 212.
create or replace function public._nation_budget_balance(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare
  v_sum numeric; v_rev numeric; v_corr numeric; v_unemp numeric; v_eff numeric; r record; v_yc numeric;
  v_gdp numeric; v_sx_role text;
  v_max_leakage constant numeric := 0.5;
  v_unemp_sens  constant numeric := 1.0;
begin
  v_sum := public._nation_policy_stat(p_nation, 'Budget Balance');
  v_rev  := public._nation_policy_stat(p_nation, 'Budget Balance', true);
  v_corr := least(100, greatest(0, coalesce(public._nation_live_stat(p_nation, 'Corruption'), 0)));
  select least(100, greatest(0, coalesce(public._to_num(economy->>'unemployment'), 0))),
         coalesce(gdp, 0),
         economy->'stock_market'->>'role'
    into v_unemp, v_gdp, v_sx_role from public.nations where id = p_nation;
  v_eff  := (1 - v_corr / 100.0 * v_max_leakage) * (1 - v_unemp / 100.0 * v_unemp_sens);
  v_sum  := v_sum - v_rev * (1 - v_eff);
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
  -- Stock-exchange upkeep: the host pays 1% of GDP/yr, a member 0.2%.
  if v_sx_role = 'host' then v_sum := v_sum - 0.01 * coalesce(v_gdp, 0);
  elsif v_sx_role = 'member' then v_sum := v_sum - 0.002 * coalesce(v_gdp, 0); end if;
  return v_sum;
end $$;
revoke all on function public._nation_budget_balance(text) from public, anon, authenticated;

notify pgrst, 'reload schema';
