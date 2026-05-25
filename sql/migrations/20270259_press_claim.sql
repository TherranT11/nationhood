-- ============================================================================
-- PRESS CLAIM — Foreign Ministry entry point into the bilateral-issues engine.
--
-- A player holding the Foreign Ministry can "press a claim" against a bordering
-- (proximity 0) nation for $3 from the ministry discretionary budget. This
-- creates a normal `territorial_ownership` bilateral issue — same engine as
-- admin-spawned issues (conflicts.html card game, modifier ticking, the deck
-- initialized next tick by processIssueTick). Nothing here is a new system; it
-- is a guarded creation path.
--
-- Adds three flavour columns the issue header shows: a contested-region name
-- (the presser can rename later) and a "what's at stake" roll (2D3 → a quantity
-- 1-3 of farmland / minerals / energy). Display-only; no stat effect.
--
-- Also seeds territorial event cards 29 & 30 so a freshly pressed deck holds 30
-- cards (the deck sizes itself from issue_card_definitions, so no code change is
-- needed for the count to take).
--
-- NOTE: the issue INSERT + modifier loop + history entry below intentionally
-- mirror admin_spawn_bilateral_issue (20260407). They are not yet factored into
-- a shared core because admin_spawn is admin-only tooling on a different
-- precondition path; a future pass should extract a common spawn helper that
-- both call. Flagged here rather than left silent.
-- ============================================================================

BEGIN;

-- ── 1. Flavour columns ──────────────────────────────────────────────────────
ALTER TABLE bilateral_issues
    ADD COLUMN IF NOT EXISTS contested_region_name TEXT,
    ADD COLUMN IF NOT EXISTS stake_resource TEXT
        CHECK (stake_resource IS NULL OR stake_resource IN ('farmland','minerals','energy')),
    ADD COLUMN IF NOT EXISTS stake_quantity INT
        CHECK (stake_quantity IS NULL OR (stake_quantity BETWEEN 1 AND 3));

