-- ===========================================================================
-- 256 · Card effect — one-time Budget Balance increase / decrease.
--
-- Adds two card-effect kinds, budget_up / budget_down, to _apply_card_effect. Both route to
-- _nation_budget_add (schema/91): a one-shot money change — a positive delta lands in the nation's
-- Budget; a negative one draws the Budget down and rolls any shortfall into Debt. (Budget Balance
-- itself is derived from income − spending, so a "one-time" change hits the underlying money store.)
--
-- Body reproduced verbatim from schema/176 (the ONLY definition of _apply_card_effect) with just the
-- two new WHEN arms added — no other behaviour changes. Depends on: 176, 91 (_nation_budget_add).
-- Idempotent. Apply after 176.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public._apply_card_effect(p_nation text, p_target uuid, p_kind text, p_p jsonb, p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_x numeric; v_gov uuid; v_live numeric;
begin
  p_p := coalesce(p_p, '{}'::jsonb);
  v_x := coalesce(public._to_num(p_p->>'x'), 0);
  case p_kind
    when 'stat_up'   then perform public._apply_card_stat(p_nation, p_p->>'stat',  v_x);
    when 'stat_down' then perform public._apply_card_stat(p_nation, p_p->>'stat', -v_x);
    -- One-time Budget Balance change (schema/91: _nation_budget_add). budget_up banks money into the
    -- Budget; budget_down draws it down and rolls any shortfall into Debt. budget_down is up negated.
    when 'budget_up'   then perform public._nation_budget_add(p_nation,  v_x);
    when 'budget_down' then perform public._nation_budget_add(p_nation, -v_x);
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
    -- Swap the sitting Head of Government for a freshly-named successor (resignation / death handover).
    when 'hog_change' then perform public._card_change_hog(p_nation);
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

notify pgrst, 'reload schema';
