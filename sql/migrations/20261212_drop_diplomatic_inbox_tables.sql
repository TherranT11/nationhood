-- Commit E3: drop diplomatic_messages + diplomatic_proposals tables.
--
-- The third and final commit of the pre-redesign cleanup. The audit found:
--   - diplomatic_messages: 0 writers (inbox UI culled in commits A/B/C).
--     Only common.js badge counter read it; that read is removed in E3.
--   - diplomatic_proposals: 0 writers besides the state-visit expiry
--     handler in advance-tick (also removed in E3). Read by common.js
--     badge counter (removed), bill.html ratification loader (removed
--     in E1), and resolveDiplomaticRatificationBill in bills.js
--     (deleted in E3).
--   - bills.diplomatic_proposal_id: FK column to diplomatic_proposals.
--     The bill_type='ratification' dispatch no longer routes by this
--     column; only trade_negotiation_id + retaliatory_tariff +
--     impose_embargo remain reachable.
--   - trade_negotiations.initiating_proposal_id: legacy FK column
--     with zero consumers in any *.js/*.html/*.ts.
--
-- Drops the dependent FK columns first, then the tables themselves.
-- Idempotent via IF EXISTS.

-- 1. Drop FK columns that reference the soon-to-be-dropped tables.
ALTER TABLE public.bills
    DROP COLUMN IF EXISTS diplomatic_proposal_id;

ALTER TABLE public.trade_negotiations
    DROP COLUMN IF EXISTS initiating_proposal_id;

-- 2. Drop the tables themselves.
DROP TABLE IF EXISTS public.diplomatic_messages;
DROP TABLE IF EXISTS public.diplomatic_proposals;
