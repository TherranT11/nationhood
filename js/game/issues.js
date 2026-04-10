/**
 * issues.js — Bilateral issues system (modifier engine + actions)
 * Extracted from game-common.js
 */

// ==================== TENSION THRESHOLDS ====================

const TENSION_LABELS = {
    LOW:      { min: 0, max: 2, label: 'Low',      incident_pct: 0.5 },
    MODERATE: { min: 3, max: 5, label: 'Moderate',  incident_pct: 1.5 },
    HIGH:     { min: 6, max: 8, label: 'High',      incident_pct: 3.0 },
    CRITICAL: { min: 9, max: 10, label: 'Critical', incident_pct: 6.0 },
};

function getTensionLabel(tension) {
    if (tension <= 2) return TENSION_LABELS.LOW;
    if (tension <= 5) return TENSION_LABELS.MODERATE;
    if (tension <= 8) return TENSION_LABELS.HIGH;
    return TENSION_LABELS.CRITICAL;
}

// Favor → incident starting leverage mapping
function favorToLeverage(favor) {
    const abs = Math.abs(favor);
    if (abs >= 5) return 3;
    if (abs >= 3) return 2;
    if (abs >= 1) return 1;
    return 0;
}

// ==================== MARITIME FISHING RIGHTS — 20 MODIFIERS ====================

const MODIFIERS = {

    // ── STRUCTURAL (assigned at issue creation) ──

    no_defined_maritime_territories: {
        key: 'no_defined_maritime_territories',
        name: 'No Defined Maritime Territories',
        category: 'structural',
        applies_to: 'both',
        stat_effects: [{ stat_key: 'stability', delta: -0.1 }],
        duration: null, // persistent until removed
        removed_by: ['propose_shared_maritime_survey'],
        spawn_chance: 1.0,
    },

    no_regulatory_framework: {
        key: 'no_regulatory_framework',
        name: 'No Regulatory Framework',
        category: 'structural',
        applies_to: 'both',
        stat_effects: [{ stat_key: 'pollution', delta: 0.1 }],
        duration: null,
        removed_by: ['establish_joint_fishing_commission'],
        spawn_chance: 1.0,
    },

    no_defined_quotas: {
        key: 'no_defined_quotas',
        name: 'No Defined Quotas',
        category: 'structural',
        applies_to: 'both',
        stat_effects: [{ stat_key: 'population_growth', delta: -0.05 }],
        duration: null,
        removed_by: ['negotiate_catch_quotas'],
        spawn_chance: 1.0,
    },

    no_joint_enforcement: {
        key: 'no_joint_enforcement',
        name: 'No Joint Enforcement',
        category: 'structural',
        applies_to: 'both',
        stat_effects: [{ stat_key: 'crime_rate', delta: 0.1 }],
        duration: null,
        removed_by: ['joint_coast_guard_patrols'],
        spawn_chance: 0.6,
    },

    no_dispute_resolution_mechanism: {
        key: 'no_dispute_resolution_mechanism',
        name: 'No Dispute Resolution Mechanism',
        category: 'structural',
        applies_to: 'disfavored',
        stat_effects: [{ stat_key: 'gov_approval', delta: -0.1 }],
        duration: null,
        removed_by: ['invite_international_arbitration'],
        spawn_chance: 0.4,
    },

    // ── COMPETITIVE (emerge from gameplay) ──

    overfishing: {
        key: 'overfishing',
        name: 'Overfishing in Disputed Waters',
        category: 'competitive',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'arable_land', delta: -0.1 },
            { stat_key: 'population_growth', delta: -0.1 },
        ],
        duration: 30,
        removed_by: ['negotiate_catch_quotas', 'impose_seasonal_restrictions'],
        auto_trigger: { type: 'idle_ticks', threshold: 10 },
    },

    fish_stock_depletion: {
        key: 'fish_stock_depletion',
        name: 'Fish Stock Depletion',
        category: 'competitive',
        applies_to: 'both',
        stat_effects: [{ stat_key: 'cost_of_living', delta: 0.2 }],
        duration: 40,
        removed_by: ['joint_conservation_programme'],
        auto_trigger: { type: 'modifier_age', requires: 'overfishing', ticks_active: 10 },
    },

    foreign_vessels_in_waters: {
        key: 'foreign_vessels_in_waters',
        name: 'Foreign Vessels in Your Waters',
        category: 'competitive',
        applies_to: null, // set dynamically — applies to the nation whose waters are entered
        stat_effects: [
            { stat_key: 'gov_approval', delta: -0.15 },
            { stat_key: 'civil_unrest', delta: 0.1 },
        ],
        duration: 20,
        removed_by: ['establish_joint_fishing_commission', 'expel_foreign_vessels', 'redirect_fleet'],
        auto_trigger: { type: 'tension_level', threshold: 'HIGH' },
    },

    domestic_fleet_expansion: {
        key: 'domestic_fleet_expansion',
        name: 'Domestic Fleet Expansion',
        category: 'competitive',
        applies_to: null, // set dynamically — applies to the nation that expanded
        stat_effects: [
            { stat_key: 'manufacturing_output', delta: 0.1 },
            { stat_key: 'pollution', delta: 0.1 },
        ],
        duration: 15,
        removed_by: [], // expires only
    },

    coastal_community_decline: {
        key: 'coastal_community_decline',
        name: 'Coastal Community Economic Decline',
        category: 'competitive',
        applies_to: 'disfavored',
        stat_effects: [
            { stat_key: 'unemployment', delta: 0.1 },
            { stat_key: 'poverty_rate', delta: 0.1 },
            { stat_key: 'emigration', delta: 0.1 },
        ],
        duration: 30,
        removed_by: ['invest_in_coastal_communities'],
        auto_trigger: { type: 'favor_threshold', threshold: 3 },
    },

    illegal_fishing_surge: {
        key: 'illegal_fishing_surge',
        name: 'Illegal Fishing Surge',
        category: 'competitive',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'crime_rate', delta: 0.2 },
            { stat_key: 'corruption', delta: 0.1 },
        ],
        duration: 20,
        removed_by: ['joint_coast_guard_patrols'],
    },

    diplomatic_friction: {
        key: 'diplomatic_friction',
        name: 'Diplomatic Friction Over Fishing',
        category: 'competitive',
        applies_to: 'both',
        stat_effects: [], // effect is +1 AP cost on diplomatic actions, handled in action validation
        duration: 30,
        removed_by: [], // removed by any successful diplomatic acceptance
        special: 'diplomatic_ap_penalty',
    },

    international_attention: {
        key: 'international_attention',
        name: 'International Attention on Dispute',
        category: 'competitive',
        applies_to: null, // applies to the more aggressive nation (most threatening actions)
        stat_effects: [{ stat_key: 'international_reputation', delta: -0.1 }],
        duration: 20,
        removed_by: [], // removed when tension drops to Low or Moderate
        auto_trigger: { type: 'tension_level', threshold: 'HIGH' },
    },

    seasonal_fishing_conflict: {
        key: 'seasonal_fishing_conflict',
        name: 'Seasonal Fishing Conflict',
        category: 'competitive',
        applies_to: 'both',
        stat_effects: [{ stat_key: 'civil_unrest', delta: 0.2 }],
        duration: null, // periodic — controlled by periodic config
        removed_by: ['sign_seasonal_fishing_calendar'],
        is_periodic: true,
        periodic_interval: 20,
        periodic_duration: 8,
    },

    environmental_damage: {
        key: 'environmental_damage',
        name: 'Environmental Damage to Fishery',
        category: 'competitive',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'arable_land', delta: -0.2 },
            { stat_key: 'pollution', delta: 0.1 },
        ],
        duration: 25,
        removed_by: ['joint_conservation_programme'],
        auto_trigger: { type: 'dual_modifier', requires: ['overfishing', 'fish_stock_depletion'] },
    },

    // ── ESCALATION (created by threatening actions) ──

    active_vessel_expulsion: {
        key: 'active_vessel_expulsion',
        name: 'Active Vessel Expulsion Order',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'trade_balance', delta: -0.2 },
        ],
        duration: 15,
        removed_by: [], // any diplomatic acceptance or expiry
        special: 'relations_bleed', // Relations -0.3/tick handled separately
        relations_delta: -0.3,
    },

    naval_presence: {
        key: 'naval_presence',
        name: 'Naval Presence in Fishing Zone',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [{ stat_key: 'stability', delta: -0.2 }],
        duration: 20,
        removed_by: [], // issue resolution or incident firing
        // deploying nation also gets military_readiness +0.1 — handled in action application
    },

    seized_vessel_held: {
        key: 'seized_vessel_held',
        name: 'Seized Vessel Held',
        category: 'escalation',
        applies_to: null, // applies to the nation whose vessel was seized
        stat_effects: [
            { stat_key: 'gov_approval', delta: -0.3 },
            { stat_key: 'civil_unrest', delta: 0.2 },
        ],
        duration: 10,
        removed_by: [], // vessel returned via diplomatic action or incident resolution
        special: 'incident_trigger_50',
    },

    fishing_ban_in_effect: {
        key: 'fishing_ban_in_effect',
        name: 'Fishing Ban in Effect',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'cost_of_living', delta: 0.2 },
            { stat_key: 'manufacturing_output', delta: -0.1 },
        ],
        duration: 20,
        removed_by: [], // ban lifted by any diplomatic acceptance
        secondary_modifier: 'illegal_fishing_surge', // also spawns this modifier
    },

    public_hostility: {
        key: 'public_hostility',
        name: 'Public Hostility Over Fishing',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'polarization', delta: 0.1 },
            { stat_key: 'civil_unrest', delta: 0.1 },
            { stat_key: 'immigration', delta: -0.1 },
        ],
        duration: 15,
        removed_by: [], // tension dropping below High or expiry
    },


    // ==================== TERRITORIAL OWNERSHIP DISPUTE — 20 MODIFIERS ====================

    // ── STRUCTURAL (assigned at issue creation) ──

    competing_sovereignty_claims: {
        key: 'competing_sovereignty_claims',
        name: 'Competing Sovereignty Claims',
        category: 'structural',
        applies_to: 'non_administering',
        stat_effects: [{ stat_key: 'stability', delta: -0.05 }],
        relations_delta: -0.1,
        duration: null,
        removed_by: ['propose_joint_sovereignty', 'submit_to_international_court'],
        spawn_chance: 1.0,
    },

    no_international_adjudication: {
        key: 'no_international_adjudication',
        name: 'No International Adjudication',
        category: 'structural',
        applies_to: 'non_administering',
        stat_effects: [{ stat_key: 'gov_approval', delta: -0.1 }],
        duration: null,
        removed_by: ['submit_to_international_court', 'propose_condominium_administration'],
        spawn_chance: 1.0,
    },

    domestic_political_significance: {
        key: 'domestic_political_significance',
        name: 'Domestic Political Significance',
        category: 'structural',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'gov_approval', delta: -0.1 },
            { stat_key: 'polarization', delta: 0.05 },
        ],
        duration: null,
        removed_by: [], // CANNOT be directly removed — persists until issue resolves
        spawn_chance: 1.0,
    },

    resource_potential: {
        key: 'resource_potential',
        name: 'Resource Potential',
        category: 'structural',
        applies_to: 'administering',
        stat_effects: [{ stat_key: 'gdp_growth', delta: 0.1 }],
        duration: null,
        removed_by: ['resource_sharing_framework'],
        spawn_chance: 0.6,
    },

    historical_grievance_attached: {
        key: 'historical_grievance_attached',
        name: 'Historical Grievance Attached',
        category: 'structural',
        applies_to: 'non_administering',
        stat_effects: [
            { stat_key: 'civil_unrest', delta: 0.1 },
            { stat_key: 'happiness', delta: -0.05 },
        ],
        duration: null,
        removed_by: ['cultural_heritage_preservation'],
        spawn_chance: 0.4,
    },

    // ── COMPETITIVE (emerge from gameplay) ──

    settler_population_growing: {
        key: 'settler_population_growing',
        name: 'Settler Population Growing',
        category: 'competitive',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'polarization', delta: 0.15 },
            { stat_key: 'civil_unrest', delta: 0.1 },
        ],
        duration: 25,
        removed_by: ['propose_joint_sovereignty'],
        auto_trigger: { type: 'action_combo', requires: ['build_infrastructure_territory', 'establish_administrative_presence'] },
    },

    competing_development_projects: {
        key: 'competing_development_projects',
        name: 'Competing Development Projects',
        category: 'competitive',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'debt_growth', delta: 0.15 },
            { stat_key: 'efficiency', delta: -0.1 },
        ],
        duration: 20,
        removed_by: ['propose_condominium_administration', 'propose_joint_sovereignty'],
    },

    resource_exploitation_conflict: {
        key: 'resource_exploitation_conflict',
        name: 'Resource Exploitation Conflict',
        category: 'competitive',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'pollution', delta: 0.2 },
            { stat_key: 'arable_land', delta: -0.1 },
        ],
        duration: 20,
        removed_by: ['resource_sharing_framework'],
    },

    diaspora_mobilization: {
        key: 'diaspora_mobilization',
        name: 'Diaspora Mobilization',
        category: 'competitive',
        applies_to: 'non_administering',
        stat_effects: [
            { stat_key: 'polarization', delta: 0.1 },
            { stat_key: 'gov_approval', delta: 0.1 },
            { stat_key: 'emigration', delta: -0.1 },
        ],
        duration: 20,
        removed_by: [],
        auto_trigger: { type: 'favor_threshold', threshold: 3 },
    },

    international_legal_precedent: {
        key: 'international_legal_precedent',
        name: 'International Legal Precedent Forming',
        category: 'competitive',
        applies_to: null, // set dynamically — applies to legally weaker nation
        stat_effects: [{ stat_key: 'international_reputation', delta: -0.1 }],
        duration: 15,
        removed_by: [], // expires or court ruling
    },

    cultural_erasure_accusations: {
        key: 'cultural_erasure_accusations',
        name: 'Cultural Erasure Accusations',
        category: 'competitive',
        applies_to: 'administering',
        stat_effects: [
            { stat_key: 'international_reputation', delta: -0.15 },
            { stat_key: 'freedom_index', delta: -0.1 },
        ],
        duration: 20,
        removed_by: ['cultural_heritage_preservation'],
    },

    territory_election_issue: {
        key: 'territory_election_issue',
        name: 'Territory as Election Issue',
        category: 'competitive',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'gov_approval', delta: -0.3 },
            { stat_key: 'polarization', delta: 0.2 },
        ],
        duration: 8,
        removed_by: [], // expires only — cannot be manually removed
        special: 'diplomatic_ap_penalty', // +1 AP cost on diplomatic actions
    },

    memorial_anniversary_tension: {
        key: 'memorial_anniversary_tension',
        name: 'Memorial / Anniversary Tension',
        category: 'competitive',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'civil_unrest', delta: 0.2 },
            { stat_key: 'political_violence', delta: 0.1 },
            { stat_key: 'polarization', delta: 0.1 },
        ],
        duration: null, // periodic
        removed_by: ['cultural_heritage_preservation'],
        is_periodic: true,
        periodic_interval: 20,
        periodic_duration: 4,
    },

    // ── ESCALATION (created by threatening actions) ──

    military_occupation: {
        key: 'military_occupation',
        name: 'Military Occupation in Effect',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'civil_unrest', delta: 0.2 },
        ],
        duration: 30,
        removed_by: [], // issue resolution or withdrawal only
    },

    forced_population_transfer: {
        key: 'forced_population_transfer',
        name: 'Forced Population Transfer in Progress',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'civil_unrest', delta: 0.3 },
            { stat_key: 'political_violence', delta: 0.2 },
        ],
        duration: null, // permanent until issue resolves
        removed_by: [], // issue resolution ONLY
    },

    resource_extraction_underway: {
        key: 'resource_extraction_underway',
        name: 'Resource Extraction Underway',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'pollution', delta: 0.15 },
        ],
        relations_delta: -0.15,
        duration: 25,
        removed_by: ['resource_sharing_framework'],
    },

    military_exercises_conducted: {
        key: 'military_exercises_conducted',
        name: 'Military Exercises Conducted',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [{ stat_key: 'stability', delta: -0.2 }],
        duration: 10,
        removed_by: [], // expires only
    },

    citizen_expulsion: {
        key: 'citizen_expulsion',
        name: 'Citizen Expulsion in Progress',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'civil_unrest', delta: 0.2 },
        ],
        duration: 15,
        removed_by: [], // expires, leaves diaspora_mobilization
    },

    sovereignty_declared: {
        key: 'sovereignty_declared',
        name: 'Sovereignty Declared',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'polarization', delta: 0.15 },
        ],
        relations_delta: -0.2,
        duration: null, // permanent until issue resolves
        removed_by: [], // issue resolution ONLY
    },

    nationalist_territorial_movement: {
        key: 'nationalist_territorial_movement',
        name: 'Nationalist Territorial Movement',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'polarization', delta: 0.2 },
            { stat_key: 'civil_unrest', delta: 0.15 },
            { stat_key: 'terrorism', delta: 0.1 },
        ],
        duration: 15,
        removed_by: [], // tension dropping below High or expiry
    },


    // ==================== CHRONIC TRADE IMBALANCE — 19 MODIFIERS ====================
    // Surplus nation = administering, Deficit nation = non_administering
    // trade_balance is computed by trade engine — all effects use upstream stats instead
    // #19 (Trade War Collateral Damage) deferred — requires third-party effect architecture

    // ── STRUCTURAL (5) ──

    persistent_trade_deficit: {
        key: 'persistent_trade_deficit',
        name: 'Persistent Trade Deficit',
        category: 'structural',
        applies_to: 'non_administering',
        stat_effects: [
            { stat_key: 'manufacturing_output', delta: -0.1 },
            { stat_key: 'gdp_growth', delta: -0.05 },
        ],
        duration: null,
        removed_by: ['negotiate_trade_rebalancing'],
        spawn_chance: 1.0,
    },

    no_trade_rebalancing_mechanism: {
        key: 'no_trade_rebalancing_mechanism',
        name: 'No Bilateral Trade Rebalancing Mechanism',
        category: 'structural',
        applies_to: 'non_administering',
        stat_effects: [{ stat_key: 'gov_approval', delta: -0.1 }],
        duration: null,
        removed_by: ['negotiate_trade_rebalancing', 'bilateral_free_trade_restructuring'],
        spawn_chance: 1.0,
    },

    domestic_industries_losing_share: {
        key: 'domestic_industries_losing_share',
        name: 'Domestic Industries Losing Market Share',
        category: 'structural',
        applies_to: 'non_administering',
        stat_effects: [
            { stat_key: 'manufacturing_output', delta: -0.1 },
            { stat_key: 'unemployment', delta: 0.1 },
        ],
        duration: null,
        removed_by: ['negotiate_voluntary_export_restraints', 'domestic_industry_subsidy'],
        spawn_chance: 1.0,
    },

    no_import_substitution_strategy: {
        key: 'no_import_substitution_strategy',
        name: 'No Import Substitution Strategy',
        category: 'structural',
        applies_to: 'non_administering',
        stat_effects: [{ stat_key: 'cost_of_living', delta: 0.05 }],
        duration: null,
        removed_by: ['launch_import_substitution'],
        spawn_chance: 0.6,
    },

    currency_misalignment_suspected: {
        key: 'currency_misalignment_suspected',
        name: 'Currency Misalignment Suspected',
        category: 'structural',
        applies_to: 'non_administering',
        stat_effects: [
            { stat_key: 'foreign_investment', delta: -0.05 },
            { stat_key: 'currency_strength', delta: -0.05 },
        ],
        duration: null,
        removed_by: ['propose_currency_alignment'],
        spawn_chance: 0.4,
    },

    // ── COMPETITIVE (8) ──

    factory_closures_deficit: {
        key: 'factory_closures_deficit',
        name: 'Factory Closures in Deficit Nation',
        category: 'competitive',
        applies_to: 'non_administering',
        stat_effects: [
            { stat_key: 'unemployment', delta: 0.2 },
            { stat_key: 'poverty_rate', delta: 0.1 },
            { stat_key: 'emigration', delta: 0.1 },
            { stat_key: 'civil_unrest', delta: 0.1 },
        ],
        duration: 25,
        removed_by: ['domestic_industry_subsidy', 'joint_economic_development_fund'],
        auto_trigger: { type: 'modifier_age', requires: 'domestic_industries_losing_share', ticks_active: 15 },
    },

    surplus_market_dependency: {
        key: 'surplus_market_dependency',
        name: 'Surplus Nation Market Dependency',
        category: 'competitive',
        applies_to: 'administering',
        stat_effects: [], // latent — activates via auto-spawn when deficit takes threatening action
        duration: null,
        removed_by: ['bilateral_free_trade_restructuring'],
    },

    protectionist_movement: {
        key: 'protectionist_movement',
        name: 'Protectionist Political Movement',
        category: 'competitive',
        applies_to: 'non_administering',
        stat_effects: [
            { stat_key: 'polarization', delta: 0.15 },
            { stat_key: 'gov_approval', delta: -0.15 },
        ],
        duration: 20,
        removed_by: [], // tension dropping to Low or expiry
    },

    dumping_accusations: {
        key: 'dumping_accusations',
        name: 'Dumping Accusations',
        category: 'competitive',
        applies_to: 'administering',
        stat_effects: [{ stat_key: 'international_reputation', delta: -0.1 }],
        relations_delta: -0.1,
        duration: 20,
        removed_by: ['negotiate_voluntary_export_restraints'],
    },

    supply_chain_dependency: {
        key: 'supply_chain_dependency',
        name: 'Supply Chain Dependency',
        category: 'competitive',
        applies_to: 'non_administering',
        stat_effects: [
            { stat_key: 'cost_of_living', delta: 0.1 },
            { stat_key: 'manufacturing_output', delta: -0.05 },
        ],
        duration: 30,
        removed_by: ['launch_import_substitution', 'negotiate_supply_chain_diversification'],
    },

    intellectual_property_friction: {
        key: 'intellectual_property_friction',
        name: 'Intellectual Property Friction',
        category: 'competitive',
        applies_to: 'both',
        stat_effects: [{ stat_key: 'gdp_growth', delta: -0.1 }],
        relations_delta: -0.05,
        duration: 20,
        removed_by: ['bilateral_free_trade_restructuring'],
    },

    consumer_import_dependency: {
        key: 'consumer_import_dependency',
        name: 'Consumer Dependency on Imports',
        category: 'competitive',
        applies_to: 'non_administering',
        stat_effects: [{ stat_key: 'happiness', delta: -0.05 }],
        duration: 15,
        removed_by: ['launch_import_substitution'],
    },

    seasonal_trade_friction: {
        key: 'seasonal_trade_friction',
        name: 'Seasonal Trade Friction',
        category: 'competitive',
        applies_to: 'both',
        stat_effects: [{ stat_key: 'manufacturing_output', delta: -0.1 }],
        duration: null,
        removed_by: ['bilateral_free_trade_restructuring'],
        is_periodic: true,
        periodic_interval: 18,
        periodic_duration: 6,
    },

    // ── ESCALATION (6) — #19 collateral damage deferred ──

    tariff_wall_erected: {
        key: 'tariff_wall_erected',
        name: 'Tariff Wall Erected',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'cost_of_living', delta: 0.15 },
            { stat_key: 'manufacturing_output', delta: -0.1 },
        ],
        duration: 20,
        removed_by: [], // any diplomatic acceptance
    },

    import_ban_in_effect: {
        key: 'import_ban_in_effect',
        name: 'Import Ban in Effect',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'cost_of_living', delta: 0.2 },
            { stat_key: 'manufacturing_output', delta: -0.15 },
        ],
        duration: 15,
        removed_by: [], // diplomatic acceptance or expiry
    },

    investment_restrictions_active: {
        key: 'investment_restrictions_active',
        name: 'Investment Restrictions Active',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [{ stat_key: 'foreign_investment', delta: -0.15 }],
        duration: 20,
        removed_by: [], // diplomatic acceptance or expiry
    },

    retaliatory_measures_trade: {
        key: 'retaliatory_measures_trade',
        name: 'Retaliatory Measures in Effect',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [{ stat_key: 'gdp_growth', delta: -0.1 }],
        relations_delta: -0.15,
        duration: 15,
        removed_by: [], // diplomatic acceptance or expiry
    },

    credit_downgrade_pressure: {
        key: 'credit_downgrade_pressure',
        name: 'Credit Downgrade Pressure',
        category: 'escalation',
        applies_to: 'non_administering',
        stat_effects: [
            { stat_key: 'credit', delta: -0.15 },
            { stat_key: 'debt_growth', delta: 0.1 },
            { stat_key: 'interest_rates', delta: 0.05 },
        ],
        duration: 15,
        removed_by: [], // tension dropping below Moderate or expiry
    },

    economic_nationalism_trade: {
        key: 'economic_nationalism_trade',
        name: 'Economic Nationalism Surge',
        category: 'escalation',
        applies_to: 'both',
        stat_effects: [
            { stat_key: 'polarization', delta: 0.2 },
            { stat_key: 'immigration', delta: -0.1 },
        ],
        duration: 15,
        removed_by: [], // tension dropping below High or expiry
    },
};

