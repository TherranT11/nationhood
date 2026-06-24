-- ===========================================================================
-- 85 · Forum (out-of-character + in-character message boards).
-- Depends on: 00 (profiles + the handle below), 10 (nations), 20 (parties),
-- 30 (politicians). Run after 30.
--
-- A FIXED set of boards (seeded below) under two realms: OOC (player @handles) and
-- IC (your politician/party, nation-tagged). Threads and posts are world-readable;
-- ALL writes go through SECURITY DEFINER RPCs that SNAPSHOT the author's identity at
-- post time — profiles are private (00), so identity can't be joined live, and the
-- snapshot also can't be forged from the client. Posting is purely social: it costs
-- no actions and changes no game state (the IC "Moves Image" etc. tags are thematic
-- labels for now).
-- ===========================================================================

-- Player nickname (the @handle): the out-of-character identity. Null until the player
-- sets one — and OOC posting is gated on it (_forum_identity raises without one). Unique
-- case-insensitively so a nickname can't be impersonated.
alter table public.profiles add column if not exists handle text;
create unique index if not exists profiles_handle_unique on public.profiles (lower(handle)) where handle is not null;

-- Set the caller's nickname. 2–16 chars, letters/digits/underscore. Friendly error if
-- taken. SECURITY DEFINER so it writes the caller's own profile column without needing
-- a broad client UPDATE grant on profiles.
create or replace function public.set_handle(p_handle text)
returns text language plpgsql security definer set search_path = public as $$
declare v_h text := btrim(coalesce(p_handle, ''));
begin
  if auth.uid() is null then raise exception 'Not signed in.'; end if;
  if v_h !~ '^[A-Za-z0-9_]{2,16}$' then raise exception 'Nickname must be 2–16 letters, digits, or underscores.'; end if;
  begin
    update public.profiles set handle = v_h where id = auth.uid();
  exception when unique_violation then
    raise exception 'That handle is taken.';
  end;
  return v_h;
