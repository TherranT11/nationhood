-- ===========================================================================
-- 209 · Retire the auction — Stage B: drop the dead objects.
--
-- Stage A (schema/208) neutralised the sealed-bid auction / hand / play-discard flow and settled its
-- live state; the COIN claim loop (schema/207) is the sole card mechanic. This drops the now-unused
-- objects. Nothing kept references any of them (verified across schema + frontend):
--   • card_bid / card_bid_cancel / _resolve_card_auctions  — the auction
--   • card_play / card_discard                             — the hand play/discard
--   • _hand_count                                          — the hand-limit gate
--   • nation_turn / _advance_turns                         — the retired party-turn rotation
--   • card_bids table                                      — sealed bids (emptied + refunded in 208)
--   • parties.turn_seq / parties.bids_this_turn / nations.turn_party_id — turn/bid state
--
-- KEPT (the claim loop / card system still use these): _card_block_target + _refill_card_block (172),
-- _card_return_to_deck (174), the effect engine (176/178/179/183), deck_cards + on_block, and the
-- Tempo/claim system (206/207). The block is kept stocked each tick by _refill_all_card_blocks (208).
--
-- These objects are still DEFINED by the historical migrations that created them (171-187, append-only);
-- this migration is the authoritative removal — it runs last, so a full schema load creates then drops
-- them, and the live DB is left clean. Depends on: 208 (runs first — refunds escrow before the table
-- is dropped) and schema/60 (the _advance_turns tick call was removed there). Idempotent.
-- ===========================================================================

-- Functions (drop before the table they read, though CASCADE-free drops here don't require it).
drop function if exists public.card_bid(uuid, int);
drop function if exists public.card_bid_cancel(uuid);
drop function if exists public._resolve_card_auctions(int);
drop function if exists public.card_play(uuid, uuid, integer, integer, uuid, uuid);
drop function if exists public.card_discard(uuid);
drop function if exists public._hand_count(uuid);
drop function if exists public.nation_turn(text);
drop function if exists public._advance_turns();

-- The sealed-bid table (already emptied + refunded in 208).
drop table if exists public.card_bids;

-- Dead turn/bid columns (only the retired rotation + hand-limit ever touched these).
alter table public.parties drop column if exists turn_seq;
alter table public.parties drop column if exists bids_this_turn;
alter table public.nations  drop column if exists turn_party_id;

notify pgrst, 'reload schema';
