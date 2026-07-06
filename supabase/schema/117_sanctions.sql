-- ===========================================================================
-- 117 · Sanctions — the Minister of Trade's third action: a standing trade embargo.
-- Depends on: 10 (nations), 20 (parties), 40 (_begin_action, _lock_party, events),
-- 60 (governments), 70 (_to_num), 91 (_apply_policy_effect), 114 (economy_import),
-- 115 (_party_holds_ministry). Run after 116.
--
-- A sanction by one nation on another bars trade BETWEEN them in BOTH directions,
-- regardless of either side's trade policy. Sanctioning an authoritarian regime
-- (regime ≤ 4) rallies the home front — +1 popularity to every governing party and
-- +2 Government Confidence — but only once per target until a long cooldown elapses
-- (so a lifted sanction can't be farmed by re-placing it). Sanctioning a democracy
-- (regime ≥ 5) instead costs −1 Image. Lifting is free. Writes are RPC-only.
-- ===========================================================================

create table if not exists public.sanctions (
  by_nation        text not null references public.nations (id) on delete cascade,
  target_nation    text not null references public.nations (id) on delete cascade,
  active           boolean not null default true,    -- false = lifted, but the row stays for the reward cooldown
  last_reward_tick int,                                -- last tick the rally reward fired (drives the cooldown)
  primary key (by_nation, target_nation)
);

alter table public.sanctions enable row level security;
drop policy if exists "sanctions_select_all" on public.sanctions;
create policy "sanctions_select_all" on public.sanctions for select using (true);
-- No write policy: only the RPCs below (security definer) place / lift sanctions.

-- Is trade between two nations barred by an active sanction (either direction)? ONE source
-- for the embargo rule, read by economy_import. Overrides trade policy — a closed border is closed.
create or replace function public._trade_sanctioned(p_a text, p_b text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.sanctions
     where active and ((by_nation = p_a and target_nation = p_b) or (by_nation = p_b and target_nation = p_a))
  );
$$;
revoke all on function public._trade_sanctioned(text, text) from public, anon, authenticated;
grant execute on function public._trade_sanctioned(text, text) to authenticated;

-- Impose a sanction. Minister-of-Trade gated, 3 party actions. Rewards a stand against a
-- regime ≤ 4 (once per target per cooldown); penalises sanctioning a regime ≥ 5.
create or replace function public.place_sanction(p_target text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_buyer text; v_tick int; v_regime numeric; v_tname text;
  v_ex public.sanctions%rowtype; v_have_ex boolean; v_reward_ok boolean;
  v_rewarded boolean := false; v_penalized boolean := false;
  v_cooldown constant int := 24;   -- ticks before a lifted sanction can reward this target again
begin
  v_p := public._begin_action(0);
  if v_p.influence < 3 then raise exception 'Not enough actions left this turn (need 3).'; end if;
  if not public._party_holds_ministry(v_p.id, 'Trade') then
    raise exception 'Only the Minister of Trade can impose sanctions.'; end if;
  v_buyer := v_p.nation_id;
  if p_target = v_buyer then raise exception 'You can''t sanction your own nation.'; end if;

  select name, public._to_num(economy->>'regime') into v_tname, v_regime
    from public.nations where id = p_target and not coalesce(dormant, false);
  if not found then raise exception 'No such nation.'; end if;
  select current_tick into v_tick from public.game_state where id;

  select * into v_ex from public.sanctions where by_nation = v_buyer and target_nation = p_target;
  v_have_ex := found;
  if v_have_ex and v_ex.active then raise exception '%', v_tname || ' is already under your sanction.'; end if;

  -- Reward only for an authoritarian target, and only if this target hasn't rewarded us within the cooldown.
  v_reward_ok := (v_regime is not null and v_regime <= 4)
             and (not v_have_ex or v_ex.last_reward_tick is null or v_tick >= v_ex.last_reward_tick + v_cooldown);

  insert into public.sanctions (by_nation, target_nation, active, last_reward_tick)
    values (v_buyer, p_target, true, case when v_reward_ok then v_tick else null end)
    on conflict (by_nation, target_nation) do update
      set active = true,
          last_reward_tick = case when v_reward_ok then v_tick else public.sanctions.last_reward_tick end;

  if v_reward_ok then
    perform public._apply_policy_effect(v_buyer, jsonb_build_object('t', 'Party Popularity', 'v', 1));
    perform public._apply_policy_effect(v_buyer, jsonb_build_object('t', 'Government Confidence', 'v', 2));
    v_rewarded := true;
  elsif v_regime is not null and v_regime >= 5 then
    perform public._apply_policy_effect(v_buyer, jsonb_build_object('t', 'Image', 'v', -1));
    v_penalized := true;
  end if;

  update public.parties set influence = influence - 3 where id = v_p.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_buyer, v_p.id, 'economy',
            'The government has imposed trade sanctions on ' || v_tname
            || case when v_rewarded  then ' — a popular stand against the regime: +1 popularity, +2 Government Confidence.'
                    when v_penalized then ' — sanctioning a democracy draws criticism abroad: −1 Image.'
                    else '.' end,
            public.current_game_date());

  return jsonb_build_object('target', v_tname, 'rewarded', v_rewarded, 'penalized', v_penalized,
    'actions', v_p.influence - 3);
end $$;
grant execute on function public.place_sanction(text) to authenticated;

-- Lift a sanction you placed. Minister-of-Trade gated, free. The row stays (inactive) so the
-- reward cooldown survives a lift → re-place.
create or replace function public.lift_sanction(p_target text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_tname text;
begin
  v_p := public._lock_party();
  if not public._party_holds_ministry(v_p.id, 'Trade') then
    raise exception 'Only the Minister of Trade can lift sanctions.'; end if;
  update public.sanctions set active = false
   where by_nation = v_p.nation_id and target_nation = p_target and active;
  if not found then raise exception 'You have no active sanction on that nation.'; end if;
  select name into v_tname from public.nations where id = p_target;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'economy',
            'The government has lifted its trade sanctions on ' || coalesce(v_tname, 'that nation') || '.',
            public.current_game_date());
  return jsonb_build_object('target', coalesce(v_tname, p_target), 'active', false);
end $$;
grant execute on function public.lift_sanction(text) to authenticated;

notify pgrst, 'reload schema';
