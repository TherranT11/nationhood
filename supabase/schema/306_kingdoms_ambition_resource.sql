-- ===========================================================================
-- 306 · Rename the Ambition-derived resource from 'prestige' to 'ambition'.
--
-- The resource granted by the Ambition priority is shown as "Ambition" (matching Prowess/Administration,
-- where the attribute name is the resource name), so its stored key becomes 'ambition' too. Redefines
-- kingdoms_starting_resources (305) — kingdoms_found_house calls it, so no separate RPC change — and renames
-- the key on any already-founded houses. Depends on: 305. Idempotent. Apply after 305.
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
    'administration', (array[10,8,6,4,2,1])  [(select rank from r where attr = 'Administration')]
  );
$$;

-- Move the value from the old 'prestige' key to 'ambition' on existing houses.
update public.kingdoms_leaders
   set resources = (resources - 'prestige') || jsonb_build_object('ambition', resources->'prestige')
 where resources ? 'prestige';

notify pgrst, 'reload schema';