end $$;
grant execute on function public.set_handle(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Boards: a FIXED set (seeded). key is referenced by threads; realm decides which
-- identity a thread posts under. World-readable; seeded only (no client writes).
-- ---------------------------------------------------------------------------
create table if not exists public.forum_boards (
  key   text primary key,
  realm text not null,                       -- 'ooc' | 'ic'
  name  text not null,
  descr text not null,
  icon  text not null,                       -- inline <svg> path markup (our own seed — safe to render)
  sys   text,                                -- IC subtitle tag (e.g. "Moves Image"); null for OOC
  sort  int not null default 0
);
alter table public.forum_boards enable row level security;
drop policy if exists "forum_boards_select_all" on public.forum_boards;
create policy "forum_boards_select_all" on public.forum_boards for select using (true);

insert into public.forum_boards (key, realm, name, descr, icon, sys, sort) values
  ('announcements','ooc','Announcements','Official updates, patch notes, and events.','<path d="M3 11v2a1 1 0 001 1h3l5 4V6L7 10H4a1 1 0 00-1 1z"/><path d="M16 8a5 5 0 010 8"/>',null,10),
  ('general','ooc','General Discussion','Strategy, questions, and everything else.','<path d="M4 5h16v11H8l-4 3z"/>',null,20),
  ('help','ooc','New Players & Help','Onboarding, recruitment, and mentorship.','<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 115 .5c0 1.5-2 2-2 3.5"/><path d="M12 17h.01"/>',null,30),
  ('feedback','ooc','Suggestions & Bugs','Feedback, ideas, and bug reports.','<path d="M14 6a3.5 3.5 0 00-4.7 4.4L4 15.7 6.3 18l5.3-5.3A3.5 3.5 0 0016 8l-2 2-2-2 2-2z"/>',null,40),
  ('backroom','ooc','Diplomacy Backroom','Out-of-character coordination for in-character moves.','<path d="M4 13l3-3 4 3 3-2 6 4"/><path d="M3 10l4-3 5 3"/>',null,50),
  ('press','ic','The Press','Newspapers, op-eds, propaganda, and leaks.','<path d="M4 5h12v14H6a2 2 0 01-2-2z"/><path d="M16 8h4v9a2 2 0 01-2 2"/><path d="M7 8h6M7 11h6M7 14h4"/>','Moves Image',10),
  ('floor','ic','The Floor','Manifestos, policy defences, and campaigning.','<path d="M3 9l9-5 9 5"/><path d="M4 20h16"/><path d="M6 20v-9M10 20v-9M14 20v-9M18 20v-9"/>','Mirrors the Assembly',20),
  ('communiques','ic','Diplomacy & Communiqués','Statements, treaties, and threats between nations.','<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>','Mirrors the World',30),
  ('markets','ic','The Markets · Business Wire','Corporate announcements, deals, and takeovers.','<path d="M4 20h16"/><path d="M6 20v-7M11 20v-12M16 20v-5"/>','Mirrors Corporations',40),
  ('culture','ic','Culture & Society','Sport, festivals, and scandal — the lived-in world.','<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>','Flavour',50)
on conflict (key) do update set
  realm = excluded.realm, name = excluded.name, descr = excluded.descr,
  icon = excluded.icon, sys = excluded.sys, sort = excluded.sort;

-- ---------------------------------------------------------------------------
-- Threads + posts. A thread's opening post is its first forum_posts row; replies are
-- the rest. Author identity is snapshot onto every row (see _forum_identity). bumped_at
-- tracks last activity so the board list can surface the most recently active thread.
-- ---------------------------------------------------------------------------
create table if not exists public.forum_threads (
  id           uuid primary key default gen_random_uuid(),
  board        text not null references public.forum_boards(key),
  realm        text not null,                 -- mirrors the board's realm (set by the RPC)
  title        text not null,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  author       text not null,                 -- snapshot: '@handle' (OOC) or leader/party name (IC)
  author_party text,                          -- IC: party name
  author_color text,                          -- IC: party colour (the author dot)
  nation_id    text references public.nations(id) on delete set null,  -- IC: nation context (filter + tag)
  created_at   timestamptz not null default now(),
  bumped_at    timestamptz not null default now()
);
create index if not exists forum_threads_board_idx on public.forum_threads (board, bumped_at desc);

create table if not exists public.forum_posts (
  id           uuid primary key default gen_random_uuid(),
  thread_id    uuid not null references public.forum_threads(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  author       text not null,
  author_party text,
  author_color text,
  nation_id    text references public.nations(id) on delete set null,
  body         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists forum_posts_thread_idx on public.forum_posts (thread_id, created_at);

alter table public.forum_threads enable row level security;
alter table public.forum_posts   enable row level security;
drop policy if exists "forum_threads_select_all" on public.forum_threads;
create policy "forum_threads_select_all" on public.forum_threads for select using (true);
drop policy if exists "forum_posts_select_all" on public.forum_posts;
create policy "forum_posts_select_all" on public.forum_posts for select using (true);
-- No client insert/update/delete policies: every write goes through the RPCs below,
-- which snapshot the author identity so it can't be forged.

-- ---------------------------------------------------------------------------
-- RPCs.
-- ---------------------------------------------------------------------------

-- The caller's forum identity for a post. IC → party leader's name + party name/colour
-- + nation. OOC → their @handle (must be set). ONE place the snapshot is built; both
-- post RPCs call it. SECURITY DEFINER so it can read the caller's own private profile.
create or replace function public._forum_identity(p_ic boolean,
  out author text, out author_party text, out author_color text, out nation_id text)
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_party public.parties%rowtype; v_handle text; v_leader text;
begin
  if v_user is null then raise exception 'Not signed in.'; end if;
  if p_ic then
    select * into v_party from public.parties where user_id = v_user;
    if not found then raise exception 'You need a party to post in character.'; end if;
    select btrim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')) into v_leader
      from public.politicians where party_id = v_party.id and status = 'Party Leader' order by created_at limit 1;
    author       := coalesce(nullif(v_leader, ''), v_party.name);
    author_party := v_party.name;
    author_color := v_party.color;
    nation_id    := v_party.nation_id;
  else
    select handle into v_handle from public.profiles where id = v_user;
    if v_handle is null or btrim(v_handle) = '' then raise exception 'Set a handle first to post out of character.'; end if;
    author := '@' || v_handle;
  end if;
end $$;

-- Open a new thread: validates the board, snapshots identity for that board's realm,
-- and writes the thread + its opening post atomically. Returns the new thread id.
create or replace function public.forum_post_thread(p_board text, p_title text, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid(); v_realm text;
  v_title text := btrim(coalesce(p_title, '')); v_body text := btrim(coalesce(p_body, ''));
  v_author text; v_party text; v_color text; v_nation text; v_tid uuid;
begin
  if v_user is null then raise exception 'Not signed in.'; end if;
  if v_title = '' then raise exception 'Give your thread a title.'; end if;
  if v_body  = '' then raise exception 'Write something in the post.'; end if;
  if char_length(v_title) > 140 then raise exception 'Title is too long (140 characters max).'; end if;
  if char_length(v_body) > 8000 then raise exception 'Post is too long.'; end if;
  select realm into v_realm from public.forum_boards where key = p_board;
  if v_realm is null then raise exception 'No such board.'; end if;
  select author, author_party, author_color, nation_id into v_author, v_party, v_color, v_nation
    from public._forum_identity(v_realm = 'ic');

  insert into public.forum_threads (board, realm, title, user_id, author, author_party, author_color, nation_id)
    values (p_board, v_realm, v_title, v_user, v_author, v_party, v_color, v_nation)
    returning id into v_tid;
  insert into public.forum_posts (thread_id, user_id, author, author_party, author_color, nation_id, body)
    values (v_tid, v_user, v_author, v_party, v_color, v_nation, v_body);
  return v_tid;
end $$;
grant execute on function public.forum_post_thread(text, text, text) to authenticated;

-- Reply to a thread: snapshots identity for the thread's realm, writes the post, and
-- bumps the thread's last-activity. Returns the new post id.
create or replace function public.forum_post_reply(p_thread uuid, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid(); v_body text := btrim(coalesce(p_body, '')); v_realm text;
  v_author text; v_party text; v_color text; v_nation text; v_pid uuid;
begin
  if v_user is null then raise exception 'Not signed in.'; end if;
  if v_body = '' then raise exception 'Write a reply.'; end if;
  if char_length(v_body) > 8000 then raise exception 'Reply is too long.'; end if;
  select realm into v_realm from public.forum_threads where id = p_thread;
  if v_realm is null then raise exception 'That thread is gone.'; end if;
  select author, author_party, author_color, nation_id into v_author, v_party, v_color, v_nation
    from public._forum_identity(v_realm = 'ic');

  insert into public.forum_posts (thread_id, user_id, author, author_party, author_color, nation_id, body)
    values (p_thread, v_user, v_author, v_party, v_color, v_nation, v_body)
    returning id into v_pid;
  update public.forum_threads set bumped_at = now() where id = p_thread;
  return v_pid;
end $$;
grant execute on function public.forum_post_reply(uuid, text) to authenticated;

notify pgrst, 'reload schema';
