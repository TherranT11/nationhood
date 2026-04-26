-- Add 'change_logo' to the ipo_votes vote_type CHECK constraint.
-- Enables a dedicated cosmetic-only vote for changing the organisation's
-- logo (symbol, text, or image) without bundling it into a charter amendment.

ALTER TABLE ipo_votes DROP CONSTRAINT IF EXISTS chk_vote_type;
ALTER TABLE ipo_votes ADD CONSTRAINT chk_vote_type CHECK (
    vote_type IN (
        'membership',
        'expulsion',
        'joint_statement',
        'fund_draw',
        'charter_amendment',
        'change_headquarters',
        'symposium',
        'leadership_election',
        'change_logo'
    )
);
