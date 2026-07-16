-- ===========================================================================
-- 261 · Arms Exports slice 2 — gate Military imports by the SELLER's policy tier.
--
-- Slice 1 (258) seeded the 5-tier Arms Exports policy. This slice enforces it at the one
-- import path (economy_import, schema/114): whether a buyer may import a nation's Military,
-- and at what price, is governed by that SELLER's Arms Exports tier.
--
--   T0 No Exports            — nobody may import its Military.
--   T1 Allied Sales Only     — only a buyer at Relations 7+ OR in a shared active Security org.
--   T2 Licensed Global Sales — direct import blocked; the buyer must REQUEST (the Minister of Trade
--                              approves/denies — the request flow lands in slice 3).
--   T3 Anyone Who Pays       — open, 20% off.
--   T4 Military Industrial…  — open, full price.
--
-- Legacy safety: if the Arms Exports policy row isn't deployed (older DBs), the tier reads NULL
-- and Military stays freely importable as before — the gate only bites once 258 is applied.
--
-- Depends on: 114 (economy_import), 92 (_nation_policy_option), 142 (_relation_value),
-- 186 (organizations/members), 258 (Arms Exports policy). Apply after 258. Idempotent.
-- ===========================================================================

set check_function_bodies = off;

-- A nation's current Arms Exports tier (0..4), or NULL if the policy isn't deployed.
create or replace function public._nation_arms_export_tier(p_nation text)
returns int language sql stable security definer set search_path = public as $$
  select public._nation_policy_option(p_nation, pol.id)
    from public.policies pol
   where pol.definition->>'name' = 'Arms Exports'
   limit 1;
$$;
revoke all on function public._nation_arms_export_tier(text) from public, anon, authenticated;

