-- ===========================================================================
-- 334 · Kingdoms — Family as a seventh Priority (starting spouse / children / siblings).
--
-- Family joins the six existing priorities. Its rank decides the household you start with:
--   1 · Spouse + 3 children (6–18) + 2 siblings (35–45)
--   2 · Spouse + 3 children (6–18) + 1 sibling (35–45)
--   3 · Spouse + 2 children (6–18) + 1 sibling (35–45)
--   4 · Spouse + 1 child  (6–12) + 1 sibling (25–35)
--   5 · Spouse + 1 child  (6–12)
--   6 · Spouse
--   7 · Head of House only
-- Spouse: ranks 1–6, auto female name + age 25–35. Siblings are Personalities shown "off to the side" on the
-- Dynasty page as Brother/Sister of the Head (kingdoms_children.relation = 'sibling'); children are 'child'.
--
-- Because a stat can now sit at rank 7, kingdoms_starting_resources gains a seventh value per curve: ranks 1–6
-- are unchanged; at rank 7 the physical stats (Gold/People/Land) floor at 1 and the character stats
-- (Ambition/Prowess/Administration) at 0. kingdoms_found_house now requires all 7 priorities and generates the
-- household. Depends on: 307 (name rosters), 311 (founder + county stats), 321/323 (children + stats).
-- Idempotent. Apply after 333.
-- ===========================================================================

-- Children rows can be a child or a sibling of the head. Existing rows (and A-Child-is-Born births) default 'child'.
alter table public.kingdoms_children
  add column if not exists relation text not null default 'child';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'kingdoms_children_relation_chk') then
    alter table public.kingdoms_children
      add constraint kingdoms_children_relation_chk check (relation in ('child', 'sibling'));
  end if;
end $$;

-- Seven-rank treasury curves. Ranks 1–6 identical to 317; rank 7 = floor (physicals 1, character stats 0).
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
    'gold',           (array[18,15,12,9,6,3,1])[(select rank from r where attr = 'Wealth')],
    'ambition',       (array[6,5,4,3,2,1,0])   [(select rank from r where attr = 'Ambition')],
    'population',     (array[12,10,8,6,4,2,1]) [(select rank from r where attr = 'People')],
    'plots',          (array[10,8,6,4,2,1,1])  [(select rank from r where attr = 'Land')],
    'prowess',        (array[10,7,5,3,1,0,0])  [(select rank from r where attr = 'Prowess')],
    'administration', (array[10,8,6,4,2,1,0])  [(select rank from r where attr = 'Administration')],
    'prestige',       0,
    'food',           0
  );
$$;

-- Founder RPC: now requires all 7 priorities (Family included) and generates the starting household.
create or replace function public.kingdoms_found_house(p_heritage text, p_house_name text, p_priorities jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid; v_name text; v_prio text[]; v_county uuid; v_res jsonb;
  v_valid text[] := array['Wealth', 'Land', 'People', 'Ambition', 'Administration', 'Prowess', 'Family'];
  v_fam int; v_nchild int; v_child_hi int; v_nsib int; v_sib_lo int; v_sib_hi int;
  v_i int; v_g text; v_nm text;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  if p_heritage is distinct from 'Aldren' then raise exception 'heritage_unavailable'; end if;
  v_name := btrim(coalesce(p_house_name, ''));
  if v_name = '' then raise exception 'house_name_required'; end if;

  select array_agg(value) into v_prio from jsonb_array_elements_text(coalesce(p_priorities, '[]'::jsonb));
  if v_prio is null
     or array_length(v_prio, 1) <> 7
     or exists (select 1 from unnest(v_prio) x where x <> all(v_valid))
     or (select count(distinct x) from unnest(v_prio) x) <> 7 then
    raise exception 'invalid_priorities';
  end if;

  v_res := public.kingdoms_starting_resources(p_priorities);

  insert into public.kingdoms_leaders
    (user_id, heritage, house_name, priorities, resources, leader_name, leader_age, leader_gender)
  values
    (auth.uid(), 'Aldren', v_name, p_priorities, v_res,
     public.kingdoms_random_male_name(), 30 + floor(random() * 21)::int, 'male')
  returning id into v_id;

  -- Grant one unheld county; its Available Land + Population mirror the house's starting stats.
  select id into v_county from public.kingdoms_counties
    where held_by is null order by random() limit 1 for update skip locked;
  if v_county is not null then
    update public.kingdoms_counties
       set held_by        = v_id,
           available_land = coalesce((v_res->>'plots')::int, available_land),
           population     = coalesce((v_res->>'population')::int, population)
     where id = v_county;
  end if;

  -- Starting household from the Family priority's rank.
  select ordinality::int into v_fam
  from jsonb_array_elements_text(p_priorities) with ordinality where value = 'Family';
  v_fam := coalesce(v_fam, 7);

  if v_fam <= 6 then                                                     -- Spouse (auto name, age 25–35)
    update public.kingdoms_leaders
       set spouse_name = public.kingdoms_random_female_name(),
           spouse_age  = 25 + floor(random() * 11)::int
     where id = v_id;
  end if;

  v_nchild  := case v_fam when 1 then 3 when 2 then 3 when 3 then 2 when 4 then 1 when 5 then 1 else 0 end;
  v_child_hi := case when v_fam <= 3 then 18 else 12 end;               -- children 6..18 (ranks 1–3) or 6..12 (4–5)
  for v_i in 1 .. v_nchild loop
    v_g  := case when random() < 0.5 then 'male' else 'female' end;
    v_nm := case when v_g = 'male' then public.kingdoms_random_male_name() else public.kingdoms_random_female_name() end;
    insert into public.kingdoms_children (house_id, name, gender, age, relation)
      values (v_id, v_nm, v_g, 6 + floor(random() * (v_child_hi - 6 + 1))::int, 'child');
  end loop;

  v_nsib := case v_fam when 1 then 2 when 2 then 1 when 3 then 1 when 4 then 1 else 0 end;
  v_sib_lo := case when v_fam <= 3 then 35 else 25 end;                 -- siblings 35..45 (ranks 1–3) or 25..35 (rank 4)
  v_sib_hi := case when v_fam <= 3 then 45 else 35 end;
  for v_i in 1 .. v_nsib loop
    v_g  := case when random() < 0.5 then 'male' else 'female' end;
    v_nm := case when v_g = 'male' then public.kingdoms_random_male_name() else public.kingdoms_random_female_name() end;
    insert into public.kingdoms_children (house_id, name, gender, age, relation)
      values (v_id, v_nm, v_g, v_sib_lo + floor(random() * (v_sib_hi - v_sib_lo + 1))::int, 'sibling');
  end loop;

  return v_id;
end;
$$;
revoke all on function public.kingdoms_found_house(text, text, jsonb) from public, anon;
grant execute on function public.kingdoms_found_house(text, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
