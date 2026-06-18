-- 40 · Events feed + the leader-action functions (party_rally, …)
-- Depends on: 10 (nations), 20 (parties), 30 (politicians). Run after 30.

-- ---------------------------------------------------------------------------
-- Events: the shared nation news feed (founding events are derived on the
-- client; action outcomes like rallies are stored here). Public read — the feed
-- is shared. There is intentionally NO client write policy: rows are written
-- only by the security-definer action functions below, so the body/outcome can't
-- be forged from the client.
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  nation_id  text not null references public.nations (id),
  party_id   uuid references public.parties (id) on delete cascade,
  kind       text not null,                 -- 'rally', 'fundraise', ...
  body       text not null,                 -- the fully-rendered, plain-text message
  game_date  text,                          -- in-game date the event occurred
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
drop policy if exists "events_select_all" on public.events;
create policy "events_select_all" on public.events for select using (true);

-- Leader actions are server-authoritative (the client can't write the
-- game-controlled columns popularity/pop_floor/funds/actions). Each action below
-- validates + locks the party, rolls 1d6 + a leader stat, applies its own effect,
-- then deducts the cost + 1 action and logs a tiered event. The shared preamble
-- and the strong/middling/poor tiering live in the two helpers so each action
-- stays thin — add the next action with the same two helpers, don't copy them.

-- Validate the signed-in player's party, lock it FOR UPDATE (so concurrent
-- actions can't both pass the checks and double-spend), and confirm it can afford
-- p_cost. Returns the locked row; raises on failure. Runs in the caller's
-- transaction, so the lock is held through the caller's UPDATE.
create or replace function public._begin_action(p_cost bigint)
returns public.parties
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_p    public.parties%rowtype;
begin
  if v_user is null then raise exception 'Not signed in.'; end if;
  select * into v_p from public.parties where user_id = v_user for update;
  if not found then raise exception 'You have no party.'; end if;
  if v_p.actions_remaining < 1 then raise exception 'No actions left this turn.'; end if;
  if v_p.funds < p_cost then raise exception 'Not enough funds (need ₣%K).', (p_cost / 1000); end if;
  return v_p;
end $$;

