-- ══════════════════════════════════════════════════════════════════════════
-- Vostia: unstick post-election state after tick 15 parliamentary election.
--
-- Problem: 10 duplicate rows in government_formations with status='caretaker'
-- (created 2026-04-19 13:26–13:30) caused advance-tick/index.ts:15189 to hit
-- .maybeSingle() with multiple matches. That call throws, the wrapping
-- if (existingGov) gate at line 15223 then fails, and the entire post-election
-- cleanup block is skipped — leaving government_formations, head_of_government,
-- and ministries in their pre-election state even though elections.status is
-- 'completed' and MOTP won 167/260 seats (majority).
--
-- This migration applies exactly the cleanup the tick processor would have run
-- if the gate hadn't failed (advance-tick/index.ts:15251–15281). Scoped to
-- Vostia only — we're not touching other nations until we confirm the duplicate
-- creation was legacy pollution.
--
-- After this runs, MOTP will see the "form a coalition" UI at
-- government.html:5160+ on next page load and can propose their new government.
--
-- Plain UPDATEs — safe to run via Supabase Studio SQL Editor.
-- Idempotent: re-running does nothing harmful (UPDATE matches 0 rows).
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Dissolve all active government_formations rows for Vostia
UPDATE public.government_formations
SET status = 'dissolved'
WHERE nation_id = (SELECT id FROM public.nations WHERE name = 'Vostia')
  AND status IN ('formed', 'active', 'caretaker');

-- 2. Dissolve active_coalitions mirror (legacy table — some code still reads it)
UPDATE public.active_coalitions
SET status = 'dissolved',
    dissolved_at = now()
WHERE nation_id = (SELECT id FROM public.nations WHERE name = 'Vostia')
  AND dissolved_at IS NULL;

-- 3. Deactivate head_of_government
UPDATE public.head_of_government
SET active = false
WHERE nation_id = (SELECT id FROM public.nations WHERE name = 'Vostia')
  AND active = true;

-- 4. Vacate all active ministries
UPDATE public.ministries
SET minister_first_name = NULL,
    minister_last_name  = NULL,
    minister_age        = NULL,
    party_id            = NULL
WHERE nation_id = (SELECT id FROM public.nations WHERE name = 'Vostia')
  AND is_active = true;

-- 5. Fail any frozen bills carried from the pre-election period
UPDATE public.bills
SET status = 'failed'
WHERE nation_id = (SELECT id FROM public.nations WHERE name = 'Vostia')
  AND status = 'frozen';
