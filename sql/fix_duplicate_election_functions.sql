-- One-time cleanup: drop all election helper overloads before re-running run_election.sql
-- Fixes: "function _election_process_bloc(jsonb, text[], integer, jsonb) is not unique"

DROP FUNCTION IF EXISTS _election_process_bloc(JSONB, TEXT[], INT, JSONB);
DROP FUNCTION IF EXISTS _election_process_bloc(JSONB, TEXT[], BIGINT, JSONB);
DROP FUNCTION IF EXISTS _election_process_bloc(JSONB, TEXT[], INT, JSONB, JSONB);
DROP FUNCTION IF EXISTS _election_process_bloc(JSONB, TEXT[], INT, JSONB, JSONB, NUMERIC);

DROP FUNCTION IF EXISTS _election_distribute_votes(JSONB, TEXT[], TEXT[], INT, JSONB);
DROP FUNCTION IF EXISTS _election_distribute_votes(JSONB, TEXT[], TEXT[], BIGINT, JSONB);
DROP FUNCTION IF EXISTS _election_distribute_votes(JSONB, TEXT[], TEXT[], INT, JSONB, JSONB);
DROP FUNCTION IF EXISTS _election_distribute_votes(JSONB, TEXT[], TEXT[], BIGINT, JSONB, JSONB);

DROP FUNCTION IF EXISTS _election_distribute_votes_approval_only(JSONB, INT, JSONB);
DROP FUNCTION IF EXISTS _election_distribute_votes_approval_only(JSONB, BIGINT, JSONB);
DROP FUNCTION IF EXISTS _election_distribute_votes_approval_only(JSONB, INT, JSONB, JSONB);
DROP FUNCTION IF EXISTS _election_distribute_votes_approval_only(JSONB, BIGINT, JSONB, JSONB);

DROP FUNCTION IF EXISTS _election_effective_approval(JSONB, TEXT[]);

DROP FUNCTION IF EXISTS _election_allocate_seats(JSONB, BIGINT, INT);
DROP FUNCTION IF EXISTS _election_allocate_seats(JSONB, BIGINT, BIGINT);

-- After running this, re-run sql/run_election.sql to recreate all functions cleanly.
