-- Add missing initiated_by_nation column to trade_negotiations.
-- The diplomacy badge counter (common.js) and diplomacy.html query this
-- column to determine which nation started the negotiation so inbound
-- proposals can be distinguished from outbound ones.

ALTER TABLE trade_negotiations
    ADD COLUMN IF NOT EXISTS initiated_by_nation UUID REFERENCES nations(id);

-- Backfill: for existing rows, infer the initiator from the linked
-- diplomatic_proposals row (proposer_nation_id).  Rows without a linked
-- proposal are left NULL — they pre-date the column and the badge
-- counter's .neq() filter will safely exclude them.
UPDATE trade_negotiations tn
SET initiated_by_nation = dp.proposing_nation_id
FROM diplomatic_proposals dp
WHERE tn.initiating_proposal_id = dp.id
  AND tn.initiated_by_nation IS NULL;
