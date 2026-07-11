-- ===========================================================================
-- 179 · Persistent cards — Phase 3b-3: a Persistent card becomes a standing national modifier.
--
-- A card authored "∞ Persistent" (definition.persistV='yes') does NOT fire its effects once — its
-- stat effects become a per-tick national modifier (schema/70) that applies for as long as it's
-- attached (there is no end condition, so it stays). card_play routes to _mint_card_modifier for a
-- persistent card, and to the immediate engine (176) + decision queue (178) for a normal card.
--
-- The minted modifier reuses the existing machinery: national_modifiers + modifier_effects
-- ('stat_tick', per-tick delta) + nation_modifiers, applied each tick by _apply_modifier_tick_effects
-- (schema/70, run from advance_tick) and shown on the Nation page's modifier board (modifiers.js) —
-- so there is no new UI. Real/economy stats route to their columns; a display-grid stat (Crime,
-- Poverty, …) routes to the writable-stats delta layer (schema/175) via the extension below.
--
-- Depends on: 70 (modifiers, _apply_modifier_stat_effect), 175 (_nation_ministry_stat_add), 40/47
-- (_to_num, events), 174 (card_play). Idempotent.
-- ===========================================================================

-- Extend the modifier stat writer: real stats (prosperity/welfare/order/image/growth) and the two
-- economy stats route to their columns exactly as before (schema/70); anything else is a display-grid
-- stat and routes to stat_deltas (schema/175). Supersedes schema/70's version.
create or replace function public._apply_modifier_stat_effect(p_nation text, p_key text, p_value numeric)
returns void language plpgsql security definer set search_path = public as $$
declare v_econ boolean := p_key in ('unemployment', 'inflation');
        v_raw  boolean := p_key in ('prosperity', 'welfare', 'order', 'image', 'growth');
begin
  if v_econ or v_raw then
    perform public._nation_stat_add(p_nation, case when v_econ then 'economy' else 'stats' end,
              p_key, p_value, case when v_econ then 0 else 1 end, case when v_econ then 100 else 20 end);
  else
    perform public._nation_ministry_stat_add(p_nation, p_key, p_value);   -- a display-grid stat (Crime, Poverty, …)
  end if;
end $$;
revoke all on function public._apply_modifier_stat_effect(text, text, numeric) from public, anon, authenticated;

-- Mint a standing national modifier from a persistent card's stat effects. Each stat_up/stat_down
-- (generic → all; a stance card → its 'both'-sided effects) becomes a stat_tick effect: +x per tick
-- for stat_up, −x for stat_down. Real stats use their raw key; display stats keep their display name
-- (routed to the delta layer by the writer above). Public Debt is skipped (no stat_tick path to the
-- real treasury debt). If nothing persistable is authored, no modifier is left behind.
create or replace function public._mint_card_modifier(p_nation text, p_played_by uuid, p_def jsonb, p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare v_generic boolean; e jsonb; v_kind text; v_stat text; v_val numeric; v_key text; v_mid uuid; v_n int := 0; v_name text;
begin
  v_generic := (p_def->>'type' = 'generic');
  v_name    := coalesce(p_def->>'name', 'a card');
  insert into public.national_modifiers (name, description)
    values (v_name, nullif(p_def->>'desc', '')) returning id into v_mid;

  for e in select value from jsonb_array_elements(coalesce(p_def->'fx', '[]'::jsonb)) loop
    v_kind := e->>'kind';
    if v_kind not in ('stat_up', 'stat_down') then continue; end if;
    if not (v_generic or coalesce(e->>'side', 'both') = 'both') then continue; end if;
    v_stat := e->'p'->>'stat';
    if v_stat is null then continue; end if;
    v_val := coalesce(public._to_num(e->'p'->>'x'), 0) * case when v_kind = 'stat_down' then -1 else 1 end;
    if v_val = 0 then continue; end if;
    v_key := case v_stat
      when 'Growth'       then 'growth'
      when 'Prosperity'   then 'prosperity'
      when 'Rule of Law'  then 'order'
      when 'Unemployment' then 'unemployment'
      when 'Public Debt'  then null            -- no stat_tick path to the real debt → skip
      else v_stat end;                         -- display stats keep their name → stat_deltas
    if v_key is null then continue; end if;
    insert into public.modifier_effects (modifier_id, effect_type, effect_key, effect_value)
      values (v_mid, 'stat_tick', v_key, v_val);
    v_n := v_n + 1;
  end loop;

  if v_n = 0 then
    delete from public.national_modifiers where id = v_mid;   -- nothing persistable → leave no empty modifier
    return;
  end if;

  insert into public.nation_modifiers (nation_id, modifier_id, since_tick) values (p_nation, v_mid, p_tick);
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (p_nation, p_played_by, 'party', v_name || ' takes hold as a standing national modifier.', public.current_game_date());
end $$;
revoke all on function public._mint_card_modifier(text, uuid, jsonb, int) from public, anon, authenticated;

notify pgrst, 'reload schema';
