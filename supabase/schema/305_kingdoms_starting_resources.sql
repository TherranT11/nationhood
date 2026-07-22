-- ===========================================================================
-- 305 · Kingdoms — starting resources granted to a house at founding.
--
-- Each house begins with resources derived from where it ranked the six priorities (1 = top … 6 = last).
-- The amounts are authored here (kingdoms_starting_resources) — ONE source, server-side so a client can't
-- inflate them — and stored on kingdoms_leaders.resources at founding, so they can later be spent/earned.
--
--   Wealth → Gold        18 15 12 9 6 3        Ambition → Prestige     6 5 4 3 2 1
--   People → Population   12 10  8 6 4 2        Prowess  → Prowess     10 7 5 3 1 0
--   Land   → Plots        10  8  6 4 2 1        Administration → Admin 10 8 6 4 2 1
--
-- kingdoms_found_house (304) is redefined to store resources; existing houses are backfilled. Depends on:
-- 304. Idempotent. Apply after 304.
-- ===========================================================================

alter table public.kingdoms_leaders
  add column if not exists resources jsonb not null default '{}'::jsonb;

-- The starting resources for a priority ranking (one source, used by the RPC and the backfill).
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
    'prestige',       (array[6,5,4,3,2,1])   [(select rank from r where attr = 'Ambition')],
    'population',     (array[12,10,8,6,4,2]) [(select rank from r where attr = 'People')],
    'plots',          (array[10,8,6,4,2,1])  [(select rank from r where attr = 'Land')],
    'prowess',        (array[10,7,5,3,1,0])  [(select rank from r where attr = 'Prowess')],
    'administration', (array[10,8,6,4,2,1])  [(select rank from r where attr = 'Administration')]
  );
$$;

-- Redefine the founder RPC (from 304) to also grant + store the starting resources.
create or replace function public.kingdoms_found_house(p_heritage text, p_house_name text, p_priorities jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid; v_name text; v_prio text[];
  v_valid text[] := array['Wealth', 'Land', 'People', 'Ambition', 'Administration', 'Prowess'];
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  if p_heritage is distinct from 'Aldren' then raise exception 'heritage_unavailable'; end if;
  v_name := btrim(coalesce(p_house_name, ''));
  if v_name = '' then raise exception 'house_name_required'; end if;

  select array_agg(value) into v_prio from jsonb_array_elements_text(coalesce(p_priorities, '[]'::jsonb));
  if v_prio is null
     or array_length(v_prio, 1) <> 6
     or exists (select 1 from unnest(v_prio) x where x <> all(v_valid))
     or (select count(distinct x) from unnest(v_prio) x) <> 6 then
    raise exception 'invalid_priorities';
  end if;

  insert into public.kingdoms_leaders (user_id, heritage, house_name, priorities, resources)
    values (auth.uid(), 'Aldren', v_name, p_priorities, public.kingdoms_starting_resources(p_priorities))
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.kingdoms_found_house(text, text, jsonb) from public, anon;
grant execute on function public.kingdoms_found_house(text, text, jsonb) to authenticated;

-- Backfill houses founded before this migration (their priorities are already validated).
update public.kingdoms_leaders
   set resources = public.kingdoms_starting_resources(priorities)
 where resources = '{}'::jsonb or resources is null;

notify pgrst, 'reload schema';
