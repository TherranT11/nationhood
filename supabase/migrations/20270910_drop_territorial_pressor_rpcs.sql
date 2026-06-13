-- ════════════════════════════════════════════════════════════════════
-- 20270910 — Drop the territorial-dispute pressor RPCs
--
-- The territorial-dispute pressor was killed: its UI (js/issues-panel.js)
-- was already orphaned (its host pages went in the military / nation-
-- leader culls), the Press Claim action + the territorial_ownership issue
-- type + its modifiers were removed in the preceding commits, and the war
-- terminal it built toward is gone (20270909).
--
-- These six RPCs are the pressor's verbs. Each is gated to
-- issue_type='territorial_ownership' (it rejects any other type), so none
-- is shared with the surviving maritime-fishing / trade-imbalance issues.
--
-- DELIBERATELY KEPT:
--   • dispute_actor_nation() — the HoG-authority helper is SHARED (issue
--     chat, mediation, the resolve engine, region edits all call it).
--   • bilateral_issues + its columns (administering_nation_id et al. are
--     shared with chronic_trade_imbalance: surplus=administering,
--     deficit=non_administering) and processIssueTick — the live ambient
--     issues→incidents backend.
--   • go_to_war was already dropped in 20270909.
--
-- Any existing territorial_ownership dispute is drained to 'resolved'
-- (its modifiers no longer exist in MODIFIERS, so it ticks inert; close
-- it rather than leave a zombie row).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Drain any live territorial disputes ────────────────────────
UPDATE public.bilateral_issues
   SET status = 'resolved'
 WHERE issue_type = 'territorial_ownership'
   AND status IN ('active', 'partial', 'escalated');

-- ── 2. Drop the pressor RPCs ──────────────────────────────────────
DROP FUNCTION IF EXISTS public.press_claim(uuid, jsonb, text, text, int);
DROP FUNCTION IF EXISTS public.soften_demand(uuid);
DROP FUNCTION IF EXISTS public.press_harder(uuid);
DROP FUNCTION IF EXISTS public.extend_deadline(uuid);
DROP FUNCTION IF EXISTS public.drop_claim(uuid);
DROP FUNCTION IF EXISTS public.concede_claim(uuid);

NOTIFY pgrst, 'reload schema';

COMMIT;
