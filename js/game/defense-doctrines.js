// ==================== MILITARY DOCTRINE SYSTEM ====================
// Ministry of Defense — Declare Doctrine action data model and constants.

export const DOCTRINE_SECTORS = ['army', 'navy', 'air_force', 'intelligence', 'nuclear'];

export const DOCTRINE_SECTOR_LABELS = {
    army: 'ARMY',
    navy: 'NAVY',
    air_force: 'AIR FORCE',
    intelligence: 'INTELLIGENCE',
    nuclear: 'NUCLEAR'
};

export const DOCTRINE_COHESION_MAX = 200;
export const DOCTRINE_RENOUNCE_COOLDOWN = 120;

// Nuclear is single-select; all other sectors are multi-active.
export const NUCLEAR_SECTOR = 'nuclear';

export const DOCTRINES = {
    // ── ARMY ──
    active_defense: {
        id: 'active_defense',
        sector: 'army',
        name: 'Active Defense',
        desc: 'Forward-positioned defensive posture that intercepts threats before they reach home territory.',
        apCost: 3
    },
    counterinsurgency: {
        id: 'counterinsurgency',
        sector: 'army',
        name: 'Counterinsurgency',
        desc: 'Optimises the army for suppressing internal threats, civil unrest, and irregular forces.',
        apCost: 4
    },
    asymmetric_warfare: {
        id: 'asymmetric_warfare',
        sector: 'army',
        name: 'Asymmetric Warfare',
        desc: 'Unconventional guerrilla tactics designed to counter larger or better-equipped adversaries.',
        apCost: 4
    },
    praetorian_doctrine: {
        id: 'praetorian_doctrine',
        sector: 'army',
        name: 'Praetorian Doctrine',
        desc: 'Maintains elite units personally loyal to the head of government, insulating the regime against coups and internal military dissent.',
        apCost: 0,
        permanent: true,
        autocracyOnly: true,
        hidden: true // not visible to other nations; fires no events
    },
    combined_battle: {
        id: 'combined_battle',
        sector: 'army',
        name: 'Combined Battle',
        desc: 'Integrated multi-domain warfare with army units operating jointly across air and naval assets.',
        apCost: 6
    },
    joint_command_operations: {
        id: 'joint_command_operations',
        sector: 'army',
        name: 'Joint Command Operations',
        desc: 'Centralised command architecture across all branches enabling coordinated rapid response.',
        apCost: 8
    },

    // ── NAVY ──
    near_seas_defense: {
        id: 'near_seas_defense',
        sector: 'navy',
        name: 'Near Seas Defense',
        desc: 'Prioritises control of coastal waters and adjacent seas close to national territory.',
        apCost: 3
    },
    trade_interdiction: {
        id: 'trade_interdiction',
        sector: 'navy',
        name: 'Trade Interdiction',
        desc: 'Aggressively controls sea lanes to protect friendly commerce and disrupt rival shipping.',
        apCost: 5
    },
    submarine_deterrent: {
        id: 'submarine_deterrent',
        sector: 'navy',
        name: 'Submarine Deterrent',
        desc: 'Maintains a hidden undersea strike capability whose location is never publicly confirmed.',
        apCost: 6
    },
    autonomous_power_projection: {
        id: 'autonomous_power_projection',
        sector: 'navy',
        name: 'Autonomous Power Projection',
        desc: 'Independent deep-water strike capability allowing the nation to project force globally without allied support.',
        apCost: 6
    },
    blue_water_fleet: {
        id: 'blue_water_fleet',
        sector: 'navy',
        name: 'Blue Water Fleet',
        desc: 'Maintains a large capable open-ocean surface fleet able to sustain operations across international waters.',
        apCost: 8
    },

    // ── AIR FORCE ──
    airlift_logistics: {
        id: 'airlift_logistics',
        sector: 'air_force',
        name: 'Airlift & Logistics',
        desc: 'Prioritises strategic transport and supply chain operations over combat capability.',
        apCost: 3
    },
    close_air_support: {
        id: 'close_air_support',
        sector: 'air_force',
        name: 'Close Air Support',
        desc: 'Optimises aircraft for supporting ground troops in tactical operations rather than independent missions.',
        apCost: 4
    },
    air_superiority: {
        id: 'air_superiority',
        sector: 'air_force',
        name: 'Air Superiority',
        desc: 'Focuses the air force on dominating the skies and denying enemy air operations.',
        apCost: 5
    },
    drone_warfare: {
        id: 'drone_warfare',
        sector: 'air_force',
        name: 'Drone Warfare',
        desc: 'Builds a doctrine around unmanned systems for persistent surveillance and low-casualty strike operations.',
        apCost: 6
    },
    strategic_bombing: {
        id: 'strategic_bombing',
        sector: 'air_force',
        name: 'Strategic Bombing',
        desc: 'Develops long-range offensive strike capability for deep penetration missions against distant targets.',
        apCost: 8
    },

    // ── INTELLIGENCE ──
    counterintelligence: {
        id: 'counterintelligence',
        sector: 'intelligence',
        name: 'Counterintelligence',
        desc: 'Defensive posture focused on protecting the nation against foreign infiltration and internal corruption.',
        apCost: 3
    },
    domestic_surveillance: {
        id: 'domestic_surveillance',
        sector: 'intelligence',
        name: 'Domestic Surveillance',
        desc: 'Monitors internal dissidents, opposition movements, and civil society for threats to stability.',
        apCost: 3
    },
    signal_intelligence: {
        id: 'signal_intelligence',
        sector: 'intelligence',
        name: 'Signal Intelligence',
        desc: 'Intercepts and analyses foreign communications to build diplomatic and military awareness.',
        apCost: 4
    },
    cybersecurity: {
        id: 'cybersecurity',
        sector: 'intelligence',
        name: 'Cybersecurity',
        desc: 'Develops both defensive network protection and offensive digital operations capability.',
        apCost: 5
    },
    foreign_intelligence: {
        id: 'foreign_intelligence',
        sector: 'intelligence',
        name: 'Foreign Intelligence',
        desc: 'Runs external espionage operations and signals collection against rival nations.',
        apCost: 6
    },
    covert_operations: {
        id: 'covert_operations',
        sector: 'intelligence',
        name: 'Covert Operations',
        desc: 'Maintains a deniable black ops capability for interference in foreign nations and actors.',
        apCost: 8
    },

    // ── NUCLEAR (single-select) ──
    non_nuclear_power: {
        id: 'non_nuclear_power',
        sector: 'nuclear',
        name: 'Non-Nuclear Power',
        desc: 'Publicly commits to maintaining no nuclear weapons capability as a trust and soft power signal.',
        apCost: 0,
        startingDoctrine: true // all nations start with this
    },
    non_proliferation: {
        id: 'non_proliferation',
        sector: 'nuclear',
        name: 'Non-Proliferation',
        desc: 'Commits to actively opposing the spread of nuclear weapons while maintaining existing capability.',
        apCost: 4,
        requiresNuclearCapability: true
    },
    deterrence: {
        id: 'deterrence',
        sector: 'nuclear',
        name: 'Deterrence',
        desc: 'Matches rival nuclear capability without escalating, seeking a stable deterrence equilibrium.',
        apCost: 4,
        requiresNuclearCapability: true
    },
    mutually_assured_destruction: {
        id: 'mutually_assured_destruction',
        sector: 'nuclear',
        name: 'Mutually Assured Destruction',
        desc: 'Maintains a credible retaliatory second-strike capability that makes nuclear war unwinnable for all parties.',
        apCost: 6,
        requiresNuclearCapability: true
    },
    first_strike_doctrine: {
        id: 'first_strike_doctrine',
        sector: 'nuclear',
        name: 'First Strike Doctrine',
        desc: 'Signals willingness to use nuclear weapons preemptively, maximising deterrence through aggression.',
        apCost: 8,
        requiresNuclearCapability: true
    }
};

