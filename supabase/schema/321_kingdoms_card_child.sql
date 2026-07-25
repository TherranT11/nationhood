-- ===========================================================================
-- 321 · Kingdoms — third card: A Child is Born (top) / Assassination (bottom).
--
-- A Child is Born (top) is self-contained (it acts on your own married spouse), so it is playable now:
-- roll 1D6 against the mother's age, and either a child is born (+1 Population, +1 House Prestige on a strong
-- heir) or a miscarriage (a natural 1 while Elder leaves her Infirm). Assassination (bottom) targets another
-- House, so it is stored for display only.
--
-- Age brackets for the mother (the spouse): Young < 35 (no modifier), Middle 35–44 (−1), Elder 45+ (−3).
-- Adds: spouse_infirm on the leader; kingdoms_children (a house's issue — public game presence, RPC-only
-- writes); the child card; and a redefined kingdoms_play_card that resolves the birth.
-- DEFERRED (flagged): the whole Assassination side (needs other Houses); children are display-only for now
-- (name/sex/age, no stats) — they become full Personalities when a stat/aging system exists.
-- Depends on: 307 (name rosters), 319/320 (spouse). Idempotent. Apply after 320.
-- ===========================================================================

alter table public.kingdoms_leaders
  add column if not exists spouse_infirm boolean not null default false;