-- May p_buyer import p_seller's Military, and at what price multiplier? Returns
--   { allowed:true,  mult:<n> }                 — permitted (mult 0.8 at T4 discount, else 1)
--   { allowed:false, reason:<text> }            — refused; reason is suffixed after the seller name
--   { allowed:false, request:true, reason:… }   — refused for direct import, but a request is the path (T2)
-- ONE source for the arms-export rule; economy_import (here) and the request flow (slice 3) both read it.
create or replace function public._arms_export_gate(p_seller text, p_buyer text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_tier int; v_rel int; v_shared boolean;
begin
  v_tier := public._nation_arms_export_tier(p_seller);
  if v_tier is null then
    return jsonb_build_object('allowed', true, 'mult', 1);            -- policy not deployed: legacy free arms trade
  elsif v_tier <= 0 then
    return jsonb_build_object('allowed', false, 'reason', 'does not export its military abroad');
  elsif v_tier = 1 then
    v_rel := public._relation_value(p_seller, p_buyer);
    v_shared := exists (
      select 1 from public.organization_members ms
        join public.organization_members mb on mb.org_id = ms.org_id and mb.nation_id = p_buyer
        join public.organizations o on o.id = ms.org_id
       where ms.nation_id = p_seller and o.org_type = 'Security' and o.status = 'active');
    if v_rel >= 7 or v_shared then
      return jsonb_build_object('allowed', true, 'mult', 1);
    end if;
    return jsonb_build_object('allowed', false, 'reason', 'sells military only to allies (Relations 7+ or a shared Security organization)');
  elsif v_tier = 2 then
    return jsonb_build_object('allowed', false, 'request', true, 'reason', 'sells military only by approved request — send an import request');
  elsif v_tier = 3 then
    return jsonb_build_object('allowed', true, 'mult', 0.8);          -- Anyone Who Pays: 20% off
  else
    return jsonb_build_object('allowed', true, 'mult', 1);            -- Military Industrial Complex
  end if;
end $$;
revoke all on function public._arms_export_gate(text, text) from public, anon, authenticated;

-- Redefine economy_import (body verbatim from schema/114) with the Military arms-export gate: when the
-- resource is Military, the SELLER's Arms Exports tier decides whether the sale is allowed and applies the
-- T4 discount. Everything else is unchanged.
create or replace function public.economy_import(p_seller text, p_resource text, p_qty int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_buyer text; v_tp jsonb;
  v_world numeric; v_mult numeric; v_tariff numeric; v_total numeric; v_duty numeric; v_net numeric;
  v_have numeric; v_sname text; v_cur text; v_debt numeric; v_jp numeric;
  v_arms jsonb; v_arms_mult numeric := 1;
begin
  if p_resource not in ('energy', 'food', 'minerals', 'goods', 'services', 'military') then
    raise exception 'Unknown resource.'; end if;
  if coalesce(p_qty, 0) < 1 then raise exception 'Choose how much to import.'; end if;

  v_p := public._begin_action(0);   -- lock caller's party + spend 1 Action Point
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

  -- Arms export gate (schema/261): Military is sold abroad only per the SELLER's Arms Exports policy.
  if p_resource = 'military' then
    v_arms := public._arms_export_gate(p_seller, v_buyer);
    if not coalesce((v_arms->>'allowed')::boolean, false) then
      raise exception '% %.', v_sname, v_arms->>'reason'; end if;
    v_arms_mult := coalesce((v_arms->>'mult')::numeric, 1);   -- T4 "Anyone Who Pays" is 20% off
  end if;

  v_have := coalesce((select (on_hand->>p_resource)::numeric from public.nations where id = p_seller), 0);
  if v_have < p_qty then
    raise exception '% only has % % to sell.', v_sname, v_have, initcap(p_resource); end if;

  -- Price stack: world rate × the trade-policy multiplier = the buyer's sticker. The tariff %
  -- is withheld from the seller's proceeds and banked as the buyer's customs revenue (conserved:
  -- buyer net = sticker − duty = what the seller receives). Free trade can run mult < 1.
  v_world  := public._world_price(p_resource);
  v_mult   := coalesce((v_tp->>'importMult')::numeric, 1);
  v_tariff := greatest(0, least(100, coalesce((v_tp->>'tariff')::numeric, 0))) / 100.0;
  -- International-organization pricing (schema/197) overrides the world rate for the org's resource. A
  -- FELLOW member gets Emergency Reserves — at cost: base price, no scarcity markup, no tariff. Otherwise
  -- Joint Pricing (if the seller's org has it enacted) is the price outsiders pay. Reserves beats Pricing.
  if public._org_reserves_between(v_buyer, p_seller, p_resource) then
    v_world := public._resource_base_price(p_resource); v_mult := 1; v_tariff := 0;
  else
    v_jp := public._org_joint_price(p_seller, p_resource);
    if v_jp is not null then v_world := v_jp; end if;
  end if;
  v_total  := round(v_world * v_mult * v_arms_mult * p_qty, 1);   -- sticker the buyer pays (incl. any arms discount)
  v_duty   := round(v_total * v_tariff, 1);         -- customs revenue withheld from the seller
  v_net    := v_total - v_duty;                      -- net cost to the buyer
  v_cur    := coalesce((select economy->>'currency' from public.nations where id = v_buyer), '$');

  perform public._settle_import(v_buyer, p_seller, p_resource, p_qty, v_total, v_duty);           -- goods + money + ledger (one source)

  -- Resulting Public Debt (imports are debt-financed via _nation_budget_add) — recorded on the event so
  -- it appears in the Budget page's history + sparkline (debt_after), and noted in the line itself.
  select coalesce((economy->>'debt')::numeric, 0) into v_debt from public.nations where id = v_buyer;
  insert into public.events (nation_id, party_id, kind, body, game_date, tone, debt_after)
    values (v_buyer, v_p.id, 'economy',
            'The Minister of Trade imported ' || p_qty || ' ' || initcap(p_resource) || ' from ' || v_sname
              || ' for ' || v_cur || v_net || 'B'
              || (case when v_duty > 0 then ' (incl. ' || v_cur || v_duty || 'B tariff)' else '' end)
              || ', debt now ' || v_cur || trim_scale(v_debt) || 'B.',
            public.current_game_date(), 'neg', v_debt);

  return jsonb_build_object('resource', p_resource, 'qty', p_qty, 'world', v_world, 'total', v_total,
    'duty', v_duty, 'net', v_net, 'actions', v_p.influence);
end $$;
grant execute on function public.economy_import(text, text, int) to authenticated;

notify pgrst, 'reload schema';
