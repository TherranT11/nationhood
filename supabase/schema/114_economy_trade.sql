-- ===========================================================================
-- 114 · Economy trade — world scarcity tiers, imports, Advance Society.
-- Depends on: 10 (nations), 20 (parties), 40 (_lock_party, events,
-- current_game_date), 60 (governments), 91 (_nation_stat_add), 113 (_economy_need,
-- _economy_period). Run after 113.
--
-- The world price of a resource = its base price × a scarcity multiplier, clamped
-- to [$1, $25]. The tier is DERIVED from world production ÷ world demand for that
-- resource, so it self-updates as the world changes — but only Food, Goods and
-- Services have a unit demand, so only those three move; Energy, Minerals and
-- Military have no consumption sink and read as Normal until one is added. Trade
-- moves ON-HAND, never production or demand, so a player's imports can't budge a
-- tier — only big events (which change production) can. ONE source here; util.js
-- mirrors the price math to render the page.
--
-- Imports: the head of government buys units from another nation at the world price,
-- paid from the Budget — the seller loses the units and banks the payment. Advance
-- Society: spend (Prosperity + 5) Goods for +1 Prosperity, once per year.
-- ===========================================================================

-- Base price (the anchor the tier multiplies). $B per unit.
create or replace function public._resource_base_price(p_resource text)
returns numeric language sql immutable as $$
  select case p_resource
    when 'food' then 3 when 'energy' then 5 when 'minerals' then 3
    when 'goods' then 5 when 'services' then 5 when 'military' then 15 else 0 end;
$$;

-- World unit demand for a resource = Σ non-dormant nations' demand-need. Only the
-- three unit-consumed resources have one; the rest return 0 (→ Normal tier).
create or replace function public._world_demand(p_resource text)
returns numeric language sql stable security definer set search_path = public as $$
  select case when p_resource in ('food', 'goods', 'services')
    then (select coalesce(sum(public._economy_need(n.id, p_resource)), 0)
            from public.nations n where not coalesce(n.dormant, false))
    else 0 end;
$$;
revoke all on function public._world_demand(text) from public, anon, authenticated;
grant execute on function public._world_demand(text) to authenticated;

-- World production for a resource = Σ non-dormant nations' production (NOT on-hand,
-- so trade never shifts it).
create or replace function public._world_production(p_resource text)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(coalesce((production->>p_resource)::numeric, 0)), 0)
    from public.nations where not coalesce(dormant, false);
$$;
revoke all on function public._world_production(text) from public, anon, authenticated;
grant execute on function public._world_production(text) to authenticated;

-- Scarcity tier from production ÷ demand. Undemanded resources (demand 0) sit at Normal.
create or replace function public._world_tier(p_resource text)
returns text language sql stable security definer set search_path = public as $$
  select case
    when public._world_demand(p_resource) <= 0 then 'normal'
    else (
      with r as (select public._world_production(p_resource) / nullif(public._world_demand(p_resource), 0) as ratio)
      select case
        when ratio < 0.5 then 'crisis'
        when ratio < 0.8 then 'scarce'
        when ratio < 1.1 then 'tight'
        when ratio < 1.6 then 'normal'
        else 'glut' end
      from r)
  end;
$$;
revoke all on function public._world_tier(text) from public, anon, authenticated;
grant execute on function public._world_tier(text) to authenticated;

-- Tier multiplier and the live world price (base × multiplier, clamped to [1, 25]).
create or replace function public._tier_mult(p_tier text)
returns numeric language sql immutable as $$
  select case p_tier
    when 'glut' then 0.7 when 'tight' then 1.3 when 'scarce' then 1.6 when 'crisis' then 2.0 else 1.0 end;
$$;
create or replace function public._world_price(p_resource text)
returns numeric language sql stable security definer set search_path = public as $$
  select greatest(1, least(25, round(public._resource_base_price(p_resource) * public._tier_mult(public._world_tier(p_resource)), 1)));
$$;
revoke all on function public._world_price(text) from public, anon, authenticated;
grant execute on function public._world_price(text) to authenticated;

