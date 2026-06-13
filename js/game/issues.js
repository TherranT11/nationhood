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

export function getTensionLabel(tension) {
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

export const MODIFIERS = {

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
            { stat_key: 'unskilled_workers', delta: -0.1 },
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
        stat_effects: [{ stat_key: 'global_image', delta: -0.1 }],
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
        removed_by: ['propose_joint_sovereignty', 'offer_economic_concession'],
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
        stat_effects: [{ stat_key: 'global_image', delta: -0.1 }],
        duration: 15,
        removed_by: [], // expires or court ruling
    },

    cultural_erasure_accusations: {
        key: 'cultural_erasure_accusations',
        name: 'Cultural Erasure Accusations',
        category: 'competitive',
        applies_to: 'administering',
        stat_effects: [
            { stat_key: 'global_image', delta: -0.15 },
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
            { stat_key: 'unskilled_workers', delta: -0.1 },
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
            { stat_key: 'unskilled_workers', delta: -0.2 },
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
        stat_effects: [{ stat_key: 'global_image', delta: -0.1 }],
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

// Phase 0: ACTIONS object and ROLE_TO_MINISTRY removed — replaced by card system in Phase 1.
// ==================== ISSUE TYPE DEFINITIONS ====================

export const ISSUE_TYPES = {
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
        incident_type: 'border_incursion',
        incident_type_alt: null,
        incident_type_alt_weight: 0,
        has_administering_nation: true,
        // Labels for the two issue-specific stat containers (the universal one
        // is Leverage). Read by the conflicts.html issue header.
        stat_labels: { stat1: 'Claim Strength', stat2: 'Dissident Strength' },
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

        // Phase 0: Auto-spawn logic removed — cards drive modifier creation.

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
        if (Math.abs(issue.favor) >= 1) {
            const disfavoredSide = getDisfavoredSide(issue.favor);
            const disfavoredNation = disfavoredSide === 'nation_a' ? nationA : nationB;
            if (disfavoredNation) {
                const approvalDelta = -(Math.abs(issue.favor) * 0.1);
                await applyIssueStatEffects(supabase, disfavoredNation.id, disfavoredNation,
                    [{ stat_key: 'gov_approval', delta: approvalDelta }]);
            }
        }

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

        // ── 8. Check tension 10 → incident escalation (non-territorial) ──
        // Territorial disputes don't spawn a tension incident — with the war
        // terminal removed they resolve through their structural modifiers.
        // Every other issue type still spawns its incident at tension 10.
        if (newTension >= 10 && issue.status !== 'escalated'
            && issue.issue_type !== 'territorial_ownership') {
            const leverage = favorToLeverage(issue.favor);
            const incidentResult = await spawnIncidentFromIssue(
                supabase, issue, nationA, nationB, leverage, currentTick
            );
            const incidentId = incidentResult?.incidentId || null;
            const escalationOk = !!incidentId;

            // Only mark as escalated if the war/incident actually happened.
            if (escalationOk) {
                newStatus = 'escalated';

                results.escalations.push({
                    issue_id: issue.id,
                    issue_type: issue.issue_type,
                    incident_id: incidentId,
                    war: false,
                    nation_a_id: issue.nation_a_id,
                    nation_b_id: issue.nation_b_id,
                    favor: issue.favor,
                    starting_leverage: leverage,
                });

                await insertHistory(supabase, issue.id, currentTick, 'escalated',
                    'This issue has escalated to an incident.',
                    { tension: newTension, favor: issue.favor, leverage,
                      incident_id: incidentId });

            // ── ESCALATION FAVOR BONUS/PENALTY ──
            // Favored nation: +7 gov_approval, +6 momentum to all government parties
            // Disfavored nation: -7 gov_approval, -10 momentum to all government parties
            // Neutral (favor === 0): no bonus/penalty
            const currentFavor = Number(issue.favor) || 0;
            if (incidentId && currentFavor !== 0) {
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
            } else {
                // War/incident not created — keep the issue active at tension 10.
                console.warn(`[Issues] Escalation failed for issue ${issue.id} — keeping issue active`);
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



// Phase 0: Auto-spawn functions removed — cards drive modifier creation in Phase 1.
// checkAutoSpawns, checkTerritorialAutoSpawns, checkTradeImbalanceAutoSpawns removed.

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
        nation_a_gov_type: nationA.government_type || 'democracy',
        nation_b_gov_type: nationB.government_type || 'democracy',
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
    await applyIssueStatEffects(supabase, nationB.id, nationB, [{ stat_key: 'global_image', delta: -0.5 }]);

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



// Phase 0: ACTIONS SYSTEM removed — replaced by card system in Phase 1.
// executeIssueAction, dispatchIssueEvent removed.



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

