-- ══════════════════════════════════════════════════════════════════════════
-- Add idempotency tick to construction_contracts.stalled_ticks
--
-- Bug: the corp tick processor's start-gate, workforce-gate, and material-
-- gate each `UPDATE stalled_ticks = stalled_ticks + 1` whenever a project
-- can't advance. Background-tasks pattern + per-minute cron polling means
-- processActiveProjects() can run multiple times against the same shard
-- tick before corp_last_processed_tick is bumped — each run hits the same
-- gate and re-increments. Field observation: Municipal Hospital awarded at
-- tick 30, current_tick=36 (6 ticks elapsed) but stalled_ticks=11.
--
-- Fix: add last_stalled_tick INT. Increment stalled_ticks only when
-- last_stalled_tick != currentTick. Idempotent regardless of how many
-- times the processor runs in one shard tick.
--
-- Also reconcile existing dirty rows: cap stalled_ticks at the maximum
-- it could legitimately be (current_tick - awarded_at_tick).
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE construction_contracts
    ADD COLUMN IF NOT EXISTS last_stalled_tick INT;

-- One-time reconcile: cap stalled_ticks so existing dirty rows aren't
-- penalised forever. Active projects only.
UPDATE construction_contracts
SET stalled_ticks = LEAST(
    COALESCE(stalled_ticks, 0),
    GREATEST(0, (SELECT current_tick FROM shard WHERE name = 'Alpha Shard') - COALESCE(awarded_at_tick, 0))
)
WHERE completed_at_tick IS NULL
  AND awarded_at_tick IS NOT NULL
  AND stalled_ticks > (SELECT current_tick FROM shard WHERE name = 'Alpha Shard') - COALESCE(awarded_at_tick, 0);