// Helper: get all doctrines for a sector (array)
export function getDoctrinesBySector(sector) {
    return Object.values(DOCTRINES).filter(d => d.sector === sector);
}

// Helper: check if a nuclear doctrine can be announced
export function canAnnounceNuclearDoctrine(doctrine, gameState) {
    if (doctrine.id === 'non_nuclear_power') return { allowed: true };
    if (!gameState.nation.hasNuclearCapability) {
        return {
            allowed: false,
            message: 'Nation is not equipped with any nuclear weapons.'
        };
    }
    return { allowed: true };
}

// ── Event template pools ──

export const DOCTRINE_EVENTS = {
    announced_nation: [
        '{nation_name} has formally adopted {doctrine_name} as official {sector} doctrine.',
        'The Ministry of Defense has announced {doctrine_name}. Effective in 3 ticks.',
        '{nation_name} commits to {doctrine_name}. The military begins restructuring.',
        'Defense Ministry confirms new {sector} posture: {doctrine_name}.'
    ],
    announced_world: [
        '{nation_name} has declared {doctrine_name} as its official {sector} stance.',
        '{nation_name} announces {doctrine_name}. Regional observers are watching.',
        '{nation_name} shifts {sector} posture to {doctrine_name}.',
        'New military doctrine declared: {nation_name} adopts {doctrine_name}.'
    ],
    renounced_nation_start: [
        '{nation_name} has begun the process of renouncing {doctrine_name}. Cooldown: 120 ticks.',
        'The Ministry of Defense initiates renunciation of {doctrine_name}.',
        '{doctrine_name} renunciation underway. Full deactivation in 120 ticks.',
        '{nation_name} moves to step back from {doctrine_name}.'
    ],
    renounced_nation_complete: [
        '{doctrine_name} has been fully renounced. {sector} doctrine updated.',
        '{nation_name} has completed renunciation of {doctrine_name}.',
        '{doctrine_name} is no longer active {nation_name} policy.',
        'Renunciation complete: {doctrine_name} removed from {nation_name}\'s military posture.'
    ],
    renounced_world_complete: [
        '{nation_name} has renounced {doctrine_name}.',
        '{nation_name} formally withdraws {doctrine_name} from its military posture.',
        '{doctrine_name} is no longer active policy in {nation_name}.',
        '{nation_name} steps back from {doctrine_name}. Analysts note the shift.'
    ],
    nuclear_transition_world: [
        '{nation_name} is shifting nuclear doctrine from {old_doctrine} to {new_doctrine}.',
        '{nation_name} nuclear posture update: {old_doctrine} out, {new_doctrine} incoming.',
        '{nation_name} announces nuclear doctrine transition. Full effect in 120 ticks.',
        'Significant shift: {nation_name} moves from {old_doctrine} toward {new_doctrine}.'
    ]
};

// Pick a random template from a pool and fill variables
export function buildDoctrineEventText(pool, vars) {
    const template = pool[Math.floor(Math.random() * pool.length)];
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || key);
}

// Create a default doctrine state object
export function createDoctrineState(doctrineId, tick, opts = {}) {
    const def = DOCTRINES[doctrineId];
    if (!def) return null;
    return {
        id: def.id,
        sector: def.sector,
        active: true,
        cohesion: 0,
        cohesionMax: DOCTRINE_COHESION_MAX,
        activatedOnTick: tick,
        renouncing: false,
        renounceCooldownRemaining: null,
        permanent: def.permanent || false,
        autocracyOnly: def.autocracyOnly || false,
        hidden: def.hidden || false,
        ...opts
    };
}
