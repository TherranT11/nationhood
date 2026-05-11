-- ════════════════════════════════════════════════════════════════
-- Aircraft RFPs — named campaigns + bid priorities + 10-tick window
--
-- Additive extension on top of 20261107_aircraft_rfps.sql. Adds:
--   • aircraft_rfps.name — campaign label ("Q3 1957 Fleet Expansion")
--       shared across all rows in a multi-class submission so the
--       airline procurement list can group rows back into one card.
--   • aircraft_rfps.priorities — JSONB {range,price,quality,offering}
--       each 1..4, all four ranks used exactly once. Informational:
--       manufacturers see them when bidding; no scoring is applied.
--   • Bid window default lifted 6 → 10 ticks.
--
-- Multi-class is handled by fan-out at the call site (one row per
-- class). design_class stays single-valued; no child table needed.
-- 'business' class deliberately not added — the modal disables that
-- card so corp_aircraft.aircraft_class CHECK stays untouched.
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.aircraft_rfps
    ADD COLUMN IF NOT EXISTS name       TEXT,
    ADD COLUMN IF NOT EXISTS priorities JSONB;

COMMENT ON COLUMN public.aircraft_rfps.name IS
    'Airline-supplied campaign label. NULL on legacy rows. Multi-class submissions share the same name so the procurement list can group fanned-out rows.';
COMMENT ON COLUMN public.aircraft_rfps.priorities IS
    'JSONB {range,price,quality,offering}, each rank 1..4 used once. Informational only — shown to bidders, no scoring applied server-side.';

-- post_aircraft_rfp: drop the old signature first so we can change
-- the param list cleanly. Old signature: (TEXT, INT).
DROP FUNCTION IF EXISTS post_aircraft_rfp(TEXT, INT);

CREATE OR REPLACE FUNCTION post_aircraft_rfp(
    p_design_class TEXT,
    p_quantity     INT,
    p_name         TEXT DEFAULT NULL,
    p_priorities   JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_corp factions%ROWTYPE;
    v_tick INT;
    v_rfp_id UUID;
    v_name TEXT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF p_design_class NOT IN ('regional', 'narrowbody', 'widebody') THEN
        RETURN jsonb_build_object('success', false,
            'error', 'design_class must be regional, narrowbody, or widebody');
    END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 50 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Quantity must be between 1 and 50');
    END IF;

    -- Trim + clamp the name. NULL/blank stays NULL so the list
    -- renderer falls back to a default label.
    v_name := NULLIF(TRIM(COALESCE(p_name, '')), '');
    IF v_name IS NOT NULL AND LENGTH(v_name) > 80 THEN
        v_name := LEFT(v_name, 80);
    END IF;

    -- priorities validation: every key present, every value 1..4,
    -- all four ranks distinct. NULL is allowed (legacy / no
    -- priorities supplied).
    IF p_priorities IS NOT NULL THEN
        IF NOT (p_priorities ? 'range' AND p_priorities ? 'price'
            AND p_priorities ? 'quality' AND p_priorities ? 'offering') THEN
            RETURN jsonb_build_object('success', false,
                'error', 'priorities must include range, price, quality, offering');
        END IF;
        IF (SELECT COUNT(DISTINCT v::int)
              FROM jsonb_array_elements_text(jsonb_build_array(
                  p_priorities->'range', p_priorities->'price',
                  p_priorities->'quality', p_priorities->'offering')) v) <> 4 THEN
            RETURN jsonb_build_object('success', false,
                'error', 'priorities must use each rank 1..4 exactly once');
        END IF;
        IF NOT (
            (p_priorities->>'range')::int BETWEEN 1 AND 4
            AND (p_priorities->>'price')::int BETWEEN 1 AND 4
            AND (p_priorities->>'quality')::int BETWEEN 1 AND 4
            AND (p_priorities->>'offering')::int BETWEEN 1 AND 4
        ) THEN
            RETURN jsonb_build_object('success', false,
                'error', 'priority ranks must be between 1 and 4');
        END IF;
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = (
        SELECT id FROM factions
         WHERE (id = v_user OR linked_user_id = v_user)
           AND faction_type = 'corporation'
           AND corp_sector  = 'Airline'
         LIMIT 1
    );
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Only airline corporations can post aircraft RFPs');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO aircraft_rfps (
        airline_corp_id, design_class, quantity,
        status, created_at_tick, expires_at_tick,
        name, priorities
    ) VALUES (
        v_corp.id, p_design_class, p_quantity,
        'open', v_tick, v_tick + 10,
        v_name, p_priorities
    ) RETURNING id INTO v_rfp_id;

    RETURN jsonb_build_object(
        'success',          true,
        'rfp_id',           v_rfp_id,
        'design_class',     p_design_class,
        'quantity',         p_quantity,
        'name',             v_name,
        'priorities',       p_priorities,
        'expires_at_tick',  v_tick + 10
    );
END;
$$;

GRANT EXECUTE ON FUNCTION post_aircraft_rfp(TEXT, INT, TEXT, JSONB) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
