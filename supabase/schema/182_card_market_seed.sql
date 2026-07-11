-- ===========================================================================
-- 182 · Seed the card markets on demand. An admin can fill every live nation's auction block right now
-- — up to its target (active parties + 1) — instead of waiting for the next tick. Reuses the ONE
-- refiller (_refill_card_block, schema/172); this is just an admin-gated, all-nations wrapper.
--
-- Pairs with card_create's auto-draw (schema/170): a newly authored card drops onto any market that has
-- room the moment it's saved, and this seeds whatever's still short (or fills markets after a batch of
-- cards was authored while blocks were full). Depends on: 172 (_refill_card_block), 10 (nations,
-- is_admin). Idempotent.
-- ===========================================================================

create or replace function public.seed_card_markets()
returns int language plpgsql security definer set search_path = public as $$
declare n record; v_before int; v_added int := 0;
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  for n in select id from public.nations where not coalesce(dormant, false) loop
    select count(*) into v_before from public.deck_cards where nation_id = n.id and status = 'on_block';
    perform public._refill_card_block(n.id);
    v_added := v_added + ((select count(*) from public.deck_cards where nation_id = n.id and status = 'on_block') - v_before);
  end loop;
  return v_added;   -- how many cards were drawn onto blocks across all nations
end $$;
grant execute on function public.seed_card_markets() to authenticated;

notify pgrst, 'reload schema';
