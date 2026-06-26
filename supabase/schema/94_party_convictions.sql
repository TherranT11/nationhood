-- 94 · Party convictions (adoption).
-- Depends on: 20 (parties.conviction/archetype/popularity), 40 (events +
-- current_game_date), 60 (archetype_oppositions), 70 (_mod_cap_raise/_mod_floor_drop),
-- 91 (_apply_policy_effect), 93 (convictions). Run after 93.
--
-- Which convictions each party has adopted. Adopting spends the party's conviction
-- points and applies the conviction's one-time on-adopt effects. The per-tick
-- "while active" trigger engine reads this table (a later file). Public read (the
-- manifesto shows adopted state); writes only through adopt_conviction().

create table if not exists public.party_convictions (
  party_id      uuid not null references public.parties (id)      on delete cascade,
  conviction_id uuid not null references public.convictions (id)  on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (party_id, conviction_id)
);
alter table public.party_convictions drop column if exists adopted_tick;  -- unused (created_at records when)

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
  elsif v_t = 'Popularity Ceiling' then
    -- party-scoped (intercept before delegating, which would hit every party)
    update public.parties set pop_ceiling = greatest(0, least(100, pop_ceiling + v_v)) where id = p_party;
  else
    perform public._apply_policy_effect(p_nation, p_eff);
  end if;
end $$;

-- Adopt a conviction for the caller's party: validate, spend the points, record it,
-- apply the on-adopt effects, and announce the new platform. Server-authoritative.
-- A party is NOT locked to one archetype — it may mix convictions across trees, with
-- two rules: it can't adopt a conviction whose archetype OPPOSES one it already holds
-- (archetype_oppositions, schema/60), and its identity (parties.archetype) is the
-- archetype it holds the MOST convictions in (recomputed here, read everywhere else).
create or replace function public.adopt_conviction(p_conviction uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_def jsonb; v_arch text; v_cost int; v_eff jsonb; v_body text;
        v_level int; v_mult numeric; v_held int;
begin
  v_party := public._lock_party();
  select definition into v_def from public.convictions where id = p_conviction;
  if v_def is null then raise exception 'That conviction no longer exists.'; end if;
  v_arch := v_def->>'archetype';
  if exists (select 1 from public.party_convictions where party_id = v_party.id and conviction_id = p_conviction) then
    raise exception 'Your party has already adopted that conviction.';
  end if;
  -- Coherence: reject if the new archetype opposes one the party already holds a
  -- conviction in (the table is seeded both directions, so this single join catches it).
  if exists (
    select 1 from public.party_convictions pc
    join public.convictions c on c.id = pc.conviction_id
    join public.archetype_oppositions o on o.archetype = (c.definition->>'archetype') and o.opposes = v_arch
    where pc.party_id = v_party.id
  ) then
    raise exception 'That conviction contradicts an ideology your party already holds.';
  end if;
  -- Scaling cost: each conviction already held at this level multiplies the base cost —
  -- Level I ×2 per held, Level II ×3 per held, Levels III–V flat. MIRRORS convScaledCost
  -- (convictions.js), which the manifesto uses to show the same price.
  v_level := coalesce((v_def->>'level')::int, 1);
  v_mult  := case v_level when 1 then 2 when 2 then 3 else 1 end;
  select count(*) into v_held from public.party_convictions pc
    join public.convictions c on c.id = pc.conviction_id
    where pc.party_id = v_party.id and coalesce((c.definition->>'level')::int, 1) = v_level;
  v_cost := round(coalesce((v_def->>'cost')::int, 0) * power(v_mult, v_held))::int;
  if v_party.conviction < v_cost then raise exception 'Not enough conviction points.'; end if;

  update public.parties set conviction = conviction - v_cost where id = v_party.id;
  insert into public.party_convictions (party_id, conviction_id) values (v_party.id, p_conviction);

  -- Identity = the archetype this party holds the most convictions in; ties go to the
  -- tree it committed to earliest. Recompute now (with the new row counted) so the
  -- on-adopt effects below and every reader see the up-to-date archetype.
  update public.parties p set archetype = (
    select c.definition->>'archetype'
    from public.party_convictions pc
    join public.convictions c on c.id = pc.conviction_id
    where pc.party_id = v_party.id
    group by c.definition->>'archetype'
    order by count(*) desc, min(pc.created_at) asc
    limit 1
  ) where p.id = v_party.id;

  for v_eff in select value from jsonb_array_elements(coalesce(v_def->'onAdopt', '[]'::jsonb)) loop
    perform public._apply_conviction_effect(v_party.id, v_party.nation_id, v_eff);
  end loop;

  -- Announce the new platform to the shared feed — one of five flavours, picked at
  -- random. Plain text (the feed escapes event bodies); %1$s = party, %2$s = conviction.
  v_body := format((array[
    'The %1$s has unveiled a new platform, enshrining %2$s as a founding principle of the party.',
    'In a defining shift, the %1$s has reshaped its platform around a new core conviction: %2$s.',
    'The %1$s has formally adopted %2$s, planting it at the heart of the party''s new platform.',
    'With a freshly announced platform, the %1$s now counts %2$s among its core principles.',
    'The %1$s has declared a new direction, taking up %2$s as a central pillar of its identity.'
  ])[1 + floor(random() * 5)::int], v_party.name, v_def->>'name');
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'conviction', v_body, public.current_game_date());

  return jsonb_build_object('ok', true, 'conviction', (select conviction from public.parties where id = v_party.id));
