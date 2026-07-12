-- ===========================================================================
-- 187 · Retire Party Turns — every party acts every tick.
--
-- The rotation is gone. There is no longer an "active party" cycling one-per-tick; instead EVERY party,
-- every tick (= every month), makes ONE of three mutually-exclusive choices:
--   • BID ON CARDS     → place/raise sealed bids on the market (repeatable this tick, up to the hand cap)
--   • PLAY A CARD      → resolve the card + bank its Action Points
--   • DISCARD A CARD   → return it to the nation's deck for +3 Influence
--
-- Action Points are now a PERSISTENT bank: playing a card ADDS its `acts` to the balance (it no longer
-- overwrites), and AP no longer expires each tick — you spend banked AP on operations at any time,
-- across ticks. Playing is the only thing that grants AP; bidding and discarding grant none.
--
-- ── How "exactly one per tick" is enforced, with NO new column ──
--   • turn_acted_tick marks the tick a party PLAYED or DISCARDED (a terminal choice). Set by those two.
--   • Active bids ARE the "chose to bid this tick" marker — bids are escrowed within a tick and cleared
--     when the tick's auction resolves (schema/172 _resolve_card_auctions), so any bid a party holds is
--     necessarily from the current tick.
--   Therefore:
--     – play / discard are allowed only when turn_acted_tick ≠ tick AND the party holds no bids;
--     – bid is allowed only when turn_acted_tick ≠ tick (it never sets turn_acted_tick, so bids stay
--       repeatable); cancelling your last bid frees you to play/discard again for free.
--
-- Supersedes: schema/174 card_play, card_discard, _spend_action_point, _advance_turns; schema/180
-- card_bid. Drops turn_take_action (the "bank 1 AP" choice is retired — AP comes only from playing).
-- Leaves nation_turn / turn_seq / turn_party_id / bids_this_turn in place but UNUSED (vestigial) so no
-- earlier migration has to be re-run. Depends on: 174, 180, 172. Idempotent.
-- ===========================================================================

-- The "bank 1 AP" turn choice no longer exists — AP is granted only by playing a card.
drop function if exists public.turn_take_action();

