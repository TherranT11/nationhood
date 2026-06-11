-- ════════════════════════════════════════════════════════════════════
-- 20270821 — The yard redone: equipment units with wear
--
-- HEAVY EQUIPMENT's ladder is now equipment-only (redo spec):
--
--   0  Commercial Rental Yard   PMs buy equipment straight onto an
--                               active project — 1 use, then gone
--   I  Local Maintenance Yard   store 2 units · 3 uses each
--   II District Equipment Depot store 4 · 3 uses
--   III Regional Machinery Hub  store 6 · 3 uses
--   IV National Fleet Logistics store 6 · buy from ABROAD · selling
--                               nationally chartered (player-priced
--                               marketplace is a later build)
--   V  Automated Global Fleet   store 10 · abroad · sell
--                               internationally chartered
--
-- Design rulings (user-confirmed):
--   · A build needs ONE committed equipment use to complete, gating
--     completion exactly like materials. Yard units die after 3
--     committed uses (L0's project-bound purchase is 1 use, no unit).
--   · MATERIALS leave this ladder entirely: all material purchases
--     are project-bound and home-nation, every tier — storage
--     returns when SUPPLY & MATERIAL gets its own ladder. Legacy
--     yard stock stays drainable via apply_materials_to_project.
--   · The former Level V −10% discount is not in the redo — gone.
--   · Selling is chartered at IV/V but ships with the player-priced
--     marketplace later.
--
--   corp_equipment: one row per owned unit (uses_left 1..3). The
--   old equipment_stock count converts to fresh 3-use units and the
--   column is DROPPED. Existing building projects are grandfathered
--   with their equipment use committed.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.corp_equipment (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id          uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    uses_left        int  NOT NULL DEFAULT 3 CHECK (uses_left BETWEEN 1 AND 3),
    acquired_at_tick int  NOT NULL DEFAULT 0,
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS corp_equipment_corp_idx ON public.corp_equipment (corp_id);

ALTER TABLE public.corp_equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.corp_equipment;
CREATE POLICY "Allow select for all" ON public.corp_equipment
    FOR SELECT USING (true);

ALTER TABLE public.corp_construction_projects
    ADD COLUMN IF NOT EXISTS equipment_supplied int NOT NULL DEFAULT 0 CHECK (equipment_supplied >= 0);

-- Grandfather in-flight builds; convert counted stock to 3-use units.
UPDATE public.corp_construction_projects
   SET equipment_supplied = 1 WHERE status = 'building';
INSERT INTO public.corp_equipment (corp_id, uses_left)
SELECT id, 3 FROM public.entrepreneur_corps,
       generate_series(1, GREATEST(COALESCE(equipment_stock, 0), 0))
 WHERE COALESCE(equipment_stock, 0) > 0;
ALTER TABLE public.entrepreneur_corps DROP COLUMN IF EXISTS equipment_stock;

-- ── yard_storage_caps — equipment-only (materials stripped) ───────
CREATE OR REPLACE FUNCTION public.yard_storage_caps(
    p_tier int,
    OUT materials_cap int,
    OUT equipment_cap int
) LANGUAGE sql IMMUTABLE
AS $$
    SELECT 0,
           CASE WHEN COALESCE(p_tier, 0) >= 5 THEN 10
                WHEN COALESCE(p_tier, 0) >= 3 THEN 6
                WHEN COALESCE(p_tier, 0) >= 2 THEN 4
                WHEN COALESCE(p_tier, 0) >= 1 THEN 2
                ELSE 0 END;
$$;

COMMENT ON FUNCTION public.yard_storage_caps(int) IS
    'Yard caps by supply_tier (20270821 redo): equipment units 0/2/4/6/6/10; materials storage stripped (0 at every tier — all material buys are project-bound until Supply & Material gets its own ladder).';

-- ── buy_construction_goods — rewritten for the redo ───────────────
DROP FUNCTION IF EXISTS public.buy_construction_goods(uuid, text, int, uuid, uuid);

CREATE OR REPLACE FUNCTION public.buy_construction_goods(
    p_corp_id    uuid,
    p_good       text,
    p_qty        int,
    p_nation_id  uuid,
    p_project_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_proj   corp_construction_projects%ROWTYPE;
    v_need   int;
    v_caps   record;
    v_units  int;
    v_mkt    jsonb;
    v_price  bigint;
    v_total  bigint;
    v_tick   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL
       OR p_good NOT IN ('materials', 'equipment')
       OR p_qty IS NULL OR p_qty < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: allowance + cap checks must serialize.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    v_caps := yard_storage_caps(COALESCE(v_corp.supply_tier, 0));

    IF p_good = 'materials' THEN
        -- Materials: always project-bound, always home nation —
        -- storage returns with the Supply & Material ladder.
        IF p_nation_id <> v_corp.hq_nation_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'home_nation_only');
        END IF;
        IF p_project_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'project_required');
        END IF;
        SELECT * INTO v_proj FROM corp_construction_projects
         WHERE id = p_project_id AND corp_id = p_corp_id AND status = 'building'
         FOR UPDATE;
        IF v_proj.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'project_not_found');
        END IF;
        v_need := COALESCE((SELECT materials_needed FROM corp_blueprints
                             WHERE id = v_proj.blueprint_id), 0);
        IF v_proj.materials_supplied + p_qty > v_need THEN
            RETURN jsonb_build_object('success', false, 'reason', 'exceeds_project_need',
                'needed', v_need, 'supplied', v_proj.materials_supplied);
        END IF;
    ELSE
        -- Equipment: abroad opens at Level IV.
        IF COALESCE(v_corp.supply_tier, 0) < 4
           AND p_nation_id <> v_corp.hq_nation_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'home_nation_only');
        END IF;
        IF v_caps.equipment_cap = 0 THEN
            -- Level 0: one unit, bought straight onto an active
            -- project — its single use is committed on the spot.
            IF p_qty <> 1 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
            END IF;
            IF p_project_id IS NULL THEN
                RETURN jsonb_build_object('success', false, 'reason', 'project_required');
            END IF;
            SELECT * INTO v_proj FROM corp_construction_projects
             WHERE id = p_project_id AND corp_id = p_corp_id AND status = 'building'
             FOR UPDATE;
            IF v_proj.id IS NULL THEN
                RETURN jsonb_build_object('success', false, 'reason', 'project_not_found');
            END IF;
            IF v_proj.equipment_supplied >= 1 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'exceeds_project_need');
            END IF;
        ELSE
            SELECT COUNT(*) INTO v_units FROM corp_equipment WHERE corp_id = p_corp_id;
            IF v_units + p_qty > v_caps.equipment_cap THEN
                RETURN jsonb_build_object('success', false, 'reason', 'storage_full',
                    'cap', v_caps.equipment_cap, 'stock', v_units);
            END IF;
        END IF;
    END IF;

    -- Price + availability THROUGH the canonical market functions —
    -- the listed price IS the charged price.
    v_mkt := CASE p_good
        WHEN 'materials' THEN construction_materials_market(p_nation_id)
        ELSE construction_equipment_market(p_nation_id)
    END;
    IF NOT COALESCE((v_mkt->>'success')::boolean, false) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'market_unavailable');
    END IF;
    IF p_qty > (v_mkt->>'amount_available')::bigint THEN
        RETURN jsonb_build_object('success', false, 'reason', 'market_sold_out',
            'available', (v_mkt->>'amount_available')::bigint);
    END IF;
    v_price := (v_mkt->>'cost_per_unit')::bigint;
    v_total := v_price * p_qty;
    IF FLOOR(COALESCE(v_corp.treasury_cash, 0)) < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_total, 'have', FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) - v_total,
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    IF p_good = 'materials' THEN
        UPDATE corp_construction_projects
           SET materials_supplied = materials_supplied + p_qty
         WHERE id = p_project_id;
    ELSE
        IF v_caps.equipment_cap = 0 THEN
            UPDATE corp_construction_projects
               SET equipment_supplied = 1
             WHERE id = p_project_id;
        ELSE
            INSERT INTO corp_equipment (corp_id, uses_left, acquired_at_tick)
            SELECT p_corp_id, 3, v_tick FROM generate_series(1, p_qty);
        END IF;
        -- Equipment leaves the seller nation's ratcheting stock —
        -- the ratchet's only down-path. Conditional so a concurrent
        -- buyer can't drive it negative.
        UPDATE nations
           SET construction_equipment_stock = construction_equipment_stock - p_qty
         WHERE id = p_nation_id
           AND construction_equipment_stock >= p_qty;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'reason', 'market_sold_out');
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'qty', p_qty,
        'unit_price', v_price, 'total', v_total);
