-- One-time +$25 cash grant to the Army of Montequilla.
--
-- $25 (game display) = 25,000,000 raw. factions.party_funds is THE
-- army treasury (per 20270125_create_unit_uses_party_funds): the army
-- dashboard "Available Budget", the Create Unit modal, and
-- allocate_defense_funds all read/charge party_funds, and auMoney()
-- renders party_funds/1e6 — so 25,000,000 displays as "$25".
--
-- The receiving faction is selected with the SAME canonical predicate
-- allocate_defense_funds (20270115) uses for "the nation's Army", so
-- this cannot credit the wrong faction. Direct UPDATE (no ledger) is
-- exactly how allocate_defense_funds itself mutates party_funds.
-- NOT idempotent — re-running grants another $25.

DO $$
DECLARE
    v_nation_id UUID;
    v_army_id   UUID;
BEGIN
    SELECT id INTO v_nation_id
      FROM nations
     WHERE name = 'Montequilla'
     LIMIT 1;
    IF v_nation_id IS NULL THEN
        RAISE EXCEPTION 'Nation "Montequilla" not found';
    END IF;

    SELECT id INTO v_army_id
      FROM factions
     WHERE nation_id = v_nation_id
       AND faction_type = 'military'
       AND branch = 'army'
       AND abandoned_at IS NULL
       AND COALESCE(is_banned, false) = false
     ORDER BY created_at ASC
     LIMIT 1;
    IF v_army_id IS NULL THEN
        RAISE EXCEPTION 'No active Army faction for Montequilla';
    END IF;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) + 25000000
     WHERE id = v_army_id;

    RAISE NOTICE '+$25 (25000000 raw) granted to Army of Montequilla (%)', v_army_id;
END $$;
