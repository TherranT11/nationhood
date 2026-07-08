-- 148 · Campaign Trail (Phase F-B). Four campaign actions a party may take in the six months
-- before a general election, each paid in Influence (schema/20) and resolved server-side so the
-- window, cost, RNG, and popularity bounds can't be forged from the client. Gains cap at the
-- effective ceiling and losses stop at the floor via the shared helpers (schema/20, 70), so
-- campaigning obeys exactly the same bounds as every other popularity move. Each action writes a
-- feed event tagged 'Party Popularity', so it also surfaces in the dashboard approval factors
-- (schema/147).
-- Depends on: 05 (game_state), 20 (parties/influence/_effective_ceiling), 40 (events/_lock_party/
-- current_game_date/_bare_party), 70 (_mod_cap_raise/_mod_floor_drop). Run after 70.

-- The 6-month gate (ONE source): raises unless the caller's nation is inside the campaign window —
-- the next general election is 1..6 ticks away and the nation is not a one-party state (a Party
-- Congress is not a public ballot, so it never campaigns).
create or replace function public._require_campaign(p_nation text)
returns void language plpgsql security definer set search_path = public as $$
declare v_next int; v_ruling text; v_tick int; v_away int;
begin
  select next_election_tick, ruling_party into v_next, v_ruling from public.nations where id = p_nation;
  if v_ruling is not null then raise exception 'A one-party state holds no election campaign.'; end if;
  select current_tick into v_tick from public.game_state where id;
  v_away := coalesce(v_next, -1) - coalesce(v_tick, 0);
  if v_next is null or v_away < 1 or v_away > 6 then
    raise exception 'Campaigning opens only in the six months before the election.';
  end if;
end $$;
revoke all on function public._require_campaign(text) from public, anon, authenticated;

-- One-time use (per campaign): each of the four campaign actions may be run ONCE per general
-- election. The key is (party, election_tick, action) — because the tick is the party's
-- next_election_tick, the allowance resets automatically the moment the next election is scheduled.
-- Public-read so the Elections page can grey out an action a party has already spent; written only by
-- _campaign_use_once (security definer).
create table if not exists public.campaign_actions_used (
  party_id      uuid not null references public.parties (id) on delete cascade,
  election_tick int  not null,
  action        text not null,
  used_at       timestamptz not null default now(),
  primary key (party_id, election_tick, action)
);
alter table public.campaign_actions_used enable row level security;
drop policy if exists "campaign_actions_used_select_all" on public.campaign_actions_used;
create policy "campaign_actions_used_select_all" on public.campaign_actions_used for select using (true);

-- Claim a party's single use of one campaign action for the current election. Raises (rolling the
-- whole action back) if it has already been used this campaign. ONE gate, called by all four RPCs.
create or replace function public._campaign_use_once(p_party uuid, p_nation text, p_action text, p_label text)
returns void language plpgsql security definer set search_path = public as $$
declare v_next int;
begin
  select next_election_tick into v_next from public.nations where id = p_nation;
  begin
    insert into public.campaign_actions_used (party_id, election_tick, action)
      values (p_party, coalesce(v_next, 0), p_action);
  exception when unique_violation then
    raise exception 'Your party has already run % this campaign.', p_label;
  end;
end $$;
revoke all on function public._campaign_use_once(uuid, text, text, text) from public, anon, authenticated;

-- Town Hall shield: a party that holds a town hall this campaign takes the NEXT attack that lands on
-- it at half force. Stored as the election tick the shield belongs to, so it only bites within that
-- campaign and goes stale once the next election is scheduled.
alter table public.parties add column if not exists attack_shield_tick int;

-- Apply (and spend) a target's Town Hall shield to an incoming landed attack: if the target raised a
-- shield THIS campaign, halve the cut and consume it; otherwise the cut passes through unchanged. Called
-- only in the "it landed" branch of the attack actions. The target row is already locked FOR UPDATE by
-- the caller, so the re-read + clear are safe within the same transaction. ONE source for the shield.
create or replace function public._campaign_shield_cut(p_target uuid, p_cut numeric)
returns numeric language plpgsql security definer set search_path = public as $$
declare v_shield int; v_next int;
begin
  select p.attack_shield_tick, n.next_election_tick into v_shield, v_next
    from public.parties p join public.nations n on n.id = p.nation_id where p.id = p_target;
  if v_shield is not null and v_shield = coalesce(v_next, -2147483648) then
    update public.parties set attack_shield_tick = null where id = p_target;   -- shield spent
    return round(p_cut / 2.0, 1);
  end if;
  return p_cut;
