-- ===========================================================================
-- 233 · Ideology approval winds — the live per-tick mechanic.
--
-- While a party sits in OPPOSITION (parties.in_government = false), its declared ideology
-- (schema/232) reacts to the nation's live conditions: for each of its bump/drop stats, the
-- distance the stat sits past a neutral 40–60 band nudges the party's Party Popularity a
-- little each tick. Governing parties (judged on delivery) and undeclared parties get nothing.
--
--   • _apply_ideology_winds(): per nation, read the needed stats ONCE via nation_stat_values
--     (so the wind matches the displayed numbers), then per opposition party sum its
--     conditions and move popularity through _clamp_pop.
--   • _advance_tick(): redefined to run the winds immediately before the popularity snapshot,
--     so party_popularity_history captures the move. (Body identical to schema/60 otherwise.)
--
-- Magnitude (gentle gradient): per condition/tick, 0.01 × points past the band
--   HIGH → 0.01 × max(0, value − 60);  LOW → 0.01 × max(0, 40 − value)   (max 0.4 at the extreme)
-- bumps add, drops subtract; net clamped to ±0.5/tick (~±2/day at 4 ticks/day).
--
-- Depends on: 232 (ideology_conditions), 201 (nation_stat_values), 40 (_clamp_pop),
--   60 (_advance_tick / _snapshot_party_popularity). Idempotent. Apply after 232.
-- ===========================================================================

set check_function_bodies = off;

-- The wind: opposition parties only, one stat read per nation, ±0.5/tick net cap.
create or replace function public._apply_ideology_winds()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_nation text; v_stats text[]; v_sv jsonb;
  v_party record; v_c record; v_net numeric; v_val numeric; v_contrib numeric;
begin
  for v_nation in
    select distinct p.nation_id from public.parties p
     where p.in_government = false and p.archetype is not null
       and exists (select 1 from public.ideology_conditions c where c.ideology = p.archetype)
  loop
    -- Isolated per nation (like every _advance_tick step): one nation's stat read failing must not
    -- rob every other nation of its winds this tick.
    begin
      -- the distinct set of stats any opposition ideology in this nation cares about
      select array_agg(distinct c.stat) into v_stats
        from public.parties p
        join public.ideology_conditions c on c.ideology = p.archetype
       where p.nation_id = v_nation and p.in_government = false;
      if v_stats is null then continue; end if;
      v_sv := public.nation_stat_values(v_nation, v_stats);   -- ONE read; matches the displayed values
      for v_party in
        select id, archetype from public.parties
         where nation_id = v_nation and in_government = false and archetype is not null
      loop
        v_net := 0;
        for v_c in select stat, dir, kind from public.ideology_conditions where ideology = v_party.archetype loop
          -- clamp to the 0–100 band scale; a missing/neutral stat sits at 50 → no wind
          v_val := least(100, greatest(0, coalesce((v_sv->>v_c.stat)::numeric, 50)));
          if v_c.dir = 'HIGH' then v_contrib := 0.01 * greatest(0, v_val - 60);
          else                     v_contrib := 0.01 * greatest(0, 40 - v_val); end if;
          if v_c.kind = 'bump' then v_net := v_net + v_contrib; else v_net := v_net - v_contrib; end if;
        end loop;
        v_net := greatest(-0.5, least(0.5, round(v_net, 3)));
        if v_net <> 0 then
          update public.parties set popularity = public._clamp_pop(popularity + v_net) where id = v_party.id;
        end if;
      end loop;
    exception when others then raise warning 'ideology winds failed for nation % — %', v_nation, sqlerrm;
    end;
  end loop;
end $$;
revoke all on function public._apply_ideology_winds() from public, anon, authenticated;

