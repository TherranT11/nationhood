-- ===========================================================================
-- 218 · Tempo Track — top-2 initiative, idle drop, and the 2-miss pin.
--
-- Reworks the per-turn re-sort (schema/207 _resolve_card_claims). New rules:
--   • Runs for EVERY non-dormant nation each tick — the order updates every turn, even a quiet one
--     (207 skipped nations where nobody claimed, so the track sat still).
--   • Only the TOP 2 (highest tempo) are "on the clock". A top-2 party that doesn't act drops to the
--     back — the 1st (rank 1) to LAST, the 2nd (rank 2) to second-to-last. Ranks 3+ that don't act keep
--     their place (they weren't up; they rotate toward the front as the top 2 drop).
--   • A per-party miss streak (parties.tempo_miss): a top-2 idle party gets miss 1 and drops; if it's
--     idle AGAIN the next turn (still miss ≥ 1) it gets miss 2 and is PINNED to the very back, skipped
--     until it finally claims something. Any claim (event/ap/both/pass — even a blocked attempt) resets
--     the streak to 0.
-- The claim effects / AP banking / card cycling are unchanged from 207 (one source). Depends on:
-- 206/207, 172/174, 176/178/179, 187, 05. Idempotent. Apply after 207, then re-apply nothing else.
-- ===========================================================================

set check_function_bodies = off;

-- Consecutive-idle streak for the Tempo Track. 0 = acted/fresh; 1 = dropped from the top 2; 2 = pinned.
alter table public.parties add column if not exists tempo_miss int not null default 0;

create or replace function public._resolve_card_claims(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_nat record; v_party record;
  v_a uuid[]; v_ev_by jsonb; v_ap_by jsonb; v_excl jsonb; v_used uuid[];
  v_min int; v_max int; v_last int; v_first int;
  v_def jsonb; v_acts int; v_grant boolean; v_card uuid;
  v_rank int; v_drop1 uuid; v_drop2 uuid; v_pinned uuid[];
begin
  -- Every non-dormant nation, every tick — so the order re-sorts even when nobody claimed.
  for v_nat in select id from public.nations n where not coalesce(n.dormant, false) loop
    select coalesce(min(tempo), 0), coalesce(max(tempo), 0) into v_min, v_max
      from public.parties where nation_id = v_nat.id;
    v_last := v_min - 1; v_first := v_max + 1;
    v_ev_by := '{}'::jsonb; v_ap_by := '{}'::jsonb; v_excl := '{}'::jsonb; v_used := '{}';
    v_a := array(select public._active_cards(v_nat.id));
    v_rank := 0; v_drop1 := null; v_drop2 := null; v_pinned := '{}';

    for v_party in
      select p.id, p.name, coalesce(p.tempo_miss, 0) as miss, cc.action, cc.deck_card_id
        from public.parties p
        left join public.card_claims cc on cc.party_id = p.id and cc.tick = p_tick
       where p.nation_id = v_nat.id
       order by p.tempo desc, p.id
    loop
      v_rank := v_rank + 1;

      -- IDLE (no claim this turn).
      if v_party.action is null then
        if v_party.miss >= 1 then
          -- Idle again after already dropping → pinned to the very back until it acts.
          update public.parties set tempo_miss = 2 where id = v_party.id;
          v_pinned := array_append(v_pinned, v_party.id);
        elsif v_rank <= 2 then
          -- On the clock (top 2) and idle → drop to the back. 1st → last, 2nd → second-to-last.
          update public.parties set tempo_miss = 1 where id = v_party.id;
          if v_rank = 1 then v_drop1 := v_party.id; else v_drop2 := v_party.id; end if;
        end if;
        -- rank 3+ with miss 0: not on the clock — keep tempo + streak untouched.
        continue;
      end if;

      -- Any claim means the party acted → clear its idle streak.
      update public.parties set tempo_miss = 0 where id = v_party.id;

      -- Pass → first.
      if v_party.action = 'pass' then
        update public.parties set tempo = v_first where id = v_party.id; continue;
      end if;

      v_card := v_party.deck_card_id;
      v_grant := false;
      if v_card = any(v_a) and not (v_excl ? v_card::text) then
        if    v_party.action = 'both'  then v_grant := not (v_ev_by ? v_card::text) and not (v_ap_by ? v_card::text);
        elsif v_party.action = 'event' then v_grant := not (v_ev_by ? v_card::text);
        elsif v_party.action = 'ap'    then v_grant := not (v_ap_by ? v_card::text);
        end if;
      end if;

      -- Blocked (card gone / slot taken by a higher-Tempo party): it TRIED to act, so no idle drop —
      -- just a small Tempo nudge so a failed grab isn't free.
      if not v_grant then
        update public.parties set tempo = tempo - 3 where id = v_party.id; continue;
      end if;

      select definition into v_def from public.cards c join public.deck_cards dc on dc.card_id = c.id where dc.id = v_card;
      v_acts := greatest(1, least(10, coalesce((v_def->>'acts')::int, 1)));

      -- Event (or both): fire through card_play's own path (one source). KNOWN LIMITATION (from 207): a
      -- claim carries no hex/target pick, so a card needing one fires only its non-targeted effects.
      if v_party.action in ('event', 'both') then
        if coalesce(v_def->>'persistV', 'no') = 'yes' then
          perform public._mint_card_modifier(v_nat.id, v_party.id, v_def, p_tick);
        else
          perform public._resolve_card_effects(v_nat.id, v_party.id, null, null, null, null, null, v_def, p_tick);
          perform public._create_card_decision(v_nat.id, v_party.id, v_card, v_def, p_tick);
        end if;
        v_ev_by := v_ev_by || jsonb_build_object(v_card::text, v_party.id);
        if v_party.action = 'both' then v_excl := v_excl || jsonb_build_object(v_card::text, v_party.id); end if;
      end if;

      -- AP (or both): bank the card's AP — minus 1 for a lone AP-take that shares the card with an event.
      if v_party.action in ('ap', 'both') then
        if v_party.action = 'ap' and (v_ev_by ? v_card::text) then v_acts := greatest(1, v_acts - 1); end if;
        update public.parties set action_points = action_points + v_acts, card_ap = card_ap + v_acts where id = v_party.id;
        v_ap_by := v_ap_by || jsonb_build_object(v_card::text, v_party.id);
      end if;

      -- Tempo cost: both → back; event −5; ap −3.
      if    v_party.action = 'both'  then update public.parties set tempo = v_last where id = v_party.id; v_last := v_last - 1;
      elsif v_party.action = 'event' then update public.parties set tempo = tempo - 5 where id = v_party.id;
      else                                update public.parties set tempo = tempo - 3 where id = v_party.id;
      end if;

      if not (v_card = any(v_used)) then v_used := array_append(v_used, v_card); end if;

      insert into public.events (nation_id, party_id, kind, body, game_date)
        values (v_nat.id, v_party.id, 'card',
          'The ' || public._bare_party(v_party.name) || ' claimed '
          || case v_party.action when 'event' then 'the event on' when 'ap' then 'Action Points from' else 'the whole of' end
          || ' ' || coalesce(v_def->>'name', 'a card') || '.', public.current_game_date());
    end loop;

    -- Send the idle top-2 to the back: rank 2 first, then rank 1 below it (so 1st is truly last),
    -- then the newly-pinned below both. Continues the same v_last counter the 'both' claims used.
    if v_drop2 is not null then update public.parties set tempo = v_last where id = v_drop2; v_last := v_last - 1; end if;
    if v_drop1 is not null then update public.parties set tempo = v_last where id = v_drop1; v_last := v_last - 1; end if;
    foreach v_card in array v_pinned loop update public.parties set tempo = v_last where id = v_card; v_last := v_last - 1; end loop;

    -- Cycle every used Active Card back into the deck, then top the block back up.
    foreach v_card in array v_used loop perform public._card_return_to_deck(v_card); end loop;
    if array_length(v_used, 1) is not null then perform public._refill_card_block(v_nat.id); end if;

    delete from public.card_claims where nation_id = v_nat.id and tick = p_tick;
  end loop;
end $$;
revoke all on function public._resolve_card_claims(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
