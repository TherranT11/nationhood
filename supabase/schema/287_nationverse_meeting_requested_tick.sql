-- ===========================================================================
-- 287 · Show a player their own outbound meeting request + let them cancel it.
--
-- Adds created_tick (the in-game month the request was made, so the requester's Conversations list can
-- read "Meeting requested in March, 1987"), stamps it in request_meeting, and adds a cancel RPC so the
-- requester can withdraw a still-pending request. Depends on: 284 (conversations + request_meeting),
-- 285 (kind). Idempotent. Apply after 286.
-- ===========================================================================

alter table public.nationverse_conversations add column if not exists created_tick int;

-- Stamp the current game tick on new requests (existing rows stay null → the date clause is omitted).
create or replace function public.nationverse_request_meeting(p_to uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_me uuid; v_id uuid; v_reason text; v_tick int;
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
  if v_id is not null then return v_id; end if;   -- collapse duplicate pending request
  select current_tick into v_tick from public.game_state limit 1;
  insert into public.nationverse_conversations (from_personality, to_personality, reason, created_tick)
    values (v_me, p_to, v_reason, v_tick) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.nationverse_request_meeting(uuid, text) from public, anon;
grant execute on function public.nationverse_request_meeting(uuid, text) to authenticated;

-- Cancel (withdraw) a still-pending request the caller sent. Only the requester, only while pending.
create or replace function public.nationverse_cancel_meeting(p_conv uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_me uuid;
begin
  v_me := public.nationverse_my_personality();
  if v_me is null then raise exception 'no_character'; end if;
  delete from public.nationverse_conversations
   where id = p_conv and from_personality = v_me and status = 'pending' and kind = 'p2p';
  if not found then raise exception 'not_cancelable'; end if;
end;
$$;
revoke all on function public.nationverse_cancel_meeting(uuid) from public, anon;
grant execute on function public.nationverse_cancel_meeting(uuid) to authenticated;

notify pgrst, 'reload schema';
