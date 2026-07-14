-- ===========================================================================
-- 208 · Retire the sealed-bid auction (Stage A).
--
-- The COIN claim loop (schema/207) is now the sole card mechanic, so the auction / hand / play-discard
-- flow is retired. This stage NEUTRALISES it and settles the live state it leaves behind; the actual
-- removal of the now-unused functions/tables/statuses is a later dead-code sweep (Stage B).
--
--   1) Refund every outstanding sealed bid's escrowed Influence (capped at the 100 bank), clear the bids.
--   2) Return every hand card to its nation's deck (unowned) so it re-enters the claimable pool.
--   3) _refill_all_card_blocks — the tick step that keeps every nation's block stocked for claiming
--      (replaces the auction's per-tick resolve+refill; reuses the shared _refill_card_block, schema/172).
--   4) Revoke the client entry points (card_bid / card_bid_cancel / card_play / card_discard) so no
--      crafted request can still bid, play or discard once the UI is gone.
--
-- KEPT (the claim loop needs them): the deck + on_block block, _refill_card_block, the effect engine
-- (176/178/179/183), the Card Creator, and the whole Tempo/claim system (206/207).
--
-- Depends on: 172 (card_bids, _refill_card_block, card_bid*), 174/187 (card_play/card_discard),
-- 170 (deck_cards), 20 (parties), 10 (nations). Idempotent. Apply in the Supabase SQL Editor, then
-- re-apply schema/60 so _advance_tick calls the upkeep step instead of the auction.
-- ===========================================================================

-- 1) Refund outstanding escrow (a party's bids summed, capped at the 100 bank), then clear the bids.
update public.parties p
   set influence = least(100, p.influence + b.total)
  from (select party_id, sum(amount) as total from public.card_bids group by party_id) b
 where p.id = b.party_id;
delete from public.card_bids;

-- 2) Return every hand card to the deck, unowned, so it can be drawn onto a block and claimed.
update public.deck_cards set status = 'in_deck', party_id = null where status = 'in_hand';

-- 3) Per-tick block upkeep — keep every non-dormant nation's on-block market at (active parties + 1).
create or replace function public._refill_all_card_blocks(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare n record;
begin
  for n in select id from public.nations where not coalesce(dormant, false) loop
    perform public._refill_card_block(n.id);
  end loop;
end $$;
revoke all on function public._refill_all_card_blocks(int) from public, anon, authenticated;

-- 4) Retire the client entry points. The functions remain for now (the dead-code sweep drops them once
--    no references remain); revoking execute makes them uncallable from the client immediately. Revoke
--    from PUBLIC too — functions grant EXECUTE to PUBLIC by default, and anon/authenticated inherit it,
--    so revoking only from authenticated would leave them callable.
revoke execute on function public.card_bid(uuid, int) from public, anon, authenticated;
revoke execute on function public.card_bid_cancel(uuid) from public, anon, authenticated;
revoke execute on function public.card_play(uuid, uuid, integer, integer, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.card_discard(uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';
