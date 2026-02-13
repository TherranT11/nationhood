-- One-time data migration: normalize policies.stat_effects[*].direction to lowercase up/down.
-- Run this in Supabase SQL editor.

WITH rewritten AS (
    SELECT
        p.id,
        jsonb_agg(
            CASE
                WHEN lower(eff->>'direction') IN ('up', 'down')
                    THEN jsonb_set(eff, '{direction}', to_jsonb(lower(eff->>'direction')), true)
                ELSE eff
            END
            ORDER BY ord
        ) AS new_stat_effects
    FROM policies p
    CROSS JOIN LATERAL jsonb_array_elements(p.stat_effects) WITH ORDINALITY AS elems(eff, ord)
    WHERE p.stat_effects IS NOT NULL
      AND jsonb_typeof(p.stat_effects) = 'array'
      AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p.stat_effects) se
          WHERE se ? 'direction'
            AND se->>'direction' <> lower(se->>'direction')
            AND lower(se->>'direction') IN ('up', 'down')
      )
    GROUP BY p.id
)
UPDATE policies p
SET stat_effects = r.new_stat_effects
FROM rewritten r
WHERE p.id = r.id;
