-- ===========================================================================
-- 215 · Stat-change headlines — one random paper covers it, not the whole press.
--
-- A THRESHOLD rule (a stat crossing, schema/158) used to make EVERY outlet print its slant's variant,
-- so all five papers ran the same story at once. A stat crossing is minor news — now a single, randomly
-- chosen outlet picks it up (printing its own slant's take). EVENT rules are unchanged: a coup or a
-- default is big news, so every paper still weighs in (schema/157).
--
-- Adds a p_single flag to _publish_rule_headlines (the ONE publish path, shared by both engines); the
-- threshold sweep passes true, the event engine keeps the default (false = all papers). Depends on:
-- 156/157 (news_outlets, headline_rules, _publish_rule_headlines), 158 (_resolve_headline_thresholds).
-- Idempotent. Apply AFTER 158.
-- ===========================================================================

set check_function_bodies = off;

-- Old 4-arg signature must go before the 5-arg-with-default is created (else 4-arg calls are ambiguous).
drop function if exists public._publish_rule_headlines(text, public.headline_rules, numeric, text);

create or replace function public._publish_rule_headlines(
  p_nation text, p_rule public.headline_rules, p_value numeric default null, p_subject text default null,
  p_single boolean default false)
returns int language plpgsql security definer set search_path = public as $$
declare v_tick int; v_o record; v_txt text; v_variant text; v_i int := 0; v_pub int := 0;
begin
  select current_tick into v_tick from public.game_state where id;
  for v_o in
    select * from public.news_outlets where nation_id = p_nation
    -- p_single: ONE random paper covers it. Otherwise every outlet, in stable order (keeps the
    -- neutral n1/n2/n3 rotation deterministic across the papers).
    order by case when p_single then random() else 0 end, created_at
    limit case when p_single then 1 else null end
  loop
    if p_rule.headline_mode = 'neutral' then
      v_variant := (array['n1','n2','n3'])[case when p_single then floor(random() * 3)::int + 1 else (v_i % 3) + 1 end];
    else v_variant := v_o.slant; end if;
    v_txt := public._headline_fill(nullif(btrim(coalesce(p_rule.headlines->>v_variant, '')), ''), p_nation, p_value, p_subject);
    -- fall back to a written variant if this slant is blank, so the chosen paper is never left silent
    if v_txt is null then
      v_txt := public._headline_fill(nullif(btrim(coalesce(p_rule.headlines->>'record',
                 p_rule.headlines->>'centre', p_rule.headlines->>'n1', '')), ''), p_nation, p_value, p_subject);
    end if;
    if v_txt is not null then
      insert into public.news_headlines (nation_id, outlet_id, paper, slant, color, mono, logo, headline, game_date, tick, rule_id)
        values (p_nation, v_o.id, v_o.name, v_o.slant, v_o.color, v_o.mono, v_o.img, v_txt, public.current_game_date(), v_tick, p_rule.id);
      v_pub := v_pub + 1;
    end if;
    v_i := v_i + 1;
  end loop;
  return v_pub;
end $$;
revoke all on function public._publish_rule_headlines(text, public.headline_rules, numeric, text, boolean) from public, anon, authenticated;

-- The threshold sweep now publishes via the single-paper path (only the fire call changes from 158).
create or replace function public._resolve_headline_thresholds(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare n record; r public.headline_rules%rowtype; v_val numeric; v_cond boolean; v_fired text[]; v_key text; v_since int;
begin
  for n in select id, stats, economy, ministry_stats, on_hand, production from public.nations where not coalesce(dormant, false) loop
    v_fired := array[]::text[];
    for r in
      select hr.* from public.headline_rules hr
       where hr.enabled and hr.trigger_type = 'threshold'
         and (hr.scope = 'global' or (hr.scope = 'nation' and hr.nation_id = n.id))
       order by hr.priority desc, hr.created_at desc
    loop
      v_val := public._headline_subject_value(n.stats, n.economy, n.ministry_stats, n.on_hand, n.production, n.id, r.subject_type, r.subject);
      v_cond := v_val is not null
                and ((r.direction = 'above' and v_val > r.value) or (r.direction = 'below' and v_val < r.value));
      if coalesce(r.held, 0) > 0 then
        if v_cond then
          insert into public.headline_threshold_state (rule_id, nation_id, since_tick)
            values (r.id, n.id, p_tick) on conflict (rule_id, nation_id) do nothing;
        else
          delete from public.headline_threshold_state where rule_id = r.id and nation_id = n.id;
        end if;
      end if;
      if not v_cond then continue; end if;
      if coalesce(r.held, 0) > 0 then
        select since_tick into v_since from public.headline_threshold_state where rule_id = r.id and nation_id = n.id;
        if v_since is null or (p_tick - v_since) < r.held then continue; end if;
      end if;
      v_key := coalesce(r.subject_type, 'stat') || '|' || coalesce(r.subject, '');
      if v_key = any(v_fired) then continue; end if;
      if r.fire_once and exists (select 1 from public.news_headlines h where h.rule_id = r.id and h.nation_id = n.id) then continue; end if;
      if exists (select 1 from public.news_headlines h where h.rule_id = r.id and h.nation_id = n.id
                   and coalesce(h.tick, -2147483647) > coalesce(p_tick, 0) - coalesce(r.cooldown, 0)) then continue; end if;
      -- ONE random paper covers the crossing (p_single => true).
      if public._publish_rule_headlines(n.id, r, v_val, r.subject, true) > 0 then
        v_fired := v_fired || v_key;
      end if;
    end loop;
  end loop;
end $$;
revoke all on function public._resolve_headline_thresholds(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
