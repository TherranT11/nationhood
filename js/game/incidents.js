/**
 * incidents.js — Incident trigger, creation, and lifecycle engine
 * Extracted from game-common.js
 */

import { GAME_CONFIG } from './config.js';
import { isAutocracy, getCanonicalGovernmentType } from './government-types.js';

// ==================== CONSTANTS ====================

const INCIDENT_TYPES = {
    FISHING_DISPUTE: 'fishing_dispute',
    BORDER_INCURSION: 'border_incursion',
    DAM_WATER: 'dam_water',
    TRADE_WAR: 'trade_war',
    SPY_ARREST: 'spy_arrest'
};

const INCIDENT_CONFIG = {
    fishing_dispute: {
        base_chance: 0.4,
        required_border: 'maritime',
        required_proximity: 100,        // 100 = bordering
        requires_autocracy: false,
        roles: { a: 'aggrieved', b: 'enforcer' },
        aggressor_role: 'enforcer',     // autocracy gets this role
        immediate_effects: { Relations: -5, Civil_Unrest_a: 1, Intl_Reputation_b: -0.5 },
        trigger_modifiers: [
            { stat: 'relation_score', op: 'lt', value: 40, multiplier: 1.5, nation: 'pair' },
            { stat: 'food_security', op: 'lt', value: 40, multiplier: 1.8, nation: 'a' },
            // Trade_Balance negative for nation A
            { stat: 'trade_balance', op: 'lt', value: 0, multiplier: 1.3, nation: 'a' }
        ],
        suppress_modifiers: [
            { condition: 'active_trade_agreement', multiplier: 0.3 },
            { stat: 'relation_score', op: 'gt', value: 65, multiplier: 0.2, nation: 'pair' }
        ]
    },
    border_incursion: {
        base_chance: 0.15,
        required_border: 'land',
        required_proximity: 100,
        requires_autocracy: true,       // at least one must be autocracy (invader)
        roles: { a: 'invader', b: 'defender' },
        aggressor_role: 'invader',
        starting_leverage_a: 2,
        immediate_effects: { Relations: -12, Stability_b: -4, Civil_Unrest_b: 3, Military_Readiness_b: 2, Intl_Reputation_a: -2, Military_Readiness_both: 1 },
        crisis_fields: { occupation_depth_km: 12, war_risk_pct: 0 },
        trigger_modifiers: [
            { stat: 'relation_score', op: 'lt', value: 25, multiplier: 3.0, nation: 'pair' },
            { stat: 'gov_approval', op: 'lt', value: 30, multiplier: 2.5, nation: 'a' },
            { stat: 'military_readiness', op: 'gt', value: 70, multiplier: 1.5, nation: 'a' },
            { stat: 'stability', op: 'lt', value: 30, multiplier: 1.5, nation: 'b' },
            { stat: 'military_readiness', op: 'lt', value: 40, multiplier: 2.0, nation: 'b' }
        ],
        suppress_modifiers: [
            { stat: 'relation_score', op: 'gt', value: 55, multiplier: 0.1, nation: 'pair' },
            { condition: 'non_aggression_pact', multiplier: 0.2 },
            { stat: 'military_readiness', op: 'lt', value: 50, multiplier: 0.3, nation: 'a' }
        ]
    },
    dam_water: {
        base_chance: 0.1,
        required_border: 'river',
        required_proximity: 100,
        requires_autocracy: false,
        roles: { a: 'upstream', b: 'downstream' },
        aggressor_role: 'upstream',
        immediate_effects: { Relations: -8, Stability_b: -2 },
        crisis_fields: { water_flow_pct: 35 }
    },
    trade_war: {
        base_chance: 0,                 // action-triggered only (50% on retaliatory tariff)
        required_border: null,          // no border requirement
        required_proximity: null,       // any distance (0-100)
        requires_autocracy: false,
        roles: { a: 'initiator', b: 'retaliator' },
        aggressor_role: 'initiator'
    }
    // spy_arrest deferred — requires Covert Operations action
};

