-- ════════════════════════════════════════════════════════════════════
-- 20270550 — Relax court-trial uniqueness for appeals
--
-- Bug: filing an appeal failed with
--   "duplicate key value violates unique constraint
--    idx_court_case_trials_one_active"
--
-- The index from 20270514 says "at most one trial per case_draft_id
-- with status IN ('pre_trial', 'in_progress')." When start_appeal
-- inserts the appeal trial, it reuses the original case_draft_id and
-- the new row's status is 'pre_trial' (waiting for opposing counsel)
-- or 'in_progress' (state-auto-fill path). If any OTHER active trial
-- on that case_draft exists — including a stuck pre-trial appeal from
-- before, or another player's draw that's still pending — the index
-- blocks the insert.
--
-- The original intent was "no two parallel ORIGINAL trials of the
-- same case template." Appeals are inherently a second trial on the
-- same case template, so the constraint needs to know about them.
-- This migration replaces the index with two narrower ones:
--
--   1. idx_court_case_trials_one_active
--      Max one active NON-APPEAL trial per case_draft_id. Preserves
--      the original 20270514 intent for fresh case draws.
--      WHERE status IN ('pre_trial', 'settlement_conference',
--                       'in_progress')
--        AND appeal_of_trial_id IS NULL
--      (also widened to include 'settlement_conference' status, which
--      20270533 added but the index never picked up.)
--
--   2. idx_court_case_trials_one_appeal_per_original
--      Max one active appeal per ORIGINAL trial. Mirrors the
--      appeal_in_flight check inside start_appeal — DB-level
--      enforcement of the same rule. Same active-status set.
--      WHERE appeal_of_trial_id IS NOT NULL
--        AND status IN ('pre_trial', 'settlement_conference',
--                       'in_progress')
--
-- Net effect: an original trial and its appeal can coexist; multiple
-- appeals on the same original cannot; two original trials on the
-- same case_draft still cannot.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP INDEX IF EXISTS public.idx_court_case_trials_one_active;

CREATE UNIQUE INDEX IF NOT EXISTS idx_court_case_trials_one_active
    ON public.court_case_trials (case_draft_id)
 WHERE status IN ('pre_trial', 'settlement_conference', 'in_progress')
   AND appeal_of_trial_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_court_case_trials_one_appeal_per_original
    ON public.court_case_trials (appeal_of_trial_id)
 WHERE appeal_of_trial_id IS NOT NULL
   AND status IN ('pre_trial', 'settlement_conference', 'in_progress');

COMMIT;
