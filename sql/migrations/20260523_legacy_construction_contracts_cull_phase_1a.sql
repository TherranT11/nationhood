-- ══════════════════════════════════════════════════════════════
-- Legacy construction_contracts cull — Phase 1A: stop the bleed
--
-- Path 1 Phase 1A of the legacy-table retirement plan. After this
-- migration runs, no new rows are added to construction_contracts:
--
--   1. The two legacy generators in advance-corp-tick
--      (generateConstructionContracts and generateInfraRenewalContracts)
--      are now no-op early returns — see the JS edit shipped in the
--      same commit.
--
--   2. The 102 dormant 'open' + 3 'bidding' rows are flipped to
--      'cancelled'. They were orphan inventory: produced by the
--      legacy generator but unreachable from the new Operations UI
--      (which queries corp_contracts only). Players never saw them
--      and no live cash is locked up in 'open' contracts (cash only
--      moves at award-time, which the new pipeline handles).
--
--   3. The 41 'in_progress' rows are LEFT ALONE. Those are real
--      player work — corps committed to the projects, materials are
--      being consumed, etc. They drain naturally as projects complete
--      over their remaining timelines (max ~100 ticks). Phase 1E
--      drops the table once that count reaches 0.
--
-- Idempotent: re-running just re-applies status='cancelled' to any
-- rows still in 'open'/'bidding' (a no-op after the first pass).
-- ══════════════════════════════════════════════════════════════

UPDATE construction_contracts
   SET status = 'cancelled'
 WHERE status IN ('open', 'bidding');

-- Echo the post-state so the migration runner can confirm.
SELECT status, COUNT(*) AS row_count
  FROM construction_contracts
 GROUP BY status
 ORDER BY status;