const GLOBAL_INCIDENT_CAP = 12;
const PER_NATION_INCIDENT_CAP = 3;
const COOLDOWN_TICKS = 18;

// ==================== TRIGGER CHECK ====================

/**
 * Main entry point: check all tick-based crisis types for triggers.
 * Called once per tick from advanceTick(), AFTER per-nation processing.
 *
 * Flow per crisis type:
 *   1. Check 18-tick cooldown + initial delay
 *   2. Check global cap (12 active incidents)
 *   3. Roll base trigger chance
 *   4. If triggered: pick random nation (1d7), find valid partner
 *   5. Check per-nation cap (3), per-pair-per-type uniqueness
 *   6. Assign roles (autocracy → aggressor)
 *   7. Create incident with start event
 */
export async function processIncidentTriggers(supabase, nationList, currentTick) {
    const results = [];

    // Load cooldowns
    const { data: cooldowns } = await supabase
        .from('incident_cooldowns')
        .select('*');
    if (!cooldowns) return results;

    // Count global active incidents
    const { count: globalActive } = await supabase
        .from('incidents')
        .select('id', { count: 'exact', head: true })
        .in('status', ['active', 'mediating']);
    if ((globalActive || 0) >= GLOBAL_INCIDENT_CAP) {
        console.log(`[Incidents] Global cap reached (${globalActive}/${GLOBAL_INCIDENT_CAP}). Skipping triggers.`);
        return results;
    }

    // Load diplomatic relations (for proximity, border types, relation scores)
    const { data: allRelations } = await supabase
        .from('diplomatic_relations')
        .select('nation_a_id, nation_b_id, proximity, border_types, relation_score');

    // Build lookup map: "idA::idB" -> relation
    const relMap = {};
    for (const r of (allRelations || [])) {
        relMap[`${r.nation_a_id}::${r.nation_b_id}`] = r;
        relMap[`${r.nation_b_id}::${r.nation_a_id}`] = r;
    }

    // Load active incidents for cap checking
    const { data: activeIncidents } = await supabase
        .from('incidents')
        .select('nation_a_id, nation_b_id, incident_type, status')
        .in('status', ['active', 'mediating']);

    // Count per-nation active incidents
    const nationIncidentCounts = {};
    for (const inc of (activeIncidents || [])) {
        nationIncidentCounts[inc.nation_a_id] = (nationIncidentCounts[inc.nation_a_id] || 0) + 1;
        nationIncidentCounts[inc.nation_b_id] = (nationIncidentCounts[inc.nation_b_id] || 0) + 1;
    }

    // Check each tick-triggered crisis type
    const tickTriggeredTypes = ['fishing_dispute', 'border_incursion', 'dam_water'];

    for (const crisisType of tickTriggeredTypes) {
        const config = INCIDENT_CONFIG[crisisType];
        if (!config || config.base_chance <= 0) continue;

        const cooldown = cooldowns.find(c => c.incident_type === crisisType);
        if (!cooldown) continue;

        // Check initial delay (staggered start)
        if (currentTick < cooldown.initial_delay_until) {
            continue;
        }

        // Check 18-tick cooldown
        if (currentTick - cooldown.last_fired_tick < cooldown.cooldown_ticks) {
            continue;
        }

        // Roll base trigger chance (0-100)
        const roll = Math.random() * 100;
        if (roll >= config.base_chance) {
            continue;
        }

        console.log(`[Incidents] ${crisisType} trigger rolled ${roll.toFixed(2)} < ${config.base_chance}. Attempting to find nations...`);

        // Pick a random nation (1d7)
        const shuffled = [...nationList].sort(() => Math.random() - 0.5);
        let created = false;

        for (const nationA of shuffled) {
            if (created) break;

            // Check nation A cap
            if ((nationIncidentCounts[nationA.id] || 0) >= PER_NATION_INCIDENT_CAP) continue;

            // Incursion requires nation A to be autocracy
            if (config.requires_autocracy && !isAutocracy(nationA)) continue;

            // Find a valid partner
            const partners = nationList.filter(n => n.id !== nationA.id);
            const shuffledPartners = partners.sort(() => Math.random() - 0.5);

            for (const nationB of shuffledPartners) {
                // Check nation B cap
                if ((nationIncidentCounts[nationB.id] || 0) >= PER_NATION_INCIDENT_CAP) continue;

                // Check diplomatic relation exists
                const rel = relMap[`${nationA.id}::${nationB.id}`];
                if (!rel) continue;

                // Check proximity (100 = bordering for land/maritime/river crises)
                if (config.required_proximity != null && rel.proximity < config.required_proximity) continue;

                // Check border type
                if (config.required_border) {
                    const borders = rel.border_types || [];
                    if (!borders.includes(config.required_border)) continue;
                }

                // Check no duplicate type for this pair
                const pairHasType = (activeIncidents || []).some(inc =>
                    inc.incident_type === crisisType &&
                    ((inc.nation_a_id === nationA.id && inc.nation_b_id === nationB.id) ||
                     (inc.nation_a_id === nationB.id && inc.nation_b_id === nationA.id))
                );
                if (pairHasType) continue;

                // Apply trigger modifiers
                let chance = config.base_chance;
                for (const mod of (config.trigger_modifiers || [])) {
                    const statVal = getStatForModifier(mod, nationA, nationB, rel);
                    if (statVal != null && checkCondition(statVal, mod.op, mod.value)) {
                        chance *= mod.multiplier;
                    }
                }

                // Apply suppress modifiers
                for (const mod of (config.suppress_modifiers || [])) {
                    if (mod.condition) {
                        // TODO: check active treaties/pacts when implemented
                        continue;
                    }
                    const statVal = getStatForModifier(mod, nationA, nationB, rel);
                    if (statVal != null && checkCondition(statVal, mod.op, mod.value)) {
                        chance *= mod.multiplier;
                    }
                }

                // Final roll against modified chance
                const finalRoll = Math.random() * 100;
                if (finalRoll >= chance) continue;

                console.log(`[Incidents] ${crisisType} TRIGGERED between ${nationA.name} and ${nationB.name} (chance ${chance.toFixed(2)}%, roll ${finalRoll.toFixed(2)})`);

                // Assign roles
                const { roleA, roleB, assignedA, assignedB } = assignRoles(config, nationA, nationB);

                // Create the incident
                const result = await createIncident(supabase, {
                    type: crisisType,
                    config,
                    nationA: assignedA,
                    nationB: assignedB,
                    roleA,
                    roleB,
                    currentTick,
                    relation: rel
                });

                if (result) {
                    results.push(result);
                    created = true;

                    // Update cooldown
                    await supabase
                        .from('incident_cooldowns')
                        .update({ last_fired_tick: currentTick })
                        .eq('incident_type', crisisType);

                    // Update in-memory counts
                    nationIncidentCounts[assignedA.id] = (nationIncidentCounts[assignedA.id] || 0) + 1;
                    nationIncidentCounts[assignedB.id] = (nationIncidentCounts[assignedB.id] || 0) + 1;
                }
                break;
            }
        }
    }

    return results;
}


