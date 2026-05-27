-- ════════════════════════════════════════════════════════════════════
-- EQUIPMENT QUALITY — derived from the rifles a faction has equipped
-- ════════════════════════════════════════════════════════════════════
-- factions.army_equipment (the dashboard's "Equipment Quality" 0–100 meter)
-- has sat at its default 0, never written. It now becomes a DERIVED stat: the
-- quantity-weighted median quality of every rifle the faction has equipped to a
-- brigade (army_brigade_equipment), scaled to the 0–100 meter.
--
-- Rifle quality (rifle_models.quality) is a 0–10 generated value
-- (reliability+lethality+complexity)/3. Each equipped rifle counts as one item,
-- so a fleet of 8,000 quality-4.3 rifles outweighs 1,000 quality-6.3 ones. The
-- weighted median is the quality at the 50th-percentile rifle, ×10 → 0–100.
-- A faction with nothing equipped reads 0 ("Obsolete kit").
--
-- ONE SOURCE: equipped state only ever changes through equip_brigade /
-- unequip_brigade (sole writers of army_brigade_equipment; army_units has no
-- disband path). So both RPCs recompute the issuing faction's army_equipment
-- before they return — no tick processor, no edge resync. The helper is the
-- single place the formula lives; the RPCs just call it.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Derived-value helper (single source of the formula) ──────────────
-- Quantity-weighted median rifle quality (0–10), scaled ×10 → factions
-- .army_equipment (0–100). Privileged internal mutator: owner-only (callers
-- are the SECURITY DEFINER equip/unequip RPCs + the backfill below).
CREATE OR REPLACE FUNCTION public.recompute_army_equipment_quality(p_faction_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE factions f
       SET army_equipment = COALESCE((
           WITH eq AS (
               SELECT rm.quality::numeric AS q, SUM(be.quantity)::numeric AS n
                 FROM army_brigade_equipment be
                 JOIN army_units   au ON au.id = be.army_unit_id
                 JOIN rifle_models rm ON rm.id = be.rifle_model_id
                WHERE au.faction_id = p_faction_id
                GROUP BY rm.quality
           ),
           tot AS (SELECT SUM(n) AS total FROM eq),
           ordered AS (
               SELECT q, SUM(n) OVER (ORDER BY q) AS cum FROM eq
           )
           -- Lower weighted median: first quality whose cumulative rifle count
           -- reaches half the fleet. Scaled to the 0–100 meter, clamped.
           SELECT round(LEAST(100, GREATEST(0, o.q * 10)))
             FROM ordered o, tot
            WHERE o.cum >= tot.total / 2.0
            ORDER BY o.q
            LIMIT 1
       ), 0)
     WHERE f.id = p_faction_id;
$$;

REVOKE EXECUTE ON FUNCTION public.recompute_army_equipment_quality(UUID) FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.recompute_army_equipment_quality(UUID) IS
    'Recomputes factions.army_equipment (Equipment Quality, 0–100) as the quantity-weighted median quality of the faction''s equipped rifles (army_brigade_equipment → rifle_models.quality, 0–10, ×10). 0 if nothing equipped. Called by equip_brigade / unequip_brigade (the sole writers of equipped state). Owner-only.';


-- ── equip_brigade — body from 20270327, + recompute before return ────
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

    PERFORM recompute_army_equipment_quality(v_fac.id);

    RETURN jsonb_build_object('ok', true, 'equipped', v_cur_qty + p_quantity, 'needed', v_needed);
END; $$;

GRANT EXECUTE ON FUNCTION public.equip_brigade(UUID, INT, UUID, INT) TO authenticated;

-- ── unequip_brigade — body from 20270327, + recompute before return ──
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

    PERFORM recompute_army_equipment_quality(v_fac.id);

    RETURN jsonb_build_object('ok', true, 'returned', v_eq.quantity);
END; $$;

GRANT EXECUTE ON FUNCTION public.unequip_brigade(UUID, INT) TO authenticated;

-- ── One-time backfill: derive army_equipment for every army faction ──
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT id FROM factions WHERE faction_type = 'military' AND branch = 'army' LOOP
        PERFORM recompute_army_equipment_quality(r.id);
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
