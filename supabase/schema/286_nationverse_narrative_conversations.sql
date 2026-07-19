-- ===========================================================================
-- 286 · Nationverse narrative conversations — a World-Master-crafted situation between two players.
--
-- A narrative conversation links two players to a narrative (the authored situation). BOTH players must
-- click Ready to Begin; once both are ready the conversation opens and the narrative's opening lines are
-- posted into it as NARRATOR messages (the crafted content IS the conversation) — after which the two
-- players talk within that frame, exactly like a player-to-player chat.
--
-- V1: exactly two players, chosen at launch (not tied to the narrative's single assignee). Launching is
-- admin-only for now (nationverse_launch_narrative) — the eventual automatic, trigger-driven launch is
-- deferred and will reuse the same creation path. Depends on: 284, 285, 277 (narratives). Idempotent.
-- Apply after 285.
-- ===========================================================================

alter table public.nationverse_conversations add column if not exists narrative_id uuid
  references public.nationverse_narratives(id) on delete set null;
alter table public.nationverse_conversations add column if not exists from_ready boolean not null default false;
alter table public.nationverse_conversations add column if not exists to_ready   boolean not null default false;

-- Narrator lines have no player sender; allow null + carry the speaker's name.
alter table public.nationverse_messages alter column sender_personality drop not null;
alter table public.nationverse_messages add column if not exists speaker text;

-- Admin launches a narrative conversation between two (claimed) players. Interim WM tool until the
-- automatic, trigger-driven launch is built; that path will call this same insert.
create or replace function public.nationverse_launch_narrative(p_narrative uuid, p_a uuid, p_b uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_name text;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_a is null or p_b is null or p_a = p_b then raise exception 'need_two_distinct_players'; end if;
  if not exists (select 1 from public.nationverse_personalities where id = p_a and claimed_by is not null)
     or not exists (select 1 from public.nationverse_personalities where id = p_b and claimed_by is not null) then
    raise exception 'players_must_be_claimed';
  end if;
  select name into v_name from public.nationverse_narratives where id = p_narrative;
  if v_name is null then raise exception 'no_narrative'; end if;
  insert into public.nationverse_conversations (from_personality, to_personality, reason, status, kind, narrative_id)
    values (p_a, p_b, v_name, 'pending', 'narrative', p_narrative) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.nationverse_launch_narrative(uuid, uuid, uuid) from public, anon;
grant execute on function public.nationverse_launch_narrative(uuid, uuid, uuid) to authenticated;   -- is_admin() gate inside

-- A player marks themselves Ready to Begin. When BOTH are ready the conversation opens and the narrative's
-- opening lines are posted as narrator messages. Returns 'accepted' (opened now) or 'waiting' (other player).
create or replace function public.nationverse_mark_ready(p_conv uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_me uuid; v_conv public.nationverse_conversations; v_open jsonb; v_speaker text; v_line text; v_both boolean;
begin
  v_me := public.nationverse_my_personality();
  if v_me is null then raise exception 'no_character'; end if;
  select * into v_conv from public.nationverse_conversations
   where id = p_conv and kind = 'narrative' and status = 'pending'
     and (from_personality = v_me or to_personality = v_me) for update;
  if v_conv.id is null then raise exception 'not_pending_participant'; end if;

  if v_conv.from_personality = v_me then
    update public.nationverse_conversations set from_ready = true where id = p_conv;
  else
    update public.nationverse_conversations set to_ready = true where id = p_conv;
  end if;

  select (from_ready and to_ready) into v_both from public.nationverse_conversations where id = p_conv;
  if not v_both then return 'waiting'; end if;

  update public.nationverse_conversations set status = 'accepted' where id = p_conv;
  select opening into v_open from public.nationverse_narratives where id = v_conv.narrative_id;
  if v_open is not null then
    v_speaker := v_open->>'speaker';
    for v_line in select value from jsonb_array_elements_text(coalesce(v_open->'lines', '[]'::jsonb)) loop
      insert into public.nationverse_messages (conversation_id, sender_personality, body, kind, speaker)
        values (p_conv, null, v_line, 'narrator', v_speaker);
    end loop;
  end if;
  return 'accepted';
end;
$$;
revoke all on function public.nationverse_mark_ready(uuid) from public, anon;
grant execute on function public.nationverse_mark_ready(uuid) to authenticated;

notify pgrst, 'reload schema';
