-- ===========================================================================
-- 267 · self_campaign card effect + organic card-play feed lines.
--
-- Two fixes for cards played as events (e.g. "National Campaign"):
--   1. NEW effect kind `self_campaign` — the PLAYING party gains X national approval (parties.popularity,
--      the number the Party Approval container shows), and writes an organic feed line:
--         "The {party} has run a spirited national campaign across the nation to boost their image."
--      Unlike hex_pop (a territory's standing) or party_gain (a rival), this raises the player's OWN
--      whole-nation approval — no target/hex to pick. Lives in the one effect engine so it fires the
--      same on a tempo claim AND a direct play.
--   2. Drop the robotic "The {party} claimed the whole of {card}" line for EVENT/BOTH plays — the card's
--      own effect narrates instead (self_campaign, hex_pop, …). 'ap' keeps a line (it banks Action
--      Points, no effect to speak for it), reworded.
--
-- Redefine of _resolve_card_effects (body verbatim from 176) + the self_campaign branch, and of
-- _apply_card_claim (body verbatim from 266) + the feed-line change.
-- Depends on: 176 (_resolve_card_effects), 153 (_apply_party_effect), 187 (_bare_party), 266
-- (_apply_card_claim). Apply after 266. Idempotent.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public._resolve_card_effects(p_nation text, p_party uuid, p_target uuid, p_q int, p_r int, p_corp uuid, p_corp2 uuid, p_def jsonb, p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare e jsonb; v_x numeric; v_old numeric; v_new numeric; v_pop numeric; v_stand numeric; v_hexname text; v_pname text; v_tname text;
begin
  if coalesce(p_def->>'mech', 'oneoff') = 'oneoff' then
    for e in select value from jsonb_array_elements(coalesce(p_def->'fx', '[]'::jsonb)) loop
      if public._card_side_fires(p_def, e->>'side') then
        v_x := coalesce(public._to_num(e->'p'->>'x'), 0);
        if e->>'kind' = 'hex_pop' then
          -- Narrate the campaign. Standing in a hex = national popularity + hex bias, floored at 0 (the
          -- same rule hex elections use, schema/181). Report the ACTUAL move (new − old bias), which is
          -- what the ±40 cap allowed, not the raw x.
          select name into v_hexname from public.world_hexes where nation_id = p_nation and q = p_q and r = p_r;
          if p_target is not null then   -- a rival loses standing here
            v_old := coalesce((select bias from public.party_hex_bias where party_id = p_target and q = p_q and r = p_r), 0);
            perform public._apply_card_hex(p_target, p_nation, p_q, p_r, -v_x);
            v_new := coalesce((select bias from public.party_hex_bias where party_id = p_target and q = p_q and r = p_r), 0);
            select coalesce(popularity, 0), name into v_pop, v_tname from public.parties where id = p_target;
            select name into v_pname from public.parties where id = p_party;
            v_stand := greatest(0, v_pop + v_new);
            insert into public.events (nation_id, party_id, kind, body, game_date) values
              (p_nation, p_party, 'party',
               v_pname || ' has campaigned against ' || coalesce(v_tname, 'a rival') || ' in ' || coalesce(v_hexname, 'a territory') ||
               ', cutting their popularity by ' || round(v_old - v_new) || '% down to ' || round(v_stand) || '%.',
               public.current_game_date());
          else                           -- the player raises their own standing here
            v_old := coalesce((select bias from public.party_hex_bias where party_id = p_party and q = p_q and r = p_r), 0);
            perform public._apply_card_hex(p_party, p_nation, p_q, p_r, v_x);
            v_new := coalesce((select bias from public.party_hex_bias where party_id = p_party and q = p_q and r = p_r), 0);
            select coalesce(popularity, 0), name into v_pop, v_pname from public.parties where id = p_party;
            v_stand := greatest(0, v_pop + v_new);
            insert into public.events (nation_id, party_id, kind, body, game_date) values
              (p_nation, p_party, 'party',
               v_pname || ' has conducted a national campaign in ' || coalesce(v_hexname, 'a territory') ||
               ', raising their popularity by ' || round(v_new - v_old) || '% up to ' || round(v_stand) || '%.',
               public.current_game_date());
          end if;
        elsif e->>'kind' = 'self_campaign' then
          -- The playing party runs a national campaign — raises its OWN whole-nation approval (no target).
          perform public._apply_party_effect(p_party, p_nation, jsonb_build_object('t', 'Party Popularity', 'v', v_x));
          select name into v_pname from public.parties where id = p_party;
          insert into public.events (nation_id, party_id, kind, body, game_date) values
            (p_nation, p_party, 'party',
             'The ' || public._bare_party(coalesce(v_pname, 'party')) || ' has run a spirited national campaign across the nation to boost their image.',
             public.current_game_date());
        elsif e->>'kind' = 'hex_el' then
          perform public.hex_election_resolve(p_nation, p_q, p_r, p_party, p_tick);   -- reapportion the chosen hex
        -- Corporate effects act on the firm(s) chosen on play (schema/185). grow/shrink use one firm;
        -- acquire uses two; create founds a state firm from authored sector + name (no pick).
        elsif e->>'kind' = 'corp_grow' then   perform public._card_corp_growth(p_corp,  v_x::int);
        elsif e->>'kind' = 'corp_shrink' then perform public._card_corp_growth(p_corp, (-v_x)::int);
        elsif e->>'kind' = 'corp_acquire' then perform public._card_corp_acquire(p_corp, p_corp2);
        elsif e->>'kind' = 'corp_create' then perform public._card_create_so_corp(p_nation, e->'p'->>'sector', e->'p'->>'name');
        else
          perform public._apply_card_effect(p_nation, p_target, e->>'kind', e->'p', p_tick);   -- party effects hit the chosen target
        end if;
      end if;
    end loop;
  end if;
end $$;
revoke all on function public._resolve_card_effects(text, uuid, uuid, int, int, uuid, uuid, jsonb, int) from public, anon, authenticated;

-- Redefine _apply_card_claim (body verbatim from 266) — the feed line for a claim now lets the card's
-- own effect narrate on EVENT/BOTH; only 'ap' (which fires no effect) writes a line, reworded.
create or replace function public._apply_card_claim(p_nation text, p_party uuid, p_card uuid, p_action text, p_tick int, p_target uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_def jsonb; v_acts int; v_name text; v_min int;
begin
  select definition into v_def from public.cards c join public.deck_cards dc on dc.card_id = c.id where dc.id = p_card;
  v_acts := greatest(1, least(10, coalesce((v_def->>'acts')::int, 1)));   -- card AP, 1–10
  select name into v_name from public.parties where id = p_party;

  if p_action in ('event', 'both') then
    if coalesce(v_def->>'persistV', 'no') = 'yes' then
      perform public._mint_card_modifier(p_nation, p_party, v_def, p_tick);
    else
      perform public._resolve_card_effects(p_nation, p_party, p_target, null, null, null, null, v_def, p_tick);
      perform public._create_card_decision(p_nation, p_party, p_card, v_def, p_tick);
    end if;
  end if;

  if p_action in ('ap', 'both') then
    update public.parties set action_points = action_points + v_acts, card_ap = card_ap + v_acts where id = p_party;
  end if;

  if p_action = 'both' then
    select coalesce(min(tempo), 1) into v_min from public.parties where nation_id = p_nation;
    update public.parties set tempo = v_min - 1 where id = p_party;                 -- to the back
  elsif p_action = 'event' then update public.parties set tempo = tempo - 5 where id = p_party;
  else                          update public.parties set tempo = tempo - 3 where id = p_party;  -- ap
  end if;

  -- EVENT/BOTH: the card's own effect narrates (self_campaign, hex_pop, …) — no robotic "claimed" line.
  -- 'ap' fires no effect, so note the banked Action Points.
  if p_action = 'ap' then
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (p_nation, p_party, 'card',
        'The ' || public._bare_party(v_name) || ' banked Action Points from ' || coalesce(v_def->>'name', 'a card') || '.',
        public.current_game_date());
  end if;
end $$;
revoke all on function public._apply_card_claim(text, uuid, uuid, text, int, uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';
