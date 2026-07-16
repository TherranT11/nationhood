-- ===========================================================================
-- 235 · Reformer stance passive — enacting a reform rewards the Technocrat rung.
--
-- A party sitting at the Technocrat rung (stance index 4, schema/234) earns +1% Party Popularity
-- whenever a reform is ENACTED (a kind='reform' bill advances) in its nation. This redefines
-- _apply_reform (schema/167) to add that one grant on the advance path; the body is otherwise
-- identical to schema/167. Depends on: 234 (parties.stance), 167 (_apply_reform), 40 (_clamp_pop).
-- Idempotent. Apply after 234.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public._apply_reform(p_nation text, p_dir text)
returns void language plpgsql security definer set search_path = public as $$
declare v_eco jsonb; v_type text; v_reform int; v_nname text; v_tick int; v_name text;
        v_converted boolean := false; v_backslid boolean := false;
begin
  select economy, name into v_eco, v_nname from public.nations where id = p_nation;
  if not found then return; end if;
  v_type := public._regime_type(v_eco);
  if v_type is null then return; end if;
  v_reform := public._regime_reform(v_eco);
  select current_tick into v_tick from public.game_state where id;

  if p_dir = 'advance' then
    if v_reform >= 15 then return; end if;                    -- track already complete
    v_name := public._reform_name(v_type, v_reform + 1);
    if v_reform + 1 >= 15 and v_type in ('autocracy', 'monarchy') then
      -- The final reform of an autocracy / monarchy is its Handover / Abolition: the old order
      -- gives way to a full democracy. _set_regime is the one type-flip writer.
      perform public._set_regime(p_nation, 'democracy', 9);
      perform public._sync_one_party_state(p_nation);         -- a one-party state becomes multiparty at once
      v_converted := true;
    else
      perform public._nation_stat_add(p_nation, 'economy', 'regime_reform', 1, 0, 15);
    end if;
  else  -- repeal
    if v_reform < 1 then
      -- Backslide: a democracy at the reform floor (Illiberal Democracy) that repeals its last
      -- protections collapses into a Competitive Autocracy (reform 9) — the mirror of the Handover.
      -- Only democracies can backslide; an autocracy/monarchy at reform 0 has nothing to repeal.
      if v_type <> 'democracy' then return; end if;
      perform public._set_regime(p_nation, 'autocracy', 9);
      perform public._sync_one_party_state(p_nation);
      v_backslid := true;
    else
      v_name := public._reform_name(v_type, v_reform);   -- repeal the topmost enacted reform
      perform public._nation_stat_add(p_nation, 'economy', 'regime_reform', -1, 0, 15);
    end if;
  end if;

  -- Reformer stance (schema/234): every party sitting at the Technocrat rung (stance index 4) earns
  -- +1% Party Popularity whenever a reform is ENACTED (advance only) in its nation. Ceiling retired.
  if p_dir = 'advance' then
    update public.parties p
       set popularity = public._clamp_pop(p.popularity + 1)
     where p.nation_id = p_nation and p.stance = 4;
  end if;

  -- Digestion lock: the chamber can't take up another reform for a few ticks.
  update public.nations
     set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{reform_lock_tick}',
                             to_jsonb(v_tick + public._reform_digestion_ticks()), true)
   where id = p_nation;

  insert into public.events (nation_id, kind, body, game_date)
    values (p_nation, 'government',
            case when v_converted
                 then v_nname || ' completed its reform track with ' || coalesce(v_name, 'the final reform')
                      || ' — the old order gives way to a full democracy.'
                 when v_backslid
                 then v_nname || ' has abolished the republic — its last democratic protections repealed, the nation collapses into an autocracy.'
                 when p_dir = 'advance'
                 then v_nname || ' enacted a reform: ' || coalesce(v_name, 'a constitutional change') || '.'
                 else v_nname || ' repealed a reform: ' || coalesce(v_name, 'a constitutional change') || '.' end,
            public.current_game_date());
end $$;
revoke all on function public._apply_reform(text, text) from public, anon, authenticated;

notify pgrst, 'reload schema';