-- Does this party hold a given cabinet portfolio in its nation's active government?
-- True if a politician of the party is either explicitly appointed to the ministry
-- (cabinet_appointments) OR holds it via a fulfilled ministry promise (a DONE
-- government_agenda 'ministry' row) not since overridden by an explicit appointment —
-- the same explicit-wins-else-promise rule _politician_is_minister uses, keyed by
-- party + ministry. ONE source for "is my party the Minister of X".
create or replace function public._party_holds_ministry(p_party uuid, p_ministry text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.cabinet_appointments ca
      join public.governments g on g.id = ca.government_id and g.status = 'active'
      join public.politicians p on p.id = ca.politician_id
     where ca.ministry = p_ministry and p.party_id = p_party
  ) or exists (
    select 1 from public.government_agenda ga
      join public.governments g on g.id = ga.government_id and g.status = 'active'
      join public.politicians p on p.id = nullif(ga.params->>'minister_id', '')::uuid
     where ga.type = 'ministry' and ga.status = 'done'
       and ga.params->>'ministry' = p_ministry
       and p.party_id = p_party
       and not exists (select 1 from public.cabinet_appointments ca2
                         where ca2.government_id = g.id and ca2.ministry = ga.params->>'ministry')
  );
$$;
revoke all on function public._party_holds_ministry(uuid, text) from public, anon, authenticated;

-- Does the SIGNED-IN player's party hold the Trade portfolio? The client gate for the
-- import action (home Trade bar + Economy-page Import buttons); the server stays
-- authoritative in economy_import. Reuses _party_holds_ministry — one source.
create or replace function public.is_trade_minister()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select public._party_holds_ministry(id, 'Trade') from public.parties where user_id = auth.uid()), false);
$$;
grant execute on function public.is_trade_minister() to authenticated;

-- Settle a cross-border purchase: move the goods seller→buyer, the money buyer→seller, and log
-- the flow. ONE source for the money/stock side of a trade — economy_import (world price + tariff)
-- and draw_trade_agreement (schema/122, locked price, no tariff) both call it. p_duty is the slice
-- the buyer withholds as customs (0 for an agreement draw); the seller receives total − duty, and the
-- buyer pays that same net from Budget (debt-financed via _nation_budget_add). INTERNAL.
create or replace function public._settle_import(p_buyer text, p_seller text, p_resource text, p_qty int, p_total numeric, p_duty numeric)
returns void language plpgsql security definer set search_path = public as $$
declare v_net numeric := p_total - coalesce(p_duty, 0);
begin
  perform public._nation_stat_add(p_seller, 'on_hand', p_resource, -p_qty, 0, null);
  perform public._nation_stat_add(p_buyer,  'on_hand', p_resource,  p_qty, 0, null);
  perform public._nation_budget_add(p_buyer, coalesce(p_duty, 0) - p_total);   -- buyer pays net, debt-financed
  perform public._nation_stat_add(p_seller, 'economy', 'budget', v_net, 0, null);   -- seller receives net of duty
  perform public._record_trade_flow(p_seller, p_buyer, p_resource, v_net);          -- World Trade ledger (schema/116)
end $$;
revoke all on function public._settle_import(text, text, text, int, numeric, numeric) from public, anon, authenticated;

