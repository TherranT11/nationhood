-- ===========================================================================
-- 158 · Headline thresholds — the stat-crossing trigger, now ACTIVE.
-- Depends on: 10 (nations), 05 (game_state), 47 (_nation_tax_burden), 70 (_to_num), 152
-- (_nation_policy_stat), 156/157 (news_outlets, headline_rules, _publish_rule_headlines). After 157.
--
-- Each tick (from _advance_tick, schema/60) every live nation is checked against every enabled
-- threshold rule: when the subject stat is above/below the rule's value, the rule fires and each
-- paper prints its slant's variant ({value}/{subject} tokens filled). Cooldown + fire-once are read
-- off the fire history (news_headlines.rule_id), exactly like the event engine.
--
-- Every ministry stat is evaluable: the five national stats + the economy figures use their stored
-- value; Tax Burden is the derived rate (schema/47); ANY other ministry stat (Crime, Environment,
-- Infrastructure, Poverty, …) uses its policy-driven contribution (_nation_policy_stat, schema/152),
-- so a rule fires when the nation's policy mix pushes that stat past the threshold. Resource on-hand
-- and production read the stockpile/rate jsonb. 'rate' (change-per-year) needs prior-tick state and
-- stays dormant for now. The `held` (sustained-for) field is stored but not yet enforced — the
-- cooldown is what keeps a standing condition from re-firing every tick.
-- ===========================================================================

-- The numeric value of a rule's subject for one nation, or null when it isn't evaluable (a 'rate'
-- subject, or an unknown key). ONE source for "what is this stat right now" in the headline engine.
create or replace function public._headline_subject_value(
  p_stats jsonb, p_economy jsonb, p_onhand jsonb, p_production jsonb,
  p_nation text, p_subject_type text, p_subject text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_st text := coalesce(p_subject_type, 'stat');
begin
  if p_subject is null then return null; end if;
  if v_st = 'onhand'     then return public._to_num(p_onhand->>lower(p_subject)); end if;
  if v_st = 'production'  then return public._to_num(p_production->>lower(p_subject)); end if;
  if v_st = 'rate'       then return null; end if;   -- change-per-year: not yet evaluated
  -- v_st = 'stat': stored national/economy stats where they exist, Tax Burden derived, and every
  -- other ministry stat via its policy-driven contribution so nothing is left un-evaluable.
  return case p_subject
    when 'Prosperity'   then public._to_num(p_stats->>'prosperity')
    when 'Welfare'      then public._to_num(p_stats->>'welfare')
    when 'Growth'       then public._to_num(p_stats->>'growth')
    when 'Order'        then public._to_num(p_stats->>'order')
    when 'Global Image' then public._to_num(p_stats->>'image')
    when 'Image'        then public._to_num(p_stats->>'image')
    when 'Inflation'    then public._to_num(p_economy->>'inflation')
    when 'Unemployment' then public._to_num(p_economy->>'unemployment')
    when 'Budget'       then public._to_num(p_economy->>'budget')
    when 'Debt'         then public._to_num(p_economy->>'debt')
    when 'Income'       then public._to_num(p_economy->>'income')
    when 'Regime'       then public._to_num(p_economy->>'regime')
    when 'Tax Burden'   then public._nation_tax_burden(p_nation)
    else public._nation_policy_stat(p_nation, p_subject)
  end;
end $$;
revoke all on function public._headline_subject_value(jsonb, jsonb, jsonb, jsonb, text, text, text) from public, anon, authenticated;

-- The per-tick threshold sweep. For each live nation, the enabled threshold rules are scanned in
-- priority order; the first satisfied, off-cooldown, not-fired-once rule PER SUBJECT fires (so two
-- rules on the same stat don't both print — the higher-priority one wins). Fires publish per-slant
-- via the shared _publish_rule_headlines, with the crossing value + subject feeding the tokens.
create or replace function public._resolve_headline_thresholds(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare n record; r public.headline_rules%rowtype; v_val numeric; v_fired text[]; v_key text;
begin
  for n in select id, stats, economy, on_hand, production from public.nations where not coalesce(dormant, false) loop
    v_fired := array[]::text[];
    for r in
      select hr.* from public.headline_rules hr
       where hr.enabled and hr.trigger_type = 'threshold'
         and (hr.scope = 'global' or (hr.scope = 'nation' and hr.nation_id = n.id))
       order by hr.priority desc, hr.created_at desc
    loop
      v_key := coalesce(r.subject_type, 'stat') || '|' || coalesce(r.subject, '');
      if v_key = any(v_fired) then continue; end if;   -- a higher-priority rule on this subject won
      v_val := public._headline_subject_value(n.stats, n.economy, n.on_hand, n.production, n.id, r.subject_type, r.subject);
      if v_val is null then continue; end if;           -- not evaluable (rate / unknown)
      if not ((r.direction = 'above' and v_val > r.value) or (r.direction = 'below' and v_val < r.value)) then continue; end if;
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
