-- ════════════════════════════════════════════════════════════════
-- ALL POLICIES → TARGET-BASED. DROP THE LEGACY stat_effects MODEL.
--
-- Until now only the 10 tax options were target-based
-- (20270117). Every other policy_option ran the legacy
-- rate/direction/duration DECAY model (processStatEffects in
-- political-actions.js): a transient drift that never pins a stat
-- to a value, so an enacted policy's intent silently faded after
-- duration_ticks. The bill-article view also rendered NO effect
-- chips for legacy options (articleTargetEffectsHtml gates on
-- is_target_based), which is the bug that surfaced this work
-- ("Balanced Justice shows no stat effects on the bill though
-- policyadmin shows them").
--
-- This migration converts EVERY policy_option's legacy stat_effects
-- into target-based stat_targets, flips is_target_based, and empties
-- stat_effects. With stat_effects empty the legacy policy branch of
-- processStatEffects short-circuits (effects.length === 0 → no-op),
-- so the legacy policy engine goes inert WITHOUT touching tick code.
-- processStatEffects itself stays — it still serves reversals
-- (active_laws.reversal_effects) and foundational single-stat laws
-- (policies.target_stat), which are NOT policy options and must keep
-- working. processStatDecay (natural decay + foundational caps) is
-- likewise untouched.
--
-- TRANSLATION RULE (deterministic — derived from the authored data,
-- nothing invented; user-approved):
--     sign   = +1 for direction up/increase, -1 for down/decrease
--     target = clamp(0,100, round(50 + sign × rate × 50))
--     pull   = clamp(0.05, 1.0, rate)
-- A strong legacy effect (rate 1.0) becomes an extreme attractor
-- (target 0 or 100) with maximum weight; a weak one (rate 0.1)
-- barely leaves neutral (45/55) with light weight. This mirrors the
-- tax convention already in the repo (strong = near-rail, pull→1.0)
-- and preserves the relative ordering the policy authors encoded.
--
-- RAW-SCALE STATS DROPPED (user-approved): budget, population,
-- eligible_voters, debt are skipped — the target engine
-- deliberately ignores them (TARGET_BASED_STAT_SKIP /
-- STAT_PROCESSOR_SKIP), so emitting a target for them would be a
-- dead chip that lies about effect. Budget remains driven by the
-- tax/spending systems, not policy drift.
--
-- Curated stat_targets win: for any stat_key already present in an
-- option's stat_targets (the hand-tuned tax targets from 20270117),
-- the derived entry is NOT added — the curated value is preserved
-- and its secondary legacy effects are converted around it.
--
-- Idempotent: after the run stat_effects is '[]' everywhere, so the
-- derive CTE explodes nothing on re-run, the curated-wins guard
-- prevents duplicate targets, and the universal sweep is a no-op.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Convert legacy stat_effects → derived stat_targets ────────
WITH derived AS (
    SELECT
        po.id AS opt_id,
        jsonb_agg(jsonb_build_object(
            'stat_key', d.stat_key,
            'target',   GREATEST(0, LEAST(100, ROUND(50 + d.sign * d.rate * 50)))::int,
            'pull',     ROUND(LEAST(1.0, GREATEST(0.05, d.rate)), 2)
        )) AS new_targets
    FROM policy_options po
    CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(po.stat_effects) = 'array'
             THEN po.stat_effects ELSE '[]'::jsonb END
    ) e
    CROSS JOIN LATERAL (
        SELECT
            e->>'stat_key' AS stat_key,
            CASE
                WHEN lower(btrim(e->>'direction')) IN ('up','increase','rise','raise','positive','+')   THEN  1
                WHEN lower(btrim(e->>'direction')) IN ('down','decrease','fall','lower','negative','-')  THEN -1
                ELSE 0
            END AS sign,
            CASE
                WHEN (e->>'rate') ~ '^-?[0-9]+(\.[0-9]+)?$'
                THEN abs((e->>'rate')::numeric)
                ELSE 1.0
            END AS rate
    ) d
    WHERE d.stat_key IS NOT NULL
      AND d.stat_key NOT IN ('budget','population','eligible_voters','debt')
      AND d.sign <> 0
      -- curated stat_targets (e.g. tax) win — don't add a derived dup
      AND NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(
              CASE WHEN jsonb_typeof(po.stat_targets) = 'array'
                   THEN po.stat_targets ELSE '[]'::jsonb END
          ) t
          WHERE t->>'stat_key' = d.stat_key
      )
    GROUP BY po.id
)
UPDATE policy_options po SET
    stat_targets = COALESCE(
        CASE WHEN jsonb_typeof(po.stat_targets) = 'array'
             THEN po.stat_targets ELSE '[]'::jsonb END, '[]'::jsonb
    ) || d.new_targets
FROM derived d
WHERE po.id = d.opt_id;

-- ── 2. Universal sweep: every option is target-based; legacy gone ─
-- (Options whose only effects were raw-scale stats keep whatever
-- stat_targets they have — possibly none, i.e. a deliberate no-op.)
UPDATE policy_options SET
    is_target_based = true,
    stat_effects    = '[]'::jsonb
WHERE is_target_based IS DISTINCT FROM true
   OR stat_effects IS DISTINCT FROM '[]'::jsonb;

-- ── 3. Verify ───────────────────────────────────────────────────
DO $$
DECLARE
    v_legacy   int;
    v_noop     int;
    v_total    int;
BEGIN
    SELECT count(*) INTO v_total FROM policy_options;
    SELECT count(*) INTO v_legacy FROM policy_options
     WHERE is_target_based IS DISTINCT FROM true
        OR jsonb_array_length(COALESCE(stat_effects,'[]'::jsonb)) > 0;
    SELECT count(*) INTO v_noop FROM policy_options
     WHERE COALESCE(jsonb_array_length(stat_targets), 0) = 0;
    RAISE NOTICE 'policy_options total: %, still legacy (expect 0): %, no-op (empty stat_targets, for review): %',
        v_total, v_legacy, v_noop;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
