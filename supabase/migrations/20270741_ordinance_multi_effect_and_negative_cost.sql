-- ════════════════════════════════════════════════════════════════════
-- 20270741 — Ordinances: multi-stat effects + negative cost
--
-- Two design changes the user asked for after seeing the V1
-- foundation:
--
--   1. An ordinance should be able to move MORE THAN ONE stat per
--      pass. The 20270739 schema only carried (stat_key, stat_delta)
--      — a single key/delta pair. Replaced with a stat_effects
--      jsonb array of {key, delta} objects so a single ordinance
--      can read e.g. "Pollution DOWN 1, Growth UP 2."
--
--   2. Cost should allow NEGATIVE values. Negative cost means the
--      ordinance pays the city's budget on pass (think: federal
--      grant, lawsuit settlement). The old CHECK was BETWEEN
--      0 AND 100; new is -100..100.
--
-- Rules for stat_effects (validated client-side + in the create
-- RPC):
--   • Each element: { "key": <one of 9 city stat keys>,
--                     "delta": -10..10 (signed int) }
--   • At most one effect per key — duplicates would just sum at
--     resolution but the UI would let the player author
--     contradictory rows. Reject on the server.
--   • Empty array is allowed for "vibes only" ordinances — the
--     cost/popularity/Experience effects still land at resolution,
--     just no stat moves.
--
-- Forward-only: existing rows on the catalog get migrated into
-- the new shape (single-row jsonb). Old columns dropped after.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. cost CHECK: widen to -100..100 ───────────────────────────────
ALTER TABLE public.ordinances
    DROP CONSTRAINT IF EXISTS ordinances_cost_check;

ALTER TABLE public.ordinances
    ADD CONSTRAINT ordinances_cost_check CHECK (cost BETWEEN -100 AND 100);


-- ── 2. Add stat_effects, backfill from (stat_key, stat_delta) ───────
ALTER TABLE public.ordinances
    ADD COLUMN IF NOT EXISTS stat_effects jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: each existing row's (stat_key, stat_delta) → single-row
-- jsonb array. Run before the column drops so we don't lose data.
UPDATE public.ordinances
   SET stat_effects = jsonb_build_array(
       jsonb_build_object('key', stat_key, 'delta', stat_delta)
   )
 WHERE stat_key IS NOT NULL
   AND jsonb_array_length(stat_effects) = 0;


-- ── 3. Drop the old single-effect columns ───────────────────────────
ALTER TABLE public.ordinances
    DROP COLUMN IF EXISTS stat_key,
    DROP COLUMN IF EXISTS stat_delta;


-- ── 4. Re-emit create_ordinance with the new shape ──────────────────
-- Signature change — drop the old function first. New p_stat_effects
-- is a jsonb array; validation walks each element. PARTY_ARCHETYPES
-- + 9-stat allowlist still mirror the JS canonical lists (already-
-- filed mirrors in the 20270739 audit).
DROP FUNCTION IF EXISTS public.create_ordinance(uuid, text, text, int, text[], text[], text, int);

CREATE OR REPLACE FUNCTION public.create_ordinance(
    p_faction_id        uuid,
    p_name              text,
    p_description       text,
    p_cost              int,
    p_support_archetypes text[],
    p_oppose_archetypes  text[],
    p_stat_effects      jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_id        uuid;
    v_name      text;
    v_desc      text;
    v_support   text[];
    v_oppose    text[];
    v_overlap   int;
    v_effects   jsonb := '[]'::jsonb;
    v_eff       jsonb;
    v_key       text;
    v_delta     int;
    v_seen_keys text[] := ARRAY[]::text[];
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office NOT IN
       ('mayor', 'city_council_member', 'city_council_president') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_office');
    END IF;

    v_name := btrim(COALESCE(p_name, ''));
    v_desc := btrim(COALESCE(p_description, ''));
    IF length(v_name) < 1 OR length(v_name) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF length(v_desc) < 1 OR length(v_desc) > 400 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_description');
    END IF;
    -- 20270741: cost can be negative (ordinance PAYS the city on pass).
    IF p_cost IS NULL OR p_cost < -100 OR p_cost > 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_cost');
    END IF;

    -- Archetypes — same normalisation as 20270739: dedupe non-empty,
    -- reject anything outside the canonical 10, reject support/oppose
    -- overlap.
    v_support := ARRAY(SELECT DISTINCT a FROM unnest(COALESCE(p_support_archetypes, ARRAY[]::text[])) a
                       WHERE btrim(a) <> '');
    v_oppose  := ARRAY(SELECT DISTINCT a FROM unnest(COALESCE(p_oppose_archetypes,  ARRAY[]::text[])) a
                       WHERE btrim(a) <> '');
    IF EXISTS (
        SELECT 1 FROM unnest(v_support || v_oppose) a
         WHERE a NOT IN (
             'Reform', 'Social Democratic', 'Traditional Conservative',
             'Liberal', 'Libertarian', 'Communist / Leftist',
             'Green', 'Nationalist', 'Populist', 'Centrist'
         )
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_archetype');
    END IF;
    SELECT count(*) INTO v_overlap FROM unnest(v_support) s
     WHERE s = ANY(v_oppose);
    IF v_overlap > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'archetype_overlap');
    END IF;

    -- 20270741: stat_effects validation. Each element must be
    -- {key, delta} with key in the 9-stat allowlist + delta in
    -- -10..10. At most one effect per key — duplicates rejected
    -- since they'd let the form author contradictory rows.
    IF p_stat_effects IS NULL OR jsonb_typeof(p_stat_effects) <> 'array' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_stat_effects');
    END IF;
    FOR v_eff IN SELECT * FROM jsonb_array_elements(p_stat_effects)
    LOOP
        IF jsonb_typeof(v_eff) <> 'object' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_stat_effects');
        END IF;
        v_key   := v_eff->>'key';
        v_delta := (v_eff->>'delta')::int;
        IF v_key IS NULL OR v_key NOT IN (
            'infrastructure', 'appeal', 'growth', 'crime', 'approval',
            'pollution', 'jobs', 'services', 'affordability'
        ) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_stat_key');
        END IF;
        IF v_delta IS NULL OR v_delta < -10 OR v_delta > 10 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_stat_delta');
        END IF;
        IF v_key = ANY(v_seen_keys) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'duplicate_stat_key');
        END IF;
        v_seen_keys := v_seen_keys || v_key;
        v_effects := v_effects || jsonb_build_array(
            jsonb_build_object('key', v_key, 'delta', v_delta)
        );
    END LOOP;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO public.ordinances (
        name, description, cost,
        support_archetypes, oppose_archetypes,
        stat_effects,
        author_faction_id, created_at_tick
    ) VALUES (
        v_name, v_desc, p_cost,
        v_support, v_oppose,
        v_effects,
        v_pol.id, v_tick
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success',       true,
        'ordinance_id',  v_id,
        'created_at_tick', v_tick
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.create_ordinance(uuid, text, text, int, text[], text[], jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_ordinance(uuid, text, text, int, text[], text[], jsonb) TO authenticated;


COMMENT ON COLUMN public.ordinances.cost IS
    '20270741 — int -100..100. Deducted from city.budget on PASS (positive = cost, negative = ordinance pays the city). Zero is allowed for purely-symbolic ordinances.';

COMMENT ON COLUMN public.ordinances.stat_effects IS
    '20270741 — jsonb array of {key, delta} objects. Each element targets one of the 9 banded city stats with a signed delta in -10..10. Resolution applies each effect in array order, clamping the target stat 1-10. At most one effect per key.';

NOTIFY pgrst, 'reload schema';

COMMIT;
