-- ===========================================================================
-- 171 · Cards — Phase 3a: the deck→hand→play lifecycle spine + hand privacy.
-- A deck_card now moves in_deck → in_hand (a party holds it) → played. This adds the holder and the
-- privacy (a hand is secret), plus card_play() — the play action everything else will hang off.
--
-- DEFERRED (each blocked on a system that doesn't exist yet, so stubbed here, clearly marked):
--   • ACQUISITION (in_deck → in_hand): the auction economy — its own design pass. Nothing fills
--     hands automatically yet; card_play is exercised via tests until the auction lands.
--   • PURCHASE-BY-STANCE gate: parties can't hold a stance (the ladder is display-only, no Party
--     Congress shift), so card_play does NOT yet gate the side on reqD/reqR.
--   • EFFECT RESOLUTION: the effect-resolution engine (Phase 3b). Playing a card only logs it +
--     pays its cost for now; the mechanical effects are not applied.
--
-- Depends on: 170 (cards, deck_cards), 20 (parties), 40 (events), 10/is_admin. Idempotent.
-- ===========================================================================

-- The holder of a deck_card once it leaves the deck (null while in_deck). Cascades if the party is
-- deleted. status (from schema/170) now spans 'in_deck' → 'in_hand' → 'played'.
alter table public.deck_cards add column if not exists party_id uuid references public.parties (id) on delete cascade;
create index if not exists deck_cards_party_idx on public.deck_cards (party_id);

-- Hand privacy — replaces schema/170's blanket select-all. An 'in_hand' card is visible only to its
-- holder (the party's own user) and admins; 'in_deck' (the public pool) and 'played' (a public
-- record, it fired to the feed) stay world-readable. So opponents can see the deck and what's been
-- played, but never what's sitting in someone's hand.
drop policy if exists "deck_cards_select_all" on public.deck_cards;
drop policy if exists "deck_cards_select"     on public.deck_cards;
create policy "deck_cards_select" on public.deck_cards for select using (
  status <> 'in_hand'
  or public.is_admin()
  or party_id in (select id from public.parties where user_id = auth.uid())
);
-- Still no client insert/update/delete: the shuffle (170) + card_play (below) are security definer.

-- card_play(deck_card): the holder plays a card from their hand. Validates ownership, pays the card's
-- Influence cost, marks it played, and posts the card's authored text to the party-actions feed
-- (kind 'party' — shows on Home's Party Actions, never headlines). STUBBED, as noted in the header:
-- no purchase-by-stance gate (parties have no stance yet) and no mechanical effects (Phase 3b). The
-- cost is charged at play for now; when the auction exists the charge may move there instead.
create or replace function public.card_play(p_deck_card uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_dc record; v_party record; v_def jsonb; v_cost int; v_name text;
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

  select id, user_id, name, influence into v_party from public.parties where id = v_dc.party_id;
  if not found or v_party.user_id <> v_uid then raise exception 'That is not your card to play.'; end if;

  v_def := v_dc.definition;
  v_cost := coalesce((v_def->>'cost')::int, 0);
  if coalesce(v_party.influence, 0) < v_cost then raise exception 'Not enough Influence to play this card.'; end if;

  -- TODO(purchase-by-stance): once parties can hold a stance, gate the playable side on reqD/reqR here.
  -- TODO(effects): apply the card's mechanical effects when the resolution engine (Phase 3b) exists.
  update public.parties    set influence = influence - v_cost where id = v_party.id;
  update public.deck_cards  set status = 'played'               where id = p_deck_card;

  v_name := coalesce(v_def->>'name', 'a card');
  insert into public.events (nation_id, party_id, kind, body, game_date)
  values (v_dc.nation_id, v_party.id, 'party',
          v_party.name || ' played ' || v_name ||
            case when coalesce(v_def->>'desc', '') <> '' then ' — ' || (v_def->>'desc') else '' end,
          public.current_game_date());
end $$;
grant execute on function public.card_play(uuid) to authenticated;

notify pgrst, 'reload schema';
