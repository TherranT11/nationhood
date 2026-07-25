-- ===========================================================================
-- 325 · Kingdoms — a player may delete their dynasty (start over).
--
-- kingdoms_delete_dynasty removes the caller's house and everything tied to it: its Personalities (the head
-- of house and every child), its Treasury/stats, its hand, and its holdings. The counties themselves survive
-- as unclaimed land (they are a finite shared pool), so we raze their buildings and release them back to the
-- pool in a clean state (unheld, Unrest reset). Deleting the row also vacates the throne if the house was
-- Sovereign, so the crown becomes claimable again. The account stays signed in — with no house, the player is
-- returned to the founding flow.
--
-- Cascades already handle the hand (kingdoms_hand.house_id) and the children (kingdoms_children.house_id);
-- counties null their held_by on delete, but their buildings hang off the county (not the house), so those are
-- razed explicitly. Security definer, scoped to auth.uid(); the only writer. Depends on: 304, 309, 313, 314,
-- 318, 321. Idempotent. Apply after 324.
-- ===========================================================================

create or replace function public.kingdoms_delete_dynasty()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;

  select id into v_id from public.kingdoms_leaders
    where user_id = auth.uid() order by created_at desc limit 1;
  if v_id is null then raise exception 'no_house'; end if;

  -- Raze every building on this house's holdings (buildings cascade off the county, not the house, and the
  -- counties survive as unheld land, so clear them explicitly).
  delete from public.kingdoms_holding_buildings
    where county_id in (select id from public.kingdoms_counties where held_by = v_id);

  -- Release the holdings back to the unclaimed pool in a clean state.
  update public.kingdoms_counties set held_by = null, unrest = 1 where held_by = v_id;

  -- Delete the house itself. Cascades remove its hand and its children (its Personalities); dropping the row
  -- also vacates the throne if it was Sovereign, so the crown can be claimed again.
  delete from public.kingdoms_leaders where id = v_id;
end;
$$;
revoke all on function public.kingdoms_delete_dynasty() from public, anon;
grant execute on function public.kingdoms_delete_dynasty() to authenticated;

notify pgrst, 'reload schema';
