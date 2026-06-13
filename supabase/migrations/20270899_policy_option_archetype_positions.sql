-- ════════════════════════════════════════════════════════════════════
-- 20270899 — Per-policy-option archetype Support / Oppose positions
--
-- User spec (policyadmin.html): each unique policy option (Tax Haven,
-- Progressive Taxation, …) gains two author-declared archetype lists —
-- "Archetypes that support" and "Archetypes that oppose". They drive
-- how seated parties divide when that option is put to a floor vote
-- (committee_propose_policy_change → _open_policy_floor_vote):
--
--   • archetype on the Support list  → the party votes YES
--   • archetype on the Oppose list   → the party votes NO
--   • archetype on neither list      → the party rolls 1D2
--                                       (1 = YES, 2 = NO)
--
-- The 1D2 fallback already lives in _open_policy_floor_vote (20270892):
-- a party whose archetype maps to 0 lean takes random() < 0.5. So the
-- only behavioral change needed here is to feed derive_bill_stance the
-- explicit lists. When an option carries either list, the stance map
-- is built purely from them and the legacy stat_effects→archetype
-- inference (20270423) is skipped; options with no declared lists keep
-- the auto-derived behavior untouched.
--
-- Schema mirrors committee_proposals.support/oppose_archetypes
-- (20270686): NULL or a jsonb array of unique names drawn from
-- _archetype_catalog_names() (the 10-label movement-party catalog),
-- disjoint across the two lists. Unlike the committee variant there is
-- NO 2-entry cap — an admin may list any subset of the ten.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Columns ───────────────────────────────────────────────────
ALTER TABLE public.policy_options
    ADD COLUMN IF NOT EXISTS support_archetypes jsonb,
    ADD COLUMN IF NOT EXISTS oppose_archetypes  jsonb;

COMMENT ON COLUMN public.policy_options.support_archetypes IS
    'Author-declared list of archetype names whose seated parties vote YES when this option is proposed as a policy change. NULL or jsonb array of unique names from _archetype_catalog_names(). Disjoint from oppose_archetypes. Drives derive_bill_stance / _open_policy_floor_vote. 20270899.';
COMMENT ON COLUMN public.policy_options.oppose_archetypes IS
    'Author-declared list of archetype names whose seated parties vote NO when this option is proposed. Same shape and disjointness rules as support_archetypes. 20270899.';

-- ── 2. Validators (no entry cap, unlike the committee pair) ──────
-- Reuses _archetype_catalog_names() (20270686) as the single source
-- of truth for the ten allowed labels.
CREATE OR REPLACE FUNCTION public._validate_policy_archetype_array(p_arr jsonb)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_names text[];
BEGIN
    IF p_arr IS NULL THEN RETURN true; END IF;
    IF jsonb_typeof(p_arr) <> 'array' THEN RETURN false; END IF;

    SELECT array_agg(DISTINCT v) INTO v_names
      FROM jsonb_array_elements_text(p_arr) v;
    v_names := COALESCE(v_names, ARRAY[]::text[]);

    -- DISTINCT collapses dupes — a drop in cardinality means the raw
    -- array repeated a name.
    IF cardinality(v_names) <> jsonb_array_length(p_arr) THEN RETURN false; END IF;

    -- Every name must be in the canonical catalog.
    IF NOT (v_names <@ _archetype_catalog_names()) THEN RETURN false; END IF;

    RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public._validate_policy_archetype_pair(
    p_support jsonb, p_oppose jsonb
)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_sup text[];
    v_opp text[];
BEGIN
    IF NOT _validate_policy_archetype_array(p_support) THEN RETURN false; END IF;
    IF NOT _validate_policy_archetype_array(p_oppose)  THEN RETURN false; END IF;

    IF p_support IS NULL OR p_oppose IS NULL THEN RETURN true; END IF;

    SELECT array_agg(v) INTO v_sup FROM jsonb_array_elements_text(p_support) v;
    SELECT array_agg(v) INTO v_opp FROM jsonb_array_elements_text(p_oppose)  v;
    v_sup := COALESCE(v_sup, ARRAY[]::text[]);
    v_opp := COALESCE(v_opp, ARRAY[]::text[]);

    -- No archetype on both sides.
    IF v_sup && v_opp THEN RETURN false; END IF;

    RETURN true;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'policy_options_archetype_positions_valid'
    ) THEN
        ALTER TABLE public.policy_options
            ADD CONSTRAINT policy_options_archetype_positions_valid
            CHECK (_validate_policy_archetype_pair(support_archetypes, oppose_archetypes));
    END IF;
