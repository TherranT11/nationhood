-- Add 'leadership_election' to the ipo_votes vote_type CHECK constraint
-- This allows the advance-tick function to create leadership election votes
-- when an IPO charter uses the 'vote' succession type.

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
        'leadership_election'
    )
);

-- Leadership election ballots store a faction_id (UUID) as the ballot value
-- instead of 'yes'/'no'/'abstain'. Drop the restrictive CHECK constraint.
ALTER TABLE ipo_ballots DROP CONSTRAINT IF EXISTS chk_ballot_value;