// ==================== ROLE ASSIGNMENT ====================

/**
 * Assign roles based on government type and crisis rules.
 * If one nation is autocracy, they get the aggressor role.
 * If both same type, nation A keeps its role (random assignment from shuffle).
 */
function assignRoles(config, nationA, nationB) {
    const aIsAutocracy = isAutocracy(nationA);
    const bIsAutocracy = isAutocracy(nationB);

    let assignedA = nationA;
    let assignedB = nationB;
    let roleA = config.roles.a;
    let roleB = config.roles.b;

    // If one is autocracy, they get the aggressor role
    if (aIsAutocracy && !bIsAutocracy) {
        // A is autocracy — assign A as aggressor
        if (config.aggressor_role === config.roles.b) {
            // Swap: autocracy needs role B (aggressor)
            assignedA = nationB;
            assignedB = nationA;
            roleA = config.roles.a;
            roleB = config.roles.b;
        }
        // else A already has the aggressor role
    } else if (!aIsAutocracy && bIsAutocracy) {
        // B is autocracy — assign B as aggressor
        if (config.aggressor_role === config.roles.a) {
            // Swap: autocracy needs role A (aggressor)
            assignedA = nationB;
            assignedB = nationA;
            roleA = config.roles.a;
            roleB = config.roles.b;
        }
    }
    // Both same type: keep random assignment from shuffle

    return { roleA, roleB, assignedA, assignedB };
}


