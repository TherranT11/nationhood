-- 20270112_army_officers.sql
--
-- Army officer roster persistence. The Chief of Staff is the army
-- faction's leader_first_name/last_name/age (the polymorphic single
-- source, generated at army-join in select-nation.html) and needs no
-- column here. The other three officers — Quartermaster General,
-- Director of Intelligence, Commanding General — are auto-generated
-- and locked in lazily on the first army-actions.html load, then read
-- from these columns thereafter (covers the pre-existing "Army of
-- Palvera" and every future army uniformly; no join-flow change).
--
-- Flat columns, mirroring the leader_* / army_* convention. Idempotent
-- (ADD COLUMN IF NOT EXISTS). No backfill — generation happens client-
-- side on first load so existing and new armies are handled the same.

BEGIN;

ALTER TABLE public.factions
  ADD COLUMN IF NOT EXISTS army_qm_first_name    TEXT,
  ADD COLUMN IF NOT EXISTS army_qm_last_name     TEXT,
  ADD COLUMN IF NOT EXISTS army_qm_age           INTEGER,
  ADD COLUMN IF NOT EXISTS army_intel_first_name TEXT,
  ADD COLUMN IF NOT EXISTS army_intel_last_name  TEXT,
  ADD COLUMN IF NOT EXISTS army_intel_age        INTEGER,
  ADD COLUMN IF NOT EXISTS army_cmd_first_name   TEXT,
  ADD COLUMN IF NOT EXISTS army_cmd_last_name    TEXT,
  ADD COLUMN IF NOT EXISTS army_cmd_age          INTEGER;

COMMIT;

NOTIFY pgrst, 'reload schema';
