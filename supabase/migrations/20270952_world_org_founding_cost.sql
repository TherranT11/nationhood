-- ════════════════════════════════════════════════════════════════════
-- 20270951b → 20270952 — World org founding cost: deduct from nation budget
--
-- Founding now charges the founding nation's budget (nations.politician_budget,
-- in dollars): the institutional type's cost plus $1B per nation invited. Costs
-- are billions — the form shows the short "−$4" / "−$1". Invited nations are
-- recorded as founding members alongside the founder; blocked if the budget
-- can't cover the total.
--
-- The type cost mirrors ORG_TYPES_BY_CATEGORY in js/game/world-org-sectors.js;
-- only the Diplomatic Convention ($4) is foundable today — keep this in sync as
-- more types switch on.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.found_organization(text, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.found_organization(
    p_category          text,
    p_name              text,
    p_abbreviation      text,
    p_purpose           text,
    p_type              text,
    p_scope             text,
    p_region            text,
    p_invited_nation_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    COST_UNIT constant bigint := 1000000000;   -- founding costs are in $B
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_tick    int;
    v_name    text := btrim(COALESCE(p_name, ''));
    v_abbr    text := NULLIF(btrim(COALESCE(p_abbreviation, '')), '');
    v_purpose text := NULLIF(btrim(COALESCE(p_purpose, '')), '');
    v_region  text := CASE WHEN p_scope = 'regional'
                           THEN NULLIF(btrim(COALESCE(p_region, '')), '') END;
    v_invited uuid[];
    v_type_cost int;
    v_cost    bigint;
    v_budget  bigint;
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
    IF NOT (p_category = 'diplomatic_political' AND p_type = 'diplomatic_convention') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_type');
    END IF;
    IF p_scope IS NULL OR p_scope NOT IN ('universal', 'regional', 'invitational') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_scope');
    END IF;
    IF p_scope = 'regional' AND COALESCE(v_region, '') <> 'crucera' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_region');
    END IF;

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

    -- Sanitize invites: real nations, not the founder, de-duplicated.
    SELECT COALESCE(array_agg(DISTINCT n.id), '{}') INTO v_invited
      FROM nations n
     WHERE n.id = ANY (COALESCE(p_invited_nation_ids, '{}'::uuid[]))
       AND n.id <> v_fac.nation_id;

    -- Type cost (mirror ORG_TYPES_BY_CATEGORY) + $1B per invited nation.
    v_type_cost := CASE p_type WHEN 'diplomatic_convention' THEN 4 ELSE 0 END;
    v_cost := (v_type_cost + COALESCE(array_length(v_invited, 1), 0))::bigint * COST_UNIT;

    -- Charge the founder's budget (lock the row against a concurrent spend).
    SELECT politician_budget INTO v_budget FROM nations WHERE id = v_fac.nation_id FOR UPDATE;
    IF COALESCE(v_budget, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_budget',
            'cost', v_cost, 'have', COALESCE(v_budget, 0));
    END IF;
    UPDATE nations SET politician_budget = COALESCE(politician_budget, 0) - v_cost
     WHERE id = v_fac.nation_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO world_organizations (category, name, abbreviation, purpose,
        type, scope, region, founder_nation_id, member_nation_ids, status, created_at_tick)
    VALUES (p_category, v_name, v_abbr, v_purpose,
        p_type, p_scope, v_region, v_fac.nation_id,
        ARRAY[v_fac.nation_id] || v_invited, 'forming', COALESCE(v_tick, 0))
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id, 'status', 'forming',
        'cost', v_cost, 'invited', COALESCE(array_length(v_invited, 1), 0));
END $$;

REVOKE ALL ON FUNCTION public.found_organization(text, text, text, text, text, text, text, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.found_organization(text, text, text, text, text, text, text, uuid[]) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
