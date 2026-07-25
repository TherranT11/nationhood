-- ===========================================================================
-- 340 · Kingdoms — the Discard special action.
--
-- A player may, once, discard up to 3 cards from hand in exchange for 3 Gold. Doing so ENDS the turn:
-- it is not a card play and it does not grant a second action — the turn is "functionally over" and no
-- further action (draw, play, build, muster, raise, decree) may be taken until End Turn.
--
-- Implementation: a new kingdoms_leaders.turn_over flag records the spent turn. kingdoms_discard sets it
-- (and pins cards_played to the per-turn limit so the existing turn-limit guards on the play/build/etc.
-- RPCs also refuse). kingdoms_draw learns to refuse when turn_over. kingdoms_end_turn clears both flags.
-- Discarding grants +3 Gold (a floor at 0 is unnecessary — gold only rises here). Depends on: 331 (draw),
-- 324 (end_turn), 337 (event log). Idempotent. Apply after 339.
-- ===========================================================================

alter table public.kingdoms_leaders
  add column if not exists turn_over boolean not null default false;

-- Discard up to 3 chosen cards for +3 Gold; ends the turn. Returns a chronicle line.
create or replace function public.kingdoms_discard(p_ids uuid[])
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house uuid; v_over boolean; v_gold int; v_n int; v_place text; v_msg text;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  select id, coalesce(turn_over, false), coalesce((resources->>'gold')::int, 0)
    into v_house, v_over, v_gold
  from public.kingdoms_leaders where user_id = auth.uid() order by created_at desc limit 1;
  if v_house is null then raise exception 'no_house'; end if;
  if v_over then raise exception 'turn_over'; end if;

  if p_ids is null or array_length(p_ids, 1) is null
     or array_length(p_ids, 1) < 1 or array_length(p_ids, 1) > 3 then
    raise exception 'bad_count';
  end if;

  delete from public.kingdoms_hand where house_id = v_house and id = any(p_ids);
  get diagnostics v_n = row_count;
  if v_n < 1 then raise exception 'not_your_card'; end if;

  update public.kingdoms_leaders
     set resources  = jsonb_set(resources, '{gold}', to_jsonb(v_gold + 3)),
         turn_over   = true,
         cards_played = 2
   where id = v_house;

  v_msg := 'Discards ' || v_n || ' card' || case when v_n = 1 then '' else 's' end || ' for 3 Gold.';
  select name into v_place from public.kingdoms_counties where held_by = v_house order by created_at limit 1;
  perform public._kingdoms_log(v_house, 'Court', v_place, v_msg);
  return v_msg;
end;
$$;
revoke all on function public.kingdoms_discard(uuid[]) from public, anon;
grant execute on function public.kingdoms_discard(uuid[]) to authenticated;

-- Draw refuses once the turn is over (mirrors the play/build/etc. turn-limit guards).
create or replace function public.kingdoms_draw()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_house uuid; v_over boolean; v_key text; v_id uuid;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  select id, coalesce(turn_over, false) into v_house, v_over
    from public.kingdoms_leaders where user_id = auth.uid() order by created_at desc limit 1;
  if v_house is null then raise exception 'no_house'; end if;
  if v_over then raise exception 'turn_over'; end if;
  if (select count(*) from public.kingdoms_hand where house_id = v_house) >= 5 then raise exception 'hand_full'; end if;

  select card_key into v_key from (
    select distinct c.card_key from public.kingdoms_cards c
    where exists (select 1 from public.kingdoms_cards p where p.card_key = c.card_key and p.playable)
  ) d order by random() limit 1;
  if v_key is null then raise exception 'empty_deck'; end if;

  insert into public.kingdoms_hand (house_id, card_key) values (v_house, v_key) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.kingdoms_draw() from public, anon;
grant execute on function public.kingdoms_draw() to authenticated;

-- End Turn resets the play counter and clears the turn-over flag.
create or replace function public.kingdoms_end_turn()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  update public.kingdoms_leaders set cards_played = 0, turn_over = false where user_id = auth.uid();
end;
$$;
revoke all on function public.kingdoms_end_turn() from public, anon;
grant execute on function public.kingdoms_end_turn() to authenticated;

notify pgrst, 'reload schema';
