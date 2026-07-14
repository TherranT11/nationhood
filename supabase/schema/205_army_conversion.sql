-- ===========================================================================
-- 205 · Military Stage 2 — convert legacy count Armies into named Infantry units.
--
-- Bridges the Stage-1/Stage-2 overlap: the old count model (military_bases.armies) can't be moved by
-- move_unit (schema/204), which walks NAMED units (military_units). This one-time pass turns every
-- nation's `armies` count into that many named Infantry units — "1st Army", "2nd Army", … — placed at the
-- nation's spawn hex (a city / owned land hex, via _nation_spawn_hex, since a base carries no hex),
-- ready to move immediately, then zeroes the armies count. Fleets and Air Wings are LEFT as the legacy
-- count for now — there is no named naval/air type yet; they convert when those types are built.
--
-- Idempotent: it only reads bases with armies > 0 and zeroes them as it converts, so a re-run (e.g. a
-- full schema_all sync) finds nothing to do. A nation with no placed territory (null spawn hex) is
-- skipped — its armies can't be put on the map — and simply retried harmlessly on a later run.
--
-- KNOWN FOLLOW-UP: the Conflict page still reads the count columns, so a converted nation reads "0
-- Armies" there even though its Infantry now stand on the map (Home → Military filter). Rewiring the
-- Conflict page to the named units is the remaining Stage-2 display step.
--
-- Depends on: 05 (game_state), 127 (military_bases), 199 (military_units, _unit_strength), 101
-- (world_hexes via _nation_spawn_hex). Idempotent.
-- ===========================================================================

do $$
declare n record; v_tick int; v_hex record; i int;
begin
  select coalesce(current_tick, 1) into v_tick from public.game_state where id;
  for n in
    select nation_id, sum(armies)::int as total
      from public.military_bases where armies > 0 group by nation_id
  loop
    select q, r into v_hex from public._nation_spawn_hex(n.nation_id);
    if v_hex.q is null then continue; end if;   -- no placed territory → can't put units on the map; leave as count
    for i in 1..n.total loop
      insert into public.military_units (nation_id, name, unit_type, strength, q, r, ready_tick)
        values (n.nation_id,
                i || (case when i % 100 in (11, 12, 13) then 'th'
                           when i % 10 = 1 then 'st' when i % 10 = 2 then 'nd'
                           when i % 10 = 3 then 'rd' else 'th' end) || ' Army',
                'infantry', public._unit_strength('infantry'), v_hex.q, v_hex.r, v_tick);
    end loop;
    update public.military_bases set armies = 0 where nation_id = n.nation_id and armies > 0;
  end loop;
end $$;
