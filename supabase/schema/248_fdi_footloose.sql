-- ===========================================================================
-- 248 · FDI Phase 2B (footloose) — the plant that walks when labour gets dear + "Match Their Terms".
--
-- A tier-1 (extractive / footloose) plant chased cheap labour; when the host's Wages outgrow the deal's
-- tolerance it threatens to relocate — the recession-with-a-logo beat. Once a year (January) any such
-- plant whose host Wages passed its wage_threshold is flagged (depart_tick = next tick). The host has
-- that one-tick window to retain_fdi_deal ("Match Their Terms") — pay the concession (2 AP, resets the
-- tolerance) — or the plant departs the next tick: _end_fdi_deal(DEPARTED) claws the Growth back and the
-- plant is removed. tier-2/3 plants are sticky (no wage_threshold → never footloose).
--
-- The whole check rides inside _resolve_fdi_deals (already run each tick by _advance_tick), so no new
-- tick step / _advance_tick redefine. wage_threshold is set at ACTIVATION from the host's Wages then.
--
-- Deferred (noted): the "another nation now offers a better climate" departure trigger (Wages-only for
-- this cut) and a Budget retention SUBSIDY (the concession is AP + a reset tolerance for now).
--
-- Depends on: 243-246 (fdi_deals, _resolve_fdi_deals, _end_fdi_deal, _corp_fdi_tier), 40
-- (_begin_action/events), 174 (_party_holds_ministry/_spend_action_point). Idempotent. Apply after 247.
-- ===========================================================================

set check_function_bodies = off;

alter table public.fdi_deals add column if not exists wage_threshold int;   -- tier-1 only; null = sticky
alter table public.fdi_deals add column if not exists depart_tick    int;   -- set = flagged to leave at this tick

-- Redefine the resolver (body from schema/246) to: set wage_threshold for a tier-1 plant on activation,
-- resolve flagged departures each tick, and — each January — flag a tier-1 plant whose host Wages have
-- outgrown its tolerance (giving the host one tick to match).
create or replace function public._resolve_fdi_deals(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_d record; v_tier int; v_base numeric; v_p numeric; v_roll numeric; v_rel int; v_clim numeric; v_wage numeric;
begin
  for v_d in
    select d.*, c.size as corp_size, c.name as corp_name from public.fdi_deals d
      join public.corporations c on c.id = d.corp_id
     where d.state = 'PENDING' and coalesce(d.decision_tick, 0) <= p_tick
  loop
    v_tier := public._corp_fdi_tier(v_d.corp_size);
    v_base := case v_tier when 1 then 0.85 when 3 then 0.35 else 0.60 end;
    select value into v_rel from public.nation_relations
     where nation_a = least(v_d.host_nation_id, v_d.owner_nation_id)
       and nation_b = greatest(v_d.host_nation_id, v_d.owner_nation_id);
    v_clim := public._fdi_climate(v_d.host_nation_id);
    v_p := v_base + 0.05 * coalesce(v_d.temperature, 0)
         + 0.02 * (coalesce(v_rel, 5) - 5)
         + greatest(-0.15, least(0.15, (coalesce(v_clim, 50) - 50) / 100.0 * 0.3));
    v_p := greatest(0.02, least(0.98, v_p));
    v_roll := (('x' || substr(md5(v_d.id::text || p_tick::text), 1, 4))::bit(16)::int)::numeric / 65535.0;
    if v_roll < v_p then
      -- tier-1 plants are footloose: tolerate wages up to (Wages-at-signing + 15), then get restless.
      v_wage := case when v_tier = 1 then round(coalesce(public._nation_live_stat(v_d.host_nation_id, 'Wages'), 0)) + 15 end;
      update public.fdi_deals set state = 'ACTIVE', signed_tick = p_tick, wage_threshold = v_wage where id = v_d.id;
      perform public._place_building(v_d.host_nation_id, v_d.hex_q, v_d.hex_r, 'plant',
                                     v_d.owner_nation_id, 'fdi', v_d.id, v_d.host_growth, v_d.corp_name);
      perform public._fdi_event(v_d.id, 'SIGNED');
    else
      perform public._end_fdi_deal(v_d.id, 'REJECTED');
    end if;
  end loop;

  for v_d in select id from public.fdi_deals
              where state = 'ACTIVE' and ends_tick is not null and ends_tick <= p_tick loop
    perform public._end_fdi_deal(v_d.id, 'EXPIRED');
  end loop;

  -- Footloose departures: a flagged plant that reached its depart tick leaves (host didn't match).
  for v_d in select id from public.fdi_deals
              where state = 'ACTIVE' and depart_tick is not null and depart_tick <= p_tick loop
    perform public._end_fdi_deal(v_d.id, 'DEPARTED');
  end loop;

  -- Yearly (January): flag a tier-1 plant whose host Wages outgrew its tolerance. One tick to match.
  if (p_tick - 1) % 12 = 0 then
    for v_d in select * from public.fdi_deals
                where state = 'ACTIVE' and wage_threshold is not null and depart_tick is null loop
      if coalesce(public._nation_live_stat(v_d.host_nation_id, 'Wages'), 0) > v_d.wage_threshold then
        update public.fdi_deals set depart_tick = p_tick + 1 where id = v_d.id;
        insert into public.events (nation_id, kind, body, game_date)
          values (v_d.host_nation_id, 'economy',
            (select name from public.corporations where id = v_d.corp_id) ||
            ' is threatening to relocate its plant — local wages have outgrown the deal. Match their terms within the tick or lose it.',
            public.current_game_date());
      end if;
    end loop;
  end if;
end $$;
revoke all on function public._resolve_fdi_deals(int) from public, anon, authenticated;

-- Match Their Terms — the host pays to keep a plant that threatened to leave. Minister of Finance, 2 AP;
-- clears the departure flag and resets the wage tolerance (the concession). The corp will demand again
-- as wages keep climbing — the retention is a lease, not a purchase.
create or replace function public.retain_fdi_deal(p_deal uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_p public.parties%rowtype; v_d public.fdi_deals%rowtype; v_wage numeric; v_cname text;
begin
  v_p := public._begin_action(0); perform public._spend_action_point(v_p.id);   -- 2 AP
  if not public._party_holds_ministry(v_p.id, 'Treasury') then
    raise exception 'Only the Minister of Finance can match a retention offer.'; end if;
  select * into v_d from public.fdi_deals where id = p_deal;
  if not found or v_d.state <> 'ACTIVE' or v_d.depart_tick is null then
    raise exception 'There is no relocation threat to match on that deal.'; end if;
  if v_d.host_nation_id <> v_p.nation_id then
    raise exception 'You can only retain a plant inside your own nation.'; end if;
  v_wage := coalesce(public._nation_live_stat(v_d.host_nation_id, 'Wages'), 0);
  update public.fdi_deals set depart_tick = null, wage_threshold = round(v_wage) + 15 where id = p_deal;
  select name into v_cname from public.corporations where id = v_d.corp_id;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_d.host_nation_id, v_p.id, 'economy',
      v_p.name || ' matched ' || coalesce(v_cname, 'the investor') || '’s terms — the plant stays, for now.',
      public.current_game_date());
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.retain_fdi_deal(uuid) to authenticated;

notify pgrst, 'reload schema';
