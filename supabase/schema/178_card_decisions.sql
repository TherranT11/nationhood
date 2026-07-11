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
  insert into public.card_decisions (nation_id, deck_card_id, card_name, options, handler, resolver_party_id, played_by_party_id, created_tick)
    values (p_nation, p_deck_card, v_name, v_opts, v_handler, v_resolver, p_played_by, p_tick);
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (p_nation, p_played_by, 'party',
            v_name || ' forces a decision — awaiting ' ||
              case when v_handler = 'player' then 'the party that played it' else 'the ' || v_handler || ' minister' end || '.',
            public.current_game_date());
end $$;
revoke all on function public._create_card_decision(text, uuid, uuid, jsonb, int) from public, anon, authenticated;

-- The resolver picks an option; its effect fires (through the shared dispatcher) and the decision
-- closes. Only the decision's resolver (or an admin) may call it.
create or replace function public.card_decide(p_decision uuid, p_option int)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_pid uuid; v_pname text; v_d record; v_opt jsonb; v_tick int; v_resolver uuid;
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
  -- Apply the chosen option's effect. Nation/coalition effects land; a party-targeted option is left
  -- untargeted for now (target-picker is a later pass), consistent with the immediate engine.
  perform public._apply_card_effect(v_d.nation_id, v_resolver, null, v_opt->>'kind', v_opt->'p', v_tick);

  update public.card_decisions set status = 'resolved', chosen_idx = p_option where id = p_decision;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_d.nation_id, v_pid, 'party',
            coalesce(v_pname, 'A party') || ' resolved "' || v_d.card_name || '"' ||
              case when coalesce(v_opt->>'txt', '') <> '' then ' — ' || (v_opt->>'txt') else '' end || '.',
            public.current_game_date());
end $$;
grant execute on function public.card_decide(uuid, int) to authenticated;

notify pgrst, 'reload schema';
