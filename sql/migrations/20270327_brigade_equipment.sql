-- ════════════════════════════════════════════════════════════════════
-- BRIGADE EQUIPMENT — assign on-hand rifles to a unit's brigades
-- ════════════════════════════════════════════════════════════════════
-- Each brigade in an army_unit (a position in army_units.brigades) can be
-- equipped with rifles drawn from the faction's on-hand pool
-- (army_rifle_inventory). One rifle arms up to 1,000 soldiers, so a brigade of
-- M manpower needs CEIL(M / 1000) rifles. ONE rifle model per brigade.
--
-- equip_brigade ALLOCATES rifles: on-hand quantity drops, the brigade's
-- equipment row rises (rifles are now "in the field"). unequip_brigade returns
-- a brigade's rifles to on-hand. Total rifles = on-hand + equipped.
--
-- SCOPE: assignment + display only. Equipped status / rifle quality have no
-- combat effect yet. Both RPCs are SECURITY DEFINER and owner-gated (mirrors
-- buy_rifles / create_unit); army_rifle_inventory has no client-write policy, so
-- these are the sole writers of both tables.
--
-- NOTE: a brigade's manpower per type is inlined here (CASE) to mirror the
-- create_unit RPC (20270132) and AU_BRIGADES (js/create-unit.js) — the bonding
-- specs have no shared SQL source; keep the three in sync.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.army_brigade_equipment (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    army_unit_id   UUID NOT NULL REFERENCES army_units(id) ON DELETE CASCADE,
    brigade_index  INT  NOT NULL CHECK (brigade_index >= 0),   -- position in army_units.brigades
    rifle_model_id UUID NOT NULL REFERENCES rifle_models(id),
    quantity       INT  NOT NULL CHECK (quantity > 0),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_brigade_equipment UNIQUE (army_unit_id, brigade_index)  -- one model per brigade
);
CREATE INDEX IF NOT EXISTS idx_brigade_equip_unit ON army_brigade_equipment (army_unit_id);

ALTER TABLE public.army_brigade_equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "brigade_equip_read_all" ON public.army_brigade_equipment;
CREATE POLICY "brigade_equip_read_all"
    ON public.army_brigade_equipment FOR SELECT TO authenticated USING (true);

