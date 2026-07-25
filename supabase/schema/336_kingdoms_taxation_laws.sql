-- ===========================================================================
-- 336 · Kingdoms — Taxation reads the realm's Crown Taxation + Right of Toll laws (one source).
--
-- Taxation previously hardcoded a Tithe (gross/10) and a Granted toll (+1/Market). It now reads the standing
-- laws (kingdoms_realm_laws, 335) so decreeing them actually bites:
--   * Crown Taxation: None 0 | Tithe gross/10 | Fifth gross/5 | Half gross/2. A sovereign owes nothing.
--   * Right of Toll: Forbidden +0/Market | Granted +1/Market | Crown Monopoly +1 but only the Crown collects it
--     (a sovereign; a vassal under monopoly owes the toll upward — deferred, so it is simply not gained).
-- Falls back to the realm's starting tiers (Tithe, Granted) if a realm has no stored laws.
--
-- Redefines kingdoms_play_card (taxation branch only) — otherwise byte-identical to 330. The Crown's share is
-- still not deposited anywhere (no Crown treasury yet — deferred, as in 322). Depends on: 330, 335. Idempotent.
-- Apply after 335.
-- ===========================================================================

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
  v_gross int; v_crown int; v_net int; v_mounted boolean; v_skipped int;
  v_heritage text; v_tax_tier int; v_toll_tier int; v_toll_bonus int;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;

  select l.id, l.resources, h.card_key, l.leader_name, l.spouse_name, l.spouse_age, l.spouse_infirm, l.is_sovereign, l.cards_played, l.heritage
    into v_house, v_res, v_key, v_leader, v_spouse, v_spouse_age, v_infirm, v_is_sov, v_played, v_heritage
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
    -- A Holding at 3+ Unrest pays no taxes and is not disturbed (deck-wide Unrest rule); others tax normally.
    -- Crown Taxation + Right of Toll come from the standing laws (one source; fall back to the realm's
    -- starting tiers if unseeded — Tithe, Granted).
    select coalesce(tier, 1) into v_tax_tier from public.kingdoms_realm_laws where heritage = v_heritage and law = 'crown_taxation';
    v_tax_tier := coalesce(v_tax_tier, 1);
    select coalesce(tier, 1) into v_toll_tier from public.kingdoms_realm_laws where heritage = v_heritage and law = 'right_of_toll';
    v_toll_tier := coalesce(v_toll_tier, 1);
    -- Right of Toll: Forbidden +0, Granted +1/Market, Crown Monopoly +1 but only the Crown (sovereign) collects it.
    v_toll_bonus := case v_toll_tier when 1 then 1 when 2 then (case when coalesce(v_is_sov, false) then 1 else 0 end) else 0 end;
    select coalesce(sum(
      (c.population / 2)
      + coalesce(b.market, 0) * (3 + v_toll_bonus)   -- Market base 3 + Right of Toll
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
    where c.held_by = v_house and c.unrest < 3;

    v_crown := case when coalesce(v_is_sov, false) then 0
                    when v_tax_tier = 1 then v_gross / 10
                    when v_tax_tier = 2 then v_gross / 5
                    when v_tax_tier = 3 then v_gross / 2
                    else 0 end;   -- None 0 | Tithe /10 | Fifth /5 | Half /2; a sovereign owes nothing
    v_net := v_gross - v_crown;

    update public.kingdoms_leaders
       set resources = jsonb_set(resources, '{gold}', to_jsonb(coalesce((resources->>'gold')::int, 0) + v_net))
     where id = v_house;
    update public.kingdoms_counties c set unrest = unrest + 1
     where c.held_by = v_house and c.unrest < 3
       and not exists (select 1 from public.kingdoms_holding_buildings b where b.county_id = c.id and b.building_num = 14);

    select count(*) into v_skipped from public.kingdoms_counties where held_by = v_house and unrest >= 3;
    v_msg := 'Your holdings yield ' || v_net || ' Gold'
             || case when v_crown > 0 then ' (the Crown takes ' || v_crown || ')' else '' end || '.'
             || case when v_skipped > 0
                     then ' ' || v_skipped || ' restless holding' || (case when v_skipped = 1 then '' else 's' end) || ' paid nothing.'
                     else '' end;

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
