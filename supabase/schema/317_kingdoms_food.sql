-- ===========================================================================
-- 317 · Kingdoms — a Food resource (starts at 0).
--
-- Food is a house resource beside Gold (buildings speak of producing/consuming Food, and cards cost it). It
-- lives on the house `resources` jsonb, starting at 0. There is no Food production yet, so a Food cost simply
-- can't be met at the start — that is intended. Redefines kingdoms_starting_resources to include 'food': 0
-- (the founder RPC calls it, so new houses get it) and backfills existing houses. Depends on: 305, 315.
-- Idempotent. Apply after 316.
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
    'prestige',       0,
    'food',           0
  );
$$;

update public.kingdoms_leaders
   set resources = jsonb_set(resources, '{food}', '0'::jsonb)
 where not (resources ? 'food');

notify pgrst, 'reload schema';
