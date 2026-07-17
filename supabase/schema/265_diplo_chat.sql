-- ===========================================================================
-- 265 · Negotiations — diplomatic chat channels between two nations (chat only; no agreements yet).
--
-- A negotiation channel is one row per nation pair (canonical least/greatest, so there's exactly one
-- channel per pair). The Minister of Foreign Affairs opens it (1 Action Point + 1 Diplomacy); once open,
-- the Head of Government, Minister of Trade, or Minister of Foreign Affairs of EITHER nation may post,
-- speaking in that office. Posting is free. Agreements/terms are deliberately out of scope for now.
--
-- Distinct from the COALITION `negotiations` tables (schema/45) — that is party↔party coalition
-- formation inside one nation; this is nation↔nation diplomacy. Different domain, different tables.
--
-- Depends on: 10 (nations), 20 (parties), 40 (_begin_action/_lock_party/events/current_game_date),
-- 60 (governments), 114/174 (_party_holds_ministry), 91/113 (nations.on_hand, _nation_stat_add),
-- 05 (game_state). Idempotent.
-- ===========================================================================

set check_function_bodies = off;

-- One channel per nation pair. nation_a < nation_b (canonical), so the unique constraint enforces
-- a single channel regardless of who opened it. Public-write is off — RPCs are the only writers.
create table if not exists public.diplo_channels (
  id          uuid primary key default gen_random_uuid(),
  nation_a    text not null references public.nations (id) on delete cascade,
  nation_b    text not null references public.nations (id) on delete cascade,
  opened_by   text not null references public.nations (id),
  status      text not null default 'open',   -- 'open' | 'closed'
  opened_tick int,
  created_at  timestamptz not null default now(),
  unique (nation_a, nation_b),
  check (nation_a < nation_b)
);

create table if not exists public.diplo_messages (
  id            uuid primary key default gen_random_uuid(),
  channel_id    uuid not null references public.diplo_channels (id) on delete cascade,
  sender_nation text not null references public.nations (id) on delete cascade,
  sender_party  uuid references public.parties (id) on delete set null,
  role          text not null,   -- 'Head of Government' | 'Minister of Trade' | 'Minister of Foreign Affairs'
  body          text not null,
  created_at    timestamptz not null default now()
);
create index if not exists diplo_messages_channel_idx on public.diplo_messages (channel_id, created_at);

-- RLS: a channel and its messages are readable by parties of EITHER nation on the channel. Writes go
-- only through the security-definer RPCs below.
alter table public.diplo_channels enable row level security;
drop policy if exists "diplo_channels_select" on public.diplo_channels;
create policy "diplo_channels_select" on public.diplo_channels for select using (
  exists (select 1 from public.parties p where p.user_id = auth.uid() and p.nation_id in (nation_a, nation_b))
);
alter table public.diplo_messages enable row level security;
drop policy if exists "diplo_messages_select" on public.diplo_messages;
create policy "diplo_messages_select" on public.diplo_messages for select using (
  exists (select 1 from public.diplo_channels c
            join public.parties p on p.nation_id in (c.nation_a, c.nation_b)
           where c.id = channel_id and p.user_id = auth.uid())
);

-- Does a party hold one of the three offices that may speak on a channel? ONE source (post + my_diplo_roles).
create or replace function public._diplo_holds_role(p_party uuid, p_nation text, p_role text)
returns boolean language sql stable security definer set search_path = public as $$
  select case p_role
    when 'Head of Government' then exists (
      select 1 from public.governments g where g.nation_id = p_nation and g.status = 'active' and g.formateur_party_id = p_party)
    when 'Minister of Trade'            then public._party_holds_ministry(p_party, 'Trade')
    when 'Minister of Foreign Affairs'  then public._party_holds_ministry(p_party, 'Foreign Affairs')
    else false end;
$$;
revoke all on function public._diplo_holds_role(uuid, text, text) from public, anon, authenticated;

-- The offices the signed-in player may speak as (for the client's speak-as picker). Empty if none.
create or replace function public.my_diplo_roles()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(r order by r), '{}') from
    unnest(array['Head of Government', 'Minister of Trade', 'Minister of Foreign Affairs']) r
    cross join lateral (select id, nation_id from public.parties where user_id = auth.uid()) p
   where public._diplo_holds_role(p.id, p.nation_id, r);
