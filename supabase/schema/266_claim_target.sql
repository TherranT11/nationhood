-- ===========================================================================
-- 266 · Card claims carry a target — fix party-targeted event cards (e.g. Attack Campaign).
--
-- KNOWN LIMITATION being closed (documented in 207/238/174): a tempo CLAIM fired the card's effects
-- with p_target = null, so a party-targeted card (party_lose / party_gain — "Attack Campaign") claimed
-- as an event did NOTHING to a rival: the effect no-ops without a target, and it isn't a choice card so
-- no decision prompt appears either. Result: the player picks EVENT, nothing happens, no picker.
--
-- Fix: claim_card takes an optional p_target (the rival party) and threads it to _apply_card_claim →
-- _resolve_card_effects — the SAME target parameter card_play already uses (one source). The client
-- collects the target with a rival-party picker when the card is party-targeted. A claim with no target
-- degrades exactly as before (non-targeted effects only), so nothing else changes.
--
-- Redefine of _apply_card_claim + claim_card (bodies verbatim from schema/238) with the target added.
-- Old 2-arg claim_card / 5-arg _apply_card_claim are dropped so there's no ambiguous overload.
-- Depends on: 238 (claim flow), 176 (_resolve_card_effects), 153 (_apply_party_effect). Apply after 238.
-- ===========================================================================

set check_function_bodies = off;

drop function if exists public.claim_card(uuid, text);
drop function if exists public._apply_card_claim(text, uuid, uuid, text, int);

-- Apply ONE party's claim immediately. p_target (optional) is the rival party a party-scoped effect
-- (party_lose / party_gain) hits — threaded to _resolve_card_effects. Null → non-targeted effects only.
create or replace function public._apply_card_claim(p_nation text, p_party uuid, p_card uuid, p_action text, p_tick int, p_target uuid default null)
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
      perform public._resolve_card_effects(p_nation, p_party, p_target, null, null, null, null, v_def, p_tick);
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
revoke all on function public._apply_card_claim(text, uuid, uuid, text, int, uuid) from public, anon, authenticated;

-- The turn action. Records + immediately resolves the claim; p_target (optional) is the rival party a
-- party-targeted card hits, validated to be another party in the claimer's own nation.
create or replace function public.claim_card(p_deck_card uuid, p_action text, p_target uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_nation text; v_tempo int; v_tick int; v_max int;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not signed in.'; end if;
  if p_action not in ('event', 'ap', 'both', 'pass') then raise exception 'Unknown claim.'; end if;

  select id, nation_id, coalesce(tempo, 1) into v_pid, v_nation, v_tempo from public.parties where user_id = v_uid;
  if v_pid is null then raise exception 'You have no party.'; end if;
  select current_tick into v_tick from public.game_state where id;

  -- A target (a party-targeted attack) must be another party in your own nation.
  if p_target is not null then
    if p_target = v_pid then raise exception 'You can''t target your own party.'; end if;
    if not exists (select 1 from public.parties where id = p_target and nation_id = v_nation) then
      raise exception 'That party is not in your nation.'; end if;
  end if;

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
  perform public._apply_card_claim(v_nation, v_pid, p_deck_card, p_action, v_tick, p_target);
end $$;
revoke all on function public.claim_card(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.claim_card(uuid, text, uuid) to authenticated;

notify pgrst, 'reload schema';
