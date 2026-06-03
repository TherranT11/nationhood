-- ════════════════════════════════════════════════════════════════════
-- 20270551 — Narrow originals index back to pre_trial + in_progress
--
-- Audit follow-up on 20270550. That migration relaxed the trial
-- uniqueness for appeals (the user's actual reported bug) AND, while
-- in the same file, widened the originals index to also include
-- 'settlement_conference' status — "20270533 added the status but
-- the index never picked it up."
--
-- The widening was scope creep that risked the primary fix:
--
--   Trial A on case_draft X: status='settlement_conference',
--                            appeal_of_trial_id NULL.
--   Trial B on case_draft X: another player drew the same case
--                            (draw_court_case's not-exists filter
--                            only checks pre_trial + in_progress —
--                            not SC), status='pre_trial',
--                            appeal_of_trial_id NULL.
--
-- Both rows match the widened predicate → CREATE UNIQUE INDEX aborts
-- → whole 20270550 transaction rolls back → production still has the
-- old appeals-blocking index. User's reported bug stays open.
--
-- This migration narrows idx_court_case_trials_one_active back to
-- exactly the 20270514 status set ('pre_trial', 'in_progress') plus
-- the new appeal_of_trial_id IS NULL clause. Safe to apply regardless
-- of whether 20270550 succeeded or rolled back on production:
--   • If 20270550 succeeded, this is a narrowing (no new violations
--     introduced; existing matching rows are a strict subset).
--   • If 20270550 rolled back, this re-attempts the originals-index
--     drop + recreate with the safe predicate from scratch.
--
-- The appeals-side index (idx_court_case_trials_one_appeal_per_original)
-- keeps the 'settlement_conference' inclusion because appeals don't
-- enter SC — represent_pretrial v5 routes appeals straight to
-- in_progress instead. No existing data can violate it.
--
-- Closing the originals-index SC gap (preventing parallel draws on
-- the same case_draft via an SC race) is a separate fix; it requires
-- draw_court_case's not-exists filter to ALSO check SC. Deferred.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP INDEX IF EXISTS public.idx_court_case_trials_one_active;

CREATE UNIQUE INDEX IF NOT EXISTS idx_court_case_trials_one_active
    ON public.court_case_trials (case_draft_id)
 WHERE status IN ('pre_trial', 'in_progress')
   AND appeal_of_trial_id IS NULL;

-- Idempotent re-create of the appeal index in case 20270550 rolled
-- back. Predicate unchanged from 20270550 — appeals don't enter SC,
-- so the SC inclusion remains safe.
DROP INDEX IF EXISTS public.idx_court_case_trials_one_appeal_per_original;

CREATE UNIQUE INDEX IF NOT EXISTS idx_court_case_trials_one_appeal_per_original
    ON public.court_case_trials (appeal_of_trial_id)
 WHERE appeal_of_trial_id IS NOT NULL
   AND status IN ('pre_trial', 'settlement_conference', 'in_progress');

COMMIT;
