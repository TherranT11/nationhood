-- ===========================================================================
-- 186 · International Organizations — the FOUNDING half.
--
-- A nation's Minister of Foreign Affairs charters an organization (name, emblem, type, charter) and
-- invites other nations to join. This migration lays the founding step only: it creates the org
-- (status 'founding'), seats the host as its founding member, records a pending invitation for each
-- invited nation, and charges the host $0.2bn per invitation — added to Public Debt (the treasury is
-- retired). How invitations RESOLVE (accept/decline) and how an org turns 'active' is a separate,
-- deliberately-not-automated step to be built later.
--
-- Depends on: 10 (nations), 20 (parties), 40 (_begin_action, events, current_game_date), 05
-- (game_state), 91 (_nation_stat_add), 30/138 (_party_holds_ministry). Idempotent.
-- ===========================================================================

create table if not exists public.organizations (
  id           uuid primary key default gen_random_uuid(),
  host_nation  text not null references public.nations (id) on delete cascade,
  name         text not null,
  emblem       text not null default '🕊',
  org_type     text not null default 'General',
  charter      text not null default '',
  status       text not null default 'founding',   -- 'founding' | 'active'
  dues         numeric not null default 0,          -- annual dues per member ($bn/yr); 0 until a dues mechanic lands
  founded_tick int,
  created_at   timestamptz not null default now()
);
create index if not exists organizations_host_idx on public.organizations (host_nation);

-- Who belongs to an org. The host joins as 'founder' the moment it's chartered; others become 'member'
-- when their invitation is accepted (later step).
create table if not exists public.organization_members (
  org_id      uuid not null references public.organizations (id) on delete cascade,
  nation_id   text not null references public.nations (id)       on delete cascade,
  role        text not null default 'member',   -- 'founder' | 'member'
  joined_tick int,
  primary key (org_id, nation_id)
);
create index if not exists organization_members_nation_idx on public.organization_members (nation_id);

-- A pending/answered invitation to a nation. One per (org, nation).
create table if not exists public.organization_invitations (
  org_id      uuid not null references public.organizations (id) on delete cascade,
  nation_id   text not null references public.nations (id)       on delete cascade,
  status      text not null default 'pending',   -- 'pending' | 'accepted' | 'declined'
  created_at  timestamptz not null default now(),
  primary key (org_id, nation_id)
);
create index if not exists organization_invitations_nation_idx on public.organization_invitations (nation_id);

-- All three are world-readable (the Intl. Organizations register is public). There is NO client write
-- policy — found_organization (security definer) is the sole writer, so the cost + membership can't be
-- forged from the client.
alter table public.organizations            enable row level security;
alter table public.organization_members     enable row level security;
alter table public.organization_invitations enable row level security;
drop policy if exists "organizations_select_all" on public.organizations;
create policy "organizations_select_all" on public.organizations for select using (true);
drop policy if exists "organization_members_select_all" on public.organization_members;
create policy "organization_members_select_all" on public.organization_members for select using (true);
drop policy if exists "organization_invitations_select_all" on public.organization_invitations;
create policy "organization_invitations_select_all" on public.organization_invitations for select using (true);

-- My party holds the Foreign Affairs portfolio? (mirrors is_trade_minister / is_economic_development_minister)
create or replace function public.is_foreign_affairs_minister()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select public._party_holds_ministry(id, 'Foreign Affairs') from public.parties where user_id = auth.uid()), false);
$$;
grant execute on function public.is_foreign_affairs_minister() to authenticated;

-- found_organization: the Minister of Foreign Affairs charters a new organization and invites nations.
-- Costs 1 Action Point + $0.2bn per invited nation, added to the host's Public Debt. The host becomes
-- the founding member; every invited nation gets a pending invitation. Returns the new org id.
create or replace function public.found_organization(p_name text, p_emblem text, p_type text, p_charter text, p_invited text[])
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_nation text; v_tick int; v_org uuid; v_name text; v_charter text;
  v_inv text[]; v_n text; v_cnt int; v_cost numeric;
begin
  v_name := btrim(coalesce(p_name, ''));
  v_charter := btrim(coalesce(p_charter, ''));
  if v_name = '' then raise exception 'Name the organization.'; end if;
  if length(v_charter) < 40 then raise exception 'Write a charter of at least 40 characters.'; end if;

  v_p := public._begin_action(0);   -- lock caller's party + spend 1 Action Point
  v_nation := v_p.nation_id;
  if not public._party_holds_ministry(v_p.id, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs can found an organization.'; end if;

  -- De-dup the invited list; drop the host itself and any unknown nation id. At least one real invitee.
  select array_agg(distinct n) into v_inv from unnest(coalesce(p_invited, '{}'::text[])) n
   where n is not null and n <> v_nation and exists (select 1 from public.nations where id = n);
  v_cnt := coalesce(array_length(v_inv, 1), 0);
  if v_cnt = 0 then raise exception 'Invite at least one other nation.'; end if;

  select current_tick into v_tick from public.game_state where id;
  v_cost := 0.2 * v_cnt;   -- $0.2bn per invitation, debt-financed

  insert into public.organizations (host_nation, name, emblem, org_type, charter, status, founded_tick)
    values (v_nation, left(v_name, 48),
            coalesce(nullif(btrim(p_emblem), ''), '🕊'),
            coalesce(nullif(btrim(p_type), ''), 'General'),
            left(v_charter, 420), 'founding', v_tick)
    returning id into v_org;
  insert into public.organization_members (org_id, nation_id, role, joined_tick)
    values (v_org, v_nation, 'founder', v_tick);
  foreach v_n in array v_inv loop
    insert into public.organization_invitations (org_id, nation_id) values (v_org, v_n);
  end loop;

  perform public._nation_stat_add(v_nation, 'economy', 'debt', v_cost, 0, null);   -- invitation cost → Public Debt

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'party',
      'The government of ' || coalesce((select name from public.nations where id = v_nation), v_nation) ||
        ' has chartered ' || left(v_name, 48) || ', inviting ' || v_cnt || ' nation' ||
        (case when v_cnt = 1 then '' else 's' end) || ' to join.',
      public.current_game_date());
  return v_org;
end $$;
grant execute on function public.found_organization(text, text, text, text, text[]) to authenticated;

notify pgrst, 'reload schema';
