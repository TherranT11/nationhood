-- ===========================================================================
-- 178 · Card decisions — Phase 3b-2: a Government Choice card creates a PENDING decision that a
-- handler resolves, then the chosen option's effect fires. Modeled on the world-event decision
-- lifecycle (schema/100): a snapshot row that stays open until the resolver picks an option.
--
-- A card with mech='choice' authors `copt` (the options the government picks between) and a `reward`
-- (already applied to the player at play, schema/176). When such a card is played, _create_card_
-- decision (called from card_play, schema/174) snapshots the options into a card_decisions row and
-- computes the RESOLVER from the card's `handler`:
--   handler = a ministry → the party holding that portfolio in the active government, else the Head
--                          of Government, else the player who played it.
--   handler = 'player'   → the party who played it.
-- The resolver calls card_decide(decision, option) to pick; the option's effect resolves through the
-- same _apply_card_effect dispatcher (schema/176) the immediate effects use.
--
-- Depends on: 10 (nations), 20 (parties), 30 (politicians), 60 (governments, cabinet_appointments),
-- 40 (events), 05 (game_state), 176 (_apply_card_effect), 174 (card_play). Idempotent.
-- ===========================================================================

create table if not exists public.card_decisions (
  id                 uuid primary key default gen_random_uuid(),
  nation_id          text not null references public.nations (id),
  deck_card_id       uuid references public.deck_cards (id) on delete set null,   -- the played card (may be discarded later)
  card_name          text not null,
  options            jsonb not null,                                              -- snapshot: [{txt, kind, p}]
  handler            text not null,                                               -- 'player' or a ministry name (snapshot)
  resolver_party_id  uuid references public.parties (id) on delete set null,      -- who must decide
  played_by_party_id uuid references public.parties (id) on delete set null,
  status             text not null default 'pending',                             -- pending | resolved
  chosen_idx         int,
  created_tick       int,
  created_at         timestamptz not null default now()
);
create index if not exists card_decisions_open_idx on public.card_decisions (nation_id, status);
-- Snapshot of the card's flavour text, so the World Timeline line at resolve time (card_decide) can read
-- "on the matter of {title}, {description} …" without depending on the played card still existing.
alter table public.card_decisions add column if not exists card_desc text;

-- Public read (a pending government decision is public, like proposals/events); writes only through
-- the security-definer RPCs below.
alter table public.card_decisions enable row level security;
drop policy if exists "card_decisions_select_all" on public.card_decisions;
create policy "card_decisions_select_all" on public.card_decisions for select using (true);

-- Who must resolve a decision with this handler: a ministry routes to the party holding that
-- portfolio in the active government, else the Head of Government, else the player; 'player' (or no
-- handler) is always the player who played it.
create or replace function public._card_decision_resolver(p_nation text, p_handler text, p_played_by uuid)
returns uuid language plpgsql stable security definer set search_path = public as $$
declare v_gov record; v_pid uuid;
begin
  if p_handler is null or p_handler = 'player' then return p_played_by; end if;
  select * into v_gov from public.governments where nation_id = p_nation and status = 'active';
  if not found then return p_played_by; end if;
  if p_handler = 'hog' then return coalesce(v_gov.formateur_party_id, p_played_by); end if;   -- Head of Government
  select p.id into v_pid
    from public.cabinet_appointments ca
    join public.politicians pol on pol.id = ca.politician_id
    join public.parties p       on p.id   = pol.party_id
   where ca.government_id = v_gov.id and ca.ministry = p_handler
   limit 1;
  return coalesce(v_pid, v_gov.formateur_party_id, p_played_by);   -- minister → HoG → player
end $$;
revoke all on function public._card_decision_resolver(text, text, uuid) from public, anon, authenticated;