// ==================== INCIDENT CREATION ====================

/**
 * Create a new incident with start event, stat effects, and system messages.
 */
async function createIncident(supabase, { type, config, nationA, nationB, roleA, roleB, currentTick, relation }) {
    const govTypeA = getCanonicalGovernmentType(nationA) === 'Autocracy' ? 'autocracy' : 'democracy';
    const govTypeB = getCanonicalGovernmentType(nationB) === 'Autocracy' ? 'autocracy' : 'democracy';

    // Roll start event (1d5)
    const { data: startEvents } = await supabase
        .from('incident_event_pool')
        .select('*')
        .eq('incident_type', type)
        .eq('category', 'start');

    if (!startEvents || startEvents.length === 0) {
        console.error(`[Incidents] No start events found for ${type}`);
        return null;
    }

    const startEvent = startEvents[Math.floor(Math.random() * startEvents.length)];

    // Calculate starting leverage
    let leverageA = (config.starting_leverage_a || 0) + (startEvent.leverage_shift_a || 0);
    let leverageB = (config.starting_leverage_b || 0) + (startEvent.leverage_shift_b || 0);

    // Build incident row
    const incidentData = {
        incident_type: type,
        status: 'active',
        nation_a_id: nationA.id,
        nation_b_id: nationB.id,
        nation_a_role: roleA,
        nation_b_role: roleB,
        nation_a_gov_type: govTypeA,
        nation_b_gov_type: govTypeB,
        leverage_a: leverageA,
        leverage_b: leverageB,
        started_tick: currentTick,
        start_event_id: startEvent.event_key,
        ...(config.crisis_fields || {})
    };

    const { data: incident, error: insertErr } = await supabase
        .from('incidents')
        .insert(incidentData)
        .select('id')
        .single();

    if (insertErr || !incident) {
        console.error(`[Incidents] Failed to create ${type}:`, insertErr);
        return null;
    }

    // Substitute placeholders in event text
    const eventText = startEvent.event_text_template
        .replace(/\{nation_a\}/g, nationA.name)
        .replace(/\{nation_b\}/g, nationB.name);

    // Insert start event into timeline
    await supabase.from('incident_events').insert({
        incident_id: incident.id,
        tick: currentTick,
        event_type: 'start_event',
        event_key: startEvent.event_key,
        leverage_shift_a: startEvent.leverage_shift_a || 0,
        leverage_shift_b: startEvent.leverage_shift_b || 0,
        event_text: eventText,
        event_source_label: `${formatCrisisName(type)} — Incident Start`,
        stat_effects: startEvent.stat_effects_template,
        metadata: startEvent.metadata_template,
        visibility: 'both'
    });

    // Apply immediate stat effects to both nations
    const effects = config.immediate_effects || {};
    await applyIncidentStatEffects(supabase, nationA, nationB, effects);

    // Insert system chat message for both nations
    const crisisName = `${nationA.name}-${nationB.name} ${formatCrisisName(type)}`;
    for (const nation of [nationA, nationB]) {
        await supabase.from('incident_chat_messages').insert({
            incident_id: incident.id,
            nation_id: nation.id,
            sender_role: 'system',
            message_text: `-- ${crisisName} opened Tick ${currentTick} --`,
            tick: currentTick,
            is_system: true,
            chat_context: 'internal'
        });
        await supabase.from('incident_chat_messages').insert({
            incident_id: incident.id,
            nation_id: nation.id,
            sender_role: 'system',
            message_text: '-- Participants: HoG, Foreign Minister, Minister of Defense --',
            tick: currentTick,
            is_system: true,
            chat_context: 'internal'
        });
    }

    // Insert event_log entries (Nation tab + World tab)
    await supabase.from('event_log').insert({
        nation_id: nationA.id,
        event_name: formatCrisisName(type),
        trigger_key: `incident_started_${type}`,
        description_chosen: eventText,
        category: 'crisis',
        fired_at_tick: currentTick
    });
    await supabase.from('event_log').insert({
        nation_id: nationB.id,
        event_name: formatCrisisName(type),
        trigger_key: `incident_started_${type}`,
        description_chosen: eventText,
        category: 'crisis',
        fired_at_tick: currentTick
    });

    console.log(`[Incidents] Created ${type}: ${nationA.name} (${roleA}) vs ${nationB.name} (${roleB}). Leverage: ${leverageA}-${leverageB}. Start event: ${startEvent.event_key}`);

    return {
        incidentId: incident.id,
        type,
        nationA: nationA.name,
        nationB: nationB.name,
        roleA,
        roleB,
        leverageA,
        leverageB,
        startEvent: startEvent.event_key
    };
}


