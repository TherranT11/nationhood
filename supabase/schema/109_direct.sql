-- ===========================================================================
-- 109 · Direct — field actions a party leader assigns to a chosen member.
-- Depends on: 20 (parties + clamp helpers), 30 (politicians), 40 (_begin_action,
-- _effective_ceiling/_mod_cap_raise/_mod_floor_drop, _bare_party, events),
-- 60 (governments, advance_tick action reset), 91 (_nation_stat_add). Run after 108.
--
-- The DIRECT action opens a member of the player's party and spends 1 of the party's
-- actions on a field action by that member. This file ships the three INSTANT actions
-- (no tick scheduling): Run for Parliament, Raise a Paramilitary Wing, and the Deputy
-- Leader appointment. Mayor candidacy + Youth Wing (which resolve later via the tick)
-- are deferred.
--
-- INVARIANT enforced everywhere here: floor ≤ ceiling, and floor ≤ popularity ≤ ceiling.
-- Raises clamp through _effective_ceiling/_mod_cap_raise; drops through _mod_floor_drop;
-- a lowered ceiling is held at the floor and pulls popularity down with it.
-- ===========================================================================

-- Run for Parliament: the directed member rolls 1D6 + their Image (politicians.com) +
-- campaign spend ($25K each = +1) against a random rival party that holds a seat, which
-- rolls 1D10. Win → steal one seat (you +1, them −1, so the chamber total is unchanged)
-- and +1% popularity for you / −1% for them. Lose → only the action + spend are forfeit.
-- 1 action (the player's choice for Direct) + the optional campaign spend.
-- SCHEDULES a parliamentary run (it no longer resolves on the spot — see schema/111). The rival
-- party + its leader are locked NOW; the contest resolves 1D3 ticks out in _resolve_parliamentary_
-- runs. $50K base + the optional campaign spend, and 1 action. The member must not already be
-- standing for office (Parliament or Mayor) and must be off the 12-tick MP cooldown.
create or replace function public.direct_parliament(p_member uuid, p_spend int default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_image int; v_mname text; v_spend int := greatest(0, coalesce(p_spend, 0));
  v_cost bigint; v_riv record; v_oppname text; v_leg text; v_tick int; v_resolve int; v_until int;
begin
  v_cost := 50000 + v_spend::bigint * 25000;
  v_p := public._begin_action(v_cost);   -- locks party, requires ≥1 action + funds ≥ spend
  select btrim(first_name || ' ' || last_name), coalesce(com, 0), coalesce(mp_until_tick, 0)
    into v_mname, v_image, v_until
    from public.politicians where id = p_member and party_id = v_p.id;
  if not found then raise exception 'That isn''t one of your members.'; end if;
  if public._politician_busy(p_member) then raise exception '%', v_mname || ' is already standing for office — wait until it resolves.'; end if;
  if public._politician_is_minister(p_member) then raise exception '%', v_mname || ' holds a cabinet ministry — a sitting minister can''t run for Parliament.'; end if;
  select current_tick into v_tick from public.game_state where id;
  if v_until > v_tick then raise exception '%', v_mname || ' can''t stand for Parliament again yet (cooldown: ' || (v_until - v_tick) || ' ticks).'; end if;

  -- Lock the rival party now (a random seat-holder) + the chamber's name. The NAMED opponent is a
  -- GENERATED backbencher of that party — never its actual leader, whose own seat is never put up
  -- for contest. The seat still comes off the rival party on a win; only the face of it is generic.
  select id, name into v_riv
    from public.parties where nation_id = v_p.nation_id and id <> v_p.id and seats >= 1
    order by random() limit 1;
  if not found then raise exception 'No rival party holds a seat to contest.'; end if;
  select nullif(btrim(concat_ws(' ', first_name, last_name)), '') into v_oppname
    from public._random_name(v_p.nation_id);   -- a name drawn from the nation's own pool (schema/50)
  v_oppname := coalesce(v_oppname, 'a backbencher');
  v_leg := coalesce(nullif(public.nation_declaration(v_p.nation_id, 'legislature_name'), ''), 'the legislature');
  v_resolve := v_tick + 1 + floor(random() * 3)::int;   -- 1D3 ticks out (1..3)

  insert into public.mp_candidacies (party_id, politician_id, candidate_name, candidate_image, opponent_party_id, opponent_name, spend, resolve_tick)
    values (v_p.id, p_member, v_mname, v_image, v_riv.id, v_oppname, v_spend, v_resolve);
  update public.parties set funds = funds - v_cost, influence = influence - 1 where id = v_p.id;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'party',
            v_mname || ' announces their run for ' || v_leg || ' against ' || v_oppname || ' of the '
            || public._bare_party(v_riv.name) || '. Pundits across the nation are saying it will be a hotly contested race.',
            public.current_game_date());

  return jsonb_build_object('opponent', v_riv.name, 'resolve_tick', v_resolve,
    'funds', v_p.funds - v_cost, 'actions', v_p.influence - 1);
end $$;
grant execute on function public.direct_parliament(uuid, int) to authenticated;

-- Raise a Paramilitary Wing: a hardliner show of force. +3% popularity now, but the
-- Republic turns colder — −1 Regime, −3% popularity ceiling, −1% Government Confidence.
-- 1 action, no fee. Order honours the invariant: drop the ceiling (held at the floor),
-- then settle popularity into [floor, effective ceiling] — a lowered ceiling pulls it down.
create or replace function public.direct_paramilitary(p_member uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_newceil numeric; v_eff numeric; v_newpop numeric; v_gain numeric; v_body text;
begin
  v_p := public._begin_action(0);
  perform 1 from public.politicians where id = p_member and party_id = v_p.id;   -- a member is directed, but the wing is the party's
  if not found then raise exception 'That isn''t one of your members.'; end if;
  if public._politician_busy(p_member) then raise exception 'That member is standing for office — they can''t be directed elsewhere yet.'; end if;
  if public._politician_is_minister(p_member) then raise exception 'That member holds a cabinet ministry — a sitting minister can''t raise a paramilitary wing.'; end if;

  v_newceil := greatest(v_p.pop_floor, v_p.pop_ceiling - 3);                                  -- ceiling ≥ floor
  v_eff     := public._effective_ceiling(v_p.nation_id, v_p.archetype, v_newceil, v_p.pop_floor);
  v_newpop  := greatest(v_p.pop_floor, least(v_p.popularity + 3, v_eff));                     -- +3, clamped to [floor, ceiling]
  v_gain    := v_newpop - v_p.popularity;

  update public.parties set pop_ceiling = v_newceil, popularity = v_newpop, influence = influence - 1 where id = v_p.id;
  perform public._nation_stat_add(v_p.nation_id, 'economy', 'regime', -1, 1, 25);             -- regime −1 (clamped 1..25)
  update public.governments set confidence = greatest(0, confidence - 1) where nation_id = v_p.nation_id and status = 'active';

  v_body := 'The ' || public._bare_party(v_p.name)
         || ' has announced the formation of its own paramilitary wing — a show of force on the streets. Popularity '
         || (case when v_gain >= 0 then '+' else '−' end) || trim(to_char(abs(v_gain), 'FM990.0'))
         || '%, but the Republic turns colder: −1 Regime, −3% ceiling, −1% Government Confidence.';
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'party', v_body, public.current_game_date());

  return jsonb_build_object('pop_gain', v_gain, 'popularity', v_newpop, 'ceiling', v_newceil, 'actions', v_p.influence - 1);
end $$;
grant execute on function public.direct_paramilitary(uuid) to authenticated;

-- Appoint (or dismiss) a member as Deputy Leader — a standing role, one per party. Costs 1
-- action, like the other Direct actions. While a Deputy serves, the party's per-turn actions
-- reset to 13 instead of 12 (advance_tick, schema/60). The ambition / leadership-challenge /
-- succession dynamics are deferred.
create or replace function public.direct_appoint_deputy(p_member uuid, p_appoint boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_mname text; v_status text;
begin
  v_p := public._begin_action(0);   -- requires ≥1 action; the action is spent below
  select btrim(first_name || ' ' || last_name), status into v_mname, v_status
    from public.politicians where id = p_member and party_id = v_p.id;
  if not found then raise exception 'That isn''t one of your members.'; end if;
  if public._politician_busy(p_member) then raise exception '%', v_mname || ' is standing for office — they can''t be directed elsewhere yet.'; end if;

  if p_appoint then
    if v_status = 'Party Leader' then raise exception 'The Party Leader can''t also be Deputy.'; end if;
    update public.politicians set status = 'Party Member' where party_id = v_p.id and status = 'Deputy Leader' and id <> p_member;
    update public.politicians set status = 'Deputy Leader' where id = p_member;
  else
    if v_status <> 'Deputy Leader' then raise exception 'They aren''t the Deputy Leader.'; end if;
    update public.politicians set status = 'Party Member' where id = p_member;
  end if;

  update public.parties set influence = influence - 1 where id = v_p.id;   -- spend the action

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'party',
            v_mname || (case when p_appoint then ' has been appointed Deputy Leader of the ' else ' has stepped down as Deputy Leader of the ' end)
              || public._bare_party(v_p.name) || '.', public.current_game_date());

  return jsonb_build_object('deputy', case when p_appoint then v_mname else null end, 'member', v_mname,
    'actions', v_p.influence - 1);
end $$;
grant execute on function public.direct_appoint_deputy(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
