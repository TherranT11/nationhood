-- ===========================================================================
-- 328 · Kingdoms — seventh card: Muster Levies (top) / Train Knights (bottom).
--
-- The deck's one pair where BOTH faces build your own House — quantity vs quality — so both are playable now.
--
-- Muster Levies (top): raise levies in one Holding, up to that Holding's Levy Capacity = 1 (base) + 2 per
--   Barracks standing there. Each levy costs 1 Population (removed from that Holding AND the house total), and
--   the Holding gains 1 Unrest per 2 levies. Levies pool into a house-wide tally (resources.levies), shown on
--   the Conflict page. Needs a target Holding + a count, so it goes through kingdoms_muster_levies (a picker),
--   not the normal play path — kingdoms_play_card rejects it with 'use_muster'.
-- Train Knights (bottom): 4 Gold, requires a Barracks. Generates a Knight personality (male name) with
--   1D3 Prowess, +1 if you hold Stables (mounted) and +1 if you hold Tournament Grounds. Knights are stored in
--   kingdoms_knights and shown on the Court page. Resolves on the normal play path.
--
-- DEFERRED (flagged): a Knight's 1 Gold/year upkeep and its combat uses (Trial by Combat champion, leading
-- Cavalry, leading a Pillage) — no year/tick cycle or war system yet. Building nums (from 312): Barracks 9,
-- Stables 10, Tournament Grounds 18. Depends on: 307 (name roster), 312/313 (buildings), 318/327 (cards + play
-- RPC + turn limit). Idempotent. Apply after 327.
-- ===========================================================================

