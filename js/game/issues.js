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

    await supabase.rpc('nudge_relation_score', {
        p_nation_a_id: aId,
        p_nation_b_id: bId,
        p_delta: delta
    }).then(() => {}, async () => {
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
    });
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


// ==================== EXPORTS ====================

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
};
