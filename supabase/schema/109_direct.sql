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
create or replace function public.direct_parliament(p_member uuid, p_spend int default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_p public.parties%rowtype; v_image int; v_mname text; v_spend int := greatest(0, coalesce(p_spend, 0));
  v_cost bigint; v_you int; v_field int; v_win boolean;
  v_riv record; v_newpop numeric; v_body text; v_oppname text; v_leg text;
begin
  v_cost := v_spend::bigint * 25000;
  v_p := public._begin_action(v_cost);   -- locks party, requires ≥1 action + funds ≥ spend
  select btrim(first_name || ' ' || last_name), coalesce(com, 0) into v_mname, v_image
    from public.politicians where id = p_member and party_id = v_p.id;
  if not found then raise exception 'That isn''t one of your members.'; end if;

  -- A random rival in the nation that actually holds a seat to contest. Only id + name are
  -- needed — the drop below reads the rival's live row, so the contest stays race-safe.
  select id, name into v_riv
    from public.parties where nation_id = v_p.nation_id and id <> v_p.id and seats >= 1
    order by random() limit 1;
  if not found then raise exception 'No rival party holds a seat to contest.'; end if;

  -- The named opponent is the rival party's leader; the chamber's name is the nation's
  -- Legislature Name declaration (one source — schema/81 nation_declaration).
  select btrim(first_name || ' ' || last_name) into v_oppname
    from public.politicians where party_id = v_riv.id and status = 'Party Leader' order by created_at limit 1;
  v_oppname := coalesce(nullif(v_oppname, ''), 'their leader');
  v_leg := coalesce(nullif(public.nation_declaration(v_p.nation_id, 'legislature_name'), ''), 'the legislature');

  v_you   := floor(random() * 6)::int + 1 + v_image + v_spend;
  v_field := floor(random() * 10)::int + 1;
  v_win   := v_you > v_field;

  if v_win then
    v_newpop := least(v_p.popularity + 1, public._effective_ceiling(v_p.nation_id, v_p.archetype, v_p.pop_ceiling, v_p.pop_floor));
    v_newpop := public._mod_cap_raise(v_p.nation_id, v_p.archetype, v_p.popularity, v_newpop);
    update public.parties set seats = seats + 1, popularity = v_newpop, funds = funds - v_cost,
           actions_remaining = actions_remaining - 1 where id = v_p.id;
    update public.parties
       set seats = greatest(0, seats - 1),
           popularity = public._mod_floor_drop(nation_id, archetype, popularity, greatest(popularity - 1, pop_floor))
     where id = v_riv.id;
    v_body := v_mname || ' of the ' || public._bare_party(v_p.name) || ' stood for ' || v_leg || ' against '
           || v_oppname || ' of the ' || public._bare_party(v_riv.name) || ' — and won the seat (rolled ' || v_you
           || ' vs ' || v_field || '). +1 seat, +1% popularity; ' || v_riv.name || ' −1 seat, −1% popularity.';
  else
    update public.parties set funds = funds - v_cost, actions_remaining = actions_remaining - 1 where id = v_p.id;
    v_body := v_mname || ' of the ' || public._bare_party(v_p.name) || ' stood for ' || v_leg || ' against '
           || v_oppname || ' of the ' || public._bare_party(v_riv.name) || ', but lost the seat (rolled ' || v_you
           || ' vs ' || v_field || ').';
  end if;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'party', v_body, public.current_game_date());

  return jsonb_build_object('win', v_win, 'you', v_you, 'field', v_field, 'opponent', v_riv.name,
    'seats', v_p.seats + (case when v_win then 1 else 0 end), 'funds', v_p.funds - v_cost,
    'actions', v_p.actions_remaining - 1);
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

  v_newceil := greatest(v_p.pop_floor, v_p.pop_ceiling - 3);                                  -- ceiling ≥ floor
  v_eff     := public._effective_ceiling(v_p.nation_id, v_p.archetype, v_newceil, v_p.pop_floor);
  v_newpop  := greatest(v_p.pop_floor, least(v_p.popularity + 3, v_eff));                     -- +3, clamped to [floor, ceiling]
  v_gain    := v_newpop - v_p.popularity;

  update public.parties set pop_ceiling = v_newceil, popularity = v_newpop, actions_remaining = actions_remaining - 1 where id = v_p.id;
  perform public._nation_stat_add(v_p.nation_id, 'economy', 'regime', -1, 1, 25);             -- regime −1 (clamped 1..25)
  update public.governments set confidence = greatest(0, confidence - 1) where nation_id = v_p.nation_id and status = 'active';

  v_body := 'The ' || public._bare_party(v_p.name)
         || ' has announced the formation of its own paramilitary wing — a show of force on the streets. Popularity '
         || (case when v_gain >= 0 then '+' else '−' end) || trim(to_char(abs(v_gain), 'FM990.0'))
         || '%, but the Republic turns colder: −1 Regime, −3% ceiling, −1% Government Confidence.';
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'party', v_body, public.current_game_date());

  return jsonb_build_object('pop_gain', v_gain, 'popularity', v_newpop, 'ceiling', v_newceil, 'actions', v_p.actions_remaining - 1);
end $$;
grant execute on function public.direct_paramilitary(uuid) to authenticated;

-- Appoint (or dismiss) a member as Deputy Leader — a standing role, one per party. FREE
-- (no action cost): it's an appointment, not a turn action. While a Deputy serves, the
-- party's per-turn actions reset to 13 instead of 12 (advance_tick, schema/60). The
-- ambition / leadership-challenge / succession dynamics are deferred.
create or replace function public.direct_appoint_deputy(p_member uuid, p_appoint boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_mname text; v_status text;
begin
  v_p := public._lock_party();
  select btrim(first_name || ' ' || last_name), status into v_mname, v_status
    from public.politicians where id = p_member and party_id = v_p.id;
  if not found then raise exception 'That isn''t one of your members.'; end if;

  if p_appoint then
    if v_status = 'Party Leader' then raise exception 'The Party Leader can''t also be Deputy.'; end if;
    update public.politicians set status = 'Party Member' where party_id = v_p.id and status = 'Deputy Leader' and id <> p_member;
    update public.politicians set status = 'Deputy Leader' where id = p_member;
  else
    if v_status <> 'Deputy Leader' then raise exception 'They aren''t the Deputy Leader.'; end if;
    update public.politicians set status = 'Party Member' where id = p_member;
  end if;

  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_p.nation_id, v_p.id, 'party',
            v_mname || (case when p_appoint then ' has been appointed Deputy Leader of the ' else ' has stepped down as Deputy Leader of the ' end)
              || public._bare_party(v_p.name) || '.', public.current_game_date());

  -- The appointment spends no action; return the unchanged budget so the client's refresh
  -- (performAction → setActions) has a value to show.
  return jsonb_build_object('deputy', case when p_appoint then v_mname else null end, 'member', v_mname,
    'actions', v_p.actions_remaining);
end $$;
grant execute on function public.direct_appoint_deputy(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
