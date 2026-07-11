-- ===========================================================================
-- 180 · Hand limit — a party holds at most 4 cards, and may bid only while it has an open slot.
--
-- One rule, one mechanism: a bid RESERVES a hand slot. A party may place (or raise) a sealed bid only
-- while its held cards plus its OTHER outstanding bids leave a slot free — held + other active bids < 4.
-- A card enters a hand ONLY by winning an auction (schema/172:104, the single writer of 'in_hand'), and
-- every outstanding bid is counted against the cap here, so a party can never finish a resolution
-- holding more than 4 — even if it wins every bid it placed. The cap therefore needs enforcing in
-- exactly ONE place: the bid gate below. Playing or discarding a card (schema/174) frees a slot, which
-- is how a full hand makes room to bid again.
--
-- Supersedes schema/172's card_bid, adding only the reservation check; the min-bid and escrow-the-net
-- logic is unchanged. Depends on: 172 (card_bid, card_bids), 170 (deck_cards), 20 (parties). Idempotent.
-- ===========================================================================

-- The one source for a party's hand size (cards it currently holds).
create or replace function public._hand_count(p_party uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.deck_cards where party_id = p_party and status = 'in_hand';
$$;
revoke all on function public._hand_count(uuid) from public, anon, authenticated;

-- card_bid — supersedes schema/172, adding the 4-card reservation gate. A bid is allowed only if the
-- party's held cards plus its bids on OTHER cards leave room for this one (held + other bids < 4);
-- raising an existing bid on this card consumes no new slot. Everything else is unchanged from 172.
create or replace function public.card_bid(p_deck_card uuid, p_amount int)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_pnation text; v_inf int; v_dc record; v_base int; v_old int; v_net int; v_reserved int;
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

  -- Lock the party row FIRST: it serialises this party's concurrent bids, so the reservation count
  -- below can't be raced by a second bid on a different card each seeing an empty count and both
  -- slipping under the cap. (Same lock also guards the escrow.)
  select influence into v_inf from public.parties where id = v_pid for update;

  -- Reservation gate: this bid needs a free slot. Held cards + bids on OTHER cards must be < 4, leaving
  -- room for this one. (A raise on this card is already reserved, so it's excluded from the count.)
  v_reserved := public._hand_count(v_pid)
              + (select count(*) from public.card_bids where party_id = v_pid and deck_card_id <> p_deck_card);
  if v_reserved >= 4 then
    raise exception 'You can hold at most 4 cards — play or discard one to bid on another.';
  end if;

  -- Escrow the net move (refund the old bid, charge the new).
  select amount into v_old from public.card_bids where deck_card_id = p_deck_card and party_id = v_pid;
  v_net := p_amount - coalesce(v_old, 0);
  if v_inf < v_net then raise exception 'Not enough Influence for that bid.'; end if;

  update public.parties set influence = influence - v_net where id = v_pid;
  insert into public.card_bids (deck_card_id, party_id, amount) values (p_deck_card, v_pid, p_amount)
    on conflict (deck_card_id, party_id) do update set amount = excluded.amount, created_at = now();
end $$;
grant execute on function public.card_bid(uuid, int) to authenticated;

notify pgrst, 'reload schema';
