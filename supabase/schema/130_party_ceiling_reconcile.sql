-- ===========================================================================
-- 130 · Reconcile party popularity to its effective ceiling.
-- A party's EFFECTIVE ceiling (schema/20, _effective_ceiling) is its stored pop_ceiling less
-- the archetype-crowding penalty (−2 per other party sharing its archetype), never below its
-- floor. Every raise/drop action already clamps popularity into [floor, effective ceiling] —
-- but crowding can rise AFTER the fact: a party climbs to its ceiling, then a same-archetype
-- rival is created and the effective ceiling drops beneath the party's current popularity.
-- Nothing pulled popularity down, so it displayed above its own ceiling (the reported bug).
--
-- This is the per-tick enforcement for that invariant — the sibling of _apply_modifier_bounds
-- (schema/70) for party popularity: any party over its effective ceiling is clamped back to it.
-- Only violators are touched. Depends on: 20 (parties, _effective_ceiling). Run after 20.
-- ===========================================================================

create or replace function public._reconcile_party_ceilings()
returns void language plpgsql security definer set search_path = public as $$
begin
  -- First: pop_ceiling can never exceed the party's cap (regime max − permanent conviction
  -- drops, schema/133) — so anything that raised it (national politics) is trimmed back.
  update public.parties p set pop_ceiling = public._party_ceiling_cap(p.id)
   where p.pop_ceiling > public._party_ceiling_cap(p.id);
  -- Then: popularity can't sit above its (now-capped) effective ceiling, less crowding.
  update public.parties p
     set popularity = public._effective_ceiling(p.nation_id, p.archetype, p.pop_ceiling, p.pop_floor)
   where p.popularity > public._effective_ceiling(p.nation_id, p.archetype, p.pop_ceiling, p.pop_floor);
end $$;
revoke all on function public._reconcile_party_ceilings() from public, anon, authenticated;

-- Fix any party already over its effective ceiling right now, so the invariant holds the
-- moment this is applied (not only from the next tick onward).
select public._reconcile_party_ceilings();

notify pgrst, 'reload schema';