-- Redefine the tick to run the winds just before the popularity snapshot (schema/60 + one step).
create or replace function public._advance_tick()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_tick int; v_n text; v_count int := 0; v_rec record;
begin
  update public.game_state set current_tick = current_tick + 1 where id returning current_tick into v_tick;
  -- Influence banks each tick: +3, capped at 100 (schema/20), plus 1 for the largest party in each
  -- nation — the one holding the most legislature seats (ties share the bonus). Replaces the old
  -- reset-to-12 Action-Point budget, so unspent Influence now carries forward. Touches every row
  -- (still satisfies the require-a-WHERE-clause guard via id is not null).
  -- Action Points each tick = banked card AP + a fresh 2-AP baseline. The baseline is use-it-or-lose-it:
  -- it refreshes to 2 every tick and never accumulates. Banked AP (card_ap, from played cards) carries.
  -- The baseline is spent before banked AP, so least(card_ap, action_points) is the banked AP still held
  -- after this tick's spending — set AP to that + 2, and re-anchor card_ap to it. Examples: baseline-only
  -- 2 → 2 (no stack); banked 7 → 9, and 9 unspent → still 9 next tick (not 11).
  update public.parties p set influence = least(100, influence + 3 + (
           case when p.seats > 0 and p.seats = (
             select max(p2.seats) from public.parties p2 where p2.nation_id = p.nation_id
           ) then 1 else 0 end)),
         action_points = least(coalesce(p.card_ap, 0), coalesce(p.action_points, 0)) + 2,
         card_ap       = least(coalesce(p.card_ap, 0), coalesce(p.action_points, 0))
   where p.id is not null;
  -- Debt→inflation backlog: snapshot each nation's debt BEFORE this tick's economics, so the
  -- close-out step (end of tick) can measure how much debt was ADDED across the whole tick.
  -- Isolated like every other tick step — if the snapshot fails, the backlog simply no-ops
  -- (its close-out catches the missing table) instead of aborting the whole tick.
  begin
    drop table if exists _tick_debt0;
    create temp table _tick_debt0 on commit drop as
      select id, coalesce((economy->>'debt')::numeric, 0) as debt0 from public.nations;
  exception when others then raise warning 'tick %: debt snapshot failed — %', v_tick, sqlerrm; end;
  -- Standing monthly economics: every nation's in-force policy options apply their
  -- per-tick effects for this month (schema/91). Runs before the floor close below,
  -- so a law enacted this tick starts contributing next tick, not the month it passed.
  begin perform public._apply_policy_tick_effects(v_tick);
  exception when others then raise warning 'tick %: policy economics failed — %', v_tick, sqlerrm; end;
  -- Passive per-tick modifier effects (schema/70): each active modifier's signed stat delta.
  begin perform public._apply_modifier_tick_effects();
  exception when others then raise warning 'tick %: modifier per-tick effects failed — %', v_tick, sqlerrm; end;
  -- Mayoral elections that have come due (schema/110): declared candidates contest the sitting
  -- NPC mayor; a winner takes the chair and lifts their party's popularity floor by the city prize.
  begin perform public._resolve_mayoral_elections(v_tick);
  exception when others then raise warning 'tick %: mayoral elections failed — %', v_tick, sqlerrm; end;
  -- Parliamentary runs that have come due (schema/111): the scheduled 1D6 + Image + spend contest
  -- vs the locked rival; a win steals a seat and the candidate goes on a 12-tick MP cooldown.
  begin perform public._resolve_parliamentary_runs(v_tick);
  exception when others then raise warning 'tick %: parliamentary runs failed — %', v_tick, sqlerrm; end;
  -- Youth-wing drives that have come due (schema/112): raise the party's popularity floor by
  -- 0.1% × (1D3 + the organiser's Image).
  begin perform public._resolve_youth_wings(v_tick);
  exception when others then raise warning 'tick %: youth wings failed — %', v_tick, sqlerrm; end;
  -- Economy demands (schema/113): self-filters to the June tick, where the annual accounts
  -- close — a fed nation grows +1M, each unmet demand drops its stat, then the flags reset.
  begin perform public._resolve_economy_demands(v_tick);
  exception when others then raise warning 'tick %: economy demands failed — %', v_tick, sqlerrm; end;
  -- Card block upkeep (schema/208): the sealed-bid auction is retired — the COIN claim loop (schema/207)
  -- is the sole card mechanic — so each tick simply keeps every nation's on-block market topped up to
  -- (active parties + 1) from the deck, ready to be claimed.
  begin perform public._refill_all_card_blocks(v_tick);
  exception when others then raise warning 'tick %: card block upkeep failed — %', v_tick, sqlerrm; end;
  -- (Turn rotation retired with the auction — every party claims every tick now, so there is no cursor
  --  to advance. _advance_turns and the turn state were dropped in schema/209.)
  -- Every tick: the nation's Budget Balance moves Public Debt by the annual balance / 12 — a surplus
  -- pays it down, a deficit adds to it (symmetric) — _apply_budget_balance (schema/152).
  begin perform public._apply_budget_balance(v_tick);
  exception when others then raise warning 'tick %: budget balance debt move failed — %', v_tick, sqlerrm; end;
  -- Every January (self-gated): party leaders and corp directors age a year, and those who reach the
  -- retirement/death window (70–78, sliding down with a poor Standard of Living) leave and are replaced
  -- by a fresh figure from the nation's name pool — _age_leaders (schema/195).
  begin perform public._age_leaders(v_tick);
  exception when others then raise warning 'tick %: leader aging failed — %', v_tick, sqlerrm; end;
  -- Every January: Public Debt accrues interest — 5%, escalating to 10% over 100% of GDP and 15%
  -- over 200% (_apply_debt_interest, schema/152); the matching stat pain lands in malaise (125).
  begin perform public._apply_debt_interest(v_tick);
  exception when others then raise warning 'tick %: debt interest failed — %', v_tick, sqlerrm; end;
  -- January (the new month is January when (tick − 1) is a multiple of 12): apply
  -- each nation's annual income to its budget. A surplus fills the bank; a deficit
  -- (negative income) drains a positive budget, and any shortfall past zero rolls
  -- into the debt:  budget' = max(0, budget+income);  debt' = debt + max(0,
  -- -(budget+income)). Flat admin-set figure; only non-zero incomes. Event surfaces it.
  begin
  if (v_tick - 1) % 12 = 0 then
    -- Add each nation's income to its budget through the one budget rule (_nation_budget_add,
    -- schema/91): budget floors at 0, the shortfall overflows to debt. A modifier's income Rate
    -- Multiplier (schema/70) scales the take before it lands.
    for v_rec in
      select id, coalesce((economy->>'income')::numeric, 0) as inc
        from public.nations
       where coalesce((economy->>'income')::numeric, 0) <> 0 and not coalesce(dormant, false)
    loop
      perform public._nation_budget_add(v_rec.id, round(v_rec.inc * public._mod_rate_multiplier(v_rec.id, 'income')));
    end loop;
    insert into public.events (nation_id, party_id, kind, body, game_date)
    select n.id, null, 'income',
           'Annual income of ' || (case when x.eff < 0 then '−' else '+' end) || x.cur || abs(x.eff)::text ||
           'B applied — budget ' || x.cur || (n.economy->>'budget') || 'B, debt ' || x.cur || (n.economy->>'debt') || 'B.',
           public.current_game_date()
      from public.nations n
      cross join lateral (select round((n.economy->>'income')::numeric * public._mod_rate_multiplier(n.id, 'income')) as eff,
                                 coalesce(n.economy->>'currency', '$') as cur) x
     where coalesce((n.economy->>'income')::numeric, 0) <> 0 and not coalesce(n.dormant, false);
  end if;
  exception when others then raise warning 'tick %: annual income failed — %', v_tick, sqlerrm; end;
  -- World Trade ledger (schema/116): wipe the accumulated bilateral flows at the January tick
  -- so the ledger resets each year (year-to-date totals start fresh).
  begin
  if (v_tick - 1) % 12 = 0 then
    delete from public.trade_flows where exporter_id is not null;
  end if;
  exception when others then raise warning 'tick %: trade-ledger reset failed — %', v_tick, sqlerrm; end;
  -- National malaise (schema/125): each January, any headline stat under 9 costs the nation.
  -- Self-filters to January, so it's a no-op the other eleven months.
  begin perform public._resolve_national_malaise(v_tick);
  exception when others then raise warning 'tick %: national malaise failed — %', v_tick, sqlerrm; end;
  -- Vacant cabinet (schema/138): each January, a cabinet left with any empty seat costs the
  -- government a heart of Coalition Health. Self-filters to January, a no-op the other eleven months.
  begin perform public._resolve_vacant_cabinet(v_tick);
  exception when others then raise warning 'tick %: vacant-cabinet penalty failed — %', v_tick, sqlerrm; end;
  -- (An empty national-objectives agenda used to cost Party Popularity + Coalition Health here;
  -- that penalty was retired — setting no objectives now carries no yearly cost.)
  -- Passive Per-Year modifier effects (schema/70): each January, a modifier's yearly stat nudges
  -- land. Self-filters to January.
  begin perform public._apply_modifier_year_effects(v_tick);
  exception when others then raise warning 'tick %: per-year modifier effects failed — %', v_tick, sqlerrm; end;
  -- Military builds (schema/129): every tick, matured Expand orders deliver typed units to bases.
  begin perform public._resolve_military_builds(v_tick);
  exception when others then raise warning 'tick %: military builds failed — %', v_tick, sqlerrm; end;
  -- International organizations (schema/197): every active org accrues +0.5 Cohesion this tick (cap 100).
  begin perform public._org_cohesion_tick();
  exception when others then raise warning 'tick %: org cohesion accrual failed — %', v_tick, sqlerrm; end;
  -- Membership applications (schema/198): a pending application older than 6 ticks auto-fails (expires).
  begin perform public._org_expire_applications();
  exception when others then raise warning 'tick %: org application expiry failed — %', v_tick, sqlerrm; end;
  -- Cult of Personality (schema/201): autocracies accrue propaganda spending (if Press Freedom is low)
  -- and the stock decays 0.2 this tick.
  begin perform public._nation_cult_tick();
  exception when others then raise warning 'tick %: cult-of-personality tick failed — %', v_tick, sqlerrm; end;
  -- Government Default headlines (schema/202): fire the 30/50/70/80/90/100 threshold events as a nation's
  -- debt-to-GDP climbs (re-arming on recovery); at 100 the nation defaults, with the debt haircut and the
  -- economic/political fallout enumerated in schema/202 (the one source). Runs after this tick's debt
  -- moves (budget balance, interest) have settled.
  begin perform public._nation_govt_default_events(v_tick);
  exception when others then raise warning 'tick %: government-default events failed — %', v_tick, sqlerrm; end;
  -- Regime is the sole switch between one-party and multiparty. This tick's economics
  -- may have eroded a nation's regime to 1–4 or lifted it back to 5+, so reconcile every
  -- nation's ruling_party with its regime (schema/98) BEFORE elections read it — a nation
  -- that just turned one-party then holds a Party Congress instead of an election.
  for v_n in select id from public.nations loop
    begin perform public._sync_one_party_state(v_n);
    exception when others then raise warning 'tick %: party-state sync failed for nation % — %', v_tick, v_n, sqlerrm; end;
  end loop;
  for v_n in
    select id from public.nations
     where next_election_tick is not null and next_election_tick <= v_tick
       and not coalesce(dormant, false)   -- dormant nations don't hold elections until activated
  loop
    begin perform public.resolve_election(v_n); v_count := v_count + 1;
    exception when others then raise warning 'tick %: election failed for nation % — %', v_tick, v_n, sqlerrm; end;
  end loop;
  -- Coalition governments (schema/164): re-derive each multiparty nation's governing
  -- coalition from the assembly's live votes and (re)seat the winner when its
  -- membership changes. Runs right after elections so it reads this tick's freshly
  -- allocated seats. Isolated — a failure warns and never aborts the tick.
  begin perform public._resolve_coalitions(v_tick);
  exception when others then raise warning 'tick %: coalition resolution failed — %', v_tick, sqlerrm; end;
  -- COIN card claims (schema/207): resolve each nation's claimed Active Cards in Tempo order — fire the
  -- events, bank AP, spend Tempo, cycle used cards. Isolated — a failure warns and never aborts the tick.
  begin perform public._resolve_card_claims(v_tick);
  exception when others then raise warning 'tick %: card-claim resolution failed — %', v_tick, sqlerrm; end;
  -- Auto-apply any triggered National Modifier: a modifier with start conditions "fires off"
  -- on every non-dormant nation that now meets them all (schema/70). Runs before the lift so a
  -- nation that both qualifies and has met the end conditions ends up without it.
  begin perform public._apply_modifier_triggers(v_tick);
  exception when others then raise warning 'tick %: modifier triggers failed — %', v_tick, sqlerrm; end;
  -- Fire any dormant-card activation whose delay has elapsed (schema/184) — the card enters its deck now.
  begin perform public._process_card_activations(v_tick);
  exception when others then raise warning 'tick %: card activations failed — %', v_tick, sqlerrm; end;
  -- Lift any assigned National Modifier whose end conditions are all met (schema/70).
  delete from public.nation_modifiers nm
   where public._modifier_end_met(nm.modifier_id, nm.nation_id, nm.since_tick, v_tick);
  -- Purge card-minted modifier DEFINITIONS (schema/176 timed boosts) once they carry no assignment —
  -- their nation_modifiers row was just lifted above. Admin-authored modifiers (source is null) are
  -- never touched. Keeps the modifier list from growing every time a production card is played.
  delete from public.national_modifiers m
   where m.source = 'card'
     and not exists (select 1 from public.nation_modifiers nm where nm.modifier_id = m.id);
  -- Agenda items whose scheduled month has arrived reach the floor automatically
  -- (schema/81). opened_tick starts their 6-tick window; scheduled_tick is cleared.
  -- Isolated like every other tick step — the event text must NEVER be able to abort the whole tick.
  begin
    with promoted as (
      update public.proposals set status = 'voting', opened_tick = v_tick, scheduled_tick = null
       where status = 'agenda' and scheduled_tick is not null and scheduled_tick <= v_tick
      returning nation_id, party_id, title
    )
    insert into public.events (nation_id, party_id, kind, body, game_date)
      select nation_id, party_id, 'declaration',
             'A measure has reached the floor in the ' || public._legislature_of(nation_id) || ': ' || title || '.', public.current_game_date()
      from promoted;
  exception when others then raise warning 'tick %: floor promotion failed — %', v_tick, sqlerrm; end;
  -- Floor measures resolve now if they have stood their full 6-tick window OR their outcome is
  -- already locked by an outright chamber majority (_proposal_locked, schema/81) — the latter
  -- resolves on this next tick instead of lingering. A simple majority of the seats cast (Aye >
  -- Nay) carries a window-closed measure, otherwise it falls (schema/81); each is resolved
  -- individually so a passing measure applies its effects. A measure whose window was cut short
  -- by the lock skips the absent-from-the-floor penalty (p_penalize=false).
  for v_rec in
    select id, ((v_tick - opened_tick) >= 6) as window_closed from public.proposals
     where status = 'voting' and opened_tick is not null
       and ((v_tick - opened_tick) >= 6 or public._proposal_locked(id))
  loop
    begin perform public._resolve_proposal(v_rec.id, true, v_rec.window_closed);
    exception when others then raise warning 'tick %: proposal % failed — %', v_tick, v_rec.id, sqlerrm; end;
  end loop;
  -- Committee bills (schema/154) that have sat 6 ticks without being pushed to the floor expire.
  begin perform public._expire_committee(v_tick);
  exception when others then raise warning 'tick %: committee expiry failed — %', v_tick, sqlerrm; end;
  -- Passed laws whose implementation time has come now flip the policy + land their effects (schema/155).
  begin perform public._implement_laws(v_tick);
  exception when others then raise warning 'tick %: law implementation failed — %', v_tick, sqlerrm; end;
  -- Crises (schema/99): fire any whose triggers are now all true, then climb each active
  -- crisis's meter and escalate stages. Runs last, on this tick's settled stats; its own
  -- per-nation / per-crisis isolation lives inside _apply_crisis_tick.
  begin perform public._apply_crisis_tick(v_tick);
  exception when others then raise warning 'tick %: crises failed — %', v_tick, sqlerrm; end;
  -- Minority-government confidence decay (schema/104) is RETIRED with Government Confidence.
  -- Coalition Health (schema/125/138/139/165) is now the sole government-stability gauge.
  -- World Events (schema/100): resolve any Competitive contest whose 3-tick sealed-bid window
  -- has closed (those where everyone bid early already resolved on the final bid). Isolated.
  begin perform public._resolve_overdue_world_events(v_tick);
  exception when others then raise warning 'tick %: world events failed — %', v_tick, sqlerrm; end;
  -- Seeded events (schema/136): on even calendar months, fire one random seeded world event
  -- from the admin's pool. Isolated so a bad definition can't abort the rest of the tick.
  begin perform public._fire_seeded_world_event(v_tick);
  exception when others then raise warning 'tick %: seeded event failed — %', v_tick, sqlerrm; end;
  -- Corporations (schema/47): release queued firms when their nation's climate is healthy
  -- (applies the sector bonus), compound each placed firm's cash by its growth, and fold
  -- insolvent private firms (reversing their bonus). Runs on this tick's settled economy.
  begin perform public._apply_corp_tick();
  exception when others then raise warning 'tick %: corporations failed — %', v_tick, sqlerrm; end;
  -- Debt→inflation backlog close-out: every $5B of debt ADDED this tick commits 0.2% inflation
  -- to the nation's pending pool (economy.inflation_pending); the pool then releases at most
  -- 0.2%/tick into actual inflation (clamped 0..100). 100B added → 4% that bleeds in over ~20
  -- ticks. Paying debt DOWN doesn't un-commit the pool — only net additions feed it. Runs last,
  -- after every debt-moving step (income, policy, crises).
  begin
    with base as (
      select n.id,
             coalesce((n.economy->>'inflation')::numeric, 0) as infl,
             round(coalesce((n.economy->>'inflation_pending')::numeric, 0)
                   + greatest(0, coalesce((n.economy->>'debt')::numeric, 0) - d.debt0) / 5 * 0.2, 2) as pend
      from public.nations n join _tick_debt0 d on d.id = n.id
    ), calc as (
      select id, infl, pend, least(0.2, pend) as rel from base   -- rel: inflation released this tick
    )
    update public.nations n
       set economy = jsonb_set(
             jsonb_set(n.economy, '{inflation}', to_jsonb(least(100, round(c.infl + c.rel, 2)))),
             '{inflation_pending}', to_jsonb(round(c.pend - c.rel, 2)))
      from calc c
     where c.id = n.id and c.pend > 0;
  exception when others then raise warning 'tick %: debt→inflation backlog failed — %', v_tick, sqlerrm; end;
  -- National-modifier bounds (schema/70): the FINAL stat step — clamp every bounded stat /
  -- resource to its active floor/ceiling, after all the moves above have settled, so a bound
  -- is the last word each tick. Isolated like every other step.
  begin perform public._apply_modifier_bounds();
  exception when others then raise warning 'tick %: modifier bounds failed — %', v_tick, sqlerrm; end;
  -- National Initiatives (schema/141): drain each active initiative's monthly cost and land the
  -- production raise on the ones that complete this tick — BEFORE the ceiling clamp below, so a
  -- completion's output gain is capped the same tick rather than overshooting for one month.
  begin perform public._advance_initiatives(v_tick);
  exception when others then raise warning 'tick %: initiatives failed — %', v_tick, sqlerrm; end;
  -- Per-nation production ceilings (schema/113): clamp energy/food/minerals output to each nation's
  -- authored ceiling, right after the modifier bounds so the tighter of the two caps holds.
  begin perform public._apply_production_ceilings();
  exception when others then raise warning 'tick %: production ceilings failed — %', v_tick, sqlerrm; end;
  -- Party popularity vs its effective ceiling (schema/130): a party that climbed to its ceiling
  -- and then had a same-archetype rival appear (crowding −2) would sit above the new ceiling —
  -- clamp it back down, so popularity never displays above the reach it actually has.
  begin perform public._reconcile_party_ceilings();
  exception when others then raise warning 'tick %: party ceiling reconcile failed — %', v_tick, sqlerrm; end;
  -- Inactivity purge (schema/97): delete parties idle past the deletion window (their politicians
  -- cascade, the nation slot frees up). Wall-clock, so it fires on whichever tick crosses 21 days.
  begin perform public._purge_inactive_parties();
  exception when others then raise warning 'tick %: inactive purge failed — %', v_tick, sqlerrm; end;
  -- Headline thresholds (schema/158): after the tick's stats settle, any nation whose stat crosses a
  -- threshold rule prints slanted headlines. Late in the tick so it reads final values; cooldown-guarded.
  begin perform public._resolve_headline_thresholds(v_tick);
  exception when others then raise warning 'tick %: headline thresholds failed — %', v_tick, sqlerrm; end;
  -- Ideology approval winds (schema/233): each OPPOSITION party's declared ideology nudges its
  -- Party Popularity by the nation's live conditions (bump/drop stats vs. the neutral band). Runs
  -- right before the snapshot so the trend captures it; governing/undeclared parties untouched.
  begin perform public._apply_ideology_winds();
  exception when others then raise warning 'tick %: ideology winds failed — %', v_tick, sqlerrm; end;
  -- Party popularity snapshot (schema/147): the FINAL step — record each surviving party's
  -- settled popularity for this tick, so the Nation dashboard can draw a real approval trend.
  -- After the purge, so parties deleted this tick aren't snapshotted. Isolated like every step.
  begin perform public._snapshot_party_popularity(v_tick);
  exception when others then raise warning 'tick %: popularity snapshot failed — %', v_tick, sqlerrm; end;
  -- Nation stat snapshot (schema/162): record each nation's settled live Growth this tick, so the
  -- Growth page can draw a real trend. Also final (reads settled stats); isolated like every step.
  begin perform public._snapshot_nation_stats(v_tick);
  exception when others then raise warning 'tick %: nation stat snapshot failed — %', v_tick, sqlerrm; end;
  return jsonb_build_object('tick', v_tick, 'elections_resolved', v_count);
end $$;
revoke all on function public._advance_tick() from public, anon, authenticated;

notify pgrst, 'reload schema';
