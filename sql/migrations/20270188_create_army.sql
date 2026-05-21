-- ════════════════════════════════════════════════════════════════
-- Create Army — group units into named fighting formations.
--
-- An "army" (e.g. "1st Army of Avelia", "II Corps") is a named
-- formation that owns a set of the faction's existing units. Units
-- carry a nullable army_units.army_id; unassigned units render under
-- the default "Regular Army" group in the Order of Battle.
--
-- Army type drives upkeep + (recorded-only, for now) equipment/training
-- doctrine:
--   regular       no change.
--   guard         +$1/tick upkeep per unit; receives the latest
--                 equipment when available (doctrine — inert until a
--                 procurement system exists).
--   paramilitary  −$1/tick upkeep per unit (floored at the $1 minimum
--                 in unitUpkeepPerTick); training capped at 70; lowest
--                 quality equipment (doctrine — inert for now).
--
-- The ±$1 upkeep modifier is DERIVED from army_type at read time by
-- unitUpkeepPerTick(constructionCost, armyType) — no denormalised
-- per-unit copy, so the OOB readout and the nation defense-maintenance
-- budget (budget.js / government.html / advance-tick) cannot drift.
--
-- Money: $2M action fee from the army faction's treasury
-- (factions.party_funds), matching create_unit (20270125). No
-- per-brigade cost — the units already exist.
--
-- Writes go only through the create_army SECURITY DEFINER RPC; no
-- client-write RLS policy. Idempotent DDL.
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS armies (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id      UUID         NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id       UUID         NOT NULL REFERENCES nations(id),
    name            TEXT         NOT NULL,
    army_type       TEXT         NOT NULL DEFAULT 'regular'
                        CHECK (army_type IN ('regular','guard','paramilitary')),
    created_at_tick INT          NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_armies_faction ON armies (faction_id);

ALTER TABLE armies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "armies_read_all" ON armies;
CREATE POLICY "armies_read_all"
    ON armies FOR SELECT TO authenticated USING (true);
-- No write policy: create_army (SECURITY DEFINER) only.

-- Unit → army membership. ON DELETE SET NULL so disbanding an army
-- (future action) returns its units to the unassigned "Regular Army".
ALTER TABLE army_units
    ADD COLUMN IF NOT EXISTS army_id UUID REFERENCES armies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_army_units_army ON army_units (army_id) WHERE army_id IS NOT NULL;

COMMENT ON COLUMN army_units.army_id IS
    'Owning formation (armies.id) or NULL = unassigned (renders under the default Regular Army group). Set by create_army. The army''s army_type drives the unit''s upkeep modifier via unitUpkeepPerTick.';

-- ── create_army RPC ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_army(
    p_faction_id UUID,
    p_name       TEXT,
    p_type       TEXT,
    p_unit_ids   JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user      UUID := auth.uid();
    v_fac       factions%ROWTYPE;
    v_name      TEXT;
    v_type      TEXT;
    v_fee       NUMERIC := 2000000;
    v_balance   NUMERIC;
    v_tick      INT;
    v_ids       UUID[];
    v_n_req     INT;
    v_n_valid   INT;
    v_army_id   UUID;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_fac FROM factions WHERE id = p_faction_id;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Army faction not found');
    END IF;
    IF v_fac.faction_type <> 'military' OR v_fac.branch <> 'army' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not an army faction');
    END IF;
    IF v_fac.id <> v_user AND v_fac.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not command this army');
    END IF;

    v_name := NULLIF(btrim(COALESCE(p_name, '')), '');
    IF v_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Army name is required');
    END IF;
    IF length(v_name) > 80 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Army name is too long');
    END IF;

    v_type := lower(btrim(COALESCE(p_type, '')));
    IF v_type NOT IN ('regular','guard','paramilitary') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid army type');
    END IF;

    -- Unit list → uuid[]; require at least one.
    IF p_unit_ids IS NULL OR jsonb_typeof(p_unit_ids) <> 'array' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid unit selection');
    END IF;
    SELECT array_agg(value::uuid) INTO v_ids FROM jsonb_array_elements_text(p_unit_ids);
    v_n_req := COALESCE(array_length(v_ids, 1), 0);
    IF v_n_req < 1 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Assign at least one unit');
    END IF;

    -- Every id must be a non-decommissioned, currently-unassigned unit
    -- of THIS faction. Validate before charging or inserting.
    SELECT COUNT(*) INTO v_n_valid
      FROM army_units
     WHERE id = ANY(v_ids)
       AND faction_id = p_faction_id
       AND army_id IS NULL
       AND status <> 'Decommissioned';
    IF v_n_valid <> v_n_req THEN
        RETURN jsonb_build_object('success', false,
            'error', 'One or more units are invalid or already assigned to an army');
    END IF;

    -- Funds: the army faction's own treasury (factions.party_funds).
    v_balance := COALESCE(v_fac.party_funds, 0);
    IF v_balance < v_fee THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient Army Funds: $%sM available, $%sM required',
                round(v_balance/1000000.0, 1), round(v_fee/1000000.0, 1)));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_fee
     WHERE id = p_faction_id;

    INSERT INTO armies (faction_id, nation_id, name, army_type, created_at_tick)
    VALUES (p_faction_id, v_fac.nation_id, v_name, v_type, v_tick)
    RETURNING id INTO v_army_id;

    UPDATE army_units
       SET army_id = v_army_id
     WHERE id = ANY(v_ids)
       AND faction_id = p_faction_id
       AND army_id IS NULL
       AND status <> 'Decommissioned';

    RETURN jsonb_build_object(
        'success',   true,
        'army_id',   v_army_id,
        'name',      v_name,
        'type',      v_type,
        'units',     v_n_req,
        'fee',       v_fee
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.create_army(UUID, TEXT, TEXT, JSONB) TO authenticated;

COMMENT ON FUNCTION public.create_army(UUID, TEXT, TEXT, JSONB) IS
    'Chief of Staff forms existing units into a named army (regular/guard/paramilitary). Charges a $2M action fee from factions.party_funds, assigns the listed (own, non-decommissioned, unassigned) units to a new armies row. Type drives the upkeep modifier via unitUpkeepPerTick.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.create_army(UUID, TEXT, TEXT, JSONB);
-- ALTER TABLE army_units DROP COLUMN IF EXISTS army_id;
-- DROP TABLE IF EXISTS armies;
-- COMMIT;
