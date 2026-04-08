-- ════════════════════════════════════════════════════════════════════════════════
-- Project Material Allocations
-- Phase 1 of the construction resource management system.
--
-- Tracks materials manually allocated from corp_warehouse to construction
-- projects. Materials are reserved (removed from warehouse) when allocated
-- and returned if deallocated. The tick processor consumes from allocations
-- as the project progresses — projects stall if materials aren't allocated.
-- ════════════════════════════════════════════════════════════════════════════════

-- Allocation table: one row per material per quality tier per project
CREATE TABLE IF NOT EXISTS project_material_allocations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id     UUID NOT NULL REFERENCES construction_contracts(id) ON DELETE CASCADE,
    faction_id      UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    material_key    TEXT NOT NULL,
    quality_tier    TEXT NOT NULL CHECK (quality_tier IN ('LOW', 'STD', 'HIGH')),
    quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    consumed        INTEGER NOT NULL DEFAULT 0 CHECK (consumed >= 0),
    allocated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(contract_id, material_key, quality_tier)
);

CREATE INDEX IF NOT EXISTS idx_pma_contract ON project_material_allocations(contract_id);
CREATE INDEX IF NOT EXISTS idx_pma_faction ON project_material_allocations(faction_id);

-- RLS
ALTER TABLE project_material_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pma_select" ON project_material_allocations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "pma_insert" ON project_material_allocations
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "pma_update" ON project_material_allocations
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "pma_delete" ON project_material_allocations
    FOR DELETE TO authenticated USING (true);


-- ════════════════════════════════════════════════════════════════════════════════
-- RPC: allocate_material_to_project
--
-- Atomically moves materials from corp_warehouse to a project allocation.
-- Validates: warehouse has enough stock, project requires this material,
-- allocation doesn't exceed requirement.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION allocate_material_to_project(
    p_contract_id UUID,
    p_faction_id UUID,
    p_material_key TEXT,
    p_quality_tier TEXT,
    p_quantity INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_warehouse_qty INTEGER;
    v_required INTEGER;
    v_already_allocated INTEGER;
    v_max_allocatable INTEGER;
    v_actual_qty INTEGER;
    v_new_warehouse_qty INTEGER;
BEGIN
    IF p_quantity <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Quantity must be positive');
    END IF;

    -- 1. Check warehouse stock
    SELECT quantity INTO v_warehouse_qty
    FROM corp_warehouse
    WHERE faction_id = p_faction_id
      AND material_key = p_material_key
      AND quality_tier = p_quality_tier
    FOR UPDATE;  -- Row lock to prevent race conditions

    IF v_warehouse_qty IS NULL OR v_warehouse_qty <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No stock of ' || p_material_key || ' (' || p_quality_tier || ') in warehouse');
    END IF;

    -- 2. Check project requires this material
    SELECT COALESCE((required_materials->>p_material_key)::INTEGER, 0) INTO v_required
    FROM construction_contracts
    WHERE id = p_contract_id AND awarded_to_faction = p_faction_id;

    IF v_required <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Project does not require ' || p_material_key);
    END IF;

    -- 3. Check how much is already allocated (across all quality tiers for this material)
    SELECT COALESCE(SUM(quantity), 0) INTO v_already_allocated
    FROM project_material_allocations
    WHERE contract_id = p_contract_id AND material_key = p_material_key;

    v_max_allocatable := v_required - v_already_allocated;
    IF v_max_allocatable <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', p_material_key || ' is fully allocated (' || v_already_allocated || '/' || v_required || ')');
    END IF;

    -- 4. Clamp to what's available and what's needed
    v_actual_qty := LEAST(p_quantity, v_warehouse_qty, v_max_allocatable);

    -- 5. Deduct from warehouse
    UPDATE corp_warehouse
    SET quantity = quantity - v_actual_qty,
        last_used_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard'),
        updated_at = now()
    WHERE faction_id = p_faction_id
      AND material_key = p_material_key
      AND quality_tier = p_quality_tier;

    -- 6. Upsert allocation (add to existing if same material+tier already allocated)
    INSERT INTO project_material_allocations (contract_id, faction_id, material_key, quality_tier, quantity)
    VALUES (p_contract_id, p_faction_id, p_material_key, p_quality_tier, v_actual_qty)
    ON CONFLICT (contract_id, material_key, quality_tier)
    DO UPDATE SET quantity = project_material_allocations.quantity + v_actual_qty;

    RETURN jsonb_build_object(
        'success', true,
        'allocated', v_actual_qty,
        'warehouse_remaining', v_warehouse_qty - v_actual_qty,
        'total_allocated', v_already_allocated + v_actual_qty,
        'required', v_required
    );
