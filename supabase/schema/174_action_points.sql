-- ===========================================================================
-- 174 · Action economy — Action Points: the per-turn budget for influence actions.
--
-- On its turn a party makes ONE of three choices (the Home "Action Container"):
--   • Take 1 Action              → 1 Action Point
--   • Play a Card, take N actions → the card's event resolves + N Action Points (N = definition.acts)
--   • Discard 1 Card, +3 Influence → the card leaves the hand, the party banks +3 Influence, 0 AP
--
-- An Action Point is then spent by any operation that used to cost Influence (Produce, Industrialize,
-- call an election, …): each such operation now costs 1 AP INSTEAD of Influence. AP is banked on your
-- turn and spendable AT ANY TIME until your NEXT turn, when any unspent AP expires (cleared as the
-- rotation cursor lands back on you — see the _advance_turns override below). So there is no turn
-- check on spending — holding an AP is the gate. That per-operation charge is _spend_action_point(),
-- wired into each operation RPC in a follow-up pass (Phase B); this migration lays the spine.
--
-- One choice per turn is enforced by turn_acted_tick: a party's turn is the single tick its cursor is
-- up (nation_turn, schema/173), so "already chose" is turn_acted_tick = current_tick. A choice
-- OVERWRITES action_points, so stale AP from a prior turn never accumulates; and the turn gate makes
-- any leftover AP unusable once the cursor moves on, so no reset step is needed in the tick.
--
-- Depends on: 20 (parties), 40 (events), 05 (game_state), 170/171 (cards, card_play), 173
-- (nation_turn, card_play turn gate). Idempotent.
-- ===========================================================================

-- The per-turn Action-Point balance, and the tick of the party's last turn choice (the one-choice
-- guard). Both default 0 — a fresh party has taken no turn and holds no AP.
alter table public.parties add column if not exists action_points   int not null default 0;
alter table public.parties add column if not exists turn_acted_tick int not null default 0;

