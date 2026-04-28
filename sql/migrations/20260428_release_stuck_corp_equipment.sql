-- Cleanup: release corp_equipment that's stuck deployed to completed /
-- cancelled / defaulted / expired construction contracts.
--
-- Re-run of the 2026-04-23 cleanup. Same bug surfaced again because the
-- CLIENT-SIDE deliverProject() in corp-operations.html marked contracts
-- completed without running the release block — only the backend
-- auto-completion path did. Vanttol Group / Melizea reported equipment
-- stuck on a delivered Dry Dock at tick 34.
--
-- The client-side fix lands in the same commit as this migration. This
-- script only needs to clean existing stuck rows; idempotent — safe to
-- re-run any time.

UPDATE corp_equipment ce
   SET assigned_projects = coalesce((
           SELECT jsonb_agg(a)
             FROM jsonb_array_elements(ce.assigned_projects) a
            WHERE (a->>'contract_id')::uuid NOT IN (
                SELECT id FROM construction_contracts
                 WHERE status IN ('completed', 'cancelled', 'defaulted', 'expired', 'failed')
            )
       ), '[]'::jsonb),
       deployed = GREATEST(0, ce.deployed - coalesce((
           SELECT SUM((a->>'units')::int)
             FROM jsonb_array_elements(ce.assigned_projects) a
            WHERE (a->>'contract_id')::uuid IN (
                SELECT id FROM construction_contracts
                 WHERE status IN ('completed', 'cancelled', 'defaulted', 'expired', 'failed')
            )
       ), 0))
 WHERE ce.assigned_projects IS NOT NULL
   AND ce.assigned_projects != '[]'::jsonb
   AND EXISTS (
       SELECT 1
         FROM jsonb_array_elements(ce.assigned_projects) a
        WHERE (a->>'contract_id')::uuid IN (
            SELECT id FROM construction_contracts
             WHERE status IN ('completed', 'cancelled', 'defaulted', 'expired', 'failed')
        )
   );

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFY — Vanttol Group's equipment should show Available > 0
-- ═══════════════════════════════════════════════════════════════════════
SELECT
    f.faction_name     AS corp,
    ce.equipment_key,
    ce.owned,
    ce.deployed,
    (ce.owned - ce.deployed) AS available,
    jsonb_array_length(ce.assigned_projects) AS active_assignments
FROM corp_equipment ce
JOIN factions f ON f.id = ce.faction_id
WHERE f.faction_name = 'Vanttol Group'
ORDER BY ce.equipment_key;
