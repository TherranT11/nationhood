-- ════════════════════════════════════════════════════════════════════
-- 20270694 — Schedule Montequilla general (parliamentary) election
--
-- One-shot. Sets Montequilla's next general election to current
-- Alpha Shard tick + 21. When the tick matures the existing
-- resolve_due_general_elections() resolver (20270421) fires on the
-- next politician-page load: reallocates assembly seats by
-- largest-remainder of popularity_pct across Montequilla's
-- movement_party rows, then auto-reschedules the cycle.
--
-- ── Schema reality ─────────────────────────────────────────────────
-- This codebase does NOT have a separate elections / election_type
-- table. "Parliamentary" is the implicit (and only) kind of election
-- at the nation level — the resolver redistributes the chamber.
-- Scheduling a parliamentary election therefore means setting
-- nations.next_election_tick; the politician-nation page countdown
-- and the resolver both key off that single column. No election_type
-- value is needed because there's only one.
--
-- ── Idempotency ────────────────────────────────────────────────────
-- 20270421 initialised Avelia + Melizea but not Montequilla, so
-- Montequilla.next_election_tick is typically NULL. We only write
-- when one of:
--   • the column is NULL (never scheduled), or
--   • the queued tick has already matured (next_election_tick <=
--     current tick — the cycle has fallen behind and a fresh schedule
--     is the right reset).
-- If a future-dated tick is already queued, this migration is a no-op
-- so re-applying it never disturbs an already-scheduled election.
--
-- Apply after 20270693.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_tick           int;
    v_nation_id      uuid;
    v_current_queue  int;
    v_new_tick       int;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RAISE EXCEPTION 'Alpha Shard row not found; cannot schedule election.';
    END IF;

    SELECT id, next_election_tick
      INTO v_nation_id, v_current_queue
      FROM nations
     WHERE name = 'Montequilla'
     LIMIT 1;
    IF v_nation_id IS NULL THEN
        RAISE EXCEPTION 'Montequilla not found in nations.';
    END IF;

    IF v_current_queue IS NOT NULL AND v_current_queue > v_tick THEN
        RAISE NOTICE
            'Montequilla already has a future-dated election queued at tick % (current %); skipping.',
            v_current_queue, v_tick;
        RETURN;
    END IF;

    v_new_tick := v_tick + 21;
    UPDATE nations SET next_election_tick = v_new_tick WHERE id = v_nation_id;

    RAISE NOTICE
        'Scheduled Montequilla general election at tick % (current %, +21).',
        v_new_tick, v_tick;
END $$;

COMMIT;
