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
-- party_fundraise(): 1d6 + Charisma, ×₣15K, added to Party Funds. A natural 1 on
-- the d6 costs −1 popularity (never below the floor). No franc cost — only 1 action.
-- ---------------------------------------------------------------------------
create or replace function public.party_fundraise()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype; v_cha int; v_roll int; v_total int;
  v_haul bigint; v_penalty int; v_newpop numeric; v_tier text; v_body text;
begin
  v_p := public._begin_action(0);  -- fundraising is free; only the action is spent
  select coalesce(cha, 0) into v_cha from public.politicians
    where party_id = v_p.id and status = 'Party Leader' order by created_at limit 1;
  v_cha := coalesce(v_cha, 0);

  v_roll  := floor(random() * 6)::int + 1;
  v_total := v_roll + v_cha;
  v_tier  := public._action_tier(v_total);
  v_haul  := v_total::bigint * 15000;                              -- (1d6 + Cha) × ₣15K
  v_penalty := case when v_roll = 1 then 1 else 0 end;            -- natural 1 → −1 popularity
  v_newpop := greatest(v_p.popularity - v_penalty, v_p.pop_floor); -- never below the floor

  v_body := 'The ' || v_p.name || case v_tier
    when 'strong'   then ' has held a fundraising drive, and the cheques poured in. Donors emptied their pockets and new members signed up by the hundred — the war chest has never looked healthier.'
    when 'middling' then ' has been fundraising. A respectable haul came in from the faithful — enough to keep the lights on and a little to spare.'
    else                 ' passed the hat this week, but the donors stayed shy. A thin trickle of small gifts was all the drive could manage.'
  end || ' Funds +₣' || (v_haul / 1000) || 'K.';

  update public.parties set funds = funds + v_haul, popularity = v_newpop, actions_remaining = actions_remaining - 1 where id = v_p.id;
  insert into public.events (nation_id, party_id, kind, body, game_date) values (v_p.nation_id, v_p.id, 'fundraise', v_body, 'January, 1980');
  return jsonb_build_object('tier', v_tier, 'funds_gain', v_haul, 'pop_penalty', v_penalty, 'funds', v_p.funds + v_haul, 'popularity', v_newpop, 'actions', v_p.actions_remaining - 1, 'body', v_body);
end $$;

grant execute on function public.party_fundraise() to authenticated;
