-- ===========================================================================
-- 175 · Writable nation stats — a runtime delta layer over the ministry-stats display grid.
--
-- The Government-page stats (Crime, Poverty, Immigration, Corruption, … stored in nations.ministry_
-- stats, schema/150) are admin-authored DISPLAY values with no runtime write path: in-force policies
-- contribute to the shown figure, but nothing else could ever move them. This adds that path so card
-- effects (and any future system) can change them — WITHOUT overwriting the admin-authored base.
--
-- The mechanism: a separate `stat_deltas` accumulator jsonb that _nation_live_stat layers on top, so
-- the displayed value is  base(ministry_stats or real-stat fallback) + policy contributions + delta.
-- Admin authoring and runtime change stay in different fields (one source each).
--
-- NOT handled here: the three stats that mirror a real game stat — Growth→stats.growth,
-- Prosperity→stats.prosperity, Rule of Law→stats.order. Callers change those through _nation_stat_add
-- (schema/91) so the game logic — elections, business climate — actually feels them; the display
-- already reflects them via the fallback below. This layer is only for the display-only stats.
--
-- Depends on: 10 (nations), 91 (_nation_stat_add), 47 (_nation_live_stat, _to_num),
-- 150 (ministry_stats), 152 (_nation_policy_stat). Idempotent.
-- ===========================================================================

alter table public.nations add column if not exists stat_deltas jsonb not null default '{}'::jsonb;

-- _nation_live_stat, now with the runtime delta term. Same base + policy as before (schema/47), plus
-- coalesce(stat_deltas->>stat, 0). One row read.
create or replace function public._nation_live_stat(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_base numeric; v_delta numeric; v_leg text;
begin
  v_leg := case p_stat when 'Growth' then 'growth' when 'Prosperity' then 'prosperity' when 'Rule of Law' then 'order' end;
  select coalesce(public._to_num(ministry_stats->>p_stat),
                  case when v_leg is not null then public._to_num(stats->>v_leg) end, 0),
         coalesce(public._to_num(stat_deltas->>p_stat), 0)
    into v_base, v_delta
    from public.nations where id = p_nation;
  return coalesce(v_base, 0) + coalesce(public._nation_policy_stat(p_nation, p_stat), 0) + coalesce(v_delta, 0);
end $$;
revoke all on function public._nation_live_stat(text, text) from public, anon, authenticated;

-- Change a display-grid stat by a signed amount — accumulates in stat_deltas, clamped to a ±100 band
-- so no single card can run a stat to absurdity. The real-backed stats (Growth / Prosperity / Rule of
-- Law) must NOT come through here — route those to _nation_stat_add so the game logic feels them.
-- Internal; the effect resolution engine (Phase 3b) is the caller.
create or replace function public._nation_ministry_stat_add(p_nation text, p_stat text, p_delta numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.nations
     set stat_deltas = jsonb_set(coalesce(stat_deltas, '{}'::jsonb), array[p_stat],
           to_jsonb(greatest(-100, least(100, coalesce(public._to_num(stat_deltas->>p_stat), 0) + p_delta))))
   where id = p_nation;
end $$;
revoke all on function public._nation_ministry_stat_add(text, text, numeric) from public, anon, authenticated;

notify pgrst, 'reload schema';
