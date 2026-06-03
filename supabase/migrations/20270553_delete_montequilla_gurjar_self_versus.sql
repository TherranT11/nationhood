-- ════════════════════════════════════════════════════════════════════
-- 20270553 — Correction to 20270552: stale Gurjar self-versus is in
--            Montequilla, not Avelia
--
-- 20270552 targeted nation.name = 'Avelia' for the stuck
-- "Gurjar Shipping v. Gurjar Shipping" pre-trial. A post-deploy query
-- showed the row matches zero in Avelia — the actual stale trial
-- lives in Montequilla:
--
--   id              029c416f-4882-4a7c-9d3a-34c441501892
--   nation          Montequilla
--   plaintiff_name  Gurjar Shipping
--   defendant_name  Gurjar Shipping
--   status          pre_trial
--   pre_trial_expires_at_tick  147
--
-- Same root cause as 20270552 — pre-20270540 draw_court_case could
-- produce same-corp-vs-same-corp drafts. Same cleanup rationale:
-- pre-trial sits in the broadcast feed waiting for opposing counsel
-- that can never legitimately appear (corporation can't sue itself
-- under the post-20270540 rules).
--
-- Targeting is by primary key — unambiguous, single row, no chance
-- of collateral hits. Child rows (messages, hands, witness_qa)
-- cascade via the existing ON DELETE CASCADE FKs.
--
-- politician_court_case_attempts rows for this trial are LEFT INTACT
-- (same reasoning as 20270552 — the player who took counsel keeps
-- the "attempted" record and must pick a different case via
-- TRY A CASE).
--
-- Defensive: gated on status='pre_trial' so this no-ops if the trial
-- already moved forward (e.g. opposing counsel was somehow assigned
-- between the diagnostic query and this migration applying).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DELETE FROM public.court_case_trials
 WHERE id     = '029c416f-4882-4a7c-9d3a-34c441501892'
   AND status = 'pre_trial';

COMMIT;
