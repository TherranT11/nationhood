-- ════════════════════════════════════════════════════════════════════
-- 20270951 — World organizations: institutional type + membership scope
--
-- Founding form Steps 3 (Type of Body) and 4 (Scope). Adds:
--   type   — institutional form within the category (only the enabled ones in
--            ORG_TYPES_BY_CATEGORY can be founded; today just diplomatic_political
--            → 'diplomatic_convention').
--   scope  — 'universal' | 'regional' | 'invitational'.
--   region — set only for a 'regional' body; today only 'crucera' is enabled.
--
-- The enabled keys mirror js/game/world-org-sectors.js — keep the validation
-- below in sync as more types/regions are switched on. The founding cost shown
-- in the UI is display-only here; no Treasury deduction yet.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.world_organizations
    ADD COLUMN IF NOT EXISTS type   text,
    ADD COLUMN IF NOT EXISTS scope  text,
    ADD COLUMN IF NOT EXISTS region text;

-- Replaces the 4-arg founder from 20270950 (now carries type/scope/region).
DROP FUNCTION IF EXISTS public.found_organization(text, text, text, text);

CREATE OR REPLACE FUNCTION public.found_organization(
    p_category     text,
    p_name         text,
    p_abbreviation text,
    p_purpose      text,
    p_type         text,
    p_scope        text,
    p_region       text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_tick    int;
    v_name    text := btrim(COALESCE(p_name, ''));
    v_abbr    text := NULLIF(btrim(COALESCE(p_abbreviation, '')), '');
    v_purpose text := NULLIF(btrim(COALESCE(p_purpose, '')), '');
    -- region only meaningful for a regional body.
    v_region  text := CASE WHEN p_scope = 'regional'
                           THEN NULLIF(btrim(COALESCE(p_region, '')), '') END;
    v_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_category IS NULL OR p_category NOT IN
       ('diplomatic_political', 'economic_financial', 'trade_commerce',
        'security_defense', 'technical_functional') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_category');
    END IF;
    IF length(v_name) < 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    -- Enabled institutional types (mirror ORG_TYPES_BY_CATEGORY). Only the
    -- Diplomatic Convention is foundable so far.
    IF NOT (p_category = 'diplomatic_political' AND p_type = 'diplomatic_convention') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_type');
    END IF;
    IF p_scope IS NULL OR p_scope NOT IN ('universal', 'regional', 'invitational') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_scope');
    END IF;
    -- Only Crucera is an enabled region today (mirror ORG_REGIONS).
    IF p_scope = 'regional' AND COALESCE(v_region, '') <> 'crucera' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_region');
    END IF;

    -- The caller's politician who is FM or HoG of their nation.
    SELECT * INTO v_fac FROM factions f
     WHERE f.faction_type = 'politician'
       AND f.abandoned_at IS NULL
       AND (f.id = v_uid OR f.linked_user_id = v_uid)
       AND f.nation_id IS NOT NULL
       AND (f.politician_foreign_minister_at_tick IS NOT NULL
            OR EXISTS (SELECT 1 FROM head_of_government h
                        WHERE h.nation_id = f.nation_id AND h.active AND h.faction_id = f.id))
     ORDER BY f.created_at ASC
     LIMIT 1;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO world_organizations (category, name, abbreviation, purpose,
        type, scope, region, founder_nation_id, member_nation_ids, status, created_at_tick)
    VALUES (p_category, v_name, v_abbr, v_purpose,
        p_type, p_scope, v_region, v_fac.nation_id, ARRAY[v_fac.nation_id], 'forming', COALESCE(v_tick, 0))
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id, 'status', 'forming');
END $$;

REVOKE ALL ON FUNCTION public.found_organization(text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.found_organization(text, text, text, text, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