-- ── 2. Territorial cards 29 & 30 (deck → 30) ────────────────────────────────
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects
) VALUES
(
    'territorial_ownership', 29, 'Resource Survey Concession', 'unilateral', 'foreign_minister', 1,
    'A multinational consortium offers lucrative survey rights across the contested ground. Whoever signs first sets the terms — and signals to the world who they think owns it.',
    'Occupying Nation',
    'Award the Exploration License',
    'Sign the consortium directly. The royalties flow to your treasury and the contract names you as sovereign authority over the survey zone.',
    '{ "favor_delta": 1.5, "tension_delta": 1, "relation_delta": -0.1, "treasury_cost": 12000000,
       "stat_effects": [ { "stat_key": "gov_approval", "delta": 0.08, "duration_ticks": 8, "target": "self" } ] }'::jsonb,
    'Claimant Nation',
    'Demand a Joint Survey',
    'Insist the survey only proceed under a shared commission. Slower and less profitable, but it forces recognition that the territory is disputed.',
    '{ "favor_delta": -1, "tension_delta": 0.5, "relation_delta": 0.1, "treasury_cost": 6000000,
       "stat_effects": [ { "stat_key": "gov_approval", "delta": 0.05, "duration_ticks": 6, "target": "self" } ] }'::jsonb
),
(
    'territorial_ownership', 30, 'Border Garrison Maneuvers', 'aggressive', 'minister_of_defense', 1,
    'Troop rotations near the frontier draw nervous coverage on both sides. A show of resolve here is also a show of force — and the other capital is watching the troop trains.',
    'Occupying Nation',
    'Reinforce the Garrison',
    'Move an additional brigade into the administered zone and harden the checkpoints. Possession, made visible.',
    '{ "favor_delta": 2, "tension_delta": 2.5, "relation_delta": -0.2, "treasury_cost": 18000000,
       "stat_effects": [ { "stat_key": "stability", "delta": -0.05, "duration_ticks": 10, "target": "opponent" } ] }'::jsonb,
    'Claimant Nation',
    'Stage a Forward Deployment',
    'Mass units on your side of the line and run loud exercises. You cannot enter the territory, but you can make holding it expensive.',
    '{ "favor_delta": -1.5, "tension_delta": 2, "relation_delta": -0.2, "treasury_cost": 14000000,
       "stat_effects": [ { "stat_key": "stability", "delta": -0.05, "duration_ticks": 10, "target": "self" } ] }'::jsonb
)
ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── 3. press_claim RPC ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.press_claim(
    p_target_nation_id UUID,
    p_modifiers        JSONB DEFAULT '[]'::jsonb,   -- territorial starter modifiers, built client-side from MODIFIERS
    p_region_name      TEXT  DEFAULT NULL,
    p_stake_resource   TEXT  DEFAULT NULL,
    p_stake_quantity   INT   DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller         UUID := auth.uid();
    v_ministry       ministries%ROWTYPE;
    v_nation_id      UUID;
    v_proximity      INT;
    v_canonical_a    UUID;
    v_canonical_b    UUID;
    v_current_tick   INT;
    v_issue_id       UUID;
    v_mod            JSONB;
    v_stake_resource TEXT;
    v_stake_qty      INT;
    v_region         TEXT;
    c_cost  CONSTANT INT := 3000000;   -- $3 in raw dollars ($1 displayed = $1M)
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.');
    END IF;

    -- Foreign Ministry role: the caller's party must hold the active foreign ministry.
    SELECT * INTO v_ministry FROM ministries
     WHERE ministry_key = 'foreign' AND is_active = true
       AND EXISTS (SELECT 1 FROM factions f
                    WHERE f.id = ministries.party_id
                      AND (f.id = v_caller OR f.linked_user_id = v_caller));
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Your party does not hold the Foreign Ministry.');
    END IF;
    v_nation_id := v_ministry.nation_id;

    IF p_target_nation_id IS NULL OR p_target_nation_id = v_nation_id THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Pick another nation to press a claim against.');
    END IF;

    -- $3 from the ministry discretionary budget.
    IF COALESCE(v_ministry.discretionary_balance, 0) < c_cost THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Insufficient discretionary funds ($3 required).',
            'have', COALESCE(v_ministry.discretionary_balance, 0));
    END IF;

    -- Adjacency: target must be a distance-0 (bordering) neighbour.
    SELECT proximity INTO v_proximity FROM diplomatic_relations
     WHERE nation_a_id = LEAST(v_nation_id, p_target_nation_id)
       AND nation_b_id = GREATEST(v_nation_id, p_target_nation_id);
    IF v_proximity IS NULL OR v_proximity <> 0 THEN
        RETURN jsonb_build_object('ok', false, 'message',
            'You can only press a territorial claim against a bordering nation.');
    END IF;

    -- Canonical ordering (smaller UUID = nation_a).
    IF v_nation_id < p_target_nation_id THEN
        v_canonical_a := v_nation_id;       v_canonical_b := p_target_nation_id;
    ELSE
        v_canonical_a := p_target_nation_id; v_canonical_b := v_nation_id;
    END IF;

    -- One active/partial territorial dispute per pair.
    IF EXISTS (SELECT 1 FROM bilateral_issues
                WHERE issue_type = 'territorial_ownership'
                  AND nation_a_id = v_canonical_a AND nation_b_id = v_canonical_b
                  AND status IN ('active','partial')) THEN
        RETURN jsonb_build_object('ok', false, 'message',
            'An active territorial dispute already exists with that nation.');
    END IF;

    SELECT COALESCE(current_tick, 0) INTO v_current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- "What's at stake" — 2D3 (quantity 1-3, resource farmland/minerals/energy).
    -- Trust a valid client roll; otherwise roll here. Flavour only.
    v_stake_qty := p_stake_quantity;
    IF v_stake_qty IS NULL OR v_stake_qty < 1 OR v_stake_qty > 3 THEN
        v_stake_qty := 1 + floor(random() * 3)::int;
    END IF;
    v_stake_resource := lower(COALESCE(p_stake_resource, ''));
    IF v_stake_resource NOT IN ('farmland','minerals','energy') THEN
        v_stake_resource := (ARRAY['farmland','minerals','energy'])[1 + floor(random() * 3)::int];
    END IF;
    v_region := NULLIF(btrim(COALESCE(p_region_name, '')), '');

    -- Create the issue. The presser challenges the territory the target holds,
    -- so the target is the administering nation.
    INSERT INTO bilateral_issues (
        issue_type, nation_a_id, nation_b_id, tension, favor, status,
        created_tick, ticks_without_diplomatic_action, administering_nation_id,
        contested_region_name, stake_resource, stake_quantity
    ) VALUES (
        'territorial_ownership', v_canonical_a, v_canonical_b, 0, 0, 'active',
        v_current_tick, 0, p_target_nation_id,
        v_region, v_stake_resource, v_stake_qty
    ) RETURNING id INTO v_issue_id;

    -- Starter modifiers (client passes them, built from MODIFIERS — one source).
    FOR v_mod IN SELECT * FROM jsonb_array_elements(p_modifiers) LOOP
        INSERT INTO bilateral_issue_modifiers (
            issue_id, modifier_key, category, applies_to, stat_effects, duration_remaining,
            is_periodic, periodic_interval, periodic_duration, periodic_next_tick, is_periodic_active,
            is_active, created_by, created_tick
        ) VALUES (
            v_issue_id, v_mod->>'modifier_key', v_mod->>'category',
            COALESCE(v_mod->>'applies_to', 'both'),
            COALESCE(v_mod->'stat_effects', '[]'::jsonb),
            (v_mod->>'duration_remaining')::INT,
            COALESCE((v_mod->>'is_periodic')::BOOLEAN, false),
            (v_mod->>'periodic_interval')::INT,
            (v_mod->>'periodic_duration')::INT,
            CASE WHEN (v_mod->>'is_periodic')::BOOLEAN = true
                 THEN v_current_tick + COALESCE((v_mod->>'periodic_interval')::INT, 20) ELSE NULL END,
            false, true, 'press_claim', v_current_tick
        );
    END LOOP;

    -- Charge the discretionary budget.
    UPDATE ministries SET discretionary_balance = discretionary_balance - c_cost WHERE id = v_ministry.id;

    -- Audit.
    INSERT INTO bilateral_issue_history (issue_id, tick, event_type, event_text, metadata)
    VALUES (v_issue_id, v_current_tick, 'created',
        'Territorial claim pressed by the Foreign Ministry.',
        jsonb_build_object('issue_type', 'territorial_ownership', 'source', 'press_claim',
            'pressed_by_nation', v_nation_id, 'target_nation', p_target_nation_id,
            'stake_resource', v_stake_resource, 'stake_quantity', v_stake_qty, 'cost', c_cost));

    RETURN jsonb_build_object('ok', true, 'message', 'Claim pressed.', 'issue_id', v_issue_id,
        'stake_resource', v_stake_resource, 'stake_quantity', v_stake_qty);

EXCEPTION
    WHEN unique_violation THEN
        -- bilateral_issues has UNIQUE(issue_type, nation_a_id, nation_b_id): a
        -- territorial dispute can exist only once per pair, even if a prior one
        -- resolved. (Re-pressing resolved disputes is a Phase-2 design question.)
        RETURN jsonb_build_object('ok', false, 'message',
            'A territorial dispute with that nation already exists and cannot be re-opened.');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.press_claim(UUID, JSONB, TEXT, TEXT, INT) TO authenticated;

COMMENT ON FUNCTION public.press_claim(UUID, JSONB, TEXT, TEXT, INT) IS
    'Foreign-Ministry action: press a territorial claim against a bordering (proximity 0) nation for $3 discretionary. Creates a territorial_ownership bilateral issue (deck initialized next tick by processIssueTick). Owner-gated by the foreign ministry, SECURITY DEFINER.';

NOTIFY pgrst, 'reload schema';

COMMIT;
