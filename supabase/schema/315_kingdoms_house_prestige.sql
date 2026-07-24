-- ===========================================================================
-- 315 · Kingdoms — House Prestige, a house-level stat that starts at 0.
--
-- Prestige is the house's standing (the Laws/Conflict pages already speak of ±Prestige). It lives on the
-- house's `resources` jsonb beside gold/population/… as a flat 0 at founding (not priority-derived). Redefines
-- kingdoms_starting_resources to include 'prestige': 0 (the founder RPC calls it, so new houses get it), and
-- backfills existing houses that lack the key. Distinct from Ambition (the priority-derived lord stat).
-- Depends on: 305, 306. Idempotent. Apply after 314.
-- ===========================================================================

create or replace function public.kingdoms_starting_resources(p_priorities jsonb)
returns jsonb
language sql
immutable
as $$
  with r as (
    select value as attr, ordinality::int as rank
    from jsonb_array_elements_text(coalesce(p_priorities, '[]'::jsonb)) with ordinality
  )
  select jsonb_build_object(
    'gold',           (array[18,15,12,9,6,3])[(select rank from r where attr = 'Wealth')],
    'ambition',       (array[6,5,4,3,2,1])   [(select rank from r where attr = 'Ambition')],
    'population',     (array[12,10,8,6,4,2]) [(select rank from r where attr = 'People')],
    'plots',          (array[10,8,6,4,2,1])  [(select rank from r where attr = 'Land')],
    'prowess',        (array[10,7,5,3,1,0])  [(select rank from r where attr = 'Prowess')],
    'administration', (array[10,8,6,4,2,1])  [(select rank from r where attr = 'Administration')],
    'prestige',       0
  );
$$;

-- Backfill houses founded before this migration: add prestige = 0 where the key is missing.
update public.kingdoms_leaders
   set resources = jsonb_set(resources, '{prestige}', '0'::jsonb)
 where not (resources ? 'prestige');

notify pgrst, 'reload schema';
