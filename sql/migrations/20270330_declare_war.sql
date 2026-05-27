-- ════════════════════════════════════════════════════════════════════
-- DECLARE WAR — PM/President files a war-declaration bill in parliament
-- ════════════════════════════════════════════════════════════════════
-- The head of government (PM) or head of state (President) brings a motion to
-- declare war on a BORDERING nation. Two casus belli:
--   • press_claim — requires a pressed territorial claim at max tension (10)
--                   against the target. No political cost; the claim is the
--                   justification.
--   • our_honor   — no claim needed, but paid on FILING: -10 public_approval
--                   to the nation, and -3.0 popularity (stored tenths: -30,
--                   clamped at 0) for the declaring party in EVERY sector.
--
-- Filing inserts a `declare_war` bill (status 'floor') + auto-casts the
-- proposer's YES vote. Passage needs a SUPERMAJORITY — enforced at tick by
-- bills.js (resolveDeclareWarBill), which on pass sets the pair's
-- diplomatic_relations.relation_type = 'war'. Fronts between the two nations
-- are "active" whenever that relation = war (derived; no separate flag).
--
-- War state already has a home (diplomatic_relations: relation_type='war' +
-- war_declared_at_tick + war_justification) so this adds no new columns.
-- Owner/office-gated SECURITY DEFINER — bills/bill_support writes go through it.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.declare_war(p_target_nation_id UUID, p_casus_belli TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user      UUID := auth.uid();
    v_fac       factions%ROWTYPE;
    v_nation    UUID;
    v_self_name TEXT;
    v_target    nations%ROWTYPE;
    v_is_pm     BOOLEAN;
    v_is_pres   BOOLEAN;
    v_a         UUID;
    v_b         UUID;
    v_rel       TEXT;
    v_proximity INT;
    v_tick      INT;
    v_voting    INT := 6;   -- floor-vote window, matches the no-confidence cadence
    v_bill      UUID;
BEGIN
    IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
    IF p_casus_belli NOT IN ('press_claim', 'our_honor') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid casus belli');
    END IF;

    -- Caller's party (a faction owned by this user).
    SELECT * INTO v_fac FROM factions
     WHERE (id = v_user OR linked_user_id = v_user) AND faction_type = 'party'
     LIMIT 1;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'You do not lead a party'); END IF;
    v_nation := v_fac.nation_id;

    -- Office gate: caller's party must currently hold the Premiership or Presidency.
    v_is_pm   := EXISTS (SELECT 1 FROM head_of_government WHERE nation_id = v_nation AND faction_id = v_fac.id AND active);
    v_is_pres := EXISTS (SELECT 1 FROM presidents        WHERE nation_id = v_nation AND faction_id = v_fac.id AND is_active);
    IF NOT (v_is_pm OR v_is_pres) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the Prime Minister or President can declare war');
    END IF;

    -- Target validations.
    IF p_target_nation_id = v_nation THEN
        RETURN jsonb_build_object('success', false, 'error', 'You cannot declare war on your own nation');
    END IF;
    SELECT * INTO v_target FROM nations WHERE id = p_target_nation_id;
    IF v_target.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Target nation not found'); END IF;
    SELECT name INTO v_self_name FROM nations WHERE id = v_nation;

    v_a := LEAST(v_nation, p_target_nation_id);
    v_b := GREATEST(v_nation, p_target_nation_id);

    SELECT relation_type, proximity INTO v_rel, v_proximity
      FROM diplomatic_relations WHERE nation_a_id = v_a AND nation_b_id = v_b;
    -- Fronts (and thus war) only exist between bordering nations.
    IF COALESCE(v_proximity, 99) <> 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'You can only declare war on a bordering nation');
    END IF;
    IF v_rel = 'war' THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are already at war with that nation');
    END IF;

    -- One pending declaration per target at a time.
    IF EXISTS (SELECT 1 FROM bills
                WHERE nation_id = v_nation AND bill_type = 'declare_war'
                  AND status IN ('committee', 'floor')
                  AND metadata->>'target_nation_id' = p_target_nation_id::text) THEN
        RETURN jsonb_build_object('success', false, 'error', 'A war declaration against that nation is already before parliament');
    END IF;

    -- Casus belli.
    IF p_casus_belli = 'press_claim' THEN
        IF NOT EXISTS (
            SELECT 1 FROM bilateral_issues
             WHERE issue_type = 'territorial_ownership'
               AND tension >= 10
               AND ((nation_a_id = v_a AND nation_b_id = v_b) OR (nation_a_id = v_b AND nation_b_id = v_a))
        ) THEN
            RETURN jsonb_build_object('success', false, 'error', 'No pressed claim at maximum tension against that nation');
        END IF;
    ELSE  -- our_honor: pay the political cost on filing.
        UPDATE nations SET public_approval = GREATEST(0, COALESCE(public_approval, 0) - 10) WHERE id = v_nation;
        UPDATE faction_sector_popularity
           SET popularity = GREATEST(0, popularity - 30), updated_at = now()
         WHERE faction_id = v_fac.id
           AND sector_id IN (SELECT id FROM sectors WHERE nation_id = v_nation);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO bills (nation_id, proposed_by, proposed_tick, bill_name, bill_type, status,
                       floor_tick, voting_ends_tick, proposer_name, proposer_color, preamble, metadata)
    VALUES (v_nation, v_fac.id, v_tick,
            'Declaration of War — ' || v_target.name, 'declare_war', 'floor',
            v_tick, v_tick + v_voting, v_fac.faction_name, v_fac.party_color,
            'The ' || COALESCE(v_self_name, 'Republic') || ' is now in a state of war with the nation of ' || v_target.name || '.',
            jsonb_build_object('target_nation_id', p_target_nation_id, 'casus_belli', p_casus_belli))
    RETURNING id INTO v_bill;

    -- Auto-cast the proposer's YES vote with their seat weight. The bill was
    -- just created above, so there can be no prior row — a plain insert.
    INSERT INTO bill_support (bill_id, faction_id, stance, seat_count)
    VALUES (v_bill, v_fac.id, 'yes', COALESCE(v_fac.seats, 0));

    RETURN jsonb_build_object('success', true, 'bill_id', v_bill, 'casus_belli', p_casus_belli);
END; $$;

GRANT EXECUTE ON FUNCTION public.declare_war(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
