-- ===========================================================================
-- 118 · Resign — the Head of Government voluntarily dissolves the government.
-- Depends on: 40 (_begin_action), 60 (resolve_election), 70 (_mod_floor_drop),
-- 81 (proposals / no_confidence). Run after 81.
--
-- The voluntary twin of a no-confidence fall. The premier chooses to step down: it
-- stings, but lighter than being toppled — the premier's party loses 2 Party
-- Popularity, each coalition partner 1 (floor-respecting), then a snap election
-- reseats the whole government. Blocked while a no-confidence motion is live on the
-- floor (that must resolve first). HoG-gated, spends the weekly action.
-- ===========================================================================

create or replace function public.resign_government()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_gov public.governments%rowtype; v_nation text;
begin
  v_p := public._begin_action(0);   -- requires >= 1 action; the weekly action is spent below
  v_nation := v_p.nation_id;

  select * into v_gov from public.governments where nation_id = v_nation and status = 'active';
  if not found then raise exception 'No government sits to resign.'; end if;
  if v_gov.formateur_party_id <> v_p.id then
    raise exception 'Only the Head of Government can resign the government.'; end if;

  -- A live no-confidence motion takes precedence — resolve it before resigning.
  if exists (select 1 from public.proposals
              where nation_id = v_nation and kind = 'no_confidence' and status in ('agenda', 'voting')) then
    raise exception 'A no-confidence motion is on the floor — it must be resolved first.'; end if;

  -- Voluntary resignation: premier −2 Party Popularity, each coalition partner −1.
  -- Floor-respecting, clamped 0..100 — same path as _confidence_collapse (schema/60).
  update public.parties p
     set popularity = greatest(0, least(100, public._mod_floor_drop(
           v_nation, p.archetype, p.popularity,
           p.popularity - (case when p.id = v_gov.formateur_party_id then 2 else 1 end))))
   where p.nation_id = v_nation and p.in_government;

  update public.parties set actions_remaining = actions_remaining - 1 where id = v_p.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_nation, v_p.id, 'declaration',
            v_p.name || ' has resigned the government — fresh elections are called.',
            public.current_game_date());

  perform public.resolve_election(v_nation, 'the government''s resignation');   -- snap election reseats everyone
  return jsonb_build_object('resigned', true, 'actions', v_p.actions_remaining - 1);
end $$;
grant execute on function public.resign_government() to authenticated;

notify pgrst, 'reload schema';
