-- ===========================================================================
-- 262 · Arms Exports slice 3 — the Tier-2 (Licensed Global Sales) request/approval flow.
--
-- At T2 a nation exports Military only by approved request: any nation's Minister of Trade may
-- REQUEST to import, and the SELLER's Minister of Trade approves or denies each one. The request
-- shows as a banner atop the seller's Events page (client, slice-3 UI).
--
--   request_arms_import(seller, qty)  — buyer's Minister of Trade, 1 AP. Seller must be at T2, not
--       sanctioned, no request already pending buyer→seller. Files a 'pending' row + notifies the seller.
--   decide_arms_import(request, approve) — seller's Minister of Trade (free response).
--       Approve → the sale executes at the world price (via _settle_import, the one trade-settlement
--       source; no tariff — a bilateral licensed sale) and both nations are notified. Deny → closed.
--
-- Reuses the T2 branch of _arms_export_gate (schema/261): direct economy_import stays blocked at T2, so
-- this flow is the only way T2 Military moves. Depends on: 114 (_settle_import, _world_price), 40
-- (_begin_action, _lock_party, events), 261 (_nation_arms_export_tier). Apply after 261. Idempotent.
-- ===========================================================================

create table if not exists public.arms_import_requests (
  id            uuid primary key default gen_random_uuid(),
  seller_nation text not null references public.nations (id) on delete cascade,
  buyer_nation  text not null references public.nations (id) on delete cascade,
  qty           int  not null,
  status        text not null default 'pending',   -- 'pending' | 'approved' | 'denied'
  requested_by  uuid references public.parties (id) on delete set null,
  requested_tick int,
  decided_by    uuid references public.parties (id) on delete set null,
  decided_tick  int,
  created_at    timestamptz not null default now()
);
create index if not exists arms_import_requests_seller_idx on public.arms_import_requests (seller_nation, status);
create index if not exists arms_import_requests_buyer_idx  on public.arms_import_requests (buyer_nation, status);

-- RLS: readable by parties on EITHER side of the request (buyer sees their own; seller sees incoming).
-- Writes go only through the security-definer RPCs below — no client insert/update/delete policy.
alter table public.arms_import_requests enable row level security;
drop policy if exists "arms_req_select_parties" on public.arms_import_requests;
create policy "arms_req_select_parties" on public.arms_import_requests for select using (
  exists (select 1 from public.parties p
           where p.user_id = auth.uid() and p.nation_id in (seller_nation, buyer_nation))
);

