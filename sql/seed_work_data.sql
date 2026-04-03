-- ============================================================
-- seed_work_data() — Populates the Work DB with test nations
-- ============================================================
-- Called by the Dev Toolbar "Reset to Seed" button after
-- admin_reset_tables() has cleared all game state.
--
-- Creates 6 seed nations with factions for testing.
-- Run this in the Work Supabase SQL Editor (safe to re-run).
-- ============================================================

CREATE OR REPLACE FUNCTION seed_work_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB := '{}'::JSONB;
    v_shard_id UUID;
    v_nation_id UUID;
    v_faction_id UUID;
BEGIN
    -- Reset shard to tick 100
    UPDATE shard SET
        current_tick = 100,
        "current_date" = 'March 15, 2026',
        next_tick_at = NOW() + INTERVAL '365 days',
        tick_interval_minutes = 60
    WHERE name = 'Alpha Shard'
    RETURNING id INTO v_shard_id;

    IF v_shard_id IS NULL THEN
        INSERT INTO shard (name, current_tick, "current_date", next_tick_at, tick_interval_minutes)
        VALUES ('Alpha Shard', 100, 'March 15, 2026', NOW() + INTERVAL '365 days', 60)
        RETURNING id INTO v_shard_id;
    END IF;

    result := result || '{"shard": "tick 100"}'::JSONB;

    -- ==================== VALDORIA ====================
    -- Parliamentary Democracy, coalition-ready
    INSERT INTO nations (name, government_type, total_seats, max_parties, capital, shard_id,
        population, eligible_voters, gdp, debt, stability, legitimacy, corruption,
        gdp_growth, inflation, unemployment, happiness, civil_unrest,
        press_freedom, freedom_index, efficiency, polarization,
        healthcare_quality, literacy, crime_rate,
        income_tax, corporate_tax, sales_tax,
        national_approval, gov_approval, gov_approval_institutional, gov_approval_outcomes, gov_approval_events,
        cost_of_living, manufacturing_output, service_output, housing_affordability)
    VALUES ('Valdoria', 'Parliamentary', 120, 8, 'Valdoris', v_shard_id,
        8200000, 5330000, 485000000000, 25000000000, 72, 78, 15,
        52, 32, 22, 65, 12, 88, 85, 62, 35, 72, 90, 18, 45, 35, 38,
        55, 58, 55, 52, 0,
        42, 55, 58, 52)
    RETURNING id INTO v_nation_id;

    INSERT INTO factions (nation_id, faction_name, seats, approval_rating, action_points, color)
    VALUES
        (v_nation_id, 'Progressive Alliance', 42, 58, 5, '#2196F3'),
        (v_nation_id, 'National Unity Party', 35, 52, 5, '#F44336'),
        (v_nation_id, 'Green Future Coalition', 25, 48, 5, '#4CAF50'),
        (v_nation_id, 'Conservative Bloc', 18, 42, 5, '#FF9800');

    SELECT id INTO v_faction_id FROM factions WHERE nation_id = v_nation_id ORDER BY seats DESC LIMIT 1;
    UPDATE nations SET ruling_faction_id = v_faction_id WHERE id = v_nation_id;

    result := result || '{"Valdoria": "Parliamentary, 4 factions"}'::JSONB;

    -- ==================== SANGREZA ====================
    -- Presidential, bill-on-desk testing
    INSERT INTO nations (name, government_type, total_seats, max_parties, capital, shard_id,
        population, eligible_voters, gdp, debt, stability, legitimacy, corruption,
        gdp_growth, inflation, unemployment, happiness, civil_unrest,
        press_freedom, freedom_index, efficiency, polarization,
        healthcare_quality, literacy, crime_rate,
        income_tax, corporate_tax, sales_tax,
        national_approval, gov_approval, gov_approval_institutional, gov_approval_outcomes, gov_approval_events,
        cost_of_living, manufacturing_output, service_output, housing_affordability)
    VALUES ('Sangreza', 'Presidential', 120, 8, 'San Marcos', v_shard_id,
        12500000, 8125000, 528000000000, 40000000000, 65, 70, 25,
        48, 38, 32, 55, 22, 72, 70, 55, 48, 58, 82, 32, 52, 42, 40,
        48, 45, 48, 42, 0,
        48, 48, 45, 40)
    RETURNING id INTO v_nation_id;

    INSERT INTO factions (nation_id, faction_name, seats, approval_rating, action_points, color)
    VALUES
        (v_nation_id, 'Democratic Front', 45, 52, 5, '#1565C0'),
        (v_nation_id, 'Peoples Republic Movement', 38, 48, 5, '#C62828'),
        (v_nation_id, 'Liberty Party', 22, 45, 5, '#F9A825'),
        (v_nation_id, 'Workers Coalition', 15, 40, 5, '#6A1B9A');

    SELECT id INTO v_faction_id FROM factions WHERE nation_id = v_nation_id ORDER BY seats DESC LIMIT 1;
    UPDATE nations SET ruling_faction_id = v_faction_id WHERE id = v_nation_id;

    UPDATE nations SET
        term_limits_abolished = true,
        state_media_control = true,
        judicial_appointment_politicization = true,
        electoral_commission_reform = true,
        legislative_quorum_override = 40
    WHERE id = v_nation_id;

    result := result || '{"Sangreza": "Presidential, 4 factions"}'::JSONB;

    -- ==================== MELIZEA ====================
    -- Autocracy, strongman leader
    INSERT INTO nations (name, government_type, total_seats, max_parties, capital, shard_id,
        population, eligible_voters, gdp, debt, stability, legitimacy, corruption,
        gdp_growth, inflation, unemployment, happiness, civil_unrest,
        press_freedom, freedom_index, efficiency, polarization,
        healthcare_quality, literacy, crime_rate,
        income_tax, corporate_tax, sales_tax,
        national_approval, gov_approval, gov_approval_institutional, gov_approval_outcomes, gov_approval_events,
        cost_of_living, manufacturing_output, service_output, housing_affordability)
    VALUES ('Melizea', 'Autocracy', 120, 8, 'Melisar', v_shard_id,
        5800000, 3770000, 95000000000, 95000000000, 58, 42, 55,
        28, 52, 48, 35, 38, 22, 28, 40, 62, 42, 68, 42, 62, 55, 48,
        38, 35, 38, 32, 0,
        58, 35, 32, 25)
    RETURNING id INTO v_nation_id;

    INSERT INTO factions (nation_id, faction_name, seats, approval_rating, action_points, color)
    VALUES
        (v_nation_id, 'Ruling Junta', 72, 38, 5, '#424242'),
        (v_nation_id, 'Reform Movement', 28, 55, 5, '#0097A7'),
        (v_nation_id, 'Traditionalist Guard', 20, 35, 5, '#5D4037');

    SELECT id INTO v_faction_id FROM factions WHERE nation_id = v_nation_id ORDER BY seats DESC LIMIT 1;
    UPDATE nations SET ruling_faction_id = v_faction_id WHERE id = v_nation_id;

    result := result || '{"Melizea": "Autocracy, 3 factions"}'::JSONB;

    -- ==================== PALVERA ====================
    -- Presidential, high debt/deficit stress
    INSERT INTO nations (name, government_type, total_seats, max_parties, capital, shard_id,
        population, eligible_voters, gdp, debt, stability, legitimacy, corruption,
        gdp_growth, inflation, unemployment, happiness, civil_unrest,
        press_freedom, freedom_index, efficiency, polarization,
        healthcare_quality, literacy, crime_rate,
        income_tax, corporate_tax, sales_tax,
        national_approval, gov_approval, gov_approval_institutional, gov_approval_outcomes, gov_approval_events,
        cost_of_living, manufacturing_output, service_output, housing_affordability)
    VALUES ('Palvera', 'Presidential', 120, 8, 'Valcosta', v_shard_id,
        6650000, 4322500, 106000000000, 48000000000, 68, 72, 20,
        40, 28, 48, 58, 22, 85, 82, 48, 42, 62, 82, 28, 58, 48, 42,
        50, 50, 50, 50, 0,
        55, 38, 42, 45)
    RETURNING id INTO v_nation_id;

    INSERT INTO factions (nation_id, faction_name, seats, approval_rating, action_points, color)
    VALUES
        (v_nation_id, 'Centro Democratico', 40, 50, 5, '#1976D2'),
        (v_nation_id, 'Partido Popular', 35, 48, 5, '#D32F2F'),
        (v_nation_id, 'Union Verde', 25, 45, 5, '#388E3C'),
        (v_nation_id, 'Frente Obrero', 20, 42, 5, '#7B1FA2');

    SELECT id INTO v_faction_id FROM factions WHERE nation_id = v_nation_id ORDER BY seats DESC LIMIT 1;
    UPDATE nations SET ruling_faction_id = v_faction_id WHERE id = v_nation_id;

    result := result || '{"Palvera": "Presidential, 4 factions"}'::JSONB;

    -- ==================== AVELIA ====================
    -- Clean slate, baseline stats
    INSERT INTO nations (name, government_type, total_seats, max_parties, capital, shard_id,
        population, eligible_voters, gdp, debt, stability, legitimacy, corruption,
        gdp_growth, inflation, unemployment, happiness, civil_unrest,
        press_freedom, freedom_index, efficiency, polarization,
        healthcare_quality, literacy, crime_rate,
        income_tax, corporate_tax, sales_tax,
        national_approval, gov_approval, gov_approval_institutional, gov_approval_outcomes, gov_approval_events,
        cost_of_living, manufacturing_output, service_output, housing_affordability)
    VALUES ('Avelia', 'Parliamentary', 120, 8, 'Avelon', v_shard_id,
        9500000, 6175000, 358000000000, 10000000000, 75, 80, 10,
        55, 25, 18, 72, 8, 92, 90, 70, 25, 78, 95, 12, 40, 30, 35,
        65, 62, 60, 58, 0,
        40, 60, 62, 58)
    RETURNING id INTO v_nation_id;

    INSERT INTO factions (nation_id, faction_name, seats, approval_rating, action_points, color)
    VALUES
        (v_nation_id, 'New Dawn Party', 50, 65, 5, '#00BCD4'),
        (v_nation_id, 'Heritage Alliance', 38, 55, 5, '#795548'),
        (v_nation_id, 'Social Democrats', 32, 58, 5, '#E91E63');

    SELECT id INTO v_faction_id FROM factions WHERE nation_id = v_nation_id ORDER BY seats DESC LIMIT 1;
    UPDATE nations SET ruling_faction_id = v_faction_id WHERE id = v_nation_id;

    result := result || '{"Avelia": "Parliamentary, 3 factions"}'::JSONB;

    -- ==================== MONTEQUILLA ====================
    -- Crisis state, election imminent
    INSERT INTO nations (name, government_type, total_seats, max_parties, capital, shard_id,
        population, eligible_voters, gdp, debt, stability, legitimacy, corruption,
        gdp_growth, inflation, unemployment, happiness, civil_unrest,
        press_freedom, freedom_index, efficiency, polarization,
        healthcare_quality, literacy, crime_rate,
        income_tax, corporate_tax, sales_tax,
        national_approval, gov_approval, gov_approval_institutional, gov_approval_outcomes, gov_approval_events,
        cost_of_living, manufacturing_output, service_output, housing_affordability)
    VALUES ('Montequilla', 'Parliamentary', 120, 8, 'Montecara', v_shard_id,
        4200000, 2730000, 109000000000, 55000000000, 32, 35, 45,
        18, 58, 55, 28, 62, 55, 52, 28, 72, 38, 72, 52, 65, 58, 52,
        25, 22, 25, 20, 0,
        68, 18, 20, 20)
    RETURNING id INTO v_nation_id;

    INSERT INTO factions (nation_id, faction_name, seats, approval_rating, action_points, color)
    VALUES
        (v_nation_id, 'Solidarity Front', 35, 28, 5, '#FF5722'),
        (v_nation_id, 'Order & Progress', 32, 25, 5, '#37474F'),
        (v_nation_id, 'Peoples Voice', 30, 30, 5, '#8BC34A'),
        (v_nation_id, 'Independence Movement', 23, 22, 5, '#FFC107');

    SELECT id INTO v_faction_id FROM factions WHERE nation_id = v_nation_id ORDER BY seats DESC LIMIT 1;
    UPDATE nations SET ruling_faction_id = v_faction_id WHERE id = v_nation_id;

    -- Schedule an imminent election for Montequilla
    INSERT INTO elections (nation_id, election_tick, election_type, status)
    VALUES (v_nation_id, 105, 'parliamentary', 'scheduled');

    result := result || '{"Montequilla": "Parliamentary, 4 factions, election at tick 105"}'::JSONB;

    RETURN result;
END;
$$;