-- A house's children (its issue). Public read (dynasty is public presence, like leaders); writes via RPC only.
create table if not exists public.kingdoms_children (
  id         uuid primary key default gen_random_uuid(),
  house_id   uuid not null references public.kingdoms_leaders(id) on delete cascade,
  name       text not null,
  gender     text not null check (gender in ('male', 'female')),
  age        int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists kingdoms_children_house_idx on public.kingdoms_children(house_id);

alter table public.kingdoms_children enable row level security;
grant select on public.kingdoms_children to anon, authenticated;
drop policy if exists "kingdoms_children_select_all" on public.kingdoms_children;
create policy "kingdoms_children_select_all" on public.kingdoms_children for select using (true);

insert into public.kingdoms_cards (card_key, side, name, cost_text, cost_gold, cost_food, effects, notes, playable) values
  ('child', 'top', 'A Child is Born', 'None', 0, 0,
   $j$["Select a married female Personality and roll 1D6.","Modifiers: −1 if she is Middle age, −3 if she is Elder. Cannot be played on an Infirm Personality.","6+ · A strong heir is born. +1 Population, +1 House Prestige.","2–5 · A child is born. +1 Population.","1 or less · Miscarriage. On a natural 1 while Elder, she becomes Infirm.","The child's sex is rolled: evens male, odds female."]$j$::jsonb,
   $j$[]$j$::jsonb, true),
  ('child', 'bottom', 'Assassination', '3 Gold', 3, 0,
   $j$["Target a Personality in another House (not one Kin-Bound or Guest-Bound to you). Roll 1D6.","Modifiers: −2 if the target's Holding has a Watchtower, −2 for a Stone Keep, +1 if your House holds the Spymaster's seat.","5+ · The target dies, no trace. Their House loses any bonuses that Personality provided.","3–4 · The attempt fails, no trace.","1–2 · Discovered. The target's House gains a Grievance against you, you lose 2 House Prestige, and both Houses become Feuding."]$j$::jsonb,
   $j$[]$j$::jsonb, false)
on conflict (card_key, side) do update set
  name = excluded.name, cost_text = excluded.cost_text, cost_gold = excluded.cost_gold,
  cost_food = excluded.cost_food, effects = excluded.effects, notes = excluded.notes, playable = excluded.playable;

-- Redefine the play RPC to resolve A Child is Born. Otherwise unchanged from 320.
create or replace function public.kingdoms_play_card(p_hand_id uuid, p_side text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house uuid; v_key text; v_res jsonb; v_playable boolean;
  v_cost_gold int; v_cost_food int; v_gold int; v_food int;
  v_leader text; v_spouse text; v_spouse_age int; v_infirm boolean;
  v_roll int; v_mod int; v_total int; v_stat text; v_sex text; v_child text; v_msg text;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;

  select l.id, l.resources, h.card_key, l.leader_name, l.spouse_name, l.spouse_age, l.spouse_infirm
    into v_house, v_res, v_key, v_leader, v_spouse, v_spouse_age, v_infirm
  from public.kingdoms_hand h
  join public.kingdoms_leaders l on l.id = h.house_id
  where h.id = p_hand_id and l.user_id = auth.uid()
  for update of l;
  if v_house is null then raise exception 'not_your_card'; end if;

  select cost_gold, cost_food, playable into v_cost_gold, v_cost_food, v_playable
  from public.kingdoms_cards where card_key = v_key and side = p_side;
  if v_cost_gold is null then raise exception 'unknown_card'; end if;
  if not v_playable then raise exception 'not_playable'; end if;

  -- Card-specific preconditions (before any payment).
  if v_key = 'marriage' and p_side = 'bottom' and v_spouse is not null then raise exception 'already_married'; end if;
  if v_key = 'child' and p_side = 'top' then
    if v_spouse is null then raise exception 'no_spouse'; end if;
    if coalesce(v_infirm, false) then raise exception 'infirm'; end if;
  end if;

  v_gold := coalesce((v_res->>'gold')::int, 0);
  v_food := coalesce((v_res->>'food')::int, 0);
  if v_gold < v_cost_gold or v_food < v_cost_food then raise exception 'cannot_pay'; end if;

  update public.kingdoms_leaders
     set resources = jsonb_set(jsonb_set(resources, '{gold}', to_jsonb(v_gold - v_cost_gold)),
                               '{food}', to_jsonb(v_food - v_cost_food))
   where id = v_house;

  if v_key = 'feast' and p_side = 'top' then
    update public.kingdoms_counties set unrest = greatest(0, unrest - 1) where held_by = v_house;
    update public.kingdoms_leaders
       set resources = jsonb_set(resources, '{prestige}', to_jsonb(coalesce((resources->>'prestige')::int, 0) + 1))
     where id = v_house;

  elsif v_key = 'marriage' and p_side = 'bottom' then
    v_spouse := public.kingdoms_random_female_name();
    v_roll := 1 + floor(random() * 6)::int;
    update public.kingdoms_leaders set spouse_name = v_spouse, spouse_age = 25 + floor(random() * 11)::int where id = v_house;
    if v_roll <= 2 then
      update public.kingdoms_leaders
         set resources = jsonb_set(resources, '{prestige}', to_jsonb(coalesce((resources->>'prestige')::int, 0) - 1))
       where id = v_house;
      v_msg := 'A Lowborn match — ' || v_leader || ' weds ' || v_spouse || '. The marriage stands. −1 House Prestige.';
    elsif v_roll <= 4 then
      v_msg := 'A Gentry match — ' || v_leader || ' weds ' || v_spouse || '. The marriage stands.';
    else
      v_stat := case when random() < 0.5 then 'administration' else 'prowess' end;
      update public.kingdoms_leaders
         set resources = jsonb_set(
               jsonb_set(resources, '{prestige}', to_jsonb(coalesce((resources->>'prestige')::int, 0) + 1)),
               array[v_stat], to_jsonb(coalesce((resources->>v_stat)::int, 0) + 1))
       where id = v_house;
      v_msg := 'A Noble match — ' || v_leader || ' weds ' || v_spouse || '. +1 House Prestige, +1 ' || initcap(v_stat) || '.';
    end if;

  elsif v_key = 'child' and p_side = 'top' then
    v_roll := 1 + floor(random() * 6)::int;                                   -- natural roll
    v_mod := case when coalesce(v_spouse_age, 0) >= 45 then -3
                  when coalesce(v_spouse_age, 0) >= 35 then -1 else 0 end;    -- age modifier
    v_total := v_roll + v_mod;
    if v_total <= 1 then
      if v_roll = 1 and coalesce(v_spouse_age, 0) >= 45 then
        update public.kingdoms_leaders set spouse_infirm = true where id = v_house;
        v_msg := 'A miscarriage. ' || v_spouse || ' is left Infirm.';
      else
        v_msg := 'A miscarriage. No child is born this year.';
      end if;
    else
      v_sex := case when (1 + floor(random() * 6)::int) % 2 = 0 then 'male' else 'female' end;   -- evens male, odds female
      v_child := case when v_sex = 'male' then public.kingdoms_random_male_name() else public.kingdoms_random_female_name() end;
      insert into public.kingdoms_children (house_id, name, gender, age) values (v_house, v_child, v_sex, 0);
      update public.kingdoms_leaders
         set resources = jsonb_set(resources, '{population}', to_jsonb(coalesce((resources->>'population')::int, 0) + 1))
       where id = v_house;
      if v_total >= 6 then
        update public.kingdoms_leaders
           set resources = jsonb_set(resources, '{prestige}', to_jsonb(coalesce((resources->>'prestige')::int, 0) + 1))
         where id = v_house;
        v_msg := 'A strong heir! ' || v_spouse || ' bears ' || v_child || ', a ' || (case when v_sex = 'male' then 'son' else 'daughter' end) || '. +1 Population, +1 House Prestige.';
      else
        v_msg := v_spouse || ' bears ' || v_child || ', a ' || (case when v_sex = 'male' then 'son' else 'daughter' end) || '. +1 Population.';
      end if;
    end if;
  end if;

  delete from public.kingdoms_hand where id = p_hand_id;
  return v_msg;
end;
$$;
revoke all on function public.kingdoms_play_card(uuid, text) from public, anon;
grant execute on function public.kingdoms_play_card(uuid, text) to authenticated;

notify pgrst, 'reload schema';