-- Buyer's Minister of Trade files a request to import p_qty Military from a T2 seller. 1 Action Point.
create or replace function public.request_arms_import(p_seller text, p_qty int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_buyer text; v_tier int; v_sname text; v_bname text; v_tick int; v_id uuid;
begin
  if coalesce(p_qty, 0) < 1 then raise exception 'Choose how much Military to request.'; end if;
  v_p := public._begin_action(0);   -- lock buyer's party + spend 1 Action Point
  v_buyer := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Trade') then
    raise exception 'Only the Minister of Trade can request arms imports.'; end if;
  if p_seller = v_buyer then raise exception 'You can''t request from your own nation.'; end if;

  select name into v_sname from public.nations where id = p_seller and not coalesce(dormant, false) for update;
  if not found then raise exception 'No such trading partner.'; end if;
  if public._trade_sanctioned(v_buyer, p_seller) then
    raise exception 'Trade with % is barred by sanctions.', v_sname; end if;

  v_tier := public._nation_arms_export_tier(p_seller);
  if v_tier is distinct from 2 then
    raise exception '% is not accepting licensed arms requests.', v_sname; end if;
  if exists (select 1 from public.arms_import_requests
              where seller_nation = p_seller and buyer_nation = v_buyer and status = 'pending') then
    raise exception 'You already have a pending arms request with %.', v_sname; end if;

  select current_tick into v_tick from public.game_state where id;
  select name into v_bname from public.nations where id = v_buyer;
  insert into public.arms_import_requests (seller_nation, buyer_nation, qty, requested_by, requested_tick)
    values (p_seller, v_buyer, p_qty, v_p.id, v_tick) returning id into v_id;

  -- Notify the SELLER (its Minister of Trade sees the banner + decides).
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (p_seller, null, 'economy',
            v_bname || ' requests to import ' || p_qty || ' Military. The Minister of Trade may approve or deny.',
            public.current_game_date());

  return jsonb_build_object('id', v_id, 'status', 'pending', 'actions', v_p.influence);
end $$;
grant execute on function public.request_arms_import(text, int) to authenticated;

-- Seller's Minister of Trade approves (the sale executes at world price) or denies a pending request.
create or replace function public.decide_arms_import(p_request uuid, p_approve boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_r public.arms_import_requests%rowtype;
  v_tick int; v_have numeric; v_world numeric; v_total numeric; v_debt numeric; v_cur text; v_bname text; v_sname text;
begin
  v_p := public._lock_party();   -- seller's party; deciding a request is a free response (no AP)
  select * into v_r from public.arms_import_requests where id = p_request for update;
  if not found then raise exception 'That request no longer exists.'; end if;
  if v_r.status <> 'pending' then raise exception 'That request has already been decided.'; end if;
  if v_p.nation_id <> v_r.seller_nation then raise exception 'Only the selling nation can decide this request.'; end if;
  if not public._party_holds_ministry(v_p.id, 'Trade') then
    raise exception 'Only the Minister of Trade can decide arms requests.'; end if;

  select current_tick into v_tick from public.game_state where id;
  select name into v_bname from public.nations where id = v_r.buyer_nation;
  select name into v_sname from public.nations where id = v_r.seller_nation;

  if not p_approve then
    update public.arms_import_requests set status = 'denied', decided_by = v_p.id, decided_tick = v_tick where id = p_request;
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_r.buyer_nation, null, 'economy',
              v_sname || ' denied your request to import ' || v_r.qty || ' Military.', public.current_game_date());
    return jsonb_build_object('status', 'denied');
  end if;

  -- Approve: the seller must still hold the stock; sanctions can't have since intervened.
  if public._trade_sanctioned(v_r.buyer_nation, v_r.seller_nation) then
    raise exception 'Trade with % is barred by sanctions.', v_bname; end if;
  select coalesce((on_hand->>'military')::numeric, 0) into v_have from public.nations where id = v_r.seller_nation for update;
  if v_have < v_r.qty then
    raise exception 'You no longer have % Military to sell (have %).', v_r.qty, v_have; end if;

  v_world := public._world_price('military');
  v_total := round(v_world * v_r.qty, 1);
  perform public._settle_import(v_r.buyer_nation, v_r.seller_nation, 'military', v_r.qty, v_total, 0);  -- one settlement source; no tariff
  update public.arms_import_requests set status = 'approved', decided_by = v_p.id, decided_tick = v_tick where id = p_request;

  -- Notify both sides. Buyer's line carries its resulting debt (Budget-page ledger).
  v_cur  := coalesce((select economy->>'currency' from public.nations where id = v_r.buyer_nation), '$');
  select coalesce((economy->>'debt')::numeric, 0) into v_debt from public.nations where id = v_r.buyer_nation;
  insert into public.events (nation_id, party_id, kind, body, game_date, tone, debt_after)
    values (v_r.buyer_nation, null, 'economy',
            v_sname || ' approved your request — imported ' || v_r.qty || ' Military for ' || v_cur || v_total || 'B, debt now '
              || v_cur || trim_scale(v_debt) || 'B.', public.current_game_date(), 'neg', v_debt);
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_r.seller_nation, v_p.id, 'economy',
            'The Minister of Trade approved ' || v_bname || '''s request, selling ' || v_r.qty || ' Military for ' || v_cur || v_total || 'B.',
            public.current_game_date());

  return jsonb_build_object('status', 'approved', 'qty', v_r.qty, 'total', v_total);
end $$;
grant execute on function public.decide_arms_import(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