end $$;
revoke all on function public._campaign_shield_cut(uuid, numeric) from public, anon, authenticated;

-- Record a party's campaign popularity move as a feed event. A non-zero delta is tagged
-- 'Party Popularity' so it shows in the news feed AND the dashboard approval factors (schema/147);
-- a zero-delta move (e.g. already at the ceiling) is written as a plain narrative note with no
-- effect pill, so it never clutters the factor list. ONE source for every campaign event write.
create or replace function public._campaign_event(p_nation text, p_party uuid, p_body text, p_delta numeric)
returns void language sql security definer set search_path = public as $$
  insert into public.events (nation_id, party_id, kind, body, game_date, effect_target, effect_value, tone)
  values (p_nation, p_party, 'campaign', p_body, public.current_game_date(),
          case when p_delta = 0 then null else 'Party Popularity' end,
          case when p_delta = 0 then null else p_delta end,
          case when p_delta > 0 then 'pos' when p_delta < 0 then 'neg' else null end);
$$;
revoke all on function public._campaign_event(text, uuid, text, numeric) from public, anon, authenticated;

-- Door Knocking — 4 Influence, +1D4 Party Popularity (capped at the effective ceiling).
create or replace function public.campaign_door_knock()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_cost int := 4; v_roll int; v_new numeric; v_delta numeric; v_body text;
begin
  v_p := public._lock_party();
  perform public._require_campaign(v_p.nation_id);
  perform public._campaign_use_once(v_p.id, v_p.nation_id, 'door_knock', 'a door-knocking drive');
  if v_p.influence < v_cost then raise exception 'Not enough Influence (need %).', v_cost; end if;
  v_roll := 1 + floor(random() * 4)::int;   -- 1D4
  v_new := public._mod_cap_raise(v_p.nation_id, v_p.archetype, v_p.popularity,
             least(v_p.popularity + v_roll, public._effective_ceiling(v_p.nation_id, v_p.archetype, v_p.pop_ceiling, v_p.pop_floor)));
  v_delta := v_new - v_p.popularity;
  v_body := 'The ' || public._bare_party(v_p.name) || ' ran a door-knocking drive. Popularity +' || trim(to_char(v_delta, 'FM990.0')) || '%.';
  update public.parties set popularity = v_new, influence = influence - v_cost where id = v_p.id;
  perform public._campaign_event(v_p.nation_id, v_p.id, v_body, v_delta);
  return jsonb_build_object('influence', v_p.influence - v_cost, 'popularity', v_new, 'delta', v_delta, 'body', v_body);
end $$;
grant execute on function public.campaign_door_knock() to authenticated;

-- Public Appearance — 3 Influence, +1 Party Popularity (capped at the effective ceiling).
create or replace function public.campaign_public_appearance()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_cost int := 3; v_new numeric; v_delta numeric; v_body text;
begin
  v_p := public._lock_party();
  perform public._require_campaign(v_p.nation_id);
  perform public._campaign_use_once(v_p.id, v_p.nation_id, 'public_appearance', 'a public appearance');
  if v_p.influence < v_cost then raise exception 'Not enough Influence (need %).', v_cost; end if;
  v_new := public._mod_cap_raise(v_p.nation_id, v_p.archetype, v_p.popularity,
             least(v_p.popularity + 1, public._effective_ceiling(v_p.nation_id, v_p.archetype, v_p.pop_ceiling, v_p.pop_floor)));
  v_delta := v_new - v_p.popularity;
  v_body := 'The ' || public._bare_party(v_p.name) || ' made a public appearance. Popularity +' || trim(to_char(v_delta, 'FM990.0')) || '%.';
  update public.parties set popularity = v_new, influence = influence - v_cost where id = v_p.id;
  perform public._campaign_event(v_p.nation_id, v_p.id, v_body, v_delta);
  return jsonb_build_object('influence', v_p.influence - v_cost, 'popularity', v_new, 'delta', v_delta, 'body', v_body);
end $$;
grant execute on function public.campaign_public_appearance() to authenticated;