-- ── equip_brigade ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.equip_brigade(
    p_unit_id UUID, p_brigade_index INT, p_rifle_model_id UUID, p_quantity INT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_user      UUID := auth.uid();
    v_unit      army_units%ROWTYPE;
    v_fac       factions%ROWTYPE;
    v_key       TEXT;
    v_mp        INT;
    v_needed    INT;
    v_have      INT;
    v_cur_qty   INT;
    v_cur_model UUID;
    v_inv_id    UUID;
BEGIN
    IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated'); END IF;
    IF p_quantity IS NULL OR p_quantity < 1 THEN RETURN jsonb_build_object('ok', false, 'error', 'Quantity must be at least 1'); END IF;

    SELECT * INTO v_unit FROM army_units WHERE id = p_unit_id FOR UPDATE;
    IF v_unit.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Unit not found'); END IF;

    SELECT * INTO v_fac FROM factions WHERE id = v_unit.faction_id FOR UPDATE;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Army faction not found'); END IF;
    IF v_fac.id <> v_user AND v_fac.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('ok', false, 'error', 'You do not command this army');
    END IF;

    -- Brigade at this index + its manpower (mirror create_unit / AU_BRIGADES).
    IF p_brigade_index < 0 OR p_brigade_index >= jsonb_array_length(v_unit.brigades) THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Invalid brigade');
    END IF;
    v_key := v_unit.brigades ->> p_brigade_index;
    v_mp := CASE v_key
        WHEN 'light_infantry' THEN 2000 WHEN 'infantry' THEN 3000
        WHEN 'mechanized'     THEN 1000 WHEN 'armor'    THEN 500
        WHEN 'artillery'      THEN 1000 WHEN 'support'  THEN 2000 ELSE 0 END;
    IF v_mp = 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'Unknown brigade type'); END IF;
    v_needed := CEIL(v_mp::numeric / 1000)::int;   -- 1 rifle arms up to 1,000

    PERFORM 1 FROM rifle_models WHERE id = p_rifle_model_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Rifle model not found'); END IF;

    -- Existing equipment on this brigade (one model per brigade).
    SELECT rifle_model_id, quantity INTO v_cur_model, v_cur_qty
      FROM army_brigade_equipment
     WHERE army_unit_id = p_unit_id AND brigade_index = p_brigade_index FOR UPDATE;
    IF v_cur_model IS NOT NULL AND v_cur_model <> p_rifle_model_id THEN
        RETURN jsonb_build_object('ok', false, 'error', 'This brigade already carries a different rifle — un-equip it first.');
    END IF;
    v_cur_qty := COALESCE(v_cur_qty, 0);
    IF v_cur_qty + p_quantity > v_needed THEN
        RETURN jsonb_build_object('ok', false, 'error',
            format('This brigade needs %s rifle(s); %s already equipped.', v_needed, v_cur_qty));
    END IF;

    -- On-hand of this model for the faction.
    SELECT id, quantity INTO v_inv_id, v_have FROM army_rifle_inventory
     WHERE faction_id = v_fac.id AND rifle_model_id = p_rifle_model_id FOR UPDATE;
    IF v_have IS NULL OR v_have < p_quantity THEN
        RETURN jsonb_build_object('ok', false, 'error',
            format('Not enough on hand: %s available.', COALESCE(v_have, 0)));
    END IF;

    -- Allocate on-hand → brigade.
    UPDATE army_rifle_inventory SET quantity = quantity - p_quantity, updated_at = now() WHERE id = v_inv_id;
    INSERT INTO army_brigade_equipment (army_unit_id, brigade_index, rifle_model_id, quantity)
    VALUES (p_unit_id, p_brigade_index, p_rifle_model_id, p_quantity)
    ON CONFLICT (army_unit_id, brigade_index)
        DO UPDATE SET quantity = army_brigade_equipment.quantity + EXCLUDED.quantity, updated_at = now();

    RETURN jsonb_build_object('ok', true, 'equipped', v_cur_qty + p_quantity, 'needed', v_needed);
END; $$;

GRANT EXECUTE ON FUNCTION public.equip_brigade(UUID, INT, UUID, INT) TO authenticated;

-- ── unequip_brigade — return a brigade's rifles to on-hand ───────────
CREATE OR REPLACE FUNCTION public.unequip_brigade(p_unit_id UUID, p_brigade_index INT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_user UUID := auth.uid();
    v_unit army_units%ROWTYPE;
    v_fac  factions%ROWTYPE;
    v_eq   army_brigade_equipment%ROWTYPE;
BEGIN
    IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated'); END IF;

    SELECT * INTO v_unit FROM army_units WHERE id = p_unit_id;
    IF v_unit.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Unit not found'); END IF;

    SELECT * INTO v_fac FROM factions WHERE id = v_unit.faction_id FOR UPDATE;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Army faction not found'); END IF;
    IF v_fac.id <> v_user AND v_fac.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('ok', false, 'error', 'You do not command this army');
    END IF;

    SELECT * INTO v_eq FROM army_brigade_equipment
     WHERE army_unit_id = p_unit_id AND brigade_index = p_brigade_index FOR UPDATE;
    IF v_eq.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Nothing equipped'); END IF;

    INSERT INTO army_rifle_inventory (faction_id, rifle_model_id, quantity)
    VALUES (v_fac.id, v_eq.rifle_model_id, v_eq.quantity)
    ON CONFLICT (faction_id, rifle_model_id)
        DO UPDATE SET quantity = army_rifle_inventory.quantity + EXCLUDED.quantity, updated_at = now();
    DELETE FROM army_brigade_equipment WHERE id = v_eq.id;

    RETURN jsonb_build_object('ok', true, 'returned', v_eq.quantity);
END; $$;

GRANT EXECUTE ON FUNCTION public.unequip_brigade(UUID, INT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
