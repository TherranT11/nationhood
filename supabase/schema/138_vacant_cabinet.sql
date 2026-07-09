-- ===========================================================================
-- 138 · Vacant-cabinet penalty — each January, an unstaffed ministry costs confidence.
-- For every live nation with a sitting government, every ministry portfolio left VACANT
-- (no explicit cabinet appointment and no fulfilled ministry promise) docks −1% Government
-- Confidence, applied through _apply_policy_effect (schema/91) — the one clamp source (0–100,
-- with the collapse hook) — and surfaced in the nation's feed. Self-filters to January from
-- _advance_tick (schema/60), a no-op the other eleven months.
-- Also lifts the canonical server ministry list out of _apply_cabinet_slate (schema/60) into
-- _ministries() so the slate validator and this penalty read ONE source (mirrors ministries.js).
-- Depends on: 60 (governments, cabinet_appointments, government_agenda, _advance_tick),
--   91 (_apply_policy_effect), 40 (current_game_date). After 91.
-- ===========================================================================

-- The nation's ministerial portfolios — the ONE server-side source (mirrors MINISTRIES in
-- ministries.js, which the client can't share). _apply_cabinet_slate validates against this and
-- the vacancy count below reads it, so both always agree. INTERNAL.
create or replace function public._ministries()
returns text[] language sql immutable as $$
  select array['Defence', 'Treasury', 'Interior', 'Foreign Affairs', 'Trade',
               'Labour', 'Justice', 'Health', 'Education', 'Energy', 'Economic Development'];
$$;
revoke all on function public._ministries() from public, anon, authenticated;

-- How many portfolios sit vacant for a given government. A ministry is FILLED when it has either
-- an explicit cabinet appointment OR a fulfilled ministry promise (a DONE government_agenda
-- 'ministry' row with a real minister) — the same either-source rule _party_holds_ministry uses
-- (schema/114); everything else is vacant. ONE source for "how empty is this cabinet". INTERNAL.
create or replace function public._vacant_ministry_count(p_gov uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from unnest(public._ministries()) as m
   where not exists (
     select 1 from public.cabinet_appointments ca where ca.government_id = p_gov and ca.ministry = m
   ) and not exists (
     select 1 from public.government_agenda ga
       join public.politicians p on p.id = nullif(ga.params->>'minister_id', '')::uuid
      where ga.government_id = p_gov and ga.type = 'ministry' and ga.status = 'done'
        and ga.params->>'ministry' = m
   );
$$;
revoke all on function public._vacant_ministry_count(uuid) from public, anon, authenticated;

-- The yearly penalty: −1 Coalition Health (one heart) if ANY ministry sits vacant, on every
-- sitting government. Flat — a bare cabinet costs one heart, not one per empty seat.
create or replace function public._resolve_vacant_cabinet(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare n record; v_vacant int;
begin
  if (p_tick - 1) % 12 <> 0 then return; end if;   -- January only (tick 1, 13, 25, …)
  for n in
    select g.id as gov_id, g.nation_id
      from public.governments g
      join public.nations nat on nat.id = g.nation_id
     where g.status = 'active' and not coalesce(nat.dormant, false)
  loop
    v_vacant := public._vacant_ministry_count(n.gov_id);
    if v_vacant > 0 then
      -- A cabinet left with empty seats costs the government a heart of Coalition Health for the year.
      -- At zero hearts the government falls apart (−3% Party Popularity to governing parties, snap
      -- election next tick). ONE source for the drop + collapse: _coalition_health_drop (schema/165).
      perform public._coalition_health_drop(n.nation_id, 1, 3,
        v_vacant || ' cabinet ' || (case when v_vacant = 1 then 'ministry' else 'ministries' end)
        || ' sat vacant through the year and the government''s coalition health suffered', p_tick);
    end if;
  end loop;
end $$;
revoke all on function public._resolve_vacant_cabinet(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