end $$;
grant execute on function public.adopt_conviction(uuid) to authenticated;

-- Drop a conviction the caller's party holds. Abandoning a platform is costly: −30 party
-- popularity, −20 popularity ceiling, and (only while the party governs) −20 government
-- confidence. The spent conviction points are NOT refunded. Penalties run through the same
-- effect engine as adoption (one source for the target→field mapping, clamps and floors),
-- then the party's identity archetype is recomputed (null when no convictions remain).
create or replace function public.drop_conviction(p_conviction uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_def jsonb;
begin
  v_party := public._lock_party();
  if not exists (select 1 from public.party_convictions where party_id = v_party.id and conviction_id = p_conviction) then
    raise exception 'Your party has not adopted that conviction.';
  end if;
  select definition into v_def from public.convictions where id = p_conviction;

  delete from public.party_convictions where party_id = v_party.id and conviction_id = p_conviction;

  perform public._apply_conviction_effect(v_party.id, v_party.nation_id, jsonb_build_object('t', 'Party Popularity', 'v', -30));
  perform public._apply_conviction_effect(v_party.id, v_party.nation_id, jsonb_build_object('t', 'Popularity Ceiling', 'v', -20));
  if v_party.in_government then
    perform public._apply_conviction_effect(v_party.id, v_party.nation_id, jsonb_build_object('t', 'Government Confidence', 'v', -20));
  end if;

  -- Identity = the archetype this party now holds the most convictions in (null if none) —
  -- mirrors the recompute in adopt_conviction.
  update public.parties p set archetype = (
    select c.definition->>'archetype'
    from public.party_convictions pc
    join public.convictions c on c.id = pc.conviction_id
    where pc.party_id = v_party.id
    group by c.definition->>'archetype'
    order by count(*) desc, min(pc.created_at) asc
    limit 1
  ) where p.id = v_party.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'conviction',
            v_party.name || ' has abandoned ' || coalesce(v_def->>'name', 'a core conviction') || ', renouncing it from the party platform.',
            public.current_game_date());

  return jsonb_build_object('ok', true, 'conviction', (select conviction from public.parties where id = v_party.id));
end $$;
grant execute on function public.drop_conviction(uuid) to authenticated;

-- ── While-active trigger engine (per tick) ─────────────────────────────────────
-- Snapshot of each nation's watchable values + each party's prior popularity, taken
-- once per tick so a trigger can measure how a stat moved month-over-month.
alter table public.nations  add column if not exists conv_snapshot jsonb;
alter table public.parties  add column if not exists conv_prev_pop numeric;
alter table public.parties  add column if not exists conv_prev_ceiling numeric;  -- watch baseline for Popularity Ceiling

-- Safe numeric read: null (not an error) on a non-numeric value, e.g. a legacy text
-- regime — a watched stat that can't be read simply doesn't fire its trigger.
create or replace function public._num(t text) returns numeric language sql immutable as $$
  select case when t ~ '^-?[0-9]+(\.[0-9]+)?$' then t::numeric else null end;
$$;

-- One watchable target's value out of a state (stats/economy/production jsonb + the
-- active government's confidence) — used for both the current state and the snapshot.
create or replace function public._target_from_state(p_stats jsonb, p_economy jsonb, p_production jsonb, p_conf numeric, p_t text)
returns numeric language sql immutable as $$
  select case p_t
    when 'Prosperity' then public._num(p_stats->>'prosperity')
    when 'Welfare' then public._num(p_stats->>'welfare')
    when 'Growth' then public._num(p_stats->>'growth')
    when 'Order' then public._num(p_stats->>'order')
    when 'Image' then public._num(p_stats->>'image')
    when 'Unemployment %' then public._num(p_economy->>'unemployment')
    when 'Inflation %' then public._num(p_economy->>'inflation')
    when 'Tax Burden %' then public._num(p_economy->>'tax')
    when 'Budget' then public._num(p_economy->>'budget')
    when 'Debt' then public._num(p_economy->>'debt')
    when 'Regime' then public._num(p_economy->>'regime')
    when 'Government Confidence' then p_conf
    when 'Energy' then public._num(p_production->>'energy')
    when 'Food' then public._num(p_production->>'food')
    when 'Minerals' then public._num(p_production->>'minerals')
    when 'Goods' then public._num(p_production->>'goods')
    when 'Services' then public._num(p_production->>'services')
    when 'Diplomacy' then public._num(p_production->>'diplomacy')
    else null end;
