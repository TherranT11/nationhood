-- 141 · National Initiatives — RUNTIME. The Minister of Economic Development enacts an authored
-- initiative (schema/140): the treasury pays its cost over a rolled duration, then it lands a
-- PERMANENT production increase. On-enact effects: private → +1 Growth; state → −1D2 Unemployment
-- & Inflation. One initiative at a time per nation. A one-time initiative is gone once carried out
-- here; a recurring one can be enacted again after it completes.
-- Depends on: 140 (national_initiatives), 91 (_apply_policy_effect / _nation_budget_add /
-- _nation_stat_add), 40 (_begin_action), 47 (corporations), 60 (advance_tick hook),
-- 114 (_party_holds_ministry). Run after 140.
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
  status        text not null default 'active',   -- 'active' | 'completed'
  started_tick  int  not null,
  complete_tick int  not null,                     -- started_tick + rolled duration; completes when the clock reaches it
  cost_per_tick numeric not null default 0,        -- effective cost ÷ duration, drained from the treasury each active tick
  created_at    timestamptz not null default now()
);
create index if not exists nation_initiatives_nation_idx on public.nation_initiatives (nation_id);

-- Joint-project split (schema/142): a partner nation co-funds and receives a benefit on completion.
-- partner_share is the % of the per-tick cost the partner covers (0 = solo). nation_id is always the
-- enacting nation that gets the production; the partner's benefit is read from the definition's joint block.
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
create or replace function public._initiative_start(p_nation text, p_initiative uuid, p_ownership text,
                                                    p_corp uuid, p_partner text default null, p_share int default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_def jsonb; v_tick int; v_elig jsonb; v_dur int; v_minm int; v_maxm int; v_cost numeric;
  v_own text; v_cadence text; v_id uuid; v_roll int; v_corp uuid; v_model text; v_cur numeric;
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
  v_dur  := v_minm + floor(random() * (v_maxm - v_minm + 1))::int;   -- roll [min, max] months

  -- Base cost from the authored cost basis (schema/140): flat → $B; production → $B per current unit
  -- (min one); gdp → % of GDP. Scaled models snapshot this nation's live figures (the one source).
  v_model := coalesce(v_def->>'costModel', 'flat');
  v_cost  := coalesce((v_def->>'cost')::numeric, 0);
  if v_model = 'production' then
    select coalesce((n.production->>lower(v_def->>'resource'))::numeric, 0) into v_cur
      from public.nations n where n.id = p_nation;
    v_cost := greatest(coalesce(v_cur, 0), 1) * v_cost;
  elsif v_model = 'gdp' then
    select coalesce(n.gdp, 0) into v_cur from public.nations n where n.id = p_nation;
    v_cost := round(coalesce(v_cur, 0) * v_cost / 100.0);
  end if;

  -- Ownership adjustment (private −20%, state +25%).
  if     v_own = 'private' then v_cost := round(v_cost * 0.80);
  elsif  v_own = 'state'   then v_cost := round(v_cost * 1.25);
  end if;

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

  insert into public.nation_initiatives (nation_id, initiative_id, corp_id, started_tick, complete_tick, cost_per_tick, partner_nation, partner_share)
    values (p_nation, p_initiative, v_corp, v_tick, v_tick + v_dur, round(v_cost / v_dur, 2),
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
-- national initiative. Gated to that portfolio; costs 2 party actions. A joint initiative (its
-- definition carries a partner) must instead go through joint_propose (schema/142).
-- ---------------------------------------------------------------------------
drop function if exists public.initiative_enact(uuid, uuid);
create or replace function public.initiative_enact(p_initiative uuid, p_ownership text, p_corp uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_def jsonb; v_res jsonb;
begin
  v_p := public._begin_action(0);   -- lock caller's party, require >= 1 action
  if v_p.influence < 2 then raise exception 'Not enough actions left this turn (need 2).'; end if;
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

  v_res := public._initiative_start(v_p.nation_id, p_initiative, p_ownership, p_corp, null, 0);
  update public.parties set influence = influence - 2 where id = v_p.id;

  return v_res || jsonb_build_object('actions', v_p.influence - 2);
end $$;
grant execute on function public.initiative_enact(uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- The per-tick pass (called by advance_tick, schema/60). For each ACTIVE instance: drain this
-- month's share of the cost from the treasury (a shortfall overflows to debt via _nation_budget_add),
-- and when the clock reaches complete_tick, land the permanent production raise (+quantity to the
-- resource's output, via _nation_stat_add — the production ceiling, schema/113, still caps it next
-- tick) and mark it completed. Each instance is isolated so one bad row can't abort the rest.
-- ---------------------------------------------------------------------------
create or replace function public._advance_initiatives(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_res text; v_qty int; v_pshare numeric;
begin
  for r in
    select ni.id, ni.nation_id, ni.complete_tick, ni.cost_per_tick, ni.partner_nation, ni.partner_share, i.definition
      from public.nation_initiatives ni
      join public.national_initiatives i on i.id = ni.initiative_id
     where ni.status = 'active'
  loop
    begin
      -- Drain this month's cost. A joint project splits it: the partner covers partner_share%, the
      -- enacting nation the rest (each shortfall overflows to its own debt via _nation_budget_add).
      if r.cost_per_tick <> 0 then
        if r.partner_nation is not null and r.partner_share > 0 then
          v_pshare := round(r.cost_per_tick * r.partner_share / 100.0, 2);   -- partner's rounded share
          perform public._nation_budget_add(r.partner_nation, -v_pshare);
          perform public._nation_budget_add(r.nation_id, -(r.cost_per_tick - v_pshare));  -- proposer pays the exact remainder
        else
          perform public._nation_budget_add(r.nation_id, -r.cost_per_tick);
        end if;
      end if;
      if p_tick >= r.complete_tick then
        v_res := lower(coalesce(r.definition->>'resource', 'energy'));
        v_qty := greatest(1, coalesce((r.definition->>'quantity')::int, 1));
        perform public._nation_stat_add(r.nation_id, 'production', v_res, v_qty, 0, null);
        -- Joint partner's payout: the authored benefit (a resource or core stat) via _apply_policy_effect.
        if r.partner_nation is not null and jsonb_typeof(r.definition->'joint') = 'object' then
          perform public._apply_policy_effect(r.partner_nation,
            jsonb_build_object('t', r.definition->'joint'->>'target',
                               'v', greatest(0, coalesce((r.definition->'joint'->>'quantity')::int, 0))));
        end if;
        update public.nation_initiatives set status = 'completed' where id = r.id;
        insert into public.events (nation_id, party_id, kind, body, game_date)
          values (r.nation_id, null, 'economy',
                  coalesce(nullif(btrim(r.definition->>'finishEvent'), ''),
                           coalesce(r.definition->>'name', 'A national initiative') || ' is complete — +'
                             || v_qty || ' ' || initcap(v_res) || ' production.'),
                  public.current_game_date());
      end if;
    exception when others then
      raise warning 'tick %: initiative % failed — %', p_tick, r.id, sqlerrm;
    end;
  end loop;
end $$;
revoke all on function public._advance_initiatives(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
