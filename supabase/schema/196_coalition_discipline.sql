-- ===========================================================================
-- 196 · Coalition discipline — a partner's policy demands the coalition's votes.
--
-- When a GOVERNING party's policy closes on the floor, every OTHER governing party (its coalition
-- partners) is expected to vote Aye. Each partner that does NOT costs the coalition one heart of
-- Coalition Health (schema/165). When the meter empties, the coalition FRAGMENTS:
--   • the Head of Government resigns (a fresh election is scheduled for next tick),
--   • the Head of Government's party loses 3% Party Popularity,
--   • a snap election is held next tick.
--
-- This is a DIFFERENT collapse consequence from the debt / vacant-cabinet drains (schema/125/138 via
-- _coalition_health_drop), which penalise EVERY governing party — a deliberate split by cause: a
-- coalition that fractures over its own bill costs the Head of Government their chair, not the whole
-- bench. Both paths still schedule the election for the next tick and stop at the same zero floor.
--
-- Called from _resolve_proposal (schema/81) at the CLOSE of a law vote (p_final), so partners have had
-- their chance to vote; an early outright-majority pass skips it, exactly as the abstention penalty does.
--
-- Depends on: 05 (game_state), 10 (nations.next_election_tick), 20 (parties.in_government), 40 (events,
-- current_game_date), 60 (governments.coalition_health, _head_of_government_label), 70 (_mod_floor_drop),
-- 81 (proposals, proposal_votes), 91 (_clamp_pop). Idempotent.
-- ===========================================================================

create or replace function public._coalition_vote_discipline(p_p public.proposals)
returns void language plpgsql security definer set search_path = public as $$
declare v_gov public.governments%rowtype; v_defectors int; v_tick int; v_new int;
begin
  -- Only a policy authored by a governing party, under a heart-tracked active government that still
  -- has hearts (a drained meter no-ops, so two bills in one tick can't double-fragment).
  select * into v_gov from public.governments where nation_id = p_p.nation_id and status = 'active';
  if not found or v_gov.coalition_health is null or v_gov.coalition_health <= 0 then return; end if;
  if not exists (select 1 from public.parties where id = p_p.party_id and in_government) then return; end if;

  -- Coalition partners (every OTHER governing party) that did NOT vote Aye on this policy.
  select count(*) into v_defectors
    from public.parties pp
   where pp.nation_id = p_p.nation_id and pp.in_government and pp.id <> p_p.party_id
     and not exists (select 1 from public.proposal_votes pv
                      where pv.proposal_id = p_p.id and pv.party_id = pp.id and pv.aye);
  if coalesce(v_defectors, 0) < 1 then return; end if;   -- ranks held → no cost

  v_tick := (select current_tick from public.game_state where id);
  v_new  := v_gov.coalition_health - v_defectors;

  if v_new > 0 then
    update public.governments set coalition_health = v_new where id = v_gov.id;
    insert into public.events (nation_id, party_id, kind, body, game_date, tone)
      values (p_p.nation_id, v_gov.formateur_party_id, 'government',
        v_defectors || ' coalition ' || (case when v_defectors = 1 then 'partner' else 'partners' end)
          || ' broke ranks on "' || p_p.title || '" — Coalition Health fell to ' || v_new || '.',
        public.current_game_date(), 'neg');
    return;
  end if;

  -- The last heart is gone → the coalition fragments.
  update public.governments set coalition_health = 0 where id = v_gov.id;
  update public.parties p
     set popularity = public._clamp_pop(public._mod_floor_drop(p_p.nation_id, p.archetype, p.popularity, p.popularity - 3))
   where p.id = v_gov.formateur_party_id;
  update public.nations set next_election_tick = v_tick + 1 where id = p_p.nation_id;
  insert into public.events (nation_id, party_id, kind, body, game_date, tone)
    values (p_p.nation_id, v_gov.formateur_party_id, 'government',
      'The coalition fragmented over "' || p_p.title || '". The Head of Government, '
        || public._head_of_government_label(p_p.nation_id, v_gov.formateur_party_id)
        || ', resigns — their party loses 3% Party Popularity, and a fresh election will be held next tick.',
      public.current_game_date(), 'neg');
end $$;
revoke all on function public._coalition_vote_discipline(public.proposals) from public, anon, authenticated;

notify pgrst, 'reload schema';
