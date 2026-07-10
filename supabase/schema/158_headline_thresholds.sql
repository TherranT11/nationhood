-- ===========================================================================
-- 158 · Headline thresholds — the stat-crossing trigger, now ACTIVE.
-- Depends on: 10 (nations), 05 (game_state), 47 (_nation_tax_burden), 70 (_to_num), 150
-- (ministry_stats), 156/157 (news_outlets, headline_rules, _publish_rule_headlines). After 157.
--
-- Each tick (from _advance_tick, schema/60) every live nation is checked against every enabled
-- threshold rule: when the subject stat is above/below the rule's value, the rule fires and each
-- paper prints its slant's variant ({value}/{subject} tokens filled). Cooldown + fire-once are read
-- off the fire history (news_headlines.rule_id), exactly like the event engine.
--
-- A rule fires on the stat's STORED value — the same 1..100 number the admin authors and the player
-- sees. The ministry-stat grid (nations.ministry_stats, schema/150) is the ONE source for every
-- ministry stat (Crime, Environment, Poverty, …); the legacy national/economy fields back it up for
-- the stats not carried there. Tax Burden is the derived rate (schema/47). Resource on-hand and
-- production read the stockpile/rate jsonb. 'rate' (change-per-year) needs prior-tick state and
-- stays dormant for now. The `held` (sustained-for) field IS enforced: a rule with held = N only fires
-- once its condition has stayed true for N straight ticks (tracked in headline_threshold_state; a break
-- resets the streak). The cooldown still governs how often a standing condition re-headlines.
-- ===========================================================================

-- Streak state for 'sustained for' (held) rules: the tick a rule's condition first became true for a
-- nation, kept while it stays true and deleted the moment it breaks. Internal engine state — RLS on
-- with no policy, so only the security-definer sweep (which bypasses RLS) ever touches it.
create table if not exists public.headline_threshold_state (
  rule_id    uuid not null references public.headline_rules (id) on delete cascade,
  nation_id  text not null references public.nations (id) on delete cascade,
  since_tick int  not null,
  primary key (rule_id, nation_id)
);
alter table public.headline_threshold_state enable row level security;

-- The numeric value of a rule's subject for one nation, or null when it isn't evaluable (a 'rate'
-- subject, an unauthored stat, or an unknown key). ONE source for "what is this stat right now" in the
-- headline engine — the stored value the admin authored, matching the Government page the player sees.
drop function if exists public._headline_subject_value(jsonb, jsonb, jsonb, jsonb, text, text, text);
create or replace function public._headline_subject_value(
  p_stats jsonb, p_economy jsonb, p_ministry jsonb, p_onhand jsonb, p_production jsonb,
  p_nation text, p_subject_type text, p_subject text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_st text := coalesce(p_subject_type, 'stat'); v_val numeric;
begin
  if p_subject is null then return null; end if;
  if v_st = 'onhand'     then return public._to_num(p_onhand->>lower(p_subject)); end if;
  if v_st = 'production'  then return public._to_num(p_production->>lower(p_subject)); end if;
  if v_st = 'rate'       then return null; end if;   -- change-per-year: not yet evaluated
  -- v_st = 'stat': the admin-authored ministry-stat value is the ONE 1..100 source (schema/150); the
  -- legacy national/economy fields back it up for the stats not carried there (and the consolidated
  -- five — Rule of Law lives on stats.order). An unauthored stat returns null → no headline.
  v_val := public._to_num(p_ministry->>p_subject);
  if v_val is not null then return v_val; end if;
  return case p_subject
    when 'Prosperity'   then public._to_num(p_stats->>'prosperity')
    when 'Welfare'      then public._to_num(p_stats->>'welfare')
    when 'Growth'       then public._to_num(p_stats->>'growth')
    when 'Order'        then public._to_num(p_stats->>'order')
    when 'Rule of Law'  then public._to_num(p_stats->>'order')   -- consolidated onto stats.order (schema/150)
    when 'Global Image' then public._to_num(p_stats->>'image')
    when 'Image'        then public._to_num(p_stats->>'image')
    when 'Inflation'    then public._to_num(p_economy->>'inflation')
    when 'Unemployment' then public._to_num(p_economy->>'unemployment')
    when 'Budget'       then public._to_num(p_economy->>'budget')
    when 'Debt'         then public._to_num(p_economy->>'debt')
    -- Debt as a % of GDP — the meaningful, nation-size-independent measure (a flat $ debt threshold
    -- fires for every big nation and no small one). Null when GDP is unknown/zero.
    when 'Debt to GDP'  then (select case when coalesce(n.gdp, 0) > 0
                                          then round(public._to_num(p_economy->>'debt') / n.gdp * 100, 1) end
                                from public.nations n where n.id = p_nation)
    when 'Income'       then public._to_num(p_economy->>'income')
    when 'Regime'       then public._regime_reform(p_economy)   -- reform level 0..15 (schema/166)
    when 'Tax Burden'   then public._nation_tax_burden(p_nation)
    else null
  end;
end $$;
revoke all on function public._headline_subject_value(jsonb, jsonb, jsonb, jsonb, jsonb, text, text, text) from public, anon, authenticated;

-- The per-tick threshold sweep. For each live nation, the enabled threshold rules are scanned in
-- priority order; the first satisfied, off-cooldown, not-fired-once rule PER SUBJECT fires (so two
-- rules on the same stat don't both print — the higher-priority one wins). Fires publish per-slant
-- via the shared _publish_rule_headlines, with the crossing value + subject feeding the tokens.
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
      -- 'Sustained for' (held): maintain the streak first, independent of whether the rule fires — start
      -- the clock when the condition turns true, clear it the moment it breaks (or can't be evaluated).
      if coalesce(r.held, 0) > 0 then
        if v_cond then
          insert into public.headline_threshold_state (rule_id, nation_id, since_tick)
            values (r.id, n.id, p_tick) on conflict (rule_id, nation_id) do nothing;
        else
          delete from public.headline_threshold_state where rule_id = r.id and nation_id = n.id;
        end if;
      end if;
      if not v_cond then continue; end if;
      -- not sustained long enough yet → hold fire until it has been true for `held` straight ticks
      if coalesce(r.held, 0) > 0 then
        select since_tick into v_since from public.headline_threshold_state where rule_id = r.id and nation_id = n.id;
        if v_since is null or (p_tick - v_since) < r.held then continue; end if;
      end if;
      v_key := coalesce(r.subject_type, 'stat') || '|' || coalesce(r.subject, '');
      if v_key = any(v_fired) then continue; end if;    -- a higher-priority rule on this subject won
      -- fire-once (per nation) + cooldown, read off the fire history like the event engine
      if r.fire_once and exists (select 1 from public.news_headlines h where h.rule_id = r.id and h.nation_id = n.id) then continue; end if;
      if exists (select 1 from public.news_headlines h where h.rule_id = r.id and h.nation_id = n.id
                   and coalesce(h.tick, -2147483647) > coalesce(p_tick, 0) - coalesce(r.cooldown, 0)) then continue; end if;
      if public._publish_rule_headlines(n.id, r, v_val, r.subject) > 0 then
        v_fired := v_fired || v_key;
      end if;
    end loop;
  end loop;
end $$;
revoke all on function public._resolve_headline_thresholds(int) from public, anon, authenticated;

-- Speeds the cooldown / fire-once lookups the engines run per rule × nation.
create index if not exists news_headlines_rule on public.news_headlines (rule_id, nation_id);

notify pgrst, 'reload schema';
