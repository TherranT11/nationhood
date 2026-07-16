-- ===========================================================================
-- 238 · Immediate card claims — resolve on claim, in strict tempo turn order.
--
-- REDESIGN of the claim flow (supersedes claim_card in schema/207 and _resolve_card_claims in
-- schema/218). Previously claim_card only RECORDED a claim and everything happened at the next
-- tick — so between claim and tick "nothing happened". Now:
--
--   • TURN ORDER: only the highest-tempo party that hasn't acted yet this turn may claim. After it
--     acts (and its tempo drops), the next-highest becomes the turn-holder. One action per party/turn.
--   • IMMEDIATE: the claim fires right away via _apply_card_claim — event → the card's effect + its
--     choice decision (the "Government Decisions" prompt); ap → the AP lands; both → both. The
--     claimer's tempo moves at once (event −5, ap −3, both → back, pass → front). One claim consumes
--     the whole card — a claimed card is done for the turn (greyed), no event/ap split.
--   • THE TICK (_resolve_card_claims) now only: replaces the cards that were used (1:1), applies the
--     top-2 idle-drop / 2-miss pin so an absent turn-holder rotates out, and clears the turn's claims.
--
-- Depends on: 207 (card_claims/_active_cards), 218 (tempo_miss), 176/178/179 (effect engine),
--   172/174 (_refill_card_block/_card_return_to_deck), 187 (_bare_party), 05 (game_state).
-- Idempotent. Apply after 237.
-- ===========================================================================

set check_function_bodies = off;

