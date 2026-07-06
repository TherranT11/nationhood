-- 141 · National Initiatives — RUNTIME. The Minister of Economic Development enacts an authored
-- initiative (schema/140): it costs the authored Influence upfront and a standing $B/yr against the
-- nation's Budget Balance (schema/152) the whole time it runs — NOT an upfront lump. After a rolled
-- build-up it lands a PERMANENT production increase. On-enact effects: private → +1 Growth; state →
-- −1D2 Unemployment & Inflation. It runs until the Minister DEACTIVATES it (which stops the $B/yr and
-- reverses the production). One initiative at a time per nation; a one-time initiative is gone once
-- carried out here; a recurring one can be enacted again once none is running.
-- Depends on: 140 (national_initiatives), 91 (_apply_policy_effect / _nation_stat_add), 40
-- (_begin_action / _lock_party), 47 (corporations), 60 (advance_tick hook), 114
-- (_party_holds_ministry). Run after 140.
-- ===========================================================================

-- Is the signed-in player's party the Minister of Economic Development? Drives the home action
-- container + the enact controls in the National Initiatives panel. Mirrors is_trade_minister
-- (schema/114) through the shared _party_holds_ministry helper.
create or replace function public.is_economic_development_minister()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select public._party_holds_ministry(id, 'Economic Development') from public.parties where user_id = auth.uid()), false);
$$;
grant execute on function public.is_economic_development_minister() to authenticated;

-- Per-nation live initiative instances. World-readable (players see progress, like nation_crises);
-- NO client writes — only the enact RPC + tick (both security definer) touch it.
create table if not exists public.nation_initiatives (
  id            uuid primary key default gen_random_uuid(),
  nation_id     text not null references public.nations (id) on delete cascade,
  initiative_id uuid not null references public.national_initiatives (id) on delete cascade,
  corp_id       uuid references public.corporations (id) on delete set null,  -- state: the SO firm carrying it out; private: null (competitive bids)
  status        text not null default 'active',   -- 'active' (running — costs $B/yr) | 'ended' (deactivated)
  started_tick  int  not null,
  complete_tick int  not null,                     -- started_tick + rolled build-up; the production increase lands when the clock reaches it
  created_at    timestamptz not null default now()
);
create index if not exists nation_initiatives_nation_idx on public.nation_initiatives (nation_id);
-- The money cost is now a standing Budget Balance line (schema/152), not a per-tick treasury drain,
-- so the old per-tick column is gone (idempotent drop for databases created before this change).
alter table public.nation_initiatives drop column if exists cost_per_tick;

-- Has the build-up finished and the production increase landed? While false the initiative still
-- costs its $B/yr but hasn't raised production yet; deactivating a built initiative reverses it.
alter table public.nation_initiatives add column if not exists built boolean not null default false;

-- Joint-project split (schema/142): a partner nation co-funds and receives a benefit on completion.
-- partner_share is the % of the $B/yr Budget Balance cost the partner covers (0 = solo). nation_id is
-- always the enacting nation that gets the production; the partner's benefit is in the definition's joint block.
alter table public.nation_initiatives add column if not exists partner_nation text references public.nations (id) on delete set null;
alter table public.nation_initiatives add column if not exists partner_share  int not null default 0;

alter table public.nation_initiatives enable row level security;
drop policy if exists "nation_initiatives_select_all" on public.nation_initiatives;
create policy "nation_initiatives_select_all" on public.nation_initiatives for select using (true);
-- (No insert/update/delete policy: clients never write; the enact RPC + tick are security definer.)

-- ---------------------------------------------------------------------------
-- initiative_enact(initiative, ownership, corp): the Minister of Economic Development starts a
-- national initiative. Gated to the party holding that portfolio; costs 2 party actions. The Minister
-- picks the execution model — 'private' (corporations bid, −20%, +1 Growth) or 'state' (the nation's
-- own state-owned firm in an authorised sector, +25%, −1D2 Unemployment & Inflation). Rolls the
-- duration in [min,max], applies that model's on-enact effects, and books the instance (its cost
-- drains over the duration via the tick — NOT paid up front). corp is required for 'state' (the
-- SO firm) and ignored for 'private'.
-- ---------------------------------------------------------------------------
-- ---------------------------------------------------------------------------
-- _initiative_start(nation, initiative, ownership, corp, partner, share): books an instance for
-- `nation`. The ONE place the booking lives — the solo enact and the joint accept (schema/142) both
-- call it, so eligibility, the one-at-a-time lock, the cost model, the ownership adjustment +
-- on-enact effects, and the insert are identical. Does NOT gate the caller or spend AP (that stays
-- with the caller). partner/share carry the joint split (null/0 for a solo). Returns { id, months,
-- complete_tick }.
-- ---------------------------------------------------------------------------
-- The Influence the Minister spends upfront to enact an initiative: the authored figure, min 1.
create or replace function public._initiative_influence(p_def jsonb)
returns int language sql immutable as $$
  select greatest(1, coalesce((p_def->>'influence')::int, 1));
