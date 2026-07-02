-- ===========================================================================
-- 126 · Leave Coalition — a governing party walks out of the government.
-- Depends on: 40 (_begin_action), 60 (governments, government_agenda, cabinet_appointments,
-- resolve_election), 70 (_mod_floor_drop), 81 (proposals / no_confidence),
-- 91 (_apply_policy_effect). Run after 91.
--
-- One action, gated to a party that sits in the government (parties.in_government). Two
-- outcomes, decided by whether the leaver is the premier:
--   • A junior partner walks: −3 their Party Popularity, the government −5 Confidence
--     (via _apply_policy_effect — the one clamp+collapse source), their in_government
--     flag clears, and it GIVES UP EVERY MINISTRY IT OWNS (you can't keep a cabinet seat
--     in a government you've left). The government carries on, smaller, those seats vacant.
--   • The Head of Government (formateur) walking out IS a resignation: their party −5
--     Party Popularity, then a snap election reseats everyone. This replaces the old
--     standalone Resign action (resign_government, dropped below). No ministry release is
--     needed here — the snap election dissolves the whole cabinet anyway.
-- Blocked while a no-confidence motion is live on the floor (that must resolve first).
-- ===========================================================================

create or replace function public.leave_coalition()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_gov public.governments%rowtype; v_nation text; v_is_pm boolean;
begin
  v_p := public._begin_action(0);   -- requires >= 1 action; the weekly action is spent below
  v_nation := v_p.nation_id;

  if not coalesce(v_p.in_government, false) then
    raise exception 'Your party is not in the government.'; end if;

  select * into v_gov from public.governments where nation_id = v_nation and status = 'active';
  if not found then raise exception 'No government sits to leave.'; end if;

  -- A live no-confidence motion takes precedence — resolve it before leaving (mirrors resign).
  if exists (select 1 from public.proposals
              where nation_id = v_nation and kind = 'no_confidence' and status in ('agenda', 'voting')) then
    raise exception 'A no-confidence motion is on the floor — it must be resolved first.'; end if;

  v_is_pm := v_gov.formateur_party_id is not distinct from v_p.id;
  update public.parties set actions_remaining = actions_remaining - 1 where id = v_p.id;

  if v_is_pm then
    -- The premier walking out = resigning: their party −5 Party Popularity (floor-respecting,
    -- clamped 0..100), then a snap election reseats the whole government.
    update public.parties
       set popularity = greatest(0, least(100, public._mod_floor_drop(
             v_nation, archetype, popularity, popularity - 5)))
     where id = v_p.id;
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (v_nation, v_p.id, 'declaration',
              v_p.name || ' has resigned as Head of Government and left office — fresh elections are called.',
              public.current_game_date());
    perform public.resolve_election(v_nation, 'the Head of Government''s resignation');
    return jsonb_build_object('left', true, 'resigned', true, 'actions', v_p.actions_remaining - 1);
  end if;

  -- A junior partner walks: −3 their Party Popularity (floor-respecting), clear their seat at
  -- the table, then −5 Government Confidence through the one clamp+collapse source. The leaver
  -- is out before the confidence hit, so a resulting collapse never double-penalises them.
  update public.parties
     set popularity = greatest(0, least(100, public._mod_floor_drop(
           v_nation, archetype, popularity, popularity - 3)))
   where id = v_p.id;
  update public.parties set in_government = false where id = v_p.id;

  -- Resign every portfolio the leaver holds — a party out of the government keeps no minister
  -- powers. This mirrors the two ways _party_holds_ministry (schema/114) counts a seat: an
  -- explicit cabinet appointment, or a fulfilled ministry promise naming one of the party's
  -- politicians. Both are released so nothing survives to grant Import/Expand-Military/etc.
  delete from public.cabinet_appointments ca
   using public.politicians p
   where ca.government_id = v_gov.id and ca.politician_id = p.id and p.party_id = v_p.id;
  update public.government_agenda ga
     set status = 'pending',                                     -- the promised seat is vacant again
         params = ga.params - 'minister_id' - 'minister_name' - 'party_abbr'
   where ga.government_id = v_gov.id and ga.type = 'ministry' and ga.status = 'done'
     and exists (select 1 from public.politicians p
                  where p.id = nullif(ga.params->>'minister_id', '')::uuid and p.party_id = v_p.id);

  perform public._apply_policy_effect(v_nation, jsonb_build_object('t', 'Government Confidence', 'v', -5));
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'declaration',
            v_p.name || ' has walked out of the governing coalition.',
            public.current_game_date());
  return jsonb_build_object('left', true, 'resigned', false, 'actions', v_p.actions_remaining - 1);
end $$;
grant execute on function public.leave_coalition() to authenticated;

-- The premier path above supersedes the standalone Resign action — drop the dead RPC.
drop function if exists public.resign_government();

notify pgrst, 'reload schema';
