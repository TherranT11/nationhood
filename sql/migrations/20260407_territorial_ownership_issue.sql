-- Add administering_nation_id to bilateral_issues for territorial ownership disputes.
-- This column tracks which nation currently controls/administers the disputed territory.
-- NULL for issue types that don't use this concept (e.g. maritime_fishing_rights).

ALTER TABLE bilateral_issues
ADD COLUMN IF NOT EXISTS administering_nation_id UUID REFERENCES nations(id) DEFAULT NULL;

-- Index for looking up issues by administering nation
CREATE INDEX IF NOT EXISTS idx_bilateral_issues_admin_nation
ON bilateral_issues (administering_nation_id)
WHERE administering_nation_id IS NOT NULL;

-- Update the admin_spawn_bilateral_issue RPC to accept administering_nation_id.
-- Drop and recreate to add the new parameter.
DROP FUNCTION IF EXISTS admin_spawn_bilateral_issue(UUID, UUID, TEXT, NUMERIC, NUMERIC, TEXT, JSONB, TEXT);

CREATE OR REPLACE FUNCTION admin_spawn_bilateral_issue(
    p_nation_a_id UUID,
    p_nation_b_id UUID,
    p_issue_type TEXT,
    p_tension NUMERIC DEFAULT 0,
    p_favor NUMERIC DEFAULT 0,
    p_favor_nation TEXT DEFAULT 'a',
    p_modifiers JSONB DEFAULT '[]'::JSONB,
    p_status TEXT DEFAULT 'active',
    p_administering_nation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_canonical_a UUID;
    v_canonical_b UUID;
    v_favor_val NUMERIC;
    v_current_tick INT;
    v_issue_id UUID;
    v_mod JSONB;
    v_existing UUID;
BEGIN
    -- Admin check
    IF NOT is_admin() THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Admin access required.');
    END IF;

    -- Validate nations are different
    IF p_nation_a_id = p_nation_b_id THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Nation A and Nation B must be different.');
    END IF;

    -- Canonical ordering: smaller UUID = nation_a
    IF p_nation_a_id < p_nation_b_id THEN
        v_canonical_a := p_nation_a_id;
        v_canonical_b := p_nation_b_id;
    ELSE
        v_canonical_a := p_nation_b_id;
        v_canonical_b := p_nation_a_id;
    END IF;

    -- Compute signed favor: negative = favors A, positive = favors B
    IF p_favor_nation = 'a' THEN
        IF p_nation_a_id = v_canonical_a THEN
            v_favor_val := -ABS(p_favor);
        ELSE
            v_favor_val := ABS(p_favor);
        END IF;
    ELSIF p_favor_nation = 'b' THEN
        IF p_nation_b_id = v_canonical_b THEN
            v_favor_val := ABS(p_favor);
        ELSE
            v_favor_val := -ABS(p_favor);
        END IF;
    ELSE
        v_favor_val := 0;
    END IF;

    -- Clamp
    v_favor_val := LEAST(5, GREATEST(-5, v_favor_val));

    -- Get current tick
    SELECT current_tick INTO v_current_tick
    FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_current_tick := COALESCE(v_current_tick, 0);

    -- Check for existing active issue of same type between these nations
    SELECT id INTO v_existing
    FROM bilateral_issues
    WHERE issue_type = p_issue_type
      AND nation_a_id = v_canonical_a
      AND nation_b_id = v_canonical_b
      AND status IN ('active', 'partial');

    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('ok', false, 'message',
            'An active issue of this type already exists between these nations (id: ' || v_existing || ').');
    END IF;

    -- Validate administering_nation_id is one of the two nations (if provided)
    IF p_administering_nation_id IS NOT NULL
       AND p_administering_nation_id != v_canonical_a
       AND p_administering_nation_id != v_canonical_b THEN
        RETURN jsonb_build_object('ok', false, 'message',
            'Administering nation must be one of the two involved nations.');
    END IF;

    -- Insert issue
    INSERT INTO bilateral_issues (
        issue_type, nation_a_id, nation_b_id,
        tension, favor, status,
        created_tick, ticks_without_diplomatic_action,
        administering_nation_id
    ) VALUES (
        p_issue_type, v_canonical_a, v_canonical_b,
        LEAST(10, GREATEST(0, p_tension)),
        v_favor_val,
        p_status,
        v_current_tick, 0,
        p_administering_nation_id
    ) RETURNING id INTO v_issue_id;

    -- Insert modifiers
    FOR v_mod IN SELECT * FROM jsonb_array_elements(p_modifiers)
    LOOP
        INSERT INTO bilateral_issue_modifiers (
            issue_id, modifier_key, category, applies_to,
            stat_effects, duration_remaining,
            is_periodic, periodic_interval, periodic_duration, periodic_next_tick, is_periodic_active,
            is_active, created_by, created_tick
        ) VALUES (
            v_issue_id,
            v_mod->>'modifier_key',
            v_mod->>'category',
            COALESCE(v_mod->>'applies_to', 'both'),
            COALESCE(v_mod->'stat_effects', '[]'::jsonb),
            (v_mod->>'duration_remaining')::INT,
            COALESCE((v_mod->>'is_periodic')::BOOLEAN, false),
            (v_mod->>'periodic_interval')::INT,
            (v_mod->>'periodic_duration')::INT,
            CASE WHEN (v_mod->>'is_periodic')::BOOLEAN = true
                 THEN v_current_tick + COALESCE((v_mod->>'periodic_interval')::INT, 20)
                 ELSE NULL END,
            false,
            true,
            'admin_spawn',
            v_current_tick
        );
    END LOOP;

    -- Create history entry
    INSERT INTO bilateral_issue_history (
        issue_id, tick, event_type, event_text, metadata
    ) VALUES (
        v_issue_id, v_current_tick, 'created',
        'Issue spawned by admin.',
        jsonb_build_object(
            'issue_type', p_issue_type,
            'tension', p_tension,
            'favor', v_favor_val,
            'modifiers_count', jsonb_array_length(p_modifiers),
            'administering_nation_id', p_administering_nation_id,
            'source', 'admin_panel'
        )
    );

    RETURN jsonb_build_object(
        'ok', true,
        'message', 'Issue spawned successfully.',
        'issue_id', v_issue_id,
        'canonical_a', v_canonical_a,
        'canonical_b', v_canonical_b,
        'favor', v_favor_val,
        'tension', LEAST(10, GREATEST(0, p_tension))
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

ALTER FUNCTION admin_spawn_bilateral_issue(UUID, UUID, TEXT, NUMERIC, NUMERIC, TEXT, JSONB, TEXT, UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION admin_spawn_bilateral_issue(UUID, UUID, TEXT, NUMERIC, NUMERIC, TEXT, JSONB, TEXT, UUID) TO authenticated;
