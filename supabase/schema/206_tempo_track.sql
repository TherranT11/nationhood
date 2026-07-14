-- ===========================================================================
-- 206 · Tempo Track (COIN card system, Stage 1: the standing itself).
--
-- Every party carries a Tempo standing — the number that orders who claims a card first (the Tempo
-- Track on /play/theater/). Higher Tempo = earlier in the order. Stage 1 only PERSISTS and randomly
-- ASSIGNS it; the claim actions that spend Tempo (Event −5 / AP −3 / Event+AP → last / Pass → first)
-- and any per-turn re-sort are a later stage and are NOT wired here — no trigger, no tick hook.
--
-- Assignment is passive: the column default draws a fresh random value per INSERT, so every new party
-- is auto-assigned with no trigger. The one-time backfill gives each existing party its own random
-- value (only where unset, so a re-run never reshuffles a standing already assigned).
--
-- Depends on: 20 (parties). Idempotent. Apply in the Supabase SQL Editor.
-- ===========================================================================

alter table public.parties add column if not exists tempo int;
-- Per-insert random default → new parties self-assign a Tempo without any trigger.
alter table public.parties alter column tempo set default floor(random() * 100000)::int;
-- Backfill existing parties, each its own random draw. Idempotent: only fills the unset ones.
update public.parties set tempo = floor(random() * 100000)::int where tempo is null;

-- Readable by anyone (the track is public, like seats/popularity); it is NOT in the client write
-- grants (schema/20) — a player must never set their own claim order. Future Tempo spending goes
-- through a security-definer claim RPC (the Stage 2 build), not a direct client write.

notify pgrst, 'reload schema';
