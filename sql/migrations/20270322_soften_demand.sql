-- ============================================================================
-- Soften-the-demand ladder + Drop-claim, for territorial_ownership disputes.
-- ============================================================================
-- The pressor's standing demand sits on a 4-rung ladder:
--   1 Full Cession (start) → 2 Administrative Control → 3 Joint Condominium
--   → 4 Resource Rights (the floor).
-- Softening is monotonic and irreversible: it only ever climbs DOWN to a
-- smaller prize (higher rung number), to make a claimant "yes" easier. Below the
-- floor the only move left is to DROP the claim, which closes the dispute, costs
-- the pressor approval/unrest, and opens a 360-tick cooldown before a fresh
-- territorial claim can be pressed against that nation again.
--
-- SCOPE: this is the demand-of-record + the pressor's soften/drop actions. What
-- a rung *means on acceptance* (territory transfer / administration / condominium
-- / resource share) belongs to the claimant resolve-engine, which is not built
-- yet — so demand_rung is recorded and displayed but does not yet drive an
-- outcome. The on-acceptance effects are a later pass.
-- ============================================================================

BEGIN;

-- ── 1. Columns ──────────────────────────────────────────────────────────────
ALTER TABLE bilateral_issues
    -- The pressor's current demand. 1 = Full Cession (hardest yes) … 4 = Resource
    -- Rights (floor, easiest yes). Monotonic; press_claim sets it to 1.
    ADD COLUMN IF NOT EXISTS demand_rung SMALLINT NOT NULL DEFAULT 1
        CHECK (demand_rung BETWEEN 1 AND 4),
    -- Set when a pressor drops the claim; gates the 360-tick re-press cooldown.
    ADD COLUMN IF NOT EXISTS dropped_tick INT;

