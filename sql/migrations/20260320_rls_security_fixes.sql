-- ═══════════════════════════════════════════════════════════════════
-- RLS Security Fixes: restrict cross-nation manipulation
-- ═══════════════════════════════════════════════════════════════════

-- 1. caucus_factions: restrict UPDATE to own nation only
DROP POLICY IF EXISTS caucus_factions_update ON caucus_factions;
CREATE POLICY caucus_factions_update ON caucus_factions
    FOR UPDATE TO authenticated
    USING (nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid()))
    WITH CHECK (nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid()));

-- 2. caucus_dispositions: restrict UPDATE to own nation only
DROP POLICY IF EXISTS caucus_dispositions_update ON caucus_dispositions;
CREATE POLICY caucus_dispositions_update ON caucus_dispositions
    FOR UPDATE TO authenticated
    USING (bill_id IN (SELECT id FROM bills WHERE nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid())))
    WITH CHECK (bill_id IN (SELECT id FROM bills WHERE nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid())));

-- 3. player_articles: restrict DELETE to own articles only
DROP POLICY IF EXISTS "Users can delete own player_articles" ON player_articles;
CREATE POLICY "Users can delete own player_articles" ON player_articles
    FOR DELETE TO authenticated
    USING (author_faction_id = auth.uid());

-- 4. execute_protest: add auth.uid() verification
CREATE OR REPLACE FUNCTION execute_protest(
    p_faction_id UUID,
    p_nation_id UUID,
    p_ap_cost INTEGER,
    p_grievance_type TEXT,
    p_grievance_data JSONB,
    p_demand_label TEXT,
    p_use_count INTEGER,
    p_tick INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_ap INTEGER;
    v_protest_id UUID;
BEGIN
    -- Verify caller owns this faction
    IF auth.uid() IS NOT NULL AND auth.uid() != p_faction_id THEN
        RAISE EXCEPTION 'Not authorized: caller does not own faction %', p_faction_id;
    END IF;

    -- Atomic AP check and deduction
    SELECT action_points INTO v_current_ap
    FROM factions WHERE id = p_faction_id FOR UPDATE;

    IF v_current_ap IS NULL THEN
        RAISE EXCEPTION 'Faction not found';
    END IF;
    IF v_current_ap < p_ap_cost THEN
        RAISE EXCEPTION 'Insufficient AP: have %, need %', v_current_ap, p_ap_cost;
    END IF;

    UPDATE factions SET
        action_points = action_points - p_ap_cost,
        protest_use_count = p_use_count + 1,
        protest_last_use_tick = p_tick,
        last_action_tick = p_tick
    WHERE id = p_faction_id;

    INSERT INTO protest_log (
        nation_id, faction_id, tick_called, status,
        grievance_type, grievance_data, demand_label,
        ap_cost, use_count_at_call
    ) VALUES (
        p_nation_id, p_faction_id, p_tick, 'resolving',
        p_grievance_type, p_grievance_data, p_demand_label,
        p_ap_cost, p_use_count
    ) RETURNING id INTO v_protest_id;

    RETURN v_protest_id;
END;
$$;

-- 5. endorse_protest: add auth.uid() verification
CREATE OR REPLACE FUNCTION endorse_protest(
    p_faction_id UUID,
    p_protest_id UUID,
    p_tick INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_ap INTEGER;
BEGIN
    -- Verify caller owns this faction
    IF auth.uid() IS NOT NULL AND auth.uid() != p_faction_id THEN
        RAISE EXCEPTION 'Not authorized: caller does not own faction %', p_faction_id;
    END IF;

    SELECT action_points INTO v_current_ap
    FROM factions WHERE id = p_faction_id FOR UPDATE;

    IF v_current_ap IS NULL THEN
        RAISE EXCEPTION 'Faction not found';
    END IF;
    IF v_current_ap < 1 THEN
        RAISE EXCEPTION 'Insufficient AP: have %, need 1', v_current_ap;
    END IF;

    UPDATE factions SET
        action_points = action_points - 1,
        last_action_tick = p_tick
    WHERE id = p_faction_id;

    INSERT INTO protest_endorsements (protest_id, faction_id, tick_endorsed, ap_cost)
    VALUES (p_protest_id, p_faction_id, p_tick, 1)
    ON CONFLICT (protest_id, faction_id) DO NOTHING;
END;
$$;

-- 6. protest_update: add nation-ownership verification
CREATE OR REPLACE FUNCTION protest_update(
    p_protest_id UUID,
    p_updates JSONB,
    p_clear_lockouts BOOLEAN DEFAULT FALSE,
    p_cooldown_faction_id UUID DEFAULT NULL,
    p_cooldown_until INTEGER DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_nation_id UUID;
BEGIN
    -- Verify caller belongs to the same nation as this protest
    IF auth.uid() IS NOT NULL THEN
        SELECT nation_id INTO v_nation_id FROM protest_log WHERE id = p_protest_id;
        IF v_nation_id IS NULL THEN
            RAISE EXCEPTION 'Protest not found';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM factions WHERE id = auth.uid() AND nation_id = v_nation_id) THEN
            RAISE EXCEPTION 'Not authorized: caller does not belong to this nation';
        END IF;
    END IF;

    -- Apply updates to the protest_log row
    -- Only allow known safe columns
    UPDATE protest_log SET
        status = COALESCE((p_updates->>'status')::TEXT, status),
        tick_resolved = COALESCE((p_updates->>'tick_resolved')::INTEGER, tick_resolved),
        crisis_ended_tick = COALESCE((p_updates->>'crisis_ended_tick')::INTEGER, crisis_ended_tick),
        public_address_last_tick = COALESCE((p_updates->>'public_address_last_tick')::INTEGER, public_address_last_tick),
        tier = COALESCE((p_updates->>'tier')::INTEGER, tier),
        crisis_started_tick = COALESCE((p_updates->>'crisis_started_tick')::INTEGER, crisis_started_tick),
        crisis_duration = COALESCE((p_updates->>'crisis_duration')::INTEGER, crisis_duration),
        tier7_demand = COALESCE((p_updates->'tier7_demand')::JSONB, tier7_demand),
        effects_applied = COALESCE((p_updates->'effects_applied')::JSONB, effects_applied)
    WHERE id = p_protest_id;

    -- Clear lockouts on all factions locked by this protest
    IF p_clear_lockouts THEN
        UPDATE factions SET protest_locked_by = NULL
        WHERE protest_locked_by = p_protest_id::TEXT;
    END IF;

    -- Set cooldown on a specific faction
    IF p_cooldown_faction_id IS NOT NULL AND p_cooldown_until IS NOT NULL THEN
        UPDATE factions SET protest_cooldown_until_tick = p_cooldown_until
        WHERE id = p_cooldown_faction_id;
    END IF;
END;
$$;
