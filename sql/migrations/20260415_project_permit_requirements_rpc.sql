-- ════════════════════════════════════════════════════════════════════════════════
-- RPC: get_project_permit_requirements
--
-- Returns permit requirements for a specific construction project + corporation.
-- Requirements are derived from active laws in the project's nation and filtered
-- by the project's sector using construction_permits.required_for.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_project_permit_requirements(
    p_contract_id UUID,
    p_faction_id UUID,
    p_nation_id UUID
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    WITH project_contract AS (
        SELECT c.id, c.nation_id, c.sector
        FROM construction_contracts c
        WHERE c.id = p_contract_id
          AND c.nation_id = p_nation_id
        LIMIT 1
    ),
    required_permits AS (
        SELECT DISTINCT
            cp.permit_key,
            cp.name AS permit_name,
            pol.policy_name AS required_by_policy
        FROM project_contract pc
        JOIN active_laws al
            ON al.nation_id = pc.nation_id
        JOIN policies pol
            ON pol.id = al.policy_id
           AND pol.permit_key IS NOT NULL
        JOIN construction_permits cp
            ON cp.permit_key = pol.permit_key
           AND cp.required_for @> to_jsonb(ARRAY[pc.sector])
    ),
    requirement_with_status AS (
        SELECT
            rp.permit_key,
            rp.permit_name,
            rp.required_by_policy,
            EXISTS (
                SELECT 1
                FROM corp_permits corp
                WHERE corp.faction_id = p_faction_id
                  AND corp.nation_id = p_nation_id
                  AND corp.permit_key = rp.permit_key
                  AND corp.status = 'active'
            ) AS has_permit
        FROM required_permits rp
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'permit_key', rws.permit_key,
                'permit_name', rws.permit_name,
                'required_by_policy', rws.required_by_policy,
                'has_permit', rws.has_permit,
                'status_label', CASE WHEN rws.has_permit THEN 'HAS_PERMIT' ELSE 'NEEDS_TO_GET' END
            )
            ORDER BY rws.permit_name
        ),
        '[]'::jsonb
    )
    FROM requirement_with_status rws;
$$;

ALTER FUNCTION get_project_permit_requirements(UUID, UUID, UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_project_permit_requirements(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_permit_requirements(UUID, UUID, UUID) TO service_role;

CREATE INDEX IF NOT EXISTS idx_active_laws_nation_id ON active_laws(nation_id);
CREATE INDEX IF NOT EXISTS idx_corp_permits_faction_nation_permit_status
    ON corp_permits(faction_id, nation_id, permit_key, status);
