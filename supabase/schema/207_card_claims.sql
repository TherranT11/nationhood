-- ===========================================================================
-- 207 · COIN card claims (Stage 2): the four claim actions + tick resolution.
--
-- An ADDITIVE layer over the existing card system — the auction / play / discard
-- paths are untouched, so this is fully reversible. Each turn (tick) a party may
-- claim ONE of the nation's 2 Active Cards (the two oldest on the block) with one
-- action:
--   event → plays the card's effect (its "reading"); −5 Tempo
--   ap    → banks the card's AP to the party;        −3 Tempo
--   both  → event + AP, exclusive (no one else);      → Tempo to LAST
--   pass  → do nothing, jump the queue;               → Tempo to FIRST (one/turn)
-- No claim, or a claim blocked by a higher-Tempo party → Tempo to LAST.
--
-- At the tick, _resolve_card_claims walks every party in Tempo order (highest
-- first), grants each its claim if the card slot is still free, fires effects /
-- banks AP through the SAME helpers card_play uses (one source), cycles the used
-- cards back to the deck, and re-sorts the track by the new Tempo. Wired into
-- _advance_tick (schema/60), isolated so a failure can never abort the tick.
--
-- Depends on: 206 (parties.tempo), 170 (deck_cards/cards), 172 (_refill_card_block),
-- 174 (_card_return_to_deck), 176/178/179 (effect engine), 187 (_bare_party),
-- 05 (game_state). Idempotent. Apply in the Supabase SQL Editor, then re-apply
-- schema/60 so _advance_tick picks up the new step.
-- ===========================================================================

-- Renormalise Tempo into a meaningful 1–100 band — 206 seeded 0–100000, which makes the −5/−3 claim
-- costs vanish. Only values OUTSIDE the band are reset, so a re-run never reshuffles an in-play order.
alter table public.parties alter column tempo set default floor(random() * 100 + 1)::int;
update public.parties set tempo = floor(random() * 100 + 1)::int where tempo is null or tempo < 1 or tempo > 100;

-- One claim per party per turn. deck_card_id is null only for a pass.
create table if not exists public.card_claims (
  id           uuid primary key default gen_random_uuid(),
  nation_id    text not null references public.nations (id) on delete cascade,
  party_id     uuid not null references public.parties (id) on delete cascade,
  deck_card_id uuid references public.deck_cards (id) on delete cascade,
  action       text not null check (action in ('event', 'ap', 'both', 'pass')),
  tick         int  not null,
  created_at   timestamptz not null default now(),
  unique (party_id, tick)
);
create index if not exists card_claims_nation_tick_idx on public.card_claims (nation_id, tick);

alter table public.card_claims enable row level security;
drop policy if exists "card_claims_select_all" on public.card_claims;
create policy "card_claims_select_all" on public.card_claims for select using (true);
grant select on public.card_claims to anon, authenticated;
-- All writes go through claim_card (security definer) — no direct client writes.

-- A nation's 2 Active Cards = the two oldest cards on the block.
create or replace function public._active_cards(p_nation text)
returns setof uuid language sql stable security definer set search_path = public as $$
  select id from public.deck_cards where nation_id = p_nation and status = 'on_block'
   order by created_at, id limit 2;
$$;
revoke all on function public._active_cards(text) from public, anon, authenticated;

