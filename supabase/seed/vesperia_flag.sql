-- Seed: set the Federated States of Vesperia flag.
--
-- Run in the Supabase SQL Editor AFTER the Vesperia nation exists (created via
-- /adminsetup) and AFTER public/assets/Vesperia.png is deployed. Matched by the
-- nation's NAME so it lines up with whatever slug the admin form assigned — the
-- same approach as seed/vesperia_names.sql.
-- Idempotent: re-running just re-sets the same path.

update public.nations
set flag = '/assets/Vesperia.png'
where name = 'Federated States of Vesperia';
