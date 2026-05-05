-- ═══════════════════════════════════════════════════════════════════════════════
-- Diagnostic: Sangreza "No Government but 11 ministers" inconsistency
-- ═══════════════════════════════════════════════════════════════════════════════
-- Read-only. The Government Formation flow runs four ordered writes:
--   1. UPDATE government_formations (assignments + minister_names)
--   2. RPC finalize_government_formation — atomic: close old admin, insert
--      new admin, install HOG, mark formation 'formed', dissolve rivals,
--      reset gov_approval
--   3. createMinistriesFromAssignments — INSERT ministry rows
--   4. autoAppointPartyLeaderAsPM — JS-side ministry write + pm_appointed
--      event_log
--
-- The recent ideology ReferenceError (now fixed) crashed in step 4's
-- return statement AFTER ministries had been written. Sangreza is most
-- likely residue from one of those pre-fix attempts. This script reads
-- every table the Administrative panel consults so we can see exactly
-- which of {administrations, head_of_government, government_formations,
-- ministries, coalitions} got partial writes.
--
-- Sections:
--   1. Nation row (sanity check + context)
--   2. government_formations — every row for Sangreza, status + assignments
--   3. administrations — open + recently closed admins
--   4. head_of_government — active + inactive HOG rows
--   5. coalitions — active + recent
--   6. ministries — every row, with faction names attached
--   7. event_log — last 30 form/HOG/admin events for the nation
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Nation context ────────────────────────────────────────────────────────
SELECT id, name, government_type, hos_election_method, public_approval, control,
       failed_formation_attempts
FROM public.nations
WHERE name = 'Sangreza';

-- ── 2. government_formations rows ────────────────────────────────────────────
-- The PM party isn't a top-level column on this table — it lives inside
-- ministry_assignments JSONB at the 'prime_minister' key. Surface it
-- explicitly so we can see who the formation thinks the PM is.
SELECT
    id, status, party_ids,
    ministry_assignments,
    minister_names,
    ministry_assignments->>'prime_minister' AS pm_party_id,
    started_at_tick, ended_at_tick, deadline_tick, formed_at_tick,
    created_at
FROM public.government_formations
WHERE nation_id = (SELECT id FROM public.nations WHERE name = 'Sangreza')
ORDER BY created_at DESC
LIMIT 5;

-- ── 3. administrations ───────────────────────────────────────────────────────
-- Active = ended_at_tick IS NULL. The Administrative panel's "No Government"
-- card means there's no row matching that filter (or the join to factions
-- fails). Closed admins included for context — if the only admin is closed,
-- finalize_government_formation never inserted the new one.
SELECT
    a.id,
    a.administration_type,
    a.governing_faction_id,
    f.faction_name AS governing_party,
    a.started_at_tick,
    a.ended_at_tick,
    a.end_reason,
    a.coalition_id,
    a.created_at
FROM public.administrations a
LEFT JOIN public.factions f ON f.id = a.governing_faction_id
WHERE a.nation_id = (SELECT id FROM public.nations WHERE name = 'Sangreza')
ORDER BY a.started_at_tick DESC NULLS LAST, a.created_at DESC
LIMIT 10;

-- ── 4. head_of_government rows ───────────────────────────────────────────────
-- An "active=true" row is what the Executive panel reads. If the cabinet
-- shows ministers but no Executive data, the HOG insert failed or got
-- deactivated before the page loaded.
SELECT
    hog.id,
    hog.faction_id,
    f.faction_name AS pm_party,
    hog.first_name,
    hog.last_name,
    hog.active,
    hog.appointed_at_tick,
    hog.deactivated_at_tick,
    hog.reason
FROM public.head_of_government hog
LEFT JOIN public.factions f ON f.id = hog.faction_id
WHERE hog.nation_id = (SELECT id FROM public.nations WHERE name = 'Sangreza')
ORDER BY hog.appointed_at_tick DESC NULLS LAST
LIMIT 10;

-- ── 5. coalitions ────────────────────────────────────────────────────────────
-- The Coalition card on the Administrative panel reads the active coalition.
-- "None" means no row with status IN ('formed','active','caretaker').
-- to_jsonb(c.*) emits every column whatever the schema looks like — saves
-- another guessing-game on column names.
SELECT to_jsonb(c.*) AS row_data
FROM public.coalitions c
WHERE c.nation_id = (SELECT id FROM public.nations WHERE name = 'Sangreza')
ORDER BY c.created_at DESC
LIMIT 5;

-- ── 6. ministries — should match the 11 cabinet rows on the page ─────────────
-- Group by faction_id to confirm party assignments. If 11 rows here but
-- no admin/HOG/coalition above, that's the smoking gun: createMinistriesFromAssignments
-- ran but its prerequisite atomic RPC didn't (or got rolled back later).
SELECT
    m.id,
    m.ministry_key,
    m.faction_id,
    f.faction_name,
    m.minister_first_name,
    m.minister_last_name,
    m.minister_approval,
    m.appointed_at_tick,
    m.is_active
FROM public.ministries m
LEFT JOIN public.factions f ON f.id = m.faction_id
WHERE m.nation_id = (SELECT id FROM public.nations WHERE name = 'Sangreza')
  AND m.is_active = true
ORDER BY m.ministry_key;

-- ── 7. event_log — last form/HOG/admin events ───────────────────────────────
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
