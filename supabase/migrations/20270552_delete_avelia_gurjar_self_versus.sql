-- ════════════════════════════════════════════════════════════════════
-- 20270552 — One-off: delete Avelia "Gurjar Shipping v. Gurjar Shipping"
--
-- Cleanup for a stale pre-trial in Avelia where draw_court_case
-- generated a case with the same corporation on both sides — a bug
-- closed in 20270540 (corporation can't sue itself). The trial sat in
-- the pre_trial broadcast feed for ticks waiting on opposing counsel
-- that would never come.
--
-- Targeting is narrow and conjunctive — must match ALL of:
--   • nation.name = 'Avelia'
--   • status      = 'pre_trial'
--   • plaintiff_name = defendant_name = 'Gurjar Shipping'
--
-- The trial's child rows (messages, hands, witness_qa) cascade via
-- the existing ON DELETE CASCADE FKs.
--
-- politician_court_case_attempts rows are intentionally LEFT INTACT —
-- the politician who took plaintiff counsel still has an "attempted"
-- record. They can pick a different case via TRY A CASE; we don't
-- silently let them re-take the same draft.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DELETE FROM public.court_case_trials
 WHERE id IN (
    SELECT t.id
      FROM public.court_case_trials t
      JOIN public.nations n ON n.id = t.nation_id
     WHERE n.name           = 'Avelia'
       AND t.status         = 'pre_trial'
       AND t.plaintiff_name = 'Gurjar Shipping'
       AND t.defendant_name = 'Gurjar Shipping'
 );

COMMIT;