$$;

-- Called once per tick by advance_tick (schema/60). For every adopted conviction's
-- "while active" effects: a standing modifier applies its flat value each month; a
-- trigger rewards the movement of its watched stat since last tick — proportional,
-- reward = rv × (movement-in-direction ÷ per) — plus the mirrored inverse on the
-- opposite move when set. An effect may be role-gated ('when' = gov/opp) so it only
-- applies while the party governs / sits in opposition. Then the per-nation / per-party
-- snapshots are refreshed (so this tick's own effects don't re-trigger next tick).
create or replace function public._apply_conviction_triggers(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare
  r record; v_eff jsonb; v_snap jsonb; v_conf numeric;
  v_cur numeric; v_prev numeric; v_delta numeric; v_mv numeric; v_per numeric; v_rv numeric; v_dir text;
begin
  for r in
    select pc.party_id, p.nation_id, p.popularity as party_pop, p.conv_prev_pop,
           p.pop_ceiling as party_ceiling, p.conv_prev_ceiling, p.in_government,
           n.stats, n.economy, n.production, n.conv_snapshot,
           c.definition->'whileActive' as wa
    from public.party_convictions pc
    join public.parties p     on p.id = pc.party_id
    join public.nations n     on n.id = p.nation_id
    join public.convictions c on c.id = pc.conviction_id
    where jsonb_typeof(c.definition->'whileActive') = 'array'
  loop
    v_snap := r.conv_snapshot;
    select confidence into v_conf from public.governments where nation_id = r.nation_id and status = 'active';
    for v_eff in select value from jsonb_array_elements(r.wa) loop
      -- Role gate: an effect scoped to 'gov'/'opp' only applies when the party's
      -- current role matches (default — no 'when' — applies always).
      if (v_eff->>'when') = 'gov' and not coalesce(r.in_government, false) then continue; end if;
      if (v_eff->>'when') = 'opp' and coalesce(r.in_government, false) then continue; end if;
      if (v_eff->>'kind') = 'standing' then
        perform public._apply_conviction_effect(r.party_id, r.nation_id, jsonb_build_object('t', v_eff->>'t', 'v', v_eff->'v'));
      else
        if v_snap is null then continue; end if;          -- no baseline yet
        if (v_eff->>'stat') = 'Party Popularity' then
          v_cur := r.party_pop; v_prev := r.conv_prev_pop;
        elsif (v_eff->>'stat') = 'Popularity Ceiling' then
          v_cur := r.party_ceiling; v_prev := r.conv_prev_ceiling;
        else
          v_cur  := public._target_from_state(r.stats, r.economy, r.production, v_conf, v_eff->>'stat');
          v_prev := public._target_from_state(v_snap->'stats', v_snap->'economy', v_snap->'production', (v_snap->>'conf')::numeric, v_eff->>'stat');
        end if;
        if v_cur is null or v_prev is null then continue; end if;
        v_delta := v_cur - v_prev;
        v_per := coalesce((v_eff->>'per')::numeric, 1); if v_per <= 0 then v_per := 1; end if;
        v_rv  := coalesce((v_eff->>'rv')::numeric, 0);
        v_dir := v_eff->>'dir';
        v_mv := case when v_dir = 'rise' then greatest(0, v_delta) when v_dir = 'fall' then greatest(0, -v_delta) else abs(v_delta) end;
        if v_mv > 0 then
          perform public._apply_conviction_effect(r.party_id, r.nation_id, jsonb_build_object('t', v_eff->>'rt', 'v', to_jsonb(v_rv * (v_mv / v_per))));
        end if;
        if coalesce((v_eff->>'sym')::boolean, false) and v_dir <> 'either' then
          v_mv := case when v_dir = 'rise' then greatest(0, -v_delta) else greatest(0, v_delta) end;
          if v_mv > 0 then
            perform public._apply_conviction_effect(r.party_id, r.nation_id, jsonb_build_object('t', v_eff->>'rt', 'v', to_jsonb(-v_rv * (v_mv / v_per))));
          end if;
        end if;
      end if;
    end loop;
  end loop;

  -- Refresh snapshots for next tick (only nations/parties that hold convictions).
  update public.nations n set conv_snapshot = jsonb_build_object(
      'stats', n.stats, 'economy', n.economy, 'production', n.production,
      'conf', (select g.confidence from public.governments g where g.nation_id = n.id and g.status = 'active'))
    where exists (select 1 from public.parties p join public.party_convictions pc on pc.party_id = p.id where p.nation_id = n.id);
  update public.parties p set conv_prev_pop = p.popularity, conv_prev_ceiling = p.pop_ceiling
    where exists (select 1 from public.party_convictions pc where pc.party_id = p.id);
end $$;

notify pgrst, 'reload schema';
