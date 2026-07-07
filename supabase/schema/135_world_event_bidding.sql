-- ===========================================================================
-- 135 · World Event · BIDDING — a free-for-all sealed bid (distinct from the two-sided
-- Competitive type in schema/100). Every involved nation may stake ONE bid of an author-allowed
-- resource; the bid is paid the moment it's submitted (all-pay, like Competitive — a show of
-- force costs whether or not you win). On resolution:
--   • if the TOTAL staked reaches the authored threshold → the nation(s) with the largest bid
--     gain the winner effects;
--   • otherwise → every involved nation that staked nothing takes the zero-bidder effects.
-- Either way, the authored PER-NATION aftermath effects then land on each involved nation.
-- Resolves the instant every involved nation has bid, or when the 3-tick window closes
-- (advance_tick → _resolve_overdue_world_events, extended in schema/100).
--
--   definition.bidding = {
--     resources: [ 'Military' | 'Army' | 'Fleets' | 'Air Wings' | 'Energy' | 'Food' | 'Budget'
--                  | 'Minerals' | 'Services' | 'Goods' | 'Diplomacy' ],   -- what a bid may be staked in
--     threshold:  numeric,                     -- min TOTAL staked to award a winner
--     winEffects: [{t,v}],                     -- to the top bidder(s) when the threshold is met
--     zeroEffects:[{t,v}],                     -- to each nation that staked 0 when it is not
--     aftermath:  { nation_id: [{t,v}] , … }   -- always applied, per involved nation
--   }
--
-- Reuses the world_event_bids table (schema/100): a bidding bid has side = null and carries the
-- chosen resource. Depends on: 40 (_lock_party, events), 91 (_apply_policy_effect,
-- _nation_budget_add), 99 (_nation_onhand_add), 100 (world_event_instances/bids, _we_targets,
-- _apply_we_effects), 127 (military_bases). Run after 100 (and re-apply 100 for the fire/overdue
-- edits that reference _resolve_we_bidding below).
-- ===========================================================================

