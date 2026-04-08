-- Phase 9: Drop legacy bloc tables
-- The electorate engine (electorate_profile, faction_electoral_standing, etc.)
-- replaces the old voter_blocs + faction_bloc_approval + momentum_log system.
--
-- NOTE: voter_blocs is still referenced by election-simulation.js and elections.js
-- for running elections. Those reads will return empty rows after the drop.
-- The election system will be migrated to the electorate engine in a future phase.

-- Drop dependent tables first (foreign key ordering)
DROP TABLE IF EXISTS faction_bloc_approval CASCADE;
DROP TABLE IF EXISTS momentum_log CASCADE;
DROP TABLE IF EXISTS voter_blocs CASCADE;
