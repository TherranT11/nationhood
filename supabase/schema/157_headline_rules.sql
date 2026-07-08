-- ===========================================================================
-- 157 · Headline rules — the engine that turns a game event into slanted headlines.
-- Depends on: 10 (nations, is_admin), 05 (game_state.current_tick), 40 (events + current_game_date),
-- 156 (news_outlets, news_headlines, _publish_headline, _event_to_headline trigger). Run after 156.
--
-- A rule (authored in adminsetup → News → Headline Rules) says "when THIS happens, each paper prints
-- ITS slant's variant." When a newsworthy event fires, the matching rule wins by priority and every
-- outlet in the nation publishes the headline for its slant (neutral rules rotate three variants).
-- This SUPERSEDES the plain event-body headline from schema/156 — which stays the fallback when no
-- rule matches, so the desk is never silent.
--
-- Both trigger types are live: 'event' rules fire here (on a game event) and 'threshold' rules fire
-- from the per-tick stat sweep (schema/158) — every ministry stat is evaluable there via its stored
-- value or its policy-driven contribution. The only remaining labeled gap is the event `filter` field
-- (freeform, e.g. margin<20): stored but not matched, since there's no structured event data yet.
-- ===========================================================================

create table if not exists public.headline_rules (
  id            uuid primary key default gen_random_uuid(),
  name          text not null default 'Untitled rule',
  scope         text not null default 'nation',        -- 'nation' | 'global' (any nation)
  nation_id     text references public.nations (id) on delete cascade,   -- set when scope = 'nation'
  trigger_type  text not null default 'event',          -- 'event' | 'threshold' (threshold = dormant)
  event_kind    text,                                   -- the events.kind this fires on
  event_filter  text,                                   -- stored, not yet evaluated
  subject_type  text, subject text, direction text, value numeric, held int,   -- threshold (dormant)
  headline_mode text not null default 'slant',          -- 'slant' (one per slant) | 'neutral' (3 variants)
  headlines     jsonb not null default '{}'::jsonb,     -- {record,left,centre,right,farright} or {n1,n2,n3}
  cooldown      int  not null default 12,               -- min ticks between fires (per nation)
  priority      int  not null default 5,                -- higher wins when several rules match
  fire_once     boolean not null default false,         -- never repeat (per nation)
  enabled       boolean not null default true,
  created_at    timestamptz not null default now()
);
alter table public.headline_rules enable row level security;
drop policy if exists "headline_rules_admin_all" on public.headline_rules;
create policy "headline_rules_admin_all" on public.headline_rules for all
  using (public.is_admin()) with check (public.is_admin());

-- Tag each published headline with the rule that produced it (null = the plain event-body fallback).
-- Reused as the fire history: cooldown and fire-once are read straight off news_headlines, so there's
-- no separate state table to keep in sync.
alter table public.news_headlines add column if not exists rule_id uuid references public.headline_rules (id) on delete set null;

-- Fill the runtime tokens in a headline. {nation} always resolves; {value} + {subject} carry the
-- crossing figure + stat name for a threshold rule (null for an event rule → left as authored).
-- ONE place tokens are resolved. Value is trimmed of trailing zeros (16.0 → 16, 16.5 → 16.5).
create or replace function public._headline_fill(p_text text, p_nation text, p_value numeric default null, p_subject text default null)
returns text language plpgsql stable set search_path = public as $$
declare v_name text; v_out text;
begin
  if p_text is null then return null; end if;
  select name into v_name from public.nations where id = p_nation;
  v_out := replace(p_text, '{nation}', coalesce(v_name, 'the nation'));
  if p_value   is not null then v_out := replace(v_out, '{value}',   rtrim(rtrim(round(p_value, 1)::text, '0'), '.')); end if;
  if p_subject is not null then v_out := replace(v_out, '{subject}', p_subject); end if;
  return v_out;
end $$;

