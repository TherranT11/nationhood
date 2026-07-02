-- ===========================================================================
-- 136 · Seeded world events — the even-month cadence. An admin "seeds" saved world events
-- (world_events.seeded, schema/100) into a pool; every EVEN month (February, April, June,
-- August, October, December) the tick fires ONE random event from that pool. Seeding is how a
-- world event enters the rotation — "fires within 1D24 ticks" in practice, since an even month
-- comes every other tick. Events stay in the pool after firing (they can recur); unseed to remove.
--
-- Month from tick: tick 1 = January, so month index (0=Jan) is (tick-1) % 12. An even calendar
-- month (Feb=2, Apr=4, …) is an ODD index (1,3,5,7,9,11) → ((tick-1) % 12) % 2 = 1.
-- Fires through _world_event_fire (schema/100) — the same worker the admin "Fire now" uses, so
-- there is ONE firing path. Called each tick from _advance_tick (schema/60).
-- Depends on: 100 (world_events.seeded, _world_event_fire). Run after 100.
-- ===========================================================================

create or replace function public._fire_seeded_world_event(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if ((p_tick - 1) % 12) % 2 <> 1 then return; end if;   -- only on even calendar months
  select id into v_id from public.world_events where seeded order by random() limit 1;
  if v_id is null then return; end if;                    -- empty pool → nothing fires this month
  perform public._world_event_fire(v_id);
end $$;
revoke all on function public._fire_seeded_world_event(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
