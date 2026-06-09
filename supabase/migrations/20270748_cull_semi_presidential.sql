-- ════════════════════════════════════════════════════════════════════
-- 20270748 — Cull semi-presidential government type (DB side)
--
-- Pair to the client-side cull in this same branch:
--   • js/game/government-types.js — drop SEMI_PRESIDENTIAL from the
--     canonical type registry and the constitutional reform enum.
--   • js/game/{presidential,elections,political-actions,bills,
--     executive-orders,government-structure,no-confidence}.js +
--     government.html + party-actions.js + coalition-formation.js +
--     laws.html + bill.html + politician-nation.html + first-steps.html
--     + select-nation.html + admin.html + conflicts.html — strip all
--     semi-pres branches.
--   • supabase/functions/advance-tick/index.ts — regenerated from the
--     above via scripts/sync-edge-function.js.
--
-- No nation in production ran semi-pres. The cohabitation / domain-
-- split machinery (MINISTRY_DOMAINS, EO_DOMAIN, isCohabitation,
-- isPresidentialDomainMinistry, getMinistryDomain, isSemiPresidential)
-- was dead weight from a planned mechanic that never shipped beyond
-- the test bench.
--
-- This migration handles the cheap, safe schema drops only:
--
--   1. Four orphaned columns on `nations` that were written to by
--      the semi-pres flow and never read by anything else. Verified
--      via grep across both migration trees.
--   2. The `proposed_constitutional_reform` CHECK on `bills` —
--      tighten to remove 'semi_presidential' so a stale or malicious
--      bill row can't carry the dead value.
--
-- KNOWN FOLLOW-UPS, not in this commit:
--   • finalize_government_formation() carries semi-pres IF branches
--     that always evaluate false after the column drops. They're
--     dead but harmless. Re-creating that function would push this
--     migration into the multi-hundred-line range — drafted as a
--     separate follow-up so this commit stays reviewable.
--   • admin_create_nation() + claim_leadership_challenge() carry
--     the same dead-but-harmless 'Semi-Presidential' branches.
--   • Same disposition: file, don't pre-emptively rewrite.
--
-- Forward-only. Nation rows currently stamped government_type =
-- 'Semi-Presidential' (none expected in prod) would no longer match
-- any canonical type — they'd fall through to the parliamentary
-- default per getCanonicalGovernmentType's fallback. If any such
-- rows exist in admin / test environments, migrate them with:
--   UPDATE nations SET government_type = 'Parliamentary'
--    WHERE government_type ILIKE 'Semi-Presidential%';
-- before deploying this migration. NOT auto-run here per the
-- "no implicit data migrations" doctrine.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. Drop orphaned columns
-- ════════════════════════════════════════════════════════════════════
-- pm_nomination_attempts — counter for the 3-attempt PM nomination
-- cap (20260406_pm_nomination_tracking.sql). Read only by
-- renderSemiPresPMSection / fileNoConfidence, both removed.
ALTER TABLE public.nations DROP COLUMN IF EXISTS pm_nomination_attempts;

-- last_dissolution_tick — cooldown anchor for President-dissolves-
-- parliament (20260406_semi_pres_dissolution.sql). Read only by
-- renderDissolveParliamentButton / dissolveParliament, both removed.
ALTER TABLE public.nations DROP COLUMN IF EXISTS last_dissolution_tick;

-- parliament_formed_tick — companion to last_dissolution_tick;
-- 12-tick minimum-age guard before the President could dissolve a
-- newly-formed parliament. Same dead-with-the-rest.
ALTER TABLE public.nations DROP COLUMN IF EXISTS parliament_formed_tick;

-- last_vonc_tick — flagged a recent VoNC so the dissolve-parliament
-- branch could apply the "authoritarian overreach" -5 Legitimacy
-- penalty (20260407_semi_pres_vonc_tracking.sql). VoNC itself
-- remains a parliamentary mechanic; only the dissolution penalty
-- arm read this column.
ALTER TABLE public.nations DROP COLUMN IF EXISTS last_vonc_tick;


-- ════════════════════════════════════════════════════════════════════
-- 2. Tighten the constitutional reform CHECK on bills
-- ════════════════════════════════════════════════════════════════════
-- The original constraint from 20260407_constitutional_reform.sql
-- allowed four values. We're dropping 'semi_presidential' — neither
-- the client (laws.html / bills.js) nor the resolver
-- (enactConstitutionalReform) accepts it anymore.
--
-- The original CHECK was unnamed. Postgres' default name follows
-- bills_proposed_constitutional_reform_check; the DO block falls
-- back to enumerating constraints by relation if the conventional
-- name isn't present (e.g., a prior environment renamed it).
DO $$
DECLARE
    v_constraint_name text;
BEGIN
    SELECT conname INTO v_constraint_name
      FROM pg_constraint
     WHERE conrelid = 'public.bills'::regclass
       AND contype  = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%proposed_constitutional_reform%';

    IF v_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.bills DROP CONSTRAINT %I', v_constraint_name);
    END IF;
END $$;

ALTER TABLE public.bills
    ADD CONSTRAINT bills_proposed_constitutional_reform_check
    CHECK (
        proposed_constitutional_reform IS NULL
        OR proposed_constitutional_reform IN (
            'parliamentary',
            'constitutional_monarchy',
            'presidential'
        )
    );

NOTIFY pgrst, 'reload schema';

COMMIT;