END $$;

REVOKE EXECUTE ON FUNCTION public.buy_construction_goods(uuid, text, int, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.buy_construction_goods(uuid, text, int, uuid, uuid) TO authenticated;

-- ── commit_equipment_to_project ───────────────────────────────────
-- Free logistics: the owner or the project's player PM commits one
-- use from a yard unit. Most-worn unit first; a unit at its last
-- use is deleted.
CREATE OR REPLACE FUNCTION public.commit_equipment_to_project(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_proj    corp_construction_projects%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_unit    corp_equipment%ROWTYPE;
    v_allowed boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_project_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_proj FROM corp_construction_projects
     WHERE id = p_project_id FOR UPDATE;
    IF v_proj.id IS NULL OR v_proj.status <> 'building' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'project_not_found');
    END IF;
    IF v_proj.equipment_supplied >= 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'exceeds_project_need');
    END IF;
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_proj.corp_id FOR UPDATE;

    SELECT EXISTS (
        SELECT 1 FROM factions f
         WHERE (f.id = v_uid OR f.linked_user_id = v_uid)
           AND f.abandoned_at IS NULL
           AND (f.id = v_corp.owner_faction_id
                OR f.id = (SELECT a.applicant_faction_id FROM job_applicants a
                            WHERE a.id = v_proj.pm_applicant_id))
    ) INTO v_allowed;
    IF NOT v_allowed THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    SELECT * INTO v_unit FROM corp_equipment
     WHERE corp_id = v_corp.id
     ORDER BY uses_left ASC, created_at ASC
     LIMIT 1 FOR UPDATE;
    IF v_unit.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_stock');
    END IF;

    IF v_unit.uses_left <= 1 THEN
        DELETE FROM corp_equipment WHERE id = v_unit.id;
    ELSE
        UPDATE corp_equipment SET uses_left = uses_left - 1 WHERE id = v_unit.id;
    END IF;
    UPDATE corp_construction_projects SET equipment_supplied = 1
     WHERE id = p_project_id;

    RETURN jsonb_build_object('success', true,
        'unit_consumed', v_unit.uses_left <= 1);
