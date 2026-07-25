-- ===========================================================================
-- 329 · Kingdoms — knights have an age (30–45), generated on training.
--
-- Adds kingdoms_knights.age with a volatile default (30 + 0..15), so every new Knight is auto-assigned an age
-- when trained without touching kingdoms_play_card (its insert omits age → the column default fills it). The
-- default's per-row evaluation also backfills any existing knights. Age + House are shown on the Court roster.
-- Depends on: 328 (kingdoms_knights). Idempotent. Apply after 328.
-- ===========================================================================

alter table public.kingdoms_knights
  add column if not exists age int not null default (30 + floor(random() * 16)::int);   -- 30..45

notify pgrst, 'reload schema';
