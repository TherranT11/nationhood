-- Foundational Law: Election of Head of State
-- Adds hos_election_method to nations (direct_vote, appointed, hereditary)
-- Adds dynasty columns for constitutional monarchy
-- Adds proposed_hos_election_method and proposed_dynasty_name to bills

-- Nation columns
ALTER TABLE nations ADD COLUMN IF NOT EXISTS hos_election_method TEXT DEFAULT NULL
  CHECK (hos_election_method IS NULL OR hos_election_method IN ('direct_vote', 'appointed', 'hereditary'));
ALTER TABLE nations ADD COLUMN IF NOT EXISTS dynasty_name TEXT DEFAULT NULL;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS dynasty_crest_url TEXT DEFAULT NULL;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS dynasty_established_tick INTEGER DEFAULT NULL;

-- Bill columns for foundational law proposals
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_hos_election_method TEXT DEFAULT NULL
  CHECK (proposed_hos_election_method IS NULL OR proposed_hos_election_method IN ('direct_vote', 'appointed', 'hereditary'));
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_dynasty_name TEXT DEFAULT NULL;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_dynasty_crest_url TEXT DEFAULT NULL;

-- Administration snapshot
ALTER TABLE administrations ADD COLUMN IF NOT EXISTS hos_election_method TEXT DEFAULT NULL;
