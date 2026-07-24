-- ===========================================================================
-- 318 · Kingdoms — the card system: catalog + hand + draw / play.
--
-- Each card has a top and a bottom; on play you choose a side. This slice ships the first card (Feast/Feud)
-- and the play flow. Only effects that work on a single house today are executed server-side (Feast-top:
-- −1 Unrest to every holding, +1 House Prestige, pay Gold+Food). Sides needing systems that don't exist yet
-- (Feud, invite/Guest-Bound, Brewery discount, Grand Feast) are stored for display but marked not playable.
--
-- DEFERRED (flagged, not silently dropped):
--   • The full 50-card deck (5 copies each × 10 cards) with draw-without-replacement + reshuffle — premature
--     with one card defined. Draw picks uniformly from the defined cards, capped at a hand of 5.
--   • The "up to 2 cards per turn" cap — there is no turn/tick system yet, so plays are not per-turn limited.
--
-- kingdoms_cards is the ONE source for card cost/text (UI displays it; the play RPC validates cost from it).
-- Depends on: 304, 310 (unrest via 314), 315 (prestige), 317 (food). Idempotent. Apply after 317.
-- ===========================================================================

create table if not exists public.kingdoms_cards (
  card_key  text not null,
  side      text not null check (side in ('top', 'bottom')),
  name      text not null,
  cost_text text,                                  -- shown as "Cost: …"
  cost_gold int  not null default 0,               -- machine cost (used by the play RPC for playable sides)
  cost_food int  not null default 0,
  effects   jsonb not null default '[]'::jsonb,    -- effect bullet lines
  notes     jsonb not null default '[]'::jsonb,    -- italic sub-notes (Guest-Bound, Grand Feast, …)
  playable  boolean not null default false,        -- can this side be resolved server-side today?
  primary key (card_key, side)
);

alter table public.kingdoms_cards enable row level security;
grant select on public.kingdoms_cards to anon, authenticated;   -- catalog is public game data
drop policy if exists "kingdoms_cards_select_all" on public.kingdoms_cards;
create policy "kingdoms_cards_select_all" on public.kingdoms_cards for select using (true);

insert into public.kingdoms_cards (card_key, side, name, cost_text, cost_gold, cost_food, effects, notes, playable) values
  ('feast', 'top', 'Feast', '5 Gold, 3 Food', 5, 3,
   $j$["Remove 1 Unrest from all of your Holdings.","Gain +1 House Prestige.","Invite up to 2 Houses. Any House that accepts becomes Guest-Bound to you until the end of next year.","If you hold a Brewery, pay 1 less Food.","May not be played if you cannot pay the full cost."]$j$::jsonb,
   $j$["Guest-Bound: two Houses bound by hospitality may not declare Feud on one another, nor may either play Assassination, Banditry, Pillage, or Plague against the other.","Grand Feast (optional): pay double cost to remove 2 Unrest instead of 1, gain +2 House Prestige, and invite up to 4 Houses."]$j$::jsonb,
   true),
  ('feast', 'bottom', 'Feud', 'None, if you hold a Grievance. Otherwise −1 House Prestige.', 0, 0,
   $j$["Name one House publicly. Both Houses are now Feuding. This cannot be hidden.","You gain a lawful Cause against that House, satisfying Vassal Wars — Permitted with Cause.","Your Head of House gains +1 Ambition.","While Feuding, neither House may Trade with the other, form a Pact with the other, or attend the other's Feast.","May not target a House that is Guest-Bound to you."]$j$::jsonb,
   $j$["A Grievance is held if that House has played Assassination, Banditry, Pillage, or Plague against you within the past year, or has broken a Pact with you.","Ending a Feud: an accepted Offer Marriage between the two Houses, a payment of 5 Gold accepted by the injured party, or the death of either House's leader."]$j$::jsonb,
   false)
on conflict (card_key, side) do update set
  name = excluded.name, cost_text = excluded.cost_text, cost_gold = excluded.cost_gold,
  cost_food = excluded.cost_food, effects = excluded.effects, notes = excluded.notes, playable = excluded.playable;

-- A house's hand (up to 5 cards). Private: a hand is the player's own — only the owner may read it.
create table if not exists public.kingdoms_hand (
  id         uuid primary key default gen_random_uuid(),
  house_id   uuid not null references public.kingdoms_leaders(id) on delete cascade,
  card_key   text not null,
  created_at timestamptz not null default now()
);
create index if not exists kingdoms_hand_house_idx on public.kingdoms_hand(house_id);

alter table public.kingdoms_hand enable row level security;
grant select on public.kingdoms_hand to authenticated;   -- owner-only (policy below); writes go through RPCs
drop policy if exists "kingdoms_hand_select_own" on public.kingdoms_hand;
create policy "kingdoms_hand_select_own" on public.kingdoms_hand for select
  using (exists (select 1 from public.kingdoms_leaders l where l.id = house_id and l.user_id = auth.uid()));

-- Draw one card into the caller's hand (capped at 5). Picks uniformly from the defined cards (see DEFERRED).
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

  select card_key into v_key from (select distinct card_key from public.kingdoms_cards) c order by random() limit 1;
  if v_key is null then raise exception 'empty_deck'; end if;

  insert into public.kingdoms_hand (house_id, card_key) values (v_house, v_key) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.kingdoms_draw() from public, anon;
grant execute on function public.kingdoms_draw() to authenticated;

-- Play a card from the caller's hand on the chosen side. Validates ownership, that the side is playable, and
-- the cost, then resolves the effect and discards the card. Only Feast-top has a server-side resolution today.
create or replace function public.kingdoms_play_card(p_hand_id uuid, p_side text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house uuid; v_key text; v_res jsonb; v_playable boolean;
  v_cost_gold int; v_cost_food int; v_gold int; v_food int;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;

  select l.id, l.resources, h.card_key into v_house, v_res, v_key
  from public.kingdoms_hand h
  join public.kingdoms_leaders l on l.id = h.house_id
  where h.id = p_hand_id and l.user_id = auth.uid()
  for update of l;
  if v_house is null then raise exception 'not_your_card'; end if;

  select cost_gold, cost_food, playable into v_cost_gold, v_cost_food, v_playable
  from public.kingdoms_cards where card_key = v_key and side = p_side;
  if v_cost_gold is null then raise exception 'unknown_card'; end if;
  if not v_playable then raise exception 'not_playable'; end if;

  v_gold := coalesce((v_res->>'gold')::int, 0);
  v_food := coalesce((v_res->>'food')::int, 0);
  if v_gold < v_cost_gold or v_food < v_cost_food then raise exception 'cannot_pay'; end if;

  -- Pay the cost.
  update public.kingdoms_leaders
     set resources = jsonb_set(jsonb_set(resources, '{gold}', to_jsonb(v_gold - v_cost_gold)),
                               '{food}', to_jsonb(v_food - v_cost_food))
   where id = v_house;

  -- Resolve (only the single-house effects that exist today).
  if v_key = 'feast' and p_side = 'top' then
    update public.kingdoms_counties set unrest = greatest(0, unrest - 1) where held_by = v_house;
    update public.kingdoms_leaders
       set resources = jsonb_set(resources, '{prestige}', to_jsonb(coalesce((resources->>'prestige')::int, 0) + 1))
     where id = v_house;
  end if;

  delete from public.kingdoms_hand where id = p_hand_id;   -- played (discarded)
end;
$$;
revoke all on function public.kingdoms_play_card(uuid, text) from public, anon;
grant execute on function public.kingdoms_play_card(uuid, text) to authenticated;

notify pgrst, 'reload schema';
