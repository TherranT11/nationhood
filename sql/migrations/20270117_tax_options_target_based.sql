-- ════════════════════════════════════════════════════════════════
-- Re-author the Income Tax + Corporate Taxation options as
-- target-based, and backfill live nations.
--
-- THE BUG: every tax option was authored (20261223 backfill) as a
-- weak, transient legacy stat_effects DECAY — e.g. Tax Haven was
-- corporate_tax {direction:down, rate:1.0, duration_ticks:48}. That
-- nudges the rate ~1/tick for 48 ticks then STOPS; it never pins the
-- rate. Result: an enacted "Tax Haven" leaves a nation at whatever
-- corporate_tax it had (Avelia stuck at 92%), the opposite of the
-- policy's intent. processStatEffects/decay was the only thing
-- touching the tax stat and it has no authoritative target.
--
-- THE FIX: the per-option rate becomes the single source of truth as
-- a stat_targets entry; is_target_based=true so
-- processTargetBasedPolicies pins nations.<tax> to it. The
-- corporate_tax/income_tax element is removed from stat_effects so
-- the legacy decay no longer fights the target — but every OTHER
-- (secondary) stat_effect (immigration, gdp_growth, inequality,
-- budget, industry, …) is kept verbatim, because processStatEffects
-- (political-actions.js) does NOT filter on is_target_based and keeps
-- applying them. A one-time backfill snaps already-running nations to
-- their enacted option's rate instead of waiting for slow
-- convergence.
--
-- Targets (0–100, the live column scale per 20261209). Corporate
-- values are the documented design intent from 20261131; income
-- values per product decision (0/25/55/75/90, pull 1.0).
--
-- Idempotent: the policy_options UPDATE strips any existing tax
-- stat_targets/stat_effects element before re-adding the canonical
-- one; the nation backfill reads each nation's CURRENT enacted option
-- so re-running simply re-syncs to whatever is enacted now (never
-- corrupts a nation that legitimately switched policy).
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Re-author the 10 tax options ──────────────────────────────
WITH m(opt_id, tax_key, tgt) AS (VALUES
    -- Corporate Taxation
    ('a149e203-c42b-45d5-af23-3b342e14fbe3'::uuid, 'corporate_tax', 10),  -- Tax Haven
    ('1ef33bba-7157-4c9a-b36c-5267c4f61010'::uuid, 'corporate_tax', 30),  -- Pro-Business Low Tax
    ('99429608-a10b-4a84-8861-0606dbd89c1f'::uuid, 'corporate_tax', 50),  -- Standard Rate
    ('01fb8791-b03c-42f8-b05a-d1d390e945f1'::uuid, 'corporate_tax', 70),  -- Progressive Corporate Tax
    ('ed338045-29c0-4395-b0b3-04afc3361aae'::uuid, 'corporate_tax', 90),  -- Heavy Taxation (Corporate)
    -- Income Tax
    ('5ef87ea2-4956-44c6-ba49-ddaebe3e9902'::uuid, 'income_tax',     0),  -- No Income Tax
    ('bf35ddfd-d3de-49df-84ef-3e6dc4b3939e'::uuid, 'income_tax',    25),  -- Flat Low Tax
    ('f2881ff0-7985-48de-9fff-492b0aed1a58'::uuid, 'income_tax',    55),  -- Progressive Taxation
    ('921888de-f6a6-417d-88f6-6b0ac43f66cd'::uuid, 'income_tax',    75),  -- Steeply Progressive
    ('4c55cd65-409c-4ffa-9aac-1317b13a9dd8'::uuid, 'income_tax',    90)   -- Heavy Taxation (Income Tax)
)
UPDATE public.policy_options po SET
    is_target_based = true,
    -- keep every non-tax stat_effect; drop only the tax element
    stat_effects = COALESCE((
        SELECT jsonb_agg(e)
        FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(po.stat_effects) = 'array' THEN po.stat_effects ELSE '[]'::jsonb END
        ) e
        WHERE e->>'stat_key' <> m.tax_key
    ), '[]'::jsonb),
    -- canonical tax target is the single source of truth (pull 1.0)
    stat_targets = COALESCE((
        SELECT jsonb_agg(t)
        FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(po.stat_targets) = 'array' THEN po.stat_targets ELSE '[]'::jsonb END
        ) t
        WHERE t->>'stat_key' <> m.tax_key
    ), '[]'::jsonb)
    || jsonb_build_array(jsonb_build_object(
        'stat_key', m.tax_key, 'target', m.tgt, 'pull', 1.0
    ))
FROM m
WHERE po.id = m.opt_id;

-- ── 2. Backfill corporate_tax for nations on a Corporate option ──
WITH mc(opt_id, tgt) AS (VALUES
    ('a149e203-c42b-45d5-af23-3b342e14fbe3'::uuid, 10),
    ('1ef33bba-7157-4c9a-b36c-5267c4f61010'::uuid, 30),
    ('99429608-a10b-4a84-8861-0606dbd89c1f'::uuid, 50),
    ('01fb8791-b03c-42f8-b05a-d1d390e945f1'::uuid, 70),
    ('ed338045-29c0-4395-b0b3-04afc3361aae'::uuid, 90)
)
UPDATE public.nations n SET corporate_tax = mc.tgt
FROM public.active_laws al
JOIN mc ON mc.opt_id = al.selected_option_id
WHERE al.nation_id = n.id;

-- ── 3. Backfill income_tax for nations on an Income option ───────
WITH mi(opt_id, tgt) AS (VALUES
    ('5ef87ea2-4956-44c6-ba49-ddaebe3e9902'::uuid,  0),
    ('bf35ddfd-d3de-49df-84ef-3e6dc4b3939e'::uuid, 25),
    ('f2881ff0-7985-48de-9fff-492b0aed1a58'::uuid, 55),
    ('921888de-f6a6-417d-88f6-6b0ac43f66cd'::uuid, 75),
    ('4c55cd65-409c-4ffa-9aac-1317b13a9dd8'::uuid, 90)
)
UPDATE public.nations n SET income_tax = mi.tgt
FROM public.active_laws al
JOIN mi ON mi.opt_id = al.selected_option_id
WHERE al.nation_id = n.id;

COMMIT;
