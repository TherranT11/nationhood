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
  kind       text not null,                 -- 'rally', 'fundraise', 'admin', ...
  body       text not null,                 -- the fully-rendered, plain-text message
  game_date  text,                          -- in-game date the event occurred
  created_at timestamptz not null default now()
);

-- Admin-fired events (kind = 'admin', written only by admin_fire_event below)
-- carry a structured effect so the feeds can render the coloured pill. Null on
-- every organic event (rallies etc.) — those narrate their outcome in the body.
alter table public.events add column if not exists effect_target text;     -- e.g. 'Order', 'Government Confidence'
alter table public.events add column if not exists effect_value  numeric;  -- the signed delta that was applied
alter table public.events add column if not exists tone          text;     -- 'pos' | 'neg' | 'warn' (pill colour)

alter table public.events enable row level security;
drop policy if exists "events_select_all" on public.events;
create policy "events_select_all" on public.events for select using (true);

-- The current in-game date as "Month, YYYY", from the shared tick (tick 1 =
-- January 1980, one tick per month — MIRRORS tickToDate in util.js; keep the two
-- in sync). One source for stamping events, so once the tick advances every new
-- event reads the right month/year. Defaults to tick 1 if the clock row is gone.
create or replace function public.current_game_date()
returns text
language sql
stable
set search_path = public
as $$
  -- m = months since January 1980 (tick − 1). Month name comes from a literal
  -- array (NOT to_char, which is locale-dependent) so it always matches util.js.
  with t as (select greatest(coalesce((select current_tick from public.game_state where id), 1), 1) - 1 as m)
  select (array['January','February','March','April','May','June','July','August','September','October','November','December'])[(m % 12) + 1]
         || ', ' || (1980 + m / 12)::text
  from t;
$$;

-- A party name with any leading "The " stripped, so the event templates below — which
-- supply their own article ("The …", "the …") — don't render "The The Archon Congress"
-- for a party a player named "The Archon Congress". One source for the rule. The \s+
-- guard means a name like "Theocrats" is left intact (no space → not an article).
create or replace function public._bare_party(p text)
returns text language sql immutable as $$
  select regexp_replace(coalesce(p, ''), '^[Tt]he\s+', '');
$$;

-- Leader actions are server-authoritative (the client can't write the
-- game-controlled columns popularity/pop_floor/funds/actions). Each action below
-- validates + locks the party, rolls 1d6 + a leader stat, applies its own effect,
-- then deducts the cost + 1 action and logs a tiered event. The shared preamble
-- and the strong/middling/poor tiering live in the two helpers so each action
-- stays thin — add the next action with the same two helpers, don't copy them.

-- Auth + lock the signed-in player's party FOR UPDATE (so concurrent actions on
-- the same party serialize and can't double-spend). Returns the locked row;
-- raises if not signed in or the player has no party. The shared first step of
-- every party action — runs in the caller's transaction, so the lock is held
-- through the caller's UPDATE.
create or replace function public._lock_party()
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
  -- Engagement heartbeat: every action / vote / conviction adoption / proposal flows
  -- through here, so this one stamp is the single source for the inactivity metric
  -- (parties.last_active_at, schema/20; read by the admin review, schema/97).
  update public.parties set last_active_at = now() where id = v_p.id;
  return v_p;
end $$;

-- The action cost of a Party Standing action (Rally / Fundraise / Attack / Ad Blitz) — the
-- one source for that cost. The per-tick budget is 12 (schema/20), so this caps standing
-- moves at 3 a tick while leaving room for the cheaper organizational actions (cost 1 each).
create or replace function public._standing_cost()
returns int language sql immutable as $$ select 3 $$;

-- Lock the player's party (via _lock_party) and confirm it has an action to spend
-- and can afford p_cost. Returns the locked row; raises on failure. Standing actions
-- additionally gate on >= _standing_cost() before spending it.
create or replace function public._begin_action(p_cost bigint)
returns public.parties
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype;
begin
  v_p := public._lock_party();
  if v_p.actions_remaining < 1 then raise exception 'No actions left this turn.'; end if;
  if v_p.funds < p_cost then raise exception 'Not enough funds (need $%K).', (p_cost / 1000); end if;
  return v_p;
