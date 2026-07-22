-- ===========================================================================
-- 307 · Kingdoms — each house is led by an auto-generated lord.
--
-- Founding a house now also rolls its lord: a male character with a given name drawn from the Aldric roster
-- and an age randomized 30–50. Generated server-side (in kingdoms_found_house) so it's authoritative.
-- kingdoms_random_male_name() is the ONE source for the name roster (used by the RPC and the backfill).
-- Depends on: 305 (kingdoms_found_house), 306. Idempotent. Apply after 306.
-- ===========================================================================

alter table public.kingdoms_leaders
  add column if not exists leader_name   text,
  add column if not exists leader_age    int,
  add column if not exists leader_gender text not null default 'male';

-- A random Aldric male given name. Volatile (random) → a fresh pick per call / per row.
create or replace function public.kingdoms_random_male_name()
returns text
language sql
volatile
as $$
  select (array[
    'Edric','Alaric','Cedric','Godric','Osric','Aldwin','Beric','Garrick','Wulfric','Leofric',
    'Edmund','Edwin','Eadwin','Aethel','Aethelred','Oswin','Hereward','Dunstan','Roland','Baldwin',
    'Corwin','Hadrian','Reynard','Everard','Tristan','Aldred','Roderic','Halric','Caelan','Branoc',
    'Gawen','Tiber','Lucan','Rowan','Garran','Cedran','Alwyn','Beren','Eamon','Torren',
    'Malric','Harlan','Elric','Corben','Darric','Brynden','Wystan','Percival','Thomlin','Owyn'
  ])[1 + floor(random() * 50)::int];
$$;

-- Redefine the founder RPC (from 305) to also roll the house's lord.
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

  insert into public.kingdoms_leaders
    (user_id, heritage, house_name, priorities, resources, leader_name, leader_age, leader_gender)
  values
    (auth.uid(), 'Aldren', v_name, p_priorities, public.kingdoms_starting_resources(p_priorities),
     public.kingdoms_random_male_name(), 30 + floor(random() * 21)::int, 'male')
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.kingdoms_found_house(text, text, jsonb) from public, anon;
grant execute on function public.kingdoms_found_house(text, text, jsonb) to authenticated;

-- Roll lords for houses founded before this migration.
update public.kingdoms_leaders
   set leader_name = public.kingdoms_random_male_name(),
       leader_age  = 30 + floor(random() * 21)::int
 where leader_name is null;

notify pgrst, 'reload schema';