$$;
grant execute on function public.my_diplo_roles() to authenticated;

-- Open (or reopen) the channel with another nation. Minister of Foreign Affairs, 1 Action Point + 1 Diplomacy.
create or replace function public.open_diplo_channel(p_target text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_a text; v_b text; v_have numeric;
        v_id uuid; v_status text; v_tick int; v_tname text; v_nname text;
begin
  v_p := public._begin_action(0);   -- lock caller's party + spend 1 Action Point
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs can open a negotiation channel.'; end if;
  if p_target is null or p_target = v_nation then raise exception 'Choose another nation.'; end if;
  if not exists (select 1 from public.nations where id = p_target and not coalesce(dormant, false)) then
    raise exception 'No such nation.'; end if;

  v_a := least(v_nation, p_target); v_b := greatest(v_nation, p_target);
  select id, status into v_id, v_status from public.diplo_channels where nation_a = v_a and nation_b = v_b;
  if v_id is not null and v_status = 'open' then
    raise exception 'You already have an open channel with that nation.'; end if;

  v_have := coalesce((select (on_hand->>'diplomacy')::numeric from public.nations where id = v_nation), 0);
  if v_have < 1 then raise exception 'Opening a channel costs 1 Diplomacy — your nation has %.', floor(v_have); end if;
  perform public._nation_stat_add(v_nation, 'on_hand', 'diplomacy', -1, 0, null);

  select current_tick into v_tick from public.game_state where id;
  if v_id is null then
    insert into public.diplo_channels (nation_a, nation_b, opened_by, opened_tick)
      values (v_a, v_b, v_nation, v_tick) returning id into v_id;
  else
    update public.diplo_channels set status = 'open', opened_by = v_nation, opened_tick = v_tick where id = v_id;
  end if;

  select name into v_tname from public.nations where id = p_target;
  select name into v_nname from public.nations where id = v_nation;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'party',
            coalesce(v_nname, v_nation) || ' opened a negotiation channel with ' || coalesce(v_tname, p_target) || '.',
            public.current_game_date());
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
grant execute on function public.open_diplo_channel(text) to authenticated;

-- Close a channel — either nation's Minister of Foreign Affairs, free.
create or replace function public.close_diplo_channel(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_c public.diplo_channels%rowtype;
begin
  v_p := public._lock_party();
  select * into v_c from public.diplo_channels where id = p_id for update;
  if not found then raise exception 'That channel no longer exists.'; end if;
  if v_p.nation_id not in (v_c.nation_a, v_c.nation_b) then raise exception 'That channel is not yours.'; end if;
  if not public._party_holds_ministry(v_p.id, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs can close a channel.'; end if;
  update public.diplo_channels set status = 'closed' where id = p_id;
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.close_diplo_channel(uuid) to authenticated;

-- Post a message to an open channel, speaking in one of your three offices. Free (posting isn't an action).
create or replace function public.post_diplo_message(p_channel uuid, p_role text, p_body text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_c public.diplo_channels%rowtype; v_body text; v_id uuid;
begin
  v_p := public._lock_party();   -- engagement heartbeat; no Action Point cost
  v_body := btrim(coalesce(p_body, ''));
  if v_body = '' then raise exception 'Write a message.'; end if;
  v_body := left(v_body, 1000);
  select * into v_c from public.diplo_channels where id = p_channel;
  if not found or v_c.status <> 'open' then raise exception 'That channel is not open.'; end if;
  if v_p.nation_id not in (v_c.nation_a, v_c.nation_b) then raise exception 'That channel is not yours.'; end if;
  if not public._diplo_holds_role(v_p.id, v_p.nation_id, p_role) then
    raise exception 'You do not hold that office.'; end if;
  insert into public.diplo_messages (channel_id, sender_nation, sender_party, role, body)
    values (p_channel, v_p.nation_id, v_p.id, p_role, v_body) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
grant execute on function public.post_diplo_message(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
