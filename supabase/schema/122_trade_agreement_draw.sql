-- ===========================================================================
-- 122 · Trade Agreement draw — spend an active agreement at its locked price.
-- Depends on: 121 (trade_agreements), 114 (_settle_import, _party_holds_ministry,
-- _world_price), 117 (_trade_sanctioned), 40 (_begin_action). Run after 121.
--
-- An active agreement is a single POOL of qty_per_year × term_years units at the
-- locked unit_price. The buying nation's Trade Minister draws units from it (2 AP,
-- like an import) at that frozen price — no annual reset. The deal ends when the pool
-- is drained or the term elapses, whichever comes first. Money/stock/ledger go through
-- _settle_import with no tariff (the negotiated price is the whole price).
-- ===========================================================================

alter table public.trade_agreements add column if not exists drawn_units int not null default 0;

create or replace function public.draw_trade_agreement(p_id uuid, p_qty int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_a public.trade_agreements%rowtype; v_tick int;
  v_have numeric; v_sname text; v_cur text; v_total numeric; v_pool int; v_remaining int;
begin
  if coalesce(p_qty, 0) < 1 then raise exception 'Choose how much to draw.'; end if;
  v_p := public._begin_action(0);   -- lock caller's party, require >= 1 action
  if v_p.actions_remaining < 2 then raise exception 'Not enough actions left this turn (need 2).'; end if;
  if not public._party_holds_ministry(v_p.id, 'Trade') then
    raise exception 'Only the Minister of Trade can draw on a trade agreement.'; end if;

  select * into v_a from public.trade_agreements where id = p_id for update;
  if not found then raise exception 'No such trade agreement.'; end if;
  if v_a.buyer_nation <> v_p.nation_id then raise exception 'Only the buying nation draws on this agreement.'; end if;
  if v_a.status <> 'active' then raise exception 'This agreement isn''t active.'; end if;

  select current_tick into v_tick from public.game_state where id;
  if v_a.end_tick is not null and v_tick >= v_a.end_tick then
    update public.trade_agreements set status = 'expired' where id = p_id;
    raise exception 'This agreement has reached the end of its term.'; end if;

  v_pool := v_a.qty_per_year * v_a.term_years;
  v_remaining := v_pool - v_a.drawn_units;
  if p_qty > v_remaining then raise exception 'Only % unit(s) left on this agreement.', v_remaining; end if;

  -- A sanction (schema/117) bars trade even under a standing agreement.
  if public._trade_sanctioned(v_a.buyer_nation, v_a.seller_nation) then
    raise exception 'Trade with the supplier is barred by sanctions.'; end if;

  -- Lock the seller row so concurrent draws/imports can't oversell its stock.
  select name into v_sname from public.nations where id = v_a.seller_nation and not coalesce(dormant, false) for update;
  if not found then raise exception 'The supplier nation is no longer available.'; end if;
  v_have := coalesce((select (on_hand->>v_a.resource)::numeric from public.nations where id = v_a.seller_nation), 0);
  if v_have < p_qty then raise exception '% only has % % to supply right now.', v_sname, v_have, initcap(v_a.resource); end if;

  v_total := round(v_a.unit_price * p_qty, 1);
  perform public._settle_import(v_a.buyer_nation, v_a.seller_nation, v_a.resource, p_qty, v_total, 0);   -- no tariff on a deal
  update public.parties set actions_remaining = actions_remaining - 2 where id = v_p.id;
  -- Bank the draw; close the deal if this empties the pool (RHS reads the pre-update count).
  update public.trade_agreements
     set drawn_units = drawn_units + p_qty,
         status = case when drawn_units + p_qty >= v_pool then 'expired' else status end
   where id = p_id;

  v_cur := coalesce((select economy->>'currency' from public.nations where id = v_a.buyer_nation), '$');
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_a.buyer_nation, v_p.id, 'economy',
            'The Minister of Trade drew ' || p_qty || ' ' || initcap(v_a.resource) || ' from ' || v_sname
            || ' under their trade agreement for ' || v_cur || v_total || 'B.', public.current_game_date());

  return jsonb_build_object('qty', p_qty, 'total', v_total, 'remaining', v_remaining - p_qty,
    'actions', v_p.actions_remaining - 2);
end $$;
grant execute on function public.draw_trade_agreement(uuid, int) to authenticated;

notify pgrst, 'reload schema';
