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

-- ---------------------------------------------------------------------------
-- party_rally(): the RALLY leader action. Server-authoritative because it writes
-- the game-controlled columns (popularity/funds/actions) the client can't. Rolls
-- 1d6 + the Party Leader's Charisma, divides by 10, and adds that to popularity
-- (capped at the ceiling); costs ₣25K and 1 action. Records a tiered event in the
-- feed. The roll happens here (server random) so it can't be gamed.
-- ---------------------------------------------------------------------------
create or replace function public.party_rally()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_p     public.parties%rowtype;
  v_cha   int;
  v_roll  int;
  v_total int;
  v_delta numeric;
  v_newpop numeric;
  v_cost  bigint := 25000;
  v_tier  text;
  v_body  text;
begin
  if v_user is null then raise exception 'Not signed in.'; end if;
  -- FOR UPDATE locks the row so two concurrent rallies can't both pass the
  -- funds/action checks and double-spend (server-side double-fire guard).
  select * into v_p from public.parties where user_id = v_user for update;
  if not found then raise exception 'You have no party.'; end if;
  if v_p.actions_remaining < 1 then raise exception 'No actions left this turn.'; end if;
  if v_p.funds < v_cost then raise exception 'Not enough funds for a rally (need ₣25K).'; end if;

  select coalesce(cha, 0) into v_cha from public.politicians
    where party_id = v_p.id and status = 'Party Leader' order by created_at limit 1;
  v_cha := coalesce(v_cha, 0);

  v_roll  := floor(random() * 6)::int + 1;                 -- 1d6
  v_total := v_roll + v_cha;
  v_delta := round((v_total::numeric) / 10.0, 1);          -- (1d6 + Cha) / 10
  v_newpop := least(v_p.popularity + v_delta, v_p.pop_ceiling::numeric); -- capped at the ceiling
  v_delta := v_newpop - v_p.popularity;                    -- the amount actually applied

  if    v_total >= 7 then v_tier := 'strong';
  elsif v_total >= 4 then v_tier := 'middling';
  else                    v_tier := 'poor';
  end if;

  v_body := 'The ' || v_p.name || ' has held a local rally' || case v_tier
    when 'strong'   then ', and it drew record-breaking crowds. Supporters spilled into the streets, the speeches landed, and the morning papers couldn''t ignore it.'
    when 'middling' then '. A steady, respectable turnout filled the hall, the faithful left heartened, even if the city beyond barely noticed.'
    else                 ', but the seats sat half-empty and the speech fell flat. Those who came went home unmoved, and the press stayed away.'
  end || ' Popularity +' || trim(to_char(v_delta, 'FM990.0')) || '%.';

  update public.parties
     set popularity = v_newpop,
         funds = funds - v_cost,
         actions_remaining = actions_remaining - 1
   where id = v_p.id;

  -- game_date is the frozen start for now; read a real game clock here once it exists.
  insert into public.events (nation_id, party_id, kind, body, game_date)
  values (v_p.nation_id, v_p.id, 'rally', v_body, 'January, 1980');

  return jsonb_build_object(
    'tier', v_tier, 'delta', v_delta, 'popularity', v_newpop,
    'funds', v_p.funds - v_cost, 'actions', v_p.actions_remaining - 1, 'body', v_body
  );
end $$;

grant execute on function public.party_rally() to authenticated;

-- ---------------------------------------------------------------------------
-- party_organize(): the ORGANIZE leader action. Rolls 1d6 + the Party Leader's
-- Command, divides by 6, and adds that to the popularity FLOOR (capped at the
-- ceiling). Popularity never sits below the floor, so it's pulled up to meet a
-- raised floor. Costs ₣25K + 1 action; records a tiered event.
-- ---------------------------------------------------------------------------
create or replace function public.party_organize()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_p     public.parties%rowtype;
  v_com   int;
  v_roll  int;
  v_total int;
  v_delta numeric;
  v_newfloor numeric;
  v_newpop numeric;
  v_cost  bigint := 25000;
  v_tier  text;
  v_body  text;
begin
  if v_user is null then raise exception 'Not signed in.'; end if;
  select * into v_p from public.parties where user_id = v_user for update;
  if not found then raise exception 'You have no party.'; end if;
  if v_p.actions_remaining < 1 then raise exception 'No actions left this turn.'; end if;
  if v_p.funds < v_cost then raise exception 'Not enough funds to organize (need ₣25K).'; end if;

  select coalesce(com, 0) into v_com from public.politicians
    where party_id = v_p.id and status = 'Party Leader' order by created_at limit 1;
  v_com := coalesce(v_com, 0);

  v_roll  := floor(random() * 6)::int + 1;                  -- 1d6
  v_total := v_roll + v_com;
  v_delta := round((v_total::numeric) / 6.0, 1);            -- (1d6 + Command) / 6
  v_newfloor := least(v_p.pop_floor + v_delta, v_p.pop_ceiling::numeric); -- floor capped at the ceiling
  v_delta := v_newfloor - v_p.pop_floor;                    -- amount actually applied
  v_newpop := greatest(v_p.popularity, v_newfloor);         -- popularity is never below the floor

  if    v_total >= 7 then v_tier := 'strong';
  elsif v_total >= 4 then v_tier := 'middling';
  else                    v_tier := 'poor';
  end if;

  v_body := 'The ' || v_p.name || case v_tier
    when 'strong'   then ' has spent the week organizing, and the ground game took hold. New local chapters opened their doors, volunteers signed up in droves, and a base is forming that no rival attack will pry loose.'
    when 'middling' then ' has been organizing on the ground. A few new chapters found their feet and the volunteer rolls grew — steady, unglamorous work that quietly deepens your roots.'
    else                 ' tried to organize this week, but the effort sputtered. Meetings went half-attended, the paperwork stalled, and little took root.'
  end || ' Floor +' || trim(to_char(v_delta, 'FM990.0')) || '%.';

  update public.parties
     set pop_floor = v_newfloor,
         popularity = v_newpop,
         funds = funds - v_cost,
         actions_remaining = actions_remaining - 1
   where id = v_p.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
  values (v_p.nation_id, v_p.id, 'organize', v_body, 'January, 1980');

  return jsonb_build_object(
    'tier', v_tier, 'delta', v_delta, 'floor', v_newfloor, 'popularity', v_newpop,
    'funds', v_p.funds - v_cost, 'actions', v_p.actions_remaining - 1, 'body', v_body
  );
end $$;

grant execute on function public.party_organize() to authenticated;
