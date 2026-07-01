-- ===========================================================================
-- 128 · Military capacity — a base holds up to 5 military, so a nation's ceiling is
-- (number of bases) × 5. Each January (called from _advance_tick, schema/60), any military
-- over that ceiling stands down. Military is the nation's on_hand.military count; the base
-- count is the military_bases table (schema/127) — the two single sources, and the ceiling
-- is derived from them, never stored. A nation can briefly exceed the cap (Produce/Trade add
-- to on_hand.military without checking bases); this is where it gets trued up.
-- Example: 7 military, 1 base → ceiling 5 → 2 stand down.
-- Depends on: 10 (nations), 127 (military_bases), 99 (_nation_onhand_add), 40 (current_game_date).
-- ===========================================================================

create or replace function public._resolve_military_capacity(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare n record; v_cap int; v_mil numeric; v_excess numeric;
begin
  if (p_tick - 1) % 12 <> 0 then return; end if;   -- January only (tick 1, 13, 25, …)
  for n in select id, on_hand from public.nations where not coalesce(dormant, false) loop
    v_mil := coalesce((n.on_hand->>'military')::numeric, 0);
    v_cap := 5 * (select count(*) from public.military_bases where nation_id = n.id);   -- 5 per base
    if v_mil > v_cap then
      v_excess := v_mil - v_cap;
      perform public._nation_onhand_add(n.id, 'military', -v_excess);   -- the one on-hand mover (floors at 0)
      insert into public.events (nation_id, kind, body, game_date)
        values (n.id, 'economy',
                v_excess::text || ' military stood down — the nation''s bases can garrison only ' || v_cap || '.',
                public.current_game_date());
    end if;
  end loop;
end $$;
revoke all on function public._resolve_military_capacity(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