-- TV Debate — 5 Influence. 50/50: you gain +6% and they lose 6%, or the reverse. Targets another
-- party in the same nation (a coalition partner is allowed), locked FOR UPDATE to settle atomically.
create or replace function public.campaign_tv_debate(p_target uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_t public.parties%rowtype; v_cost int := 5; v_won boolean;
  v_self_new numeric; v_targ_new numeric; v_self_delta numeric; v_targ_delta numeric; v_body text;
begin
  v_p := public._lock_party();
  perform public._require_campaign(v_p.nation_id);
  perform public._campaign_use_once(v_p.id, v_p.nation_id, 'tv_debate', 'a TV debate');
  if v_p.influence < v_cost then raise exception 'Not enough Influence (need %).', v_cost; end if;
  -- Lock the target too: FOR UPDATE so two attackers can't both read-then-write its popularity and
  -- lose one update. Lock order is caller-then-target, so two players targeting each other at the
  -- same instant can deadlock — benign: Postgres aborts one, the client surfaces the error, retry
  -- succeeds. Not worth serialising for so rare a clash.
  select * into v_t from public.parties where id = p_target for update;
  if not found or v_t.nation_id <> v_p.nation_id then raise exception 'Choose an opponent in your nation.'; end if;
  if v_t.id = v_p.id then raise exception 'Choose an opponent other than your own party.'; end if;
  v_won := random() < 0.5;
  if v_won then
    v_self_new := public._mod_cap_raise(v_p.nation_id, v_p.archetype, v_p.popularity,
                    least(v_p.popularity + 6, public._effective_ceiling(v_p.nation_id, v_p.archetype, v_p.pop_ceiling, v_p.pop_floor)));
    v_targ_new := public._mod_floor_drop(v_t.nation_id, v_t.archetype, v_t.popularity, greatest(v_t.popularity - 6, v_t.pop_floor));
  else
    v_self_new := public._mod_floor_drop(v_p.nation_id, v_p.archetype, v_p.popularity, greatest(v_p.popularity - 6, v_p.pop_floor));
    v_targ_new := public._mod_cap_raise(v_t.nation_id, v_t.archetype, v_t.popularity,
                    least(v_t.popularity + 6, public._effective_ceiling(v_t.nation_id, v_t.archetype, v_t.pop_ceiling, v_t.pop_floor)));
  end if;
  v_self_delta := v_self_new - v_p.popularity;
  v_targ_delta := v_targ_new - v_t.popularity;
  update public.parties set popularity = v_self_new, influence = influence - v_cost where id = v_p.id;
  if v_targ_delta <> 0 then update public.parties set popularity = v_targ_new where id = v_t.id; end if;
  v_body := 'The ' || public._bare_party(v_p.name) || ' met the ' || public._bare_party(v_t.name) || ' in a televised debate and ' ||
            case when v_won then 'came out ahead' else 'lost the exchange' end || '. Popularity ' ||
            case when v_self_delta >= 0 then '+' else '' end || trim(to_char(v_self_delta, 'FM990.0')) || '%.';
  perform public._campaign_event(v_p.nation_id, v_p.id, v_body, v_self_delta);
  if v_targ_delta <> 0 then
    perform public._campaign_event(v_t.nation_id, v_t.id,
      'The ' || public._bare_party(v_t.name) || ' ' || case when v_targ_delta >= 0 then 'gained ground in' else 'came off worse in' end ||
      ' a televised debate with the ' || public._bare_party(v_p.name) || '. Popularity ' ||
      case when v_targ_delta >= 0 then '+' else '' end || trim(to_char(v_targ_delta, 'FM990.0')) || '%.', v_targ_delta);
  end if;
  return jsonb_build_object('influence', v_p.influence - v_cost, 'popularity', v_self_new, 'self_delta', v_self_delta,
    'target', v_t.name, 'target_delta', v_targ_delta, 'won', v_won, 'body', v_body);
end $$;
grant execute on function public.campaign_tv_debate(uuid) to authenticated;

-- Attack Campaign — 2 Influence. 50/50: it lands (they lose 3%) or it backfires (you lose 5%).
create or replace function public.campaign_attack(p_target uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_t public.parties%rowtype; v_cost int := 2; v_landed boolean; v_cut numeric;
  v_self_new numeric; v_targ_new numeric; v_self_delta numeric; v_targ_delta numeric; v_body text;
begin
  v_p := public._lock_party();
  perform public._require_campaign(v_p.nation_id);
  perform public._campaign_use_once(v_p.id, v_p.nation_id, 'attack', 'an attack campaign');
  if v_p.influence < v_cost then raise exception 'Not enough Influence (need %).', v_cost; end if;
  select * into v_t from public.parties where id = p_target for update;
  if not found or v_t.nation_id <> v_p.nation_id then raise exception 'Choose a target in your nation.'; end if;
  if v_t.id = v_p.id then raise exception 'Choose a target other than your own party.'; end if;
  v_landed := random() < 0.5;
  if v_landed then
    v_cut := public._campaign_shield_cut(v_t.id, 3);   -- Town Hall halves a landed hit (and is spent)
    v_targ_new := public._mod_floor_drop(v_t.nation_id, v_t.archetype, v_t.popularity, greatest(v_t.popularity - v_cut, v_t.pop_floor));
    v_self_new := v_p.popularity;   -- your own standing is untouched when it lands
  else
    v_self_new := public._mod_floor_drop(v_p.nation_id, v_p.archetype, v_p.popularity, greatest(v_p.popularity - 5, v_p.pop_floor));
    v_targ_new := v_t.popularity;   -- it backfired on you; the target is untouched
  end if;
  v_self_delta := v_self_new - v_p.popularity;
  v_targ_delta := v_targ_new - v_t.popularity;
  update public.parties set popularity = v_self_new, influence = influence - v_cost where id = v_p.id;
  if v_targ_delta <> 0 then update public.parties set popularity = v_targ_new where id = v_t.id; end if;
  if v_landed then
    v_body := 'The ' || public._bare_party(v_p.name) || '’s attack on the ' || public._bare_party(v_t.name) || ' landed.';
    perform public._campaign_event(v_p.nation_id, v_p.id, v_body || ' Its own standing held.', 0);
    perform public._campaign_event(v_t.nation_id, v_t.id,
      'An attack campaign by the ' || public._bare_party(v_p.name) || ' dented the ' || public._bare_party(v_t.name) ||
      '. Popularity ' || trim(to_char(v_targ_delta, 'FM990.0')) || '%.', v_targ_delta);
  else
    v_body := 'The ' || public._bare_party(v_p.name) || '’s attack on the ' || public._bare_party(v_t.name) ||
              ' backfired. Popularity ' || trim(to_char(v_self_delta, 'FM990.0')) || '%.';
    perform public._campaign_event(v_p.nation_id, v_p.id, v_body, v_self_delta);
  end if;
  return jsonb_build_object('influence', v_p.influence - v_cost, 'popularity', v_self_new, 'self_delta', v_self_delta,
    'target', v_t.name, 'target_delta', v_targ_delta, 'landed', v_landed, 'body', v_body);
end $$;
grant execute on function public.campaign_attack(uuid) to authenticated;

-- Town Hall — 8 Influence, +2 Party Popularity, AND the next attack that lands on you this campaign
-- lands at half force (the shield, spent by _campaign_shield_cut when an attack connects).
create or replace function public.campaign_town_hall()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_cost int := 8; v_new numeric; v_delta numeric; v_next int; v_body text;
begin
  v_p := public._lock_party();
  perform public._require_campaign(v_p.nation_id);
  perform public._campaign_use_once(v_p.id, v_p.nation_id, 'town_hall', 'a town hall');
  if v_p.influence < v_cost then raise exception 'Not enough Influence (need %).', v_cost; end if;
  v_new := public._mod_cap_raise(v_p.nation_id, v_p.archetype, v_p.popularity,
             least(v_p.popularity + 2, public._effective_ceiling(v_p.nation_id, v_p.archetype, v_p.pop_ceiling, v_p.pop_floor)));
  v_delta := v_new - v_p.popularity;
  select next_election_tick into v_next from public.nations where id = v_p.nation_id;
  update public.parties set popularity = v_new, influence = influence - v_cost, attack_shield_tick = v_next where id = v_p.id;
  v_body := 'The ' || public._bare_party(v_p.name) || ' held a town hall, rallying its base. Popularity +' || trim(to_char(v_delta, 'FM990.0'))
            || '%. The next attack against it this campaign will land at half force.';
  perform public._campaign_event(v_p.nation_id, v_p.id, v_body, v_delta);
  return jsonb_build_object('influence', v_p.influence - v_cost, 'popularity', v_new, 'delta', v_delta, 'shield', true, 'body', v_body);
end $$;
grant execute on function public.campaign_town_hall() to authenticated;

-- Election Surprise — 5 Influence, targets another party. 50/50: it lands (they lose 4%) or it
-- backfires (you lose 3% and they gain 2% on the sympathy). A bigger-stakes Attack Campaign; a landed
-- hit is halved by the target's Town Hall shield, same as Attack Campaign.
create or replace function public.campaign_election_surprise(p_target uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_t public.parties%rowtype; v_cost int := 5; v_landed boolean; v_cut numeric;
  v_self_new numeric; v_targ_new numeric; v_self_delta numeric; v_targ_delta numeric; v_body text;
begin
  v_p := public._lock_party();
  perform public._require_campaign(v_p.nation_id);
  perform public._campaign_use_once(v_p.id, v_p.nation_id, 'election_surprise', 'an election surprise');
  if v_p.influence < v_cost then raise exception 'Not enough Influence (need %).', v_cost; end if;
  select * into v_t from public.parties where id = p_target for update;
  if not found or v_t.nation_id <> v_p.nation_id then raise exception 'Choose a target in your nation.'; end if;
  if v_t.id = v_p.id then raise exception 'Choose a target other than your own party.'; end if;
  v_landed := random() < 0.5;
  if v_landed then
    v_cut := public._campaign_shield_cut(v_t.id, 4);   -- Town Hall halves a landed hit (and is spent)
    v_targ_new := public._mod_floor_drop(v_t.nation_id, v_t.archetype, v_t.popularity, greatest(v_t.popularity - v_cut, v_t.pop_floor));
    v_self_new := v_p.popularity;   -- untouched when it lands
  else
    v_self_new := public._mod_floor_drop(v_p.nation_id, v_p.archetype, v_p.popularity, greatest(v_p.popularity - 3, v_p.pop_floor));
    v_targ_new := public._mod_cap_raise(v_t.nation_id, v_t.archetype, v_t.popularity,
                    least(v_t.popularity + 2, public._effective_ceiling(v_t.nation_id, v_t.archetype, v_t.pop_ceiling, v_t.pop_floor)));  -- sympathy bump
  end if;
  v_self_delta := v_self_new - v_p.popularity;
  v_targ_delta := v_targ_new - v_t.popularity;
  update public.parties set popularity = v_self_new, influence = influence - v_cost where id = v_p.id;
  if v_targ_delta <> 0 then update public.parties set popularity = v_targ_new where id = v_t.id; end if;
  if v_landed then
    v_body := 'The ' || public._bare_party(v_p.name) || ' sprang an election surprise on the ' || public._bare_party(v_t.name) || ', and it landed.';
    perform public._campaign_event(v_p.nation_id, v_p.id, v_body || ' Its own standing held.', 0);
    perform public._campaign_event(v_t.nation_id, v_t.id,
      'An election surprise by the ' || public._bare_party(v_p.name) || ' hit the ' || public._bare_party(v_t.name) ||
      '. Popularity ' || trim(to_char(v_targ_delta, 'FM990.0')) || '%.', v_targ_delta);
  else
    v_body := 'The ' || public._bare_party(v_p.name) || '’s election surprise on the ' || public._bare_party(v_t.name) ||
              ' backfired. Popularity ' || trim(to_char(v_self_delta, 'FM990.0')) || '%.';
    perform public._campaign_event(v_p.nation_id, v_p.id, v_body, v_self_delta);
    if v_targ_delta <> 0 then
      perform public._campaign_event(v_t.nation_id, v_t.id,
        'The ' || public._bare_party(v_t.name) || ' drew sympathy after the ' || public._bare_party(v_p.name) ||
        '’s election surprise backfired. Popularity +' || trim(to_char(v_targ_delta, 'FM990.0')) || '%.', v_targ_delta);
    end if;
  end if;
  return jsonb_build_object('influence', v_p.influence - v_cost, 'popularity', v_self_new, 'self_delta', v_self_delta,
    'target', v_t.name, 'target_delta', v_targ_delta, 'landed', v_landed, 'body', v_body);
end $$;
grant execute on function public.campaign_election_surprise(uuid) to authenticated;