-- Apply ONE party's claim immediately: fire event / bank AP / spend that party's tempo / narrate.
-- One claim consumes the whole card, so there's no event-vs-ap split bookkeeping. Fires through the
-- SAME helpers card_play uses (one source). KNOWN LIMITATION (carried from 207): a claim carries no
-- hex/target pick, so a card whose effect needs one fires only its non-targeted effects.
create or replace function public._apply_card_claim(p_nation text, p_party uuid, p_card uuid, p_action text, p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_def jsonb; v_acts int; v_name text; v_min int;
begin
  select definition into v_def from public.cards c join public.deck_cards dc on dc.card_id = c.id where dc.id = p_card;
  v_acts := greatest(1, least(10, coalesce((v_def->>'acts')::int, 1)));   -- card AP, 1–10
  select name into v_name from public.parties where id = p_party;

  if p_action in ('event', 'both') then
    if coalesce(v_def->>'persistV', 'no') = 'yes' then
      perform public._mint_card_modifier(p_nation, p_party, v_def, p_tick);
    else
      perform public._resolve_card_effects(p_nation, p_party, null, null, null, null, null, v_def, p_tick);
      perform public._create_card_decision(p_nation, p_party, p_card, v_def, p_tick);
    end if;
  end if;

  if p_action in ('ap', 'both') then
    update public.parties set action_points = action_points + v_acts, card_ap = card_ap + v_acts where id = p_party;
  end if;

  if p_action = 'both' then
    select coalesce(min(tempo), 1) into v_min from public.parties where nation_id = p_nation;
    update public.parties set tempo = v_min - 1 where id = p_party;                 -- to the back
  elsif p_action = 'event' then update public.parties set tempo = tempo - 5 where id = p_party;
  else                          update public.parties set tempo = tempo - 3 where id = p_party;  -- ap
  end if;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (p_nation, p_party, 'card',
      'The ' || public._bare_party(v_name) || ' claimed '
      || case p_action when 'event' then 'the event on' when 'ap' then 'Action Points from' else 'the whole of' end
      || ' ' || coalesce(v_def->>'name', 'a card') || '.', public.current_game_date());
end $$;
revoke all on function public._apply_card_claim(text, uuid, uuid, text, int) from public, anon, authenticated;

-- The turn action. Records the claim AND resolves it immediately, gated so only the current
-- highest-tempo un-acted party may go. Atomic — if firing the effect raises, the whole claim rolls
-- back (no tempo spent, no half-consumed card).
create or replace function public.claim_card(p_deck_card uuid, p_action text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_nation text; v_tempo int; v_tick int; v_max int;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not signed in.'; end if;
  if p_action not in ('event', 'ap', 'both', 'pass') then raise exception 'Unknown claim.'; end if;

  select id, nation_id, coalesce(tempo, 1) into v_pid, v_nation, v_tempo from public.parties where user_id = v_uid;
  if v_pid is null then raise exception 'You have no party.'; end if;
  select current_tick into v_tick from public.game_state where id;

  -- One action per party per turn (a prior claim already resolved immediately).
  if exists (select 1 from public.card_claims where party_id = v_pid and tick = v_tick) then
    raise exception 'You have already acted this turn.'; end if;

  -- Turn order: block if any higher-priority party (higher tempo, or equal tempo + earlier id) still
  -- hasn't acted — it holds the floor. This makes claims flow strictly #1, then #2, then #3…
  if exists (
    select 1 from public.parties p
     where p.nation_id = v_nation and p.id <> v_pid
       and (p.tempo > v_tempo or (p.tempo = v_tempo and p.id < v_pid))
       and not exists (select 1 from public.card_claims cc where cc.party_id = p.id and cc.tick = v_tick)
  ) then raise exception 'It''s not your turn yet — a higher-tempo party still has the floor.'; end if;

  if p_action = 'pass' then
    if exists (select 1 from public.card_claims where nation_id = v_nation and tick = v_tick and action = 'pass') then
      raise exception 'The pass has already been taken this turn.'; end if;
    insert into public.card_claims (nation_id, party_id, deck_card_id, action, tick)
      values (v_nation, v_pid, null, 'pass', v_tick);
    select coalesce(max(tempo), 1) into v_max from public.parties where nation_id = v_nation;
    update public.parties set tempo = v_max + 1, tempo_miss = 0 where id = v_pid;   -- jump to the front
    return;
  end if;

  if p_deck_card is null then raise exception 'Pick a card to claim.'; end if;
  if not exists (select 1 from public._active_cards(v_nation) a where a = p_deck_card) then
    raise exception 'That card is not one of this turn''s Active Cards.'; end if;
  if exists (select 1 from public.card_claims where deck_card_id = p_deck_card and tick = v_tick) then
    raise exception 'That card has already been claimed this turn.'; end if;

  insert into public.card_claims (nation_id, party_id, deck_card_id, action, tick)
    values (v_nation, v_pid, p_deck_card, p_action, v_tick);
  update public.parties set tempo_miss = 0 where id = v_pid;
  perform public._apply_card_claim(v_nation, v_pid, p_deck_card, p_action, v_tick);
end $$;
revoke all on function public.claim_card(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_card(uuid, text) to authenticated;

-- Tick step: claims already resolved immediately, so this now only rotates the track (top-2 idle
-- drop / 2-miss pin) and replaces the cards that were used this turn (1:1), then clears the claims.
create or replace function public._resolve_card_claims(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_nat record; v_party record; v_used uuid[]; v_card uuid;
  v_min int; v_last int; v_rank int; v_drop1 uuid; v_drop2 uuid; v_pinned uuid[];
begin
  for v_nat in select id from public.nations n where not coalesce(n.dormant, false) loop
    select coalesce(min(tempo), 0) into v_min from public.parties where nation_id = v_nat.id;
    v_last := v_min - 1; v_rank := 0; v_drop1 := null; v_drop2 := null; v_pinned := '{}'; v_used := '{}';

    for v_party in
      select p.id, coalesce(p.tempo_miss, 0) as miss, cc.action, cc.deck_card_id
        from public.parties p
        left join public.card_claims cc on cc.party_id = p.id and cc.tick = p_tick
       where p.nation_id = v_nat.id
       order by p.tempo desc, p.id
    loop
      v_rank := v_rank + 1;
      -- IDLE (didn't act this turn): top-2 drop to the back; a second straight miss pins it.
      if v_party.action is null then
        if v_party.miss >= 1 then
          update public.parties set tempo_miss = 2 where id = v_party.id;
          v_pinned := array_append(v_pinned, v_party.id);
        elsif v_rank <= 2 then
          update public.parties set tempo_miss = 1 where id = v_party.id;
          if v_rank = 1 then v_drop1 := v_party.id; else v_drop2 := v_party.id; end if;
        end if;
        continue;
      end if;
      -- Acted (already resolved immediately; miss already cleared): collect the used card to replace.
      if v_party.deck_card_id is not null and not (v_party.deck_card_id = any(v_used)) then
        v_used := array_append(v_used, v_party.deck_card_id);
      end if;
    end loop;

    if v_drop2 is not null then update public.parties set tempo = v_last where id = v_drop2; v_last := v_last - 1; end if;
    if v_drop1 is not null then update public.parties set tempo = v_last where id = v_drop1; v_last := v_last - 1; end if;
    foreach v_card in array v_pinned loop update public.parties set tempo = v_last where id = v_card; v_last := v_last - 1; end loop;

    foreach v_card in array v_used loop perform public._card_return_to_deck(v_card); end loop;
    if array_length(v_used, 1) is not null then perform public._refill_card_block(v_nat.id); end if;

    delete from public.card_claims where nation_id = v_nat.id and tick = p_tick;
  end loop;
end $$;
revoke all on function public._resolve_card_claims(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
