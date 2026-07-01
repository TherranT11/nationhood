-- ===========================================================================
-- 132 · Deploy — the Minister of Defence repositions military between Home and the nation's
-- bases ABROAD (1 AP, instant). Military is the nation's on_hand.military count; a base's
-- garrison records how many of that count are stationed there. Deploy only MOVES position —
-- it never changes the total (on_hand.military is untouched), so upkeep/produce/trade/capacity
-- are unaffected. Home is the reserve: home available = on_hand.military − everything abroad.
-- An abroad base holds at most 5 (schema/128's per-base rule, enforced at the destination).
-- Home has no sub-base limit — home military is a pool, capped only in aggregate (bases × 5)
-- by the January cull. p_from / p_to: null = Home; otherwise one of your OWN abroad bases.
-- Depends on: 40 (_begin_action, events), 114 (_party_holds_ministry), 127 (military_bases),
-- 10 (nations.on_hand), 05 (game_state via current_game_date/40). Run after 127.
-- ===========================================================================

create or replace function public.deploy_military(p_from uuid, p_to uuid, p_qty int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_nation text; v_qty int;
  v_total numeric; v_abroad numeric; v_home int; v_from_g int; v_to_g int; v_to_host text;
begin
  v_p := public._begin_action(0);   -- requires >= 1 action; the 1 AP is spent below
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Defence') then
    raise exception 'Only the Minister of Defence can deploy the military.'; end if;
  v_qty := coalesce(p_qty, 0);
  if v_qty < 1 then raise exception 'Deploy at least 1 military.'; end if;
  if p_from is not distinct from p_to then raise exception 'Pick two different locations.'; end if;

  -- A named endpoint must be one of your OWN bases abroad (host <> your nation).
  if p_from is not null and not exists (select 1 from public.military_bases
        where id = p_from and nation_id = v_nation and host_nation_id <> v_nation) then
    raise exception 'The source is not one of your bases abroad.'; end if;
  if p_to is not null and not exists (select 1 from public.military_bases
        where id = p_to and nation_id = v_nation and host_nation_id <> v_nation) then
    raise exception 'The destination is not one of your bases abroad.'; end if;

  select coalesce((on_hand->>'military')::numeric, 0) into v_total from public.nations where id = v_nation;
  select coalesce(sum(garrison), 0) into v_abroad from public.military_bases
    where nation_id = v_nation and host_nation_id <> v_nation;
  v_home := greatest(0, floor(v_total - v_abroad))::int;

  -- Source has the military?
  if p_from is null then
    if v_home < v_qty then raise exception 'Only % military available at home.', v_home; end if;
  else
    select garrison into v_from_g from public.military_bases where id = p_from;
    if coalesce(v_from_g, 0) < v_qty then raise exception 'Only % military at that base.', coalesce(v_from_g, 0); end if;
  end if;

  -- Destination capacity — an abroad base holds at most 5.
  if p_to is not null then
    select garrison, host_nation_id into v_to_g, v_to_host from public.military_bases where id = p_to;
    if coalesce(v_to_g, 0) + v_qty > 5 then
      raise exception 'That base can hold only 5 military (it has %).', coalesce(v_to_g, 0); end if;
  end if;

  if p_from is not null then update public.military_bases set garrison = garrison - v_qty where id = p_from; end if;
  if p_to   is not null then update public.military_bases set garrison = garrison + v_qty where id = p_to; end if;
  update public.parties set actions_remaining = actions_remaining - 1 where id = v_p.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'declaration',
            v_p.name || (case when p_to is not null
                    then ' stationed ' || v_qty || ' military in ' || (select name from public.nations where id = v_to_host)
                    else ' recalled ' || v_qty || ' military home' end) || '.',
            public.current_game_date());
  return jsonb_build_object('deployed', v_qty, 'actions', v_p.actions_remaining - 1);
end $$;
grant execute on function public.deploy_military(uuid, uuid, int) to authenticated;

notify pgrst, 'reload schema';
