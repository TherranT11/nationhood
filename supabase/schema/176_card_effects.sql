-- ===========================================================================
-- 176 · Card Effect Resolution — Phase 3b-1: IMMEDIATE effects fire on play.
--
-- card_play (schema/174) logged a card and granted its Action Points but applied none of its authored
-- effects. This resolves the ones that fire immediately, against the systems that actually exist:
--
--   stat_up / stat_down  → _apply_card_stat: the real-backed stats (Growth/Prosperity/Rule of Law/
--                          Unemployment/Public Debt) route to _nation_stat_add so the game feels them;
--                          every other stat routes to _nation_ministry_stat_add (the delta layer, 175).
--   party_gain/party_lose → _apply_party_effect (Party Popularity) on the target the player picked at
--                          play (p_target, threaded from card_play). No target chosen → skipped; the
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

-- Mint a named, board-visible national modifier (schema/70) that adds a flat delta to one resource's
-- Produce output for p_ticks ticks, then auto-lifts (a 'duration' end condition, checked each tick in
-- schema/60). source='card' so schema/60 purges the definition once it detaches — a card played many
-- times never grows the modifier list. Green for a boost, red for a cut. No-op on a zero delta/duration.
create or replace function public._mint_timed_resource_modifier(p_nation text, p_res text, p_delta numeric, p_ticks int, p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_mid uuid;
begin
  if coalesce(p_delta, 0) = 0 or coalesce(p_ticks, 0) <= 0 then return; end if;
  insert into public.national_modifiers (name, color, description, source)
    values (initcap(p_res) || ' production ' || (case when p_delta > 0 then '+' else '' end) || p_delta::int,
            case when p_delta > 0 then 'green' else 'red' end,
            'Temporary — lasts ' || p_ticks || ' ticks.', 'card')
    returning id into v_mid;
  insert into public.modifier_effects (modifier_id, effect_type, effect_key, effect_value)
    values (v_mid, 'resource_add', p_res, p_delta);
  insert into public.modifier_end_conditions (modifier_id, cond_type, cond_op, cond_key, cond_value)
    values (v_mid, 'duration', 'gte', null, p_ticks);
  insert into public.nation_modifiers (nation_id, modifier_id, since_tick)
    values (p_nation, v_mid, p_tick);
end $$;
revoke all on function public._mint_timed_resource_modifier(text, text, numeric, int, int) from public, anon, authenticated;

-- Apply ONE authored effect. p_target is the party a party-scoped effect hits (null → skip, no target
-- chosen). Unresolvable kinds are silent no-ops (see header). Recurses for 'cond'.
drop function if exists public._apply_card_effect(text, uuid, uuid, text, jsonb, int);   -- retired 6-arg form (dead p_party removed)
create or replace function public._apply_card_effect(p_nation text, p_target uuid, p_kind text, p_p jsonb, p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_x numeric; v_gov uuid; v_live numeric;
begin
  p_p := coalesce(p_p, '{}'::jsonb);
  v_x := coalesce(public._to_num(p_p->>'x'), 0);
  case p_kind
    when 'stat_up'   then perform public._apply_card_stat(p_nation, p_p->>'stat',  v_x);
    when 'stat_down' then perform public._apply_card_stat(p_nation, p_p->>'stat', -v_x);
    -- party_gain/lose hit the play-time chosen party; decider_gain/lose hit the party resolving a
    -- Government-Choice decision (card_decide passes it as p_target). Same write, different target source.
    when 'party_gain', 'decider_gain' then if p_target is not null then perform public._apply_party_effect(p_target, p_nation, jsonb_build_object('t', 'Party Popularity', 'v',  v_x)); end if;
    when 'party_lose', 'decider_lose' then if p_target is not null then perform public._apply_party_effect(p_target, p_nation, jsonb_build_object('t', 'Party Popularity', 'v', -v_x)); end if;
    -- Every party IN GOVERNMENT gains/loses X approval — the coalition-wide swing, through the same
    -- policy engine the modifier tick uses (schema/91: loops in_government parties, canonical clamps).
    when 'coal_pop_up'   then perform public._apply_policy_effect(p_nation, jsonb_build_object('t', 'Party Popularity', 'v',  v_x));
    when 'coal_pop_down' then perform public._apply_policy_effect(p_nation, jsonb_build_object('t', 'Party Popularity', 'v', -v_x));
    when 'coal_up' then
      select id into v_gov from public.governments where nation_id = p_nation and status = 'active';
      if v_gov is not null then perform public._coalition_health_restore(v_gov, 1); end if;
    when 'coal_down' then
      if exists (select 1 from public.governments where nation_id = p_nation and status = 'active') then
        perform public._coalition_health_drop(p_nation, 1, 5, 'a played card', p_tick);
      end if;
    when 'nat_el' then
      update public.nations set next_election_tick = p_tick where id = p_nation and coalesce(next_election_tick, p_tick + 1) > p_tick;
    -- Diplomacy: nudge the 1–10 standing between the playing nation and a nation chosen in the card
    -- (p->>'nation'). rel_down is rel_up with the sign flipped. Clamp + guards live in _relation_adjust.
    when 'rel_up' then   perform public._relation_adjust(p_nation, p_p->>'nation',  v_x::int);
    when 'rel_down' then perform public._relation_adjust(p_nation, p_p->>'nation', (-v_x)::int);
    -- Timed production boost/cut: mint a named national modifier (schema/70) that adds a flat delta to a
    -- resource's Produce output for p->>'ticks' ticks, then auto-lifts (a 'duration' end condition). Shows
    -- on the nation's modifier board. prod_down is prod_up negated. Guards on a real production resource
    -- and a positive duration.
    when 'prod_up', 'prod_down' then
      if p_p->>'res' in ('energy', 'food', 'minerals', 'goods', 'services', 'military', 'diplomacy')
         and coalesce(public._to_num(p_p->>'ticks'), 0) > 0 then
        perform public._mint_timed_resource_modifier(
          p_nation, p_p->>'res',
          case when p_kind = 'prod_up' then v_x else -v_x end,
          (public._to_num(p_p->>'ticks'))::int, p_tick);
      end if;
    -- Activate a dormant card into a chosen nation's deck (schema/184), now or after 'ticks' ticks. The
    -- card ('card'), nation ('nation') and delay ('ticks', default 0 = immediately) are authored on the
    -- effect. Guarded against a malformed uuid so a bad param can't abort.
    when 'deck_add' then
      if p_p->>'card' ~ '^[0-9a-fA-F-]{36}$' then
        perform public._card_schedule_deck_add((p_p->>'card')::uuid, p_p->>'nation',
                                               p_tick + coalesce((public._to_num(p_p->>'ticks'))::int, 0), p_tick);
      end if;
    -- The playing nation sanctions a target nation ('nation') for a MINIMUM of 'ticks' ticks — an embargo
    -- that can't be lifted before then (schema/117). Guarded against self/zero-duration.
    when 'sanction' then
      if p_p->>'nation' is not null and p_p->>'nation' <> '' and coalesce(public._to_num(p_p->>'ticks'), 0) > 0 then
        perform public._card_place_sanction(p_nation, p_p->>'nation', p_tick + (public._to_num(p_p->>'ticks'))::int);
      end if;
    when 'cond' then
      v_live := public._nation_live_stat(p_nation, p_p->>'stat');
      if (p_p->>'dir' = 'above' and v_live >  v_x)
      or (p_p->>'dir' = 'below' and v_live <  v_x) then
        perform public._apply_card_effect(p_nation, p_target, p_p->>'nk', p_p->'np', p_tick);
      end if;
    -- Add / remove resource units from the nation's on-hand stockpile (schema/113: nations.on_hand).
    -- food/goods/services/military are the economy-consumed stocks; minerals/diplomacy/army/navy/
    -- air_wings are held stockpiles a card can move. Clamped at 0 — a removal can't push it negative.
    -- One guarded write for both directions: res_remove is res_add with the sign flipped.
    when 'res_add', 'res_remove' then
      if p_p->>'res' in ('food', 'goods', 'services', 'military', 'energy', 'minerals', 'diplomacy', 'army', 'navy', 'air_wings') then
        perform public._nation_stat_add(p_nation, 'on_hand', p_p->>'res',
                                        case when p_kind = 'res_add' then v_x else -v_x end, 0, null);
      end if;
    -- no_conf / appoint / hex_el / mob_add / mob_rem / mil_add / mil_rem / event: deferred → no-op.
    else null;
  end case;
end $$;
revoke all on function public._apply_card_effect(text, uuid, text, jsonb, int) from public, anon, authenticated;

-- A hex-scoped Party Popularity swing: ±p_delta to a party's regional tilt at one land hex, reusing
-- the schema/163 store (party_hex_bias) that the Party page already reads as national ± lean ± bias.
-- So this needs no new source and no new UI on the Party page. The hex must be land in p_nation
-- (guards a spoofed q,r); accumulated bias is capped at ±40 exactly as the policy distributor (163).
create or replace function public._apply_card_hex(p_party uuid, p_nation text, p_q int, p_r int, p_delta numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_party is null or p_q is null or p_r is null or coalesce(p_delta, 0) = 0 then return; end if;
  if not exists (select 1 from public.world_hexes
                  where nation_id = p_nation and q = p_q and r = p_r and terrain = 'land') then
    raise exception 'That hex is not land in this nation.';
  end if;
  insert into public.party_hex_bias (party_id, q, r, bias) values (p_party, p_q, p_r, p_delta)
  on conflict (party_id, q, r) do update
     set bias = greatest(-40, least(40, public.party_hex_bias.bias + excluded.bias));
end $$;
revoke all on function public._apply_card_hex(uuid, text, int, int, numeric) from public, anon, authenticated;

-- Resolve a played card's IMMEDIATE effects. One-Off: apply every effect on a generic card, and only
-- the 'both'-sided effects on a stance card (the d/r sides wait for party stance). Government Choice
-- fires nothing on play — it opens a decision (schema/178) whose chosen option's effects resolve then.
-- Double-Sided: both sides are stance-gated, so nothing fires yet. p_q/p_r are the hex chosen on play
-- (for 'hex_pop': with a rival (p_target) it's −x on that rival there, else +x on the player there).
drop function if exists public._resolve_card_effects(text, uuid, jsonb, int);        -- pre-target form
drop function if exists public._resolve_card_effects(text, uuid, uuid, jsonb, int);   -- pre-hex form
create or replace function public._resolve_card_effects(p_nation text, p_party uuid, p_target uuid, p_q int, p_r int, p_def jsonb, p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_generic boolean; e jsonb; v_x numeric;
begin
  v_generic := (p_def->>'type' = 'generic');
  if coalesce(p_def->>'mech', 'oneoff') = 'oneoff' then
    for e in select value from jsonb_array_elements(coalesce(p_def->'fx', '[]'::jsonb)) loop
      if v_generic or coalesce(e->>'side', 'both') = 'both' then
        if e->>'kind' = 'hex_pop' then
          v_x := coalesce(public._to_num(e->'p'->>'x'), 0);   -- hex-scoped popularity: you +x, or a rival −x
          if p_target is not null
            then perform public._apply_card_hex(p_target, p_nation, p_q, p_r, -v_x);
            else perform public._apply_card_hex(p_party,  p_nation, p_q, p_r,  v_x);
          end if;
        elsif e->>'kind' = 'hex_el' then
          perform public.hex_election_resolve(p_nation, p_q, p_r, p_party, p_tick);   -- reapportion the chosen hex
        else
          perform public._apply_card_effect(p_nation, p_target, e->>'kind', e->'p', p_tick);   -- party effects hit the chosen target
        end if;
      end if;
    end loop;
  end if;
end $$;
revoke all on function public._resolve_card_effects(text, uuid, uuid, int, int, jsonb, int) from public, anon, authenticated;

notify pgrst, 'reload schema';