-- Publish one rule's headlines for a nation: every outlet prints its slant's variant (neutral rules
-- rotate n1/n2/n3), tokens filled, tagged with the rule id. Returns how many were published (0 if the
-- rule has no usable text). ONE source for firing a rule — shared by the event engine and the
-- threshold sweep (schema/158). p_value/p_subject feed the {value}/{subject} tokens (threshold rules).
create or replace function public._publish_rule_headlines(p_nation text, p_rule public.headline_rules, p_value numeric default null, p_subject text default null)
returns int language plpgsql security definer set search_path = public as $$
declare v_tick int; v_o record; v_txt text; v_variant text; v_i int := 0; v_pub int := 0;
begin
  select current_tick into v_tick from public.game_state where id;
  for v_o in select * from public.news_outlets where nation_id = p_nation order by created_at loop
    if p_rule.headline_mode = 'neutral' then v_variant := (array['n1','n2','n3'])[(v_i % 3) + 1];
    else v_variant := v_o.slant; end if;
    v_txt := public._headline_fill(nullif(btrim(coalesce(p_rule.headlines->>v_variant, '')), ''), p_nation, p_value, p_subject);
    -- fall back to a written variant if this slant is blank, so no paper is left silent
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
revoke all on function public._publish_rule_headlines(text, public.headline_rules, numeric, text) from public, anon, authenticated;

-- Publish the headlines for a game event: the winning event rule (by priority, off cooldown, not
-- already fired-once) makes every outlet print its slant's variant; with no rule, fall back to the
-- plain event-body headline (schema/156). Called by the events trigger below.
create or replace function public._generate_event_headlines(p_nation text, p_kind text, p_body text)
returns void language plpgsql security definer set search_path = public as $$
declare v_rule public.headline_rules%rowtype; v_tick int;
begin
  select current_tick into v_tick from public.game_state where id;
  select r.* into v_rule
    from public.headline_rules r
   where r.enabled and r.trigger_type = 'event' and r.event_kind = p_kind
     and (r.scope = 'global' or (r.scope = 'nation' and r.nation_id = p_nation))
     -- fire-once: never again for this nation once it has produced a headline here
     and not (r.fire_once and exists (select 1 from public.news_headlines h
                                        where h.rule_id = r.id and h.nation_id = p_nation))
     -- cooldown: no headline from this rule for this nation within the last `cooldown` ticks
     and not exists (select 1 from public.news_headlines h
                       where h.rule_id = r.id and h.nation_id = p_nation
                         and coalesce(h.tick, -2147483647) > coalesce(v_tick, 0) - coalesce(r.cooldown, 0))
   order by r.priority desc, r.created_at desc
   limit 1;

  if found then
    if public._publish_rule_headlines(p_nation, v_rule) > 0 then return; end if;
    -- the winning rule had no usable headline text (misconfigured) — fall back to the plain event body
    -- rather than silence the desk. (A rule RESTING on cooldown is handled below, and stays silent.)
    perform public._publish_headline(p_nation, p_body);
    return;
  end if;

  -- No fireable rule. If some enabled rule OWNS this event kind but is resting (cooldown / fired-once),
  -- stay silent rather than undercut its cadence with a plain headline. Only a kind no rule claims
  -- falls back to the plain event-body headline (schema/156), so the desk is never needlessly silent.
  if exists (select 1 from public.headline_rules r
               where r.enabled and r.trigger_type = 'event' and r.event_kind = p_kind
                 and (r.scope = 'global' or (r.scope = 'nation' and r.nation_id = p_nation))) then
    return;
  end if;
  perform public._publish_headline(p_nation, p_body);
end $$;
revoke all on function public._generate_event_headlines(text, text, text) from public, anon, authenticated;

-- Re-point the events trigger (schema/156) at the rules engine. Same newsworthy-kind gate.
create or replace function public._event_to_headline()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public._is_newsworthy(NEW.kind) then
    perform public._generate_event_headlines(NEW.nation_id, NEW.kind, NEW.body);
  end if;
  return NEW;
end $$;

notify pgrst, 'reload schema';