-- strong / middling / poor from a roll total (1d6 + the leader's stat).
create or replace function public._action_tier(p_total int)
returns text
language sql
immutable
as $$ select case when p_total >= 7 then 'strong' when p_total >= 4 then 'middling' else 'poor' end $$;

-- ---------------------------------------------------------------------------
-- party_rally(): 1d6 + Charisma, ÷10, added to popularity (capped at ceiling).
-- Costs ₣25K + 1 action.
-- ---------------------------------------------------------------------------
create or replace function public.party_rally()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype; v_cha int; v_roll int; v_total int;
  v_delta numeric; v_newpop numeric; v_tier text; v_body text;
  v_cost bigint := 25000;
begin
  v_p := public._begin_action(v_cost);
  select coalesce(cha, 0) into v_cha from public.politicians
    where party_id = v_p.id and status = 'Party Leader' order by created_at limit 1;
  v_cha := coalesce(v_cha, 0);

  v_roll  := floor(random() * 6)::int + 1;
  v_total := v_roll + v_cha;
  v_tier  := public._action_tier(v_total);
  v_delta := round((v_total::numeric) / 10.0, 1);                       -- (1d6 + Cha) / 10
  v_newpop := least(v_p.popularity + v_delta, v_p.pop_ceiling::numeric); -- capped at the ceiling
  v_delta := v_newpop - v_p.popularity;                                 -- amount actually applied

  v_body := 'The ' || v_p.name || ' has held a local rally' || case v_tier
    when 'strong'   then ', and it drew record-breaking crowds. Supporters spilled into the streets, the speeches landed, and the morning papers couldn''t ignore it.'
    when 'middling' then '. A steady, respectable turnout filled the hall, the faithful left heartened, even if the city beyond barely noticed.'
    else                 ', but the seats sat half-empty and the speech fell flat. Those who came went home unmoved, and the press stayed away.'
  end || ' Popularity +' || trim(to_char(v_delta, 'FM990.0')) || '%.';

  update public.parties set popularity = v_newpop, funds = funds - v_cost, actions_remaining = actions_remaining - 1 where id = v_p.id;
  insert into public.events (nation_id, party_id, kind, body, game_date) values (v_p.nation_id, v_p.id, 'rally', v_body, 'January, 1980');
  return jsonb_build_object('tier', v_tier, 'delta', v_delta, 'popularity', v_newpop, 'funds', v_p.funds - v_cost, 'actions', v_p.actions_remaining - 1, 'body', v_body);
end $$;

grant execute on function public.party_rally() to authenticated;

-- ---------------------------------------------------------------------------
-- party_organize(): 1d6 + Command, ÷6, added to the popularity FLOOR (capped at
-- ceiling); popularity is pulled up to never sit below the floor. ₣25K + 1 action.
-- ---------------------------------------------------------------------------
create or replace function public.party_organize()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype; v_com int; v_roll int; v_total int;
  v_delta numeric; v_newfloor numeric; v_newpop numeric; v_tier text; v_body text;
  v_cost bigint := 25000;
begin
  v_p := public._begin_action(v_cost);
  select coalesce(com, 0) into v_com from public.politicians
    where party_id = v_p.id and status = 'Party Leader' order by created_at limit 1;
  v_com := coalesce(v_com, 0);

  v_roll  := floor(random() * 6)::int + 1;
  v_total := v_roll + v_com;
  v_tier  := public._action_tier(v_total);
  v_delta := round((v_total::numeric) / 6.0, 1);                           -- (1d6 + Command) / 6
  v_newfloor := least(v_p.pop_floor + v_delta, v_p.pop_ceiling::numeric);  -- floor capped at the ceiling
  v_delta := v_newfloor - v_p.pop_floor;                                   -- amount actually applied
  v_newpop := greatest(v_p.popularity, v_newfloor);                        -- popularity never below the floor

  v_body := 'The ' || v_p.name || case v_tier
    when 'strong'   then ' has spent the week organizing, and the ground game took hold. New local chapters opened their doors, volunteers signed up in droves, and a base is forming that no rival attack will pry loose.'
    when 'middling' then ' has been organizing on the ground. A few new chapters found their feet and the volunteer rolls grew — steady, unglamorous work that quietly deepens your roots.'
    else                 ' tried to organize this week, but the effort sputtered. Meetings went half-attended, the paperwork stalled, and little took root.'
  end || ' Floor +' || trim(to_char(v_delta, 'FM990.0')) || '%.';

  update public.parties set pop_floor = v_newfloor, popularity = v_newpop, funds = funds - v_cost, actions_remaining = actions_remaining - 1 where id = v_p.id;
  insert into public.events (nation_id, party_id, kind, body, game_date) values (v_p.nation_id, v_p.id, 'organize', v_body, 'January, 1980');
  return jsonb_build_object('tier', v_tier, 'delta', v_delta, 'floor', v_newfloor, 'popularity', v_newpop, 'funds', v_p.funds - v_cost, 'actions', v_p.actions_remaining - 1, 'body', v_body);
end $$;

grant execute on function public.party_organize() to authenticated;

-- ---------------------------------------------------------------------------
-- party_fundraise(): 1d6 + Charisma, ×₣15K, added to Party Funds. No franc cost —
-- only 1 action.
-- ---------------------------------------------------------------------------
create or replace function public.party_fundraise()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype; v_cha int; v_roll int; v_total int;
  v_haul bigint; v_tier text; v_body text;
begin
  v_p := public._begin_action(0);  -- fundraising is free; only the action is spent
  select coalesce(cha, 0) into v_cha from public.politicians
    where party_id = v_p.id and status = 'Party Leader' order by created_at limit 1;
  v_cha := coalesce(v_cha, 0);

  v_roll  := floor(random() * 6)::int + 1;
  v_total := v_roll + v_cha;
  v_tier  := public._action_tier(v_total);
  v_haul  := v_total::bigint * 15000;                              -- (1d6 + Cha) × ₣15K

  v_body := 'The ' || v_p.name || case v_tier
    when 'strong'   then ' has held a fundraising drive, and the cheques poured in. Donors emptied their pockets and new members signed up by the hundred — the war chest has never looked healthier.'
    when 'middling' then ' has been fundraising. A respectable haul came in from the faithful — enough to keep the lights on and a little to spare.'
    else                 ' passed the hat this week, but the donors stayed shy. A thin trickle of small gifts was all the drive could manage.'
  end || ' Funds +₣' || (v_haul / 1000) || 'K.';

  update public.parties set funds = funds + v_haul, actions_remaining = actions_remaining - 1 where id = v_p.id;
  insert into public.events (nation_id, party_id, kind, body, game_date) values (v_p.nation_id, v_p.id, 'fundraise', v_body, 'January, 1980');
  return jsonb_build_object('tier', v_tier, 'funds_gain', v_haul, 'funds', v_p.funds + v_haul, 'actions', v_p.actions_remaining - 1, 'body', v_body);
end $$;

grant execute on function public.party_fundraise() to authenticated;

-- ---------------------------------------------------------------------------
-- party_attack(target): the ATTACK leader action. 1d6 + the attacker's Acumen vs
-- the target's Resolve (both = the respective Party Leader's stat). Beat it and
-- the margin ÷3 is cut from the target's popularity, down to their floor (never
-- below). Miss (don't beat it) and it backfires: −1% the attacker's OWN
-- popularity. A natural 1 also costs the attacker −1% (not stacked with the miss).
-- ₣25K + 1 action. The target cut is a single atomic UPDATE (greatest(...,floor))
-- so it's race-safe without locking the target row (no cross-row deadlock).
-- ---------------------------------------------------------------------------
create or replace function public.party_attack(p_target uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype; v_acu int; v_res int; v_roll int; v_total int;
  v_margin numeric; v_cut numeric := 0; v_self_pen int; v_p_newpop numeric;
  v_cost bigint := 25000; v_hit boolean; v_tier text; v_body text;
  v_tname text; v_tnation text; v_toldpop numeric; v_tnewpop numeric;
begin
  v_p := public._begin_action(v_cost);  -- attacker locked + checked
  select name, nation_id, popularity into v_tname, v_tnation, v_toldpop from public.parties where id = p_target;
  if not found then raise exception 'No such party.'; end if;
  if p_target = v_p.id then raise exception 'You can''t attack your own party.'; end if;
  if v_tnation <> v_p.nation_id then raise exception 'That party isn''t in your nation.'; end if;

  select coalesce(acu, 0) into v_acu from public.politicians where party_id = v_p.id and status = 'Party Leader' order by created_at limit 1;
  v_acu := coalesce(v_acu, 0);
  select coalesce(res, 0) into v_res from public.politicians where party_id = p_target and status = 'Party Leader' order by created_at limit 1;
  v_res := coalesce(v_res, 0);

  v_roll  := floor(random() * 6)::int + 1;
  v_total := v_roll + v_acu;
  v_margin := v_total - v_res;
  v_hit   := v_margin > 0;
  v_tier  := public._action_tier(v_total);
  v_self_pen := case when (not v_hit) or v_roll = 1 then 1 else 0 end;  -- miss or nat-1 → −1% own pop (not stacked)

  if v_hit then
    v_cut := round(v_margin / 3.0, 1);
    update public.parties set popularity = greatest(popularity - v_cut, pop_floor)
      where id = p_target returning popularity into v_tnewpop;
    v_cut := v_toldpop - v_tnewpop;  -- actual amount removed after the floor clamp
  end if;
  v_p_newpop := greatest(v_p.popularity - v_self_pen, v_p.pop_floor);

  if v_hit then
    v_body := 'The ' || v_p.name || ' went after the ' || v_tname || '''s record' || case v_tier
      when 'strong' then ', and the hit landed clean — the press ran with it and the ' || v_tname || ' scrambled to respond.'
      else '. The charge stuck well enough to leave a mark.'
    end || ' ' || v_tname || ' popularity −' || trim(to_char(v_cut, 'FM990.0')) || '%.';
  else
    v_body := 'The ' || v_p.name || ' tried to smear the ' || v_tname || ', but the attack rebounded — the line didn''t land, and it was the ' || v_p.name || ' that looked desperate. Popularity −' || trim(to_char(v_self_pen::numeric, 'FM990.0')) || '%.';
  end if;

  update public.parties set popularity = v_p_newpop, funds = funds - v_cost, actions_remaining = actions_remaining - 1 where id = v_p.id;
  insert into public.events (nation_id, party_id, kind, body, game_date) values (v_p.nation_id, v_p.id, 'attack', v_body, 'January, 1980');

  return jsonb_build_object('hit', v_hit, 'cut', v_cut, 'self_penalty', v_self_pen, 'target', v_tname, 'actions', v_p.actions_remaining - 1, 'body', v_body);
end $$;

grant execute on function public.party_attack(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- party_ad_blitz(): 1d6 + Guile, ÷3, added to popularity (capped at ceiling).
-- A natural 6 also raises the ceiling +0.5%. A strong result raises the nation's
-- Image stat by 1 (paid shine on the airwaves). ₣100K + 1 action.
-- NOTE: this is the first party action that moves a shared NATION stat (Image) —
-- every party in the nation sees that change. Flagged for sign-off.
-- ---------------------------------------------------------------------------
create or replace function public.party_ad_blitz()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype; v_gui int; v_roll int; v_total int;
  v_delta numeric; v_newpop numeric; v_ceilgain numeric := 0; v_newceil numeric;
  v_imggain int := 0; v_cost bigint := 100000; v_tier text; v_body text;
begin
  v_p := public._begin_action(v_cost);
  select coalesce(gui, 0) into v_gui from public.politicians
    where party_id = v_p.id and status = 'Party Leader' order by created_at limit 1;
  v_gui := coalesce(v_gui, 0);

  v_roll  := floor(random() * 6)::int + 1;
  v_total := v_roll + v_gui;
  v_tier  := public._action_tier(v_total);
  v_delta := round((v_total::numeric) / 3.0, 1);                        -- (1d6 + Guile) / 3
  v_newpop := least(v_p.popularity + v_delta, v_p.pop_ceiling);         -- capped at the ceiling
  v_delta := v_newpop - v_p.popularity;                                 -- amount actually applied
  if v_roll = 6 then v_ceilgain := 0.5; end if;                         -- natural 6 → +0.5% ceiling
  v_newceil := v_p.pop_ceiling + v_ceilgain;
  if v_tier = 'strong' then v_imggain := 1; end if;                     -- strong → nation Image +1

  v_body := 'The ' || v_p.name || case v_tier
    when 'strong'   then ' has launched an ad blitz, and it blanketed the airwaves. The slick spots ran on every channel, the slogans stuck, and the polls jumped almost overnight.'
    when 'middling' then ' has put its ads on the air. The campaign reached plenty of living rooms and nudged the numbers — a solid return for the money spent.'
    else                 ' bought up airtime, but the ads fell flat. Forgettable spots in dead-air slots moved few minds, and the spend bought little more than name recognition.'
  end || ' Popularity +' || trim(to_char(v_delta, 'FM990.0')) || '%' || case when v_imggain > 0 then ', Image +1' else '' end || '.';

  update public.parties set popularity = v_newpop, pop_ceiling = v_newceil, funds = funds - v_cost, actions_remaining = actions_remaining - 1 where id = v_p.id;
  if v_imggain > 0 then
    update public.nations set stats = jsonb_set(coalesce(stats, '{}'::jsonb), '{image}', to_jsonb(coalesce((stats->>'image')::numeric, 0) + 1)) where id = v_p.nation_id;
  end if;
  insert into public.events (nation_id, party_id, kind, body, game_date) values (v_p.nation_id, v_p.id, 'adblitz', v_body, 'January, 1980');

  return jsonb_build_object('tier', v_tier, 'delta', v_delta, 'ceiling_gain', v_ceilgain, 'image_gain', v_imggain, 'popularity', v_newpop, 'ceiling', v_newceil, 'actions', v_p.actions_remaining - 1, 'body', v_body);
end $$;

grant execute on function public.party_ad_blitz() to authenticated;