END $$;

REVOKE EXECUTE ON FUNCTION public.commit_equipment_to_project(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.commit_equipment_to_project(uuid) TO authenticated;

-- ── complete_construction_projects — equipment joins the gate ─────
-- Byte-faithful to 20270817 except the equipment_supplied condition.
CREATE OR REPLACE FUNCTION public.complete_construction_projects(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_proj      RECORD;
    v_completed int := 0;
    v_tier      text;
    v_aff       numeric;
    v_app       numeric;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    FOR v_proj IN
        SELECT p.* FROM corp_construction_projects p
         WHERE p.status = 'building' AND p.completes_at_tick <= p_tick
           -- 20270817: a due build PARKS until its blueprint's
           -- materials have been supplied; it completes on the first
           -- sweep after the yard delivers. Blueprint-less projects
           -- owe nothing.
           AND p.materials_supplied >= COALESCE((
               SELECT b.materials_needed FROM corp_blueprints b
                WHERE b.id = p.blueprint_id), 0)
           -- 20270821: and one committed equipment use.
           AND p.equipment_supplied >= 1
         FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE corp_construction_projects SET status = 'completed'
         WHERE id = v_proj.id;
        -- The escrowed price lands; stamped through the revenue
        -- accumulator so the Finances cards and corporate tax both
        -- see construction income.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_proj.price
         WHERE id = v_proj.corp_id;
        PERFORM stamp_entrepreneur_corp_revenue(v_proj.corp_id, p_tick, v_proj.price);

        -- Quality-tier city effects (20270810): the finished building
        -- moves the host city's stats. Tier comes from the blueprint
        -- (one source); a deleted blueprint or a city-less project
        -- simply applies nothing. Clamped 1..10 like the ordinance
        -- resolver's stat moves.
        --   low_cost +0.1 Affordability · standard — ·
        --   high_end −0.1 Affordability · luxury and ultra_rich
        --   −0.3 Affordability and +0.1 Appeal
        IF v_proj.city_id IS NOT NULL AND v_proj.blueprint_id IS NOT NULL THEN
            SELECT quality_tier INTO v_tier
              FROM corp_blueprints WHERE id = v_proj.blueprint_id;
            v_aff := CASE v_tier
                WHEN 'low_cost'   THEN  0.1
                WHEN 'high_end'   THEN -0.1
                WHEN 'luxury'     THEN -0.3
                WHEN 'ultra_rich' THEN -0.3
                ELSE 0 END;
            v_app := CASE v_tier WHEN 'luxury' THEN 0.1 WHEN 'ultra_rich' THEN 0.1 ELSE 0 END;
            IF v_aff <> 0 OR v_app <> 0 THEN
                UPDATE cities
                   SET affordability = GREATEST(1, LEAST(10, COALESCE(affordability, 5) + v_aff)),
                       appeal        = GREATEST(1, LEAST(10, COALESCE(appeal, 5)        + v_app))
                 WHERE id = v_proj.city_id;
            END IF;
        END IF;

        v_completed := v_completed + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'completed', v_completed);
END $$;

REVOKE EXECUTE ON FUNCTION public.complete_construction_projects(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.complete_construction_projects(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
