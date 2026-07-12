-- ===========================================================================
-- 189 · International Organizations — the Charter Convention + the Assembly Floor.
--
-- Between Responses and Ratification the founding members hold a Charter Convention: they VOTE, article
-- by article, on the six charter articles. Each member (the founder + every accepted nation) casts one
-- vote per article through its Foreign Affairs minister; an article resolves to the option with a STRICT
-- plurality of the votes cast (a tie is undecided). The host can only ratify once every article is
-- decided (and at least two nations have accepted, per schema/188) — ratification snapshots the winning
-- options into the org's charter and flips it 'active'.
--
-- Also lays the Assembly Floor: a member-only message board (organization_messages) that members talk on
-- during the Convention and after. Everything here is PLAYER-DRIVEN — no ticks, no timers. Convention
-- voting and posting are free (org-internal); the national diplomatic acts (respond/ratify, schema/188)
-- keep their 1 AP. Org-action economics (Cohesion) are a later pass.
--
-- Depends on: 186 (organizations/_members/_invitations), 188 (ratify_organization), 40 (_begin_action,
-- events, current_game_date, _party_holds_ministry via 114), 05 (game_state), 20 (parties). Idempotent.
-- ===========================================================================

-- The ratified charter (one option per article), null until the org is ratified.
alter table public.organizations add column if not exists charter_articles jsonb;

-- The valid articles and the options each admits — the ONE source, read by ballot validation and the
-- ratification tally (and mirrored, for labels only, by the client). Keys are the six articles; each
-- value is the array of option ids that article accepts.
create or replace function public._org_charter_catalog()
returns jsonb language sql immutable set search_path = public as $$
  select jsonb_build_object(
    'accession', jsonb_build_array('open', 'closed'),
    'voting',    jsonb_build_array('equal', 'gdp'),
    'admission', jsonb_build_array('majority', 'unanimous'),
    'chair',     jsonb_build_array('rotating', 'fixed'),
    'expulsion', jsonb_build_array('unanimous', 'majority', 'none'),
    'dues',      jsonb_build_array('gdp', 'fixed', 'none')
  );
$$;

-- One member's vote on one article of one org. Re-voting updates the row.
create table if not exists public.organization_charter_votes (
  org_id     uuid not null references public.organizations (id) on delete cascade,
  nation_id  text not null references public.nations (id)       on delete cascade,
  article    text not null,
  option     text not null,
  created_at timestamptz not null default now(),
  primary key (org_id, nation_id, article)
);
create index if not exists organization_charter_votes_org_idx on public.organization_charter_votes (org_id);

-- The Assembly Floor: a member-only message board, one row per message.
create table if not exists public.organization_messages (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  nation_id  text not null references public.nations (id)       on delete cascade,
  party_id   uuid references public.parties (id)                on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists organization_messages_org_idx on public.organization_messages (org_id, created_at);

-- Both are readable ONLY by the org's members (their party's nation seated in organization_members) — the
-- Convention tallies and the floor are internal. No client write; the RPCs below (security definer) are
-- the sole writers.
alter table public.organization_charter_votes enable row level security;
alter table public.organization_messages      enable row level security;
drop policy if exists "org_charter_votes_select_member" on public.organization_charter_votes;
create policy "org_charter_votes_select_member" on public.organization_charter_votes for select using (
  exists (select 1 from public.organization_members m join public.parties p on p.nation_id = m.nation_id
           where m.org_id = organization_charter_votes.org_id and p.user_id = auth.uid()));
drop policy if exists "org_messages_select_member" on public.organization_messages;
create policy "org_messages_select_member" on public.organization_messages for select using (
  exists (select 1 from public.organization_members m join public.parties p on p.nation_id = m.nation_id
           where m.org_id = organization_messages.org_id and p.user_id = auth.uid()));

-- The strict-plurality winner of an article, or null if there are no votes or the top option is tied.
create or replace function public._org_article_winner(p_org uuid, p_article text)
returns text language sql stable security definer set search_path = public as $$
  with tally as (
    select option, count(*)::int c from public.organization_charter_votes
     where org_id = p_org and article = p_article group by option)
  select case when (select count(*) from tally where c = (select max(c) from tally)) = 1
              then (select option from tally order by c desc limit 1) end;
$$;
revoke all on function public._org_article_winner(uuid, text) from public, anon, authenticated;

