-- ===========================================================================
-- 172 · Cards — Phase 3c: the auction (acquisition). Sealed-bid, per nation, resolved each tick.
--
-- Cards reach a hand by auction. Per nation, an "auction block" of (active parties + 1) cards is drawn from
-- the deck (status 'on_block' — the public market). During a tick each party places one SEALED
-- Influence bid per card; at the next tick each on-block card with bids is awarded to its highest
-- bidder (tie → earliest bid) into that party's hand, and the block is topped back up from the deck.
--
-- First-price with ESCROW: a bid deducts the Influence immediately, so a party can never commit more
-- than it holds. The winner's escrow is spent; every losing bid is refunded (capped at the 100 bank
-- limit — a party that accrued while its bid was escrowed may lose a few Influence to the cap).
--
-- Lifecycle now: in_deck → on_block → in_hand → played (170/171). The resolution step is wired into
-- advance_tick (schema/60). Depends on: 170 (cards/deck_cards), 171 (party_id, card_play), 20
-- (parties), 40 (events), 10/is_admin. Idempotent.
-- ===========================================================================

-- Sealed bids on an on-block card. One row per (card, party) — re-bidding updates it. Deleting the
-- card or party clears the bid (a mid-auction card delete forfeits the escrow — an accepted admin edge).
create table if not exists public.card_bids (
  deck_card_id uuid not null references public.deck_cards (id) on delete cascade,
  party_id     uuid not null references public.parties (id)    on delete cascade,
  amount       int  not null check (amount > 0),
  created_at   timestamptz not null default now(),
  primary key (deck_card_id, party_id)
);
create index if not exists card_bids_card_idx on public.card_bids (deck_card_id);

alter table public.card_bids enable row level security;
drop policy if exists "card_bids_select_own" on public.card_bids;
create policy "card_bids_select_own" on public.card_bids for select using (
  public.is_admin() or party_id in (select id from public.parties where user_id = auth.uid())
);
-- No client insert/update/delete: card_bid / card_bid_cancel are security definer.

-- card_bid(card, amount): place or raise the caller's sealed bid on an on-block card in their nation.
-- Escrows the Influence (net of any prior bid). Min bid is the card's base value (definition->>'cost').
create or replace function public.card_bid(p_deck_card uuid, p_amount int)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_pnation text; v_inf int; v_dc record; v_base int; v_old int; v_net int;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not signed in.'; end if;
  if p_amount is null or p_amount < 1 then raise exception 'A bid must be at least 1 Influence.'; end if;

  select dc.id, dc.status, dc.nation_id, c.definition
    into v_dc
    from public.deck_cards dc join public.cards c on c.id = dc.card_id
   where dc.id = p_deck_card
   for update of dc;
  if not found then raise exception 'No such card.'; end if;
  if v_dc.status <> 'on_block' then raise exception 'That card is not up for auction.'; end if;

  select id, nation_id into v_pid, v_pnation from public.parties where user_id = v_uid;
  if v_pid is null then raise exception 'You have no party.'; end if;
  if v_pnation is distinct from v_dc.nation_id then raise exception 'You can only bid on your own nation''s cards.'; end if;

  v_base := coalesce((v_dc.definition->>'cost')::int, 0);
  if p_amount < v_base then raise exception 'The minimum bid is % Influence.', v_base; end if;

  -- Escrow the net move (refund the old bid, charge the new). Lock the party row to serialise bids.
  select influence into v_inf from public.parties where id = v_pid for update;
  select amount into v_old from public.card_bids where deck_card_id = p_deck_card and party_id = v_pid;
  v_net := p_amount - coalesce(v_old, 0);
  if v_inf < v_net then raise exception 'Not enough Influence for that bid.'; end if;

  update public.parties set influence = influence - v_net where id = v_pid;
  insert into public.card_bids (deck_card_id, party_id, amount) values (p_deck_card, v_pid, p_amount)
    on conflict (deck_card_id, party_id) do update set amount = excluded.amount, created_at = now();
end $$;
grant execute on function public.card_bid(uuid, int) to authenticated;

