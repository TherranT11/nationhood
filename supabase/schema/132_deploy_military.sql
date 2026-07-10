-- ===========================================================================
-- 132 · Deploy — the Minister of Defence moves built units between two of the nation's bases
-- (1 AP, instant). Both endpoints are your own bases (home or abroad); units now live AT bases
-- (typed: armies / fleets / air_wings, schema/127), so this is a straight base → base move of a
-- chosen unit type. The destination can't be pushed past 5 units total (built or building,
-- _base_committed_units, schema/129). No home "reserve" pool any more — every unit sits at a base.
-- Depends on: 40 (_begin_action, events), 114 (_party_holds_ministry), 127 (military_bases),
-- 129 (_base_committed_units). Run after 129.
-- ===========================================================================

drop function if exists public.deploy_military(uuid, uuid, int);   -- old home↔abroad raw-military signature

create or replace function public.deploy_military(p_from uuid, p_to uuid, p_unit_type text, p_qty int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_qty int; v_type text; v_from_ct int;
begin
  v_p := public._begin_action(0);   -- requires >= 1 action; the 1 AP is spent below
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Defence') then
    raise exception 'Only the Minister of Defence can deploy the military.'; end if;
  v_type := lower(coalesce(p_unit_type, ''));
  if v_type not in ('army', 'fleet', 'air_wing') then raise exception 'Unknown unit type.'; end if;
  v_qty := coalesce(p_qty, 0);
  if v_qty < 1 then raise exception 'Deploy at least 1 unit.'; end if;
  if p_from is null or p_to is null or p_from = p_to then raise exception 'Pick two different bases.'; end if;
  if not exists (select 1 from public.military_bases where id = p_from and nation_id = v_nation) then
    raise exception 'The source base is not one of yours.'; end if;
  if not exists (select 1 from public.military_bases where id = p_to and nation_id = v_nation) then
    raise exception 'The destination base is not one of yours.'; end if;

  select (case v_type when 'army' then armies when 'fleet' then fleets else air_wings end)
    into v_from_ct from public.military_bases where id = p_from;
  if coalesce(v_from_ct, 0) < v_qty then
    raise exception 'That base has only % of that unit.', coalesce(v_from_ct, 0); end if;
  if public._base_committed_units(p_to) + v_qty > 5 then
    raise exception 'The destination base can hold at most 5 units.'; end if;

  update public.military_bases set
      armies    = armies    - (case when v_type = 'army'     then v_qty else 0 end),
      fleets    = fleets    - (case when v_type = 'fleet'    then v_qty else 0 end),
      air_wings = air_wings - (case when v_type = 'air_wing' then v_qty else 0 end)
   where id = p_from;
  update public.military_bases set
      armies    = armies    + (case when v_type = 'army'     then v_qty else 0 end),
      fleets    = fleets    + (case when v_type = 'fleet'    then v_qty else 0 end),
      air_wings = air_wings + (case when v_type = 'air_wing' then v_qty else 0 end)
   where id = p_to;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'declaration',
            v_p.name || ' redeployed ' || v_qty || ' ' || public._unit_label(v_type, v_qty) || '.',
            public.current_game_date());
  return jsonb_build_object('deployed', v_qty, 'actions', v_p.influence);
end $$;
grant execute on function public.deploy_military(uuid, uuid, text, int) to authenticated;

notify pgrst, 'reload schema';
