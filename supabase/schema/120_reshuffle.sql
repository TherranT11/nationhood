-- ===========================================================================
-- 120 · Reshuffle — the HoG reshapes a sitting cabinet, at a political price.
-- Depends on: 60 (_apply_cabinet_slate, cabinet_appointments, governments),
-- 20 (_effective_ceiling), 40 (_begin_action), 110 (mayoral_candidacies). Run after 110.
--
-- Like Appoint, but mid-term and consequential. 2 actions, a 6-tick cooldown, and the
-- slate change ripples into popularity: per party, +0.2 Party Popularity for every
-- ministry newly held and −0.3 for every one lost (clamped to floor/ceiling). Prestige
-- posts (Economic Development / Interior / Foreign Affairs / Trade) grant the incoming
-- minister +1 Image and cost the outgoing one −2. Mayors aren't eligible — enforced here,
-- not just in the UI. The slate write itself reuses _apply_cabinet_slate (one source).
-- ===========================================================================

alter table public.governments add column if not exists reshuffle_until_tick int;   -- 6-tick cooldown; null = ready

create or replace function public.cabinet_reshuffle(p_set jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_party public.parties%rowtype; v_gov public.governments%rowtype; v_tick int; r record;
  v_before jsonb; v_grants int := 0; v_strips int := 0;
  v_cooldown constant int := 6;
  c_prestige constant text[] := array['Economic Development', 'Interior', 'Foreign Affairs', 'Trade'];
begin
  v_party := public._begin_action(0);   -- requires >= 1 action; needs 2, checked next
  if v_party.actions_remaining < 2 then raise exception 'Not enough actions left this turn (need 2).'; end if;
  select * into v_gov from public.governments where nation_id = v_party.nation_id and status = 'active' for update;
  if not found then raise exception 'There is no sitting government.'; end if;
  if v_gov.formateur_party_id is distinct from v_party.id then
    raise exception 'Only the head of government can reshuffle the cabinet.'; end if;

  select current_tick into v_tick from public.game_state where id;
  if v_gov.reshuffle_until_tick is not null and v_tick < v_gov.reshuffle_until_tick then
    raise exception 'The cabinet was reshuffled recently — available again in % tick(s).', v_gov.reshuffle_until_tick - v_tick;
  end if;

  -- Mayors aren't eligible for a ministry (the UI hides them; enforce it here too).
  for r in select nullif(value->>'politician_id', '')::uuid as pol
             from jsonb_array_elements(coalesce(p_set, '[]'::jsonb)) loop
    if r.pol is not null and exists (select 1 from public.mayoral_candidacies mc where mc.politician_id = r.pol) then
      raise exception 'A chosen politician is standing for mayor and can''t hold a ministry.'; end if;
  end loop;

  -- Prestige Image, diffed per slot BEFORE the slate changes: an incoming minister to a prestige
  -- post (different from the current holder) gains +1 Image; the outgoing holder loses −2.
  for r in
    select m as ministry,
           (select politician_id from public.cabinet_appointments where government_id = v_gov.id and ministry = m) as old_pol,
           (select nullif(s.value->>'politician_id', '')::uuid
              from jsonb_array_elements(coalesce(p_set, '[]'::jsonb)) s where s.value->>'ministry' = m limit 1) as new_pol
      from unnest(c_prestige) m
  loop
    if r.new_pol is distinct from r.old_pol then
      if r.new_pol is not null then update public.politicians set com = least(10, coalesce(com, 0) + 1) where id = r.new_pol; v_grants := v_grants + 1; end if;
      if r.old_pol is not null then update public.politicians set com = greatest(0, coalesce(com, 0) - 2) where id = r.old_pol; v_strips := v_strips + 1; end if;
    end if;
  end loop;

  -- Snapshot per-party ministry counts BEFORE the slate changes (party_id → count).
  select coalesce(jsonb_object_agg(party_id::text, n), '{}'::jsonb) into v_before from (
    select p.id as party_id, count(*)::int as n
      from public.cabinet_appointments ca
      join public.politicians pol on pol.id = ca.politician_id
      join public.parties p on p.id = pol.party_id
     where ca.government_id = v_gov.id
     group by p.id
  ) b;

  perform public._apply_cabinet_slate(v_gov.id, v_party.nation_id, p_set);   -- one source for the slate write

  -- AFTER counts vs the snapshot → +0.2 per ministry gained, −0.3 per lost, clamped floor..ceiling.
  for r in
    with after_counts as (
      select p.id as party_id, count(*)::int as n
        from public.cabinet_appointments ca
        join public.politicians pol on pol.id = ca.politician_id
        join public.parties p on p.id = pol.party_id
       where ca.government_id = v_gov.id
       group by p.id
    )
    select pty.id, pty.archetype, pty.popularity, pty.pop_floor, pty.pop_ceiling,
           coalesce(a.n, 0) - coalesce((v_before ->> pty.id::text)::int, 0) as delta
      from public.parties pty
      left join after_counts a on a.party_id = pty.id
     where pty.nation_id = v_party.nation_id
  loop
    if r.delta = 0 then continue; end if;
    update public.parties
       set popularity = greatest(coalesce(r.pop_floor, 0),
             least(public._effective_ceiling(v_party.nation_id, r.archetype, r.pop_ceiling, r.pop_floor),
                   coalesce(r.popularity, 0) + (case when r.delta > 0 then 0.2 * r.delta else 0.3 * r.delta end)))
     where id = r.id;
  end loop;

  update public.parties set actions_remaining = actions_remaining - 2 where id = v_party.id;
  update public.governments set reshuffle_until_tick = v_tick + v_cooldown where id = v_gov.id;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'government', v_party.name || ' reshuffled the cabinet.', public.current_game_date());

  return jsonb_build_object('actions', v_party.actions_remaining - 2, 'until', v_tick + v_cooldown,
    'image_grants', v_grants, 'image_strips', v_strips);
end $$;
grant execute on function public.cabinet_reshuffle(jsonb) to authenticated;

notify pgrst, 'reload schema';
