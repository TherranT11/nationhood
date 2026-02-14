-- One-time data migration: normalize additional legacy stat_key aliases in policies.stat_effects.
-- Run this in Supabase SQL editor.

WITH rewritten AS (
    SELECT
        p.id,
        jsonb_agg(
            CASE
                WHEN eff->>'stat_key' = 'intl_reputation'
                    THEN jsonb_set(eff, '{stat_key}', '"international_reputation"'::jsonb, false)
                WHEN eff->>'stat_key' = 'credit_rating'
                    THEN jsonb_set(eff, '{stat_key}', '"credit"'::jsonb, false)
                WHEN eff->>'stat_key' = 'credit_score'
                    THEN jsonb_set(eff, '{stat_key}', '"credit"'::jsonb, false)
                WHEN eff->>'stat_key' = 'trade'
                    THEN jsonb_set(eff, '{stat_key}', '"trade_balance"'::jsonb, false)
                WHEN eff->>'stat_key' = 'trade_volume'
                    THEN jsonb_set(eff, '{stat_key}', '"trade_balance"'::jsonb, false)
                WHEN eff->>'stat_key' = 'education'
                    THEN jsonb_set(eff, '{stat_key}', '"higher_education"'::jsonb, false)
                WHEN eff->>'stat_key' = 'education_quality'
                    THEN jsonb_set(eff, '{stat_key}', '"higher_education"'::jsonb, false)
                WHEN eff->>'stat_key' = 'military_strength'
                    THEN jsonb_set(eff, '{stat_key}', '"stability"'::jsonb, false)
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
          WHERE se->>'stat_key' IN (
              'intl_reputation',
              'credit_rating',
              'credit_score',
              'trade',
              'trade_volume',
              'education',
              'education_quality',
              'military_strength'
          )
      )
    GROUP BY p.id
)
UPDATE policies p
SET stat_effects = r.new_stat_effects
FROM rewritten r
WHERE p.id = r.id;
