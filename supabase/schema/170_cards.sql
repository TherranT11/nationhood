-- ===========================================================================
-- 170 · Cards — Phase 1: the card pool + per-nation decks + the shuffle.
-- An admin authors a card in the Card Creator (adminsetup, Phase 2); its full spec is stored as a
-- jsonb `definition` (same pattern as policies/initiatives/world_events). Saving a card SHUFFLES it
-- into decks: a copy in EVERY live nation's deck (Limiter 'all'), or one nation's deck ('nation').
--
-- Model mirrors initiatives: cards (definition pool, schema/140 analog) + deck_cards (per-nation
-- instance, schema/141 analog). The in-game draw/hand/play runtime is a later phase — deck_cards.status
-- carries the lifecycle and starts at 'in_deck'.
--
-- Depends on: 10 (nations), 00/is_admin. Apply in the Supabase SQL Editor. Idempotent.
-- ===========================================================================

-- The card pool — one row per authored card, its whole spec in `definition` (name, cost, type/axis,
-- mechanic, effects, purchase requirements, chains, persistence — whatever the Card Creator emits).
create table if not exists public.cards (
  id         uuid primary key default gen_random_uuid(),
  definition jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.cards enable row level security;
drop policy if exists "cards_select_all"   on public.cards;
create policy "cards_select_all"   on public.cards for select using (true);      -- readable in play
-- No direct INSERT policy: cards are created ONLY through card_create() (security definer), so a card
-- can never enter the pool without also being shuffled into decks. Admins may still edit/delete an
-- existing card — a delete cascades it out of every deck; an edit that changes the Limiter must
-- re-shuffle, which the Phase 2 edit flow does via an RPC (not a raw update).
drop policy if exists "cards_insert_admin" on public.cards;   -- retire any direct-insert grant (bypassed the shuffle)
drop policy if exists "cards_update_admin" on public.cards;
create policy "cards_update_admin" on public.cards for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "cards_delete_admin" on public.cards;
create policy "cards_delete_admin" on public.cards for delete using (public.is_admin());

-- Per-nation deck membership — which card sits in which nation's deck, and its lifecycle. An
-- All-Nations card lands as one row per nation; a Specific-Nation card as a single row. Deleting a
-- card removes it from every deck (cascade). status: 'in_deck' now; hand/played come with the runtime.
create table if not exists public.deck_cards (
  id         uuid primary key default gen_random_uuid(),
  nation_id  text not null references public.nations (id) on delete cascade,
  card_id    uuid not null references public.cards (id)   on delete cascade,
  status     text not null default 'in_deck',
  created_at timestamptz not null default now()
);
create index if not exists deck_cards_nation_idx on public.deck_cards (nation_id);
create index if not exists deck_cards_card_idx   on public.deck_cards (card_id);

alter table public.deck_cards enable row level security;
drop policy if exists "deck_cards_select_all" on public.deck_cards;
create policy "deck_cards_select_all" on public.deck_cards for select using (true);
-- No client insert/update/delete: the shuffle + (later) draw/play RPCs are security definer.
-- select-all is fine now — deck membership is open info, like the rest of the game. When the runtime
-- adds an 'in_hand' state, revisit this so a player's hand isn't readable by opponents.

-- card_create(definition): author a card AND shuffle it into decks in one admin action — this is what
-- "Save to Card Pool" calls. Reads the Limiter from the definition: 'nation' → the one nation named in
-- definition->>'nation' (a nation id); anything else ('all') → a copy in every live (non-dormant)
-- nation's deck. Returns the new card id. Admin-only; security definer so it can write deck_cards.
-- (Shuffle covers nations that exist NOW; seeding a later-created nation's deck is a runtime concern.)
create or replace function public.card_create(p_definition jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_card uuid; v_lim text; v_nation text;
begin
  if not public.is_admin() then raise exception 'Admins only.'; end if;
  if p_definition is null or jsonb_typeof(p_definition) <> 'object' then
    raise exception 'A card definition is required.';
  end if;

  insert into public.cards (definition) values (p_definition) returning id into v_card;

  v_lim := coalesce(p_definition->>'lim', 'all');
  if v_lim = 'nation' then
    v_nation := p_definition->>'nation';
    if v_nation is null or v_nation = '' then raise exception 'A Specific-Nation card needs a nation.'; end if;
    if not exists (select 1 from public.nations where id = v_nation) then
      raise exception 'No such nation: %', v_nation;
    end if;
    insert into public.deck_cards (nation_id, card_id) values (v_nation, v_card);
  else
    insert into public.deck_cards (nation_id, card_id)
      select id, v_card from public.nations where not coalesce(dormant, false);
  end if;

  -- Auto-draw: wherever this card just landed and the market has room (below its target, schema/172),
  -- put THIS card straight on the block instead of waiting for the next tick. One card per nation, only
  -- into an open slot — a full block is left alone (the card waits in the deck). Covers All + Nation.
  update public.deck_cards dc set status = 'on_block'
   where dc.card_id = v_card and dc.status = 'in_deck'
     and (select count(*) from public.deck_cards b where b.nation_id = dc.nation_id and b.status = 'on_block')
         < public._card_block_target(dc.nation_id);

  return v_card;
end $$;
grant execute on function public.card_create(jsonb) to authenticated;

notify pgrst, 'reload schema';
