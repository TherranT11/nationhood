-- ===========================================================================
-- 284 · Nationverse conversations — player-to-player meeting requests + chat.
--
-- A player (a claimed personality) can request a meeting with another player. The request lives as a
-- conversation row with status 'pending'; the recipient Accepts (→ 'accepted', a chat opens for both)
-- or Declines (→ 'declined'). Messages hang off an accepted conversation.
--
-- Identity is the caller's CLAIMED personality (nationverse_my_personality) — never a client-supplied id —
-- so a player can only ever act as their own character. All writes go through security-definer RPCs
-- (request/respond/send); the tables expose only participant-scoped SELECT to the client. Private data:
-- granted to authenticated only, never anon. Depends on: 272, 279 (claimed_by). Idempotent. Apply after 283.
-- ===========================================================================

-- The caller's single claimed character (one source for "who am I" across the RPCs and RLS below).
create or replace function public.nationverse_my_personality()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.nationverse_personalities where claimed_by = auth.uid() limit 1;
$$;
revoke all on function public.nationverse_my_personality() from public, anon;
grant execute on function public.nationverse_my_personality() to authenticated;

create table if not exists public.nationverse_conversations (
  id               uuid primary key default gen_random_uuid(),
  from_personality uuid not null references public.nationverse_personalities(id) on delete cascade,
  to_personality   uuid not null references public.nationverse_personalities(id) on delete cascade,
  reason           text,
  status           text not null default 'pending',   -- pending | accepted | declined
  created_at       timestamptz not null default now(),
  responded_at     timestamptz
);
create index if not exists nationverse_conv_to_idx   on public.nationverse_conversations(to_personality);
create index if not exists nationverse_conv_from_idx on public.nationverse_conversations(from_personality);

create table if not exists public.nationverse_messages (
  id                 uuid primary key default gen_random_uuid(),
  conversation_id    uuid not null references public.nationverse_conversations(id) on delete cascade,
  sender_personality uuid not null references public.nationverse_personalities(id) on delete cascade,
  body               text not null,
  created_at         timestamptz not null default now()
);
create index if not exists nationverse_msg_conv_idx on public.nationverse_messages(conversation_id, created_at);

alter table public.nationverse_conversations enable row level security;
alter table public.nationverse_messages      enable row level security;

-- Private: only the signed-in authenticated participants may read (no anon). Writes are RPC-only.
grant select on public.nationverse_conversations to authenticated;
grant select on public.nationverse_messages      to authenticated;

drop policy if exists "nv_conv_select_participant" on public.nationverse_conversations;
create policy "nv_conv_select_participant" on public.nationverse_conversations for select
  using (from_personality = public.nationverse_my_personality()
      or to_personality   = public.nationverse_my_personality());

drop policy if exists "nv_msg_select_participant" on public.nationverse_messages;
create policy "nv_msg_select_participant" on public.nationverse_messages for select
  using (conversation_id in (
    select id from public.nationverse_conversations
    where from_personality = public.nationverse_my_personality()
       or to_personality   = public.nationverse_my_personality()));

-- Request a meeting with another player. Reason is trimmed to 64 chars. Refuses self / non-players, and
-- collapses to the existing row if the same pending request already stands (no duplicate spam).
create or replace function public.nationverse_request_meeting(p_to uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_me uuid; v_id uuid; v_reason text;
begin
  v_me := public.nationverse_my_personality();
  if v_me is null then raise exception 'no_character'; end if;
  if p_to is null or p_to = v_me then raise exception 'invalid_target'; end if;
  if not exists (select 1 from public.nationverse_personalities where id = p_to and claimed_by is not null) then
    raise exception 'not_a_player';
  end if;
  v_reason := nullif(left(trim(coalesce(p_reason, '')), 64), '');
  select id into v_id from public.nationverse_conversations
    where from_personality = v_me and to_personality = p_to and status = 'pending' limit 1;
  if v_id is not null then return v_id; end if;
  insert into public.nationverse_conversations (from_personality, to_personality, reason)
    values (v_me, p_to, v_reason) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.nationverse_request_meeting(uuid, text) from public, anon;
grant execute on function public.nationverse_request_meeting(uuid, text) to authenticated;

-- Accept or decline a pending request. Only the recipient can respond, and only while it's pending.
create or replace function public.nationverse_respond_meeting(p_conv uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_me uuid; v_status text;
begin
  v_me := public.nationverse_my_personality();
  if v_me is null then raise exception 'no_character'; end if;
  update public.nationverse_conversations
     set status = case when p_accept then 'accepted' else 'declined' end, responded_at = now()
   where id = p_conv and to_personality = v_me and status = 'pending'
  returning status into v_status;
  if v_status is null then raise exception 'not_pending_or_not_recipient'; end if;
  return v_status;
end;
$$;
revoke all on function public.nationverse_respond_meeting(uuid, boolean) from public, anon;
grant execute on function public.nationverse_respond_meeting(uuid, boolean) to authenticated;

-- Send a message in an accepted conversation. Caller must be a participant; body trimmed to 2000 chars.
create or replace function public.nationverse_send_message(p_conv uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_me uuid; v_id uuid; v_body text;
begin
  v_me := public.nationverse_my_personality();
  if v_me is null then raise exception 'no_character'; end if;
  v_body := left(trim(coalesce(p_body, '')), 2000);
  if v_body = '' then raise exception 'empty_message'; end if;
  if not exists (
    select 1 from public.nationverse_conversations
     where id = p_conv and status = 'accepted' and (from_personality = v_me or to_personality = v_me)
  ) then raise exception 'not_a_participant'; end if;
  insert into public.nationverse_messages (conversation_id, sender_personality, body)
    values (p_conv, v_me, v_body) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.nationverse_send_message(uuid, text) from public, anon;
grant execute on function public.nationverse_send_message(uuid, text) to authenticated;

notify pgrst, 'reload schema';
