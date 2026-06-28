-- ===========================================================================
-- 121 · Trade Agreements — the Minister of Trade's second action: a negotiated,
-- long-term supply deal between two nations' trade ministers.
-- Depends on: 10 (nations), 20 (parties), 40 (_lock_party/_begin_action/current_game_date),
-- 114 (_party_holds_ministry, _world_price). Run after 116.
--
-- A buyer's Trade Minister proposes a recurring purchase from a seller nation
-- (resource, units/year, term in years, a volume discount). BOTH ministers must
-- approve the package; any term edit (buyer-only in v1) clears both approvals. The
-- buyer then commits (3 actions), which locks the unit price at TODAY's world rate
-- less the discount and runs the agreement for term_years. Drawing on it (capped at
-- the annual volume, at the locked price) is a later slice — this file is the
-- negotiation lifecycle + the per-deal message channel. Writes are RPC-only.
-- ===========================================================================

create table if not exists public.trade_agreements (
  id             uuid primary key default gen_random_uuid(),
  buyer_nation   text not null references public.nations (id) on delete cascade,   -- proposer (commits to buy)
  seller_nation  text not null references public.nations (id) on delete cascade,   -- supplier
  buyer_party_id uuid not null references public.parties (id) on delete cascade,   -- proposing Trade Minister's party
  seller_party_id uuid references public.parties (id) on delete set null,          -- partner who approved (stamped on approve)
  resource       text not null,
  qty_per_year   int  not null,
  term_years     int  not null,
  discount_pct   int  not null,
  unit_price     numeric,                                  -- locked at commit (world rate × (1 − discount))
  status         text not null default 'negotiating',      -- negotiating | active | cancelled | expired
  buyer_approved  boolean not null default false,
  seller_approved boolean not null default false,
  start_tick     int,
  end_tick       int,
  created_at     timestamptz not null default now()
);
create index if not exists trade_agreements_buyer_idx  on public.trade_agreements (buyer_nation);
create index if not exists trade_agreements_seller_idx on public.trade_agreements (seller_nation);

