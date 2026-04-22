-- Cleanup: release corp_equipment that's stuck deployed to completed /
-- cancelled / defaulted / expired construction contracts.
--
-- Context: prior to the 2026-04-23 tick-processor fix, completing a
-- contract did NOT release equipment from corp_equipment.assigned_projects
-- or decrement the deployed count. Equipment stayed "in use" on the finished
-- project forever, preventing redeployment to new contracts.
--
-- Symptom: corp shows Required 5 / Owned 5 / Available 0 with no obvious
-- way to undeploy (reported by Vanttol Group / Melizea at tick 21).
--
-- This migration walks every corp_equipment row, drops assigned_projects
-- entries pointing at terminated contracts, and decrements deployed by
-- the corresponding unit counts. Safe to re-run — idempotent.
--
-- After this runs, any corp with stuck equipment gets their Available
-- count back to (owned - deployed on ACTIVE contracts only).

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
