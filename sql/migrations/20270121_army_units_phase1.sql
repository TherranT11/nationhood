-- ════════════════════════════════════════════════════════════════
-- Create Unit — Phase 1 (core): army_units table + create_unit RPC.
--
-- Scope (per product decision): unit designation + brigade
-- composition + manpower/cost. NO equipment (Procurement subsystem
-- doesn't exist yet — deferred), NO officers/depots (deferred).
-- Manpower is tracked committed-vs-available: committed =
-- SUM(army_units.total_manpower) for the faction's non-decommissioned
-- units; available = factions.army_manpower − committed. Forming→
-- Active is a 2-tick transition handled by processFormingUnits
-- (js/game/military-units.js) — explicitly approved automation.
--
-- Money: ministries.discretionary_balance (defense) is RAW DOLLARS
-- (1M = 1000000), matching the discretionary-grant ledger. The RPC
-- charges the $2M action fee + per-brigade construction cost in raw
-- dollars and is the single authority on brigade specs (the modal
-- duplicates the numbers for display only — kept in sync by comment).
--
-- Writes go only through this SECURITY DEFINER RPC + the service-role
-- tick (Forming sweep); no client-write RLS policy. Idempotent DDL.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS army_units (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id        UUID         NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id         UUID         NOT NULL REFERENCES nations(id),
    name              TEXT         NOT NULL,
    -- jsonb array of brigade type keys, length 1..6
    brigades          JSONB        NOT NULL,
    total_manpower    INT          NOT NULL,           -- denormalised for the committed-manpower SUM
    construction_cost NUMERIC      NOT NULL,           -- raw dollars (excludes the action fee)
    status            TEXT         NOT NULL DEFAULT 'Forming'
                          CHECK (status IN ('Forming','Active','Decommissioned')),
    section           TEXT         NOT NULL DEFAULT 'regular_army'
                          CHECK (section IN ('royal_guard','regular_army','tribal_levies')),
    created_at_tick   INT          NOT NULL,
    forming_until_tick INT         NOT NULL,           -- becomes Active when current_tick >= this
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_army_units_faction        ON army_units (faction_id);
CREATE INDEX IF NOT EXISTS idx_army_units_faction_status ON army_units (faction_id, status);
CREATE INDEX IF NOT EXISTS idx_army_units_forming        ON army_units (status, forming_until_tick);

ALTER TABLE army_units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "army_units_read_all" ON army_units;
CREATE POLICY "army_units_read_all"
    ON army_units FOR SELECT TO authenticated USING (true);
-- No write policy: create_unit (SECURITY DEFINER) + tick sweep only.

-- ── create_unit RPC ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_unit(
    p_faction_id UUID,
    p_name       TEXT,
    p_brigades   JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user       UUID := auth.uid();
    v_fac        factions%ROWTYPE;
    v_name       TEXT;
    v_count      INT;
    v_b          TEXT;
    v_manpower   INT  := 0;
    v_cost       NUMERIC := 0;   -- raw dollars, construction only
    v_fee        NUMERIC := 2000000;
    v_outlay     NUMERIC;
    v_tick       INT;
    v_committed  INT;
    v_available  INT;
    v_balance    NUMERIC;
    v_unit_id    UUID;
BEGIN
    -- Brigade specs — SINGLE AUTHORITY. Keep in sync with the modal's
    -- BRIGADE_SPECS (display-only copy) in army-dashboard.html.
    --   key            manpower  construction($)
    --   light_infantry     2000   1000000
    --   infantry           3000   2000000
    --   mechanized         1000   3000000
    --   armor               500   5000000
    --   artillery          1000   2000000
    --   support            2000   2000000

    SELECT * INTO v_fac FROM factions WHERE id = p_faction_id;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Army faction not found');
    END IF;
    IF v_fac.faction_type <> 'military' OR v_fac.branch <> 'army' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not an army faction');
    END IF;
    -- Caller must control this army faction (Chief of the Army). Mirrors
    -- the ownership check in acknowledge_corp_contract_event / disband.
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF v_fac.id <> v_user AND v_fac.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not command this army');
    END IF;

    v_name := NULLIF(btrim(COALESCE(p_name, '')), '');
    IF v_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unit name is required');
    END IF;

    IF jsonb_typeof(p_brigades) <> 'array' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid brigade composition');
    END IF;
    v_count := jsonb_array_length(p_brigades);
    IF v_count < 1 OR v_count > 6 THEN
        RETURN jsonb_build_object('success', false, 'error', 'A unit must have 1 to 6 brigades');
    END IF;

    FOR i IN 0 .. v_count - 1 LOOP
        v_b := p_brigades ->> i;
        IF    v_b = 'light_infantry' THEN v_manpower := v_manpower + 2000; v_cost := v_cost + 1000000;
        ELSIF v_b = 'infantry'       THEN v_manpower := v_manpower + 3000; v_cost := v_cost + 2000000;
        ELSIF v_b = 'mechanized'     THEN v_manpower := v_manpower + 1000; v_cost := v_cost + 3000000;
        ELSIF v_b = 'armor'          THEN v_manpower := v_manpower +  500; v_cost := v_cost + 5000000;
        ELSIF v_b = 'artillery'      THEN v_manpower := v_manpower + 1000; v_cost := v_cost + 2000000;
        ELSIF v_b = 'support'        THEN v_manpower := v_manpower + 2000; v_cost := v_cost + 2000000;
        ELSE
            RETURN jsonb_build_object('success', false, 'error', format('Unknown brigade type: %s', v_b));
        END IF;
    END LOOP;
    v_outlay := v_cost + v_fee;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Manpower: committed = non-decommissioned units; available = pool − committed.
    SELECT COALESCE(SUM(total_manpower), 0) INTO v_committed
      FROM army_units
     WHERE faction_id = p_faction_id AND status <> 'Decommissioned';
    v_available := COALESCE(v_fac.army_manpower, 0)::int - v_committed;
    IF v_manpower > v_available THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient manpower: %s available, %s required', v_available, v_manpower));
    END IF;

    -- Funds: defense ministry discretionary_balance (raw dollars).
    SELECT COALESCE(discretionary_balance, 0) INTO v_balance
      FROM ministries
     WHERE nation_id = v_fac.nation_id AND ministry_key = 'defense' AND is_active = true
     LIMIT 1;
    IF v_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active defense ministry budget');
    END IF;
    IF v_balance < v_outlay THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient Army Funds: $%sM available, $%sM required',
                round(v_balance/1000000.0, 1), round(v_outlay/1000000.0, 1)));
    END IF;

    UPDATE ministries
       SET discretionary_balance = discretionary_balance - v_outlay
     WHERE nation_id = v_fac.nation_id AND ministry_key = 'defense' AND is_active = true;

    INSERT INTO army_units
        (faction_id, nation_id, name, brigades, total_manpower, construction_cost,
         status, section, created_at_tick, forming_until_tick)
    VALUES
        (p_faction_id, v_fac.nation_id, v_name, p_brigades, v_manpower, v_cost,
         'Forming', 'regular_army', v_tick, v_tick + 2)
    RETURNING id INTO v_unit_id;

    RETURN jsonb_build_object(
        'success',   true,
        'unit_id',   v_unit_id,
        'name',      v_name,
        'manpower',  v_manpower,
        'outlay',    v_outlay,
        'ready_tick', v_tick + 2
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.create_unit(UUID, TEXT, JSONB) TO authenticated;