$$;
revoke all on function public._initiative_influence(jsonb) from public, anon, authenticated;

create or replace function public._initiative_start(p_nation text, p_initiative uuid, p_ownership text,
                                                    p_corp uuid, p_partner text default null, p_share int default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_def jsonb; v_tick int; v_elig jsonb; v_dur int; v_minm int; v_maxm int;
  v_own text; v_cadence text; v_id uuid; v_roll int; v_corp uuid;
begin
  select definition into v_def from public.national_initiatives where id = p_initiative;
  if v_def is null then raise exception 'That initiative no longer exists.'; end if;

  -- Eligible for this nation? ('*' = global, else the nation must be in the list.)
  v_elig := v_def->'eligibleNations';
  if not ((v_def->>'eligibleNations') = '*' or (jsonb_typeof(v_elig) = 'array' and v_elig ? p_nation)) then
    raise exception 'Your nation is not eligible for this initiative.';
  end if;

  -- One at a time: lock the nation row so two starts can't both slip an instance in.
  perform 1 from public.nations where id = p_nation for update;
  if exists (select 1 from public.nation_initiatives where nation_id = p_nation and status = 'active') then
    raise exception 'Your nation already has an initiative under way — it must finish first.';
  end if;

  -- One-time availability: a non-recurring initiative can be carried out here only once, ever.
  v_cadence := coalesce(v_def->>'cadence', 'one_time');
  if v_cadence <> 'recurring'
     and exists (select 1 from public.nation_initiatives where nation_id = p_nation and initiative_id = p_initiative) then
    raise exception 'That one-time initiative has already been carried out here.';
  end if;

  v_own := lower(coalesce(p_ownership, ''));
  if v_own not in ('private', 'state') then raise exception 'Choose private enterprise or state sanctioned.'; end if;

  v_minm := greatest(1, coalesce((v_def->'lengthMonths'->>0)::int, 12));
  v_maxm := greatest(v_minm, coalesce((v_def->'lengthMonths'->>1)::int, v_minm));
  v_dur  := v_minm + floor(random() * (v_maxm - v_minm + 1))::int;   -- roll [min, max] months of build-up

  -- STATE: carried out by one of the nation's OWN state-owned firms in an authorised sector.
  -- PRIVATE: firms bid — no executor bound, p_corp ignored.
  v_corp := null;
  if v_own = 'state' then
    if p_corp is null then raise exception 'Choose a state-owned corporation to carry out this initiative.'; end if;
    if not exists (
      select 1 from public.corporations c
       where c.id = p_corp and c.nation_id = p_nation and c.status = 'placed' and c.type = 'so'
         and jsonb_typeof(v_def->'sectors') = 'array' and (v_def->'sectors') ? c.category
    ) then
      raise exception 'That corporation can''t carry out this initiative — it must be a state-owned firm in an authorised sector.';
    end if;
    v_corp := p_corp;
  end if;

  select current_tick into v_tick from public.game_state where id;

  -- On-enact effects (schema/91 is the one source for the stat mapping + clamps).
  if v_own = 'private' then
    perform public._apply_policy_effect(p_nation, jsonb_build_object('t', 'Growth', 'v', 1));
  elsif v_own = 'state' then
    v_roll := floor(random() * 2)::int + 1;   -- 1D2
    perform public._apply_policy_effect(p_nation, jsonb_build_object('t', 'Unemployment %', 'v', -v_roll));
    perform public._apply_policy_effect(p_nation, jsonb_build_object('t', 'Inflation %',    'v', -v_roll));
  end if;

  insert into public.nation_initiatives (nation_id, initiative_id, corp_id, started_tick, complete_tick, partner_nation, partner_share)
    values (p_nation, p_initiative, v_corp, v_tick, v_tick + v_dur,
            p_partner, greatest(0, least(100, coalesce(p_share, 0))))
    returning id into v_id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (p_nation, null, 'economy',
            coalesce(nullif(btrim(v_def->>'startEvent'), ''),
                     'The government launched ' || coalesce(v_def->>'name', 'a national initiative') || '.'),
            public.current_game_date());

  return jsonb_build_object('id', v_id, 'months', v_dur, 'complete_tick', v_tick + v_dur);
end $$;
revoke all on function public._initiative_start(text, uuid, text, uuid, text, int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- initiative_enact(initiative, ownership, corp): the Minister of Economic Development starts a SOLO
-- national initiative. Gated to that portfolio; costs the authored Influence upfront (_initiative_
-- influence). The running programme's money cost is a standing $B/yr Budget Balance line (schema/152)
-- that lasts until it's deactivated. A joint initiative goes through joint_propose (schema/142) instead.
-- ---------------------------------------------------------------------------
drop function if exists public.initiative_enact(uuid, uuid);
create or replace function public.initiative_enact(p_initiative uuid, p_ownership text, p_corp uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_def jsonb; v_res jsonb; v_need int;
begin
  v_p := public._begin_action(0);   -- lock caller's party, require >= 1 Influence
  if not exists (select 1 from public.governments where nation_id = v_p.nation_id and status = 'active') then
    raise exception 'There is no sitting government to enact an initiative.';
  end if;
  if not public._party_holds_ministry(v_p.id, 'Economic Development') then
    raise exception 'Only the Minister of Economic Development can enact a national initiative.';
  end if;

  select definition into v_def from public.national_initiatives where id = p_initiative;
  if v_def is null then raise exception 'That initiative no longer exists.'; end if;
  if jsonb_typeof(v_def->'joint') = 'object' then
    raise exception 'This is a joint project — propose it to the partner nation instead.';
  end if;

  -- Upfront Influence = the authored figure — gate first, before starting.
  v_need := public._initiative_influence(v_def);
  if v_p.influence < v_need then raise exception 'Not enough Influence (need %).', v_need; end if;

  v_res := public._initiative_start(v_p.nation_id, p_initiative, p_ownership, p_corp, null, 0);
  update public.parties set influence = influence - v_need where id = v_p.id;

  return v_res || jsonb_build_object('actions', v_p.influence - v_need, 'influence_cost', v_need);
end $$;
grant execute on function public.initiative_enact(uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- The per-tick pass (called by advance_tick, schema/60). An initiative's money cost is a standing
-- Budget Balance line (schema/152), so the tick does no treasury drain here. When a still-building
-- ACTIVE instance reaches complete_tick, land its PERMANENT production raise (+quantity via
-- _nation_stat_add — the production ceiling, schema/113, still caps it next tick), pay any joint
-- partner, and mark it built. It stays active (still costing its $B/yr) until deactivated. Each
-- instance is isolated so one bad row can't abort the rest.
-- ---------------------------------------------------------------------------
create or replace function public._advance_initiatives(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_res text; v_qty int;
begin
  for r in
    select ni.id, ni.nation_id, ni.complete_tick, ni.partner_nation, i.definition
      from public.nation_initiatives ni
      join public.national_initiatives i on i.id = ni.initiative_id
     where ni.status = 'active' and not ni.built and p_tick >= ni.complete_tick
  loop
    begin
      v_res := lower(coalesce(r.definition->>'resource', 'energy'));
      v_qty := greatest(1, coalesce((r.definition->>'quantity')::int, 1));
      perform public._nation_stat_add(r.nation_id, 'production', v_res, v_qty, 0, null);
      -- Joint partner's payout: the authored benefit (a resource or core stat) via _apply_policy_effect.
      if r.partner_nation is not null and jsonb_typeof(r.definition->'joint') = 'object' then
        perform public._apply_policy_effect(r.partner_nation,
          jsonb_build_object('t', r.definition->'joint'->>'target',
                             'v', greatest(0, coalesce((r.definition->'joint'->>'quantity')::int, 0))));
      end if;
      update public.nation_initiatives set built = true where id = r.id;
      insert into public.events (nation_id, party_id, kind, body, game_date)
        values (r.nation_id, null, 'economy',
                coalesce(nullif(btrim(r.definition->>'finishEvent'), ''),
                         coalesce(r.definition->>'name', 'A national initiative') || ' is complete — +'
                           || v_qty || ' ' || initcap(v_res) || ' production.'),
                public.current_game_date());
    exception when others then
      raise warning 'tick %: initiative % failed — %', p_tick, r.id, sqlerrm;
    end;
  end loop;
end $$;
revoke all on function public._advance_initiatives(int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- initiative_deactivate(instance): the Minister of Economic Development shuts down the nation's
-- running initiative. The standing $B/yr Budget Balance cost stops; if the build-up had finished
-- (built), its production increase is reversed. Gated to the portfolio + the caller's own nation.
-- ---------------------------------------------------------------------------
create or replace function public.initiative_deactivate(p_instance uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; r record; v_res text; v_qty int;
begin
  v_p := public._lock_party();
  if not public._party_holds_ministry(v_p.id, 'Economic Development') then
    raise exception 'Only the Minister of Economic Development can deactivate a national initiative.';
  end if;
  select ni.id, ni.nation_id, ni.built, i.definition into r
    from public.nation_initiatives ni
    join public.national_initiatives i on i.id = ni.initiative_id
   where ni.id = p_instance and ni.status = 'active'
   for update of ni;
  if r.id is null then raise exception 'No such running initiative.'; end if;
  if r.nation_id <> v_p.nation_id then raise exception 'That initiative belongs to another nation.'; end if;

  -- Reverse the production raise if it had already landed (a still-building one added nothing yet).
  if r.built then
    v_res := lower(coalesce(r.definition->>'resource', 'energy'));
    v_qty := greatest(1, coalesce((r.definition->>'quantity')::int, 1));
    perform public._nation_stat_add(r.nation_id, 'production', v_res, -v_qty, 0, null);
  end if;
  update public.nation_initiatives set status = 'ended' where id = r.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (r.nation_id, v_p.id, 'economy',
            coalesce(r.definition->>'name', 'A national initiative') || ' has been wound down by the government.',
            public.current_game_date());
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.initiative_deactivate(uuid) to authenticated;

notify pgrst, 'reload schema';
