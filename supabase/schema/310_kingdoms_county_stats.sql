-- ===========================================================================
-- 310 · Kingdoms — counties carry their own Available Land + Population.
--
-- Each Aldric county is a distinct place: it holds its own available_land (10–20 plots) and population
-- (3,000–6,000, in tens), rolled once per county. The Home hall's Holdings table reads these per county, so
-- values are per-place and scale to a house holding several counties (they no longer echo the house's
-- priority resources). The pool is fixed (seeded in 309), so this just backfills the 30 existing rows.
-- Depends on: 309. Idempotent. Apply after 309.
-- ===========================================================================

alter table public.kingdoms_counties
  add column if not exists available_land int,
  add column if not exists population     int;

update public.kingdoms_counties
   set available_land = 10 + floor(random() * 11)::int,          -- 10–20 plots
       population     = (300 + floor(random() * 301))::int * 10  -- 3,000–6,000, steps of 10
 where available_land is null or population is null;

notify pgrst, 'reload schema';
