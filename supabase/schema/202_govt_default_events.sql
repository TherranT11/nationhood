-- ===========================================================================
-- 202 · Government Default threshold events + the default itself.
--
-- Six headlines fire as a nation's Government Default (schema/201) climbs past 30 / 50 / 70 / 80 / 90 /
-- 100. Default = debt% / 3, so each threshold is an exact debt-to-GDP level: 30→90%, 50→150%, 70→210%,
-- 80→240%, 90→270%, 100→300%. Each threshold fires ONCE on the way up and RE-ARMS once the nation drops
-- back below it, so a second debt crisis years later prints the headlines again. The armed/fired set is
-- stored per nation in economy.gd_fired (a jsonb array of the thresholds currently held).
--
-- At 100 the nation actually DEFAULTS, with real consequences:
--   • Debt written down — creditors take the haircut — to the level where Default reads 80 AFTER the
--     recession below (so the tick settles at exactly 80, not back above it). This resets the clock.
--   • Recession: GDP −5%.
--   • Party fallout: every GOVERNING party −7% Party Popularity (blamed for the collapse); every
--     OPPOSITION party +5% (floor-respecting drop / ceiling-respecting raise, schema/70 movers).
--   • Growth −10 — a lasting scar that also drags GDP down in the annual malaise pass (schema/125).
--   • Recession stat hits: Unemployment +5, Poverty +4, Standard of Living −4 (the human cost).
--   • Standing hits: Prosperity −2 and Crime +2. [Order/Image are retired stats; Crime is the unrest
--     signal that replaced Order.]
--   All stat moves route through _apply_card_stat (schema/176) — the canonical, correctly-clamped
--   mover (real-backed stats vs the display delta layer).
--
-- Called once per tick from _advance_tick (schema/60), isolated so it can never abort the tick. A
-- one-time backfill seeds gd_fired with each nation's already-met thresholds so shipping this feature
-- doesn't retro-announce defaults for nations already deep in debt — only future crossings fire.
--
-- Depends on: 201 (_nation_govt_default), 176 (_apply_card_stat), 152 (_nation_policy_stat), 70 (_to_num),
-- 40 (events, current_game_date), 10 (nations). Idempotent.
-- ===========================================================================

create or replace function public._nation_govt_default_events(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare
  r          record;
  v_def      numeric;
  v_fired    jsonb;
  v_new      jsonb;
  v_t        numeric;
  v_thresh   int;
  v_body     text;
  v_tone     text;
  v_gdp      numeric;
  v_new_gdp  numeric;
  v_policy   numeric;
  v_new_debt numeric;
  v_name     text;
  v_thresholds int[] := array[30, 50, 70, 80, 90, 100];
begin
  for r in select id, name, gdp from public.nations where not coalesce(dormant, false) loop
    v_def := public._nation_govt_default(r.id);
    select coalesce(economy->'gd_fired', '[]'::jsonb) into v_fired from public.nations where id = r.id;

    -- Re-arm: keep only the previously-fired thresholds the nation is STILL at or above; the rest are
    -- cleared, so they can fire fresh on a later climb.
    v_new := '[]'::jsonb;
    for v_t in select value::numeric from jsonb_array_elements_text(v_fired) loop
      if v_def >= v_t then v_new := v_new || to_jsonb(v_t::int); end if;
    end loop;

    -- Fire every threshold now met that isn't already held (ascending, so the feed reads in order).
    foreach v_thresh in array v_thresholds loop
      if v_def >= v_thresh and not (v_new @> to_jsonb(v_thresh)) then
        v_name := coalesce(r.name, r.id);
        if v_thresh = 100 then
          v_body := 'Government debt in ' || v_name || ' has now reached 300% of GDP and the nation is defaulting on its debt.';
          v_tone := 'neg';
        elsif v_thresh = 30 then
          v_body := 'Government debt in ' || v_name || ' has climbed to 90% of GDP, a warning sign for the nation''s finances.';
          v_tone := 'warn';
        else
          v_body := 'Government debt in ' || v_name || ' has increased to ' || (v_thresh * 3)
                    || '% of GDP, putting the nation into a difficult position.';
          v_tone := 'warn';
        end if;
        -- Narrated in the body (effect_* left null), like organic events — no misleading "+100" pill.
        insert into public.events (nation_id, kind, body, game_date, tone)
          values (r.id, 'default', v_body, public.current_game_date(), v_tone);
        v_new := v_new || to_jsonb(v_thresh);

        -- The default itself: write down the debt, tip into recession, punish the government, and take
        -- the recession + standing stat hits.
        if v_thresh = 100 then
          v_gdp := coalesce(r.gdp, 0);
          if v_gdp > 0 then
            v_new_gdp  := round(v_gdp * 0.95, 2);                                            -- recession −5%
            v_policy   := coalesce(public._nation_policy_stat(r.id, 'Government Default'), 0);
            v_new_debt := greatest(0, round(v_new_gdp * 3 * (80 - v_policy) / 100.0, 2));     -- haircut → Default 80 post-recession
            update public.nations
               set gdp = v_new_gdp,
                   economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{debt}', to_jsonb(v_new_debt))
             where id = r.id;
          end if;
          -- Party fallout: the government is blamed, the opposition gains. Floor-respecting drop /
          -- ceiling-respecting raise (schema/70), matching the coalition-collapse penalty (schema/165).
          update public.parties p
             set popularity = public._clamp_pop(public._mod_floor_drop(r.id, p.archetype, p.popularity, p.popularity - 7))
           where p.nation_id = r.id and p.in_government;
          update public.parties p
             set popularity = public._mod_cap_raise(r.id, p.archetype, p.popularity, p.popularity + 5)
           where p.nation_id = r.id and not p.in_government;
          -- Stat fallout — all through _apply_card_stat (schema/176, correctly clamped):
          perform public._apply_card_stat(r.id, 'Growth',            -10);  -- lasting scar; also drags GDP in the annual pass
          perform public._apply_card_stat(r.id, 'Unemployment',        5);  -- recession throws people out of work
          perform public._apply_card_stat(r.id, 'Poverty',             4);
          perform public._apply_card_stat(r.id, 'Standard of Living',  -4);
          perform public._apply_card_stat(r.id, 'Prosperity',         -2);
          perform public._apply_card_stat(r.id, 'Crime',               2);
        end if;
      end if;
    end loop;

    -- Persist the held set (reads the CURRENT economy, so a haircut just applied is preserved).
    update public.nations
       set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{gd_fired}', v_new)
     where id = r.id;
  end loop;
end $$;
revoke all on function public._nation_govt_default_events(int) from public, anon, authenticated;

-- One-time backfill: seed gd_fired with each nation's currently-met thresholds so this feature ships
-- without retro-announcing defaults for nations already in debt. Idempotent — only sets the key where
-- it's absent, so a re-run and any live gd_fired the tick has since written are both preserved.
update public.nations n
   set economy = jsonb_set(coalesce(n.economy, '{}'::jsonb), '{gd_fired}',
         coalesce((select jsonb_agg(t order by t)
                     from unnest(array[30, 50, 70, 80, 90, 100]) t
                    where public._nation_govt_default(n.id) >= t), '[]'::jsonb))
 where not (coalesce(n.economy, '{}'::jsonb) ? 'gd_fired');

notify pgrst, 'reload schema';
