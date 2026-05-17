-- ════════════════════════════════════════════════════════════════
-- create_unit: charge the army faction's own treasury, not the
-- defense ministry balance.
--
-- allocate_defense_funds (20270115) moves money FROM
-- ministries.discretionary_balance (defense) INTO the army faction's
-- factions.party_funds. But create_unit (20270121) read & debited
-- ministries.discretionary_balance — a different pot. So an
-- allocation lowered the pot Create Unit spent from while the money
-- actually delivered sat unused in party_funds.
--
-- Fix: factions.party_funds is THE single army treasury. This
-- CREATE OR REPLACE (same signature as 20270121, so callers/grants
-- are unaffected) swaps only the funds block to read & debit
-- v_fac.party_funds / factions.party_funds. The army-dashboard
-- "Available Budget" card and the Create Unit modal both read
-- party_funds too, so allocation → dashboard → spending now agree.
-- Everything else (ownership check, brigade compute, manpower gate,
-- unit insert) is byte-for-byte 20270121.
-- ════════════════════════════════════════════════════════════════

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
    -- BRIGADE_SPECS (display-only copy) in js/create-unit.js.
    --   light_infantry 2000/1M  infantry 3000/2M  mechanized 1000/3M
    --   armor 500/5M  artillery 1000/2M  support 2000/2M

    SELECT * INTO v_fac FROM factions WHERE id = p_faction_id;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Army faction not found');
    END IF;
    IF v_fac.faction_type <> 'military' OR v_fac.branch <> 'army' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not an army faction');
    END IF;
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

    -- Funds: the army faction's own treasury (factions.party_funds) —
    -- the single army pot allocate_defense_funds deposits into. Raw
    -- dollars, same units as v_outlay.
    v_balance := COALESCE(v_fac.party_funds, 0);
    IF v_balance < v_outlay THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient Army Funds: $%s available, $%s required',
                round(v_balance/1000000.0, 1), round(v_outlay/1000000.0, 1)));
    END IF;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_outlay
     WHERE id = p_faction_id;

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
