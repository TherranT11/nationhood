-- ══════════════════════════════════════════════════════════════════════
-- Change diplomatic actions from propose/accept to simultaneous matching.
-- Both nations must independently choose the same diplomatic action on
-- the same tick. If only one side submits, they get penalized.
-- ══════════════════════════════════════════════════════════════════════

-- Add 'submitted' status for diplomatic actions awaiting tick-end matching
ALTER TABLE bilateral_issue_actions_taken
    DROP CONSTRAINT IF EXISTS bilateral_issue_actions_taken_status_check;

ALTER TABLE bilateral_issue_actions_taken
    ADD CONSTRAINT bilateral_issue_actions_taken_status_check
    CHECK (status IN ('pending', 'accepted', 'rejected', 'executed', 'submitted', 'matched', 'gaffe'));

-- 'submitted' = diplomatic action submitted, waiting for tick processor to match
-- 'matched'   = both nations chose the same action → effects applied
-- 'gaffe'     = only one nation submitted → political gaffe penalty applied
