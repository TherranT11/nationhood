-- ════════════════════════════════════════════════════════════════════
-- 20270655 — Audit fix on 20270654: CHECK constraints for CC President
--
-- Pre-commit audit caught two CHECK constraints that 20270654 didn't
-- update — both would have rejected city_council_president at runtime
-- with check_violation:
--
--   1. politician_active_election.race_tier had a CHECK constraint
--      (added in 20270432) restricting race_tier ∈ ('community',
--      'parliament', 'city_council', 'senior_mp'). The INSERT in
--      politician_register_for_office's new city_council_president
--      branch would have failed at the moment the player clicked
--      Run for Election.
--
--   2. factions.politician_office had a parallel CHECK constraint
--      (added in 20270418, widened in 20270432) restricting the
--      column to NULL or four specific values. politician_resolve_
--      due_elections's office-grant UPDATE to 'city_council_
--      president' on a CCP win would have failed.
--
-- Same DROP/RE-ADD pattern 20270432 used. Both constraints get the
-- new value added; everything else stays put. Pure schema change —
-- no data migration, no RPC re-emit.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. politician_active_election.race_tier ───────────────────────
ALTER TABLE politician_active_election
    DROP CONSTRAINT IF EXISTS politician_active_election_race_tier_check;
ALTER TABLE politician_active_election
    ADD CONSTRAINT politician_active_election_race_tier_check
    CHECK (race_tier IN (
        'community', 'parliament',
        'city_council', 'senior_mp',
        'city_council_president'
    ));

-- ── 2. factions.politician_office ─────────────────────────────────
ALTER TABLE factions DROP CONSTRAINT IF EXISTS factions_politician_office_chk;
ALTER TABLE factions
    ADD CONSTRAINT factions_politician_office_chk
    CHECK (politician_office IS NULL
           OR politician_office IN (
               'community_organizer', 'member_of_parliament',
               'city_council_member', 'senior_mp',
               'city_council_president'
           ));

COMMIT;
