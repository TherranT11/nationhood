-- ============================================================
-- Insert Danwei — first nation of the Faresia continent
-- ============================================================
-- Presidential Republic · Population 23,500,000 · GDP $971B
-- Direct-vote presidency · Caretaker President pending election
-- Caretaker: Han Kuo-yu, age 62 (acting until first election in 1D6 ticks)
-- Cultural inspiration: Taiwan
-- ============================================================
-- This is Phase 2 of the new-nation workflow. Inserts the nations row
-- with all non-stat columns. Stats (Phases 3-9) come in subsequent
-- runs. Idempotent — INSERT WHERE NOT EXISTS + UPDATE pattern matches
-- the Calveth seed.
-- ============================================================

-- Step 1: Insert Danwei if it doesn't exist (with Alpha Shard FK)
INSERT INTO nations (name, government_type, total_seats, max_parties, capital, shard_id, continent)
SELECT 'Danwei', 'Presidential', 223, 8, 'Danwei City', s.id, 'Faresia'
FROM shard s
WHERE s.name = 'Alpha Shard'
  AND NOT EXISTS (SELECT 1 FROM nations WHERE LOWER(name) = 'danwei');

-- Step 2: Set non-stat columns (idempotent — UPDATE is naturally re-runnable).
-- Stats columns are NOT touched here; they get populated in Phases 3-9.
UPDATE nations SET
    government_type           = 'Presidential',
    total_seats               = 223,
    max_parties               = 8,
    capital                   = 'Danwei City',
    continent                 = 'Faresia',

    -- Presidency / Head of State
    -- Caretaker placeholder until the first direct election fires (~1D6
    -- ticks after launch; scheduled in Phase 14). 'first_name=Han,
    -- last_name=Kuo-yu' deliberately stores the family name as
    -- first_name so UI display reads "Han Kuo-yu" without forcing a
    -- naming-convention shim — see new-nation walkthrough Phase 1.
    hos_election_method       = 'direct_vote',
    head_of_state_title       = 'President',
    head_of_state_first_name  = 'Han',
    head_of_state_last_name   = 'Kuo-yu',
    head_of_state_age         = 62,

    -- Demographics & headline economics (the rest of the stat surface
    -- is populated by Phases 3-9 — these three sit on the nations row
    -- as non-stat anchors that the stat phases reference).
    population                = 23500000,
    eligible_voters           = 18800000,
    gdp                       = 971000000000
WHERE LOWER(name) = 'danwei';

-- Verify: echo the inserted row's identity columns.
-- Expected: 1 row matching the values above.
SELECT id, name, government_type, hos_election_method,
       head_of_state_title, head_of_state_first_name, head_of_state_last_name,
       head_of_state_age, capital, continent,
       total_seats, max_parties, population, eligible_voters, gdp
  FROM nations
 WHERE LOWER(name) = 'danwei';
