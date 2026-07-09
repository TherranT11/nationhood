-- ===========================================================================
-- 165 · Coalition Health — the government-stability gauge that REPLACES Government
-- Confidence. A government is seated with N hearts (2 + 1 per 2 governing parties,
-- schema/60). Hearts are depleted by:
--   • a debt-to-GDP crisis in January — over 100% of GDP: −1 heart; over 200%: −1
--     heart (schema/125). DEMOCRATIC governments only (autocracies are spared).
--   • a vacant cabinet through the year: −1 heart (schema/138).
--   • a neglected agenda (no national objectives): −1 heart (schema/139).
-- and restored (capped at the formation max) by delivering an agenda item / filling
-- a promised cabinet seat (schema/60).
--
-- When the LAST heart goes, the government falls apart: every governing party loses
-- Party Popularity (−3% for the 100%-debt / vacant / agenda causes, −5% for the
-- 200%-debt cause), an event fires, and a snap election is scheduled for the NEXT
-- tick. There is no partial state — zero hearts = a fallen government.
--
-- Depends on: 10 (nations.next_election_tick), 20 (parties), 40 (events + current_game_date),
-- 60 (governments.coalition_health/_max, _head_of_government_label, resolve_election),
-- 70 (_mod_floor_drop), 91 (_clamp_pop). Run after 60. Apply in the Supabase SQL Editor.
-- ===========================================================================

-- Restore up to p_n hearts, never above the formation max. Returns the new heart
-- count, or null when the government isn't heart-tracked (a legacy row) or is gone.
create or replace function public._coalition_health_restore(p_gov uuid, p_n int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_new int;
begin
  update public.governments
     set coalition_health = least(coalesce(coalition_health_max, coalition_health + p_n), coalition_health + p_n)
   where id = p_gov and status = 'active' and coalition_health is not null
   returning coalition_health into v_new;
  return v_new;
end $$;
revoke all on function public._coalition_health_restore(uuid, int) from public, anon, authenticated;

-- Drop p_n hearts from a nation's active government. If that empties the meter, the
-- government falls apart: all governing parties lose p_penalty Party Popularity
-- (floor-respecting), a collapse event fires, and a snap election is set for p_tick+1.
-- Idempotent within a cycle — once the meter is at zero it no-ops, so several drains
-- in one January can't double-collapse or double-penalise. Untracked (null-health)
-- governments are skipped. ONE source for heart loss + collapse.
create or replace function public._coalition_health_drop(p_nation text, p_n int, p_penalty numeric, p_reason text, p_tick int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_gov public.governments%rowtype; v_new int;
begin
  select * into v_gov from public.governments where nation_id = p_nation and status = 'active';
  if not found or v_gov.coalition_health is null or v_gov.coalition_health <= 0 then return; end if;

  v_new := v_gov.coalition_health - greatest(1, p_n);
  if v_new > 0 then
    update public.governments set coalition_health = v_new where id = v_gov.id;   -- a heart lost; the meter shows it, no separate event
    return;
  end if;

  -- Last heart gone → the government falls apart.
  update public.governments set coalition_health = 0 where id = v_gov.id;
  update public.parties p
     set popularity = public._clamp_pop(public._mod_floor_drop(p_nation, p.archetype, p.popularity, p.popularity - p_penalty))
   where p.nation_id = p_nation and p.in_government;
  update public.nations set next_election_tick = p_tick + 1 where id = p_nation;

  insert into public.events (nation_id, party_id, kind, body, game_date, tone)
    values (p_nation, v_gov.formateur_party_id, 'government',
      p_reason || '. With its last heart of Coalition Health gone, the government of '
      || public._head_of_government_label(p_nation, v_gov.formateur_party_id)
      || ' has fallen apart — every governing party lost ' || trim_scale(p_penalty)
      || '% Party Popularity, and a fresh election will be held next tick.',
      public.current_game_date(), 'neg');
end $$;
revoke all on function public._coalition_health_drop(text, int, numeric, text, int) from public, anon, authenticated;

notify pgrst, 'reload schema';
