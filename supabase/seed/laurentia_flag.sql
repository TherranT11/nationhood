-- Seed: set the Laurentia flag.
--
-- Run in the Supabase SQL Editor AFTER the Laurentia nation exists (created via
-- /adminsetup) and AFTER public/assets/Laurentia.png is deployed. Matched by the
-- nation's NAME so it lines up with whatever slug the admin form assigned — the
-- same approach as seed/laurentia_names.sql.
--
-- Matched loosely (so "Laurentia", "The Republic of Laurentia", etc. all
-- resolve). Idempotent: re-running just re-sets the same path.

update public.nations
set flag = '/assets/Laurentia.png'
where name ilike '%laurentia%';
