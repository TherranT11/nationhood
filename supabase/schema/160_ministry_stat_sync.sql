-- ===========================================================================
-- 160 · Sync the consolidated ministry stats onto the 1..100 scale (one-time).
-- Depends on: 10 (nations), 70 (_to_num), 150 (ministry_stats), 159 (schema_flags + the stats ×5
-- rescale). Run after 159.
--
-- The stat-scale migration (159) rescaled nations.stats ×5 but NOT the mirrored ministry_stats entries
-- for the three consolidated stats (Prosperity, Growth, Rule of Law → stats.prosperity/growth/order;
-- schema/150 consolidation). That left the Government page (which reads ministry_stats) showing a stale
-- 1..20 value while the business climate (which read stats.*) showed the rescaled 1..100 one.
--
-- Fix: copy the correctly-rescaled stats.* onto those three ministry_stats keys, once. stats.* is the
-- current-correct value (the migration rescaled it, and the admin save keeps the two in sync), so it
-- wins over any stale ministry_stats value. Other ministry stats (Crime, Poverty, …) are already
-- 1..100 and are left untouched.
-- ===========================================================================

do $$
begin
  if exists (select 1 from public.schema_flags where key = 'ministry_stats_1_100_sync') then return; end if;
  update public.nations n set ministry_stats = coalesce(n.ministry_stats, '{}'::jsonb)
    || case when public._to_num(n.stats->>'prosperity') is not null then jsonb_build_object('Prosperity',  public._to_num(n.stats->>'prosperity')) else '{}'::jsonb end
    || case when public._to_num(n.stats->>'growth')     is not null then jsonb_build_object('Growth',      public._to_num(n.stats->>'growth'))     else '{}'::jsonb end
    || case when public._to_num(n.stats->>'order')      is not null then jsonb_build_object('Rule of Law', public._to_num(n.stats->>'order'))      else '{}'::jsonb end
   where n.stats is not null and n.stats <> '{}'::jsonb;
  insert into public.schema_flags (key) values ('ministry_stats_1_100_sync');
end $$;

notify pgrst, 'reload schema';
