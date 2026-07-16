-- ===========================================================================
-- 255 · Improve Relations — a Minister of Foreign Affairs action.
--
-- Pick another nation and raise the standing between you by +1 (capped at 10). The Diplomacy cost
-- scales with the CURRENT standing: cost = current relations + 2 (so 5→6 costs 7, 8→9 costs 10) —
-- courting a friend is dearer than warming a cold one. Diplomacy is the on-hand resource (like the
-- Found-Charter action). Also spends 1 Action Point, mirroring found_organization (the per-turn throttle
-- and the action economy every party action rides). Relations are symmetric (schema/137), so the +1 is
-- felt both ways.
--
-- Depends on: 40 (_begin_action / events / current_game_date), 174 (_party_holds_ministry),
-- 137 (_relation_adjust / nation_relations), 10/113 (nations.on_hand, _nation_stat_add). Idempotent.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public.improve_relations(p_target text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_cur int; v_cost int; v_have numeric; v_new int;
        v_tname text; v_nname text;
begin
  v_p := public._begin_action(0);   -- lock caller's party + spend 1 Action Point
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs can improve relations.'; end if;
  if p_target is null or p_target = v_nation then raise exception 'Choose another nation.'; end if;
  if not exists (select 1 from public.nations where id = p_target and not coalesce(dormant, false)) then
    raise exception 'No such nation.'; end if;

  -- Current standing (a pair with no row reads 5). Already maxed → block before spending anything.
  select value into v_cur from public.nation_relations
   where nation_a = least(v_nation, p_target) and nation_b = greatest(v_nation, p_target);
  v_cur := coalesce(v_cur, 5);
  if v_cur >= 10 then raise exception 'Relations are already at the maximum (10).'; end if;

  v_cost := v_cur + 2;   -- Diplomacy cost scales with the current standing
  v_have := coalesce((select (on_hand->>'diplomacy')::numeric from public.nations where id = v_nation), 0);
  if v_have < v_cost then
    raise exception 'Improving relations costs % Diplomacy — your nation has %.', v_cost, floor(v_have); end if;

  perform public._nation_stat_add(v_nation, 'on_hand', 'diplomacy', -v_cost, 0, null);
  perform public._relation_adjust(v_nation, p_target, 1);   -- symmetric +1 (clamped 1–10 in _relation_set)
  v_new := least(10, v_cur + 1);

  select name into v_tname from public.nations where id = p_target;
  select name into v_nname from public.nations where id = v_nation;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'party',
      coalesce(v_nname, v_nation) || ' improved relations with ' || coalesce(v_tname, p_target) ||
      ' — the standing is now ' || v_new || '/10.', public.current_game_date());
  return jsonb_build_object('ok', true, 'target', p_target, 'value', v_new, 'spent', v_cost);
end $$;
grant execute on function public.improve_relations(text) to authenticated;

notify pgrst, 'reload schema';