-- The staked-bid table gains a resource (bidding stakes a chosen resource; Competitive doesn't)
-- and side becomes optional (a free-for-all bid has no side).
alter table public.world_event_bids add column if not exists resource text;
alter table public.world_event_bids alter column side drop not null;

-- How much of a bid resource a nation actually holds — the ONE source for both the bid cap and
-- the spend below. On-hand stockpiles, the Budget line, produced Diplomacy, or built units.
create or replace function public._we_bid_have(p_nation text, p_resource text)
returns numeric language sql stable security definer set search_path = public as $$
  select case p_resource
    when 'Military'  then coalesce((select (on_hand->>'military')::numeric  from public.nations where id = p_nation), 0)
    when 'Energy'    then coalesce((select (on_hand->>'energy')::numeric    from public.nations where id = p_nation), 0)
    when 'Food'      then coalesce((select (on_hand->>'food')::numeric      from public.nations where id = p_nation), 0)
    when 'Minerals'  then coalesce((select (on_hand->>'minerals')::numeric  from public.nations where id = p_nation), 0)
    when 'Services'  then coalesce((select (on_hand->>'services')::numeric  from public.nations where id = p_nation), 0)
    when 'Goods'     then coalesce((select (on_hand->>'goods')::numeric     from public.nations where id = p_nation), 0)
    when 'Budget'    then coalesce((select (economy->>'budget')::numeric    from public.nations where id = p_nation), 0)
    when 'Diplomacy' then coalesce((select (on_hand->>'diplomacy')::numeric   from public.nations where id = p_nation), 0)
    when 'Army'      then coalesce((select sum(armies)    from public.military_bases where nation_id = p_nation), 0)
    when 'Fleets'    then coalesce((select sum(fleets)    from public.military_bases where nation_id = p_nation), 0)
    when 'Air Wings' then coalesce((select sum(air_wings) from public.military_bases where nation_id = p_nation), 0)
    else 0 end;
$$;
revoke all on function public._we_bid_have(text, text) from public, anon, authenticated;

-- Pay a bid from its resource (floored at 0 / spread across bases for units). ONE source for the
-- stake side, mirroring _we_bid_have. Unit resources are drawn largest-base-first.
create or replace function public._we_bid_spend(p_nation text, p_resource text, p_amount numeric)
returns void language plpgsql security definer set search_path = public as $$
declare v_col text; v_left int; v_take int; r record;
begin
  if coalesce(p_amount, 0) <= 0 then return; end if;
  case p_resource
    when 'Military'  then perform public._nation_onhand_add(p_nation, 'military', -p_amount);
    when 'Energy'    then perform public._nation_onhand_add(p_nation, 'energy',   -p_amount);
    when 'Food'      then perform public._nation_onhand_add(p_nation, 'food',     -p_amount);
    when 'Minerals'  then perform public._nation_onhand_add(p_nation, 'minerals', -p_amount);
    when 'Services'  then perform public._nation_onhand_add(p_nation, 'services', -p_amount);
    when 'Goods'     then perform public._nation_onhand_add(p_nation, 'goods',     -p_amount);
    when 'Budget'    then perform public._nation_budget_add(p_nation, -p_amount);
    when 'Diplomacy' then perform public._nation_onhand_add(p_nation, 'diplomacy', -p_amount);
    when 'Army', 'Fleets', 'Air Wings' then
      v_col := case p_resource when 'Army' then 'armies' when 'Fleets' then 'fleets' else 'air_wings' end;
      v_left := floor(p_amount)::int;
      for r in execute format('select id, %I as have from public.military_bases where nation_id = $1 and %I > 0 order by %I desc', v_col, v_col, v_col) using p_nation loop
        exit when v_left <= 0;
        v_take := least(v_left, r.have);
        execute format('update public.military_bases set %I = %I - $1 where id = $2', v_col, v_col) using v_take, r.id;
        v_left := v_left - v_take;
      end loop;
    else null;
  end case;
end $$;
revoke all on function public._we_bid_spend(text, text, numeric) from public, anon, authenticated;

-- Tally a bidding instance and resolve it (idempotent — only acts on a still-active instance).
create or replace function public._resolve_we_bidding(p_instance uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_def jsonb; v_status text; v_total numeric; v_max numeric; v_thresh numeric;
  v_targets text[]; v_nat text; v_amt numeric; v_name text; v_body text; v_aft jsonb;
  v_bres text; v_bamt numeric; v_astr text; v_per numeric; v_mult numeric;
  v_side jsonb; v_sup text; v_sidenames text := '';
  v_res text; v_winners text; v_losers text;
begin
  select definition, status into v_def, v_status from public.world_event_instances where id = p_instance for update;
  if not found or v_status <> 'active' then return; end if;
  update public.world_event_instances set status = 'resolved' where id = p_instance;

  v_name    := coalesce(nullif(v_def->>'name', ''), 'A world event');
  v_thresh  := coalesce((v_def->'bidding'->>'threshold')::numeric, 0);
  v_targets := coalesce(public._we_targets(v_def), array[]::text[]);
  select coalesce(sum(amount), 0), coalesce(max(amount), 0)
    into v_total, v_max from public.world_event_bids where instance_id = p_instance;

  if v_total >= v_thresh and v_max > 0 then
    -- Threshold met: every nation whose stake equals the largest wins the reward (ties share it) —
    -- the flat winEffects, PLUS an optional per-bid bonus scaled by how much the winner staked:
    -- perBid.effects applied floor(winning stake / perBid.per) times.
    v_per  := coalesce((v_def->'bidding'->'perBid'->>'per')::numeric, 0);
    v_mult := case when v_per > 0 then floor(v_max / v_per) else 0 end;
    for v_nat in select nation_id from public.world_event_bids where instance_id = p_instance and amount = v_max loop
      perform public._apply_we_effects(v_nat, v_def->'bidding'->'winEffects');
      if v_mult > 0 then
        perform public._apply_we_effects(v_nat, (
          select coalesce(jsonb_agg(jsonb_build_object('t', e->>'t', 'v', coalesce((e->>'v')::numeric, 0) * v_mult)), '[]'::jsonb)
            from jsonb_array_elements(coalesce(v_def->'bidding'->'perBid'->'effects', '[]'::jsonb)) e));
      end if;
    end loop;
    -- Sides (optional): the side a top bidder backs prevails; each such side awards its winEffects
    -- to every nation that supports it. Ties may crown more than one side.
    if coalesce((v_def->'bidding'->>'hasSides')::boolean, false) then
      for v_side in select value from jsonb_array_elements(coalesce(v_def->'bidding'->'sides', '[]'::jsonb)) loop
        if exists (select 1 from public.world_event_bids b
                    where b.instance_id = p_instance and b.amount = v_max and (v_side->'supporters') ? b.nation_id) then
          for v_sup in select jsonb_object_keys(coalesce(v_side->'supporters', '{}'::jsonb)) loop
            perform public._apply_we_effects(v_sup, v_side->'winEffects');
          end loop;
          v_sidenames := v_sidenames || case when v_sidenames = '' then '' else ', ' end || coalesce(nullif(v_side->>'name', ''), 'a faction');
        end if;
      end loop;
    end if;
    v_body := v_name || ' — the commitment met the threshold; the strongest bidder is rewarded.'
              || case when v_sidenames <> '' then ' ' || v_sidenames || ' prevailed.' else '' end;
    -- Winner / loser name lists for the resolution-description tokens: the top bidder(s) win, the
    -- rest of the involved are the losers.
    select string_agg(n.name, ' & ' order by n.name) into v_winners from public.nations n
      where n.id in (select nation_id from public.world_event_bids where instance_id = p_instance and amount = v_max);
    select string_agg(n.name, ' & ' order by n.name) into v_losers from public.nations n
      where n.id = any(v_targets) and n.id not in (select nation_id from public.world_event_bids where instance_id = p_instance and amount = v_max);
  else
    -- Threshold missed: every involved nation that staked nothing takes the penalty.
    foreach v_nat in array v_targets loop
      select coalesce((select amount from public.world_event_bids where instance_id = p_instance and nation_id = v_nat), 0) into v_amt;
      if v_amt <= 0 then perform public._apply_we_effects(v_nat, v_def->'bidding'->'zeroEffects'); end if;
    end loop;
    v_body := v_name || ' — too little was committed; the idle are penalised.';
    -- No winner when the threshold is missed; the idle (staked nothing) are the losers.
    v_winners := null;
    select string_agg(n.name, ' & ' order by n.name) into v_losers from public.nations n
      where n.id = any(v_targets)
        and coalesce((select amount from public.world_event_bids where instance_id = p_instance and nation_id = n.id), 0) <= 0;
  end if;

  -- Resolution description (optional): fill its tokens and append to the closing feed line.
  v_res := coalesce(nullif(btrim(v_def->>'resolution'), ''), '');
  if v_res <> '' then
    v_body := v_body || ' ' || replace(replace(replace(replace(v_res,
        '{event}', v_name),
        '{winner}', coalesce(v_winners, 'no one')),
        '{loser}', coalesce(v_losers, 'no one')),
        '{winning_side}', coalesce(nullif(v_sidenames, ''), 'no side'));
  end if;

  -- Aftermath: always applied, per involved nation (a nation with no entry gets nothing). Each
  -- nation's own feed line recalls what it staked (reads the bid's resource + amount).
  v_aft := coalesce(v_def->'bidding'->'aftermath', '{}'::jsonb);
  foreach v_nat in array v_targets loop
    perform public._apply_we_effects(v_nat, v_aft->v_nat);
    select resource, amount into v_bres, v_bamt
      from public.world_event_bids where instance_id = p_instance and nation_id = v_nat;
    v_astr := case when coalesce(v_bamt, 0) <= 0 then null
                   when v_bamt = floor(v_bamt) then floor(v_bamt)::text
                   else round(v_bamt, 2)::text end;
    insert into public.events (nation_id, kind, body, game_date)
      values (v_nat, 'world_event',
              v_body || coalesce(' Your commitment: ' || v_astr || ' ' || v_bres || '.', ''),
              public.current_game_date());
  end loop;
end $$;
revoke all on function public._resolve_we_bidding(uuid) from public, anon, authenticated;

-- Resolve the contest early once EVERY involved nation has responded (bid or declined). ONE
-- source for the "all in?" check, shared by world_event_place_bid and world_event_decline_bid.
create or replace function public._we_bidding_maybe_resolve(p_instance uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_def jsonb; v_targets text[]; v_bidders int;
begin
  select definition into v_def from public.world_event_instances where id = p_instance;
  v_targets := public._we_targets(v_def);
  select count(*) into v_bidders from public.world_event_bids where instance_id = p_instance;
  if coalesce(array_length(v_targets, 1), 0) > 0 and v_bidders >= array_length(v_targets, 1) then
    perform public._resolve_we_bidding(p_instance);
    return true;
  end if;
  return false;
end $$;
revoke all on function public._we_bidding_maybe_resolve(uuid) from public, anon, authenticated;

-- Guard for a bidding action: locks the caller's party AND the instance row, verifies the
-- instance is an active bidding event involving the caller's nation, that the caller is the
-- nation's HoG, and that the nation hasn't already responded. Returns the locked party. ONE
-- source for the "may this HoG act on this contest?" checks — shared by place_bid and decline.
create or replace function public._we_bidding_guard(p_instance uuid)
returns public.parties language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_st text; v_def jsonb;
begin
  v_party := public._lock_party();   -- caller's party + nation (no action cost)
  select status, definition into v_st, v_def from public.world_event_instances where id = p_instance for update;
  if not found then raise exception 'That event is gone.'; end if;
  if v_st <> 'active' then raise exception 'Bidding has closed.'; end if;
  if v_def->>'type' <> 'bidding' then raise exception 'That event is not a bidding event.'; end if;
  if (v_def->>'scope') <> 'global' and not ((v_def->'nations') ? v_party.nation_id) then
    raise exception 'This bid does not involve your nation.'; end if;
  perform public._require_hog(v_party.nation_id, v_party.id);   -- the HoG acts for the nation
  if exists (select 1 from public.world_event_bids where instance_id = p_instance and nation_id = v_party.nation_id) then
    raise exception 'Your nation has already responded.'; end if;
  return v_party;
end $$;
revoke all on function public._we_bidding_guard(uuid) from public, anon, authenticated;

-- The Head of Government stakes a sealed bid of a chosen (allowed) resource for the nation. No
-- action cost. The bid is capped at what the nation holds and paid immediately (all-pay).
-- Resolves the contest early once every involved nation has responded.
create or replace function public.world_event_place_bid(p_instance uuid, p_resource text, p_amount numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_def jsonb; v_have numeric; v_bid numeric; v_nname text;
begin
  v_party := public._we_bidding_guard(p_instance);   -- lock + "may this HoG bid?" checks
  select definition into v_def from public.world_event_instances where id = p_instance;   -- row already locked by the guard
  if not ((v_def->'bidding'->'resources') ? p_resource) then
    raise exception 'You can''t stake % in this event.', coalesce(p_resource, 'that'); end if;
  if p_amount is null or p_amount < 0 then raise exception 'Bid zero or more.'; end if;

  v_have := public._we_bid_have(v_party.nation_id, p_resource);
  v_bid  := least(p_amount, greatest(v_have, 0));
  if p_resource in ('Army', 'Fleets', 'Air Wings') then v_bid := floor(v_bid); end if;

  perform public._we_bid_spend(v_party.nation_id, p_resource, v_bid);
  insert into public.world_event_bids (instance_id, nation_id, side, resource, amount, party_id)
    values (p_instance, v_party.nation_id, null, p_resource, v_bid, v_party.id);

  select name into v_nname from public.nations where id = v_party.nation_id;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'world_event',
            coalesce(nullif(v_def->>'name', ''), 'A world event') || ' — ' || coalesce(v_nname, v_party.nation_id) || ' committed a sealed bid.',
            public.current_game_date());

  return jsonb_build_object('ok', true, 'bid', v_bid, 'resolved', public._we_bidding_maybe_resolve(p_instance));
end $$;
grant execute on function public.world_event_place_bid(uuid, text, numeric) to authenticated;

-- The Head of Government formally declines to bid for the nation ("Do Not Bid"). Records a zero
-- stake (no resource, nothing paid) so the contest counts the nation as having responded and can
-- resolve; staking nothing means the zero-bidder penalty if the threshold is missed.
create or replace function public.world_event_decline_bid(p_instance uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_def jsonb; v_nname text;
begin
  v_party := public._we_bidding_guard(p_instance);   -- lock + "may this HoG act?" checks
  select definition into v_def from public.world_event_instances where id = p_instance;   -- row already locked by the guard

  insert into public.world_event_bids (instance_id, nation_id, side, resource, amount, party_id)
    values (p_instance, v_party.nation_id, null, null, 0, v_party.id);   -- abstain = zero stake

  select name into v_nname from public.nations where id = v_party.nation_id;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'world_event',
            coalesce(nullif(v_def->>'name', ''), 'A world event') || ' — ' || coalesce(v_nname, v_party.nation_id) || ' declined to bid.',
            public.current_game_date());

  return jsonb_build_object('ok', true, 'declined', true, 'resolved', public._we_bidding_maybe_resolve(p_instance));
end $$;
grant execute on function public.world_event_decline_bid(uuid) to authenticated;

notify pgrst, 'reload schema';