-- The gate every (formerly-)influence-costed operation calls (Phase B). Spends one Action Point: the
-- party need only hold at least one AP — AP is spendable any time until it expires at the party's next
-- turn, so there is NO turn check here (the turn check lives on the three CHOICES below, not on
-- spending). Security definer, internal — operation RPCs (also security definer) call it directly, so
-- it stays revoked from clients.
create or replace function public._spend_action_point(p_party uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_ap int;
begin
  select action_points into v_ap from public.parties where id = p_party for update;
  if not found then raise exception 'No such party.'; end if;
  if coalesce(v_ap, 0) < 1 then raise exception 'No Action Points left — take your turn to bank more.'; end if;
  update public.parties set action_points = action_points - 1 where id = p_party;
end $$;
revoke all on function public._spend_action_point(uuid) from public, anon, authenticated;

-- ── Turn choice 1 of 3: Take 1 Action — bank a single Action Point for this turn. ──
create or replace function public.turn_take_action()
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_nat text; v_tick int; v_acted int;
begin
  v_uid := auth.uid(); if v_uid is null then raise exception 'Not signed in.'; end if;
  select id, nation_id into v_pid, v_nat from public.parties where user_id = v_uid for update;   -- lock: serialise concurrent turn choices
  if v_pid is null then raise exception 'You have no party.'; end if;
  if v_pid is distinct from public.nation_turn(v_nat) then raise exception 'It is not your turn.'; end if;
  select current_tick into v_tick from public.game_state where id;
  select turn_acted_tick into v_acted from public.parties where id = v_pid;
  if v_acted = v_tick then raise exception 'You have already taken your turn.'; end if;
  update public.parties set action_points = 1, turn_acted_tick = v_tick where id = v_pid;
end $$;
grant execute on function public.turn_take_action() to authenticated;

-- ── Turn choice 3 of 3: Discard 1 Card, +3 Influence. ──
-- The card leaves the hand and shuffles back into the nation's deck (status 'in_deck'); the party
-- banks +3 Influence (capped 100)
-- and gets NO Action Points. A quiet party-actions event records it.
create or replace function public.card_discard(p_deck_card uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_nat text; v_pname text; v_tick int; v_acted int; v_stat text; v_owner uuid;
begin
  v_uid := auth.uid(); if v_uid is null then raise exception 'Not signed in.'; end if;
  select id, nation_id, name into v_pid, v_nat, v_pname from public.parties where user_id = v_uid for update;   -- lock: serialise concurrent turn choices
  if v_pid is null then raise exception 'You have no party.'; end if;
  if v_pid is distinct from public.nation_turn(v_nat) then raise exception 'It is not your turn.'; end if;
  select current_tick into v_tick from public.game_state where id;
  select turn_acted_tick into v_acted from public.parties where id = v_pid;
  if v_acted = v_tick then raise exception 'You have already taken your turn.'; end if;

  select status, party_id into v_stat, v_owner from public.deck_cards where id = p_deck_card for update;
  if not found then raise exception 'No such card.'; end if;
  if v_owner is distinct from v_pid or v_stat <> 'in_hand' then raise exception 'That card is not in your hand.'; end if;

  perform public._card_return_to_deck(p_deck_card);   -- discard → back into the nation's deck (shared helper)
  update public.parties set influence = least(100, influence + 3), action_points = 0, turn_acted_tick = v_tick where id = v_pid;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nat, v_pid, 'party', v_pname || ' returned a card to the deck for +3 Influence.', public.current_game_date());
end $$;
grant execute on function public.card_discard(uuid) to authenticated;

-- Return a played/held card to its nation's deck (status 'in_deck', unowned) so it can be won again.
-- The ONE source for "shuffle back": the afterPlay='shuffle' lifecycle, the 'shuffle' effect on a One-Off
-- (card_play below), and the 'shuffle' effect on a resolved Government-Choice option (schema/178).
create or replace function public._card_return_to_deck(p_deck_card uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_deck_card is null then return; end if;
  update public.deck_cards set status = 'in_deck', party_id = null where id = p_deck_card;
end $$;
revoke all on function public._card_return_to_deck(uuid) from public, anon, authenticated;

-- ONE source for the play-time firing rule: a generic card fires every effect; a stance card fires only
-- its 'both'-sided ones (the d/r sides wait for party stance). Read by the effect resolver (schema/176)
-- and by both "does the card carry a firing effect of kind X" checks below — so the rule lives once.
create or replace function public._card_side_fires(p_def jsonb, p_side text)
returns boolean language sql immutable set search_path = public as $$
  select p_def->>'type' = 'generic' or coalesce(p_side, 'both') = 'both';
$$;
revoke all on function public._card_side_fires(jsonb, text) from public, anon, authenticated;

-- Does the card carry a FIRING effect (the rule above) of any of these kinds? One exists-scan, backing
-- card_play's "needs a hex" gate and the "reshuffles on play" check below.
create or replace function public._def_fires_kind(p_def jsonb, p_kinds text[])
returns boolean language sql immutable set search_path = public as $$
  select exists (select 1 from jsonb_array_elements(coalesce(p_def->'fx', '[]'::jsonb)) e
                  where e->>'kind' = any(p_kinds) and public._card_side_fires(p_def, e->>'side'));
$$;
revoke all on function public._def_fires_kind(jsonb, text[]) from public, anon, authenticated;

-- A One-Off card reshuffles on play if it carries a firing 'shuffle' effect. Choice/Double cards decide
-- their fate elsewhere (a chosen option at decide-time; stance sides deferred), so this is oneoff-only.
create or replace function public._def_fires_shuffle(p_def jsonb)
returns boolean language sql immutable set search_path = public as $$
  select coalesce(p_def->>'mech', 'oneoff') = 'oneoff' and public._def_fires_kind(p_def, array['shuffle']);
$$;
revoke all on function public._def_fires_shuffle(jsonb) from public, anon, authenticated;

-- ── Turn choice 2 of 3: Play a Card — supersedes schema/173's card_play, now the turn choice that
-- grants the card's Action Points. Keeps the ownership + in_hand + turn gate from 173; ADDS the
-- one-choice guard and, on play, banks the card's `acts` (1–6, default 1 for pre-`acts` cards) as
-- Action Points to spend this turn. Playing NO LONGER costs Influence — the card was paid for at
-- auction (schema/172), and actions don't cost Influence. Immediate effects resolve at the end via
-- _resolve_card_effects (schema/176). p_target is the rival party a party-scoped effect (party_gain/
-- party_lose) lands on — chosen in the Home target picker; NULL when the card targets no party. ──
drop function if exists public.card_play(uuid);         -- retire the 1-arg overload so p_target isn't ambiguous
drop function if exists public.card_play(uuid, uuid);   -- retire the pre-hex 2-arg overload
create or replace function public.card_play(p_deck_card uuid, p_target uuid default null, p_hex_q int default null, p_hex_r int default null,
  p_corp uuid default null, p_corp2 uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_dc record; v_party record; v_def jsonb; v_name text; v_tick int; v_acts int; v_tgt_nat text;
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

  -- Turn gate + one-choice-per-turn: you play on your turn, and only if you haven't chosen yet.
  if v_party.id is distinct from public.nation_turn(v_dc.nation_id) then
    raise exception 'You can only play a card on your party''s turn.';
  end if;
  select current_tick into v_tick from public.game_state where id;
  if (select turn_acted_tick from public.parties where id = v_party.id) = v_tick then
    raise exception 'You have already taken your turn.';
  end if;

  -- A chosen target must be a party of the SAME nation as the card (party effects are national).
  if p_target is not null then
    select nation_id into v_tgt_nat from public.parties where id = p_target;
    if v_tgt_nat is distinct from v_dc.nation_id then raise exception 'That target is not a party in this nation.'; end if;
  end if;

  v_def := v_dc.definition;
  v_acts := greatest(1, least(6, coalesce((v_def->>'acts')::int, 1)));   -- the card's Action Points

  -- A hex_pop / hex_el effect needs a hex picked on play. If the card carries one (generic, or a
  -- 'both'-sided stance effect) but no hex was chosen, stop before consuming the card. The hex is
  -- validated against the nation's land downstream (schema/176/181); an atomic play rolls back on a bad hex.
  if coalesce(v_def->>'persistV', 'no') <> 'yes'
     and (p_hex_q is null or p_hex_r is null)
     and public._def_fires_kind(v_def, array['hex_pop', 'hex_el']) then
    raise exception 'Pick a hex on the map to play this card.';
  end if;

  -- Deferred (purchase-by-stance): once parties can hold a stance, gate the playable side on reqD/reqR here.
  update public.parties   set action_points = v_acts, turn_acted_tick = v_tick
   where id = v_party.id;
  -- Lifecycle: the card returns to the deck to be won again if the author set the 'shuffle back' toggle
  -- OR a firing 'shuffle' effect says so (a One-Off recycler); otherwise it is discarded for good
  -- ('played' — a public record that it fired). A Choice card that reshuffles does so at decide-time (178).
  if coalesce(v_def->>'afterPlay', 'discard') = 'shuffle' or public._def_fires_shuffle(v_def) then
    perform public._card_return_to_deck(p_deck_card);
  else
    update public.deck_cards set status = 'played' where id = p_deck_card;
  end if;

  v_name := coalesce(v_def->>'name', 'a card');
  insert into public.events (nation_id, party_id, kind, body, game_date)
  values (v_dc.nation_id, v_party.id, 'party',
          v_party.name || ' played ' || v_name ||
            case when coalesce(v_def->>'desc', '') <> '' then ' — ' || (v_def->>'desc') else '' end,
          public.current_game_date());

  -- Effects (atomic with the play). A Persistent card becomes a standing national modifier
  -- (schema/179); otherwise its immediate effects fire now (176) and a Government Choice opens a
  -- pending decision (178). Stance-gated sides still wait on party stance.
  if coalesce(v_def->>'persistV', 'no') = 'yes' then
    perform public._mint_card_modifier(v_dc.nation_id, v_party.id, v_def, v_tick);
  else
    perform public._resolve_card_effects(v_dc.nation_id, v_party.id, p_target, p_hex_q, p_hex_r, p_corp, p_corp2, v_def, v_tick);
    perform public._create_card_decision(v_dc.nation_id, v_party.id, p_deck_card, v_def, v_tick);
  end if;
end $$;
grant execute on function public.card_play(uuid, uuid, integer, integer, uuid, uuid) to authenticated;

-- Supersedes schema/173's _advance_turns: same rotation, but as the cursor lands on a party (its new
-- turn begins) we clear that party's Action Points — unspent AP lasts only until your next turn, then
-- the fresh turn choice banks new AP. (Lives here, not in 173, because action_points is added above,
-- and 173 runs first.) Still tick-only.
create or replace function public._advance_turns()
returns void language plpgsql security definer set search_path = public as $$
declare n record; v_cur uuid; v_seq double precision; v_next uuid;
begin
  for n in select id from public.nations where not coalesce(dormant, false) loop
    v_cur := public.nation_turn(n.id);
    if v_cur is null then continue; end if;
    select turn_seq into v_seq from public.parties where id = v_cur;
    select id into v_next from public.parties
      where nation_id = n.id and (turn_seq, id) > (v_seq, v_cur)
      order by turn_seq, id limit 1;
    if v_next is null then
      select id into v_next from public.parties where nation_id = n.id order by turn_seq, id limit 1;
    end if;
    update public.nations set turn_party_id = v_next where id = n.id;
    update public.parties set action_points = 0, bids_this_turn = 0 where id = v_next;   -- new turn → unspent AP + the turn's bid count reset
  end loop;
end $$;
revoke all on function public._advance_turns() from public, anon, authenticated;

notify pgrst, 'reload schema';
