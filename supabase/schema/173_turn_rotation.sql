-- ===========================================================================
-- 173 · Turn rotation — a per-nation turn order + the card-play gate.
--
-- Within a nation the parties take turns: one party is "active" each tick, cycling in a fixed,
-- RANDOMLY-assigned order (the Home page's Card Queue is this rotation drawn forward). The order is
-- STORED, not derived — a random slot per party (turn_seq), stable once set. A per-nation cursor
-- (turn_party_id) points at whose turn it is now and advances one party per tick inside advance_tick.
--
-- One party/tick = one party/month (the tick IS a month). In an N-party nation a party's turn comes
-- round every N ticks. Whose turn it is has one authority — nation_turn() — read by both the client
-- (to anchor the queue + enable the Play button) and the server (to gate card_play).
--
-- DEFERRED, and left room for on purpose:
--   • "…unless a card changes it": turn_seq is mutable, so a future card effect (the effect engine,
--     Phase 3b) can rewrite a party's slot or swap two to reorder the queue. Nothing writes it yet.
--   • ONE play PER turn (a turn budget): that belongs to the action economy (the next design). This
--     pass's gate is only "it must be your turn", not "…and you haven't played yet".
--
-- Depends on: 20 (parties), 10 (nations), 40 (events), 60 (_advance_tick), 171 (card_play). Idempotent.
-- ===========================================================================

-- Each party's fixed slot in its nation's rotation. random() at creation makes the order a random
-- permutation; it persists (stable) — the only thing that will ever move it is a card effect. Parties
-- are inserted straight from the client (parties_insert_own), so the DEFAULT is what stamps new rows;
-- existing rows are backfilled once below. Ordering is always (turn_seq, id) so a random() tie is still
-- deterministic.
alter table public.parties add column if not exists turn_seq double precision not null default random();
update public.parties set turn_seq = random() where turn_seq = 0;   -- backfill any pre-column rows (default only fires on insert)

-- The cursor: the party whose turn it is now. Null = not yet initialised / no parties — nation_turn()
-- falls back to the first party by turn_seq. on delete set null so deleting the active party never
-- leaves a dangling cursor (the fallback covers the gap until the next tick advances it).
alter table public.nations add column if not exists turn_party_id uuid references public.parties (id) on delete set null;

-- The ONE authority for "whose turn is it in this nation". Returns the stored cursor when it still
-- points at a live party, else the lowest-turn_seq party (lazy, read-only — never writes). Both the
-- card-play gate below and the Home page's queue anchor call this, so page and server can't disagree.
create or replace function public.nation_turn(p_nation text)
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(
    (select n.turn_party_id
       from public.nations n
       join public.parties p on p.id = n.turn_party_id and p.nation_id = p_nation
      where n.id = p_nation),
    (select id from public.parties where nation_id = p_nation order by turn_seq, id limit 1)
  );
$$;
grant execute on function public.nation_turn(text) to authenticated;

-- Advance every non-dormant nation's cursor by one party (the next slot by turn_seq, wrapping to the
-- first). Anchored on nation_turn() so display and advancement share one rule: "current" is whatever
-- the page shows, and we always step forward from there. A single-party nation wraps to itself (that
-- party is always up). Called once per tick from _advance_tick; tick-only (revoked from clients).
create or replace function public._advance_turns()
returns void language plpgsql security definer set search_path = public as $$
declare n record; v_cur uuid; v_seq double precision; v_next uuid;
begin
  for n in select id from public.nations where not coalesce(dormant, false) loop
    v_cur := public.nation_turn(n.id);
    if v_cur is null then continue; end if;            -- no parties → nothing to rotate
    select turn_seq into v_seq from public.parties where id = v_cur;
    select id into v_next from public.parties
      where nation_id = n.id and (turn_seq, id) > (v_seq, v_cur)
      order by turn_seq, id limit 1;                    -- next slot after the current one
    if v_next is null then                              -- past the end → wrap to the first
      select id into v_next from public.parties where nation_id = n.id order by turn_seq, id limit 1;
    end if;
    update public.nations set turn_party_id = v_next where id = n.id;
  end loop;
end $$;
revoke all on function public._advance_turns() from public, anon, authenticated;

-- card_play — supersedes schema/171's version, adding ONE line: the turn gate. A card in hand now
-- plays only on the holder party's own turn (nation_turn). Everything else is unchanged: validate
-- ownership + in_hand under a row lock, pay the Influence cost, mark it played, post the party-actions
-- event. Effects + the purchase-by-stance gate remain deferred exactly as in 171.
create or replace function public.card_play(p_deck_card uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_dc record; v_party record; v_def jsonb; v_cost int; v_name text;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not signed in.'; end if;

  select dc.id, dc.status, dc.party_id, dc.nation_id, c.definition
    into v_dc
    from public.deck_cards dc
    join public.cards c on c.id = dc.card_id
   where dc.id = p_deck_card
   for update of dc;   -- lock the card row so two concurrent plays can't both pass the status check
  if not found then raise exception 'No such card.'; end if;
  if v_dc.status <> 'in_hand' then raise exception 'That card is not in a hand to play.'; end if;

  select id, user_id, name, influence into v_party from public.parties where id = v_dc.party_id;
  if not found or v_party.user_id <> v_uid then raise exception 'That is not your card to play.'; end if;

  -- Turn gate: you can only play on your party's turn.
  if v_party.id is distinct from public.nation_turn(v_dc.nation_id) then
    raise exception 'You can only play a card on your party''s turn.';
  end if;

  v_def := v_dc.definition;
  v_cost := coalesce((v_def->>'cost')::int, 0);
  if coalesce(v_party.influence, 0) < v_cost then raise exception 'Not enough Influence to play this card.'; end if;

  -- TODO(purchase-by-stance): once parties can hold a stance, gate the playable side on reqD/reqR here.
  -- TODO(effects): apply the card's mechanical effects when the resolution engine (Phase 3b) exists.
  update public.parties    set influence = influence - v_cost where id = v_party.id;
  update public.deck_cards  set status = 'played'               where id = p_deck_card;

  v_name := coalesce(v_def->>'name', 'a card');
  insert into public.events (nation_id, party_id, kind, body, game_date)
  values (v_dc.nation_id, v_party.id, 'party',
          v_party.name || ' played ' || v_name ||
            case when coalesce(v_def->>'desc', '') <> '' then ' — ' || (v_def->>'desc') else '' end,
          public.current_game_date());
end $$;
grant execute on function public.card_play(uuid) to authenticated;

notify pgrst, 'reload schema';
