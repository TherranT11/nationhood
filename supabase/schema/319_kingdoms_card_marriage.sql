-- ===========================================================================
-- 319 · Kingdoms — the second card: Offer a Marriage (top) / Marry (bottom).
--
-- Marry (bottom) is self-contained ("no other player's consent needed"), so it is playable now: it weds the
-- head of house to a named courtier of the realm and rolls 1D6 for the match — Lowborn (−1 Prestige),
-- Gentry (no change), or Noble (+1 Prestige and +1 Administration or +1 Prowess at random). Offer a Marriage
-- (top) needs another House's personality and an offer/accept flow, so it is stored for display only.
--
-- Adds: spouse_name on the leader (null = unmarried), the Aldric female-name roster, the marriage card, and a
-- redefined kingdoms_play_card that now RETURNS TEXT (a result line the UI shows — Marry narrates its roll;
-- other cards return null). DEFERRED (flagged): selecting among several personalities (only the head exists
-- today, so Marry targets the head), and everything on the Offer side. Depends on: 304, 315, 318.
-- Idempotent. Apply after 318.
-- ===========================================================================

alter table public.kingdoms_leaders
  add column if not exists spouse_name text;   -- the head's spouse (a courtier); null = unmarried

-- The Aldric female given-name roster (courtiers a head may wed). Volatile → a fresh pick per call.
create or replace function public.kingdoms_random_female_name()
returns text
language sql
volatile
as $$
  select (array[
    'Eleanor','Elowen','Isolde','Adela','Rosamund','Beatrice','Edith','Matilda','Aveline','Cecily',
    'Gwendolyn','Rowena','Alina','Evelyne','Marianne','Elsbeth','Lyanna','Anwen','Brenna','Clarice',
    'Isabelle','Helena','Juliana','Meredith','Rhiannon','Sybilla','Theodora','Vivienne','Wynne','Ysabel'
  ])[1 + floor(random() * 30)::int];
$$;

insert into public.kingdoms_cards (card_key, side, name, cost_text, cost_gold, cost_food, effects, notes, playable) values
  ('marriage', 'top', 'Offer a Marriage', 'None (dowry optional, up to 5 Gold)', 0, 0,
   $j$["Select an unmarried Personality of your House, and an unmarried Personality of the opposite sex in another House. Offer that player a marriage.","You may attach a dowry of up to 5 Gold; the dowry is paid only if accepted.","If accepted: both Houses gain +2 House Prestige and become Kin-Bound, and any Feud between them ends immediately.","The bride joins the groom's House. Children born of the match belong to the groom's House.","If refused: no loss. The offer is private."]$j$::jsonb,
   $j$["Kin-Bound: while the marriage stands, neither House may play Assassination, Banditry, Pillage, Plague, or Drought against the other, nor declare Feud."]$j$::jsonb,
   false),
  ('marriage', 'bottom', 'Marry', '1 Gold', 1, 0,
   $j$["Select an unmarried Personality of your House. They wed a courtier of your realm — no other player's consent is needed.","Roll 1D6 for the match:","1–2 · Lowborn — the marriage stands. −1 House Prestige.","3–4 · Gentry — the marriage stands. No change.","5–6 · Noble — the marriage stands. +1 House Prestige, and the Personality gains +1 Administration or +1 Prowess (random).","The Personality may now be targeted by A Child is Born."]$j$::jsonb,
   $j$[]$j$::jsonb,
   true)
on conflict (card_key, side) do update set
  name = excluded.name, cost_text = excluded.cost_text, cost_gold = excluded.cost_gold,
  cost_food = excluded.cost_food, effects = excluded.effects, notes = excluded.notes, playable = excluded.playable;

-- Redefine the play RPC to return a result line (Marry narrates its 1D6 roll; other cards return null).
drop function if exists public.kingdoms_play_card(uuid, text);
create function public.kingdoms_play_card(p_hand_id uuid, p_side text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house uuid; v_key text; v_res jsonb; v_playable boolean;
  v_cost_gold int; v_cost_food int; v_gold int; v_food int;
  v_leader text; v_spouse text; v_roll int; v_stat text; v_msg text;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;

  select l.id, l.resources, h.card_key, l.leader_name, l.spouse_name
    into v_house, v_res, v_key, v_leader, v_spouse
  from public.kingdoms_hand h
  join public.kingdoms_leaders l on l.id = h.house_id
  where h.id = p_hand_id and l.user_id = auth.uid()
  for update of l;
  if v_house is null then raise exception 'not_your_card'; end if;

  select cost_gold, cost_food, playable into v_cost_gold, v_cost_food, v_playable
  from public.kingdoms_cards where card_key = v_key and side = p_side;
  if v_cost_gold is null then raise exception 'unknown_card'; end if;
  if not v_playable then raise exception 'not_playable'; end if;

  -- Card-specific precondition (checked before any payment).
  if v_key = 'marriage' and p_side = 'bottom' and v_spouse is not null then raise exception 'already_married'; end if;

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
    update public.kingdoms_leaders set spouse_name = v_spouse where id = v_house;
    if v_roll <= 2 then
      update public.kingdoms_leaders
         set resources = jsonb_set(resources, '{prestige}', to_jsonb(coalesce((resources->>'prestige')::int, 0) - 1))
       where id = v_house;
      v_msg := 'A Lowborn match — ' || v_leader || ' weds ' || v_spouse || ', a courtier of the realm. The marriage stands. −1 House Prestige.';
    elsif v_roll <= 4 then
      v_msg := 'A Gentry match — ' || v_leader || ' weds ' || v_spouse || ', a courtier of the realm. The marriage stands.';
    else
      v_stat := case when random() < 0.5 then 'administration' else 'prowess' end;
      update public.kingdoms_leaders
         set resources = jsonb_set(
               jsonb_set(resources, '{prestige}', to_jsonb(coalesce((resources->>'prestige')::int, 0) + 1)),
               array[v_stat], to_jsonb(coalesce((resources->>v_stat)::int, 0) + 1))
       where id = v_house;
      v_msg := 'A Noble match — ' || v_leader || ' weds ' || v_spouse || ', a courtier of the realm. +1 House Prestige, +1 ' || initcap(v_stat) || '.';
    end if;
  end if;

  delete from public.kingdoms_hand where id = p_hand_id;   -- played (discarded)
  return v_msg;
end;
$$;
revoke all on function public.kingdoms_play_card(uuid, text) from public, anon;
grant execute on function public.kingdoms_play_card(uuid, text) to authenticated;

notify pgrst, 'reload schema';