-- card_bid_cancel(card): withdraw the caller's bid and refund the escrow (capped at 100).
create or replace function public.card_bid_cancel(p_deck_card uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_amt int;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not signed in.'; end if;
  select id into v_pid from public.parties where user_id = v_uid;
  if v_pid is null then raise exception 'You have no party.'; end if;
  delete from public.card_bids where deck_card_id = p_deck_card and party_id = v_pid returning amount into v_amt;
  if v_amt is not null then update public.parties set influence = least(100, influence + v_amt) where id = v_pid; end if;
end $$;
grant execute on function public.card_bid_cancel(uuid) to authenticated;

-- The auction block size for a nation: one card per ACTIVE party (acted within 7 days — INACTIVE_DAYS,
-- mirroring resolve_election, schema/60), plus one. A dormant nation → block of 1, so there's always a
-- card on offer. The ONE source for the block target, read by the refiller and card_create's auto-draw.
create or replace function public._card_block_target(p_nation text)
returns int language sql stable security definer set search_path = public as $$
  select (select count(*) from public.parties
           where nation_id = p_nation and last_active_at >= now() - interval '7 days')::int + 1;
$$;
revoke all on function public._card_block_target(text) from public, anon, authenticated;

-- Top a nation's on-block up to its target by drawing random cards from the deck. No-op if already
-- full (or the deck is empty). The ONE refiller — the tick resolver and the admin seed both call it.
create or replace function public._refill_card_block(p_nation text)
returns void language plpgsql security definer set search_path = public as $$
declare v_draw int;
begin
  v_draw := public._card_block_target(p_nation)
            - (select count(*) from public.deck_cards where nation_id = p_nation and status = 'on_block');
  if v_draw > 0 then
    update public.deck_cards set status = 'on_block'
     where id in (select id from public.deck_cards
                   where nation_id = p_nation and status = 'in_deck'
                   order by random() limit v_draw);
  end if;
end $$;
revoke all on function public._refill_card_block(text) from public, anon, authenticated;

-- Resolve every nation's auctions for the tick, then refill each block. Called from advance_tick.
-- Security definer; runs with no auth context (bypasses RLS) like the rest of the tick.
create or replace function public._resolve_card_auctions(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare n record; c record; w record; v_pname text; v_cname text;
begin
  for n in select id from public.nations where not coalesce(dormant, false) loop
    -- 1) award each on-block card that drew bids
    for c in
      select dc.id, cd.definition
        from public.deck_cards dc join public.cards cd on cd.id = dc.card_id
       where dc.nation_id = n.id and dc.status = 'on_block'
         and exists (select 1 from public.card_bids b where b.deck_card_id = dc.id)
       for update of dc   -- lock the card so a bid can't land mid-resolution (it'd lose its escrow)
    loop
      -- HARD hand-limit guarantee: award to the highest bidder who still has an open slot (holds < 4),
      -- counting cards won earlier in THIS resolution (_hand_count is live). A bidder already at 4 is
      -- skipped and refunded — so a party can never finish holding more than 4, even if the bid gate
      -- (schema/180) was bypassed. If EVERY bidder is at the cap, nobody wins and all are refunded; the
      -- card stays on the block to re-auction.
      select party_id, amount into w from public.card_bids
        where deck_card_id = c.id and public._hand_count(party_id) < 4
        order by amount desc, created_at asc limit 1;   -- top eligible bid, tie → earliest
      if w.party_id is not null then
        update public.deck_cards set status = 'in_hand', party_id = w.party_id where id = c.id;  -- winner's escrow already spent
        update public.parties p set influence = least(100, p.influence + b.amount)   -- refund everyone else (incl. capped higher bidders)
          from public.card_bids b
         where b.deck_card_id = c.id and b.party_id = p.id and b.party_id <> w.party_id;
        select name into v_pname from public.parties where id = w.party_id;
        v_cname := coalesce(c.definition->>'name', 'a card');
        insert into public.events (nation_id, party_id, kind, body, game_date)
          values (n.id, w.party_id, 'party',
                  v_pname || ' won ' || v_cname || ' at auction for ' || w.amount || ' Influence.',
                  public.current_game_date());
      else
        update public.parties p set influence = least(100, p.influence + b.amount)   -- all bidders capped → refund all, no award
          from public.card_bids b where b.deck_card_id = c.id and b.party_id = p.id;
      end if;
      delete from public.card_bids where deck_card_id = c.id;
    end loop;

    -- 2) top the block back up (active parties + 1) — shared refiller.
    perform public._refill_card_block(n.id);
  end loop;
end $$;
revoke all on function public._resolve_card_auctions(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
