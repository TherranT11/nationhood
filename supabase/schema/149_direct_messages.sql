-- 149 · Direct Messages (Phase G Inbox). Private party-to-party messaging: one thread per pair of
-- parties, many messages per thread. Reads are RLS-restricted to the two participants; writes go
-- only through the security-definer dm_send RPC (no client insert), so a party can't post as
-- another or read a conversation it isn't in.
-- Depends on: 20 (parties), 40 (_lock_party). Run after 40.

-- The caller's party id — ONE source for the "is this me" check in the RLS policies below (and
-- reusable anywhere a stable, non-locking party lookup is needed). Security definer so it resolves
-- regardless of the caller's own row visibility.
create or replace function public._my_party_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.parties where user_id = auth.uid();
$$;
grant execute on function public._my_party_id() to authenticated;

-- One thread per unordered pair of parties: party_lo < party_hi is the canonical ordering, so a
-- pair maps to exactly one row (the unique index). read_lo/read_hi record when each side last
-- opened the thread (null = never), driving the unread markers. Rows cascade with either party.
-- No created_at: a thread always has a first message, so its messages carry every timestamp the
-- app reads (recency + unread) — a thread stamp would be an orphaned write.
create table if not exists public.dm_threads (
  id         uuid primary key default gen_random_uuid(),
  party_lo   uuid not null references public.parties (id) on delete cascade,
  party_hi   uuid not null references public.parties (id) on delete cascade,
  read_lo    timestamptz,
  read_hi    timestamptz,
  unique (party_lo, party_hi),
  check (party_lo < party_hi)
);

create table if not exists public.dm_messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.dm_threads (id) on delete cascade,
  sender_id  uuid not null references public.parties (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists dm_messages_thread_idx on public.dm_messages (thread_id, created_at);

-- Reads: participants only. No insert/update/delete policy — every write goes through the
-- security-definer RPCs below, so the client can neither forge a sender nor read others' threads.
alter table public.dm_threads enable row level security;
drop policy if exists "dm_threads_participant" on public.dm_threads;
create policy "dm_threads_participant" on public.dm_threads for select
  using (party_lo = public._my_party_id() or party_hi = public._my_party_id());

alter table public.dm_messages enable row level security;
drop policy if exists "dm_messages_participant" on public.dm_messages;
create policy "dm_messages_participant" on public.dm_messages for select
  using (exists (select 1 from public.dm_threads t
                 where t.id = dm_messages.thread_id
                   and (t.party_lo = public._my_party_id() or t.party_hi = public._my_party_id())));

-- Send a message to another party, creating the thread on first contact. Returns the thread id.
-- The sender is always the caller's own party (via _lock_party, which also stamps the activity
-- heartbeat); sending marks the thread read for the sender, so their own message never shows unread.
create or replace function public.dm_send(p_to uuid, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_me uuid; v_lo uuid; v_hi uuid; v_thread uuid; v_body text;
begin
  v_p := public._lock_party();
  v_me := v_p.id;
  if p_to is null or p_to = v_me then raise exception 'Choose another party to message.'; end if;
  if not exists (select 1 from public.parties where id = p_to) then raise exception 'That party no longer exists.'; end if;
  v_body := btrim(coalesce(p_body, ''));
  if v_body = '' then raise exception 'The message is empty.'; end if;
  if length(v_body) > 2000 then raise exception 'The message is too long (2000 characters max).'; end if;

  v_lo := least(v_me, p_to);
  v_hi := greatest(v_me, p_to);
  insert into public.dm_threads (party_lo, party_hi) values (v_lo, v_hi)
    on conflict (party_lo, party_hi) do update set party_lo = excluded.party_lo   -- no-op so RETURNING yields the existing id
    returning id into v_thread;
  insert into public.dm_messages (thread_id, sender_id, body) values (v_thread, v_me, v_body);
  perform public.dm_mark_read(v_thread);   -- the sender has read their own message (one source for the read stamp)
  return v_thread;
end $$;
grant execute on function public.dm_send(uuid, text) to authenticated;

-- Mark a thread read for the caller (the participant side), clearing its unread marker. No-op if
-- the caller isn't a participant.
create or replace function public.dm_mark_read(p_thread uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_me uuid := public._my_party_id();
begin
  if v_me is null then return; end if;
  update public.dm_threads
     set read_lo = case when v_me = party_lo then now() else read_lo end,
         read_hi = case when v_me = party_hi then now() else read_hi end
   where id = p_thread and (party_lo = v_me or party_hi = v_me);
end $$;
grant execute on function public.dm_mark_read(uuid) to authenticated;
