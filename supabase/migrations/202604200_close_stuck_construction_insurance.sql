-- ══════════════════════════════════════════════════════════════════════════
-- Close stuck construction-insurance policies on completed projects.
--
-- Problem: advance-corp-tick/index.ts:2088 had `.eq('status', 'funded')`
-- filtering finance_loan_requests before closing linked active policies.
-- No production insurance request ever reached 'funded' status (universe is
-- cancelled / expired / open), so the closure hook matched zero rows for
-- every completed project since the system launched. Three corps got
-- wrongly charged monthly premiums after their projects delivered:
--
--   • Vanttol Group              — Dry Dock Advanced   (completed tick 9)
--   • East Industrial Corporation — Fuel Depot (2 policies, completed tick 11)
--
-- Total bleeding: $872,667/tick across 3 active policies.
--
-- Fix:
--   (1) This migration — set status='repaid' on every stuck policy by joining
--       finance_active_loans → finance_loan_requests → construction_contracts
--       and matching where contract is completed but loan is still current/
--       late/delinquent.
--   (2) Paired code fix in advance-corp-tick/index.ts drops the broken
--       'funded' filter so this cascade runs automatically going forward.
--
-- No refunds — per user direction ("just stop the bleeding").
--
-- Plain UPDATE with a subquery — safe to run via Supabase Studio SQL Editor.
-- Idempotent: re-running matches 0 rows after the first successful run.
-- ══════════════════════════════════════════════════════════════════════════

UPDATE public.finance_active_loans fal
SET status = 'repaid',
    completed_tick = (SELECT current_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1)
FROM public.finance_loan_requests flr,
     public.construction_contracts cc
WHERE fal.request_id = flr.id
  AND flr.insured_contract_id = cc.id
  AND flr.request_type = 'insurance'
  AND cc.status = 'completed'
  AND fal.status IN ('current', 'late', 'delinquent');
