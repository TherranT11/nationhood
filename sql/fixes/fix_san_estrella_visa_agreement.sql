-- Fix: Delete the stuck "San Estrella-Avelia Visa Agreement 2002" diplomatic proposal
-- It reached "ratification" (Parliament) stage but the ratification bill was never
-- created in the player's parliament, so it's permanently stuck.
--
-- Root cause: fmEscalate() only creates a bill in one nation, not both.

-- First, fail any ratification bill linked to this proposal (if one exists)
UPDATE bills
SET status = 'failed'
WHERE diplomatic_proposal_id IN (
    SELECT id FROM diplomatic_proposals
    WHERE proposal_type = 'visa_agreement'
      AND status = 'ratification'
      AND proposal_data->>'name' ILIKE '%San Estrella%Visa%'
)
AND status NOT IN ('passed', 'failed');

-- Then delete the proposal itself
DELETE FROM diplomatic_proposals
WHERE proposal_type = 'visa_agreement'
  AND status = 'ratification'
  AND proposal_data->>'name' ILIKE '%San Estrella%Visa%';
