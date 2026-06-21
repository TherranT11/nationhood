-- 94 · Party convictions (adoption).
-- Depends on: 20 (parties.conviction/archetype/popularity), 70 (_mod_cap_raise/
-- _mod_floor_drop), 91 (_apply_policy_effect), 93 (convictions). Run after 93.
--
-- Which convictions each party has adopted. Adopting spends the party's conviction
-- points and applies the conviction's one-time on-adopt effects. The per-tick
-- "while active" trigger engine reads this table (a later file). Public read (the
-- manifesto shows adopted state); writes only through adopt_conviction().

create table if not exists public.party_convictions (
  party_id      uuid not null references public.parties (id)      on delete cascade,
  conviction_id uuid not null references public.convictions (id)  on delete cascade,
  adopted_tick  int  not null,
  created_at    timestamptz not null default now(),
  primary key (party_id, conviction_id)
);

alter table public.party_convictions enable row level security;
drop policy if exists "pconv_select_all" on public.party_convictions;
create policy "pconv_select_all" on public.party_convictions for select using (true);
-- No insert/update/delete grants: adoption goes through adopt_conviction() only.

-- Apply one conviction effect {t, v} (flat). Party-scoped targets (Party Popularity)
-- hit the adopting party through the archetype ceiling/floor helpers; every other
-- target is a national / resource / government effect and reuses the policy effects
-- engine (schema/91) — one source for the target→field mapping and clamps.
create or replace function public._apply_conviction_effect(p_party uuid, p_nation text, p_eff jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_t text := p_eff->>'t'; v_v numeric := coalesce((p_eff->>'v')::numeric, 0); v_arch text; v_pop numeric; v_new numeric;
begin
  if v_t is null or v_v = 0 then return; end if;
  if v_t = 'Party Popularity' then
    select archetype, popularity into v_arch, v_pop from public.parties where id = p_party;
    if not found then return; end if;
    if v_v >= 0 then v_new := public._mod_cap_raise(p_nation, v_arch, v_pop, v_pop + v_v);
    else             v_new := public._mod_floor_drop(p_nation, v_arch, v_pop, v_pop + v_v); end if;
    update public.parties set popularity = greatest(0, least(100, v_new)) where id = p_party;
  else
    perform public._apply_policy_effect(p_nation, p_eff);
  end if;
end $$;

-- Adopt a conviction for the caller's party: validate archetype + cost, spend the
-- points, record it, and apply the on-adopt effects. Server-authoritative.
create or replace function public.adopt_conviction(p_conviction uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_def jsonb; v_cost int; v_tick int; v_eff jsonb;
begin
  v_party := public._lock_party();
  select definition into v_def from public.convictions where id = p_conviction;
  if v_def is null then raise exception 'That conviction no longer exists.'; end if;
  if v_party.archetype is null or v_party.archetype is distinct from (v_def->>'archetype') then
    raise exception 'That conviction belongs to a different archetype.';
  end if;
  if exists (select 1 from public.party_convictions where party_id = v_party.id and conviction_id = p_conviction) then
    raise exception 'Your party has already adopted that conviction.';
  end if;
  v_cost := coalesce((v_def->>'cost')::int, 0);
  if v_party.conviction < v_cost then raise exception 'Not enough conviction points.'; end if;
  select current_tick into v_tick from public.game_state where id;

  update public.parties set conviction = conviction - v_cost where id = v_party.id;
  insert into public.party_convictions (party_id, conviction_id, adopted_tick) values (v_party.id, p_conviction, v_tick);
  for v_eff in select value from jsonb_array_elements(coalesce(v_def->'onAdopt', '[]'::jsonb)) loop
    perform public._apply_conviction_effect(v_party.id, v_party.nation_id, v_eff);
  end loop;

  return jsonb_build_object('ok', true, 'conviction', (select conviction from public.parties where id = v_party.id));
end $$;
grant execute on function public.adopt_conviction(uuid) to authenticated;

notify pgrst, 'reload schema';