// ==================== HELPERS ====================

function getStatForModifier(mod, nationA, nationB, relation) {
    if (mod.nation === 'pair') {
        return relation?.[mod.stat] ?? null;
    }
    const nation = mod.nation === 'a' ? nationA : nationB;
    return nation?.[mod.stat] ?? null;
}

function checkCondition(value, op, threshold) {
    switch (op) {
        case 'lt': return value < threshold;
        case 'gt': return value > threshold;
        case 'lte': return value <= threshold;
        case 'gte': return value >= threshold;
        case 'eq': return value === threshold;
        default: return false;
    }
}

function formatCrisisName(type) {
    switch (type) {
        case 'fishing_dispute': return 'Maritime Fishing Dispute';
        case 'border_incursion': return 'Border Military Incursion';
        case 'dam_water': return 'Dam / Water Diversion Crisis';
        case 'trade_war': return 'Trade War Escalation';
        case 'spy_arrest': return 'Spy Arrest Crisis';
        default: return type;
    }
}

/**
 * Apply stat effects from an incident to both nations.
 * Keys ending in _a apply to nation A only, _b to nation B only,
 * _both to both. Plain keys apply as Relations (bilateral).
 */
async function applyIncidentStatEffects(supabase, nationA, nationB, effects) {
    for (const [key, value] of Object.entries(effects)) {
        if (key === 'Relations') {
            // Update bilateral relation score
            const aId = nationA.id < nationB.id ? nationA.id : nationB.id;
            const bId = nationA.id < nationB.id ? nationB.id : nationA.id;
            await supabase.rpc('nudge_relation_score', {
                p_nation_a_id: aId,
                p_nation_b_id: bId,
                p_delta: value
            }).then(() => {}, (err) => {
                // Fallback: direct update if RPC doesn't exist
                supabase.from('diplomatic_relations')
                    .update({ relation_score: Math.max(0, Math.min(100, (0) + value)) })
                    .eq('nation_a_id', aId)
                    .eq('nation_b_id', bId)
                    .then(() => {}, () => {});
            });
            continue;
        }

        // Determine target nation(s) and stat name
        let targets = [];
        let statName = key;

        if (key.endsWith('_a')) {
            targets = [nationA];
            statName = key.slice(0, -2).toLowerCase();
        } else if (key.endsWith('_b')) {
            targets = [nationB];
            statName = key.slice(0, -2).toLowerCase();
        } else if (key.endsWith('_both')) {
            targets = [nationA, nationB];
            statName = key.slice(0, -5).toLowerCase();
        } else {
            continue;
        }

        for (const nation of targets) {
            const currentVal = Number(nation[statName] ?? 50);
            const newVal = Math.max(0, Math.min(100, currentVal + value));
            await supabase
                .from('nations')
                .update({ [statName]: newVal })
                .eq('id', nation.id);
        }
    }
}