end $$;

-- strong / middling / poor from a roll total (1d6 + the leader's stat).
create or replace function public._action_tier(p_total int)
returns text
language sql
immutable
as $$ select case when p_total >= 7 then 'strong' when p_total >= 4 then 'middling' else 'poor' end $$;

-- ---------------------------------------------------------------------------
-- party_rally(): 1d6 + Charisma, ÷10, then ×0.5625 (two −25% cuts), added to popularity (capped at ceiling).
-- Costs $25K + a standing action.
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
  if v_p.actions_remaining < public._standing_cost() then raise exception 'Not enough actions left this turn (need %).', public._standing_cost(); end if;
  select coalesce(cha, 0) into v_cha from public.politicians
    where party_id = v_p.id and status = 'Party Leader' order by created_at limit 1;
  v_cha := coalesce(v_cha, 0);

  v_roll  := floor(random() * 6)::int + 1;
  v_total := v_roll + v_cha;
  v_tier  := public._action_tier(v_total);
  v_delta := round((v_total::numeric) / 10.0 * 0.5625, 1);             -- (1d6 + Cha) / 10, ×0.5625 (two −25% cuts)
  v_newpop := least(v_p.popularity + v_delta, public._effective_ceiling(v_p.nation_id, v_p.archetype, v_p.pop_ceiling, v_p.pop_floor)); -- capped at the crowding-adjusted ceiling
  v_newpop := public._mod_cap_raise(v_p.nation_id, v_p.archetype, v_p.popularity, v_newpop); -- archetype ceiling (schema/70)
  v_delta := v_newpop - v_p.popularity;                                 -- amount actually applied

  v_body := 'The ' || public._bare_party(v_p.name) || ' has held a local rally' || case v_tier
    when 'strong'   then ', and it drew record-breaking crowds. Supporters spilled into the streets, the speeches landed, and the morning papers couldn''t ignore it.'
    when 'middling' then '. A steady, respectable turnout filled the hall, the faithful left heartened, even if the city beyond barely noticed.'
    else                 ', but the seats sat half-empty and the speech fell flat. Those who came went home unmoved, and the press stayed away.'
  end || ' Popularity +' || trim(to_char(v_delta, 'FM990.0')) || '%.';

  update public.parties set popularity = v_newpop, funds = funds - v_cost, actions_remaining = actions_remaining - public._standing_cost() where id = v_p.id;
  insert into public.events (nation_id, party_id, kind, body, game_date) values (v_p.nation_id, v_p.id, 'rally', v_body, public.current_game_date());
  return jsonb_build_object('tier', v_tier, 'delta', v_delta, 'popularity', v_newpop, 'funds', v_p.funds - v_cost, 'actions', v_p.actions_remaining - public._standing_cost(), 'body', v_body);
end $$;

grant execute on function public.party_rally() to authenticated;

-- ---------------------------------------------------------------------------
-- Retired actions: party_organize() (a floor move) and party_platform() (a ceiling
-- move) were removed from the player UI. Drop the now-orphaned RPCs so they don't
-- linger on already-provisioned databases. Historical 'organize'/'platform' events
-- remain and render by their body text like any other event.
-- ---------------------------------------------------------------------------
drop function if exists public.party_organize();
drop function if exists public.party_platform();

-- ---------------------------------------------------------------------------
-- party_fundraise(): 1d6 + Charisma, ×$11.25K ($15K −25%), added to Party Funds. No franc
-- cost — only a standing action.
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
  if v_p.actions_remaining < public._standing_cost() then raise exception 'Not enough actions left this turn (need %).', public._standing_cost(); end if;
  select coalesce(cha, 0) into v_cha from public.politicians
    where party_id = v_p.id and status = 'Party Leader' order by created_at limit 1;
  v_cha := coalesce(v_cha, 0);

  v_roll  := floor(random() * 6)::int + 1;
  v_total := v_roll + v_cha;
  v_tier  := public._action_tier(v_total);
  v_haul  := v_total::bigint * 11250;                              -- (1d6 + Cha) × $11.25K ($15K −25%)

  v_body := 'The ' || public._bare_party(v_p.name) || case v_tier
    when 'strong'   then ' has held a fundraising drive, and the cheques poured in. Donors emptied their pockets and new members signed up by the hundred — the war chest has never looked healthier.'
    when 'middling' then ' has been fundraising. A respectable haul came in from the faithful — enough to keep the lights on and a little to spare.'
    else                 ' passed the hat this week, but the donors stayed shy. A thin trickle of small gifts was all the drive could manage.'
  end || ' Funds +$' || (v_haul / 1000) || 'K.';

  update public.parties set funds = funds + v_haul, actions_remaining = actions_remaining - public._standing_cost() where id = v_p.id;
  insert into public.events (nation_id, party_id, kind, body, game_date) values (v_p.nation_id, v_p.id, 'fundraise', v_body, public.current_game_date());
  return jsonb_build_object('tier', v_tier, 'funds_gain', v_haul, 'funds', v_p.funds + v_haul, 'actions', v_p.actions_remaining - public._standing_cost(), 'body', v_body);
end $$;

grant execute on function public.party_fundraise() to authenticated;

-- ---------------------------------------------------------------------------
-- party_attack(target): the ATTACK leader action. 1d6 + the attacker's Acumen vs
-- the target's Resolve (both = the respective Party Leader's stat). Beat it and
-- the margin ÷3 is cut from the target's popularity, down to their floor (never
-- below). Miss (don't beat it) and it backfires: −1% the attacker's OWN
-- popularity. A natural 1 also costs the attacker −1% (not stacked with the miss).
-- $25K + 1 action. The target cut is a single atomic UPDATE (greatest(...,floor))
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
  v_tname text; v_tnation text; v_tarch text; v_toldpop numeric; v_tnewpop numeric;
begin
  v_p := public._begin_action(v_cost);  -- attacker locked + checked
  if v_p.actions_remaining < public._standing_cost() then raise exception 'Not enough actions left this turn (need %).', public._standing_cost(); end if;
  select name, nation_id, archetype, popularity into v_tname, v_tnation, v_tarch, v_toldpop from public.parties where id = p_target;
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
    -- Floor-bounded drop (the same _mod_floor_drop the other drops use): can't fall
    -- below the target's own floor or any archetype floor, and a below-floor target
    -- isn't lifted by the hit. One atomic UPDATE on the row's live popularity, so it
    -- stays race-safe without locking the target row.
    update public.parties
       set popularity = public._mod_floor_drop(v_tnation, v_tarch, popularity, greatest(popularity - v_cut, pop_floor))
     where id = p_target returning popularity into v_tnewpop;
    v_cut := v_toldpop - v_tnewpop;  -- actual amount removed after the floor clamp
  end if;
  v_p_newpop := greatest(v_p.popularity - v_self_pen, v_p.pop_floor);
  v_p_newpop := public._mod_floor_drop(v_p.nation_id, v_p.archetype, v_p.popularity, v_p_newpop); -- attacker's archetype floor (schema/70)
  v_self_pen := round(v_p.popularity - v_p_newpop)::int;  -- honest self-penalty after the floor (0 if grandfathered)

  if v_hit then
    v_body := 'The ' || public._bare_party(v_p.name) || ' went after the ' || public._bare_party(v_tname) || '''s record' || case v_tier
      when 'strong' then ', and the hit landed clean — the press ran with it and the ' || public._bare_party(v_tname) || ' scrambled to respond.'
      else '. The charge stuck well enough to leave a mark.'
    end || ' ' || v_tname || ' popularity −' || trim(to_char(v_cut, 'FM990.0')) || '%.';
  else
    v_body := 'The ' || public._bare_party(v_p.name) || ' tried to smear the ' || public._bare_party(v_tname) || ', but the attack rebounded — the line didn''t land, and it was the ' || public._bare_party(v_p.name) || ' that looked desperate. Popularity −' || trim(to_char(v_self_pen::numeric, 'FM990.0')) || '%.';
  end if;

  update public.parties set popularity = v_p_newpop, funds = funds - v_cost, actions_remaining = actions_remaining - public._standing_cost() where id = v_p.id;
  insert into public.events (nation_id, party_id, kind, body, game_date) values (v_p.nation_id, v_p.id, 'attack', v_body, public.current_game_date());

  return jsonb_build_object('hit', v_hit, 'cut', v_cut, 'self_penalty', v_self_pen, 'target', v_tname, 'actions', v_p.actions_remaining - public._standing_cost(), 'body', v_body);
end $$;

grant execute on function public.party_attack(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- party_ad_blitz(): 1d6 + Guile, ÷3, added to popularity (capped at ceiling).
-- A natural 6 also raises the ceiling +0.5%. $100K + 1 action.
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
  v_cost bigint := 100000; v_tier text; v_body text;
begin
  v_p := public._begin_action(v_cost);
  if v_p.actions_remaining < public._standing_cost() then raise exception 'Not enough actions left this turn (need %).', public._standing_cost(); end if;
  select coalesce(gui, 0) into v_gui from public.politicians
    where party_id = v_p.id and status = 'Party Leader' order by created_at limit 1;
  v_gui := coalesce(v_gui, 0);

  v_roll  := floor(random() * 6)::int + 1;
  v_total := v_roll + v_gui;
  v_tier  := public._action_tier(v_total);
  v_delta := round((v_total::numeric) / 3.0, 1);                        -- (1d6 + Guile) / 3
  v_newpop := least(v_p.popularity + v_delta, public._effective_ceiling(v_p.nation_id, v_p.archetype, v_p.pop_ceiling, v_p.pop_floor)); -- capped at the crowding-adjusted ceiling
  v_newpop := public._mod_cap_raise(v_p.nation_id, v_p.archetype, v_p.popularity, v_newpop); -- archetype ceiling (schema/70)
  v_delta := v_newpop - v_p.popularity;                                 -- amount actually applied
  if v_roll = 6 then v_ceilgain := 0.5; end if;                         -- natural 6 → +0.5% ceiling
  v_newceil := v_p.pop_ceiling + v_ceilgain;

  v_body := 'The ' || public._bare_party(v_p.name) || case v_tier
    when 'strong'   then ' has launched an ad blitz, and it blanketed the airwaves. The slick spots ran on every channel, the slogans stuck, and the polls jumped almost overnight.'
    when 'middling' then ' has put its ads on the air. The campaign reached plenty of living rooms and nudged the numbers — a solid return for the money spent.'
    else                 ' bought up airtime, but the ads fell flat. Forgettable spots in dead-air slots moved few minds, and the spend bought little more than name recognition.'
  end || ' Popularity +' || trim(to_char(v_delta, 'FM990.0')) || '%.';

  update public.parties set popularity = v_newpop, pop_ceiling = v_newceil, funds = funds - v_cost, actions_remaining = actions_remaining - public._standing_cost() where id = v_p.id;
  insert into public.events (nation_id, party_id, kind, body, game_date) values (v_p.nation_id, v_p.id, 'adblitz', v_body, public.current_game_date());

  return jsonb_build_object('tier', v_tier, 'delta', v_delta, 'ceiling_gain', v_ceilgain, 'popularity', v_newpop, 'ceiling', v_newceil, 'actions', v_p.actions_remaining - public._standing_cost(), 'body', v_body);
end $$;

grant execute on function public.party_ad_blitz() to authenticated;

-- ---------------------------------------------------------------------------
-- RECRUIT (Charisma · New Blood) — a two-step action, so it can't reuse the
-- single-shot _begin_action helper. Opening a drive (party_recruit_scout) rolls
-- 1d6 + the leader's Charisma to surface two candidates and charges the $25K
-- drive cost; hiring one (party_recruit_hire) spends the action cost (1 for the
-- Newcomer, 2 for the Seasoned) and adds them to the roster. The candidates are
-- generated + stored server-side, so the stats the player sees are the ones that
-- get hired. Scandals/Traits are deferred until those systems exist.
-- ---------------------------------------------------------------------------

-- Build one candidate: a random Sessau name + p_points stat points spread
-- randomly across the five competencies. Internal helper for the recruit RPCs
-- (not granted to clients — only the security-definer functions below call it).
-- Drop the earlier 3-arg signature (pre nation_names) so re-running doesn't leave
-- an orphaned overload behind.
drop function if exists public._gen_candidate(int, int, int);
create or replace function public._gen_candidate(p_nation text, p_age int, p_exp int, p_points int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first text; v_last text; s int[] := array[0, 0, 0, 0, 0]; i int; k int;
begin
  select first_name, last_name into v_first, v_last from public._random_name(p_nation);   -- shared draw (schema/50)
  for i in 1..greatest(p_points, 0) loop
    k := floor(random() * 5)::int + 1;
    s[k] := s[k] + 1;
  end loop;
  return jsonb_build_object(
    'first_name', coalesce(v_first, '—'), 'last_name', coalesce(v_last, '—'),
    'age', p_age, 'experience', p_exp,
    'cha', s[1], 'acu', s[2], 'gui', s[3], 'res', s[4], 'com', s[5]
  );
end $$;

-- party_recruit_scout(): opens (or re-opens) the recruitment drive. Charges the
-- $25K drive cost the first time and stages a Newcomer (age 25, exp 0, 2 stat
-- points) + Seasoned (age 35–45, 5 stat points, experience = a flat 1d3 — no stat
-- roll). If a drive is already open it just returns it — no re-roll, no second charge.
create or replace function public.party_recruit_scout()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype;
  v_existing jsonb; v_exp int; v_new jsonb; v_seas jsonb; v_cost bigint := 25000;
begin
  v_p := public._lock_party();

  -- A drive already open → return it untouched (no re-roll, no second charge).
  select candidates into v_existing from public.recruit_drives where party_id = v_p.id;
  if found then
    return jsonb_build_object('newcomer', v_existing -> 'newcomer', 'seasoned', v_existing -> 'seasoned',
      'existing', true, 'funds', v_p.funds, 'actions', v_p.actions_remaining);
  end if;

  if v_p.actions_remaining < 1 then raise exception 'No actions left this turn.'; end if;
  if v_p.funds < v_cost then raise exception 'Not enough funds (need $%K).', (v_cost / 1000); end if;

  v_exp := floor(random() * 3)::int + 1;   -- 1d3 years of experience (no stat roll)

  v_new  := public._gen_candidate(v_p.nation_id, 25, 0, 2);
  v_seas := public._gen_candidate(v_p.nation_id, 35 + floor(random() * 11)::int, v_exp, 5);  -- age 35–45

  insert into public.recruit_drives (party_id, candidates)
    values (v_p.id, jsonb_build_object('newcomer', v_new, 'seasoned', v_seas));
  update public.parties set funds = funds - v_cost where id = v_p.id;

  return jsonb_build_object('newcomer', v_new, 'seasoned', v_seas,
    'funds', v_p.funds - v_cost, 'actions', v_p.actions_remaining);
end $$;

grant execute on function public.party_recruit_scout() to authenticated;

-- party_recruit_hire(choice): hires one staged candidate ('newcomer' | 'seasoned'),
-- spends the action cost (1 / 2), adds them to the roster as a Party Member, and
-- closes the drive. The $ cost was already paid when the drive opened.
create or replace function public.party_recruit_hire(p_choice text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p public.parties%rowtype;
  v_cands jsonb; v_c jsonb; v_need int; v_name text; v_id uuid; v_body text;
begin
  if p_choice not in ('newcomer', 'seasoned') then raise exception 'Pick a Newcomer or a Seasoned candidate.'; end if;
  v_p := public._lock_party();

  select candidates into v_cands from public.recruit_drives where party_id = v_p.id;
  if not found then raise exception 'No recruitment drive open — scout first.'; end if;
  v_c := v_cands -> p_choice;
  v_need := case p_choice when 'seasoned' then 2 else 1 end;
  if v_p.actions_remaining < v_need then raise exception 'Not enough actions (need %).', v_need; end if;

  insert into public.politicians (party_id, first_name, last_name, age, experience, status, cha, acu, gui, res, com)
  values (v_p.id, v_c ->> 'first_name', v_c ->> 'last_name', (v_c ->> 'age')::int, (v_c ->> 'experience')::int,
          'Party Member', (v_c ->> 'cha')::int, (v_c ->> 'acu')::int, (v_c ->> 'gui')::int, (v_c ->> 'res')::int, (v_c ->> 'com')::int)
  returning id into v_id;

  update public.parties set actions_remaining = actions_remaining - v_need where id = v_p.id;
  delete from public.recruit_drives where party_id = v_p.id;

  v_name := (v_c ->> 'first_name') || ' ' || (v_c ->> 'last_name');
  if p_choice = 'newcomer' then
    v_body := 'The ' || public._bare_party(v_p.name) || ' has opened its doors to new blood, and the talent came knocking. The ' || public._bare_party(v_p.name) || ' has announced ' || v_name || ' has just joined their ranks. Remember this name.';
  else
    v_body := 'After years working in the party apparatus, ' || v_name || ' has emerged as a name to look out for in the years to come in the ' || public._bare_party(v_p.name) || '.';
  end if;
  insert into public.events (nation_id, party_id, kind, body, game_date) values (v_p.nation_id, v_p.id, 'recruit', v_body, public.current_game_date());

  return jsonb_build_object('choice', p_choice, 'name', v_name, 'politician_id', v_id,
    'actions', v_p.actions_remaining - v_need, 'body', v_body);
end $$;

grant execute on function public.party_recruit_hire(text) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_fire_event(): the /adminsetup Events tab. Admin-only (is_admin gate, same
-- as the other admin writes). APPLIES the chosen effect to the target nation —
-- clamped to that target's band — then logs the descriptive event with its
-- structured effect so both feeds can render the coloured pill. Writing through a
-- security-definer function keeps the events table's no-client-write rule intact.
--
-- Target → where it lives + its band (one source; mirrors the adminsetup dropdown
-- and the nations.stats/economy/production layout in schema/10):
--   stats (rank 1–20, integer): Prosperity, Welfare, Growth, Order, Image
--   economy: Unemployment %, Inflation % (≥0) · Budget (any) · Debt (≥0) · Regime (rank 1–20)
--   production (≥0): Energy, Food, Minerals, Goods, Services, Diplomacy
--   Government Confidence → the nation's active government (0–100); errors if none
--   Party Popularity      → the chosen party in this nation (0–100); p_party required
-- ---------------------------------------------------------------------------
create or replace function public.admin_fire_event(
  p_nation text,
  p_body   text,
  p_target text,
  p_value  numeric,
  p_tone   text,
  p_party  uuid default null
)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n    public.nations%rowtype;
  v_col  text;            -- 'stats' | 'economy' | 'production' | '__gov' | '__party'
  v_key  text;
  v_min  numeric;         -- null = unbounded
  v_max  numeric;
  v_int  boolean := false;
  v_cur  numeric;
  v_new  numeric;
  v_gov  public.governments%rowtype;
  v_pop  numeric;
  v_pid  uuid := null;
  v_ev   public.events%rowtype;
begin
  if not public.is_admin() then raise exception 'Admin only.'; end if;
  if p_body is null or btrim(p_body) = '' then raise exception 'An event needs a description.'; end if;
  if p_value is null then raise exception 'An event needs an effect value.'; end if;  -- guard: a null would write JSON null into the stat
  if p_tone not in ('pos', 'neg', 'warn') then raise exception 'Bad tone.'; end if;

  select * into v_n from public.nations where id = p_nation;
  if not found then raise exception 'No such nation.'; end if;

  case p_target
    when 'Prosperity'     then v_col := 'stats'; v_key := 'prosperity'; v_min := 1; v_max := 20; v_int := true;
    when 'Welfare'        then v_col := 'stats'; v_key := 'welfare';    v_min := 1; v_max := 20; v_int := true;
    when 'Growth'         then v_col := 'stats'; v_key := 'growth';     v_min := 1; v_max := 20; v_int := true;
    when 'Order'          then v_col := 'stats'; v_key := 'order';      v_min := 1; v_max := 20; v_int := true;
    when 'Image'          then v_col := 'stats'; v_key := 'image';      v_min := 1; v_max := 20; v_int := true;
    when 'Unemployment %' then v_col := 'economy'; v_key := 'unemployment'; v_min := 0;
    when 'Inflation %'    then v_col := 'economy'; v_key := 'inflation';    v_min := 0;
    when 'Budget'         then v_col := 'economy'; v_key := 'budget';
    when 'Debt'           then v_col := 'economy'; v_key := 'debt';         v_min := 0;
    when 'Regime'         then v_col := 'economy'; v_key := 'regime';       v_min := 1; v_max := 20; v_int := true;
    when 'Energy'    then v_col := 'production'; v_key := 'energy';    v_min := 0;
    when 'Food'      then v_col := 'production'; v_key := 'food';      v_min := 0;
    when 'Minerals'  then v_col := 'production'; v_key := 'minerals';  v_min := 0;
    when 'Goods'     then v_col := 'production'; v_key := 'goods';     v_min := 0;
    when 'Services'  then v_col := 'production'; v_key := 'services';  v_min := 0;
    when 'Diplomacy' then v_col := 'production'; v_key := 'diplomacy'; v_min := 0;
    when 'Government Confidence' then v_col := '__gov';
    when 'Party Popularity'      then v_col := '__party';
    else raise exception 'Unknown effect target: %', p_target;
  end case;

  if v_col in ('stats', 'economy', 'production') then
    v_cur := public._to_num((case v_col when 'stats' then v_n.stats when 'economy' then v_n.economy else v_n.production end) ->> v_key);
    if p_target = 'Regime' and v_cur is null then
      raise exception 'Regime is not a numeric rank for this nation — set it on the Nations tab first.';
    end if;
    v_cur := coalesce(v_cur, 0);
    v_new := v_cur + p_value;
    if v_min is not null then v_new := greatest(v_new, v_min); end if;
    if v_max is not null then v_new := least(v_new, v_max); end if;
    if v_int then v_new := round(v_new); end if;
    update public.nations set
      stats      = case when v_col = 'stats'      then jsonb_set(stats,      array[v_key], to_jsonb(v_new)) else stats end,
      economy    = case when v_col = 'economy'    then jsonb_set(economy,    array[v_key], to_jsonb(v_new)) else economy end,
      production = case when v_col = 'production' then jsonb_set(production, array[v_key], to_jsonb(v_new)) else production end
    where id = p_nation;

  elsif v_col = '__gov' then
    select * into v_gov from public.governments where nation_id = p_nation and status = 'active';
    if not found then raise exception 'No active government in % to adjust.', v_n.name; end if;
    update public.governments
       set confidence = greatest(0, least(100, coalesce(confidence, 0) + p_value))
     where id = v_gov.id;
    if p_value < 0 then perform public._confidence_collapse(p_nation); end if;  -- a drop to <=10 forces a snap election

  elsif v_col = '__party' then
    if p_party is null then raise exception 'Pick a party for a Party Popularity event.'; end if;
    select popularity into v_pop from public.parties where id = p_party and nation_id = p_nation for update;
    if not found then raise exception 'That party is not in this nation.'; end if;
    update public.parties
       set popularity = greatest(0, least(100, coalesce(popularity, 0) + p_value))
     where id = p_party;
    v_pid := p_party;
  end if;

  insert into public.events (nation_id, party_id, kind, body, game_date, effect_target, effect_value, tone)
  values (p_nation, v_pid, 'admin', btrim(p_body), public.current_game_date(), p_target, p_value, p_tone)
  returning * into v_ev;

  return v_ev;
end $$;

grant execute on function public.admin_fire_event(text, text, text, numeric, text, uuid) to authenticated;

notify pgrst, 'reload schema';