-- Import units of a resource from another nation at the world price. MINISTER OF TRADE
-- gated — only a party that holds the Trade portfolio may import — and costs 2 party
-- actions, spent on confirm. The seller must hold the units and the buyer's Budget must
-- cover the bill; the units move seller→buyer on-hand and the payment moves buyer→seller
-- Budget. Price is recomputed server-side (the client figure is only a preview).
create or replace function public.economy_import(p_seller text, p_resource text, p_qty int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_buyer text; v_tp jsonb;
  v_world numeric; v_mult numeric; v_tariff numeric; v_total numeric; v_duty numeric; v_net numeric;
  v_have numeric; v_sname text; v_cur text;
begin
  if p_resource not in ('energy', 'food', 'minerals', 'goods', 'services', 'military') then
    raise exception 'Unknown resource.'; end if;
  if coalesce(p_qty, 0) < 1 then raise exception 'Choose how much to import.'; end if;

  v_p := public._begin_action(0);   -- lock caller's party, require >= 1 action
  if v_p.actions_remaining < 2 then raise exception 'Not enough actions left this turn (need 2).'; end if;
  v_buyer := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Trade') then
    raise exception 'Only the Minister of Trade can import.'; end if;
  if p_seller = v_buyer then raise exception 'You can''t import from your own nation.'; end if;

  -- Trade policy (schema/115): the in-force rung's modifiers for the importing nation.
  v_tp := public._nation_trade_policy(v_buyer);
  if coalesce((v_tp->>'blocked')::boolean, false) then
    raise exception 'Imports are closed under your nation''s trade policy (%).', coalesce(v_tp->>'name', 'Autarky'); end if;

  -- Lock the seller row so two concurrent imports from the same nation can't both pass the
  -- stock check below and oversell it (the buyer's party is locked by _begin_action, not the seller).
  select name, coalesce(economy->>'currency', '$') into v_sname, v_cur
    from public.nations where id = p_seller and not coalesce(dormant, false) for update;
  if not found then raise exception 'No such trading partner.'; end if;

  -- Sanctions (schema/117) bar trade both ways, over any trade policy.
  if public._trade_sanctioned(v_buyer, p_seller) then
    raise exception 'Trade with % is barred by sanctions.', v_sname; end if;

  v_have := coalesce((select (on_hand->>p_resource)::numeric from public.nations where id = p_seller), 0);
  if v_have < p_qty then
    raise exception '% only has % % to sell.', v_sname, v_have, initcap(p_resource); end if;

  -- Price stack: world rate × the trade-policy multiplier = the buyer's sticker. The tariff %
  -- is withheld from the seller's proceeds and banked as the buyer's customs revenue (conserved:
  -- buyer net = sticker − duty = what the seller receives). Free trade can run mult < 1.
  v_world  := public._world_price(p_resource);
  v_mult   := coalesce((v_tp->>'importMult')::numeric, 1);
  v_tariff := greatest(0, least(100, coalesce((v_tp->>'tariff')::numeric, 0))) / 100.0;
  v_total  := round(v_world * v_mult * p_qty, 1);   -- sticker the buyer pays at the border
  v_duty   := round(v_total * v_tariff, 1);         -- customs revenue withheld from the seller
  v_net    := v_total - v_duty;                      -- net cost to the buyer
  v_cur    := coalesce((select economy->>'currency' from public.nations where id = v_buyer), '$');

  perform public._settle_import(v_buyer, p_seller, p_resource, p_qty, v_total, v_duty);           -- goods + money + ledger (one source)
  update public.parties set actions_remaining = actions_remaining - 2 where id = v_p.id;          -- 2 AP on confirm

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_buyer, v_p.id, 'economy',
            'The Minister of Trade imported ' || p_qty || ' ' || initcap(p_resource) || ' from ' || v_sname
              || ' for ' || v_cur || v_net || 'B'
              || (case when v_duty > 0 then ' (incl. ' || v_cur || v_duty || 'B tariff)' else '' end) || '.',
            public.current_game_date());

  return jsonb_build_object('resource', p_resource, 'qty', p_qty, 'world', v_world, 'total', v_total,
    'duty', v_duty, 'net', v_net, 'actions', v_p.actions_remaining - 2);
end $$;
grant execute on function public.economy_import(text, text, int) to authenticated;

-- Advance Society: invest in living standards for +1 Prosperity. Costs (Prosperity + 5)
-- Goods from on-hand — the richer you are, the dearer it gets — and may be done once per
-- year. Head-of-government gated. The once-a-year lock is a year stamp that auto-expires.
alter table public.nations add column if not exists advanced_year int;

create or replace function public.economy_advance()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_gov public.governments%rowtype; v_n public.nations%rowtype;
  v_period int; v_cost numeric; v_have numeric; v_pros numeric;
begin
  v_p := public._lock_party();
  select * into v_gov from public.governments where nation_id = v_p.nation_id and status = 'active';
  if not found then raise exception 'There is no sitting government.'; end if;
  if v_gov.formateur_party_id is distinct from v_p.id then
    raise exception 'Only the head of government can advance society.'; end if;

  select * into v_n from public.nations where id = v_p.nation_id;
  v_period := public._economy_period((select current_tick from public.game_state where id));
  if coalesce(v_n.advanced_year, 0) = v_period then
    raise exception 'Society has already been advanced this year.'; end if;

  v_pros := coalesce((v_n.stats->>'prosperity')::numeric, 0);
  v_cost := v_pros + 5;
  v_have := coalesce((v_n.on_hand->>'goods')::numeric, 0);
  if v_have < v_cost then
    raise exception 'Not enough Goods to advance society (need %, have %).', v_cost, v_have; end if;

  perform public._nation_stat_add(v_p.nation_id, 'on_hand', 'goods', -v_cost, 0, null);
  perform public._nation_stat_add(v_p.nation_id, 'stats', 'prosperity', 1, 1, 20);
  update public.nations set advanced_year = v_period where id = v_p.nation_id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'economy', 'The government invested in society — Prosperity +1.', public.current_game_date());

  return jsonb_build_object('cost', v_cost, 'prosperity', least(20, v_pros + 1));
end $$;
grant execute on function public.economy_advance() to authenticated;

notify pgrst, 'reload schema';
