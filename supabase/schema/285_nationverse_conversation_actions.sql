-- ===========================================================================
-- 285 · Nationverse conversations: type, ordering, ending, and player-to-player actions.
--
-- Adds the conversation `kind` (p2p | narrative), activity-based ordering (last_message_at, kept fresh by
-- a trigger), an in-chat message `kind` (text | promise | system), and three player actions that only
-- work inside an ACCEPTED player-to-player conversation and only for a participant (the caller's claimed
-- personality): End Meeting (→ ended, read-only forever after), make a Promise (a recorded promise
-- message), and Exchange Wealth (transfer money, or a % stake in a corporation, to the other player).
-- Depends on: 284 (conversations/messages + nationverse_my_personality), 278 (wealth), 274 (corporations).
-- Idempotent. Apply after 284.
-- ===========================================================================

alter table public.nationverse_conversations add column if not exists kind text not null default 'p2p';   -- p2p | narrative
alter table public.nationverse_conversations add column if not exists last_message_at timestamptz;
update public.nationverse_conversations set last_message_at = created_at where last_message_at is null;

alter table public.nationverse_messages add column if not exists kind text not null default 'text';        -- text | promise | system

-- Keep last_message_at in step with the latest message, whatever RPC inserted it (one source for ordering).
create or replace function public._nv_bump_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.nationverse_conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists nv_msg_bump on public.nationverse_messages;
create trigger nv_msg_bump after insert on public.nationverse_messages
  for each row execute function public._nv_bump_conversation();

-- Helper: is the caller a participant in this ACCEPTED conversation? (used by every player action below)
create or replace function public._nv_in_accepted(p_conv uuid, p_me uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.nationverse_conversations
     where id = p_conv and status = 'accepted' and (from_personality = p_me or to_personality = p_me));
$$;

-- End a meeting: only a participant of an accepted p2p conversation. Records a system line, then locks it.
create or replace function public.nationverse_end_meeting(p_conv uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_me uuid;
begin
  v_me := public.nationverse_my_personality();
  if v_me is null or not public._nv_in_accepted(p_conv, v_me) then raise exception 'not_a_participant'; end if;
  insert into public.nationverse_messages (conversation_id, sender_personality, body, kind)
    values (p_conv, v_me, 'The meeting has ended.', 'system');
  update public.nationverse_conversations set status = 'ended' where id = p_conv;
end;
$$;
revoke all on function public.nationverse_end_meeting(uuid) from public, anon;
grant execute on function public.nationverse_end_meeting(uuid) to authenticated;

-- Make a promise: a recorded, attributed promise message (both players see it in the transcript).
create or replace function public.nationverse_make_promise(p_conv uuid, p_text text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_me uuid; v_id uuid; v_body text;
begin
  v_me := public.nationverse_my_personality();
  if v_me is null or not public._nv_in_accepted(p_conv, v_me) then raise exception 'not_a_participant'; end if;
  v_body := left(trim(coalesce(p_text, '')), 240);
  if v_body = '' then raise exception 'empty_promise'; end if;
  insert into public.nationverse_messages (conversation_id, sender_personality, body, kind)
    values (p_conv, v_me, v_body, 'promise') returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.nationverse_make_promise(uuid, text) from public, anon;
grant execute on function public.nationverse_make_promise(uuid, text) to authenticated;

-- Exchange wealth: transfer money (p_kind='money') or a % stake in a corporation (p_kind='shares', p_corp)
-- from the caller to the other participant. All-or-nothing; validates funds/holdings; records a system line.
create or replace function public.nationverse_exchange_wealth(p_conv uuid, p_kind text, p_amount numeric, p_corp uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_me uuid; v_other uuid; v_amt int; v_own jsonb; v_new jsonb := '[]'::jsonb; e jsonb;
  v_myshare numeric := 0; v_found_other boolean := false; v_ns numeric; v_corpname text; v_note text;
  v_myname text; v_othername text;
begin
  v_me := public.nationverse_my_personality();
  if v_me is null or not public._nv_in_accepted(p_conv, v_me) then raise exception 'not_a_participant'; end if;
  select case when from_personality = v_me then to_personality else from_personality end
    into v_other from public.nationverse_conversations where id = p_conv;
  select name into v_myname    from public.nationverse_personalities where id = v_me;
  select name into v_othername from public.nationverse_personalities where id = v_other;

  if p_kind = 'money' then
    v_amt := floor(coalesce(p_amount, 0))::int;
    if v_amt <= 0 then raise exception 'invalid_amount'; end if;
    update public.nationverse_personalities set wealth = wealth - v_amt where id = v_me and wealth >= v_amt;
    if not found then raise exception 'insufficient_wealth'; end if;
    update public.nationverse_personalities set wealth = wealth + v_amt where id = v_other;
    v_note := coalesce(v_myname,'A player') || ' sent ' || v_amt || ' wealth to ' || coalesce(v_othername,'the other player') || '.';

  elsif p_kind = 'shares' then
    if p_corp is null then raise exception 'no_corp'; end if;
    if coalesce(p_amount, 0) <= 0 then raise exception 'invalid_amount'; end if;
    select ownership, name into v_own, v_corpname from public.nationverse_corporations where id = p_corp;
    if v_own is null then raise exception 'no_corp'; end if;
    select coalesce((select (x->>'share')::numeric from jsonb_array_elements(v_own) x
       where x->>'type' = 'personality' and x->>'id' = v_me::text limit 1), 0) into v_myshare;
    if v_myshare < p_amount then raise exception 'insufficient_shares'; end if;
    for e in select * from jsonb_array_elements(v_own) loop
      if e->>'type' = 'personality' and e->>'id' = v_me::text then
        v_ns := (e->>'share')::numeric - p_amount;
        if v_ns > 0 then v_new := v_new || jsonb_build_object('type','personality','id',v_me,'share',v_ns); end if;
      elsif e->>'type' = 'personality' and e->>'id' = v_other::text then
        v_new := v_new || jsonb_build_object('type','personality','id',v_other,'share',(e->>'share')::numeric + p_amount);
        v_found_other := true;
      else
        v_new := v_new || e;
      end if;
    end loop;
    if not v_found_other then
      v_new := v_new || jsonb_build_object('type','personality','id',v_other,'share',p_amount);
    end if;
    update public.nationverse_corporations set ownership = v_new where id = p_corp;
    v_note := coalesce(v_myname,'A player') || ' transferred ' || p_amount || '% of ' || coalesce(v_corpname,'a corporation')
      || ' to ' || coalesce(v_othername,'the other player') || '.';
  else
    raise exception 'bad_kind';
  end if;

  insert into public.nationverse_messages (conversation_id, sender_personality, body, kind)
    values (p_conv, v_me, v_note, 'system');
end;
$$;
revoke all on function public.nationverse_exchange_wealth(uuid, text, numeric, uuid) from public, anon;
grant execute on function public.nationverse_exchange_wealth(uuid, text, numeric, uuid) to authenticated;

notify pgrst, 'reload schema';
