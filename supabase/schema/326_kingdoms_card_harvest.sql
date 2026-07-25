-- ===========================================================================
-- 326 · Kingdoms — fifth card: Harvest (top) / Drought (bottom).
--
-- Harvest (top) acts on your own holdings, so it is playable now: every holding produces Food from its
-- food buildings — Farmland 3, Pasture 4, Orchard 2, and each Mill adds +2 per Farmland in that holding —
-- then a single 1D6 season roll is applied to the whole domain (1 halves the yield, 2–5 no change, 6 adds
-- +2 Food and +1 House Prestige). The Food is added to the house's stored Food (which carries over).
-- Drought (bottom) targets another House, so it is stored for display only.
--
-- Building map (from 312): Farmland = 1, Pasture = 2, Orchard = 3, Mill = 4.
-- DEFERRED (flagged): the Drought side (needs other Houses); Pasture's Wool/Livestock (needs a goods/trade
-- system); and "for the remainder of the year" / once-per-year limits (no year/tick cycle exists yet).
-- Redefines kingdoms_play_card (adds the harvest branch) — otherwise unchanged from 324.
-- Depends on: 310 (county population), 312 (building specs), 317 (food resource), 318/324 (cards + turn limit).
-- Idempotent. Apply after 325.
-- ===========================================================================

insert into public.kingdoms_cards (card_key, side, name, cost_text, cost_gold, cost_food, effects, notes, playable) values
  ('harvest', 'top', 'Harvest', 'None', 0, 0,
   $j$["All of your Holdings produce Food. Total the Food produced by your buildings:","Farmland 3 · Pasture 4 · Orchard 2 · Mill +2 to every Farmland in that Holding","Roll 1D6 once for the season, applied to your whole domain:","1 · Poor season. Halve all Food produced, rounded down.","2–5 · Fair season. No change.","6 · Bountiful. +2 Food and +1 House Prestige.","Stored Food carries over between years and feeds Feasts, levies, and Breweries."]$j$::jsonb,
   $j$["Pasture would also yield 1 Wool or Livestock each — tradeable goods await a trade system, so only Food is produced for now."]$j$::jsonb, true),
  ('harvest', 'bottom', 'Drought', 'None', 0, 0,
   $j$["Target one Holding in another House. May not target a Kin-Bound or Guest-Bound House, and may not target the same House twice in one year.","That Holding produces no Food for the remainder of the year and gains 1 Unrest.","If that House has no stored Food, the Holding also loses 1 Population.","An Abbey or Shrine in the Holding negates the Unrest — the people call it the will of heaven, not the failure of their lord."]$j$::jsonb,
   $j$["Drought targets a Holding in another House — stored for display until other Houses exist."]$j$::jsonb, false)
on conflict (card_key, side) do update set
  name = excluded.name, cost_text = excluded.cost_text, cost_gold = excluded.cost_gold,
  cost_food = excluded.cost_food, effects = excluded.effects, notes = excluded.notes, playable = excluded.playable;

-- Redefine the play RPC to resolve Harvest. Otherwise unchanged from 324.
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
  v_gross int; v_crown int; v_net int;
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
  end if;

  update public.kingdoms_leaders set cards_played = cards_played + 1 where id = v_house;   -- count this play
  delete from public.kingdoms_hand where id = p_hand_id;
  return v_msg;
end;
$$;
revoke all on function public.kingdoms_play_card(uuid, text) from public, anon;
grant execute on function public.kingdoms_play_card(uuid, text) to authenticated;

notify pgrst, 'reload schema';
