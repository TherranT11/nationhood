-- ===========================================================================
-- 176 · Card Effect Resolution — Phase 3b-1: IMMEDIATE effects fire on play.
--
-- card_play (schema/174) logged a card and granted its Action Points but applied none of its authored
-- effects. This resolves the ones that fire immediately, against the systems that actually exist:
--
--   stat_up / stat_down  → _apply_card_stat: the real-backed stats (Growth/Prosperity/Rule of Law/
--                          Unemployment/Public Debt) route to _nation_stat_add so the game feels them;
--                          every other stat routes to _nation_ministry_stat_add (the delta layer, 175).
--   party_gain/party_lose → _apply_party_effect (Party Popularity) on the target. A standalone effect
--                          has no target yet (target-picker UI is a later pass), so it's skipped; the
--                          Government-Choice REWARD targets the player who fired it and applies now.
--   coal_up / coal_down  → _coalition_health_restore / _coalition_health_drop on the active government.
--   nat_el               → force a general election (next_election_tick = this tick → resolves next).
--   cond                 → evaluate a live nation stat, then apply its nested effect.
--
-- DEFERRED, resolved as no-ops here (each needs a system that isn't built): no_conf (proposal
-- machinery), appoint (no force-appointment), hex_el / mob_* / mil_* (no hex-election / mob / militia
-- systems), event + the Government-Choice OPTIONS (the decision queue — Phase 3b-2), and every
-- stance-gated side (d/r on stance cards, both sides of a Double-Sided card) until party stance exists.
--
-- Depends on: 10 (nations), 20 (parties), 60 (governments), 91 (_nation_stat_add), 153
-- (_apply_party_effect), 165 (_coalition_health_*), 175 (_nation_ministry_stat_add), 174 (card_play).
-- Idempotent.
-- ===========================================================================

-- Route a card stat change to the right writer: real game stats to _nation_stat_add (so elections /
-- business climate feel them), everything else to the display delta layer (schema/175).
create or replace function public._apply_card_stat(p_nation text, p_stat text, p_delta numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_stat is null or p_stat = '' then return; end if;   -- malformed effect (no stat named) → nothing to change
  case p_stat
    when 'Growth'       then perform public._nation_stat_add(p_nation, 'stats',   'growth',       p_delta, 1, 100);
    when 'Prosperity'   then perform public._nation_stat_add(p_nation, 'stats',   'prosperity',   p_delta, 1, 100);
    when 'Rule of Law'  then perform public._nation_stat_add(p_nation, 'stats',   'order',        p_delta, 1, 100);
    when 'Unemployment' then perform public._nation_stat_add(p_nation, 'economy', 'unemployment', p_delta, 0, 100);
    when 'Public Debt'  then perform public._nation_stat_add(p_nation, 'economy', 'debt',         p_delta, 0, null);
    else                     perform public._nation_ministry_stat_add(p_nation, p_stat, p_delta);
  end case;
end $$;
revoke all on function public._apply_card_stat(text, text, numeric) from public, anon, authenticated;

-- Apply ONE authored effect. p_target is the party a party-scoped effect hits (null → skip, no target
-- chosen). Unresolvable kinds are silent no-ops (see header). Recurses for 'cond'.
create or replace function public._apply_card_effect(p_nation text, p_party uuid, p_target uuid, p_kind text, p_p jsonb, p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_x numeric; v_gov uuid; v_live numeric;
begin
  p_p := coalesce(p_p, '{}'::jsonb);
  v_x := coalesce(public._to_num(p_p->>'x'), 0);
  case p_kind
    when 'stat_up'   then perform public._apply_card_stat(p_nation, p_p->>'stat',  v_x);
    when 'stat_down' then perform public._apply_card_stat(p_nation, p_p->>'stat', -v_x);
    when 'party_gain' then if p_target is not null then perform public._apply_party_effect(p_target, p_nation, jsonb_build_object('t', 'Party Popularity', 'v',  v_x)); end if;
    when 'party_lose' then if p_target is not null then perform public._apply_party_effect(p_target, p_nation, jsonb_build_object('t', 'Party Popularity', 'v', -v_x)); end if;
    when 'coal_up' then
      select id into v_gov from public.governments where nation_id = p_nation and status = 'active';
      if v_gov is not null then perform public._coalition_health_restore(v_gov, 1); end if;
    when 'coal_down' then
      if exists (select 1 from public.governments where nation_id = p_nation and status = 'active') then
        perform public._coalition_health_drop(p_nation, 1, 5, 'a played card', p_tick);
      end if;
    when 'nat_el' then
      update public.nations set next_election_tick = p_tick where id = p_nation and coalesce(next_election_tick, p_tick + 1) > p_tick;
    when 'cond' then
      v_live := public._nation_live_stat(p_nation, p_p->>'stat');
      if (p_p->>'dir' = 'above' and v_live >  v_x)
      or (p_p->>'dir' = 'below' and v_live <  v_x) then
        perform public._apply_card_effect(p_nation, p_party, p_target, p_p->>'nk', p_p->'np', p_tick);
      end if;
    -- no_conf / appoint / hex_el / mob_add / mob_rem / mil_add / mil_rem / event: deferred → no-op.
    else null;
  end case;
end $$;
revoke all on function public._apply_card_effect(text, uuid, uuid, text, jsonb, int) from public, anon, authenticated;

-- Resolve a played card's IMMEDIATE effects. One-Off: apply every effect on a generic card, and only
-- the 'both'-sided effects on a stance card (the d/r sides wait for party stance). Government Choice:
-- apply the reward to the player now (the options are a decision — Phase 3b-2). Double-Sided: both
-- sides are stance-gated, so nothing fires yet.
create or replace function public._resolve_card_effects(p_nation text, p_party uuid, p_def jsonb, p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_mech text; v_generic boolean; e jsonb; v_rk text;
begin
  v_mech := coalesce(p_def->>'mech', 'oneoff');
  v_generic := (p_def->>'type' = 'generic');
  if v_mech = 'oneoff' then
    for e in select value from jsonb_array_elements(coalesce(p_def->'fx', '[]'::jsonb)) loop
      if v_generic or coalesce(e->>'side', 'both') = 'both' then
        perform public._apply_card_effect(p_nation, p_party, null, e->>'kind', e->'p', p_tick);   -- standalone: no target yet
      end if;
    end loop;
  elsif v_mech = 'choice' then
    v_rk := coalesce(p_def->'reward'->>'kind', 'none');
    if v_rk <> 'none' then
      perform public._apply_card_effect(p_nation, p_party, p_party, v_rk, p_def->'reward'->'p', p_tick);   -- reward → the player
    end if;
  end if;
end $$;
revoke all on function public._resolve_card_effects(text, uuid, jsonb, int) from public, anon, authenticated;

notify pgrst, 'reload schema';
