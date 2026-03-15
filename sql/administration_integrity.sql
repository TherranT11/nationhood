-- Administration integrity hardening:
-- 1) Deduplicate legacy open rows
-- 2) Enforce one-open-admin invariant
-- 3) Provide atomic rollover RPC
-- 4) Expose diagnostics for monitoring

WITH ranked_open AS (
    SELECT
        a.id,
        a.nation_id,
        ROW_NUMBER() OVER (
            PARTITION BY a.nation_id
            ORDER BY a.started_at_tick DESC NULLS LAST, a.created_at DESC NULLS LAST, a.id DESC
        ) AS rn,
        COALESCE((SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), 0) AS dedupe_tick,
        COALESCE((SELECT current_date FROM shard WHERE name = 'Alpha Shard'), '') AS dedupe_date
    FROM administrations a
    WHERE a.ended_at_tick IS NULL
)
UPDATE administrations a
SET
    ended_at_tick = ro.dedupe_tick,
    ended_at_date = ro.dedupe_date,
    end_reason = COALESCE(a.end_reason, 'deduplicated_open_admin'),
    updated_at = now()
FROM ranked_open ro
WHERE a.id = ro.id
  AND ro.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_administration_per_nation
ON administrations(nation_id)
WHERE ended_at_tick IS NULL;

CREATE OR REPLACE FUNCTION rollover_administration(
    p_nation_id UUID,
    p_end_reason TEXT,
    p_end_tick INT,
    p_end_date TEXT,
    p_end_approval INT,
    p_new_administration JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_closed_count INT := 0;
    v_inserted_id UUID;
BEGIN
    UPDATE administrations
    SET
        stats_at_end = COALESCE(stats_at_end, '{}'::JSONB),
        approval_at_end = COALESCE(p_end_approval, approval_at_end),
        ended_at_tick = p_end_tick,
        ended_at_date = p_end_date,
        end_reason = p_end_reason,
        updated_at = now()
    WHERE nation_id = p_nation_id
      AND ended_at_tick IS NULL;

    GET DIAGNOSTICS v_closed_count = ROW_COUNT;

    INSERT INTO administrations (
        nation_id,
        admin_name,
        head_of_state,
        prime_minister,
        pm_party_name,
        pm_party_id,
        coalition_parties,
        total_seats,
        government_type,
        started_at_tick,
        started_at_date,
        stats_at_start,
        approval_at_start,
        head_of_state_title
    ) VALUES (
        (p_new_administration->>'nation_id')::UUID,
        p_new_administration->>'admin_name',
        p_new_administration->>'head_of_state',
        p_new_administration->>'prime_minister',
        p_new_administration->>'pm_party_name',
        NULLIF(p_new_administration->>'pm_party_id', '')::UUID,
        COALESCE(p_new_administration->'coalition_parties', '[]'::JSONB),
        COALESCE((p_new_administration->>'total_seats')::INT, 0),
        p_new_administration->>'government_type',
        COALESCE((p_new_administration->>'started_at_tick')::INT, p_end_tick),
        p_new_administration->>'started_at_date',
        COALESCE(p_new_administration->'stats_at_start', '{}'::JSONB),
        CASE
            WHEN p_new_administration ? 'approval_at_start' AND p_new_administration->>'approval_at_start' IS NOT NULL
            THEN (p_new_administration->>'approval_at_start')::INT
            ELSE NULL
        END,
        p_new_administration->>'head_of_state_title'
    )
    RETURNING id INTO v_inserted_id;

    RETURN jsonb_build_object(
        'success', true,
        'closed_count', v_closed_count,
        'inserted_id', v_inserted_id
    );
END;
$$;

CREATE OR REPLACE VIEW administration_integrity_diagnostics AS
WITH per_nation AS (
    SELECT
        n.id AS nation_id,
        n.name AS nation_name,
        COUNT(a.id) AS total_administrations,
        COUNT(*) FILTER (WHERE a.ended_at_tick IS NULL) AS open_administrations,
        MAX(a.started_at_tick) AS latest_started_at_tick
    FROM nations n
    LEFT JOIN administrations a ON a.nation_id = n.id
    GROUP BY n.id, n.name
)
SELECT
    nation_id,
    nation_name,
    total_administrations,
    open_administrations,
    latest_started_at_tick,
    CASE
        WHEN total_administrations = 0 THEN 'no_administration_rows'
        WHEN open_administrations > 1 THEN 'multiple_open_administrations'
        ELSE 'ok'
    END AS issue_type
FROM per_nation
WHERE total_administrations = 0
   OR open_administrations > 1;