-- A house's knights (its trained retinue). Public read (game presence, like children); writes via RPC only.
create table if not exists public.kingdoms_knights (
  id         uuid primary key default gen_random_uuid(),
  house_id   uuid not null references public.kingdoms_leaders(id) on delete cascade,
  name       text not null,
  prowess    int  not null default 1,
  mounted    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists kingdoms_knights_house_idx on public.kingdoms_knights(house_id);

alter table public.kingdoms_knights enable row level security;
grant select on public.kingdoms_knights to anon, authenticated;
drop policy if exists "kingdoms_knights_select_all" on public.kingdoms_knights;
create policy "kingdoms_knights_select_all" on public.kingdoms_knights for select using (true);

insert into public.kingdoms_cards (card_key, side, name, cost_text, cost_gold, cost_food, effects, notes, playable) values
  ('levies', 'top', 'Muster Levies', '1 Population per levy raised', 0, 0,
   $j$["Raise levies in one Holding, up to your Levy Capacity (base 1, plus 2 per Barracks there).","Each levy raised removes 1 Population from that Holding.","The Holding gains 1 Unrest for every 2 levies raised."]$j$::jsonb,
   $j$["Playing Muster Levies opens a picker — choose a Holding and how many levies to raise."]$j$::jsonb, true),
  ('levies', 'bottom', 'Train Knights', '4 Gold · requires a Barracks', 4, 0,
   $j$["Trains a Knight (a new Personality) with 1D3 Prowess.","+1 Prowess if you hold Stables — the Knight is mounted, and may lead Cavalry.","+1 Prowess if you hold Tournament Grounds.","A Knight costs 1 Gold upkeep each year.","A Knight may stand as champion in Trial by Combat, and may lead a Pillage."]$j$::jsonb,
   $j$["Upkeep and combat uses (Trial by Combat, Cavalry, Pillage) await the war/tick systems."]$j$::jsonb, true)
on conflict (card_key, side) do update set
  name = excluded.name, cost_text = excluded.cost_text, cost_gold = excluded.cost_gold,
  cost_food = excluded.cost_food, effects = excluded.effects, notes = excluded.notes, playable = excluded.playable;

-- Muster levies: needs a Muster Levies card in hand + a target Holding + a count. Counts as a play.
create or replace function public.kingdoms_muster_levies(p_county uuid, p_count int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house uuid; v_played int; v_seat text; v_pop int; v_barr int; v_cap int; v_card uuid; v_msg text;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;

  -- The county must be held by a house the caller owns.
  select l.id, coalesce(l.cards_played, 0), c.name, coalesce(c.population, 0)
    into v_house, v_played, v_seat, v_pop
  from public.kingdoms_counties c
  join public.kingdoms_leaders l on l.id = c.held_by
  where c.id = p_county and l.user_id = auth.uid()
  for update of l;
  if v_house is null then raise exception 'not_your_holding'; end if;

  if v_played >= 2 then raise exception 'turn_limit'; end if;
  select id into v_card from public.kingdoms_hand
    where house_id = v_house and card_key = 'levies' order by created_at limit 1;
  if v_card is null then raise exception 'no_muster_card'; end if;

  select count(*) into v_barr from public.kingdoms_holding_buildings where county_id = p_county and building_num = 9;
  v_cap := 1 + 2 * v_barr;                                  -- Levy Capacity = base 1 + 2 per Barracks
  if p_count < 1 or p_count > v_cap then raise exception 'bad_count'; end if;
  if p_count > v_pop then raise exception 'not_enough_people'; end if;

  -- Each levy costs 1 Population (holding + house total); the holding gains 1 Unrest per 2 levies.
  update public.kingdoms_counties
     set population = population - p_count,
         unrest = unrest + (p_count / 2)
   where id = p_county;
  update public.kingdoms_leaders
     set resources = jsonb_set(
           jsonb_set(resources, '{population}', to_jsonb(greatest(0, coalesce((resources->>'population')::int, 0) - p_count))),
           '{levies}', to_jsonb(coalesce((resources->>'levies')::int, 0) + p_count)),
         cards_played = cards_played + 1
   where id = v_house;
  delete from public.kingdoms_hand where id = v_card;

  v_msg := 'You muster ' || p_count || ' ' || (case when p_count = 1 then 'levy' else 'levies' end)
           || ' in ' || v_seat || '. −' || p_count || ' Population'
           || case when (p_count / 2) > 0 then ', +' || (p_count / 2) || ' Unrest' else '' end || '.';
  return v_msg;
end;
$$;
revoke all on function public.kingdoms_muster_levies(uuid, int) from public, anon;
grant execute on function public.kingdoms_muster_levies(uuid, int) to authenticated;

-- Redefine kingdoms_play_card to reject Muster Levies on the normal path (it needs the picker → muster RPC)
-- and to resolve Train Knights. Otherwise byte-identical to 327.
create or replace function public.kingdoms_play_card(p_hand_id uuid, p_side text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house uuid; v_key text; v_res jsonb; v_playable boolean; v_is_sov boolean; v_played int;
  v_cost_gold int; v_cost_food int; v_gold int; v_food int;
  v_leader text; v_spouse text; v_spouse_age int; v_infirm boolean;
  v_roll int; v_mod int; v_total int; v_stat text; v_sex text; v_child text; v_msg text;
  v_gross int; v_crown int; v_net int; v_mounted boolean;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;

  select l.id, l.resources, h.card_key, l.leader_name, l.spouse_name, l.spouse_age, l.spouse_infirm, l.is_sovereign, l.cards_played
    into v_house, v_res, v_key, v_leader, v_spouse, v_spouse_age, v_infirm, v_is_sov, v_played
  from public.kingdoms_hand h
  join public.kingdoms_leaders l on l.id = h.house_id
  where h.id = p_hand_id and l.user_id = auth.uid()
  for update of l;
  if v_house is null then raise exception 'not_your_card'; end if;
  if coalesce(v_played, 0) >= 2 then raise exception 'turn_limit'; end if;   -- at most 2 plays per turn

  select cost_gold, cost_food, playable into v_cost_gold, v_cost_food, v_playable
  from public.kingdoms_cards where card_key = v_key and side = p_side;
  if v_cost_gold is null then raise exception 'unknown_card'; end if;
  if not v_playable then raise exception 'not_playable'; end if;

  if v_key = 'construction' and p_side = 'top' then raise exception 'use_build'; end if;    -- must go through the build picker
  if v_key = 'levies' and p_side = 'top' then raise exception 'use_muster'; end if;         -- must go through the muster picker
  if v_key = 'levies' and p_side = 'bottom'
     and not exists (select 1 from public.kingdoms_counties c
                     join public.kingdoms_holding_buildings b on b.county_id = c.id
                     where c.held_by = v_house and b.building_num = 9) then
    raise exception 'need_barracks';
  end if;
  if v_key = 'marriage' and p_side = 'bottom' and v_spouse is not null then raise exception 'already_married'; end if;
  if v_key = 'child' and p_side = 'top' then
    if v_spouse is null then raise exception 'no_spouse'; end if;
    if coalesce(v_infirm, false) then raise exception 'infirm'; end if;
  end if;
  if v_key = 'taxation' and p_side = 'top'
     and not exists (select 1 from public.kingdoms_counties where held_by = v_house) then
    raise exception 'no_holdings';
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
    v_roll := 1 + floor(random() * 6)::int;
    v_mod := case when coalesce(v_spouse_age, 0) >= 45 then -3
                  when coalesce(v_spouse_age, 0) >= 35 then -1 else 0 end;
    v_total := v_roll + v_mod;
    if v_total <= 1 then
      if v_roll = 1 and coalesce(v_spouse_age, 0) >= 45 then
        update public.kingdoms_leaders set spouse_infirm = true where id = v_house;
        v_msg := 'A miscarriage. ' || v_spouse || ' is left Infirm.';
      else
        v_msg := 'A miscarriage. No child is born this year.';
      end if;
    else
      v_sex := case when (1 + floor(random() * 6)::int) % 2 = 0 then 'male' else 'female' end;
      v_child := case when v_sex = 'male' then public.kingdoms_random_male_name() else public.kingdoms_random_female_name() end;
      insert into public.kingdoms_children (house_id, name, gender, age) values (v_house, v_child, v_sex, 0);
      if v_total >= 6 then
        update public.kingdoms_leaders
           set resources = jsonb_set(resources, '{prestige}', to_jsonb(coalesce((resources->>'prestige')::int, 0) + 1))
         where id = v_house;
        v_msg := 'A strong heir! ' || v_spouse || ' bears ' || v_child || ', a ' || (case when v_sex = 'male' then 'son' else 'daughter' end) || '. +1 House Prestige.';
      else
        v_msg := v_spouse || ' bears ' || v_child || ', a ' || (case when v_sex = 'male' then 'son' else 'daughter' end) || '.';
      end if;
    end if;

  elsif v_key = 'taxation' and p_side = 'top' then
    select coalesce(sum(
      (c.population / 2)
      + coalesce(b.market, 0) * 4
      + coalesce(b.taxoffice, 0) * 4
      + coalesce(b.manor, 0) * 2
      + coalesce(b.noble, 0) * 3
    ), 0) into v_gross
    from public.kingdoms_counties c
    left join (
      select county_id,
        count(*) filter (where building_num = 5)  as market,
        count(*) filter (where building_num = 15) as taxoffice,
        count(*) filter (where building_num = 13) as manor,
        count(*) filter (where building_num = 19) as noble
      from public.kingdoms_holding_buildings group by county_id
    ) b on b.county_id = c.id
    where c.held_by = v_house;

    v_crown := case when coalesce(v_is_sov, false) then 0 else v_gross / 10 end;
    v_net := v_gross - v_crown;

    update public.kingdoms_leaders
       set resources = jsonb_set(resources, '{gold}', to_jsonb(coalesce((resources->>'gold')::int, 0) + v_net))
     where id = v_house;
    update public.kingdoms_counties c set unrest = unrest + 1
     where c.held_by = v_house
       and not exists (select 1 from public.kingdoms_holding_buildings b where b.county_id = c.id and b.building_num = 14);

    v_msg := 'Your holdings yield ' || v_net || ' Gold'
             || case when v_crown > 0 then ' (the Crown takes ' || v_crown || ')' else '' end
             || '. Unrest stirs across your lands.';

  elsif v_key = 'harvest' and p_side = 'top' then
    -- Food produced across all held holdings. Mill adds +2 per Farmland in the same holding (per Mill).
    select coalesce(sum(
        coalesce(b.farmland, 0) * 3
      + coalesce(b.pasture, 0)  * 4
      + coalesce(b.orchard, 0)  * 2
      + coalesce(b.mill, 0) * coalesce(b.farmland, 0) * 2
    ), 0) into v_gross
    from public.kingdoms_counties c
    left join (
      select county_id,
        count(*) filter (where building_num = 1) as farmland,
        count(*) filter (where building_num = 2) as pasture,
        count(*) filter (where building_num = 3) as orchard,
        count(*) filter (where building_num = 4) as mill
      from public.kingdoms_holding_buildings group by county_id
    ) b on b.county_id = c.id
    where c.held_by = v_house;

    v_roll := 1 + floor(random() * 6)::int;   -- one season roll for the whole domain
    if v_roll = 1 then
      v_net := v_gross / 2;                    -- Poor: halve, rounded down (integer division)
      v_msg := 'A poor season — the fields fail. Your holdings yield only ' || v_net || ' Food.';
    elsif v_roll = 6 then
      v_net := v_gross + 2;                    -- Bountiful: +2 Food, +1 House Prestige
      update public.kingdoms_leaders
         set resources = jsonb_set(resources, '{prestige}', to_jsonb(coalesce((resources->>'prestige')::int, 0) + 1))
       where id = v_house;
      v_msg := 'A bountiful season! Your holdings yield ' || v_net || ' Food. +1 House Prestige.';
    else
      v_net := v_gross;                        -- Fair: no change
      v_msg := 'A fair season. Your holdings yield ' || v_net || ' Food.';
    end if;

    update public.kingdoms_leaders
       set resources = jsonb_set(resources, '{food}', to_jsonb(coalesce((resources->>'food')::int, 0) + v_net))
     where id = v_house;

  elsif v_key = 'levies' and p_side = 'bottom' then
    -- Train a Knight: 1D3 Prowess, +1 if Stables (mounted), +1 if Tournament Grounds. (4 Gold already paid.)
    v_mounted := exists (select 1 from public.kingdoms_counties c
                         join public.kingdoms_holding_buildings b on b.county_id = c.id
                         where c.held_by = v_house and b.building_num = 10);
    v_roll := 1 + floor(random() * 3)::int
            + case when v_mounted then 1 else 0 end
            + case when exists (select 1 from public.kingdoms_counties c
                                join public.kingdoms_holding_buildings b on b.county_id = c.id
                                where c.held_by = v_house and b.building_num = 18) then 1 else 0 end;
    v_child := public.kingdoms_random_male_name();
    insert into public.kingdoms_knights (house_id, name, prowess, mounted) values (v_house, v_child, v_roll, v_mounted);
    v_msg := 'Sir ' || v_child || ' takes his oath — Prowess ' || v_roll
             || case when v_mounted then ', mounted' else '' end || '.';
  end if;

  update public.kingdoms_leaders set cards_played = cards_played + 1 where id = v_house;   -- count this play
  delete from public.kingdoms_hand where id = p_hand_id;
  return v_msg;
end;
$$;
revoke all on function public.kingdoms_play_card(uuid, text) from public, anon;
grant execute on function public.kingdoms_play_card(uuid, text) to authenticated;

notify pgrst, 'reload schema';
