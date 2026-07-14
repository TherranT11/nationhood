-- ===========================================================================
-- 203 · Foreign Affairs action — Diplomatic Outreach.
--
-- The Minister of Foreign Affairs runs a diplomatic drive: it banks Diplomacy on-hand equal to the
-- nation's current Diplomacy PRODUCTION (production.diplomacy), floored at 0. Costs 2 Action Points and
-- is on a 12-tick cooldown (per nation), mirroring the Produce action's cooldown shape (schema/113).
--
-- Depends on: 10 (nations), 20 (parties), 40 (_begin_action, _spend_action_point, events,
-- current_game_date), 05 (game_state), 91 (_nation_stat_add), 138 (_party_holds_ministry),
-- 186 (is_foreign_affairs_minister). Idempotent.
-- ===========================================================================

-- Per-nation cooldown gate: the tick before which Diplomatic Outreach can't run again (mirrors
-- produce_until_tick, schema/113). Null = never used → available.
alter table public.nations add column if not exists diplo_until_tick int;

create or replace function public.diplomatic_outreach()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_n public.nations%rowtype; v_tick int; v_amt numeric;
begin
  v_p := public._begin_action(0);            -- lock caller's party + spend 1 Action Point
  perform public._spend_action_point(v_p.id); -- the action costs 2 AP total

  if not public._party_holds_ministry(v_p.id, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs can run a diplomatic outreach.';
  end if;

  select * into v_n from public.nations where id = v_p.nation_id;
  select current_tick into v_tick from public.game_state where id;
  if v_n.diplo_until_tick is not null and v_tick < v_n.diplo_until_tick then
    raise exception 'Diplomatic outreach is on cooldown — % tick(s) left.', (v_n.diplo_until_tick - v_tick);
  end if;

  -- Add Diplomacy on-hand equal to the nation's Diplomacy production (floored at 0). No-op-safe: a nation
  -- with 0 Diplomacy production banks nothing but still spends the action + starts the cooldown.
  v_amt := greatest(0, coalesce((v_n.production->>'diplomacy')::numeric, 0));
  perform public._nation_stat_add(v_p.nation_id, 'on_hand', 'diplomacy', v_amt, 0, null);
  update public.nations set diplo_until_tick = v_tick + 12 where id = v_p.nation_id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'party',
      'The Foreign Affairs ministry ran a diplomatic outreach, banking ' || trim(to_char(v_amt, 'FM999999990.##'))
        || ' Diplomacy into the national stockpile.',
      public.current_game_date());

  return jsonb_build_object('diplomacy_added', v_amt, 'actions', v_p.influence, 'until', v_tick + 12);
end $$;
grant execute on function public.diplomatic_outreach() to authenticated;

notify pgrst, 'reload schema';
