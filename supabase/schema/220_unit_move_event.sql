-- ===========================================================================
-- 220 · Announce a unit movement order in the nation's feed.
--
-- move_unit (schema/204) walked a named unit silently. Add a feed event when a move lands:
--   "In the nation of {nation}, the {unit name} has been ordered to {hex name}."
-- kind 'party' — a party/military action, so it shows in the nation's own Home feed but is filtered
-- OUT of the global World Timeline (LOCAL_KINDS in play/news), which would otherwise be flooded since
-- units move every tick. Everything else about move_unit is unchanged from 204 (one source).
--
-- Depends on: 204 (move_unit), 40 (events, current_game_date), 101 (world_hexes), 199 (military_units).
-- Idempotent. Apply AFTER 204.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public.move_unit(p_unit uuid, p_q int, p_r int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_tick int; v_u record;
        v_first boolean; v_used int; v_allow int; v_prev_armor int; v_adj boolean;
        v_nname text; v_hexname text;
begin
  v_p := public._begin_action(0);   -- 1 AP, instant
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Defence') then
    raise exception 'Only the Minister of Defence can move a unit.'; end if;

  select * into v_u from public.military_units where id = p_unit for update;   -- lock: serialise this unit's moves
  if not found then raise exception 'No such unit.'; end if;
  if v_u.nation_id <> v_nation then raise exception 'That unit is not yours.'; end if;

  select current_tick into v_tick from public.game_state where id;
  if v_u.ready_tick > v_tick then raise exception 'That unit is still being raised.'; end if;
  if v_u.q is null or v_u.r is null then raise exception 'That unit has no position on the map.'; end if;

  -- Target must be an ADJACENT hex (axial 6-neighbourhood), LAND, and not held by a foreign unit.
  v_adj := (p_q = v_u.q     and p_r = v_u.r - 1) or (p_q = v_u.q     and p_r = v_u.r + 1)
        or (p_q = v_u.q - 1 and p_r = v_u.r    ) or (p_q = v_u.q + 1 and p_r = v_u.r    )
        or (p_q = v_u.q + 1 and p_r = v_u.r - 1) or (p_q = v_u.q - 1 and p_r = v_u.r + 1);
  if not v_adj then raise exception 'A unit can only move to an adjacent hex.'; end if;
  if not exists (select 1 from public.world_hexes where q = p_q and r = p_r and terrain = 'land') then
    raise exception 'Units can only move onto land.'; end if;
  if exists (select 1 from public.military_units where q = p_q and r = p_r and nation_id <> v_nation) then
    raise exception 'That hex is held by a foreign unit — you can''t move there yet.'; end if;

  -- Per-tick allowance: Infantry 1, Armor 2. Reset the counter on a fresh tick (move_tick behind now).
  v_first := (v_u.move_tick is distinct from v_tick);
  v_used  := case when v_first then 0 else coalesce(v_u.moves_used, 0) end;
  v_allow := case when v_u.unit_type = 'armor' then 2 else 1 end;
  if v_used >= v_allow then
    raise exception 'This unit has already used its full movement this month.'; end if;

  -- Armor fuel: only on the unit's FIRST move of the tick. The 1st armor mover opens a 5-armor batch that
  -- costs 1 Energy; movers 2–5 ride it free; the 6th opens the next batch. Blocks if the nation is dry.
  if v_u.unit_type = 'armor' and v_first then
    select count(*) into v_prev_armor from public.military_units
      where nation_id = v_nation and unit_type = 'armor' and move_tick = v_tick and id <> v_u.id;
    if v_prev_armor % 5 = 0 then
      if coalesce((select (on_hand->>'energy')::numeric from public.nations where id = v_nation), 0) < 1 then
        raise exception 'Not enough Energy to move Armor (1 Energy fuels up to 5 armor units).'; end if;
      perform public._nation_onhand_add(v_nation, 'energy', -1);
    end if;
  end if;

  update public.military_units
     set q = p_q, r = p_r, move_tick = v_tick, moves_used = v_used + 1
   where id = p_unit;

  -- Announce the order in the nation's feed (Home feed only — filtered from the World Timeline).
  select name into v_nname from public.nations where id = v_nation;
  select name into v_hexname from public.world_hexes where q = p_q and r = p_r limit 1;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'party',
      'In the nation of ' || coalesce(v_nname, v_nation) || ', the ' || coalesce(v_u.name, 'unit') ||
      ' has been ordered to ' || coalesce(nullif(v_hexname, ''), 'a hex') || '.', public.current_game_date());

  return jsonb_build_object('id', p_unit, 'q', p_q, 'r', p_r,
    'moves_used', v_used + 1, 'allowance', v_allow, 'actions', v_p.influence);
end $$;
grant execute on function public.move_unit(uuid, int, int) to authenticated;

notify pgrst, 'reload schema';
