-- ===========================================================================
-- 331 · Kingdoms — eighth card: Grant Title (top) / Revoke Title (bottom). Fully deferred (display only).
--
-- Both faces sit on systems that do not exist yet — vassalage, a house holding more than its one (Primary)
-- Holding, cadet-branch / new-House creation, Crown Authority levels, Pacts, Council seats, and Feuding — so
-- neither is playable now. The card is recorded here for the future (full text, playable=false on both sides).
--
-- To avoid ever dealing a card no side can play, kingdoms_draw is redefined to draw only card_keys that have
-- at least one playable side. When vassalage etc. land, flipping a side to playable auto-enters it in the pool.
-- Depends on: 318 (cards + draw). Idempotent. Apply after 330.
-- ===========================================================================

insert into public.kingdoms_cards (card_key, side, name, cost_text, cost_gold, cost_food, effects, notes, playable) values
  ('title', 'top', 'Grant Title', 'None · requires rank of Count or higher', 0, 0,
   $j$["Grant one of your Holdings (not your Primary Estate) to any other Personality, in your House or in another House.","The recipient becomes your Vassal. You gain +1 House Prestige.","You no longer tax that Holding directly — instead you receive 1 Gold per Taxation from that Vassal, plus the Crown's share owed upward.","Granting to a Personality of your own House founds a cadet branch — a new House permanently Kin-Bound to yours.","You may hold Vassals up to your Administration."]$j$::jsonb,
   $j$["Grant Title needs vassalage, a second Holding, and cadet branches — stored for display until those systems exist."]$j$::jsonb, false),
  ('title', 'bottom', 'Revoke Title', 'None', 0, 0,
   $j$["Target one of your Vassals. Legality depends on Crown Authority:","Minimal / Limited — requires a Cause or Grievance.","Moderate or higher — may be done at will.","Roll 1D6. Modifiers: +1 per rank you exceed them, −1 per Pact they hold, −2 if they hold a seat on the King's Council.","4+ · You seize the Holding. They cease to be your Vassal and both Houses become Feuding.","3 or less · They defy you. Lose 2 House Prestige, and every other Vassal of yours may break their oath freely this year."]$j$::jsonb,
   $j$["Revoke Title needs vassalage, Crown Authority, and Feuding — stored for display until those systems exist."]$j$::jsonb, false)
on conflict (card_key, side) do update set
  name = excluded.name, cost_text = excluded.cost_text, cost_gold = excluded.cost_gold,
  cost_food = excluded.cost_food, effects = excluded.effects, notes = excluded.notes, playable = excluded.playable;

-- Redefine kingdoms_draw: only deal card_keys that have at least one playable side (never deal a dead card).
create or replace function public.kingdoms_draw()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_house uuid; v_key text; v_id uuid;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  select id into v_house from public.kingdoms_leaders where user_id = auth.uid() order by created_at desc limit 1;
  if v_house is null then raise exception 'no_house'; end if;
  if (select count(*) from public.kingdoms_hand where house_id = v_house) >= 5 then raise exception 'hand_full'; end if;

  select card_key into v_key from (
    select distinct c.card_key from public.kingdoms_cards c
    where exists (select 1 from public.kingdoms_cards p where p.card_key = c.card_key and p.playable)
  ) d order by random() limit 1;
  if v_key is null then raise exception 'empty_deck'; end if;

  insert into public.kingdoms_hand (house_id, card_key) values (v_house, v_key) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.kingdoms_draw() from public, anon;
grant execute on function public.kingdoms_draw() to authenticated;

notify pgrst, 'reload schema';
