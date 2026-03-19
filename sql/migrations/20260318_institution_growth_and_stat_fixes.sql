-- Fix broken institution stat mappings and add institution growth mechanic.
--
-- Several institutions referenced non-existent stat keys (rule_of_law, diplomacy,
-- government_capacity, primary_education, military, environment). These are fixed
-- to map to real nation stat columns.
--
-- Additionally, each ministry gets one institution whose full (100%) funding
-- causes a stat to grow by 0.25/tick up to a ceiling of 30 ("barely functioning").
-- This represents the baseline outcome of a well-funded government apparatus —
-- legislation is still needed to push stats above 30.

-- ============================================================
-- 1. Fix broken stat mappings
-- ============================================================

-- Justice: rule_of_law → judicial_independence
UPDATE ministry_institution_config SET primary_stat = 'judicial_independence'
    WHERE id = 'courts' AND primary_stat = 'rule_of_law';

UPDATE ministry_institution_config SET secondary_stat = 'judicial_independence'
    WHERE id = 'corrections' AND secondary_stat = 'rule_of_law';

-- Note: law_enforcement already has primary=stability, secondary=happiness (both valid)

-- Education: primary_education → real stats
UPDATE ministry_institution_config SET primary_stat = 'education_accessibility'
    WHERE id = 'primary_schools' AND primary_stat = 'primary_education';

UPDATE ministry_institution_config SET primary_stat = 'labor_force_participation'
    WHERE id = 'vocational' AND primary_stat = 'primary_education';

-- Defense: military → stability
UPDATE ministry_institution_config SET primary_stat = 'stability'
    WHERE id = 'military' AND primary_stat = 'military';

-- Foreign Affairs: diplomacy → international_reputation
UPDATE ministry_institution_config SET primary_stat = 'international_reputation'
    WHERE id = 'embassies' AND primary_stat = 'diplomacy';

UPDATE ministry_institution_config SET primary_stat = 'international_reputation'
    WHERE id = 'foreign_aid' AND primary_stat = 'diplomacy';

-- Interior: government_capacity → real stats
UPDATE ministry_institution_config SET primary_stat = 'efficiency'
    WHERE id = 'civil_service' AND primary_stat = 'government_capacity';

UPDATE ministry_institution_config SET primary_stat = 'legitimacy'
    WHERE id = 'census' AND primary_stat = 'government_capacity';

-- Energy: environment → renewable_energy_percentage
UPDATE ministry_institution_config SET primary_stat = 'renewable_energy_percentage'
    WHERE id = 'regulation' AND primary_stat = 'environment';

UPDATE ministry_institution_config SET secondary_stat = 'renewable_energy_percentage'
    WHERE id = 'generation' AND secondary_stat = 'environment';

-- Energy: power_grid secondary digital_infrastructure → energy_generation
-- (digital_infrastructure is already covered by intelligence institution;
--  energy_generation needs coverage so institution growth isn't cancelled by decay)
UPDATE ministry_institution_config SET secondary_stat = 'energy_generation'
    WHERE id = 'power_grid' AND secondary_stat = 'digital_infrastructure';

-- Transportation: public_transit secondary environment → pollution
UPDATE ministry_institution_config SET secondary_stat = 'pollution'
    WHERE id = 'public_transit' AND secondary_stat = 'environment';

-- Finance: tax_admin secondary rule_of_law → corruption
-- (funded tax admin combats corruption — blocks corruption's erosion toward 70)
UPDATE ministry_institution_config SET secondary_stat = 'corruption'
    WHERE id = 'tax_admin' AND secondary_stat = 'rule_of_law';

-- Interior: civil_service secondary rule_of_law → legitimacy
UPDATE ministry_institution_config SET secondary_stat = 'legitimacy'
    WHERE id = 'civil_service' AND secondary_stat = 'rule_of_law';

-- Trade: customs secondary rule_of_law → manufacturing_output
-- (customs supports industrial output; also ensures growth isn't cancelled by decay)
UPDATE ministry_institution_config SET secondary_stat = 'manufacturing_output'
    WHERE id = 'customs' AND secondary_stat = 'rule_of_law';

-- Trade: competition primary rule_of_law → trade_balance
UPDATE ministry_institution_config SET primary_stat = 'trade_balance'
    WHERE id = 'competition' AND primary_stat = 'rule_of_law';


-- ============================================================
-- 2. Add growth columns
-- ============================================================

ALTER TABLE ministry_institution_config
    ADD COLUMN IF NOT EXISTS growth_stat TEXT,
    ADD COLUMN IF NOT EXISTS growth_ceiling DECIMAL DEFAULT NULL;

COMMENT ON COLUMN ministry_institution_config.growth_stat IS
    'Nation stat that this institution actively grows when funded at 100%.';
COMMENT ON COLUMN ministry_institution_config.growth_ceiling IS
    'Maximum value the growth_stat can reach via institution funding alone (e.g. 30).';


-- ============================================================
-- 3. Seed growth stats (one institution per ministry)
-- ============================================================

-- Healthcare: hospitals grow healthcare_accessibility
UPDATE ministry_institution_config
    SET growth_stat = 'healthcare_accessibility', growth_ceiling = 30
    WHERE id = 'hospitals';

-- Education: primary_schools grow literacy
UPDATE ministry_institution_config
    SET growth_stat = 'literacy', growth_ceiling = 30
    WHERE id = 'primary_schools';

-- Defense: military grows stability
UPDATE ministry_institution_config
    SET growth_stat = 'stability', growth_ceiling = 30
    WHERE id = 'military';

-- Labor: employment_services grow labor_force_participation
UPDATE ministry_institution_config
    SET growth_stat = 'labor_force_participation', growth_ceiling = 30
    WHERE id = 'employment_services';

-- Justice: courts grow judicial_independence
UPDATE ministry_institution_config
    SET growth_stat = 'judicial_independence', growth_ceiling = 30
    WHERE id = 'courts';

-- Energy: power_grid grows energy_generation
UPDATE ministry_institution_config
    SET growth_stat = 'energy_generation', growth_ceiling = 30
    WHERE id = 'power_grid';

-- Transportation: roads grow physical_infrastructure
UPDATE ministry_institution_config
    SET growth_stat = 'physical_infrastructure', growth_ceiling = 30
    WHERE id = 'roads';

-- Finance: tax_admin grows credit
UPDATE ministry_institution_config
    SET growth_stat = 'credit', growth_ceiling = 30
    WHERE id = 'tax_admin';

-- Foreign Affairs: embassies grow international_reputation
UPDATE ministry_institution_config
    SET growth_stat = 'international_reputation', growth_ceiling = 30
    WHERE id = 'embassies';

-- Interior: civil_service grows efficiency
UPDATE ministry_institution_config
    SET growth_stat = 'efficiency', growth_ceiling = 30
    WHERE id = 'civil_service';

-- Trade: customs grows manufacturing_output
UPDATE ministry_institution_config
    SET growth_stat = 'manufacturing_output', growth_ceiling = 30
    WHERE id = 'customs';

-- Security: internal_security grows legitimacy
UPDATE ministry_institution_config
    SET growth_stat = 'legitimacy', growth_ceiling = 30
    WHERE id = 'internal_security';
