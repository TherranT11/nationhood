-- ===========================================================================
-- 184 · Dormant deck — a card authored with Limiter 'dormant' (schema/170) is dealt to NO nation at
-- creation; it waits in the pool until another card SUMMONS it. A 'deck_add' effect (schema/176) names
-- a dormant card and a nation; when it fires — on play, or from a Government-Choice decision / a bill —
-- the card enters that nation's deck (status in_deck) and auto-draws onto the block if there's room,
-- exactly as a freshly-created card would. This is the deck-level counterpart to the reqCard/allowCard
-- play-chain: a dormant card can't be won until a trigger card brings it into circulation.
--
-- Depends on: 170 (cards, deck_cards, card_create auto-draw), 172 (_card_block_target). Idempotent.
-- ===========================================================================

-- Summon a card into a nation's deck. Silent no-op on a missing/dormant nation, an unknown card, or a
-- card the nation already holds live (in_deck/on_block/in_hand) — so a repeated trigger can't stack
-- duplicate copies. A 'played' historical copy doesn't block a fresh summon.
create or replace function public._card_enter_deck(p_card uuid, p_nation text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_card is null or p_nation is null then return; end if;
  if not exists (select 1 from public.cards where id = p_card) then return; end if;
  if not exists (select 1 from public.nations where id = p_nation and not coalesce(dormant, false)) then return; end if;
  if exists (select 1 from public.deck_cards
              where nation_id = p_nation and card_id = p_card and status in ('in_deck', 'on_block', 'in_hand')) then
    return;
  end if;
  insert into public.deck_cards (nation_id, card_id, status) values (p_nation, p_card, 'in_deck');
  -- Auto-draw onto the block if the market has room (mirrors card_create, schema/170).
  update public.deck_cards dc set status = 'on_block'
   where dc.card_id = p_card and dc.nation_id = p_nation and dc.status = 'in_deck'
     and (select count(*) from public.deck_cards b where b.nation_id = dc.nation_id and b.status = 'on_block')
         < public._card_block_target(dc.nation_id);
end $$;
revoke all on function public._card_enter_deck(uuid, text) from public, anon, authenticated;

notify pgrst, 'reload schema';
