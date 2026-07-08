-- ===========================================================================
-- 159 · National-stat scale 1..20 → 1..100 (one-time data migration).
-- Depends on: 10 (nations), 70 (_to_num). Runs late so it sees the seeded rows.
--
-- The five national stats (nations.stats: prosperity/welfare/order/image/growth) moved from a 1..20
-- band to 1..100 (the clamps in schema/91, 113, 114 and the malaise thresholds in schema/125 now use
-- the wider band). Existing nations were authored on the old scale, so their stored values are
-- multiplied ×5 (14 → 70), clamped to 1..100, so they sit at the same relative position on the new band.
--
-- Guarded two ways so it is safe to re-apply the whole bundle: a schema_flags marker makes the block
-- run at most once ever, and inside it only nations that still look old-scale (every stat ≤ 20) are
-- touched — so a fresh DB seeded straight onto the 1..100 scale is left alone.
-- ===========================================================================

-- Reusable marker table for one-time data migrations. Internal engine state: RLS on with no policy,
-- so only the security-definer / bypass path ever reads or writes it.
create table if not exists public.schema_flags (
  key        text primary key,
  applied_at timestamptz not null default now()
);
alter table public.schema_flags enable row level security;

do $$
begin
  if exists (select 1 from public.schema_flags where key = 'stats_scale_1_100') then return; end if;

  update public.nations set stats = jsonb_strip_nulls(jsonb_build_object(
    'prosperity', case when stats ? 'prosperity' then greatest(1, least(100, round(public._to_num(stats->>'prosperity') * 5))) end,
    'welfare',    case when stats ? 'welfare'    then greatest(1, least(100, round(public._to_num(stats->>'welfare')    * 5))) end,
    'growth',     case when stats ? 'growth'     then greatest(1, least(100, round(public._to_num(stats->>'growth')     * 5))) end,
    'order',      case when stats ? 'order'      then greatest(1, least(100, round(public._to_num(stats->>'order')      * 5))) end,
    'image',      case when stats ? 'image'      then greatest(1, least(100, round(public._to_num(stats->>'image')      * 5))) end
  ))
  where stats is not null and stats <> '{}'::jsonb
    and greatest(
      coalesce(public._to_num(stats->>'prosperity'), 0),
      coalesce(public._to_num(stats->>'welfare'),    0),
      coalesce(public._to_num(stats->>'growth'),     0),
      coalesce(public._to_num(stats->>'order'),      0),
      coalesce(public._to_num(stats->>'image'),      0)
    ) <= 20;

  insert into public.schema_flags (key) values ('stats_scale_1_100');
end $$;

notify pgrst, 'reload schema';
