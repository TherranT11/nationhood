-- ===========================================================================
-- 278 · Nationverse personalities gain two starting values: Personal Wealth and Influence.
--
-- Authored once per personality in /backend (Personality creator). Stored as non-negative integers
-- with a 0 default; no hard ceiling is imposed here (the scale is a design choice — swap to a checked
-- range later if the game settles on one). Auth unchanged (existing nationverse_personalities policies
-- cover the new columns). Depends on: 272. Idempotent. Apply after 277.
-- ===========================================================================

alter table public.nationverse_personalities add column if not exists wealth    int not null default 0;
alter table public.nationverse_personalities add column if not exists influence int not null default 0;

notify pgrst, 'reload schema';
