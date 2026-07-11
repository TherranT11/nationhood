-- ===========================================================================
-- 183 · Card bills — a 'bill' EFFECT (schema/176 vocabulary) seeds a real legislative bill in committee.
--
-- A bill effect carries its own name and two effect lists: `pass` (fire if the bill passes on the floor)
-- and `fail` (fire if it is voted down). It is authored inside a Government-Choice option or a
-- Double-Sided side; when that option is chosen (card_decide, schema/178) the bill is introduced by the
-- resolving party. _create_card_bill inserts a proposal with kind='card_bill' and status='committee', so
-- it flows through the EXISTING committee lifecycle (schema/154) — it sits 6 ticks, other parties
-- endorse/chat, the proposing party pushes it to the floor, and the floor vote resolves it. On resolution
-- _resolve_proposal (schema/81) calls _apply_bill_effects with the pass or fail list. A bill that expires
-- in committee (never pushed) is marked 'expired', never 'failed', so NEITHER list fires.
--
-- The effects are the same vocabulary the immediate engine / decisions use (_apply_card_effect,
-- schema/176), applied against the nation with the proposing party as the party target (so a
-- party_gain rewards the bill's sponsor). Hex-picked effects (hex_pop/hex_el) have no hex on a bill and
-- are no-ops — the card creator doesn't offer them for a bill.
--
-- Depends on: 81 (proposals, _resolve_proposal), 154 (committee lifecycle), 176 (_apply_card_effect),
-- 174 (card_play), 05 (game_state), 40 (events/current_game_date). Idempotent.
-- ===========================================================================

-- Apply an authored effect list against a nation (p_party is the party target — the bill's sponsor).
-- Reads the current tick for effects that need it (prod_up/prod_down, nat_el). A null / non-array list
-- is a no-op. Shares the immediate-effect dispatcher, so every card effect behaves as it does on play.
create or replace function public._apply_bill_effects(p_nation text, p_party uuid, p_effects jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare e jsonb; v_tick int;
begin
  if p_effects is null or jsonb_typeof(p_effects) <> 'array' then return; end if;
  select current_tick into v_tick from public.game_state where id;
  for e in select value from jsonb_array_elements(p_effects) loop
    perform public._apply_card_effect(p_nation, p_party, e->>'kind', e->'p', v_tick);
  end loop;
end $$;
revoke all on function public._apply_bill_effects(text, uuid, jsonb) from public, anon, authenticated;

-- Introduce a bill from a 'bill' effect's params ({name, pass[], fail[]}), sponsored by p_sponsor: a
-- proposal in committee (status='committee', opened_tick starts the 6-tick clock) whose payload snapshots
-- the pass/fail lists for _resolve_proposal to fire later. A no-op with no sponsor or no effects at all.
drop function if exists public._create_card_bill(text, uuid, jsonb, int);   -- param renamed p_played_by → p_sponsor
create or replace function public._create_card_bill(p_nation text, p_sponsor uuid, p_bill jsonb, p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text; v_pass jsonb; v_fail jsonb;
begin
  p_bill := coalesce(p_bill, '{}'::jsonb);
  if p_sponsor is null then return; end if;
  v_pass := case when jsonb_typeof(p_bill->'pass') = 'array' then p_bill->'pass' else '[]'::jsonb end;
  v_fail := case when jsonb_typeof(p_bill->'fail') = 'array' then p_bill->'fail' else '[]'::jsonb end;
  if jsonb_array_length(v_pass) = 0 and jsonb_array_length(v_fail) = 0 then return; end if;   -- empty bill → nothing to introduce
  v_name := coalesce(nullif(btrim(p_bill->>'name'), ''), 'a bill');
  insert into public.proposals (nation_id, party_id, kind, title, payload, status, opened_tick)
    values (p_nation, p_sponsor, 'card_bill', v_name,
            jsonb_build_object('pass', v_pass, 'fail', v_fail), 'committee', p_tick);
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (p_nation, p_sponsor, 'party', v_name || ' was introduced in committee.', public.current_game_date());
end $$;
revoke all on function public._create_card_bill(text, uuid, jsonb, int) from public, anon, authenticated;

notify pgrst, 'reload schema';