-- cast_charter_ballot: a founding member's Foreign Affairs minister records its vote on one or more
-- articles ({article: option, …}). Free (org-internal). Validates each article + option against the
-- catalog and that the caller's nation is a seated member of a still-founding org.
create or replace function public.cast_charter_ballot(p_org uuid, p_votes jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_nation text; v_status text; v_cat jsonb; k text; v text;
begin
  v_uid := auth.uid(); if v_uid is null then raise exception 'Not signed in.'; end if;
  if p_votes is null or jsonb_typeof(p_votes) <> 'object' or p_votes = '{}'::jsonb then
    raise exception 'Cast a vote on at least one article.'; end if;

  select id, nation_id into v_pid, v_nation from public.parties where user_id = v_uid;
  if v_pid is null then raise exception 'You have no party.'; end if;
  if not public._party_holds_ministry(v_pid, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs casts your nation''s charter vote.'; end if;

  select status into v_status from public.organizations where id = p_org;
  if not found then raise exception 'No such organization.'; end if;
  if v_status <> 'founding' then raise exception 'The charter is settled — this organization is no longer in convention.'; end if;
  if not exists (select 1 from public.organization_members where org_id = p_org and nation_id = v_nation) then
    raise exception 'Only a member of the founding convention may vote on its charter.'; end if;

  v_cat := public._org_charter_catalog();
  for k, v in select key, value#>>'{}' from jsonb_each(p_votes) loop
    if not (v_cat ? k) then raise exception 'Unknown charter article: %.', k; end if;
    if not (v_cat->k @> to_jsonb(v)) then raise exception 'Option "%" is not valid for article "%".', v, k; end if;
    insert into public.organization_charter_votes (org_id, nation_id, article, option)
      values (p_org, v_nation, k, v)
      on conflict (org_id, nation_id, article) do update set option = excluded.option, created_at = now();
  end loop;
end $$;
grant execute on function public.cast_charter_ballot(uuid, jsonb) to authenticated;

-- post_org_message: a member nation's player posts to the Assembly Floor. Member-only, free, 1..500 chars.
create or replace function public.post_org_message(p_org uuid, p_body text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_nation text; v_body text;
begin
  v_uid := auth.uid(); if v_uid is null then raise exception 'Not signed in.'; end if;
  v_body := btrim(coalesce(p_body, ''));
  if v_body = '' then raise exception 'Write something to say.'; end if;
  if length(v_body) > 500 then raise exception 'Keep it under 500 characters.'; end if;

  select id, nation_id into v_pid, v_nation from public.parties where user_id = v_uid;
  if v_pid is null then raise exception 'You have no party.'; end if;
  if not exists (select 1 from public.organization_members where org_id = p_org and nation_id = v_nation) then
    raise exception 'Only member nations may address the Assembly Floor.'; end if;

  insert into public.organization_messages (org_id, nation_id, party_id, body)
    values (p_org, v_nation, v_pid, v_body);
end $$;
grant execute on function public.post_org_message(uuid, text) to authenticated;

-- ratify_organization — supersedes schema/188. Same host + Foreign-Affairs + 2-acceptance gate, and now
-- ALSO requires every charter article to be decided (a strict plurality). Ratification snapshots the
-- winning options into organizations.charter_articles and flips the org 'active' (founded this tick).
create or replace function public.ratify_organization(p_org uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_nation text; v_tick int; v_status text; v_host text; v_name text; v_acc int;
  v_cat jsonb; v_art text; v_win text; v_charter jsonb := '{}'::jsonb;
  c_min_accept constant int := 2;
begin
  select status, host_nation, name into v_status, v_host, v_name from public.organizations where id = p_org;
  if not found then raise exception 'No such organization.'; end if;
  if v_status <> 'founding' then raise exception 'That organization is already ratified.'; end if;

  v_p := public._begin_action(0);   -- lock caller's party + spend 1 Action Point
  v_nation := v_p.nation_id;
  if v_host is distinct from v_nation then raise exception 'Only the host nation can ratify this organization.'; end if;
  if not public._party_holds_ministry(v_p.id, 'Foreign Affairs') then
    raise exception 'Only the Minister of Foreign Affairs can ratify.'; end if;

  select count(*) into v_acc from public.organization_invitations where org_id = p_org and status = 'accepted';
  if v_acc < c_min_accept then
    raise exception 'At least % nations must accept before ratification (currently %).', c_min_accept, v_acc; end if;

  -- Every charter article must have resolved to a strict-plurality winner.
  v_cat := public._org_charter_catalog();
  for v_art in select jsonb_object_keys(v_cat) loop
    v_win := public._org_article_winner(p_org, v_art);
    if v_win is null then
      raise exception 'The charter is not settled — article "%" has no clear majority yet.', v_art; end if;
    v_charter := v_charter || jsonb_build_object(v_art, v_win);
  end loop;

  select current_tick into v_tick from public.game_state where id;
  update public.organizations set status = 'active', founded_tick = v_tick, charter_articles = v_charter where id = p_org;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'party',
      left(v_name, 48) || ' is founded — its charter ratified with ' || v_acc || ' founding member' ||
        (case when v_acc = 1 then '' else 's' end) || '.',
      public.current_game_date());
end $$;
grant execute on function public.ratify_organization(uuid) to authenticated;

notify pgrst, 'reload schema';