-- Rotation retired: _advance_turns becomes a no-op (was: advance each nation's cursor + clear AP each
-- turn). AP now persists, so nothing is cleared per tick; every party acts every tick, so nothing
-- rotates. Kept as a no-op (rather than editing schema/60's tick loop) so the tick's existing call is
-- harmless and no earlier migration needs re-running.
create or replace function public._advance_turns()
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Party turns are retired (schema/187): no rotation, and Action Points persist across ticks.
  return;
end $$;
revoke all on function public._advance_turns() from public, anon, authenticated;

-- _spend_action_point — unchanged behaviour (spend one banked AP), only the "how to get more" hint
-- changes: you bank AP by PLAYING a card now, not by taking a turn.
create or replace function public._spend_action_point(p_party uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_ap int;
begin
  select action_points into v_ap from public.parties where id = p_party for update;
  if not found then raise exception 'No such party.'; end if;
  if coalesce(v_ap, 0) < 1 then raise exception 'No Action Points left — play a card to bank more.'; end if;
  update public.parties set action_points = action_points - 1 where id = p_party;
end $$;
revoke all on function public._spend_action_point(uuid) from public, anon, authenticated;

-- ── BID ON CARDS — supersedes schema/180. Same min-bid, escrow-the-net, and 4-slot hand reservation;
-- the per-turn 3-bid cap is dropped (the hand reservation already caps outstanding bids at 4). ADDS the
-- one-choice-per-tick gate: you may bid only if you haven't PLAYED or DISCARDED this tick. Bidding is
-- repeatable — it never stamps turn_acted_tick — so a party can bid on several market cards in one tick
-- (bounded by its free hand slots), and cancelling its last bid frees it to play/discard instead. ──
create or replace function public.card_bid(p_deck_card uuid, p_amount int)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_pnation text; v_inf int; v_dc record; v_base int; v_old int; v_net int;
        v_reserved int; v_tick int; v_acted int;
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

  -- Lock the party row FIRST: serialises this party's concurrent bids so the reservation count below
  -- can't be raced, and guards the escrow.
  select influence, turn_acted_tick into v_inf, v_acted from public.parties where id = v_pid for update;

  -- One choice per tick: bidding is barred once you've PLAYED or DISCARDED this tick.
  select current_tick into v_tick from public.game_state where id;
  if v_acted = v_tick then
    raise exception 'You have already played or discarded this month — you can''t also bid.';
  end if;

  -- New bid or a raise? A raise on this card consumes no new hand slot.
  select amount into v_old from public.card_bids where deck_card_id = p_deck_card and party_id = v_pid;

  -- Reservation gate: held cards + bids on OTHER cards must leave a slot for this one (< 4).
  v_reserved := public._hand_count(v_pid)
              + (select count(*) from public.card_bids where party_id = v_pid and deck_card_id <> p_deck_card);
  if v_reserved >= 4 then
    raise exception 'You can hold at most 4 cards — play or discard one to bid on another.';
  end if;

  -- Escrow the net move (refund the old bid, charge the new).
  v_net := p_amount - coalesce(v_old, 0);
  if v_inf < v_net then raise exception 'Not enough Influence for that bid.'; end if;

  update public.parties set influence = influence - v_net where id = v_pid;
  insert into public.card_bids (deck_card_id, party_id, amount) values (p_deck_card, v_pid, p_amount)
    on conflict (deck_card_id, party_id) do update set amount = excluded.amount, created_at = now();
end $$;
grant execute on function public.card_bid(uuid, int) to authenticated;

-- ── PLAY A CARD — supersedes schema/174. Drops the rotation turn gate (nation_turn); keeps ownership +
-- in_hand + the play-time effect pipeline. The one-choice-per-tick gate is now: you haven't already
-- played/discarded this tick (turn_acted_tick) AND you hold no bids (bidding is this tick's choice).
-- On play the card's `acts` are ADDED to the persistent AP bank (no overwrite, no expiry). ──
drop function if exists public.card_play(uuid);
drop function if exists public.card_play(uuid, uuid);
create or replace function public.card_play(p_deck_card uuid, p_target uuid default null, p_hex_q int default null, p_hex_r int default null,
  p_corp uuid default null, p_corp2 uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_dc record; v_party record; v_def jsonb; v_name text; v_tick int; v_acts int; v_tgt_nat text;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not signed in.'; end if;

  select dc.id, dc.status, dc.party_id, dc.nation_id, c.definition
    into v_dc
    from public.deck_cards dc
    join public.cards c on c.id = dc.card_id
   where dc.id = p_deck_card
   for update of dc;   -- lock the card row so two concurrent plays can't both pass the status check
  if not found then raise exception 'No such card.'; end if;
  if v_dc.status <> 'in_hand' then raise exception 'That card is not in a hand to play.'; end if;

  select id, user_id, name, influence into v_party from public.parties where id = v_dc.party_id for update;   -- lock: serialise concurrent plays so the once-per-tick check can't be raced
  if not found or v_party.user_id <> v_uid then raise exception 'That is not your card to play.'; end if;

  -- One choice per tick: not already played/discarded this tick, and not committed to bidding this tick.
  select current_tick into v_tick from public.game_state where id;
  if (select turn_acted_tick from public.parties where id = v_party.id) = v_tick then
    raise exception 'You have already taken your action this month.';
  end if;
  if exists (select 1 from public.card_bids where party_id = v_party.id) then
    raise exception 'You have bids in this month''s auction — cancel them to play a card instead.';
  end if;

  -- A chosen target must be a party of the SAME nation as the card (party effects are national).
  if p_target is not null then
    select nation_id into v_tgt_nat from public.parties where id = p_target;
    if v_tgt_nat is distinct from v_dc.nation_id then raise exception 'That target is not a party in this nation.'; end if;
  end if;

  v_def := v_dc.definition;
  v_acts := greatest(1, least(6, coalesce((v_def->>'acts')::int, 1)));   -- the card's Action Points

  -- A hex_pop / hex_el effect needs a hex picked on play. If the card carries one (generic, or a
  -- 'both'-sided stance effect) but no hex was chosen, stop before consuming the card.
  if coalesce(v_def->>'persistV', 'no') <> 'yes'
     and (p_hex_q is null or p_hex_r is null)
     and public._def_fires_kind(v_def, array['hex_pop', 'hex_el']) then
    raise exception 'Pick a hex on the map to play this card.';
  end if;

  -- Deferred (purchase-by-stance): once parties can hold a stance, gate the playable side on reqD/reqR here.
  -- Bank the card's AP: ADD to the persistent balance (AP now carries across ticks).
  update public.parties   set action_points = action_points + v_acts, turn_acted_tick = v_tick
   where id = v_party.id;
  -- Lifecycle: shuffle back to the deck (author toggle or a firing 'shuffle' effect) else discard 'played'.
  if coalesce(v_def->>'afterPlay', 'discard') = 'shuffle' or public._def_fires_shuffle(v_def) then
    perform public._card_return_to_deck(p_deck_card);
  else
    update public.deck_cards set status = 'played' where id = p_deck_card;
  end if;

  v_name := coalesce(v_def->>'name', 'a card');
  insert into public.events (nation_id, party_id, kind, body, game_date)
  values (v_dc.nation_id, v_party.id, 'party',
          v_party.name || ' played ' || v_name ||
            case when coalesce(v_def->>'desc', '') <> '' then ' — ' || (v_def->>'desc') else '' end,
          public.current_game_date());

  -- Effects (atomic with the play).
  if coalesce(v_def->>'persistV', 'no') = 'yes' then
    perform public._mint_card_modifier(v_dc.nation_id, v_party.id, v_def, v_tick);
  else
    perform public._resolve_card_effects(v_dc.nation_id, v_party.id, p_target, p_hex_q, p_hex_r, p_corp, p_corp2, v_def, v_tick);
    perform public._create_card_decision(v_dc.nation_id, v_party.id, p_deck_card, v_def, v_tick);
  end if;
end $$;
grant execute on function public.card_play(uuid, uuid, integer, integer, uuid, uuid) to authenticated;

-- ── DISCARD A CARD — supersedes schema/174. Drops the rotation turn gate; same one-choice-per-tick gate
-- as play (not already acted, no outstanding bids). Returns the card to the nation's deck, banks +3
-- Influence, and LEAVES the AP bank untouched (AP persists now — discarding neither grants nor clears it). ──
create or replace function public.card_discard(p_deck_card uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_nat text; v_pname text; v_tick int; v_acted int; v_stat text; v_owner uuid;
begin
  v_uid := auth.uid(); if v_uid is null then raise exception 'Not signed in.'; end if;
  select id, nation_id, name into v_pid, v_nat, v_pname from public.parties where user_id = v_uid for update;   -- lock: serialise concurrent choices
  if v_pid is null then raise exception 'You have no party.'; end if;
  select current_tick into v_tick from public.game_state where id;
  select turn_acted_tick into v_acted from public.parties where id = v_pid;
  if v_acted = v_tick then raise exception 'You have already taken your action this month.'; end if;
  if exists (select 1 from public.card_bids where party_id = v_pid) then
    raise exception 'You have bids in this month''s auction — cancel them to discard a card instead.'; end if;

  select status, party_id into v_stat, v_owner from public.deck_cards where id = p_deck_card for update;
  if not found then raise exception 'No such card.'; end if;
  if v_owner is distinct from v_pid or v_stat <> 'in_hand' then raise exception 'That card is not in your hand.'; end if;

  perform public._card_return_to_deck(p_deck_card);   -- discard → back into the nation's deck (shared helper)
  update public.parties set influence = least(100, influence + 3), turn_acted_tick = v_tick where id = v_pid;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nat, v_pid, 'party', v_pname || ' returned a card to the deck for +3 Influence.', public.current_game_date());
end $$;
grant execute on function public.card_discard(uuid) to authenticated;

notify pgrst, 'reload schema';