-- Record (or replace) the caller's claim for this turn. Additive: spends no AP and never touches the
-- auction — Tempo is spent at resolution. A card claim must name one of the nation's 2 Active Cards.
create or replace function public.claim_card(p_deck_card uuid, p_action text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_party record; v_tick int;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not signed in.'; end if;
  if p_action not in ('event', 'ap', 'both', 'pass') then raise exception 'Unknown claim.'; end if;

  select id, nation_id into v_party from public.parties where user_id = v_uid;
  if not found then raise exception 'You have no party.'; end if;
  select current_tick into v_tick from public.game_state where id;

  if p_action = 'pass' then
    -- Only one party per nation may take the pass each turn (yours may replace itself).
    if exists (select 1 from public.card_claims
                where nation_id = v_party.nation_id and tick = v_tick and action = 'pass' and party_id <> v_party.id) then
      raise exception 'Another party has already taken the pass this turn.';
    end if;
    insert into public.card_claims (nation_id, party_id, deck_card_id, action, tick)
      values (v_party.nation_id, v_party.id, null, 'pass', v_tick)
      on conflict (party_id, tick) do update set deck_card_id = null, action = 'pass', nation_id = excluded.nation_id;
    return;
  end if;

  if p_deck_card is null then raise exception 'Pick a card to claim.'; end if;
  if not exists (select 1 from public._active_cards(v_party.nation_id) a where a = p_deck_card) then
    raise exception 'That card is not one of this turn''s Active Cards.';
  end if;
  insert into public.card_claims (nation_id, party_id, deck_card_id, action, tick)
    values (v_party.nation_id, v_party.id, p_deck_card, p_action, v_tick)
    on conflict (party_id, tick) do update set deck_card_id = excluded.deck_card_id, action = excluded.action, nation_id = excluded.nation_id;
end $$;
revoke all on function public.claim_card(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_card(uuid, text) to authenticated;

-- Tick resolution. Walk every party in Tempo order (highest first); grant its claim if the card slot is
-- still free; fire effects / bank AP through card_play's own helpers; re-sort the track by new Tempo.
create or replace function public._resolve_card_claims(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_nat record; v_party record;
  v_a uuid[]; v_ev_by jsonb; v_ap_by jsonb; v_excl jsonb; v_used uuid[];
  v_min int; v_max int; v_last int; v_first int;
  v_def jsonb; v_acts int; v_grant boolean; v_card uuid;
begin
  for v_nat in
    select id from public.nations n where not coalesce(n.dormant, false)
     and exists (select 1 from public.card_claims cc where cc.nation_id = n.id and cc.tick = p_tick)
  loop
    select coalesce(min(tempo), 0), coalesce(max(tempo), 0) into v_min, v_max
      from public.parties where nation_id = v_nat.id;
    v_last := v_min - 1; v_first := v_max + 1;
    v_ev_by := '{}'::jsonb; v_ap_by := '{}'::jsonb; v_excl := '{}'::jsonb; v_used := '{}';
    v_a := array(select public._active_cards(v_nat.id));

    for v_party in
      select p.id, p.name, cc.action, cc.deck_card_id
        from public.parties p
        left join public.card_claims cc on cc.party_id = p.id and cc.tick = p_tick
       where p.nation_id = v_nat.id
       order by p.tempo desc, p.id
    loop
      -- No claim → last.
      if v_party.action is null then
        update public.parties set tempo = v_last where id = v_party.id; v_last := v_last - 1; continue;
      -- Pass → first.
      elsif v_party.action = 'pass' then
        update public.parties set tempo = v_first where id = v_party.id; continue;
      end if;

      v_card := v_party.deck_card_id;
      v_grant := false;
      if v_card = any(v_a) and not (v_excl ? v_card::text) then
        if    v_party.action = 'both'  then v_grant := not (v_ev_by ? v_card::text) and not (v_ap_by ? v_card::text);
        elsif v_party.action = 'event' then v_grant := not (v_ev_by ? v_card::text);
        elsif v_party.action = 'ap'    then v_grant := not (v_ap_by ? v_card::text);
        end if;
      end if;

      -- Blocked (card gone or slot taken by a higher-Tempo party) → last.
      if not v_grant then
        update public.parties set tempo = v_last where id = v_party.id; v_last := v_last - 1; continue;
      end if;

      select definition into v_def from public.cards c join public.deck_cards dc on dc.card_id = c.id where dc.id = v_card;
      v_acts := greatest(1, least(10, coalesce((v_def->>'acts')::int, 1)));

      -- Event (or both): fire through the SAME path card_play uses (one source).
      if v_party.action in ('event', 'both') then
        if coalesce(v_def->>'persistV', 'no') = 'yes' then
          perform public._mint_card_modifier(v_nat.id, v_party.id, v_def, p_tick);
        else
          perform public._resolve_card_effects(v_nat.id, v_party.id, null, null, null, null, null, v_def, p_tick);
          perform public._create_card_decision(v_nat.id, v_party.id, v_card, v_def, p_tick);
        end if;
        v_ev_by := v_ev_by || jsonb_build_object(v_card::text, v_party.id);
        if v_party.action = 'both' then v_excl := v_excl || jsonb_build_object(v_card::text, v_party.id); end if;
      end if;

      -- AP (or both): bank the card's AP — minus 1 for a lone AP-take that shares the card with an event.
      if v_party.action in ('ap', 'both') then
        if v_party.action = 'ap' and (v_ev_by ? v_card::text) then v_acts := greatest(1, v_acts - 1); end if;
        update public.parties set action_points = action_points + v_acts, card_ap = card_ap + v_acts where id = v_party.id;
        v_ap_by := v_ap_by || jsonb_build_object(v_card::text, v_party.id);
      end if;

      -- Tempo cost: both → last; event −5; ap −3.
      if    v_party.action = 'both'  then update public.parties set tempo = v_last where id = v_party.id; v_last := v_last - 1;
      elsif v_party.action = 'event' then update public.parties set tempo = tempo - 5 where id = v_party.id;
      else                                update public.parties set tempo = tempo - 3 where id = v_party.id;
      end if;

      if not (v_card = any(v_used)) then v_used := array_append(v_used, v_card); end if;

      insert into public.events (nation_id, party_id, kind, body, game_date)
        values (v_nat.id, v_party.id, 'card',
          'The ' || public._bare_party(v_party.name) || ' claimed '
          || case v_party.action when 'event' then 'the event on' when 'ap' then 'Action Points from' else 'the whole of' end
          || ' ' || coalesce(v_def->>'name', 'a card') || '.', public.current_game_date());
    end loop;

    -- Cycle every used Active Card back into the deck, then top the block back up.
    foreach v_card in array v_used loop perform public._card_return_to_deck(v_card); end loop;
    if array_length(v_used, 1) is not null then perform public._refill_card_block(v_nat.id); end if;

    delete from public.card_claims where nation_id = v_nat.id and tick = p_tick;
  end loop;
end $$;
revoke all on function public._resolve_card_claims(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