create table if not exists public.trade_agreement_messages (
  id              uuid primary key default gen_random_uuid(),
  agreement_id    uuid not null references public.trade_agreements (id) on delete cascade,
  sender_party_id uuid not null references public.parties (id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index if not exists trade_agreement_messages_idx on public.trade_agreement_messages (agreement_id);

alter table public.trade_agreements enable row level security;
alter table public.trade_agreement_messages enable row level security;
-- Readable only by a player whose party sits in one of the two nations at the table.
drop policy if exists "ta_select_party" on public.trade_agreements;
create policy "ta_select_party" on public.trade_agreements for select using (
  exists (select 1 from public.parties p where p.user_id = auth.uid()
            and p.nation_id in (buyer_nation, seller_nation)));
drop policy if exists "tam_select_party" on public.trade_agreement_messages;
create policy "tam_select_party" on public.trade_agreement_messages for select using (
  exists (select 1 from public.trade_agreements ta
            join public.parties p on p.nation_id in (ta.buyer_nation, ta.seller_nation)
           where ta.id = agreement_id and p.user_id = auth.uid()));
-- No write policies: the security-definer RPCs below are the only way in.

-- The caller's party, locked, confirmed to be a Trade Minister. ONE source for the gate
-- every trade-agreement RPC shares. INTERNAL.
create or replace function public._trade_minister_party()
returns public.parties language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype;
begin
  v_p := public._lock_party();
  if not public._party_holds_ministry(v_p.id, 'Trade') then
    raise exception 'Only the Minister of Trade can negotiate trade agreements.'; end if;
  return v_p;
end $$;
revoke all on function public._trade_minister_party() from public, anon, authenticated;

-- Validate a deal's terms (resource + bounds). ONE source for the limits, shared by propose
-- and update so the two can't drift. Raises on anything out of range. INTERNAL.
create or replace function public._validate_trade_terms(p_resource text, p_qty int, p_years int, p_discount int)
returns void language plpgsql immutable as $$
begin
  if not (p_resource = any(array['energy','food','minerals','goods','services','military'])) then
    raise exception 'Unknown resource: %', p_resource; end if;
  if p_qty   < 1 or p_qty   > 8  then raise exception 'Annual volume must be 1–8 units.'; end if;
  if p_years < 1 or p_years > 10 then raise exception 'The term must be 1–10 years.'; end if;
  if p_discount < 0 or p_discount > 50 then raise exception 'The discount must be 0–50%%.'; end if;
end $$;
revoke all on function public._validate_trade_terms(text, int, int, int) from public, anon, authenticated;

-- Propose a deal to a seller nation. Free to open (the 3 actions are spent on commit).
create or replace function public.propose_trade_agreement(
  p_seller_nation text, p_resource text, p_qty int, p_years int, p_discount int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_id uuid; v_sname text;
begin
  v_p := public._trade_minister_party();
  if p_seller_nation = v_p.nation_id then raise exception 'You can''t strike a trade agreement with your own nation.'; end if;
  perform public._validate_trade_terms(p_resource, p_qty, p_years, p_discount);
  select name into v_sname from public.nations where id = p_seller_nation and not coalesce(dormant, false);
  if not found then raise exception 'No such trading partner.'; end if;

  insert into public.trade_agreements (buyer_nation, seller_nation, buyer_party_id,
      resource, qty_per_year, term_years, discount_pct, buyer_approved)
    values (v_p.nation_id, p_seller_nation, v_p.id, p_resource, p_qty, p_years, p_discount, true)  -- proposer pre-approves
    returning id into v_id;
  return jsonb_build_object('id', v_id, 'seller', v_sname);
end $$;
grant execute on function public.propose_trade_agreement(text, text, int, int, int) to authenticated;

-- Edit the terms (buyer/proposer only, while negotiating). Any change clears both approvals,
-- re-seeding only the buyer's own — both sides must re-sign the new package.
create or replace function public.update_trade_agreement(
  p_id uuid, p_resource text, p_qty int, p_years int, p_discount int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_a public.trade_agreements%rowtype;
begin
  v_p := public._trade_minister_party();
  select * into v_a from public.trade_agreements where id = p_id for update;
  if not found then raise exception 'No such trade agreement.'; end if;
  if v_a.buyer_party_id <> v_p.id then raise exception 'Only the proposing nation can edit the terms.'; end if;
  if v_a.status <> 'negotiating' then raise exception 'This agreement is no longer open for changes.'; end if;
  perform public._validate_trade_terms(p_resource, p_qty, p_years, p_discount);

  update public.trade_agreements
     set resource = p_resource, qty_per_year = p_qty, term_years = p_years, discount_pct = p_discount,
         buyer_approved = true, seller_approved = false
   where id = p_id;
  return jsonb_build_object('id', p_id);
end $$;
grant execute on function public.update_trade_agreement(uuid, text, int, int, int) to authenticated;

-- Approve / un-approve from whichever side the caller's nation sits on (while negotiating).
create or replace function public.set_trade_agreement_approval(p_id uuid, p_approved boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_a public.trade_agreements%rowtype; v_side text;
begin
  v_p := public._trade_minister_party();
  select * into v_a from public.trade_agreements where id = p_id for update;
  if not found then raise exception 'No such trade agreement.'; end if;
  if v_a.status <> 'negotiating' then raise exception 'This agreement is no longer open.'; end if;

  if v_p.nation_id = v_a.buyer_nation then
    v_side := 'buyer'; update public.trade_agreements set buyer_approved = p_approved where id = p_id;
  elsif v_p.nation_id = v_a.seller_nation then
    v_side := 'seller'; update public.trade_agreements set seller_approved = p_approved,
      seller_party_id = case when p_approved then v_p.id else seller_party_id end where id = p_id;
  else
    raise exception 'Your nation isn''t party to this agreement.';
  end if;
  return jsonb_build_object('id', p_id, 'side', v_side, 'approved', p_approved);
end $$;
grant execute on function public.set_trade_agreement_approval(uuid, boolean) to authenticated;

-- Commit (buyer/proposer only): both sides must have approved. Spends 3 actions, locks the unit
-- price at today's world rate less the discount, and runs the deal for term_years (12 ticks/yr).
create or replace function public.commit_trade_agreement(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_a public.trade_agreements%rowtype; v_tick int;
  v_unit numeric; v_bname text; v_sname text;
begin
  v_p := public._begin_action(0);   -- requires >= 1 action; 3 checked below
  if not public._party_holds_ministry(v_p.id, 'Trade') then
    raise exception 'Only the Minister of Trade can commit a trade agreement.'; end if;
  if v_p.actions_remaining < 3 then raise exception 'Not enough actions left this turn (need 3).'; end if;
  select * into v_a from public.trade_agreements where id = p_id for update;
  if not found then raise exception 'No such trade agreement.'; end if;
  if v_a.buyer_party_id <> v_p.id then raise exception 'Only the proposing nation commits the agreement.'; end if;
  if v_a.status <> 'negotiating' then raise exception 'This agreement is no longer open.'; end if;
  if not (v_a.buyer_approved and v_a.seller_approved) then
    raise exception 'Both trade ministers must approve before you can commit.'; end if;

  select current_tick into v_tick from public.game_state where id;
  v_unit := round(public._world_price(v_a.resource) * (1 - v_a.discount_pct / 100.0), 2);   -- locked for the term

  update public.trade_agreements
     set status = 'active', unit_price = v_unit, start_tick = v_tick, end_tick = v_tick + v_a.term_years * 12
   where id = p_id;
  update public.parties set actions_remaining = actions_remaining - 3 where id = v_p.id;

  select name into v_bname from public.nations where id = v_a.buyer_nation;
  select name into v_sname from public.nations where id = v_a.seller_nation;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    select n, v_p.id, 'economy',
           coalesce(v_bname, v_a.buyer_nation) || ' and ' || coalesce(v_sname, v_a.seller_nation)
           || ' have signed a ' || v_a.term_years || '-year trade agreement: ' || v_a.qty_per_year || ' '
           || v_a.resource || '/yr at −' || v_a.discount_pct || '%.', public.current_game_date()
      from (values (v_a.buyer_nation), (v_a.seller_nation)) as t(n);
  return jsonb_build_object('id', p_id, 'unit_price', v_unit, 'actions', v_p.actions_remaining - 3);
end $$;
grant execute on function public.commit_trade_agreement(uuid) to authenticated;

-- Cancel (either side's Trade Minister). Drops a negotiating or active deal out of force.
create or replace function public.cancel_trade_agreement(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_a public.trade_agreements%rowtype;
begin
  v_p := public._trade_minister_party();
  select * into v_a from public.trade_agreements where id = p_id for update;
  if not found then raise exception 'No such trade agreement.'; end if;
  if v_p.nation_id not in (v_a.buyer_nation, v_a.seller_nation) then
    raise exception 'Your nation isn''t party to this agreement.'; end if;
  if v_a.status not in ('negotiating', 'active') then raise exception 'This agreement is already closed.'; end if;
  update public.trade_agreements set status = 'cancelled' where id = p_id;
  return jsonb_build_object('id', p_id, 'status', 'cancelled');
end $$;
grant execute on function public.cancel_trade_agreement(uuid) to authenticated;

-- Post a message to the per-deal channel (either side's Trade Minister).
create or replace function public.send_trade_agreement_message(p_id uuid, p_body text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_a public.trade_agreements%rowtype; v_msg text; v_mid uuid;
begin
  v_p := public._trade_minister_party();
  v_msg := btrim(coalesce(p_body, ''));
  if v_msg = '' then raise exception 'Write a message first.'; end if;
  if length(v_msg) > 500 then raise exception 'Keep it under 500 characters.'; end if;
  select * into v_a from public.trade_agreements where id = p_id;
  if not found then raise exception 'No such trade agreement.'; end if;
  if v_p.nation_id not in (v_a.buyer_nation, v_a.seller_nation) then
    raise exception 'Your nation isn''t party to this agreement.'; end if;
  insert into public.trade_agreement_messages (agreement_id, sender_party_id, body)
    values (p_id, v_p.id, v_msg) returning id into v_mid;
  return jsonb_build_object('id', v_mid);
end $$;
grant execute on function public.send_trade_agreement_message(uuid, text) to authenticated;

notify pgrst, 'reload schema';
