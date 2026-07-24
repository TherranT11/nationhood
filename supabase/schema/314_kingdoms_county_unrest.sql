-- ===========================================================================
-- 314 · Kingdoms — counties carry an Unrest stat (starts at 1).
--
-- Each holding begins with Unrest = 1, a per-county stat shown on the Home roster and the Holdings hall.
-- NOT NULL DEFAULT 1 sets every existing seeded county to 1 on add, so no backfill and no founder-RPC change
-- is needed (the default applies when a house claims a county). The county's Lord is not stored — it is the
-- head of house until an appoint-lord mechanic exists, so it is derived client-side. Depends on: 309.
-- Idempotent. Apply after 313.
-- ===========================================================================

alter table public.kingdoms_counties
  add column if not exists unrest int not null default 1;

notify pgrst, 'reload schema';
