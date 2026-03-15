-- One-time backfill for nations that have an active government but no open administration row.
-- Idempotent: only inserts for nations where administrations.ended_at_tick IS NULL does not exist.

WITH shard_tick AS (
    SELECT COALESCE((SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), 0) AS current_tick
),
active_parliamentary AS (
    SELECT
        gf.nation_id,
        gf.party_ids,
        COALESCE(gf.ministry_assignments ->> 'prime_minister', gf.proposed_by::text)::uuid AS lead_party_id,
        gf.election_id,
        e.election_tick,
        2 AS source_priority,
        'government_formations'::text AS source_name
    FROM government_formations gf
    LEFT JOIN elections e ON e.id = gf.election_id
    WHERE gf.status IN ('formed', 'caretaker')
),
active_legacy AS (
    SELECT
        ac.nation_id,
        ac.party_ids,
        ac.lead_party_id,
        NULL::uuid AS election_id,
        NULL::int AS election_tick,
        3 AS source_priority,
        'active_coalitions'::text AS source_name
    FROM active_coalitions ac
    WHERE ac.dissolved_at IS NULL
      AND (ac.status IS NULL OR ac.status IN ('formed', 'caretaker'))
),
active_presidential AS (
    SELECT
        p.nation_id,
        ARRAY[p.faction_id]::uuid[] AS party_ids,
        p.faction_id AS lead_party_id,
        NULL::uuid AS election_id,
        p.elected_tick AS election_tick,
        1 AS source_priority,
        'presidents'::text AS source_name
    FROM presidents p
    WHERE p.is_active = true
),
active_governments AS (
    SELECT * FROM active_presidential
    UNION ALL
    SELECT * FROM active_parliamentary
    UNION ALL
    SELECT * FROM active_legacy
),
chosen_government AS (
    SELECT *
    FROM (
        SELECT
            ag.*,
            ROW_NUMBER() OVER (
                PARTITION BY ag.nation_id
                ORDER BY ag.source_priority ASC, ag.election_tick DESC NULLS LAST
            ) AS rn
        FROM active_governments ag
    ) ranked
    WHERE rn = 1
),
missing_open_admin AS (
    SELECT cg.*
    FROM chosen_government cg
    WHERE NOT EXISTS (
        SELECT 1
        FROM administrations a
        WHERE a.nation_id = cg.nation_id
          AND a.ended_at_tick IS NULL
    )
),
insert_payload AS (
    SELECT
        n.id AS nation_id,
        CASE
            WHEN hog.last_name IS NOT NULL THEN hog.last_name || ' Administration'
            WHEN n.head_of_state_last_name IS NOT NULL THEN n.head_of_state_last_name || ' Administration'
            WHEN m.lead_party_id IS NOT NULL THEN COALESCE(pm_party.faction_name, 'Unknown') || ' Administration'
            ELSE COALESCE(n.name, 'Unknown Nation') || ' Administration'
        END ||
        CASE
            WHEN m.election_tick IS NULL THEN ' [Backfill @tick ' || st.current_tick || ']'
            ELSE ''
        END AS admin_name,
        CASE
            WHEN n.head_of_state_first_name IS NOT NULL AND n.head_of_state_last_name IS NOT NULL
                THEN n.head_of_state_first_name || ' ' || n.head_of_state_last_name
            ELSE NULL
        END AS head_of_state,
        CASE
            WHEN hog.first_name IS NOT NULL AND hog.last_name IS NOT NULL
                THEN hog.first_name || ' ' || hog.last_name
            ELSE NULL
        END AS prime_minister,
        m.lead_party_id AS pm_party_id,
        pm_party.faction_name AS pm_party_name,
        COALESCE(cp.coalition_parties, '[]'::jsonb) AS coalition_parties,
        COALESCE(cp.total_seats, 0) AS total_seats,
        COALESCE(n.government_type, 'Democracy') AS government_type,
        COALESCE(m.election_tick, st.current_tick) AS started_at_tick,
        CASE
            WHEN m.election_tick IS NULL
                THEN 'Backfilled (tick unknown, fallback to current tick)'
            ELSE NULL
        END AS started_at_date,
        jsonb_strip_nulls(
            jsonb_build_object(
                'gdp', n.gdp,
                'gdp_growth', n.gdp_growth,
                'debt', n.debt,
                'debt_growth', n.debt_growth,
                'budget', n.budget,
                'inflation', n.inflation,
                'interest_rates', n.interest_rates,
                'trade_balance', n.trade_balance,
                'currency_strength', n.currency_strength,
                'foreign_investment', n.foreign_investment,
                'credit', n.credit,
                'income_tax', n.income_tax,
                'corporate_tax', n.corporate_tax,
                'sales_tax', n.sales_tax,
                'tariffs', n.tariffs,
                'unemployment', n.unemployment,
                'labor_force_participation', n.labor_force_participation,
                'minimum_wage', n.minimum_wage,
                'union_strength', n.union_strength,
                'poverty_rate', n.poverty_rate,
                'income_inequality', n.income_inequality,
                'population', n.population,
                'population_growth', n.population_growth
            ) || jsonb_build_object(
                'median_age', n.median_age,
                'eligible_voters', n.eligible_voters,
                'ethnic_diversity', n.ethnic_diversity,
                'healthcare_quality', n.healthcare_quality,
                'healthcare_accessibility', n.healthcare_accessibility,
                'beds_per_100k', n.beds_per_100k,
                'lifespan', n.lifespan,
                'drug_use', n.drug_use,
                'literacy', n.literacy,
                'higher_education', n.higher_education,
                'education_accessibility', n.education_accessibility,
                'academic_immigration', n.academic_immigration,
                'digital_infrastructure', n.digital_infrastructure,
                'rail_network', n.rail_network,
                'urbanization', n.urbanization,
                'energy_generation', n.energy_generation,
                'renewable_energy_percentage', n.renewable_energy_percentage,
                'arable_land', n.arable_land,
                'rare_minerals', n.rare_minerals,
                'oil_and_gas', n.oil_and_gas,
                'fuel_prices', n.fuel_prices,
                'pollution', n.pollution,
                'carbon_emissions', n.carbon_emissions,
                'standard_of_living', n.standard_of_living
            ) || jsonb_build_object(
                'happiness', n.happiness,
                'social_mobility', n.social_mobility,
                'benefits', n.benefits,
                'crime_rate', n.crime_rate,
                'incarceration_rate', n.incarceration_rate,
                'religiosity', n.religiosity,
                'cost_of_living', n.cost_of_living,
                'manufacturing_output', n.manufacturing_output,
                'service_output', n.service_output,
                'housing_affordability', n.housing_affordability,
                'stability', n.stability,
                'legitimacy', n.legitimacy,
                'efficiency', n.efficiency,
                'corruption', n.corruption,
                'press_freedom', n.press_freedom,
                'judicial_independence', n.judicial_independence,
                'freedom_index', n.freedom_index,
                'polarization', n.polarization,
                'civil_unrest', n.civil_unrest,
                'terrorism', n.terrorism,
                'political_violence', n.political_violence,
                'immigration', n.immigration,
                'illegal_immigration', n.illegal_immigration,
                'emigration', n.emigration,
                'international_reputation', n.international_reputation
            )
        ) AS stats_at_start
    FROM missing_open_admin m
    JOIN nations n ON n.id = m.nation_id
    CROSS JOIN shard_tick st
    LEFT JOIN LATERAL (
        SELECT h.first_name, h.last_name
        FROM head_of_government h
        WHERE h.nation_id = m.nation_id
          AND h.active = true
        ORDER BY h.created_at DESC NULLS LAST
        LIMIT 1
    ) hog ON true
    LEFT JOIN factions pm_party ON pm_party.id = m.lead_party_id
    LEFT JOIN LATERAL (
        SELECT
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'party_id', f.id,
                        'party_name', f.faction_name,
                        'seats', f.seats
                    )
                    ORDER BY f.faction_name
                ),
                '[]'::jsonb
            ) AS coalition_parties,
            COALESCE(SUM(f.seats), 0) AS total_seats
        FROM unnest(COALESCE(m.party_ids, ARRAY[]::uuid[])) pid
        LEFT JOIN factions f ON f.id = pid
    ) cp ON true
)
INSERT INTO administrations (
    nation_id,
    admin_name,
    head_of_state,
    prime_minister,
    pm_party_name,
    pm_party_id,
    coalition_parties,
    total_seats,
    government_type,
    started_at_tick,
    started_at_date,
    stats_at_start
)
SELECT
    nation_id,
    admin_name,
    head_of_state,
    prime_minister,
    pm_party_name,
    pm_party_id,
    coalition_parties,
    total_seats,
    government_type,
    started_at_tick,
    started_at_date,
    stats_at_start
FROM insert_payload
RETURNING nation_id, admin_name, started_at_tick;

-- Verification queries (run after backfill):
-- SELECT *
-- FROM administrations
-- WHERE nation_id = '<nation_uuid>'
-- ORDER BY started_at_tick DESC;