// Role → ministry_key mapping for looking up which party's minister used an action
const ROLE_TO_MINISTRY = {
    'foreign_minister': 'foreign',
    'minister_of_trade': 'trade',
    'minister_of_defense': 'defense',
    'minister_of_finance': 'finance',
    'head_of_government': 'prime_minister',
    'ambassador': null,
};

// ==================== MARITIME FISHING RIGHTS — 18 ACTIONS ====================

const ACTIONS = {

    // ── DIPLOMATIC (6) — require other nation to accept ──

    propose_shared_maritime_survey: {
        key: 'propose_shared_maritime_survey',
        name: 'Propose Shared Maritime Survey',
        category: 'diplomatic',
        role: 'foreign_minister',
        ap_cost: 2,
        favor_delta: 0,
        tension_delta: -2,
        modifiers_removed: ['no_defined_maritime_territories'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Commission a joint hydrographic survey to map disputed waters. Results are binding.',
    },

    establish_joint_fishing_commission: {
        key: 'establish_joint_fishing_commission',
        name: 'Establish Joint Fishing Commission',
        category: 'diplomatic',
        role: 'foreign_minister',
        ap_cost: 2,
        favor_delta: 0,
        tension_delta: -2,
        modifiers_removed: ['no_regulatory_framework', 'foreign_vessels_in_waters'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Create a bilateral commission to manage the shared fishery with regulatory authority.',
    },

    negotiate_catch_quotas: {
        key: 'negotiate_catch_quotas',
        name: 'Negotiate Catch Quotas',
        category: 'diplomatic',
        role: 'minister_of_trade',
        ap_cost: 2,
        favor_delta: 0,
        tension_delta: -1,
        modifiers_removed: ['no_defined_quotas', 'overfishing'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Negotiate specific catch allocations per species per season for each nation.',
    },

    joint_coast_guard_patrols: {
        key: 'joint_coast_guard_patrols',
        name: 'Joint Coast Guard Patrols',
        category: 'diplomatic',
        role: 'minister_of_defense',
        ap_cost: 2,
        favor_delta: 0,
        tension_delta: -1,
        modifiers_removed: ['no_joint_enforcement', 'illegal_fishing_surge'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Coordinated patrols in the disputed zone with shared radio and joint arrest authority.',
    },

    invite_international_arbitration: {
        key: 'invite_international_arbitration',
        name: 'Invite International Arbitration',
        category: 'diplomatic',
        role: 'foreign_minister',
        ap_cost: 3,
        favor_delta: 0, // resets to 0
        tension_delta: -3,
        modifiers_removed: ['no_dispute_resolution_mechanism'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Submit the dispute to binding international arbitration. 8-tick process. Resolves issue entirely.',
        special: 'arbitration', // after 8 ticks removes ALL structural modifiers, resets favor to 0
    },

    sign_seasonal_fishing_calendar: {
        key: 'sign_seasonal_fishing_calendar',
        name: 'Sign Seasonal Fishing Calendar',
        category: 'diplomatic',
        role: 'ambassador',
        ap_cost: 1,
        favor_delta: 0,
        tension_delta: -1,
        modifiers_removed: ['seasonal_fishing_conflict'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Agree on which months each nation\'s fleet can operate. Stops seasonal flare-ups.',
    },

    // ── UNILATERAL (6) — immediate, no acceptance needed ──

    subsidize_domestic_fleet: {
        key: 'subsidize_domestic_fleet',
        name: 'Subsidize Domestic Fleet',
        category: 'unilateral',
        role: 'minister_of_finance',
        ap_cost: 2,
        favor_delta: 0.5,
        tension_delta: 0.5,
        modifiers_removed: [],
        modifiers_added: ['domestic_fleet_expansion'],
        treasury_cost: 15_000_000,
        description: 'Fund expansion of your fishing fleet. More boats, better equipment. Costs $15M.',
        modifier_target: 'acting', // added modifier applies to acting nation
    },

    invest_in_coastal_communities: {
        key: 'invest_in_coastal_communities',
        name: 'Invest in Coastal Communities',
        category: 'unilateral',
        role: 'minister_of_finance',
        ap_cost: 2,
        favor_delta: 0,
        tension_delta: 0,
        modifiers_removed: ['coastal_community_decline'],
        modifiers_added: [],
        treasury_cost: 20_000_000,
        description: 'Job retraining, infrastructure, alternative industries for affected towns. $20M.',
        modifier_remove_target: 'acting', // only removes from acting nation
    },

    impose_seasonal_restrictions: {
        key: 'impose_seasonal_restrictions',
        name: 'Impose Seasonal Restrictions',
        category: 'unilateral',
        role: 'minister_of_trade',
        ap_cost: 1,
        favor_delta: -0.5,
        tension_delta: -1,
        modifiers_removed: ['overfishing'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Restrict your own fleet during spawning seasons. Helps fish stocks recover.',
        stat_effects_acting: [{ stat_key: 'manufacturing_output', delta: -0.1, duration: 10 }],
    },

    expand_fishing_fleet: {
        key: 'expand_fishing_fleet',
        name: 'Expand Fishing Fleet Operations',
        category: 'unilateral',
        role: 'minister_of_trade',
        ap_cost: 1,
        favor_delta: 1,
        tension_delta: 1,
        modifiers_removed: [],
        modifiers_added: ['foreign_vessels_in_waters'],
        treasury_cost: 0,
        description: 'Push your fleet deeper into contested waters. Claim territory with hulls.',
        modifier_target: 'opponent', // added modifier applies to opponent
        stat_effects_acting: [{ stat_key: 'gdp_growth', delta: 0.1, duration: 10 }],
    },

    commission_legal_study: {
        key: 'commission_legal_study',
        name: 'Commission Legal Study',
        category: 'unilateral',
        role: 'foreign_minister',
        ap_cost: 1,
        favor_delta: 0, // +0.5 if your int'l reputation > theirs, checked at runtime
        tension_delta: 0,
        modifiers_removed: [],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Maritime lawyers produce a report supporting your claim. Positioning move.',
        special: 'reputation_check', // favor only shifts if acting nation has higher int'l reputation
    },

    redirect_fleet: {
        key: 'redirect_fleet',
        name: 'Redirect Fleet to Other Waters',
        category: 'unilateral',
        role: 'minister_of_trade',
        ap_cost: 1,
        favor_delta: -1,
        tension_delta: -1,
        modifiers_removed: ['foreign_vessels_in_waters'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Pull your fleet back from the contested zone. De-escalation signal.',
        modifier_remove_target: 'acting', // only removes if YOUR nation caused it
        stat_effects_acting: [{ stat_key: 'manufacturing_output', delta: -0.1, duration: 10 }],
    },

    // ── THREATENING (6) — aggressive, escalates, risks incidents ──

    public_denunciation: {
        key: 'public_denunciation',
        name: 'Public Denunciation',
        category: 'threatening',
        role: 'ambassador',
        ap_cost: 1,
        favor_delta: 1,
        tension_delta: 1,
        modifiers_removed: [],
        modifiers_added: ['public_hostility', 'diplomatic_friction'],
        treasury_cost: 0,
        description: 'Ambassador publicly condemns the other nation\'s fishing practices. Gloves off.',
        relations_delta: -2,
        stat_effects_opponent: [{ stat_key: 'international_reputation', delta: -0.1, duration: 10 }],
    },

    deploy_coast_guard_cutters: {
        key: 'deploy_coast_guard_cutters',
        name: 'Deploy Coast Guard Cutters',
        category: 'threatening',
        role: 'minister_of_defense',
        ap_cost: 2,
        favor_delta: 1.5,
        tension_delta: 2,
        modifiers_removed: [],
        modifiers_added: ['naval_presence'],
        treasury_cost: 0,
        description: 'Armed cutters patrol the disputed zone. Monitor, shadow, challenge.',
        relations_delta: -4,
        stat_effects_acting: [{ stat_key: 'military_readiness', delta: 0.1, duration: 20 }],
    },

    seize_foreign_vessel: {
        key: 'seize_foreign_vessel',
        name: 'Seize Foreign Fishing Vessel',
        category: 'threatening',
        role: 'minister_of_defense',
        ap_cost: 3,
        favor_delta: 2,
        tension_delta: 3,
        modifiers_removed: [],
        modifiers_added: ['seized_vessel_held'],
        treasury_cost: 0,
        description: 'Board, inspect, impound a foreign vessel. Crew detained. 50% triggers Incident.',
        relations_delta: -5,
        modifier_target: 'opponent', // seized vessel modifier applies to opponent
        special: 'incident_trigger_50',
    },

    impose_fishing_ban: {
        key: 'impose_fishing_ban',
        name: 'Impose Unilateral Fishing Ban',
        category: 'threatening',
        role: 'minister_of_trade',
        ap_cost: 2,
        favor_delta: 1,
        tension_delta: 2,
        modifiers_removed: [],
        modifiers_added: ['fishing_ban_in_effect', 'illegal_fishing_surge'],
        treasury_cost: 0,
        description: 'Ban all fishing in the zone. Your vessels and theirs. Black market fills the gap.',
        relations_delta: -3,
    },

    expel_foreign_vessels: {
        key: 'expel_foreign_vessels',
        name: 'Expel Foreign Vessels',
        category: 'threatening',
        role: 'minister_of_defense',
        ap_cost: 2,
        favor_delta: 2,
        tension_delta: 2,
        modifiers_removed: ['foreign_vessels_in_waters'],
        modifiers_added: ['active_vessel_expulsion'],
        treasury_cost: 0,
        description: 'Order all foreign fishing vessels out. Any remaining will be boarded.',
        relations_delta: -4,
    },

    threaten_naval_deployment: {
        key: 'threaten_naval_deployment',
        name: 'Threaten Naval Deployment',
        category: 'threatening',
        role: 'head_of_government',
        ap_cost: 2,
        favor_delta: 2,
        tension_delta: 3,
        modifiers_removed: [],
        modifiers_added: ['public_hostility', 'diplomatic_friction'],
        treasury_cost: 0,
        description: '"All options are on the table." The ambiguity is the weapon.',
        relations_delta: -5,
        stat_effects_opponent: [{ stat_key: 'stability', delta: -0.2, duration: 15 }],
        special: 'incident_trigger_25',
    },


    // ==================== TERRITORIAL OWNERSHIP DISPUTE — 18 ACTIONS ====================

    // ── DIPLOMATIC (6) ──

    propose_joint_sovereignty: {
        key: 'propose_joint_sovereignty',
        name: 'Propose Joint Sovereignty',
        category: 'diplomatic',
        role: 'head_of_government',
        ap_cost: 3,
        favor_delta: 0, // resets to 0
        tension_delta: -3,
        modifiers_removed: ['competing_sovereignty_claims', 'settler_population_growing'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Propose that both nations exercise joint sovereignty over the territory. Both flags, both languages, shared tax revenue.',
        special: 'favor_reset', // resets favor to 0 on acceptance
        issue_type: 'territorial_ownership',
    },

    offer_economic_concession: {
        key: 'offer_economic_concession',
        name: 'Offer Economic Concession for Claim',
        category: 'diplomatic',
        role: 'minister_of_trade',
        ap_cost: 3,
        favor_delta: -3, // massive concession
        tension_delta: -3,
        modifiers_removed: [], // removes ALL on acceptance (special handling)
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Offer a comprehensive trade package in exchange for the other nation renouncing their territorial claim. You\'re buying peace with money.',
        special: 'resolve_issue', // resolves the issue entirely on acceptance
        issue_type: 'territorial_ownership',
    },

    submit_to_international_court: {
        key: 'submit_to_international_court',
        name: 'Submit to International Court',
        category: 'diplomatic',
        role: 'foreign_minister',
        ap_cost: 3,
        favor_delta: 0, // resets to 0
        tension_delta: -3,
        modifiers_removed: ['no_international_adjudication'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Submit the dispute to binding international court. 10-tick process. Ruling may resolve the issue entirely.',
        special: 'court_ruling', // 10-tick process, stat-weighted outcome
        issue_type: 'territorial_ownership',
    },

    propose_condominium_administration: {
        key: 'propose_condominium_administration',
        name: 'Propose Condominium Administration',
        category: 'diplomatic',
        role: 'foreign_minister',
        ap_cost: 2,
        favor_delta: 0,
        tension_delta: -2,
        modifiers_removed: ['no_international_adjudication'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Propose a formal condominium — the territory is administered jointly under an agreed framework. Practical shared management.',
        stat_effects_acting: [{ stat_key: 'efficiency', delta: 0.05, duration: 20 }],
        stat_effects_opponent: [{ stat_key: 'efficiency', delta: 0.05, duration: 20 }],
        issue_type: 'territorial_ownership',
    },

    cultural_heritage_preservation: {
        key: 'cultural_heritage_preservation',
        name: 'Cultural Heritage Preservation Agreement',
        category: 'diplomatic',
        role: 'ambassador',
        ap_cost: 1,
        favor_delta: 0,
        tension_delta: -1,
        modifiers_removed: ['historical_grievance_attached', 'cultural_erasure_accusations', 'memorial_anniversary_tension'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Both nations agree to preserve the cultural heritage of both communities in the territory. Neither side erases the other\'s history.',
        issue_type: 'territorial_ownership',
    },

    resource_sharing_framework: {
        key: 'resource_sharing_framework',
        name: 'Resource-Sharing Framework',
        category: 'diplomatic',
        role: 'minister_of_trade',
        ap_cost: 2,
        favor_delta: 0,
        tension_delta: -2,
        modifiers_removed: ['resource_potential', 'resource_exploitation_conflict', 'resource_extraction_underway'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Agree to jointly exploit the territory\'s resources regardless of who owns the land. Revenue split 50/50.',
        special: 'requires_modifier', // only available if resource_potential is active
        requires_modifier: 'resource_potential',
        issue_type: 'territorial_ownership',
    },

    // ── UNILATERAL (6) ──

    build_infrastructure_territory: {
        key: 'build_infrastructure_territory',
        name: 'Build Infrastructure in Territory',
        category: 'unilateral',
        role: 'minister_of_finance',
        ap_cost: 3,
        favor_delta: 2,
        tension_delta: 1,
        modifiers_removed: [],
        modifiers_added: [], // competing_development_projects added if both nations build (handled in auto-spawn)
        treasury_cost: 25_000_000,
        description: 'Build roads, bridges, schools, hospitals. Every building is a claim. $25M.',
        stat_effects_acting: [{ stat_key: 'physical_infrastructure', delta: 0.1, duration: 15 }],
        issue_type: 'territorial_ownership',
    },

    settle_citizens_territory: {
        key: 'settle_citizens_territory',
        name: 'Settle Citizens in Territory',
        category: 'unilateral',
        role: 'head_of_government',
        ap_cost: 2,
        favor_delta: 1,
        tension_delta: 2,
        modifiers_removed: [],
        modifiers_added: ['settler_population_growing'],
        treasury_cost: 10_000_000,
        description: 'Offer tax breaks, free land, subsidized housing. Change the demographic balance. $10M.',
        issue_type: 'territorial_ownership',
    },

    commission_legal_claim: {
        key: 'commission_legal_claim',
        name: 'Commission Legal Claim Document',
        category: 'unilateral',
        role: 'foreign_minister',
        ap_cost: 1,
        favor_delta: 0, // +1 if int'l reputation > opponent's, +0.5 if equal
        tension_delta: 0,
        modifiers_removed: [],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Hire international lawyers to produce a legal document supporting your claim. Positioning move.',
        special: 'reputation_check_territorial', // favor only shifts based on reputation comparison
        issue_type: 'territorial_ownership',
    },

    name_territory_on_maps: {
        key: 'name_territory_on_maps',
        name: 'Name Territory on Official Maps',
        category: 'unilateral',
        role: 'head_of_government',
        ap_cost: 1,
        favor_delta: 0.5,
        tension_delta: 0.5,
        modifiers_removed: [],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Update all official maps to refer to the territory exclusively by your name. A quiet, persistent assertion of ownership.',
        issue_type: 'territorial_ownership',
    },

    economic_development_program: {
        key: 'economic_development_program',
        name: 'Economic Development Program',
        category: 'unilateral',
        role: 'minister_of_finance',
        ap_cost: 2,
        favor_delta: 1,
        tension_delta: 0,
        modifiers_removed: [],
        modifiers_added: [],
        treasury_cost: 20_000_000,
        description: 'Invest in the territory\'s economy. Local businesses, tourism, agriculture. Make it prosperous under your administration. $20M.',
        stat_effects_acting: [
            { stat_key: 'gdp_growth', delta: 0.05, duration: 20 },
            { stat_key: 'standard_of_living', delta: 0.1, duration: 20 },
        ],
        issue_type: 'territorial_ownership',
    },

    establish_administrative_presence: {
        key: 'establish_administrative_presence',
        name: 'Establish Administrative Presence',
        category: 'unilateral',
        role: 'head_of_government',
        ap_cost: 2,
        favor_delta: 1,
        tension_delta: 1,
        modifiers_removed: [],
        modifiers_added: [], // competing_development_projects if both establish (auto-spawn)
        treasury_cost: 10_000_000,
        description: 'Open government offices in the territory. Post office, tax office, courts. The bureaucratic assertion of sovereignty. $10M.',
        stat_effects_acting: [{ stat_key: 'efficiency', delta: 0.1, duration: 15 }],
        issue_type: 'territorial_ownership',
    },

    // ── THREATENING (6) ──

    military_occupation_territory: {
        key: 'military_occupation_territory',
        name: 'Military Occupation of Territory',
        category: 'threatening',
        role: 'minister_of_defense',
        ap_cost: 4,
        favor_delta: 3,
        tension_delta: 4,
        modifiers_removed: [],
        modifiers_added: ['military_occupation'],
        treasury_cost: 0,
        description: 'Send the army. Occupy the territory with military force. 60% triggers Border Incursion.',
        relations_delta: -8,
        stat_effects_acting: [{ stat_key: 'military_readiness', delta: 0.2, duration: 30 }],
        stat_effects_opponent: [{ stat_key: 'stability', delta: -0.3, duration: 30 }],
        special: 'incident_trigger_60',
        issue_type: 'territorial_ownership',
    },

    forced_population_transfer_action: {
        key: 'forced_population_transfer_action',
        name: 'Forced Population Transfer',
        category: 'threatening',
        role: 'head_of_government',
        ap_cost: 3,
        favor_delta: 2,
        tension_delta: 4,
        modifiers_removed: [],
        modifiers_added: ['forced_population_transfer'],
        treasury_cost: 0,
        description: 'Forcibly relocate the other nation\'s ethnic community from the territory. Ethnic cleansing by another name.',
        relations_delta: -8,
        stat_effects_acting: [
            { stat_key: 'international_reputation', delta: -2 },
            { stat_key: 'freedom_index', delta: -0.3, duration: 30 },
        ],
        issue_type: 'territorial_ownership',
    },

    resource_extraction_without_agreement: {
        key: 'resource_extraction_without_agreement',
        name: 'Resource Extraction Without Agreement',
        category: 'threatening',
        role: 'minister_of_trade',
        ap_cost: 2,
        favor_delta: 1,
        tension_delta: 2,
        modifiers_removed: [],
        modifiers_added: ['resource_extraction_underway', 'resource_exploitation_conflict'],
        treasury_cost: 0,
        description: 'Begin extracting resources without agreement. You profit. They watch.',
        relations_delta: -3,
        stat_effects_acting: [{ stat_key: 'gdp_growth', delta: 0.2, duration: 25 }],
        special: 'requires_modifier',
        requires_modifier: 'resource_potential',
        issue_type: 'territorial_ownership',
    },

    military_exercise_territory: {
        key: 'military_exercise_territory',
        name: 'Military Exercise in Territory',
        category: 'threatening',
        role: 'minister_of_defense',
        ap_cost: 2,
        favor_delta: 2,
        tension_delta: 3,
        modifiers_removed: [],
        modifiers_added: ['military_exercises_conducted'],
        treasury_cost: 0,
        description: 'Conduct live-fire military exercises in the territory. Tanks, artillery, air assets. Intimidation campaign.',
        relations_delta: -5,
        stat_effects_acting: [{ stat_key: 'military_readiness', delta: 0.1, duration: 10 }],
        stat_effects_opponent: [{ stat_key: 'stability', delta: -0.2, duration: 10 }],
        issue_type: 'territorial_ownership',
    },

    expel_other_nations_citizens: {
        key: 'expel_other_nations_citizens',
        name: 'Expel Other Nation\'s Citizens',
        category: 'threatening',
        role: 'head_of_government',
        ap_cost: 2,
        favor_delta: 1,
        tension_delta: 3,
        modifiers_removed: [],
        modifiers_added: ['citizen_expulsion', 'diaspora_mobilization'],
        treasury_cost: 0,
        description: 'Order all citizens of the other nation to leave the territory. 30-day deadline.',
        relations_delta: -5,
        stat_effects_acting: [{ stat_key: 'international_reputation', delta: -0.15, duration: 15 }],
        modifier_target_map: { citizen_expulsion: 'opponent', diaspora_mobilization: 'opponent' },
        issue_type: 'territorial_ownership',
    },

    declare_sovereignty: {
        key: 'declare_sovereignty',
        name: 'Declare Sovereignty',
        category: 'threatening',
        role: 'head_of_government',
        ap_cost: 2,
        favor_delta: 2,
        tension_delta: 3,
        modifiers_removed: [],
        modifiers_added: ['sovereignty_declared'],
        treasury_cost: 0,
        description: 'Formal declaration that the territory is sovereign national territory. Political point of no return.',
        relations_delta: -5,
        stat_effects_acting: [{ stat_key: 'international_reputation', delta: -0.1, duration: 20 }],
        stat_effects_opponent: [{ stat_key: 'stability', delta: -0.1, duration: 20 }],
        special: 'sovereignty_nationalism_30', // 30% chance of also spawning nationalist_territorial_movement
        issue_type: 'territorial_ownership',
    },


    // ==================== CHRONIC TRADE IMBALANCE — 18 ACTIONS ====================
    // Surplus = administering, Deficit = non_administering
    // Actions #12 and #17 use democracy-only versions (autocracy system not implemented)

    // ── DIPLOMATIC (6) ──

    negotiate_trade_rebalancing: {
        key: 'negotiate_trade_rebalancing',
        name: 'Negotiate Trade Rebalancing Agreement',
        category: 'diplomatic',
        role: 'minister_of_trade',
        ap_cost: 2,
        favor_delta: 0,
        tension_delta: -2,
        modifiers_removed: ['persistent_trade_deficit', 'no_trade_rebalancing_mechanism'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Negotiate a structured rebalancing plan. The surplus nation agrees to reduce export volume and purchase goods from the deficit nation.',
        issue_type: 'chronic_trade_imbalance',
    },

    negotiate_voluntary_export_restraints: {
        key: 'negotiate_voluntary_export_restraints',
        name: 'Negotiate Voluntary Export Restraints',
        category: 'diplomatic',
        role: 'minister_of_trade',
        ap_cost: 2,
        favor_delta: 0,
        tension_delta: -1,
        modifiers_removed: ['domestic_industries_losing_share', 'dumping_accusations'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'The surplus nation voluntarily limits export volumes in specific sectors. Technically voluntary. Practically coerced.',
        issue_type: 'chronic_trade_imbalance',
    },

    propose_currency_alignment: {
        key: 'propose_currency_alignment',
        name: 'Propose Currency Alignment Talks',
        category: 'diplomatic',
        role: 'minister_of_finance',
        ap_cost: 2,
        favor_delta: 0,
        tension_delta: -1,
        modifiers_removed: ['currency_misalignment_suspected'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Open formal talks between both nations\' central banks to address currency valuation and prevent competitive devaluation.',
        special: 'requires_modifier',
        requires_modifier: 'currency_misalignment_suspected',
        issue_type: 'chronic_trade_imbalance',
    },

    joint_economic_development_fund: {
        key: 'joint_economic_development_fund',
        name: 'Joint Economic Development Fund',
        category: 'diplomatic',
        role: 'minister_of_finance',
        ap_cost: 3,
        favor_delta: 0,
        tension_delta: -2,
        modifiers_removed: ['factory_closures_deficit'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'The surplus nation invests directly in the deficit nation\'s economy. Build factories, create two-way supply chains. Not charity — strategic investment.',
        stat_effects_opponent: [
            { stat_key: 'gdp_growth', delta: 0.1, duration: 20 },
            { stat_key: 'foreign_investment', delta: 0.1, duration: 20 },
        ],
        issue_type: 'chronic_trade_imbalance',
    },

    bilateral_free_trade_restructuring: {
        key: 'bilateral_free_trade_restructuring',
        name: 'Bilateral Free Trade Restructuring',
        category: 'diplomatic',
        role: 'head_of_government',
        ap_cost: 4,
        favor_delta: 0, // resets to 0
        tension_delta: -3,
        modifiers_removed: ['intellectual_property_friction', 'seasonal_trade_friction', 'surplus_market_dependency'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Renegotiate the entire trade relationship from scratch. Both sides make concessions. 8-tick process + parliamentary ratification.',
        special: 'trade_restructuring', // 8-tick process, removes ALL structural on ratification
        issue_type: 'chronic_trade_imbalance',
    },

    negotiate_supply_chain_diversification: {
        key: 'negotiate_supply_chain_diversification',
        name: 'Negotiate Supply Chain Diversification',
        category: 'diplomatic',
        role: 'minister_of_trade',
        ap_cost: 2,
        favor_delta: 0,
        tension_delta: -1,
        modifiers_removed: ['supply_chain_dependency'],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Both nations agree to reduce supply chain concentration so neither is critically dependent on the other for essential inputs.',
        special: 'requires_modifier',
        requires_modifier: 'supply_chain_dependency',
        issue_type: 'chronic_trade_imbalance',
    },

    // ── UNILATERAL (6) ──

    domestic_industry_subsidy: {
        key: 'domestic_industry_subsidy',
        name: 'Domestic Industry Subsidy Program',
        category: 'unilateral',
        role: 'minister_of_finance',
        ap_cost: 2,
        favor_delta: 0.5,
        tension_delta: 0.5,
        modifiers_removed: ['domestic_industries_losing_share', 'factory_closures_deficit'],
        modifiers_added: [],
        treasury_cost: 25_000_000,
        description: 'Fund your domestic industries directly. Subsidies, tax breaks, low-interest loans. Expensive but keeps the lights on. $25M.',
        stat_effects_acting: [
            { stat_key: 'manufacturing_output', delta: 0.15, duration: 20 },
            { stat_key: 'debt_growth', delta: 0.3, duration: 20 },
        ],
        modifier_remove_target: 'acting',
        issue_type: 'chronic_trade_imbalance',
    },

    launch_import_substitution: {
        key: 'launch_import_substitution',
        name: 'Launch Import Substitution Program',
        category: 'unilateral',
        role: 'minister_of_trade',
        ap_cost: 3,
        favor_delta: 0.5,
        tension_delta: 0.5,
        modifiers_removed: ['no_import_substitution_strategy'],
        modifiers_added: [],
        treasury_cost: 30_000_000,
        description: 'Develop domestic alternatives to imported goods. Expensive, slow, but structurally transformative. $30M.',
        stat_effects_acting: [
            { stat_key: 'manufacturing_output', delta: 0.1, duration: 20 },
            { stat_key: 'cost_of_living', delta: 0.1, duration: 10 },
        ],
        modifier_remove_target: 'acting',
        issue_type: 'chronic_trade_imbalance',
    },

    file_anti_dumping_complaint: {
        key: 'file_anti_dumping_complaint',
        name: 'File Anti-Dumping Complaint',
        category: 'unilateral',
        role: 'foreign_minister',
        ap_cost: 1,
        favor_delta: 0.5,
        tension_delta: 0.5,
        modifiers_removed: [],
        modifiers_added: ['dumping_accusations'],
        treasury_cost: 0,
        description: 'File a formal anti-dumping complaint. Accuse the surplus nation of selling below cost. The accusation does damage regardless of truth.',
        modifier_target: 'opponent',
        issue_type: 'chronic_trade_imbalance',
    },

    buy_domestic_campaign: {
        key: 'buy_domestic_campaign',
        name: '"Buy Domestic" Campaign',
        category: 'unilateral',
        role: 'head_of_government',
        ap_cost: 1,
        favor_delta: 0.5,
        tension_delta: 0,
        modifiers_removed: [],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Launch a public campaign encouraging citizens to buy domestically produced goods. Government leads by example. Symbolic but meaningful.',
        stat_effects_acting: [
            { stat_key: 'gov_approval', delta: 0.05, duration: 15 },
            { stat_key: 'manufacturing_output', delta: 0.05, duration: 15 },
        ],
        issue_type: 'chronic_trade_imbalance',
    },

    attract_alternative_partners: {
        key: 'attract_alternative_partners',
        name: 'Attract Alternative Trading Partners',
        category: 'unilateral',
        role: 'minister_of_trade',
        ap_cost: 2,
        favor_delta: -0.5,
        tension_delta: -0.5,
        modifiers_removed: [],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Pursue trade deals with third-party nations to reduce dependence on the surplus nation. Don\'t fix the relationship — go around it.',
        stat_effects_acting: [{ stat_key: 'foreign_investment', delta: 0.05, duration: 15 }],
        issue_type: 'chronic_trade_imbalance',
    },

    advocate_central_bank_shift: {
        key: 'advocate_central_bank_shift',
        name: 'Advocate for Central Bank Policy Shift',
        category: 'unilateral',
        role: 'minister_of_finance',
        ap_cost: 1,
        favor_delta: 0,
        tension_delta: 0,
        modifiers_removed: [],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Publicly urge the central bank to consider monetary policy adjustment. Democratic independence means 30% chance of effect.',
        special: 'central_bank_30', // 30% chance of currency_strength -0.1 for 8 ticks
        issue_type: 'chronic_trade_imbalance',
    },

    // ── THREATENING (6) ──

    impose_targeted_tariffs: {
        key: 'impose_targeted_tariffs',
        name: 'Impose Targeted Tariffs',
        category: 'threatening',
        role: 'minister_of_trade',
        ap_cost: 2,
        favor_delta: 1,
        tension_delta: 2,
        modifiers_removed: [],
        modifiers_added: ['tariff_wall_erected'],
        treasury_cost: 0,
        description: 'Impose 15-25% tariffs on the surplus nation\'s key exports. The line that turns a trade imbalance into a trade war.',
        relations_delta: -3,
        special: 'incident_trigger_50',
        issue_type: 'chronic_trade_imbalance',
    },

    ban_key_imports: {
        key: 'ban_key_imports',
        name: 'Ban Key Imports',
        category: 'threatening',
        role: 'minister_of_trade',
        ap_cost: 3,
        favor_delta: 2,
        tension_delta: 3,
        modifiers_removed: [],
        modifiers_added: ['import_ban_in_effect'],
        treasury_cost: 0,
        description: 'Ban imports of specific product categories entirely. Not tariffs — a full prohibition. Economic warfare.',
        relations_delta: -5,
        issue_type: 'chronic_trade_imbalance',
    },

    restrict_foreign_investment_trade: {
        key: 'restrict_foreign_investment_trade',
        name: 'Restrict Foreign Investment',
        category: 'threatening',
        role: 'foreign_minister',
        ap_cost: 2,
        favor_delta: 1,
        tension_delta: 2,
        modifiers_removed: [],
        modifiers_added: ['investment_restrictions_active'],
        treasury_cost: 0,
        description: 'Block the surplus nation from investing in critical sectors. Frame it as national security.',
        relations_delta: -3,
        issue_type: 'chronic_trade_imbalance',
    },

    public_trade_ultimatum: {
        key: 'public_trade_ultimatum',
        name: 'Public Trade Ultimatum',
        category: 'threatening',
        role: 'head_of_government',
        ap_cost: 2,
        favor_delta: 1.5,
        tension_delta: 2,
        modifiers_removed: [],
        modifiers_added: [],
        treasury_cost: 0,
        description: 'Give a public address setting a 4-tick deadline. If ignored, economic nationalism surges and favor shifts dramatically.',
        relations_delta: -3,
        stat_effects_acting: [{ stat_key: 'gov_approval', delta: 0.1, duration: 6 }],
        special: 'trade_ultimatum_4', // 4-tick deadline tracked via history metadata
        issue_type: 'chronic_trade_imbalance',
    },

    asset_freeze_sanctions: {
        key: 'asset_freeze_sanctions',
        name: 'Asset Freeze via Sanctions',
        category: 'threatening',
        role: 'foreign_minister',
        ap_cost: 2,
        favor_delta: 1,
        tension_delta: 2,
        modifiers_removed: [],
        modifiers_added: ['investment_restrictions_active'],
        treasury_cost: 0,
        description: 'Freeze surplus nation assets through legal channels. Every foreign investor gets nervous.',
        relations_delta: -5,
        stat_effects_acting: [{ stat_key: 'foreign_investment', delta: -0.1, duration: 15 }],
        stat_effects_opponent: [{ stat_key: 'foreign_investment', delta: -0.1, duration: 15 }],
        issue_type: 'chronic_trade_imbalance',
    },

    publicly_blame_surplus: {
        key: 'publicly_blame_surplus',
        name: 'Publicly Blame Surplus Nation',
        category: 'threatening',
        role: 'head_of_government',
        ap_cost: 1,
        favor_delta: 1,
        tension_delta: 2,
        modifiers_removed: [],
        modifiers_added: ['economic_nationalism_trade', 'dumping_accusations'],
        treasury_cost: 0,
        description: 'Hold a press conference. Display charts showing job losses. Point the finger. Channel domestic anger outward.',
        relations_delta: -3,
        stat_effects_acting: [{ stat_key: 'gov_approval', delta: 0.1, duration: 10 }],
        stat_effects_opponent: [{ stat_key: 'international_reputation', delta: -0.1, duration: 15 }],
        modifier_target_map: { economic_nationalism_trade: 'both', dumping_accusations: 'opponent' },
        issue_type: 'chronic_trade_imbalance',
    },
};

// ==================== ISSUE TYPE DEFINITIONS ====================

const ISSUE_TYPES = {
    maritime_fishing_rights: {
        key: 'maritime_fishing_rights',
        name: 'Maritime Fishing Rights',
        required_border: 'maritime',
        description: 'Fishing vessels from both nations routinely operate in overlapping waters. No formal agreement governs who can fish where, how much, or when.',
        category: 'Economic / Sea Border',
        incident_type: 'fishing_dispute', // maps to existing incident type on escalation
        starter_modifiers: [
            'no_defined_maritime_territories',
            'no_regulatory_framework',
            'no_defined_quotas',
            'no_joint_enforcement',
            'no_dispute_resolution_mechanism',
        ],
    },

    territorial_ownership: {
        key: 'territorial_ownership',
        name: 'Territorial Ownership Dispute',
        required_border: null, // bordering or nearby (distance 0-20), checked at spawn
        required_proximity: 20,
        description: 'A specific named territory is claimed by both nations based on historical, ethnic, or treaty grounds. One nation administers it. The other wants it.',
        category: 'Military',
        incident_type: 'border_military_incursion', // 66% — or fishing_dispute at 33% if maritime
        incident_type_alt: 'fishing_dispute',
        incident_type_alt_weight: 0.33,
        has_administering_nation: true,
        starter_modifiers: [
            'competing_sovereignty_claims',
            'no_international_adjudication',
            'domestic_political_significance',
            'resource_potential',
            'historical_grievance_attached',
        ],
    },

    chronic_trade_imbalance: {
        key: 'chronic_trade_imbalance',
        name: 'Chronic Trade Imbalance',
        required_border: null, // any distance — trade crosses oceans
        description: 'One nation consistently exports far more to the other than it imports. The deficit nation\'s domestic industries are being undercut by cheaper foreign goods.',
        category: 'Economic',
        incident_type: 'trade_war_escalation',
        has_administering_nation: true, // surplus = administering, deficit = non_administering
        auto_spawn: true, // spawned by trade engine, not admin
        auto_spawn_config: {
            imbalance_pct_threshold: 50,
            sustained_ticks: 5,
            spawn_chance: 0.5,
            max_per_nation: 2,
            cooldown_after_resolution: 60,
        },
        starter_modifiers: [
            'persistent_trade_deficit',
            'no_trade_rebalancing_mechanism',
            'domestic_industries_losing_share',
            'no_import_substitution_strategy',
            'currency_misalignment_suspected',
        ],
    },
};


// ==================== STAT EFFECT HELPERS ====================

/**
 * Apply an array of stat deltas to a nation.
 * Effects format: [{ stat_key: 'stability', delta: -0.1 }]
 * Clamps all values to 0-100.
 */
async function applyIssueStatEffects(supabase, nationId, nationObj, effects) {
    if (!effects || effects.length === 0) return;

    const updates = {};
    for (const eff of effects) {
        const current = Number(nationObj[eff.stat_key] ?? 50);
        updates[eff.stat_key] = Math.max(0, Math.min(100, current + eff.delta));
    }

    const { error } = await supabase
        .from('nations')
        .update(updates)
        .eq('id', nationId);

    if (error) {
        console.error(`[Issues] Failed to apply stat effects to ${nationObj.name}:`, error);
    }
}

/**
 * Update bilateral relation score between two nations.
 */
async function nudgeIssueRelations(supabase, nationAId, nationBId, delta) {
    const aId = nationAId < nationBId ? nationAId : nationBId;
    const bId = nationAId < nationBId ? nationBId : nationAId;

    const { error: rpcErr } = await supabase.rpc('nudge_relation_score', {
        p_nation_a_id: aId,
        p_nation_b_id: bId,
        p_delta: delta
    });
    if (rpcErr) {
        // Fallback: direct update
        const { data: rel } = await supabase.from('diplomatic_relations')
            .select('relation_score')
            .eq('nation_a_id', aId)
            .eq('nation_b_id', bId)
            .maybeSingle();
        const current = rel?.relation_score ?? 30;
        await supabase.from('diplomatic_relations')
            .update({ relation_score: Math.max(0, Math.min(100, current + delta)) })
            .eq('nation_a_id', aId)
            .eq('nation_b_id', bId);
    }
}

/**
 * Determine which nation is "disfavored" by the current favor value.
 * favor > 0 = favors nation_b → nation_a is disfavored.
 * favor < 0 = favors nation_a → nation_b is disfavored.
 * favor == 0 = neither (skip disfavored-only effects).
 */
function getDisfavoredSide(favor) {
    if (favor > 0) return 'nation_a';
    if (favor < 0) return 'nation_b';
    return null;
}


// ==================== MODIFIER ENGINE ====================

/**
 * Main per-tick processor for all active bilateral issues.
 * Called once per tick from the advance-tick handler.
 *
 * 1. Apply active modifier stat effects to nations
 * 2. Decrement durations, remove expired modifiers
 * 3. Handle periodic modifiers (activate/deactivate windows)
 * 4. Check auto-spawn conditions for competitive modifiers
 * 5. Apply relation bleeds from escalation modifiers
 * 6. Track idle ticks (no diplomatic action)
 * 7. Check tension 10 → escalation to incident
 *
 * Returns: { modifiersApplied, modifiersExpired, modifiersSpawned, escalations }
 */
export async function processIssueTick(supabase, nationList, currentTick) {
    const results = {
        modifiersApplied: 0,
        modifiersExpired: [],
        modifiersSpawned: [],
        escalations: [],
    };

    // Fetch all active/partial issues
    const { data: issues, error: issueErr } = await supabase
        .from('bilateral_issues')
        .select('*')
        .in('status', ['active', 'partial']);

    if (issueErr) {
        console.error('[Issues] Failed to load active issues:', issueErr);
        return results;
    }
    if (!issues || issues.length === 0) return results;

    // Build nation lookup
    const nationMap = {};
    for (const n of nationList) {
        nationMap[n.id] = n;
    }

    for (const issue of issues) {
        const nationA = nationMap[issue.nation_a_id];
        const nationB = nationMap[issue.nation_b_id];
        if (!nationA || !nationB) continue;

        // Load active modifiers for this issue
        const { data: modifiers, error: modErr } = await supabase
            .from('bilateral_issue_modifiers')
            .select('*')
            .eq('issue_id', issue.id)
            .eq('is_active', true);

        if (modErr) {
            console.error(`[Issues] Failed to load modifiers for ${issue.id}:`, modErr);
            continue;
        }

        // ── 1. Apply modifier stat effects ──
        // Favored nation gets effects reduced to 1/10th
        const favoredNationId = issue.favor > 0 ? issue.nation_b_id
                              : issue.favor < 0 ? issue.nation_a_id
                              : null;

        for (const mod of (modifiers || [])) {
            const config = MODIFIERS[mod.modifier_key];
            if (!config || !config.stat_effects || config.stat_effects.length === 0) continue;

            // For periodic modifiers, only apply during active windows
            if (mod.is_periodic && !mod.is_periodic_active) continue;

            // Resolve which nation(s) the effects apply to
            const targets = resolveTargets(mod.applies_to, issue, nationA, nationB);
            for (const target of targets) {
                const isFavored = favoredNationId && target.id === favoredNationId;
                const effects = isFavored
                    ? config.stat_effects.map(e => ({ ...e, delta: e.delta * 0.1 }))
                    : config.stat_effects;
                await applyIssueStatEffects(supabase, target.id, target, effects);
                results.modifiersApplied++;
            }

            // Special: relations bleed (e.g. active_vessel_expulsion)
            if (config.relations_delta) {
                await nudgeIssueRelations(supabase, issue.nation_a_id, issue.nation_b_id, config.relations_delta);
            }
        }

        // ── 2. Decrement durations, remove expired ──
        for (const mod of (modifiers || [])) {
            if (mod.duration_remaining === null) continue; // persistent
            if (mod.is_periodic) continue; // periodic durations handled separately

            const newDuration = mod.duration_remaining - 1;
            if (newDuration <= 0) {
                // Expire this modifier
                await supabase
                    .from('bilateral_issue_modifiers')
                    .update({
                        is_active: false,
                        resolved_by: 'expiry',
                        resolved_tick: currentTick,
                        duration_remaining: 0,
                    })
                    .eq('id', mod.id);

                results.modifiersExpired.push({
                    issue_id: issue.id,
                    modifier_key: mod.modifier_key,
                });

                await insertHistory(supabase, issue.id, currentTick, 'modifier_removed',
                    `${MODIFIERS[mod.modifier_key]?.name || mod.modifier_key} has expired.`,
                    { modifier_key: mod.modifier_key, reason: 'expiry' });
            } else {
                await supabase
                    .from('bilateral_issue_modifiers')
                    .update({ duration_remaining: newDuration })
                    .eq('id', mod.id);
            }
        }

        // ── 3. Handle periodic modifiers ──
        for (const mod of (modifiers || [])) {
            if (!mod.is_periodic) continue;

            if (mod.is_periodic_active) {
                // Currently in an active window — decrement periodic duration
                const remaining = (mod.duration_remaining ?? 0) - 1;
                if (remaining <= 0) {
                    // Window ends — deactivate until next interval
                    const nextFire = currentTick + (mod.periodic_interval || 20);
                    await supabase
                        .from('bilateral_issue_modifiers')
                        .update({
                            is_periodic_active: false,
                            duration_remaining: null,
                            periodic_next_tick: nextFire,
                        })
                        .eq('id', mod.id);
                } else {
                    await supabase
                        .from('bilateral_issue_modifiers')
                        .update({ duration_remaining: remaining })
                        .eq('id', mod.id);
                }
            } else {
                // Not currently active — check if it's time to fire
                if (mod.periodic_next_tick !== null && currentTick >= mod.periodic_next_tick) {
                    const config = MODIFIERS[mod.modifier_key];
                    const activeDuration = mod.periodic_duration || config?.periodic_duration || 8;
                    await supabase
                        .from('bilateral_issue_modifiers')
                        .update({
                            is_periodic_active: true,
                            duration_remaining: activeDuration,
                        })
                        .eq('id', mod.id);

                    await insertHistory(supabase, issue.id, currentTick, 'modifier_fired',
                        `${config?.name || mod.modifier_key} has flared up again.`,
                        { modifier_key: mod.modifier_key });
                }
            }
        }

        // ── 4. Auto-spawn competitive modifiers ──
        const activeKeys = new Set((modifiers || []).filter(m => m.is_active).map(m => m.modifier_key));
        await checkAutoSpawns(supabase, issue, activeKeys, modifiers || [], nationA, nationB, currentTick, results);

        // ── 4a. Process arbitration rulings ──
        await processArbitration(supabase, issue.id, currentTick);

        // ── 4b. Tension drift ──
        // Tension drifts based on active modifier severity:
        //   escalation modifiers: +0.5/tick each
        //   competitive modifiers: +0.25/tick each
        //   structural modifiers alone: no drift (they're the baseline)
        // If only structural remain and no competitive/escalation: tension drifts -0.25/tick (natural cooling)
        const activeMods = (modifiers || []).filter(m => m.is_active && (!m.is_periodic || m.is_periodic_active));
        const escalationCount = activeMods.filter(m => m.category === 'escalation').length;
        const competitiveCount = activeMods.filter(m => m.category === 'competitive').length;

        let tensionDrift = 0;
        if (escalationCount > 0 || competitiveCount > 0) {
            tensionDrift = (escalationCount * 0.5) + (competitiveCount * 0.25);
        } else {
            // Only structural — slow cooling
            tensionDrift = -0.25;
        }

        // Apply tension drift (accumulate fractional, clamp 0-10)
        const rawTension = Number(issue.tension) + tensionDrift;
        let newTension = Math.max(0, Math.min(10, Math.round(rawTension * 4) / 4)); // quarter-step precision

        // ── 4c. Favor-based Gov_Approval bleed ──
        // The disfavored nation loses Gov_Approval proportional to |favor|
        // This is separate from modifier effects — it's the base cost of losing the dispute
        if (Math.abs(issue.favor) >= 1) {
            const disfavoredSide = getDisfavoredSide(issue.favor);
            const disfavoredNation = disfavoredSide === 'nation_a' ? nationA : nationB;
            if (disfavoredNation) {
                // -0.1 per point of favor against you (so favor ±3 = -0.3/tick)
                const approvalDelta = -(Math.abs(issue.favor) * 0.1);
                await applyIssueStatEffects(supabase, disfavoredNation.id, disfavoredNation,
                    [{ stat_key: 'gov_approval', delta: approvalDelta }]);
            }
        }

        // ── 4d. Resolve submitted diplomatic actions (3-tick matching window) ──
        // Nations have 3 ticks to match a diplomatic action. On the tick the window
        // expires (submitted_tick + 3), unmatched submissions become a gaffe.
        // Counter-play: if the opponent used a unilateral/threatening action during
        // the 3-tick window, they get +3 gov_approval and +3 party momentum.

        const DIPLOMATIC_WINDOW = 3; // ticks to match

        // Fetch ALL pending diplomatic submissions for this issue (any tick)
        const { data: submittedDipActions, error: dipQueryErr } = await supabase
            .from('bilateral_issue_actions_taken')
            .select('*')
            .eq('issue_id', issue.id)
            .eq('action_category', 'diplomatic')
            .eq('status', 'submitted');
        if (dipQueryErr) console.error('[Issues] Failed to query submitted diplomatic actions:', dipQueryErr.message);

        let hadDiplomaticMatch = false;

        if (submittedDipActions && submittedDipActions.length > 0) {
            // Group by action_key
            const byKey = {};
            for (const sa of submittedDipActions) {
                if (!byKey[sa.action_key]) byKey[sa.action_key] = [];
                byKey[sa.action_key].push(sa);
            }

            // Track which submissions got matched
            const matchedIds = new Set();

            for (const [actionKey, submissions] of Object.entries(byKey)) {
                // Check if both nations submitted the same action (within window)
                const fromA = submissions.find(s => s.acting_nation_id === issue.nation_a_id);
                const fromB = submissions.find(s => s.acting_nation_id === issue.nation_b_id);

                if (fromA && fromB) {
                    // ── MATCHED: apply diplomatic effects ──
                    hadDiplomaticMatch = true;
                    matchedIds.add(fromA.id);
                    matchedIds.add(fromB.id);

                    const dipAction = ACTIONS[actionKey];
                    if (!dipAction) continue;

                    // Apply tension delta
                    newTension = Math.max(0, Math.min(10, newTension + dipAction.tension_delta));

                    // Apply favor delta (diplomatic actions usually have 0)
                    if (dipAction.favor_delta !== 0) {
                        // Both agreed so favor stays neutral — no shift
                    }

                    // Remove modifiers
                    for (const modKey of dipAction.modifiers_removed) {
                        const { error: removeErr } = await supabase
                            .from('bilateral_issue_modifiers')
                            .update({ is_active: false, resolved_by: `diplomatic_match:${actionKey}`, resolved_tick: currentTick })
                            .eq('issue_id', issue.id)
                            .eq('modifier_key', modKey)
                            .eq('is_active', true);
                        if (!removeErr) {
                            await insertHistory(supabase, issue.id, currentTick, 'modifier_removed',
                                `${MODIFIERS[modKey]?.name || modKey} resolved by ${dipAction.name}.`,
                                { modifier_key: modKey, action_key: actionKey });
                        }
                    }

                    // Remove diplomatic_friction on any successful match
                    const { error: frictionRemoveErr } = await supabase
                        .from('bilateral_issue_modifiers')
                        .update({ is_active: false, resolved_by: `diplomatic_match:${actionKey}`, resolved_tick: currentTick })
                        .eq('issue_id', issue.id)
                        .eq('modifier_key', 'diplomatic_friction')
                        .eq('is_active', true);
                    if (frictionRemoveErr) console.error('[Issues] Failed to remove diplomatic_friction:', frictionRemoveErr.message);

                    // Remove escalation modifiers on diplomatic success
                    for (const escMod of ['active_vessel_expulsion', 'fishing_ban_in_effect']) {
                        const { error: escRemoveErr } = await supabase
                            .from('bilateral_issue_modifiers')
                            .update({ is_active: false, resolved_by: `diplomatic_match:${actionKey}`, resolved_tick: currentTick })
                            .eq('issue_id', issue.id)
                            .eq('modifier_key', escMod)
                            .eq('is_active', true);
                        if (escRemoveErr) console.error(`[Issues] Failed to remove ${escMod}:`, escRemoveErr.message);
                    }

                    // Special: arbitration
                    if (dipAction.special === 'arbitration') {
                        await supabase.from('bilateral_issue_history').insert({
                            issue_id: issue.id,
                            tick: currentTick,
                            event_type: 'action_accepted',
                            event_text: `International arbitration agreed upon. Ruling expected in 8 ticks (Tick ${currentTick + 8}).`,
                            metadata: { arbitration_resolve_tick: currentTick + 8 },
                        });
                    }

                    // Mark both as matched
                    for (const sa of [fromA, fromB]) {
                        const { error: matchErr } = await supabase.from('bilateral_issue_actions_taken').update({
                            status: 'matched',
                            response_tick: currentTick,
                            effects_applied: {
                                tension_delta: dipAction.tension_delta,
                                modifiers_removed: dipAction.modifiers_removed,
                                matched_with: sa === fromA ? fromB.id : fromA.id,
                            },
                        }).eq('id', sa.id);
                        if (matchErr) console.error('[Issues] Failed to mark action as matched:', matchErr.message);
                    }

                    await insertHistory(supabase, issue.id, currentTick, 'diplomatic_matched',
                        `Both nations agreed on ${dipAction.name}. Effects applied.`,
                        { action_key: actionKey, tension_delta: dipAction.tension_delta,
                          modifiers_removed: dipAction.modifiers_removed });

                    // Fire event_log for both nations so match appears in World Events
                    const matchHeadline = `${nationA.name} and ${nationB.name} reach diplomatic agreement in bilateral dispute: ${dipAction.name}.`;
                    try {
                        await supabase.from('event_log').insert([
                            { nation_id: issue.nation_a_id, event_name: dipAction.name, category: 'Conflict', description_chosen: matchHeadline, fired_at_tick: currentTick },
                            { nation_id: issue.nation_b_id, event_name: dipAction.name, category: 'Conflict', description_chosen: matchHeadline, fired_at_tick: currentTick },
                        ]);
                    } catch (e) { console.warn('[Issues] Diplomatic match event dispatch failed:', e.message); }
                }
            }

            // ── EXPIRED (3-tick window): gaffe penalty + counter-play check ──
            // Only process submissions whose window has expired (submitted 3+ ticks ago)

            // Pre-fetch all executed (unilateral/threatening) actions for this issue
            // to check counter-play without per-gaffe queries (avoids N+1).
            const earliestSubmission = submittedDipActions.reduce(
                (min, sa) => Math.min(min, sa.submitted_tick), currentTick);
            const { data: executedActions, error: execErr } = await supabase
                .from('bilateral_issue_actions_taken')
                .select('acting_nation_id, acting_faction_id, action_key, action_category, submitted_tick')
                .eq('issue_id', issue.id)
                .eq('status', 'executed')
                .in('action_category', ['unilateral', 'threatening'])
                .gte('submitted_tick', earliestSubmission);
            if (execErr) console.error('[Issues] Failed to fetch executed actions for counter-play:', execErr.message);

            for (const sa of submittedDipActions) {
                if (matchedIds.has(sa.id)) continue;

                // Only expire if the 3-tick window has passed
                const ticksElapsed = currentTick - sa.submitted_tick;
                if (ticksElapsed < DIPLOMATIC_WINDOW) continue; // still within window

                // This nation's diplomatic action expired without a match
                const gaffeNationId = sa.acting_nation_id;
                const gaffeNation = gaffeNationId === issue.nation_a_id ? nationA : nationB;

                // -3 gov_approval penalty
                if (gaffeNation) {
                    await applyIssueStatEffects(supabase, gaffeNationId, gaffeNation,
                        [{ stat_key: 'gov_approval', delta: -3 }]);
                }

                // +1 tension
                newTension = Math.max(0, Math.min(10, newTension + 1));

                // ── COUNTER-PLAY BONUS ──
                // Check if the opponent used a unilateral or threatening action during
                // the 3-tick window while this nation's diplomatic action was pending.
                const opponentNationId = gaffeNationId === issue.nation_a_id ? issue.nation_b_id : issue.nation_a_id;
                const opponentAction = (executedActions || []).find(a =>
                    a.acting_nation_id === opponentNationId &&
                    a.submitted_tick >= sa.submitted_tick &&
                    a.submitted_tick < sa.submitted_tick + DIPLOMATIC_WINDOW
                );
                let counterPlayApplied = false;

                if (opponentAction) {
                    counterPlayApplied = true;
                    const opponentNation = opponentNationId === issue.nation_a_id ? nationA : nationB;

                    // +3 gov_approval for the opponent
                    if (opponentNation) {
                        await applyIssueStatEffects(supabase, opponentNationId, opponentNation,
                            [{ stat_key: 'gov_approval', delta: 3 }]);
                    }

                    // +3 momentum for the party of the minister who used the action
                    const oppActionDef = ACTIONS[opponentAction.action_key];
                    const ministryKey = oppActionDef ? ROLE_TO_MINISTRY[oppActionDef.role] : null;
                    if (ministryKey) {
                        const { data: ministry } = await supabase
                            .from('ministries')
                            .select('party_id')
                            .eq('nation_id', opponentNationId)
                            .eq('ministry_key', ministryKey)
                            .eq('is_active', true)
                            .maybeSingle();
                        if (ministry?.party_id) {
                            await supabase.rpc('adjust_momentum', {
                                p_faction_id: ministry.party_id,
                                p_delta: 3,
                                p_label: `Counter-play: ${oppActionDef.name} exploited opponent diplomacy`,
                                p_tick: currentTick,
                            });
                        }
                    }

                    const oppActionName = oppActionDef?.name || opponentAction.action_key;
                    await insertHistory(supabase, issue.id, currentTick, 'counter_play',
                        `Counter-Play: ${oppActionName} exploited diplomatic overture. Gov Approval +3, Party Momentum +3.`,
                        { action_key: opponentAction.action_key, acting_nation_id: opponentNationId,
                          counter_play: true, gov_approval_bonus: 3, momentum_bonus: 3,
                          exploited_action: sa.action_key },
                        opponentNationId);

                    // Fire event_log so counter-play appears in World Events
                    const oppNation = opponentNationId === issue.nation_a_id ? nationA : nationB;
                    const gaffeNationObj = gaffeNationId === issue.nation_a_id ? nationA : nationB;
                    const counterHeadline = `${oppNation.name} exploits failed diplomacy by ${gaffeNationObj.name} in bilateral dispute: ${oppActionName}.`;
                    try {
                        await supabase.from('event_log').insert([
                            { nation_id: opponentNationId, event_name: 'Diplomatic Counter-Play', category: 'Conflict', description_chosen: counterHeadline, fired_at_tick: currentTick },
                            { nation_id: gaffeNationId, event_name: 'Diplomatic Counter-Play', category: 'Conflict', description_chosen: counterHeadline, fired_at_tick: currentTick },
                        ]);
                    } catch (e) { console.warn('[Issues] Counter-play event dispatch failed:', e.message); }
                }

                // Mark as gaffe
                const gaffeEffects = {
                    gaffe: true,
                    gov_approval_penalty: -3,
                    tension_delta: 1,
                    window_ticks: DIPLOMATIC_WINDOW,
                    reason: counterPlayApplied
                        ? 'Opponent exploited your diplomatic overture with a forceful action.'
                        : `No matching diplomatic action within ${DIPLOMATIC_WINDOW} ticks.`,
                };
                if (counterPlayApplied) {
                    gaffeEffects.counter_play_opponent = opponentNationId;
                }

                const { error: gaffeErr } = await supabase.from('bilateral_issue_actions_taken').update({
                    status: 'gaffe',
                    response_tick: currentTick,
                    effects_applied: gaffeEffects,
                }).eq('id', sa.id);
                if (gaffeErr) console.error('[Issues] Failed to mark action as gaffe:', gaffeErr.message);

                const dipAction = ACTIONS[sa.action_key];
                const gaffeText = counterPlayApplied
                    ? `Political Gaffe: ${dipAction?.name || sa.action_key} — opponent exploited your diplomacy! Gov Approval -3, Tension +1.`
                    : `Political Gaffe: ${dipAction?.name || sa.action_key} — unmatched after ${DIPLOMATIC_WINDOW} ticks. Gov Approval -3, Tension +1.`;
                await insertHistory(supabase, issue.id, currentTick, 'diplomatic_gaffe',
                    gaffeText,
                    { action_key: sa.action_key, acting_nation_id: gaffeNationId,
                      gov_approval_penalty: -3, tension_delta: 1, counter_play: counterPlayApplied },
                    gaffeNationId);
            }
        }

        // ── 5. Increment idle tick counter ──
        const newIdleTicks = hadDiplomaticMatch ? 0 : issue.ticks_without_diplomatic_action + 1;
        const tensionChanged = newTension !== Number(issue.tension);

        // ── 6. Check resolution status ──
        // Reload modifiers after expirations/spawns
        const { data: currentMods } = await supabase
            .from('bilateral_issue_modifiers')
            .select('modifier_key, category, is_active')
            .eq('issue_id', issue.id);

        const activeStructural = (currentMods || []).filter(
            m => m.is_active && m.category === 'structural'
        );
        const totalStructural = (currentMods || []).filter(m => m.category === 'structural');
        const resolvedStructural = totalStructural.length - activeStructural.length;

        let newStatus = issue.status;
        if (activeStructural.length === 0 && totalStructural.length > 0) {
            newStatus = 'resolved';
        } else if (resolvedStructural >= 3 && activeStructural.length > 0) {
            newStatus = 'partial';
        }

        // ── 7. Check tension 10 → escalation to incident ──
        if (newTension >= 10 && issue.status !== 'escalated') {
            newStatus = 'escalated';
            const leverage = favorToLeverage(issue.favor);

            // Spawn the actual incident via the existing incident system
            const incidentResult = await spawnIncidentFromIssue(
                supabase, issue, nationA, nationB, leverage, currentTick
            );

            results.escalations.push({
                issue_id: issue.id,
                issue_type: issue.issue_type,
                incident_id: incidentResult?.incidentId || null,
                nation_a_id: issue.nation_a_id,
                nation_b_id: issue.nation_b_id,
                favor: issue.favor,
                starting_leverage: leverage,
            });

            await insertHistory(supabase, issue.id, currentTick, 'escalated',
                'This issue has escalated to an incident.',
                { tension: newTension, favor: issue.favor, leverage,
                  incident_id: incidentResult?.incidentId });

            // ── ESCALATION FAVOR BONUS/PENALTY ──
            // Favored nation: +7 gov_approval, +6 momentum to all government parties
            // Disfavored nation: -7 gov_approval, -10 momentum to all government parties
            // Neutral (favor === 0): no bonus/penalty
            const currentFavor = Number(issue.favor) || 0;
            if (currentFavor !== 0) {
                const favoredNationId = currentFavor > 0 ? issue.nation_b_id : issue.nation_a_id;
                const disfavoredNationId = currentFavor > 0 ? issue.nation_a_id : issue.nation_b_id;
                const favoredNation = favoredNationId === issue.nation_a_id ? nationA : nationB;
                const disfavoredNation = disfavoredNationId === issue.nation_a_id ? nationA : nationB;

                // +7 gov_approval for favored nation
                if (favoredNation) {
                    await applyIssueStatEffects(supabase, favoredNationId, favoredNation,
                        [{ stat_key: 'gov_approval', delta: 7 }]);
                }
                // -7 gov_approval for disfavored nation
                if (disfavoredNation) {
                    await applyIssueStatEffects(supabase, disfavoredNationId, disfavoredNation,
                        [{ stat_key: 'gov_approval', delta: -7 }]);
                }

                // Momentum: +4 for favored government parties, -6 for disfavored
                for (const [nId, delta] of [[favoredNationId, 4], [disfavoredNationId, -6]]) {
                    const { data: govMinistries } = await supabase
                        .from('ministries')
                        .select('party_id')
                        .eq('nation_id', nId)
                        .eq('is_active', true)
                        .not('party_id', 'is', null);
                    if (govMinistries) {
                        const uniquePartyIds = [...new Set(govMinistries.map(m => m.party_id))];
                        for (const partyId of uniquePartyIds) {
                            await supabase.rpc('adjust_momentum', {
                                p_faction_id: partyId,
                                p_delta: delta,
                                p_label: delta > 0
                                    ? 'Issue escalated in our favor'
                                    : 'Issue escalated against us',
                                p_tick: currentTick,
                            });
                        }
                    }
                }

                const favoredName = favoredNation?.name || 'Unknown';
                const disfavoredName = disfavoredNation?.name || 'Unknown';
                await insertHistory(supabase, issue.id, currentTick, 'escalation_favor',
                    `Escalation Favor: ${favoredName} benefits (+7 Gov Approval, +4 Momentum). ${disfavoredName} penalized (-7 Gov Approval, -6 Momentum).`,
                    { favored_nation_id: favoredNationId, disfavored_nation_id: disfavoredNationId,
                      favor: currentFavor, gov_approval_favored: 7, gov_approval_disfavored: -7,
                      momentum_favored: 4, momentum_disfavored: -6 });
            }
        }

        // Log tension changes
        if (tensionChanged && newStatus !== 'escalated') {
            const oldLabel = getTensionLabel(issue.tension).label;
            const newLabel = getTensionLabel(newTension).label;
            if (oldLabel !== newLabel) {
                await insertHistory(supabase, issue.id, currentTick, 'tension_changed',
                    `Tension shifted from ${oldLabel} to ${newLabel}.`,
                    { tension_before: issue.tension, tension_after: newTension });
            }
        }

        // Update issue record
        const issueUpdate = {
            ticks_without_diplomatic_action: newIdleTicks,
            tension: newTension,
            updated_at: new Date().toISOString(),
        };
        if (newStatus !== issue.status) {
            issueUpdate.status = newStatus;
            if (newStatus === 'resolved') issueUpdate.resolved_tick = currentTick;
            if (newStatus === 'escalated') issueUpdate.escalated_tick = currentTick;

            // Deactivate all remaining active modifiers when issue resolves or escalates
            if (newStatus === 'resolved' || newStatus === 'escalated') {
                await supabase.from('bilateral_issue_modifiers')
                    .update({ is_active: false, resolved_by: `issue_${newStatus}`, resolved_tick: currentTick })
                    .eq('issue_id', issue.id)
                    .eq('is_active', true);
            }

            if (newStatus !== 'escalated') {
                await insertHistory(supabase, issue.id, currentTick, 'status_changed',
                    `Issue status changed to ${newStatus}.`,
                    { old_status: issue.status, new_status: newStatus });
            }
        }
        await supabase.from('bilateral_issues').update(issueUpdate).eq('id', issue.id);
    }

    return results;
}


// ==================== AUTO-SPAWN LOGIC ====================

/**
 * Check conditions for auto-spawning competitive modifiers.
 */
async function checkAutoSpawns(supabase, issue, activeKeys, modifiers, nationA, nationB, currentTick, results) {
    // Dispatch to issue-type-specific auto-spawn logic
    if (issue.issue_type === 'territorial_ownership') {
        return checkTerritorialAutoSpawns(supabase, issue, activeKeys, modifiers, nationA, nationB, currentTick, results);
    }
    if (issue.issue_type === 'chronic_trade_imbalance') {
        return checkTradeImbalanceAutoSpawns(supabase, issue, activeKeys, modifiers, nationA, nationB, currentTick, results);
    }

    // ── Maritime Fishing Rights auto-spawns ──

    // #6 Overfishing — 10 ticks with no diplomatic action
    if (!activeKeys.has('overfishing') && !wasResolved(modifiers, 'overfishing')) {
        if (issue.ticks_without_diplomatic_action >= 10) {
            await spawnModifier(supabase, issue, 'overfishing', 'both', currentTick,
                'auto:10_idle_ticks', results);
        }
    }

    // #7 Fish Stock Depletion — overfishing active 10+ ticks
    if (!activeKeys.has('fish_stock_depletion') && !wasResolved(modifiers, 'fish_stock_depletion')) {
        if (activeKeys.has('overfishing')) {
            const overfishMod = modifiers.find(m => m.modifier_key === 'overfishing' && m.is_active);
            if (overfishMod) {
                const ticksActive = currentTick - overfishMod.created_tick;
                if (ticksActive >= 10) {
                    await spawnModifier(supabase, issue, 'fish_stock_depletion', 'both', currentTick,
                        'auto:overfishing_10_ticks', results);
                }
            }
        }
    }

    // #10 Coastal Community Decline — favor ±3 against a nation
    if (!activeKeys.has('coastal_community_decline') && !wasResolved(modifiers, 'coastal_community_decline')) {
        if (Math.abs(issue.favor) >= 3) {
            await spawnModifier(supabase, issue, 'coastal_community_decline', 'disfavored', currentTick,
                'auto:favor_threshold_3', results);
        }
    }

    // #13 International Attention — tension reaches High
    if (!activeKeys.has('international_attention') && !wasResolved(modifiers, 'international_attention')) {
        if (issue.tension >= 6) {
            // Determine which nation is more aggressive (more threatening actions taken)
            const { data: threatA } = await supabase
                .from('bilateral_issue_actions_taken')
                .select('id')
                .eq('issue_id', issue.id)
                .eq('acting_nation_id', issue.nation_a_id)
                .eq('action_category', 'threatening');
            const { data: threatB } = await supabase
                .from('bilateral_issue_actions_taken')
                .select('id')
                .eq('issue_id', issue.id)
                .eq('acting_nation_id', issue.nation_b_id)
                .eq('action_category', 'threatening');

            const countA = threatA?.length || 0;
            const countB = threatB?.length || 0;
            const aggressorSide = countA >= countB ? 'nation_a' : 'nation_b';
            await spawnModifier(supabase, issue, 'international_attention', aggressorSide, currentTick,
                'auto:tension_high', results);
        }
    }

    // #15 Environmental Damage — overfishing AND fish_stock_depletion both active
    if (!activeKeys.has('environmental_damage') && !wasResolved(modifiers, 'environmental_damage')) {
        if (activeKeys.has('overfishing') && activeKeys.has('fish_stock_depletion')) {
            await spawnModifier(supabase, issue, 'environmental_damage', 'both', currentTick,
                'auto:dual_overfishing_depletion', results);
        }
    }

    // #8 Foreign Vessels — natural escalation at tension High (if not already present from action)
    if (!activeKeys.has('foreign_vessels_in_waters') && !wasResolved(modifiers, 'foreign_vessels_in_waters')) {
        if (issue.tension >= 6) {
            // Favor determines who is pushing — the favored nation's vessels are in the disfavored's waters
            const appliesTo = getDisfavoredSide(issue.favor);
            if (appliesTo) {
                await spawnModifier(supabase, issue, 'foreign_vessels_in_waters', appliesTo, currentTick,
                    'auto:tension_high', results);
            }
        }
    }

    // Remove #13 International Attention if tension drops to Moderate or below
    if (activeKeys.has('international_attention') && issue.tension <= 5) {
        const mod = modifiers.find(m => m.modifier_key === 'international_attention' && m.is_active);
        if (mod) {
            await supabase
                .from('bilateral_issue_modifiers')
                .update({ is_active: false, resolved_by: 'auto:tension_dropped', resolved_tick: currentTick })
                .eq('id', mod.id);
            mod.is_active = false; // sync in-memory so tension drift uses accurate state
            results.modifiersExpired.push({ issue_id: issue.id, modifier_key: 'international_attention' });
            await insertHistory(supabase, issue.id, currentTick, 'modifier_removed',
                'International attention has subsided as tensions eased.',
                { modifier_key: 'international_attention', reason: 'tension_dropped' });
        }
    }

    // Remove #10 Coastal Community Decline if favor returns to ±1 or below
    if (activeKeys.has('coastal_community_decline') && Math.abs(issue.favor) <= 1) {
        const mod = modifiers.find(m => m.modifier_key === 'coastal_community_decline' && m.is_active);
        if (mod) {
            await supabase
                .from('bilateral_issue_modifiers')
                .update({ is_active: false, resolved_by: 'auto:favor_normalized', resolved_tick: currentTick })
                .eq('id', mod.id);
            mod.is_active = false; // sync in-memory so tension drift uses accurate state
            results.modifiersExpired.push({ issue_id: issue.id, modifier_key: 'coastal_community_decline' });
            await insertHistory(supabase, issue.id, currentTick, 'modifier_removed',
                'Coastal community decline has eased as the dispute became more balanced.',
                { modifier_key: 'coastal_community_decline', reason: 'favor_normalized' });
        }
    }

    // Remove #20 Public Hostility if tension drops below High
    if (activeKeys.has('public_hostility') && issue.tension < 6) {
        const mod = modifiers.find(m => m.modifier_key === 'public_hostility' && m.is_active);
        if (mod) {
            await supabase
                .from('bilateral_issue_modifiers')
                .update({ is_active: false, resolved_by: 'auto:tension_dropped', resolved_tick: currentTick })
                .eq('id', mod.id);
            mod.is_active = false; // sync in-memory so tension drift uses accurate state
            results.modifiersExpired.push({ issue_id: issue.id, modifier_key: 'public_hostility' });
            await insertHistory(supabase, issue.id, currentTick, 'modifier_removed',
                'Public hostility has cooled as tensions decreased.',
                { modifier_key: 'public_hostility', reason: 'tension_dropped' });
        }
    }
}

/**
 * Territorial Ownership Dispute — auto-spawn competitive modifiers and auto-removals.
 */
async function checkTerritorialAutoSpawns(supabase, issue, activeKeys, modifiers, nationA, nationB, currentTick, results) {

    // #9 Diaspora Mobilization — favor reaches ±3 against non-administering
    if (!activeKeys.has('diaspora_mobilization') && !wasResolved(modifiers, 'diaspora_mobilization')) {
        if (Math.abs(issue.favor) >= 3) {
            await spawnModifier(supabase, issue, 'diaspora_mobilization', 'non_administering', currentTick,
                'auto:favor_threshold_3', results);
        }
    }

    // #10 International Legal Precedent — commission_legal_claim used + higher int'l rep
    // (spawned by action, but auto-spawns if submit_to_international_court is pending)
    if (!activeKeys.has('international_legal_precedent') && !wasResolved(modifiers, 'international_legal_precedent')) {
        const { data: courtPending, error: courtErr } = await supabase
            .from('bilateral_issue_actions_taken')
            .select('id')
            .eq('issue_id', issue.id)
            .eq('action_key', 'submit_to_international_court')
            .eq('status', 'submitted')
            .limit(1);
        if (courtErr) console.error('[Issues] Court pending query failed:', courtErr.message);
        if (courtPending && courtPending.length > 0) {
            // Determine legally weaker nation by international_reputation
            const repA = Number(nationA.international_reputation ?? 50);
            const repB = Number(nationB.international_reputation ?? 50);
            const weakerSide = repA < repB ? 'nation_a' : repA > repB ? 'nation_b' : null;
            if (weakerSide) {
                await spawnModifier(supabase, issue, 'international_legal_precedent', weakerSide, currentTick,
                    'auto:court_submission_pending', results);
            }
        }
    }

    // #12 Territory as Election Issue — election within 6 ticks
    if (!activeKeys.has('territory_election_issue') && !wasResolved(modifiers, 'territory_election_issue')) {
        const { data: upcomingElections } = await supabase
            .from('elections')
            .select('id')
            .in('nation_id', [issue.nation_a_id, issue.nation_b_id])
            .eq('status', 'scheduled')
            .lte('election_tick', currentTick + 6)
            .gte('election_tick', currentTick)
            .limit(1);
        if (upcomingElections && upcomingElections.length > 0) {
            await spawnModifier(supabase, issue, 'territory_election_issue', 'both', currentTick,
                'auto:election_within_6_ticks', results);
        }
    }

    // #7 Competing Development Projects — both nations used build/establish/economic_development
    if (!activeKeys.has('competing_development_projects') && !wasResolved(modifiers, 'competing_development_projects')) {
        const buildActions = ['build_infrastructure_territory', 'economic_development_program', 'establish_administrative_presence'];
        const { data: aBuild } = await supabase
            .from('bilateral_issue_actions_taken')
            .select('id')
            .eq('issue_id', issue.id)
            .eq('acting_nation_id', issue.nation_a_id)
            .in('action_key', buildActions)
            .eq('status', 'executed')
            .limit(1);
        const { data: bBuild } = await supabase
            .from('bilateral_issue_actions_taken')
            .select('id')
            .eq('issue_id', issue.id)
            .eq('acting_nation_id', issue.nation_b_id)
            .in('action_key', buildActions)
            .eq('status', 'executed')
            .limit(1);
        if (aBuild?.length > 0 && bBuild?.length > 0) {
            await spawnModifier(supabase, issue, 'competing_development_projects', 'both', currentTick,
                'auto:both_nations_invested', results);
        }
    }

    // #11 Cultural Erasure Accusations — administering used maps + settlers + expel/transfer
    if (!activeKeys.has('cultural_erasure_accusations') && !wasResolved(modifiers, 'cultural_erasure_accusations')) {
        const adminId = issue.administering_nation_id;
        if (adminId) {
            const erasureActions = ['name_territory_on_maps', 'settle_citizens_territory'];
            const escalationActions = ['expel_other_nations_citizens', 'forced_population_transfer_action'];
            const { data: adminActions } = await supabase
                .from('bilateral_issue_actions_taken')
                .select('action_key')
                .eq('issue_id', issue.id)
                .eq('acting_nation_id', adminId)
                .eq('status', 'executed');
            const usedKeys = new Set((adminActions || []).map(a => a.action_key));
            const hasAll = erasureActions.every(k => usedKeys.has(k)) &&
                           escalationActions.some(k => usedKeys.has(k));
            if (hasAll) {
                await spawnModifier(supabase, issue, 'cultural_erasure_accusations', 'administering', currentTick,
                    'auto:cultural_erasure_combo', results);
            }
        }
    }

    // #20 Nationalist Territorial Movement — tension Critical, or sovereignty_declared 5+ ticks
    if (!activeKeys.has('nationalist_territorial_movement') && !wasResolved(modifiers, 'nationalist_territorial_movement')) {
        let shouldSpawn = false;
        if (issue.tension >= 9) {
            shouldSpawn = true;
        } else if (activeKeys.has('sovereignty_declared')) {
            const sovMod = modifiers.find(m => m.modifier_key === 'sovereignty_declared' && m.is_active);
            if (sovMod && (currentTick - sovMod.created_tick) >= 5) {
                shouldSpawn = true;
            }
        } else if (activeKeys.has('forced_population_transfer')) {
            shouldSpawn = true;
        }
        if (shouldSpawn) {
            await spawnModifier(supabase, issue, 'nationalist_territorial_movement', 'both', currentTick,
                'auto:escalation_conditions', results);
        }
    }

    // ── Auto-REMOVALS ──

    // #9 Diaspora Mobilization removed when favor returns to ±1 or below
    if (activeKeys.has('diaspora_mobilization') && Math.abs(issue.favor) <= 1) {
        const mod = modifiers.find(m => m.modifier_key === 'diaspora_mobilization' && m.is_active);
        if (mod) {
            await supabase.from('bilateral_issue_modifiers')
                .update({ is_active: false, resolved_by: 'auto:favor_normalized', resolved_tick: currentTick })
                .eq('id', mod.id);
            mod.is_active = false;
            results.modifiersExpired.push({ issue_id: issue.id, modifier_key: 'diaspora_mobilization' });
            await insertHistory(supabase, issue.id, currentTick, 'modifier_removed',
                'Diaspora mobilization has subsided as the dispute became more balanced.',
                { modifier_key: 'diaspora_mobilization', reason: 'favor_normalized' });
        }
    }

    // #20 Nationalist Territorial Movement removed when tension drops below High
    if (activeKeys.has('nationalist_territorial_movement') && issue.tension < 6) {
        const mod = modifiers.find(m => m.modifier_key === 'nationalist_territorial_movement' && m.is_active);
        if (mod) {
            await supabase.from('bilateral_issue_modifiers')
                .update({ is_active: false, resolved_by: 'auto:tension_dropped', resolved_tick: currentTick })
                .eq('id', mod.id);
            mod.is_active = false;
            results.modifiersExpired.push({ issue_id: issue.id, modifier_key: 'nationalist_territorial_movement' });
            await insertHistory(supabase, issue.id, currentTick, 'modifier_removed',
                'Nationalist territorial movement has subsided as tensions eased.',
                { modifier_key: 'nationalist_territorial_movement', reason: 'tension_dropped' });
        }
    }
}

/**
 * Chronic Trade Imbalance — auto-spawn competitive/escalation modifiers and auto-removals.
 * Mirrors checkTradeImbalanceModifierAutoSpawns in the tick processor.
 */
async function checkTradeImbalanceAutoSpawns(supabase, issue, activeKeys, modifiers, nationA, nationB, currentTick, results) {

    // #6 Factory Closures — #3 active 15+ ticks without diplomatic/unilateral action
    if (!activeKeys.has('factory_closures_deficit') && !wasResolved(modifiers, 'factory_closures_deficit')) {
        if (activeKeys.has('domestic_industries_losing_share')) {
            const mod3 = modifiers.find(m => m.modifier_key === 'domestic_industries_losing_share' && m.is_active);
            if (mod3 && (currentTick - mod3.created_tick) >= 15) {
                const { data: anyAction } = await supabase
                    .from('bilateral_issue_actions_taken').select('id')
                    .eq('issue_id', issue.id).in('action_category', ['diplomatic', 'unilateral'])
                    .in('status', ['executed', 'matched', 'submitted']).limit(1);
                if (!anyAction || anyAction.length === 0) {
                    await spawnModifier(supabase, issue, 'factory_closures_deficit', 'non_administering', currentTick,
                        'auto:industries_losing_share_15t_no_action', results);
                }
            }
        }
    }

    // #8 Protectionist Movement — #6 active 5+ ticks OR tension High
    if (!activeKeys.has('protectionist_movement') && !wasResolved(modifiers, 'protectionist_movement')) {
        let shouldSpawn = false;
        if (activeKeys.has('factory_closures_deficit')) {
            const mod6 = modifiers.find(m => m.modifier_key === 'factory_closures_deficit' && m.is_active);
            if (mod6 && (currentTick - mod6.created_tick) >= 5) shouldSpawn = true;
        }
        if (issue.tension >= 6) shouldSpawn = true;
        if (shouldSpawn) {
            await spawnModifier(supabase, issue, 'protectionist_movement', 'non_administering', currentTick,
                'auto:factory_closures_or_tension_high', results);
        }
    }

    // #9 Dumping Accusations — tension Moderate+ with #3 still active
    if (!activeKeys.has('dumping_accusations') && !wasResolved(modifiers, 'dumping_accusations')) {
        if (issue.tension >= 3 && activeKeys.has('domestic_industries_losing_share')) {
            await spawnModifier(supabase, issue, 'dumping_accusations', 'administering', currentTick,
                'auto:tension_moderate_with_industry_loss', results);
        }
    }

    // #10 Supply Chain Dependency — issue active 15+ ticks with moderate+ tension
    if (!activeKeys.has('supply_chain_dependency') && !wasResolved(modifiers, 'supply_chain_dependency')) {
        const issueAge = currentTick - (issue.created_tick || 0);
        if (issueAge >= 15 && issue.tension >= 5) {
            await spawnModifier(supabase, issue, 'supply_chain_dependency', 'non_administering', currentTick,
                'auto:deep_trade_integration_15t', results);
        }
    }

    // #11 IP Friction — 30% chance every 15 ticks with corporate tax mismatch
    if (!activeKeys.has('intellectual_property_friction') && !wasResolved(modifiers, 'intellectual_property_friction')) {
        const issueAge = currentTick - (issue.created_tick || 0);
        if (issueAge >= 15 && issueAge % 15 === 0 && Math.random() < 0.30) {
            const surplusNation = issue.administering_nation_id === issue.nation_a_id ? nationA : nationB;
            const deficitNation = issue.administering_nation_id === issue.nation_a_id ? nationB : nationA;
            if (Number(surplusNation?.corporate_tax ?? 50) < Number(deficitNation?.corporate_tax ?? 50)) {
                await spawnModifier(supabase, issue, 'intellectual_property_friction', 'both', currentTick,
                    'auto:ip_friction_tax_mismatch', results);
            }
        }
    }

    // #12 Consumer Dependency — 20+ ticks unresolved
    if (!activeKeys.has('consumer_import_dependency') && !wasResolved(modifiers, 'consumer_import_dependency')) {
        if ((currentTick - (issue.created_tick || 0)) >= 20) {
            await spawnModifier(supabase, issue, 'consumer_import_dependency', 'non_administering', currentTick,
                'auto:unresolved_20_ticks', results);
        }
    }

    // #7 Surplus Dependency — issue active 10+ ticks (latent)
    if (!activeKeys.has('surplus_market_dependency') && !wasResolved(modifiers, 'surplus_market_dependency')) {
        if ((currentTick - (issue.created_tick || 0)) >= 10) {
            await spawnModifier(supabase, issue, 'surplus_market_dependency', 'administering', currentTick,
                'auto:trade_dependency_10t', results);
        }
    }

    // #17 Retaliatory Measures — both sides taken threatening actions
    if (!activeKeys.has('retaliatory_measures_trade') && !wasResolved(modifiers, 'retaliatory_measures_trade')) {
        const { data: threatA } = await supabase.from('bilateral_issue_actions_taken').select('id')
            .eq('issue_id', issue.id).eq('acting_nation_id', issue.nation_a_id)
            .eq('action_category', 'threatening').eq('status', 'executed').limit(1);
        const { data: threatB } = await supabase.from('bilateral_issue_actions_taken').select('id')
            .eq('issue_id', issue.id).eq('acting_nation_id', issue.nation_b_id)
            .eq('action_category', 'threatening').eq('status', 'executed').limit(1);
        if (threatA?.length > 0 && threatB?.length > 0) {
            await spawnModifier(supabase, issue, 'retaliatory_measures_trade', 'both', currentTick,
                'auto:both_sides_threatened', results);
        }
    }

    // #18 Credit Downgrade — tension High + any active escalation modifier
    if (!activeKeys.has('credit_downgrade_pressure') && !wasResolved(modifiers, 'credit_downgrade_pressure')) {
        if (issue.tension >= 6) {
            const hasEscalation = (modifiers || []).some(m =>
                m.is_active && m.category === 'escalation' &&
                m.modifier_key !== 'credit_downgrade_pressure' &&
                m.modifier_key !== 'economic_nationalism_trade');
            if (hasEscalation) {
                await spawnModifier(supabase, issue, 'credit_downgrade_pressure', 'non_administering', currentTick,
                    'auto:tension_high_escalation_active', results);
            }
        }
    }

    // #20 Economic Nationalism — tension Critical OR 2+ threatening by same nation
    if (!activeKeys.has('economic_nationalism_trade') && !wasResolved(modifiers, 'economic_nationalism_trade')) {
        let shouldSpawn = false;
        if (issue.tension >= 9) {
            shouldSpawn = true;
        } else {
            for (const nId of [issue.nation_a_id, issue.nation_b_id]) {
                const { data: threats } = await supabase.from('bilateral_issue_actions_taken').select('id')
                    .eq('issue_id', issue.id).eq('acting_nation_id', nId)
                    .eq('action_category', 'threatening').eq('status', 'executed');
                if (threats && threats.length >= 2) { shouldSpawn = true; break; }
            }
        }
        if (shouldSpawn) {
            await spawnModifier(supabase, issue, 'economic_nationalism_trade', 'both', currentTick,
                'auto:tension_critical_or_double_threat', results);
        }
    }

    // ── AUTO-REMOVALS ──

    // #8 Protectionist Movement — removed when tension drops to Low
    if (activeKeys.has('protectionist_movement') && issue.tension <= 2) {
        const mod = modifiers.find(m => m.modifier_key === 'protectionist_movement' && m.is_active);
        if (mod) {
            await supabase.from('bilateral_issue_modifiers')
                .update({ is_active: false, resolved_by: 'auto:tension_low', resolved_tick: currentTick })
                .eq('id', mod.id);
            mod.is_active = false;
            results.modifiersExpired.push({ issue_id: issue.id, modifier_key: 'protectionist_movement' });
            await insertHistory(supabase, issue.id, currentTick, 'modifier_removed',
                'Protectionist political movement has subsided as tensions eased.',
                { modifier_key: 'protectionist_movement', reason: 'tension_low' });
        }
    }

    // #18 Credit Downgrade — removed when tension drops below Moderate
    if (activeKeys.has('credit_downgrade_pressure') && issue.tension < 3) {
        const mod = modifiers.find(m => m.modifier_key === 'credit_downgrade_pressure' && m.is_active);
        if (mod) {
            await supabase.from('bilateral_issue_modifiers')
                .update({ is_active: false, resolved_by: 'auto:tension_dropped', resolved_tick: currentTick })
                .eq('id', mod.id);
            mod.is_active = false;
            results.modifiersExpired.push({ issue_id: issue.id, modifier_key: 'credit_downgrade_pressure' });
            await insertHistory(supabase, issue.id, currentTick, 'modifier_removed',
                'Credit downgrade pressure has eased as trade tensions cooled.',
                { modifier_key: 'credit_downgrade_pressure', reason: 'tension_dropped' });
        }
    }

    // #20 Economic Nationalism — removed when tension drops below High
    if (activeKeys.has('economic_nationalism_trade') && issue.tension < 6) {
        const mod = modifiers.find(m => m.modifier_key === 'economic_nationalism_trade' && m.is_active);
        if (mod) {
            await supabase.from('bilateral_issue_modifiers')
                .update({ is_active: false, resolved_by: 'auto:tension_dropped', resolved_tick: currentTick })
                .eq('id', mod.id);
            mod.is_active = false;
            results.modifiersExpired.push({ issue_id: issue.id, modifier_key: 'economic_nationalism_trade' });
            await insertHistory(supabase, issue.id, currentTick, 'modifier_removed',
                'Economic nationalism surge has subsided as tensions decreased.',
                { modifier_key: 'economic_nationalism_trade', reason: 'tension_dropped' });
        }
    }
}

/**
 * Check if a modifier was previously resolved (prevent re-spawning).
 */
function wasResolved(modifiers, key) {
    return modifiers.some(m => m.modifier_key === key && !m.is_active && m.resolved_by);
}

/**
 * Spawn a new modifier on an issue.
 */
async function spawnModifier(supabase, issue, modifierKey, appliesTo, currentTick, createdBy, results) {
    const config = MODIFIERS[modifierKey];
    if (!config) return;

    const row = {
        issue_id: issue.id,
        modifier_key: modifierKey,
        category: config.category,
        applies_to: appliesTo,
        stat_effects: config.stat_effects,
        duration_remaining: config.duration ?? null,
        is_periodic: config.is_periodic || false,
        periodic_interval: config.periodic_interval ?? null,
        periodic_duration: config.periodic_duration ?? null,
        periodic_next_tick: config.is_periodic ? currentTick : null,
        is_periodic_active: config.is_periodic ? true : false,
        is_active: true,
        created_by: createdBy,
        created_tick: currentTick,
    };

    // For periodic modifiers starting now, set initial active duration
    if (config.is_periodic) {
        row.duration_remaining = config.periodic_duration || 8;
    }

    const { error } = await supabase.from('bilateral_issue_modifiers').insert(row);
    if (error) {
        // Might be duplicate — unique constraint prevents double-spawn
        if (!error.message?.includes('duplicate')) {
            console.error(`[Issues] Failed to spawn modifier ${modifierKey}:`, error);
        }
        return;
    }

    results.modifiersSpawned.push({ issue_id: issue.id, modifier_key: modifierKey });

    await insertHistory(supabase, issue.id, currentTick, 'modifier_added',
        `${config.name} has emerged.`,
        { modifier_key: modifierKey, created_by: createdBy });
}


// ==================== ISSUE → INCIDENT ESCALATION ====================

/**
 * Spawn a fishing_dispute incident when a bilateral issue hits tension 10.
 * Uses the existing incident infrastructure (incident_event_pool, incident_chat_messages, etc.)
 * but sets starting leverage based on the issue's favor position.
 */
async function spawnIncidentFromIssue(supabase, issue, nationA, nationB, leverageFromFavor, currentTick) {
    const issueType = ISSUE_TYPES[issue.issue_type];
    if (!issueType) {
        console.error(`[Issues] Unknown issue type for escalation: ${issue.issue_type}`);
        return null;
    }

    // Select incident type — some issues have weighted alternatives
    let incidentType = issueType.incident_type;
    if (issueType.incident_type_alt && Math.random() < (issueType.incident_type_alt_weight || 0.33)) {
        incidentType = issueType.incident_type_alt;
    }

    // Check caps — same as processIncidentTriggers
    const { count: globalActive } = await supabase
        .from('incidents')
        .select('id', { count: 'exact', head: true })
        .in('status', ['active', 'mediating']);
    if ((globalActive || 0) >= 12) {
        console.log(`[Issues] Incident cap reached, cannot escalate issue ${issue.id}`);
        return null;
    }

    // Check if this pair already has an active incident of this type
    const aId = nationA.id < nationB.id ? nationA.id : nationB.id;
    const bId = nationA.id < nationB.id ? nationB.id : nationA.id;
    const { data: existing } = await supabase
        .from('incidents')
        .select('id')
        .eq('incident_type', incidentType)
        .eq('nation_a_id', aId)
        .eq('nation_b_id', bId)
        .in('status', ['active', 'mediating'])
        .limit(1);
    if (existing && existing.length > 0) {
        console.log(`[Issues] ${incidentType} already active between these nations, skipping`);
        return null;
    }

    // Roll a start event from the pool
    const { data: startEvents } = await supabase
        .from('incident_event_pool')
        .select('*')
        .eq('incident_type', incidentType)
        .eq('category', 'start');

    if (!startEvents || startEvents.length === 0) {
        console.error(`[Issues] No start events found for ${incidentType}`);
        return null;
    }

    const startEvent = startEvents[Math.floor(Math.random() * startEvents.length)];

    // Determine roles — the favored nation is the "enforcer" (aggressor)
    // The disfavored nation is "aggrieved"
    let roleA, roleB;
    if (issue.favor > 0) {
        // favor > 0 means nation_b is favored → nation_b is enforcer
        roleA = 'aggrieved';
        roleB = 'enforcer';
    } else if (issue.favor < 0) {
        roleA = 'enforcer';
        roleB = 'aggrieved';
    } else {
        // Neutral — random assignment
        if (Math.random() < 0.5) {
            roleA = 'aggrieved'; roleB = 'enforcer';
        } else {
            roleA = 'enforcer'; roleB = 'aggrieved';
        }
    }

    // Set starting leverage from favor + start event shifts
    // The favored nation gets the leverage advantage
    let leverageA = (startEvent.leverage_shift_a || 0);
    let leverageB = (startEvent.leverage_shift_b || 0);
    if (issue.favor > 0) {
        leverageB += leverageFromFavor;
    } else if (issue.favor < 0) {
        leverageA += leverageFromFavor;
    }

    const incidentData = {
        incident_type: incidentType,
        status: 'active',
        nation_a_id: issue.nation_a_id,
        nation_b_id: issue.nation_b_id,
        nation_a_role: roleA,
        nation_b_role: roleB,
        nation_a_gov_type: 'democracy',
        nation_b_gov_type: 'democracy',
        leverage_a: Math.max(0, leverageA),
        leverage_b: Math.max(0, leverageB),
        started_tick: currentTick,
    };

    const { data: incident, error: insertErr } = await supabase
        .from('incidents')
        .insert(incidentData)
        .select('id')
        .single();

    if (insertErr || !incident) {
        console.error(`[Issues] Failed to create incident from issue escalation:`, insertErr);
        return null;
    }

    // Link the issue to the spawned incident
    await supabase.from('bilateral_issues').update({
        escalated_to_incident_id: incident.id,
    }).eq('id', issue.id);

    // Insert start event
    const eventText = (startEvent.event_text_template || 'A fishing dispute has erupted.')
        .replace(/\{nation_a\}/g, nationA.name)
        .replace(/\{nation_b\}/g, nationB.name);

    await supabase.from('incident_events').insert({
        incident_id: incident.id,
        tick: currentTick,
        event_type: 'start_event',
        event_key: startEvent.event_key,
        leverage_shift_a: startEvent.leverage_shift_a || 0,
        leverage_shift_b: startEvent.leverage_shift_b || 0,
        event_text: eventText,
        event_source_label: 'Maritime Fishing Rights — Issue Escalation',
        stat_effects: startEvent.stat_effects_template,
        metadata: { escalated_from_issue: issue.id, favor_at_escalation: issue.favor },
        visibility: 'both',
    });

    // Apply immediate stat effects on escalation
    await nudgeIssueRelations(supabase, issue.nation_a_id, issue.nation_b_id, -5);
    await applyIssueStatEffects(supabase, nationA.id, nationA, [{ stat_key: 'civil_unrest', delta: 1 }]);
    await applyIssueStatEffects(supabase, nationB.id, nationB, [{ stat_key: 'international_reputation', delta: -0.5 }]);

    // Insert system chat messages
    const crisisName = `${nationA.name}-${nationB.name} Fishing Dispute`;
    for (const nation of [nationA, nationB]) {
        await supabase.from('incident_chat_messages').insert({
            incident_id: incident.id,
            nation_id: nation.id,
            sender_role: 'system',
            message_text: `-- ${crisisName} opened Tick ${currentTick} (escalated from Maritime Fishing Rights issue) --`,
            tick: currentTick,
            is_system: true,
            chat_context: 'internal',
        });
    }

    // Event log entries
    const logDesc = `${nationA.name} and ${nationB.name}'s maritime fishing rights dispute has escalated to a full incident. Tensions reached critical levels.`;
    for (const nation of [nationA, nationB]) {
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'Fishing Dispute',
            trigger_key: 'issue_escalated_fishing_dispute',
            description_chosen: logDesc,
            category: 'crisis',
            fired_at_tick: currentTick,
        });
    }

    console.log(`[Issues] Escalated issue ${issue.id} to incident ${incident.id}. Leverage: ${incidentData.leverage_a}-${incidentData.leverage_b}. Roles: ${nationA.name}(${roleA}) vs ${nationB.name}(${roleB})`);

    return {
        incidentId: incident.id,
        type: incidentType,
        nationA: nationA.name,
        nationB: nationB.name,
        roleA, roleB,
        leverageA: incidentData.leverage_a,
        leverageB: incidentData.leverage_b,
    };
}


// ==================== HELPERS ====================

/**
 * Resolve 'both', 'nation_a', 'nation_b', 'disfavored', 'favored'
 * to an array of nation objects.
 */
function resolveTargets(appliesTo, issue, nationA, nationB) {
    switch (appliesTo) {
        case 'both': return [nationA, nationB];
        case 'nation_a': return [nationA];
        case 'nation_b': return [nationB];
        case 'disfavored': {
            const side = getDisfavoredSide(issue.favor);
            if (side === 'nation_a') return [nationA];
            if (side === 'nation_b') return [nationB];
            return []; // favor is 0, no disfavored nation
        }
        case 'favored': {
            const side = getDisfavoredSide(issue.favor);
            if (side === 'nation_a') return [nationB]; // A is disfavored, B is favored
            if (side === 'nation_b') return [nationA];
            return [];
        }
        case 'administering': {
            if (!issue.administering_nation_id) return [];
            return [issue.administering_nation_id === issue.nation_a_id ? nationA : nationB];
        }
        case 'non_administering': {
            if (!issue.administering_nation_id) return [];
            return [issue.administering_nation_id === issue.nation_a_id ? nationB : nationA];
        }
        default: return [];
    }
}

/**
 * Insert a history event for an issue.
 */
async function insertHistory(supabase, issueId, tick, eventType, eventText, metadata, causedByNationId) {
    const { error } = await supabase.from('bilateral_issue_history').insert({
        issue_id: issueId,
        tick,
        event_type: eventType,
        event_text: eventText,
        metadata: metadata || null,
        caused_by_nation_id: causedByNationId || null,
    });
    if (error) {
        console.error(`[Issues] Failed to insert history for ${issueId}:`, error);
    }
}


// ==================== ACTIONS SYSTEM ====================

/** Publish an issue action to both nations' event_log feeds (Nation-Local + World). */
async function dispatchIssueEvent(supabase, actingNationId, opponentNationId, action, verb, currentTick) {
    try {
        const [actRes, oppRes] = await Promise.all([
            supabase.from('nations').select('name').eq('id', actingNationId).single(),
            supabase.from('nations').select('name').eq('id', opponentNationId).single(),
        ]);
        const actName = actRes.data?.name || 'A nation';
        const oppName = oppRes.data?.name || 'another nation';
        const headline = `${actName} ${verb} ${oppName} in bilateral dispute: ${action.name}.`;
        const row = { event_name: action.name, category: 'Conflict', description_chosen: headline, fired_at_tick: currentTick };
        await supabase.from('event_log').insert([
            { ...row, nation_id: actingNationId },
            { ...row, nation_id: opponentNationId },
        ]);
    } catch (err) {
        console.warn('[Issues] Event log dispatch failed:', err.message);
    }
}

/**
 * Execute an issue action. Called from the frontend when a player clicks an action.
 *
 * Validates: role, AP, one-per-tick, one-time-use, treasury, diplomatic friction AP penalty.
 * Handles: diplomatic (pending), unilateral (immediate), threatening (immediate + incident rolls).
 *
 * @param {object} supabase - Supabase client
 * @param {object} params - { issueId, actionKey, actingNationId, actingFactionId, currentTick }
 * @returns {object} { success, error?, result? }
 */
export async function executeIssueAction(supabase, params) {
    const { issueId, actionKey, actingNationId, actingFactionId, currentTick } = params;

    const action = ACTIONS[actionKey];
    if (!action) return { success: false, error: 'Unknown action.' };

    // Load issue
    const { data: issue, error: issueErr } = await supabase
        .from('bilateral_issues')
        .select('*')
        .eq('id', issueId)
        .single();
    if (issueErr || !issue) return { success: false, error: 'Issue not found.' };
    if (issue.status === 'escalated' || issue.status === 'resolved' || issue.status === 'dormant') {
        return { success: false, error: `Issue is ${issue.status}. No actions allowed.` };
    }

    // Verify acting nation is part of this issue
    const isNationA = actingNationId === issue.nation_a_id;
    const isNationB = actingNationId === issue.nation_b_id;
    if (!isNationA && !isNationB) {
        return { success: false, error: 'Your nation is not involved in this issue.' };
    }
    const opponentNationId = isNationA ? issue.nation_b_id : issue.nation_a_id;

    // Check one-time-use: has this action already been used by this nation?
    const { data: prevAction } = await supabase
        .from('bilateral_issue_actions_taken')
        .select('id')
        .eq('issue_id', issueId)
        .eq('acting_nation_id', actingNationId)
        .eq('action_key', actionKey)
        .limit(1);
    if (prevAction && prevAction.length > 0) {
        return { success: false, error: 'This action has already been used.' };
    }

    // Check one-per-tick: has this nation taken any action this tick?
    const { data: tickAction } = await supabase
        .from('bilateral_issue_actions_taken')
        .select('id')
        .eq('issue_id', issueId)
        .eq('acting_nation_id', actingNationId)
        .eq('submitted_tick', currentTick)
        .limit(1);
    if (tickAction && tickAction.length > 0) {
        return { success: false, error: 'Only one action per tick per nation.' };
    }

    // Calculate AP cost (check for diplomatic friction / territory election issue — +1 AP on diplomatic actions)
    let apCost = action.ap_cost;
    if (action.category === 'diplomatic') {
        const { data: frictionMod } = await supabase
            .from('bilateral_issue_modifiers')
            .select('id')
            .eq('issue_id', issueId)
            .in('modifier_key', ['diplomatic_friction', 'territory_election_issue'])
            .eq('is_active', true)
            .limit(1);
        if (frictionMod && frictionMod.length > 0) {
            apCost += 1;
        }
    }

    // Check requires_modifier (e.g. resource_extraction requires resource_potential)
    if (action.requires_modifier) {
        const { data: reqMod } = await supabase
            .from('bilateral_issue_modifiers')
            .select('id')
            .eq('issue_id', issueId)
            .eq('modifier_key', action.requires_modifier)
            .eq('is_active', true)
            .limit(1);
        if (!reqMod || reqMod.length === 0) {
            return { success: false, error: `Requires active ${MODIFIERS[action.requires_modifier]?.name || action.requires_modifier} modifier.` };
        }
    }

    // Deduct AP
    if (apCost > 0) {
        const deductResult = await supabase.rpc('deduct_ap', {
            p_faction_id: actingFactionId,
            p_cost: apCost,
        });
        if (deductResult.error || deductResult.data < 0) {
            return { success: false, error: `Insufficient AP (need ${apCost}).` };
        }
    }

    // Deduct treasury cost by adding to national debt
    // Nations don't have a separate treasury pool — costs are financed through borrowing
    if (action.treasury_cost > 0) {
        const { data: nationData } = await supabase
            .from('nations')
            .select('debt')
            .eq('id', actingNationId)
            .single();
        const currentDebt = Number(nationData?.debt ?? 0);
        await supabase.from('nations')
            .update({ debt: currentDebt + action.treasury_cost })
            .eq('id', actingNationId);
    }

    // Build the action record
    const actionRecord = {
        issue_id: issueId,
        acting_nation_id: actingNationId,
        acting_faction_id: actingFactionId,
        action_key: actionKey,
        action_category: action.category,
        submitted_tick: currentTick,
        ap_spent: apCost,
        treasury_cost: action.treasury_cost || 0,
    };

    // ── DIPLOMATIC: submit for simultaneous matching ──
    // Both nations must independently choose the same action on the same tick.
    // The tick processor will match them or penalize unmatched submissions.
    if (action.category === 'diplomatic') {
        actionRecord.status = 'submitted';
        actionRecord.target_nation_id = opponentNationId;

        const { error: insertErr } = await supabase
            .from('bilateral_issue_actions_taken')
            .insert(actionRecord);
        if (insertErr) {
            // Refund AP since the action was not recorded
            if (apCost > 0) {
                await supabase.rpc('deduct_ap', { p_faction_id: actingFactionId, p_cost: -apCost });
            }
            return { success: false, error: 'Failed to submit diplomatic action: ' + insertErr.message };
        }

        await insertHistory(supabase, issueId, currentTick, 'action_submitted',
            `${action.name} submitted. Awaiting matching action from other nation.`,
            { action_key: actionKey, acting_nation_id: actingNationId },
            actingNationId);

        await dispatchIssueEvent(supabase, actingNationId, opponentNationId, action, 'proposes diplomatic resolution with', currentTick);

        return { success: true, result: { type: 'submitted', actionKey, apCost } };
    }

    // ── UNILATERAL / THREATENING: immediate execution ──
    actionRecord.status = 'executed';

    // Apply favor delta
    let newFavor = Number(issue.favor);
    if (action.favor_delta !== 0) {
        // Positive favor_delta pushes favor toward the acting nation
        // If acting is nation_a: favor decreases (nation_a favored = negative)
        // If acting is nation_b: favor increases (nation_b favored = positive)
        const favorShift = isNationA ? -action.favor_delta : action.favor_delta;
        newFavor = Math.max(-5, Math.min(5, newFavor + favorShift));
    }

    // Apply tension delta
    let newTension = Number(issue.tension);
    newTension = Math.max(0, Math.min(10, newTension + action.tension_delta));

    // Apply relation delta (threatening actions)
    if (action.relations_delta) {
        await nudgeIssueRelations(supabase, issue.nation_a_id, issue.nation_b_id, action.relations_delta);
    }

    // Apply stat effects to acting nation
    if (action.stat_effects_acting) {
        const { data: actNation } = await supabase
            .from('nations').select('*').eq('id', actingNationId).single();
        if (actNation) {
            await applyIssueStatEffects(supabase, actingNationId, actNation, action.stat_effects_acting);
        }
    }

    // Apply stat effects to opponent
    if (action.stat_effects_opponent) {
        const { data: oppNation } = await supabase
            .from('nations').select('*').eq('id', opponentNationId).single();
        if (oppNation) {
            await applyIssueStatEffects(supabase, opponentNationId, oppNation, action.stat_effects_opponent);
        }
    }

    // Add modifiers
    for (const modKey of action.modifiers_added) {
        const modConfig = MODIFIERS[modKey];
        if (!modConfig) continue;

        // Determine who the modifier applies to (per-modifier map overrides global target)
        let appliesTo = modConfig.applies_to || 'both';
        const perModTarget = action.modifier_target_map?.[modKey] || action.modifier_target;
        if (perModTarget === 'acting') {
            appliesTo = isNationA ? 'nation_a' : 'nation_b';
        } else if (perModTarget === 'opponent') {
            appliesTo = isNationA ? 'nation_b' : 'nation_a';
        }

        await spawnModifier(supabase, issue, modKey, appliesTo, currentTick,
            `action:${actionKey}`, { modifiersSpawned: [] });
    }

    // Remove modifiers
    for (const modKey of action.modifiers_removed) {
        // For targeted removals (e.g. redirect_fleet only removes if YOU caused it)
        let removeQuery = supabase
            .from('bilateral_issue_modifiers')
            .update({ is_active: false, resolved_by: `action:${actionKey}`, resolved_tick: currentTick })
            .eq('issue_id', issueId)
            .eq('modifier_key', modKey)
            .eq('is_active', true);

        // If modifier_remove_target is 'acting', only remove modifiers that apply to the acting nation
        if (action.modifier_remove_target === 'acting') {
            const actingSide = isNationA ? 'nation_a' : 'nation_b';
            removeQuery = removeQuery.eq('applies_to', actingSide);
        }

        const { error: removeErr } = await removeQuery;
        if (!removeErr) {
            await insertHistory(supabase, issueId, currentTick, 'modifier_removed',
                `${MODIFIERS[modKey]?.name || modKey} resolved by ${action.name}.`,
                { modifier_key: modKey, action_key: actionKey },
                actingNationId);
        }
    }

    // Special: commission_legal_study — favor only if reputation > opponent's
    if (action.special === 'reputation_check') {
        const { data: actNation } = await supabase
            .from('nations').select('international_reputation').eq('id', actingNationId).single();
        const { data: oppNation } = await supabase
            .from('nations').select('international_reputation').eq('id', opponentNationId).single();
        if (actNation && oppNation &&
            Number(actNation.international_reputation ?? 0) > Number(oppNation.international_reputation ?? 0)) {
            const favorShift = isNationA ? -0.5 : 0.5;
            newFavor = Math.max(-5, Math.min(5, newFavor + favorShift));
        }
    }

    // Special: territorial legal claim — +1 if int'l rep > opponent, +0.5 if equal
    if (action.special === 'reputation_check_territorial') {
        const { data: actNation } = await supabase
            .from('nations').select('international_reputation').eq('id', actingNationId).single();
        const { data: oppNation } = await supabase
            .from('nations').select('international_reputation').eq('id', opponentNationId).single();
        const actRep = Number(actNation?.international_reputation ?? 50);
        const oppRep = Number(oppNation?.international_reputation ?? 50);
        if (actRep > oppRep) {
            const favorShift = isNationA ? -1 : 1;
            newFavor = Math.max(-5, Math.min(5, newFavor + favorShift));
        } else if (actRep === oppRep) {
            const favorShift = isNationA ? -0.5 : 0.5;
            newFavor = Math.max(-5, Math.min(5, newFavor + favorShift));
        }
    }

    // Special: incident trigger rolls (threatening actions)
    let incidentTriggered = false;
    if (action.special === 'incident_trigger_60' && Math.random() < 0.60) {
        incidentTriggered = true;
        newTension = 10;
    } else if (action.special === 'incident_trigger_50' && Math.random() < 0.50) {
        incidentTriggered = true;
        newTension = 10; // force escalation
    } else if (action.special === 'incident_trigger_25' && Math.random() < 0.25) {
        incidentTriggered = true;
        newTension = 10;
    }

    // Special: declare_sovereignty — 30% chance of spawning nationalist_territorial_movement
    if (action.special === 'sovereignty_nationalism_30' && Math.random() < 0.30) {
        await spawnModifier(supabase, issue, 'nationalist_territorial_movement', 'both', currentTick,
            `action:${actionKey}:30pct_roll`, { modifiersSpawned: [] });
    }

    // Insert action record
    actionRecord.effects_applied = {
        favor_before: issue.favor, favor_after: newFavor,
        tension_before: issue.tension, tension_after: newTension,
        relations_delta: action.relations_delta || 0,
        modifiers_added: action.modifiers_added,
        modifiers_removed: action.modifiers_removed,
        incident_triggered: incidentTriggered,
    };
    actionRecord.modifiers_added = action.modifiers_added;
    actionRecord.modifiers_removed = action.modifiers_removed;

    const { error: insertErr } = await supabase
        .from('bilateral_issue_actions_taken')
        .insert(actionRecord);
    if (insertErr) {
        // Refund AP and treasury — side effects (modifiers, stats) already applied but not recoverable here
        if (apCost > 0) {
            await supabase.rpc('deduct_ap', { p_faction_id: actingFactionId, p_cost: -apCost });
        }
        if (action.treasury_cost > 0) {
            await supabase.from('nations')
                .update({ treasury: Number(issue.treasury ?? 0) + action.treasury_cost })
                .eq('id', actingNationId);
        }
        return { success: false, error: 'Failed to record action: ' + insertErr.message };
    }

    // Update issue
    const issueUpdate = {
        favor: newFavor,
        tension: newTension,
        updated_at: new Date().toISOString(),
    };
    await supabase.from('bilateral_issues').update(issueUpdate).eq('id', issueId);

    // History
    await insertHistory(supabase, issueId, currentTick, 'action_executed',
        `${action.name} executed.`,
        { action_key: actionKey, category: action.category, favor_delta: action.favor_delta,
          tension_delta: action.tension_delta, incident_triggered: incidentTriggered },
        actingNationId);

    // Tension/favor change history
    if (newFavor !== Number(issue.favor)) {
        await insertHistory(supabase, issueId, currentTick, 'favor_changed',
            `Favor shifted to ${newFavor > 0 ? '+' : ''}${newFavor.toFixed(2)}.`,
            { favor_before: issue.favor, favor_after: newFavor });
    }
    const oldTensionLabel = getTensionLabel(issue.tension).label;
    const newTensionLabel = getTensionLabel(newTension).label;
    if (oldTensionLabel !== newTensionLabel) {
        await insertHistory(supabase, issueId, currentTick, 'tension_changed',
            `Tension shifted from ${oldTensionLabel} to ${newTensionLabel}.`,
            { tension_before: issue.tension, tension_after: newTension });
    }

    const verb = action.category === 'diplomatic' ? 'takes diplomatic action against'
        : action.category === 'threatening' ? 'takes threatening action against'
        : 'takes unilateral action against';
    await dispatchIssueEvent(supabase, actingNationId, opponentNationId, action, verb, currentTick);

    return {
        success: true,
        result: {
            type: 'executed',
            actionKey,
            apCost,
            favorBefore: issue.favor,
            favorAfter: newFavor,
            tensionBefore: issue.tension,
            tensionAfter: newTension,
            incidentTriggered,
        },
    };
}


// respondToProposal removed — diplomatic actions now use simultaneous matching (step 4d in processIssueTick)


/**
 * Process pending arbitration rulings.
 * Called each tick from processIssueTick to check if any arbitration has reached its resolve tick.
 */
export async function processArbitration(supabase, issueId, currentTick) {
    // Check history for arbitration events
    const { data: arbEvents } = await supabase
        .from('bilateral_issue_history')
        .select('metadata')
        .eq('issue_id', issueId)
        .eq('event_type', 'action_accepted')
        .not('metadata', 'is', null);

    if (!arbEvents) return false;

    for (const evt of arbEvents) {
        const resolveTick = evt.metadata?.arbitration_resolve_tick;
        if (resolveTick && currentTick >= resolveTick) {
            // Check if this arbitration was already resolved (idempotent)
            const { data: alreadyDone } = await supabase
                .from('bilateral_issue_history')
                .select('id')
                .eq('issue_id', issueId)
                .eq('event_type', 'action_executed')
                .contains('metadata', { reason: 'arbitration_ruling' })
                .limit(1);

            if (alreadyDone && alreadyDone.length > 0) continue;

            // Find if structural modifiers still exist
            const { data: structMods } = await supabase
                .from('bilateral_issue_modifiers')
                .select('id, modifier_key')
                .eq('issue_id', issueId)
                .eq('category', 'structural')
                .eq('is_active', true);

            if (structMods && structMods.length > 0) {
                // Remove ALL remaining structural modifiers
                for (const mod of structMods) {
                    await supabase
                        .from('bilateral_issue_modifiers')
                        .update({ is_active: false, resolved_by: 'arbitration_ruling', resolved_tick: currentTick })
                        .eq('id', mod.id);

                    await insertHistory(supabase, issueId, currentTick, 'modifier_removed',
                        `${MODIFIERS[mod.modifier_key]?.name || mod.modifier_key} resolved by international arbitration ruling.`,
                        { modifier_key: mod.modifier_key, reason: 'arbitration_ruling' });
                }

                await insertHistory(supabase, issueId, currentTick, 'action_executed',
                    'International arbitration ruling delivered. All structural disputes resolved.',
                    { reason: 'arbitration_ruling', modifiers_resolved: structMods.map(m => m.modifier_key) });

                return true;
            }
        }
    }
    return false;
}


// ==================== EXPORTS ====================

// ==================== TRADE IMBALANCE AUTO-SPAWN ====================
/**
 * Check bilateral trade data for sustained imbalances and auto-spawn
 * chronic_trade_imbalance issues when conditions are met.
 *
 * Called each tick AFTER processTradeFlows has written trade_partners rows.
 *
 * Logic:
 *   1. Query trade_partners for last N ticks (sustained_ticks config)
 *   2. Aggregate bilateral volumes per nation pair per tick
 *   3. If imbalance_pct > threshold for ALL N ticks (same direction), candidate
 *   4. Filter out existing active issues, cooldowns, max-per-nation caps
 *   5. Roll spawn_chance (50%) per candidate
 *   6. Create bilateral_issues row + starter modifiers + history
 */
export async function checkTradeImbalanceAutoSpawn(supabase, nationList, currentTick) {
    var typeDef = ISSUE_TYPES.chronic_trade_imbalance;
    var config = typeDef.auto_spawn_config;
    var threshold = config.imbalance_pct_threshold; // 50
    var sustainedTicks = config.sustained_ticks;     // 5
    var spawnChance = config.spawn_chance;            // 0.5
    var maxPerNation = config.max_per_nation;         // 2
    var cooldown = config.cooldown_after_resolution;  // 60

    if (currentTick < sustainedTicks) return [];
    if (!nationList || nationList.length < 2) return [];

    // ── 1. Query bilateral trade volumes for last N ticks ──
    var startTick = currentTick - sustainedTicks + 1;
    var { data: partnerData, error: partnerErr } = await supabase
        .from('trade_partners')
        .select('tick, exporter_nation_id, importer_nation_id, trade_volume')
        .gte('tick', startTick)
        .lte('tick', currentTick);

    if (partnerErr || !partnerData || partnerData.length === 0) return [];

    // Build nation ID set for validation
    var nationIds = new Set();
    for (var ni = 0; ni < nationList.length; ni++) nationIds.add(nationList[ni].id);

    // ── 2. Aggregate by canonical pair + tick ──
    // pairMap[canonicalKey] = { a, b, ticks: { [tick]: { aToB, bToA } } }
    var pairMap = {};

    for (var i = 0; i < partnerData.length; i++) {
        var row = partnerData[i];
        if (!nationIds.has(row.exporter_nation_id) || !nationIds.has(row.importer_nation_id)) continue;

        var a = row.exporter_nation_id < row.importer_nation_id
            ? row.exporter_nation_id : row.importer_nation_id;
        var b = row.exporter_nation_id < row.importer_nation_id
            ? row.importer_nation_id : row.exporter_nation_id;
        var key = a + '|' + b;

        if (!pairMap[key]) pairMap[key] = { a: a, b: b, ticks: {} };
        if (!pairMap[key].ticks[row.tick]) pairMap[key].ticks[row.tick] = { aToB: 0, bToA: 0 };

        if (row.exporter_nation_id === a) {
            pairMap[key].ticks[row.tick].aToB += Number(row.trade_volume) || 0;
        } else {
            pairMap[key].ticks[row.tick].bToA += Number(row.trade_volume) || 0;
        }
    }

    // ── 3. Find pairs with sustained imbalance (same direction every tick) ──
    var candidates = [];

    for (var key in pairMap) {
        var pair = pairMap[key];
        var sustained = true;
        var surplusIsA = 0;
        var surplusIsB = 0;

        for (var t = startTick; t <= currentTick; t++) {
            var entry = pair.ticks[t];
            if (!entry) { sustained = false; break; }

            var totalVol = entry.aToB + entry.bToA;
            // Minimum volume guard — ignore tiny trades
            if (totalVol < 50000) { sustained = false; break; }

            var imbalancePct = Math.abs(entry.aToB - entry.bToA) / totalVol * 100;
            if (imbalancePct < threshold) { sustained = false; break; }

            if (entry.aToB > entry.bToA) surplusIsA++;
            else surplusIsB++;
        }

        if (!sustained) continue;

        // Surplus direction must be consistent across all ticks
        var surplusNationId;
        if (surplusIsA >= sustainedTicks) {
            surplusNationId = pair.a;
        } else if (surplusIsB >= sustainedTicks) {
            surplusNationId = pair.b;
        } else {
            continue; // direction flip-flopped
        }

        candidates.push({
            nationA: pair.a,
            nationB: pair.b,
            surplusNationId: surplusNationId,
            deficitNationId: surplusNationId === pair.a ? pair.b : pair.a,
        });
    }

    if (candidates.length === 0) return [];

    // ── 4. Filter: existing issues, cooldowns, max-per-nation ──
    var { data: existingIssues, error: existErr } = await supabase
        .from('bilateral_issues')
        .select('nation_a_id, nation_b_id, status, resolved_tick, escalated_tick')
        .eq('issue_type', 'chronic_trade_imbalance');

    if (existErr) {
        console.error('[TradeImbalanceAutoSpawn] Failed to query existing issues:', existErr.message);
        return [];
    }

    var activePerNation = {};
    var activePairs = new Set();
    var cooldownPairs = new Set();

    for (var ei = 0; ei < (existingIssues || []).length; ei++) {
        var ex = existingIssues[ei];
        var pairKey = ex.nation_a_id + '|' + ex.nation_b_id;

        if (ex.status === 'active' || ex.status === 'partial') {
            activePairs.add(pairKey);
            activePerNation[ex.nation_a_id] = (activePerNation[ex.nation_a_id] || 0) + 1;
            activePerNation[ex.nation_b_id] = (activePerNation[ex.nation_b_id] || 0) + 1;
        }

        // Cooldown: resolved or escalated within last N ticks
        var resolvedAt = ex.resolved_tick || ex.escalated_tick;
        if ((ex.status === 'resolved' || ex.status === 'escalated' || ex.status === 'dormant') && resolvedAt) {
            if (currentTick - resolvedAt < cooldown) {
                cooldownPairs.add(pairKey);
            }
        }
    }

    // ── 5. Spawn issues for qualifying candidates ──
    var spawned = [];
    var dummyResults = { modifiersSpawned: [] }; // for spawnModifier callback

    for (var ci = 0; ci < candidates.length; ci++) {
        var cand = candidates[ci];
        var candKey = cand.nationA + '|' + cand.nationB;

        if (activePairs.has(candKey)) continue;
        if (cooldownPairs.has(candKey)) continue;
        if ((activePerNation[cand.nationA] || 0) >= maxPerNation) continue;
        if ((activePerNation[cand.nationB] || 0) >= maxPerNation) continue;

        // Roll spawn chance
        if (Math.random() > spawnChance) continue;

        // Create the bilateral issue
        var { data: issueRow, error: issueErr } = await supabase
            .from('bilateral_issues')
            .insert({
                issue_type: 'chronic_trade_imbalance',
                nation_a_id: cand.nationA,
                nation_b_id: cand.nationB,
                tension: 1,
                favor: 0,
                status: 'active',
                created_tick: currentTick,
                ticks_without_diplomatic_action: 0,
                administering_nation_id: cand.surplusNationId,
            })
            .select('id')
            .single();

        if (issueErr || !issueRow) {
            console.error('[TradeImbalanceAutoSpawn] Failed to create issue:', issueErr?.message);
            continue;
        }

        // Insert starter modifiers (each has own spawn_chance)
        var issueObj = { id: issueRow.id };
        var starterKeys = typeDef.starter_modifiers;
        for (var mi = 0; mi < starterKeys.length; mi++) {
            var modKey = starterKeys[mi];
            var modConfig = MODIFIERS[modKey];
            if (!modConfig) continue;

            // Per-modifier spawn chance (structural starters: 1.0, 0.6, or 0.4)
            if (modConfig.spawn_chance !== undefined && Math.random() > modConfig.spawn_chance) continue;

            await spawnModifier(supabase, issueObj, modKey, modConfig.applies_to || 'both',
                currentTick, 'auto:trade_imbalance_detected', dummyResults);
        }

        // History entry
        await insertHistory(supabase, issueRow.id, currentTick, 'created',
            'Chronic trade imbalance detected. The surplus nation consistently exports far more than it imports from the deficit nation.',
            {
                issue_type: 'chronic_trade_imbalance',
                surplus_nation_id: cand.surplusNationId,
                deficit_nation_id: cand.deficitNationId,
                sustained_ticks: sustainedTicks,
                source: 'auto_trade_engine',
            });

        spawned.push({
            issueId: issueRow.id,
            nationA: cand.nationA,
            nationB: cand.nationB,
            surplusNationId: cand.surplusNationId,
        });

        // Update tracking for subsequent candidates this tick
        activePerNation[cand.nationA] = (activePerNation[cand.nationA] || 0) + 1;
        activePerNation[cand.nationB] = (activePerNation[cand.nationB] || 0) + 1;
        activePairs.add(candKey);

        console.log(`[TradeImbalanceAutoSpawn] Spawned chronic_trade_imbalance: ${cand.nationA.slice(0,8)}↔${cand.nationB.slice(0,8)}, surplus=${cand.surplusNationId.slice(0,8)}`);
    }

    return spawned;
}

export {
    TENSION_LABELS,
    getTensionLabel,
    favorToLeverage,
    MODIFIERS,
    ACTIONS,
    ISSUE_TYPES,
    applyIssueStatEffects,
    nudgeIssueRelations,
    getDisfavoredSide,
    insertHistory,
    resolveTargets,
    spawnModifier,
};