-- Open the pending decision for a Government Choice card. Called from card_play; a no-op for any other
-- mechanic or an option-less card.
create or replace function public._create_card_decision(p_nation text, p_played_by uuid, p_deck_card uuid, p_def jsonb, p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_opts jsonb; v_handler text; v_resolver uuid; v_name text;
begin
  if coalesce(p_def->>'mech', '') <> 'choice' then return; end if;
  v_opts := coalesce(p_def->'copt', '[]'::jsonb);
  if jsonb_typeof(v_opts) <> 'array' or jsonb_array_length(v_opts) = 0 then return; end if;
  v_handler  := coalesce(p_def->>'handler', 'player');
  v_resolver := public._card_decision_resolver(p_nation, v_handler, p_played_by);
  v_name     := coalesce(p_def->>'name', 'a card');
  insert into public.card_decisions (nation_id, deck_card_id, card_name, card_desc, options, handler, resolver_party_id, played_by_party_id, created_tick)
    values (p_nation, p_deck_card, v_name, coalesce(p_def->>'desc', ''), v_opts, v_handler, v_resolver, p_played_by, p_tick);
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (p_nation, p_played_by, 'party',
            v_name || ' forces a decision — awaiting ' ||
              case when v_handler = 'player' then 'the party that played it'
                   when v_handler = 'hog'    then 'the Head of Government'
                   else 'the ' || v_handler || ' minister' end || '.',
            public.current_game_date());
end $$;
revoke all on function public._create_card_decision(text, uuid, uuid, jsonb, int) from public, anon, authenticated;

-- The resolver picks an option; its effect fires (through the shared dispatcher) and the decision
-- closes. Only the decision's resolver (or an admin) may call it.
drop function if exists public.card_decide(uuid, int);   -- was 2-arg; now takes the decider's chosen nation
create or replace function public.card_decide(p_decision uuid, p_option int, p_nation text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_pname text; v_d record; v_opt jsonb; v_tick int; v_resolver uuid; e jsonb;
  v_body text; v_decider text; v_choice text; v_desc text;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'Not signed in.'; end if;
  select id, name into v_pid, v_pname from public.parties where user_id = v_uid;

  select * into v_d from public.card_decisions where id = p_decision for update;
  if not found then raise exception 'No such decision.'; end if;
  if v_d.status <> 'pending' then raise exception 'That decision has already been made.'; end if;
  -- Effective resolver: if the stored resolver's party was deleted (resolver_party_id → null via the
  -- FK), re-route (minister → HoG → player) so the decision isn't orphaned.
  v_resolver := coalesce(v_d.resolver_party_id, public._card_decision_resolver(v_d.nation_id, v_d.handler, v_d.played_by_party_id));
  if v_resolver is distinct from v_pid and not public.is_admin() then
    raise exception 'That decision is not yours to make.'; end if;
  if p_option is null or p_option < 0 or p_option >= jsonb_array_length(v_d.options) then
    raise exception 'Pick a valid option.'; end if;

  v_opt := v_d.options -> p_option;
  select current_tick into v_tick from public.game_state where id;

  -- A rel_pick effect ("relations with a nation of the decider's choice") needs the nation named NOW.
  -- Validate it once, up front, so no other effect on the option applies before we bail on a bad pick.
  if exists (select 1 from jsonb_array_elements(
               case when jsonb_typeof(v_opt->'fx') = 'array' then v_opt->'fx' else jsonb_build_array(v_opt) end) e2
              where e2->>'kind' = 'rel_pick') then
    if p_nation is null or not exists (select 1 from public.nations where id = p_nation) then
      raise exception 'Choose a nation to improve relations with.'; end if;
    if p_nation = v_d.nation_id then raise exception 'Pick a nation other than your own.'; end if;
  end if;

  -- Apply every effect on the chosen option (an option carries up to 3). Nation/coalition effects land;
  -- decider_gain/decider_lose target the resolving party (v_resolver); rel_pick improves relations with
  -- the nation the decider just named (reusing the rel_up handler with the chosen nation injected); a
  -- play-time party-targeted effect (party_gain/lose) is still left untargeted here. Supports the legacy
  -- single-effect shape ({kind,p}) too via coalesce.
  for e in select value from jsonb_array_elements(
             case when jsonb_typeof(v_opt->'fx') = 'array' then v_opt->'fx' else jsonb_build_array(v_opt) end) loop
    if e->>'kind' = 'bill' then
      perform public._create_card_bill(v_d.nation_id, v_resolver, e->'p', v_tick);   -- the deciding party introduces the bill (schema/183)
    elsif e->>'kind' = 'rel_pick' then
      perform public._apply_card_effect(v_d.nation_id, null, 'rel_up',
        coalesce(e->'p', '{}'::jsonb) || jsonb_build_object('nation', p_nation), v_tick);
    else
      perform public._apply_card_effect(v_d.nation_id,
        case when e->>'kind' in ('decider_gain', 'decider_lose') then v_resolver else null end,
        e->>'kind', e->'p', v_tick);
    end if;
  end loop;

  -- If the chosen option carries a 'shuffle' effect, the played card returns to the deck to be won again
  -- (instead of staying discarded) — the conditional recycler: one option recycles, another discards.
  if v_d.deck_card_id is not null
     and exists (select 1 from jsonb_array_elements(
           case when jsonb_typeof(v_opt->'fx') = 'array' then v_opt->'fx' else jsonb_build_array(v_opt) end) e2
          where e2->>'kind' = 'shuffle') then
    perform public._card_return_to_deck(v_d.deck_card_id);
  end if;

  update public.card_decisions set status = 'resolved', chosen_idx = p_option where id = p_decision;

  -- Announce the resolved decision to the World Timeline (kind 'card'): the matter, its description, and
  -- the choice the decider made — "In {nation}, on the matter of {title}, {desc} {decider} has chosen to
  -- {choice}." The title is wrapped in ** so the feed renders it bold. The decider reads from the handler
  -- (a ministry → "The X Minister"; the Head of Government; else the resolving party).
  v_decider := case
                 when v_d.handler is null or v_d.handler = 'player' then coalesce(v_pname, 'The government')
                 when v_d.handler = 'hog' then 'The Head of Government'
                 else 'The ' || v_d.handler || ' Minister' end;
  v_choice := coalesce(nullif(v_opt->>'txt', ''), 'act');
  v_desc   := coalesce(v_d.card_desc, '');
  v_body   := 'In ' || coalesce((select name from public.nations where id = v_d.nation_id), v_d.nation_id)
              || ', on the matter of **' || v_d.card_name || '**';
  if v_desc <> '' then
    v_body := v_body || ', ' || v_desc;
    if v_body !~ '[.!?]$' then v_body := v_body || '.'; end if;
  else
    v_body := v_body || '.';
  end if;
  v_body := v_body || ' ' || v_decider || ' has chosen to ' || v_choice || '.';
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_d.nation_id, v_pid, 'card', v_body, public.current_game_date());
end $$;
grant execute on function public.card_decide(uuid, int, text) to authenticated;

notify pgrst, 'reload schema';
