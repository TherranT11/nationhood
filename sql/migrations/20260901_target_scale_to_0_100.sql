-- ═══════════════════════════════════════════════════════════════════════════════
-- TARGET-BASED POLICIES — switch stat target scale from 0..10 to 0..100
-- ═══════════════════════════════════════════════════════════════════════════════
-- The original stat_targets domain was 0..10 (displayed scale) and the
-- engine multiplied by 10 to land on the 0..100 nation-stat scale at apply
-- time. Authors found that confusing because the stat columns they actually
-- see in-game (gov_approval, standard_of_living, etc.) are 0..100. This
-- migration moves the source-of-truth scale to 0..100 and migrates every
-- existing policy_options.stat_targets[i].target value by ×10 so the
-- rewritten engine produces the same equilibria as before.
--
-- Companion code changes (same commit):
--   - js/game/policies.js drops TARGET_STAT_SCALE and uses raw target.
--   - policyadmin.html slider becomes 0..100 step 1, default 50, with
--     updated colour thresholds (≥70 green, ≤30 red).
--   - laws.html chips render the integer instead of one decimal place.
--
-- Also refreshes the comment on sector_turnout_targets to match the new
-- −1.00..+0.30 range introduced alongside this migration.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Migrate stat_targets[i].target ×10 inside the JSONB array.
--    LEAST/GREATEST keep the result inside [0, 100] in case any value was
--    already on the new scale (defensive; pre-migration storage should
--    only contain 0..10 floats).
UPDATE public.policy_options
SET stat_targets = sub.next_targets
FROM (
    SELECT
        po.id,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_set(
                        elem,
                        '{target}',
                        to_jsonb(
                            LEAST(100, GREATEST(0,
                                ROUND( (NULLIF(elem->>'target','')::numeric) * 10 )::int
                            ))
                        )
                    )
                    ORDER BY ord
                )
                FROM jsonb_array_elements(po.stat_targets) WITH ORDINALITY AS arr(elem, ord)
            ),
            '[]'::jsonb
        ) AS next_targets
    FROM public.policy_options po
    WHERE jsonb_typeof(po.stat_targets) = 'array'
      AND jsonb_array_length(po.stat_targets) > 0
) AS sub
WHERE public.policy_options.id = sub.id;

-- 2. Refresh column comments so the schema doc matches the new ranges.
COMMENT ON COLUMN public.policy_options.stat_targets IS
    'Target-based stat effects. JSONB array of {stat_key: text, target: integer 0-100, pull: number 0-1}. Engine (Phase 3) computes weighted equilibrium per stat across all active target-based options in a nation. Target shares the 0-100 scale with the nation stat columns. Coexists with legacy stat_effects until Phase 5.';

COMMENT ON COLUMN public.policy_options.sector_turnout_targets IS
    'Per-sector turnout modifiers. JSONB array of {sector_key: text, delta: number -1.00..+0.30}. Engine reads at election time and adds each delta to sectors.base_turnout for the matching sector while this option is active. Negative leg is wider so a strong delta can fully suppress a bloc. Empty array = no turnout effect.';

NOTIFY pgrst, 'reload schema';

COMMIT;
