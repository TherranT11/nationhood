-- ═══════════════════════════════════════════════════════════════════════════════
-- Diagnostic: Sangreza "No Government but 11 ministers" inconsistency
-- ═══════════════════════════════════════════════════════════════════════════════
-- Read-only. The Government Formation flow runs four ordered writes:
--   1. UPDATE government_formations (assignments + minister_names)
--   2. RPC finalize_government_formation — atomic: close old admin, insert
--      new admin, install HOG, mark formation 'formed', dissolve rivals,
--      reset gov_approval
--   3. createMinistriesFromAssignments — INSERT/UPDATE ministry rows
--   4. autoAppointPartyLeaderAsPM — JS-side PM install + pm_appointed
--      event_log
--
-- Original Sangreza diagnosis revealed the bug pattern was different:
-- the Cabinet panel was rendering stale rows from the previous Pacheco
-- admin (which closed at tick 49 but never had its ministry rows
-- vacated). See sql/oneoff/vacate_zombie_ministers_global.sql for the
-- cleanup. This script stays useful for any future "no government /
-- partial state" report — re-point it at the affected nation and run.
--
-- Schema notes captured during the diagnostic session:
--   - government_formations has no deadline_tick / formed_at_tick column;
--     the only timestamp is formed_at (timestamptz).
--   - government_formations has no prime_minister_party_id column; the PM
--     party_id lives inside ministry_assignments JSONB at the
--     'prime_minister' key.
--   - head_of_government uses appointed_tick (NOT appointed_at_tick).
--   - There is no public.coalitions table — coalition state is encoded
--     in government_formations.status.
--   - ministries uses party_id (NOT faction_id).
--
-- All sections use SELECT * where the column shape might drift, so the
-- script keeps working even if the schema evolves.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Nation context ────────────────────────────────────────────────────────
SELECT id, name, government_type, hos_election_method, public_approval, control,
       failed_formation_attempts
FROM public.nations
WHERE name = 'Sangreza';

-- ── 2. government_formations rows (every column) ─────────────────────────────
-- Every row for the nation. Look at status (active / dissolved / formed),
-- ministry_assignments JSONB, formed_at timestamp.
SELECT *
FROM public.government_formations
WHERE nation_id = (SELECT id FROM public.nations WHERE name = 'Sangreza')
ORDER BY created_at DESC;

-- ── 3. administrations (active admin = ended_at_tick IS NULL) ────────────────
SELECT *
FROM public.administrations
WHERE nation_id = (SELECT id FROM public.nations WHERE name = 'Sangreza')
ORDER BY started_at_tick DESC NULLS LAST, created_at DESC;

-- ── 4. head_of_government rows ───────────────────────────────────────────────
-- An active=true row is what the Executive panel reads.
SELECT *
FROM public.head_of_government
WHERE nation_id = (SELECT id FROM public.nations WHERE name = 'Sangreza')
ORDER BY appointed_tick DESC NULLS LAST;

-- ── 5. ministries — should match the Cabinet panel exactly ───────────────────
-- Group by party_id to confirm coalition splits. If rows are populated
-- here but no admin/HOG above, that's the zombie-cabinet pattern fixed
-- by vacate_zombie_ministers_global.sql.
SELECT
    m.id,
    m.ministry_key,
    m.party_id,
    f.faction_name,
    m.minister_first_name,
    m.minister_last_name,
    m.minister_approval,
    m.is_active,
    m.created_at
FROM public.ministries m
LEFT JOIN public.factions f ON f.id = m.party_id
WHERE m.nation_id = (SELECT id FROM public.nations WHERE name = 'Sangreza')
  AND m.is_active = true
ORDER BY m.ministry_key;

-- ── 6. event_log — last 30 form/HOG/admin/PM events ──────────────────────────
SELECT
    e.fired_at_tick,
    e.event_name,
    e.trigger_key,
    LEFT(e.description_used, 200) AS description_preview,
    e.created_at
FROM public.event_log e
WHERE e.nation_id = (SELECT id FROM public.nations WHERE name = 'Sangreza')
  AND (
       e.event_name ILIKE '%FORM%'
    OR e.event_name ILIKE '%HOG%'
    OR e.event_name ILIKE '%ADMIN%'
    OR e.event_name ILIKE '%PM%'
    OR e.event_name ILIKE '%COALITION%'
    OR e.trigger_key ILIKE '%form%'
    OR e.trigger_key ILIKE '%pm_appoint%'
  )
ORDER BY e.fired_at_tick DESC NULLS LAST, e.created_at DESC
LIMIT 30;
