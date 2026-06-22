-- Seed: set the Wesmore flag.
--
-- Run in the Supabase SQL Editor AFTER the Wesmore nation exists (created via
-- /adminsetup) and AFTER public/assets/Wesmore.png is deployed. Matched by the
-- nation's NAME so it lines up with whatever slug the admin form assigned — the
-- same approach as seed/vesperia_flag.sql.
--
-- Matched loosely (the nation is "Wesmore and Calcordia"), so any "…Wesmore…"
-- name resolves. Idempotent: re-running just re-sets the same path.

update public.nations
set flag = '/assets/Wesmore.png'
where name ilike '%wesmore%';