END $$;

-- ── 3. derive_bill_stance honors explicit positions ──────────────
-- When an option declares Support and/or Oppose archetypes, the stance
-- map is those alone (Support → +1, Oppose → -1); any archetype not
-- listed is left unmapped so the caller's 1D2 fallback fires. Options
-- with neither list fall through to the 20270423 stat_effects mapping.
CREATE OR REPLACE FUNCTION public.derive_bill_stance(p_option_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_effects jsonb;
    v_support jsonb;
    v_oppose  jsonb;
    v_acc     jsonb;
BEGIN
    SELECT stat_effects, support_archetypes, oppose_archetypes
      INTO v_effects, v_support, v_oppose
      FROM policy_options WHERE id = p_option_id;

    -- ── Explicit admin-declared positions (precedence) ───────────
    IF (jsonb_typeof(v_support) = 'array' AND jsonb_array_length(v_support) > 0)
       OR (jsonb_typeof(v_oppose) = 'array' AND jsonb_array_length(v_oppose) > 0) THEN
        SELECT COALESCE(jsonb_object_agg(archetype, lean), '{}'::jsonb)
          INTO v_acc
          FROM (
            SELECT v AS archetype, 1 AS lean
              FROM jsonb_array_elements_text(
                     CASE WHEN jsonb_typeof(v_support) = 'array'
                          THEN v_support ELSE '[]'::jsonb END) v
            UNION ALL
            SELECT v AS archetype, -1 AS lean
              FROM jsonb_array_elements_text(
                     CASE WHEN jsonb_typeof(v_oppose) = 'array'
                          THEN v_oppose ELSE '[]'::jsonb END) v
          ) s;
        RETURN COALESCE(v_acc, '{}'::jsonb);
    END IF;

    -- ── Legacy stat_effects → archetype inference (20270423) ─────
    IF v_effects IS NULL OR jsonb_typeof(v_effects) <> 'array' THEN
        RETURN '{}'::jsonb;
    END IF;

    WITH effects AS (
        SELECT e->>'stat_key' AS stat_key,
               CASE e->>'direction' WHEN 'up' THEN 1 WHEN 'down' THEN -1 ELSE 0 END AS sign
          FROM jsonb_array_elements(v_effects) e
    ),
    mapping(stat_key, archetype, multiplier) AS (VALUES
        ('income_tax',     'Social Democratic',           1),
        ('income_tax',     'Libertarian',                -1),
        ('welfare',        'Social Democratic',           1),
        ('welfare',        'Communist / Leftist',         1),
        ('welfare',        'Libertarian',                -1),
        ('health',         'Social Democratic',           1),
        ('health',         'Communist / Leftist',         1),
        ('health',         'Libertarian',                -1),
        ('education',      'Social Democratic',           1),
        ('education',      'Communist / Leftist',         1),
        ('education',      'Libertarian',                -1),
        -- inequality going DOWN is good for the left
        ('inequality',     'Communist / Leftist',        -1),
        ('inequality',     'Social Democratic',          -1),
        ('inequality',     'Libertarian',                 1),
        ('civil_freedoms', 'Liberal',                     1),
        ('civil_freedoms', 'Traditional Conservative',   -1),
        ('civil_freedoms', 'Green',                       1),
        ('immigration',    'Liberal',                     1),
        ('immigration',    'Nationalist',                -1),
        ('immigration',    'Populist',                   -1)
    ),
    contributions AS (
        SELECT m.archetype, SUM(e.sign * m.multiplier) AS raw
          FROM effects e
          JOIN mapping m USING (stat_key)
         WHERE e.sign <> 0
         GROUP BY m.archetype
    )
    SELECT COALESCE(jsonb_object_agg(archetype,
                CASE WHEN raw > 0 THEN 1 WHEN raw < 0 THEN -1 ELSE 0 END),
             '{}'::jsonb)
      INTO v_acc
      FROM contributions
     WHERE raw <> 0;

    RETURN COALESCE(v_acc, '{}'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.derive_bill_stance(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
