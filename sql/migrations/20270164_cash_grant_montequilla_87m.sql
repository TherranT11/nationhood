-- One-time +$87M cash grant to Montequilla Contructions.
-- Routes through emit_corp_cash_event so the corp_cash_events ledger
-- (and the Revenue card) reflects the grant. NOT idempotent —
-- re-running will grant another $87M.

DO $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id
      FROM factions
     WHERE faction_type = 'corporation'
       AND faction_name = 'Montequilla Contructions'
       AND abandoned_at IS NULL
     LIMIT 1;

    IF v_id IS NULL THEN
        RAISE EXCEPTION 'Montequilla Contructions not found (or abandoned)';
    END IF;

    PERFORM emit_corp_cash_event(v_id, 'capital_in', 'Admin cash grant', 87000000);
    RAISE NOTICE '+$87M granted to Montequilla Contructions (%)', v_id;
END $$;