-- ── 2. Let a territorial dispute RECUR ───────────────────────────────────────
-- The old table-wide UNIQUE(issue_type, nation_a, nation_b) forbade a second
-- dispute per pair forever (the codebase's open "Phase-2 re-press" question).
-- Replace it with a partial unique so only ONE live dispute (active/partial/
-- escalated) can exist per pair at a time, while resolved/dropped (dormant) ones
-- remain as history and a fresh claim can be pressed once the cooldown elapses.
ALTER TABLE bilateral_issues DROP CONSTRAINT IF EXISTS uq_issue_type_pair;
CREATE UNIQUE INDEX IF NOT EXISTS uq_issue_live_pair
    ON bilateral_issues (issue_type, nation_a_id, nation_b_id)
    WHERE status IN ('active', 'partial', 'escalated');

-- ── 3. soften_demand: pressor lowers the demand one rung (monotonic) ─────────
CREATE OR REPLACE FUNCTION public.soften_demand(p_issue_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller   UUID := auth.uid();
    v_ministry ministries%ROWTYPE;
    v_nation   UUID;
    v_issue    bilateral_issues%ROWTYPE;
    v_tick     INT;
    v_new      SMALLINT;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.');
    END IF;

    SELECT * INTO v_ministry FROM ministries
     WHERE ministry_key = 'foreign' AND is_active = true
       AND EXISTS (SELECT 1 FROM factions f
                    WHERE f.id = ministries.party_id
                      AND (f.id = v_caller OR f.linked_user_id = v_caller));
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Your party does not hold the Foreign Ministry.');
    END IF;
    v_nation := v_ministry.nation_id;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.');
    END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims have a demand ladder.');
    END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN
        RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.');
    END IF;
    IF v_issue.initiative_nation_id IS DISTINCT FROM v_nation THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Only the pressor can soften the demand.');
    END IF;
    IF v_issue.demand_rung >= 4 THEN
        RETURN jsonb_build_object('ok', false, 'message',
            'Already at the floor (Resource Rights) — drop the claim instead.');
    END IF;

    v_new := v_issue.demand_rung + 1;
    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE bilateral_issues SET demand_rung = v_new, updated_at = NOW() WHERE id = p_issue_id;

    INSERT INTO bilateral_issue_history (issue_id, tick, event_type, event_text, metadata, caused_by_nation_id)
    VALUES (p_issue_id, v_tick, 'action_executed', 'The pressor softened the demand.',
        jsonb_build_object('action', 'soften_demand', 'from_rung', v_issue.demand_rung, 'to_rung', v_new),
        v_nation);

    RETURN jsonb_build_object('ok', true, 'demand_rung', v_new);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.soften_demand(UUID) TO authenticated;

-- ── 4. drop_claim: pressor abandons the claim (close + penalty + cooldown) ───
CREATE OR REPLACE FUNCTION public.drop_claim(p_issue_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller   UUID := auth.uid();
    v_ministry ministries%ROWTYPE;
    v_nation   UUID;
    v_issue    bilateral_issues%ROWTYPE;
    v_tick     INT;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.');
    END IF;

    SELECT * INTO v_ministry FROM ministries
     WHERE ministry_key = 'foreign' AND is_active = true
       AND EXISTS (SELECT 1 FROM factions f
                    WHERE f.id = ministries.party_id
                      AND (f.id = v_caller OR f.linked_user_id = v_caller));
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Your party does not hold the Foreign Ministry.');
    END IF;
    v_nation := v_ministry.nation_id;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.');
    END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims can be dropped here.');
    END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN
        RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.');
    END IF;
    IF v_issue.initiative_nation_id IS DISTINCT FROM v_nation THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Only the pressor can drop the claim.');
    END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Close the dispute. 'dormant' frees the pair (partial index above) so a new
    -- claim can be pressed later; dropped_tick stamps the cooldown start.
    UPDATE bilateral_issues
       SET status = 'dormant', resolved_tick = v_tick, dropped_tick = v_tick, updated_at = NOW()
     WHERE id = p_issue_id;

    -- Backing-down penalty on the pressor. Approval flows through the event
    -- bucket the tick aggregator reads (gov_approval_events); unrest is a direct
    -- clamped stat (mirrors bills.js civil_unrest handling).
    UPDATE nations
       SET gov_approval_events = COALESCE(gov_approval_events, 0) - 25,
           civil_unrest        = LEAST(100, COALESCE(civil_unrest, 50) + 10)
     WHERE id = v_nation;

    INSERT INTO bilateral_issue_history (issue_id, tick, event_type, event_text, metadata, caused_by_nation_id)
    VALUES (p_issue_id, v_tick, 'status_changed', 'The pressor dropped the claim.',
        jsonb_build_object('action', 'drop_claim', 'status', 'dormant', 'cooldown_ticks', 360,
            'approval_delta', -25, 'unrest_delta', 10),
        v_nation);

    RETURN jsonb_build_object('ok', true, 'message', 'Claim dropped.');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.drop_claim(UUID) TO authenticated;

-- ── 5. press_claim: set rung 1 on creation + enforce the re-press cooldown ───
-- Reproduced from 20270259 with two additions: it stamps demand_rung = 1 and,
-- before creating the issue, blocks a re-press while a dropped claim against the
-- same pair is still inside its 360-tick cooldown.
CREATE OR REPLACE FUNCTION public.press_claim(
    p_target_nation_id UUID,
    p_modifiers        JSONB DEFAULT '[]'::jsonb,
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
    v_dropped_tick   INT;
    c_cost     CONSTANT INT := 3000000;   -- $3 in raw dollars ($1 displayed = $1M)
    c_cooldown CONSTANT INT := 360;       -- ticks before a dropped claim can be re-pressed
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

    -- One live territorial dispute per pair.
    IF EXISTS (SELECT 1 FROM bilateral_issues
                WHERE issue_type = 'territorial_ownership'
                  AND nation_a_id = v_canonical_a AND nation_b_id = v_canonical_b
                  AND status IN ('active', 'partial', 'escalated')) THEN
        RETURN jsonb_build_object('ok', false, 'message',
            'An active territorial dispute already exists with that nation.');
    END IF;

    SELECT COALESCE(current_tick, 0) INTO v_current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Re-press cooldown: if a prior claim against this pair was dropped within the
    -- last c_cooldown ticks, it cannot be re-pressed yet.
    SELECT dropped_tick INTO v_dropped_tick FROM bilateral_issues
     WHERE issue_type = 'territorial_ownership'
       AND nation_a_id = v_canonical_a AND nation_b_id = v_canonical_b
       AND dropped_tick IS NOT NULL
     ORDER BY dropped_tick DESC LIMIT 1;
    IF v_dropped_tick IS NOT NULL AND v_current_tick < v_dropped_tick + c_cooldown THEN
        RETURN jsonb_build_object('ok', false, 'message',
            format('You dropped a claim against this nation recently. You can press again in %s ticks.',
                   v_dropped_tick + c_cooldown - v_current_tick));
    END IF;

    -- "What's at stake" — 2D3 (quantity 1-3, resource farmland/minerals/energy).
    v_stake_qty := p_stake_quantity;
    IF v_stake_qty IS NULL OR v_stake_qty < 1 OR v_stake_qty > 3 THEN
        v_stake_qty := 1 + floor(random() * 3)::int;
    END IF;
    v_stake_resource := lower(COALESCE(p_stake_resource, ''));
    IF v_stake_resource NOT IN ('farmland', 'minerals', 'energy') THEN
        v_stake_resource := (ARRAY['farmland','minerals','energy'])[1 + floor(random() * 3)::int];
    END IF;
    v_region := NULLIF(btrim(COALESCE(p_region_name, '')), '');

    -- Create the issue. The presser challenges the territory the target holds, so
    -- the target is the administering nation. Demand opens at rung 1 (Full Cession).
    -- Starting contest stats: the presser opens with 2 Leverage; the nation pressed
    -- against holds 2 Claim Strength; Dissident Strength starts at 0.
    INSERT INTO bilateral_issues (
        issue_type, nation_a_id, nation_b_id, tension, favor, status,
        created_tick, ticks_without_diplomatic_action, administering_nation_id,
        contested_region_name, stake_resource, stake_quantity, initiative_nation_id,
        leverage, issue_stat_1, issue_stat_2, demand_rung
    ) VALUES (
        'territorial_ownership', v_canonical_a, v_canonical_b, 1, 0, 'active',
        v_current_tick, 0, p_target_nation_id,
        v_region, v_stake_resource, v_stake_qty, v_nation_id,
        2, 2, 0, 1
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
        -- Partial unique uq_issue_live_pair: only one live dispute per pair. A
        -- concurrent press created one between our check and insert.
        RETURN jsonb_build_object('ok', false, 'message',
            'An active territorial dispute already exists with that nation.');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.press_claim(UUID, JSONB, TEXT, TEXT, INT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