END;
$$;

ALTER FUNCTION allocate_material_to_project(UUID, UUID, TEXT, TEXT, INTEGER) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION allocate_material_to_project(UUID, UUID, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION allocate_material_to_project(UUID, UUID, TEXT, TEXT, INTEGER) TO service_role;


-- ════════════════════════════════════════════════════════════════════════════════
-- RPC: deallocate_material_from_project
--
-- Returns un-consumed materials from a project allocation back to warehouse.
-- Only returns quantity minus what's already been consumed by the tick processor.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION deallocate_material_from_project(
    p_contract_id UUID,
    p_faction_id UUID,
    p_material_key TEXT,
    p_quality_tier TEXT,
    p_quantity INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_alloc_qty INTEGER;
    v_consumed INTEGER;
    v_returnable INTEGER;
    v_actual_return INTEGER;
BEGIN
    IF p_quantity <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Quantity must be positive');
    END IF;

    -- 1. Get current allocation
    SELECT quantity, consumed INTO v_alloc_qty, v_consumed
    FROM project_material_allocations
    WHERE contract_id = p_contract_id
      AND material_key = p_material_key
      AND quality_tier = p_quality_tier
    FOR UPDATE;

    IF v_alloc_qty IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No allocation found for ' || p_material_key || ' (' || p_quality_tier || ')');
    END IF;

    -- 2. Can only return un-consumed materials
    v_returnable := v_alloc_qty - v_consumed;
    IF v_returnable <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'All allocated ' || p_material_key || ' has been consumed — nothing to return');
    END IF;

    v_actual_return := LEAST(p_quantity, v_returnable);

    -- 3. Reduce allocation (or delete if fully returned)
    IF v_alloc_qty - v_actual_return <= v_consumed THEN
        -- Only consumed amount remains — set quantity to consumed
        UPDATE project_material_allocations
        SET quantity = v_consumed
        WHERE contract_id = p_contract_id
          AND material_key = p_material_key
          AND quality_tier = p_quality_tier;
    ELSE
        UPDATE project_material_allocations
        SET quantity = quantity - v_actual_return
        WHERE contract_id = p_contract_id
          AND material_key = p_material_key
          AND quality_tier = p_quality_tier;
    END IF;

    -- 4. Return to warehouse
    INSERT INTO corp_warehouse (faction_id, nation_id, material_key, quality_tier, quantity, total_value)
    SELECT p_faction_id,
           (SELECT nation_id FROM construction_contracts WHERE id = p_contract_id),
           p_material_key,
           p_quality_tier,
           v_actual_return,
           0  -- returned materials have no tracked cost
    ON CONFLICT (faction_id, material_key, quality_tier)
    DO UPDATE SET quantity = corp_warehouse.quantity + v_actual_return,
                  updated_at = now();

    RETURN jsonb_build_object(
        'success', true,
        'returned', v_actual_return,
        'remaining_allocated', v_alloc_qty - v_actual_return,
        'consumed', v_consumed
    );
END;
$$;

ALTER FUNCTION deallocate_material_from_project(UUID, UUID, TEXT, TEXT, INTEGER) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION deallocate_material_from_project(UUID, UUID, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION deallocate_material_from_project(UUID, UUID, TEXT, TEXT, INTEGER) TO service_role;
