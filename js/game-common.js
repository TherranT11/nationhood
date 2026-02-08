/**
 * game-common.js — Shared game logic for Nationhood Alpha
 *
 * Single source of truth for:
 *   - Seat loading (autocracy vs democracy)
 *   - Head faction detection
 *   - Coalition fetching (government_formations → active_coalitions)
 *   - Policy compatibility filtering
 *   - Bill support calculation
 *   - Vote tally syncing
 *   - Enactment approval impact
 *   - Game constants & utility formatters
 *
 * Used by: laws.html, bill.html, government.html, parties.html
 */

// ==================== CONSTANTS ====================

const GAME_CONFIG = {
    TOTAL_SEATS: 120,
    MAJORITY_THRESHOLD: 0.51,
    MAJORITY_SEATS: 61,
    VOTING_WINDOW_TICKS: 3,
    DRAFT_BILL_AP_COST: 2,
    VETO_APPROVAL_COST: 3
};

const MAJOR_SECTORS = [
    { key: 'ECONOMICS',     label: 'Economics',           icon: '💰' },
    { key: 'LABOR',         label: 'Labor',               icon: '👷' },
    { key: 'EDUCATION',     label: 'Education',           icon: '📚' },
    { key: 'ENERGY',        label: 'Energy',              icon: '⚡' },
    { key: 'WELFARE',       label: 'Welfare',             icon: '🏥' },
    { key: 'MILITARY',      label: 'Military & Security', icon: '🛡️' },
    { key: 'GOVERNANCE',    label: 'Governance',          icon: '🏛️' },
    { key: 'IMMIGRATION',   label: 'Immigration',         icon: '🌍' },
    { key: 'INTERNATIONAL', label: 'International',       icon: '🌐' }
];

// Stats where LOWER is better (inverted approval logic)
const INVERTED_STATS = [
    'unemployment', 'poverty_rate', 'income_inequality', 'death_rate',
    'pollution', 'carbon_emissions', 'crime_rate', 'incarceration_rate',
    'drug_use', 'corruption', 'polarization', 'civil_unrest', 'terrorism',
    'political_violence', 'emigration', 'sanctions', 'debt', 'debt_growth',
    'inflation', 'illegal_immigration', 'fuel_prices'
];


// ==================== SEAT LOADING ====================

/**
 * Load seat data for all parties in a nation.
 * - Autocracies: read factions.seats directly
 * - Democracies: latest election results, falling back to factions.seats
 */
async function loadSeats(supabase, nationId, isAutocracy, allParties, currentFactionId) {
    const allPartySeats = {};

    if (isAutocracy) {
        allParties.forEach(p => {
            allPartySeats[p.id] = p.seats || 0;
        });
    } else {
        const { data: election } = await supabase
            .from('elections')
            .select('results')
            .eq('nation_id', nationId)
            .eq('status', 'completed')
            .order('election_tick', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (election?.results?.votes) {
            election.results.votes.forEach(s => {
                allPartySeats[s.party_id] = s.seats;
            });
        } else if (election?.results?.seats) {
            election.results.seats.forEach(s => {
                allPartySeats[s.party_id] = s.seats;
            });
        }

        allParties.forEach(p => {
            if (!allPartySeats[p.id]) {
                allPartySeats[p.id] = p.seats || 0;
            }
        });
    }

    const currentSeats = allPartySeats[currentFactionId] ||
        allParties.find(p => p.id === currentFactionId)?.seats || 0;

    return { allPartySeats, currentSeats };
}


// ==================== HEAD FACTION ====================

/**
 * Detect the head (ruling) faction for autocracy veto/enact powers.
 */
async function detectHeadFaction(supabase, nationId, allParties, allPartySeats, currentFactionId) {
    const { data: gov } = await supabase
        .from('nation_governments')
        .select('head_of_state_party')
        .eq('nation_id', nationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (gov?.head_of_state_party) {
        return {
            headFactionId: gov.head_of_state_party,
            isHeadFaction: currentFactionId === gov.head_of_state_party
        };
    }

    const sorted = allParties.slice().sort((a, b) =>
        (allPartySeats[b.id] || 0) - (allPartySeats[a.id] || 0)
    );
    const top = sorted[0];
    if (!top) return { headFactionId: null, isHeadFaction: false };
    return {
        headFactionId: top.id,
        isHeadFaction: currentFactionId === top.id
    };
}


// ==================== COALITION FETCHING ====================

/**
 * Fetch the active coalition/government for a nation.
 */
async function fetchActiveCoalition(supabase, nationId) {
    const { data: newGov } = await supabase
        .from('government_formations')
        .select('*')
        .eq('nation_id', nationId)
        .eq('status', 'formed')
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (newGov) {
        const pmPartyId = newGov.ministry_assignments?.prime_minister || newGov.proposed_by;
        return {
            id: newGov.id,
            nation_id: newGov.nation_id,
            election_id: newGov.election_id,
            party_ids: newGov.party_ids || [],
            lead_party_id: pmPartyId,
            ministry_allocations: newGov.ministry_assignments || {},
            formed_at: newGov.formed_at,
            _source: 'government_formations'
        };
    }

    const { data } = await supabase
        .from('active_coalitions')
        .select('*')
        .eq('nation_id', nationId)
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    return data;
}


// ==================== POLICY COMPATIBILITY ====================

/**
 * Get policies for a given sector. All policies are now available regardless
 * of faction ideology — but opposed policies carry approval penalties.
 * Each policy gets an .isOpposed flag so the UI can warn the player.
 */
function getCompatiblePolicies(sector, allPolicies, faction, isAutocracy, excludePolicyIds = []) {
    const ideo1 = (faction?.ideology_value_1 || '').toUpperCase();
    const ideo2 = (faction?.ideology_value_2 || '').toUpperCase();
    const factionIdeos = [ideo1, ideo2].filter(Boolean);

    return allPolicies
        .filter(p => p.major_sector === sector && !excludePolicyIds.includes(p.id))
        .map(p => {
            // Check if any of the policy's ideologies match the faction
            const policyIdeos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
                ? p.ideologies.map(i => i.toUpperCase())
                : (p.ideology ? [p.ideology.toUpperCase()] : []);

            const isAligned = factionIdeos.length === 0 ||
                policyIdeos.length === 0 ||
                policyIdeos.some(pi => factionIdeos.includes(pi));

            return { ...p, isOpposed: !isAligned };
        });
}


// ==================== BILL SUPPORT ====================

/**
 * Calculate support percentage for a bill in committee.
 */
function calculateBillSupport(billSupport, sponsorPartyId, allPartySeats) {
    const sponsorSeats = allPartySeats[sponsorPartyId] || 0;
    const acceptedSeats = (billSupport || [])
        .filter(s => s.stance === 'accept')
        .reduce((sum, s) => sum + s.seat_count, 0);
    const totalSupport = sponsorSeats + acceptedSeats;
    const percent = Math.round((totalSupport / GAME_CONFIG.TOTAL_SEATS) * 100);
    return { sponsorSeats, acceptedSeats, totalSupport, percent };
}


// ==================== VOTE TALLY SYNC ====================

/**
 * Re-read all votes for a bill from bill_support and write totals
 * back to the bills table.
 */
async function syncVoteTallies(supabase, billId) {
    const { data: allVotes } = await supabase
        .from('bill_support')
        .select('stance, seat_count')
        .eq('bill_id', billId);

    let votesFor = 0, votesAgainst = 0;
    (allVotes || []).forEach(v => {
        if (v.stance === 'yes')       votesFor += v.seat_count;
        else if (v.stance === 'no')   votesAgainst += v.seat_count;
    });

    await supabase.from('bills').update({
        votes_for: votesFor,
        votes_against: votesAgainst
    }).eq('id', billId);

    return { votesFor, votesAgainst };
}


// ==================== ENACTMENT APPROVAL IMPACT ====================

/**
 * Calculate approval deltas for all parties when a bill is enacted.
 *
 * How it works:
 *   For each policy article with stat_effects, we look at the nation's
 *   current value for that stat and calculate how "urgent" the change is.
 *
 *   Normal stats (higher = better):
 *     - Stat at 20, policy raises it → high positive urgency (people desperate)
 *     - Stat at 80, policy raises it → low positive urgency (diminishing returns)
 *     - Stat at 80, policy lowers it → high negative urgency (taking away something good)
 *     - Stat at 20, policy lowers it → low negative urgency (wasn't great anyway)
 *
 *   Inverted stats (lower = better, e.g. corruption):
 *     - Flipped logic: lowering corruption at 80 = high positive urgency
 *
 *   Parties that voted YES get the full approval delta.
 *   Parties that voted NO get the inverse at 50% strength.
 *   Sponsor always counts as YES.
 *
 * @param {object}  nation       - Full nation row (with current stat values)
 * @param {Array}   articles     - Bill articles with policies (including stat_effects)
 * @param {Array}   billSupport  - Array of { faction_id, stance } from floor vote
 * @param {string}  sponsorId    - Faction UUID that proposed the bill
 * @returns {Object} Map of factionId → approval delta (can be positive or negative)
 *
 * Example return: { 'uuid-abc': +4.2, 'uuid-def': -2.1, 'uuid-ghi': +1.8 }
 */
function calculateEnactmentApproval(nation, articles, billSupport, sponsorId) {
    const BASE_IMPACT = 3;          // Max approval points per stat effect
    const NO_VOTE_PENALTY = 0.5;    // Inverse multiplier for NO voters

    // 1. Aggregate all stat effects across all articles in the bill
    const allEffects = [];
    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;

        // Support new stat_effects array
        if (p.stat_effects && Array.isArray(p.stat_effects)) {
            for (const eff of p.stat_effects) {
                allEffects.push({
                    stat_key: eff.stat_key,
                    direction: eff.direction  // 'up' or 'down'
                });
            }
        }
        // Legacy single stat fallback
        else if (p.target_stat) {
            allEffects.push({
                stat_key: p.target_stat,
                direction: (p.stat_direction || '').toLowerCase() === 'up' ? 'up' : 'down'
            });
        }
    }

    if (allEffects.length === 0) return {};

    // 2. Calculate net public sentiment from all effects
    let totalSentiment = 0;

    for (const eff of allEffects) {
        const statKey = eff.stat_key;
        const currentValue = nation[statKey];
        if (currentValue === null || currentValue === undefined) continue;

        const isInverted = INVERTED_STATS.includes(statKey);
        const val = Number(currentValue);

        // Urgency: how much do people care about a change in this stat?
        // Range 0.0 to 1.0 based on how "bad" the stat currently is
        let urgency;
        if (isInverted) {
            // Inverted: high value = bad situation, people want it lowered
            urgency = val / 100;  // corruption at 80 → urgency 0.8
        } else {
            // Normal: low value = bad situation, people want it raised
            urgency = (100 - val) / 100;  // healthcare at 20 → urgency 0.8
        }

        // Clamp urgency to 0.1–1.0 (always some impact, never zero)
        urgency = Math.max(0.1, Math.min(1.0, urgency));

        // Does this effect help or hurt?
        let isHelpful;
        if (isInverted) {
            // Lowering an inverted stat is good, raising it is bad
            isHelpful = eff.direction === 'down';
        } else {
            // Raising a normal stat is good, lowering it is bad
            isHelpful = eff.direction === 'up';
        }

        // Sentiment: positive if helpful, negative if harmful
        // Scaled by urgency — desperate situations amplify the reaction
        const sentiment = isHelpful
            ? BASE_IMPACT * urgency           // helpful: +0.3 to +3.0
            : -BASE_IMPACT * (1 - urgency + 0.2);  // harmful: always stings, worse when stat was good

        totalSentiment += sentiment;
    }

    // Average across effects so bills with many articles don't explode
    const avgSentiment = totalSentiment / allEffects.length;

    // Cap at ±5 approval per bill
    const cappedSentiment = Math.max(-5, Math.min(5, avgSentiment));

    // 3. Assign to each party based on their vote
    const approvalDeltas = {};

    // Sponsor always counts as YES
    const votes = {};
    votes[sponsorId] = 'yes';
    for (const s of (billSupport || [])) {
        if (s.faction_id !== sponsorId) {
            votes[s.faction_id] = s.stance;
        }
    }

    for (const [factionId, stance] of Object.entries(votes)) {
        if (stance === 'yes') {
            // Voted YES: get full sentiment (positive if bill was popular, negative if not)
            approvalDeltas[factionId] = Math.round(cappedSentiment * 10) / 10;
        } else if (stance === 'no') {
            // Voted NO: get inverse at reduced strength
            // If bill was popular (sentiment > 0), NO voters lose approval
            // If bill was unpopular (sentiment < 0), NO voters gain approval (they opposed it!)
            approvalDeltas[factionId] = Math.round(-cappedSentiment * NO_VOTE_PENALTY * 10) / 10;
        }
        // Abstain: no effect
    }

    return approvalDeltas;
}

/**
 * Apply enactment approval deltas to factions in the database.
 *
 * Call this when a bill moves to 'passed' status.
 *
 * @param {object} supabase       - Supabase client
 * @param {Object} approvalDeltas - Map of factionId → delta from calculateEnactmentApproval
 * @returns {Promise<void>}
 */
async function applyEnactmentApproval(supabase, approvalDeltas) {
    for (const [factionId, delta] of Object.entries(approvalDeltas)) {
        if (delta === 0) continue;

        // Read current approval
        const { data: faction } = await supabase
            .from('factions')
            .select('approval_rating')
            .eq('id', factionId)
            .single();

        if (!faction) continue;

        const current = faction.approval_rating ?? 50;
        const updated = Math.max(0, Math.min(100, current + delta));

        await supabase
            .from('factions')
            .update({ approval_rating: updated })
            .eq('id', factionId);
    }
}


// ==================== IDEOLOGY PENALTY ====================

/**
 * Count how many articles in a bill are ideologically opposed to the sponsor.
 *
 * A policy article is "opposed" if NONE of its ideologies match either of
 * the sponsor's ideology values. Text-only articles (no policy) are never opposed.
 *
 * @param {Array}  articles - Bill articles with policies
 * @param {Object} sponsor  - Faction with ideology_value_1/2
 * @returns {number} Count of opposed articles
 */
function countOpposedArticles(articles, sponsor) {
    const ideo1 = (sponsor?.ideology_value_1 || '').toUpperCase();
    const ideo2 = (sponsor?.ideology_value_2 || '').toUpperCase();
    const factionIdeos = [ideo1, ideo2].filter(Boolean);

    if (factionIdeos.length === 0) return 0; // No ideology = no opposition

    let opposed = 0;
    for (const art of articles) {
        const p = art.policies || art;
        if (!p || !p.policy_name) continue; // Skip text-only articles

        const policyIdeos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);

        if (policyIdeos.length === 0) continue; // No ideology on policy = neutral

        const hasMatch = policyIdeos.some(pi => factionIdeos.includes(pi));
        if (!hasMatch) opposed++;
    }
    return opposed;
}

/**
 * Calculate ideology penalty for the sponsor when a bill reaches a milestone.
 *
 * Called at two points:
 *   1. Bill reaches FLOOR  → -1 per 2 opposed articles (doubled if polarization ≥ 50)
 *   2. Bill PASSES          → -1 per opposed article, plus -2 per article if polarization ≥ 75
 *
 * Polarization thresholds:
 *   < 50:  floor = -1 per 2,  pass = -1 per 1
 *   50-74: floor = -1 per 1,  pass = -1 per 1
 *   75+:   floor = -1 per 1,  pass = -3 per 1 (-1 base + -2 extra)
 *
 * @param {string}  stage        - 'floor' or 'passed'
 * @param {number}  opposedCount - From countOpposedArticles()
 * @param {number}  polarization - Nation's current polarization stat (0-100)
 * @returns {number} Negative approval delta for the sponsor (always ≤ 0)
 */
function calculateIdeologyPenalty(stage, opposedCount, polarization) {
    if (opposedCount === 0) return 0;

    const pol = polarization || 0;
    let penalty = 0;

    if (stage === 'floor') {
        if (pol >= 50) {
            // Doubled: -1 per opposed article
            penalty = -1 * opposedCount;
        } else {
            // Normal: -1 per 2 opposed articles (rounded down)
            penalty = -1 * Math.floor(opposedCount / 2);
        }
    } else if (stage === 'passed') {
        // Base: -1 per opposed article
        penalty = -1 * opposedCount;

        // Hyperpolarized: additional -2 per opposed article
        if (pol >= 75) {
            penalty += -2 * opposedCount;
        }
    }

    return penalty;
}

/**
 * Apply ideology penalty to the sponsor faction in the database.
 *
 * @param {object} supabase   - Supabase client
 * @param {string} sponsorId  - Faction UUID
 * @param {number} penalty    - Negative number from calculateIdeologyPenalty()
 * @returns {Promise<void>}
 */
async function applyIdeologyPenalty(supabase, sponsorId, penalty) {
    if (penalty === 0 || !sponsorId) return;

    const { data: faction } = await supabase
        .from('factions')
        .select('approval_rating')
        .eq('id', sponsorId)
        .single();

    if (!faction) return;

    const current = faction.approval_rating ?? 50;
    const updated = Math.max(0, Math.min(100, current + penalty));

    await supabase
        .from('factions')
        .update({ approval_rating: updated })
        .eq('id', sponsorId);
}


// ==================== BILL RESOLUTION ENGINE ====================

/**
 * Check all floor bills whose voting window has expired and resolve them.
 * Call this on laws.html load (or from a tick processor).
 *
 * @param {object} supabase  - Supabase client
 * @param {string} nationId  - Nation UUID
 * @returns {Promise<Array>} Array of { billId, result: 'passed'|'failed', ... }
 */
async function resolveExpiredVotes(supabase, nationId) {
    // Get current tick
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) return [];
    const currentTick = shard.current_tick;

    // Find floor bills past their voting deadline
    const { data: expiredBills, error } = await supabase
        .from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .lte('voting_ends_tick', currentTick);

    if (error || !expiredBills || expiredBills.length === 0) return [];

    const results = [];

    for (const bill of expiredBills) {
        // Tally votes
        let votesFor = 0, votesAgainst = 0;
        (bill.bill_support || []).forEach(s => {
            if (s.stance === 'yes') votesFor += s.seat_count;
            else if (s.stance === 'no') votesAgainst += s.seat_count;
        });

        const totalVoted = votesFor + votesAgainst;
        const passed = totalVoted > 0 && votesFor >= Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.MAJORITY_THRESHOLD);

        if (passed) {
            await enactBill(supabase, bill, currentTick);
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst });
        } else {
            await failBill(supabase, bill);
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst });
        }
    }

    return results;
}

/**
 * Enact a passed bill:
 *  1. Mark bill as 'passed'
 *  2. For repeal bills: remove the targeted active law and reverse its stats
 *  3. For regular bills: add each policy article to active_laws
 *     - Auto-rescind opposed active policies (reverse their stats)
 *  4. Apply ideology penalties to sponsor
 *  5. Apply enactment approval to all voting parties
 *
 * @param {object} supabase    - Supabase client
 * @param {object} bill        - Full bill object with bill_articles, bill_support, factions
 * @param {number} currentTick - Current game tick
 */
async function enactBill(supabase, bill, currentTick) {
    // 1. Mark bill as passed
    await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);

    // Load nation for stat calculations
    const { data: nation } = await supabase
        .from('nations')
        .select('*')
        .eq('id', bill.nation_id)
        .single();
    if (!nation) return;

    // Load all current active laws for this nation
    const { data: currentActiveLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', bill.nation_id);

    // 2. Handle REPEAL bills
    if (bill.bill_type === 'repeal' && bill.repeal_active_law_id) {
        const targetLaw = (currentActiveLaws || []).find(l => l.id === bill.repeal_active_law_id);
        if (targetLaw && targetLaw.policies) {
            // Reverse the repealed policy's stat effects
            await reversePolicy(supabase, nation, targetLaw.policies, targetLaw.passed_tick, currentTick);
            // Remove from active_laws
            await supabase.from('active_laws').delete().eq('id', bill.repeal_active_law_id);
        }
    }
    // 3. Handle regular ENACT bills
    else {
        const articles = (bill.bill_articles || []).filter(a => a.policy_id);

        for (const art of articles) {
            const policy = art.policies;
            if (!policy) continue;

            // Check for opposed active policies and auto-rescind them
            if (policy.opposed_policy_ids && Array.isArray(policy.opposed_policy_ids)) {
                for (const opposedId of policy.opposed_policy_ids) {
                    const opposedLaw = (currentActiveLaws || []).find(l => l.policy_id === opposedId);
                    if (opposedLaw && opposedLaw.policies) {
                        // Reverse the opposed policy's accumulated stat effects
                        await reversePolicy(supabase, nation, opposedLaw.policies, opposedLaw.passed_tick, currentTick);
                        // Remove from active_laws
                        await supabase.from('active_laws').delete().eq('id', opposedLaw.id);
                    }
                }
            }

            // Add new policy to active_laws
            await supabase.from('active_laws').insert({
                nation_id: bill.nation_id,
                policy_id: policy.id,
                passed_tick: currentTick,
                proposed_by: bill.proposed_by,
                effects_applied_through_tick: currentTick  // Effects start next tick
            });
        }
    }

    // 4. Ideology penalties for sponsor
    const sponsorFaction = bill.factions;
    if (sponsorFaction) {
        const opposed = countOpposedArticles(bill.bill_articles || [], sponsorFaction);
        if (opposed > 0) {
            const penalty = calculateIdeologyPenalty('passed', opposed, nation.polarization || 0);
            await applyIdeologyPenalty(supabase, bill.proposed_by, penalty);
        }
    }

    // 5. Enactment approval for all voting parties
    const approvalDeltas = calculateEnactmentApproval(
        nation,
        bill.bill_articles || [],
        bill.bill_support || [],
        bill.proposed_by
    );
    await applyEnactmentApproval(supabase, approvalDeltas);

    // Reload nation to get updated stats (after reversals), then apply new policy effects
    // Note: stat effects tick-by-tick application will be handled by the tick processor
    // At enactment, we just record the law — effects accumulate over time
}

/**
 * Reverse a policy's accumulated stat effects on a nation.
 * Called when a policy is rescinded (opposed auto-removal or repeal bill).
 *
 * Calculates how much the policy changed each stat since activation,
 * then subtracts that amount from the nation's current stat value.
 *
 * @param {object} supabase   - Supabase client
 * @param {object} nation     - Full nation row
 * @param {object} policy     - Policy with stat_effects
 * @param {number} passedTick - Tick when the policy was activated
 * @param {number} currentTick - Current tick
 */
async function reversePolicy(supabase, nation, policy, passedTick, currentTick) {
    const ticksActive = currentTick - (passedTick || 0);
    if (ticksActive <= 0) return;

    const effects = policy.stat_effects || [];
    // Legacy fallback
    if (effects.length === 0 && policy.target_stat) {
        effects.push({
            stat_key: policy.target_stat,
            direction: (policy.stat_direction || 'UP').toLowerCase(),
            rate: policy.stat_change_per_tick || 1,
            delay_ticks: 0,
            duration_ticks: policy.duration_months || 12
        });
    }

    if (effects.length === 0) return;

    const updates = {};

    for (const eff of effects) {
        const statKey = eff.stat_key;
        if (!statKey || nation[statKey] === undefined || nation[statKey] === null) continue;

        const delay = eff.delay_ticks || 0;
        const duration = eff.duration_ticks || 12;
        const rate = eff.rate || 1;

        // How many ticks of actual effect have been applied?
        let effectiveTicks = 0;
        if (ticksActive > delay) {
            effectiveTicks = Math.min(ticksActive - delay, duration);
        }

        if (effectiveTicks <= 0) continue;

        // Total accumulated change
        const totalChange = effectiveTicks * rate;

        // Reverse it: if direction was 'up', we added, so now subtract
        const currentVal = Number(nation[statKey]);
        let newVal;
        if (eff.direction === 'up') {
            newVal = currentVal - totalChange;
        } else {
            newVal = currentVal + totalChange;
        }

        // Clamp 0–100
        newVal = Math.max(0, Math.min(100, newVal));
        updates[statKey] = newVal;

        // Also update the in-memory nation object for subsequent calculations
        nation[statKey] = newVal;
    }

    if (Object.keys(updates).length > 0) {
        await supabase.from('nations').update(updates).eq('id', nation.id);
    }
}

/**
 * Mark a bill as failed.
 *
 * @param {object} supabase - Supabase client
 * @param {object} bill     - Full bill object
 */
async function failBill(supabase, bill) {
    await supabase.from('bills').update({
        status: 'failed'
    }).eq('id', bill.id);
}


// ==================== TICK PROCESSOR ====================

/**
 * Advance the game by one tick and process all effects.
 *
 * Call this from admin panel or automated scheduler.
 * 
 * Flow:
 *   1. Increment shard.current_tick
 *   2. For each nation: process stat effects from active laws
 *   3. For each nation: process ongoing costs from active laws
 *   4. Resolve any expired floor votes
 *
 * @param {object} supabase - Supabase client
 * @returns {Promise<object>} Summary of what happened this tick
 */
async function advanceTick(supabase) {
    // 1. Increment tick
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) throw new Error('Shard not found');

    const newTick = (shard.current_tick || 0) + 1;
    await supabase.from('shard').update({ current_tick: newTick }).eq('name', 'Alpha Shard');

    // 2. Load all nations
    const { data: nations } = await supabase.from('nations').select('*');
    if (!nations || nations.length === 0) return { tick: newTick, nations: 0 };

    const summary = { tick: newTick, nations: nations.length, effects: [], costs: [], resolutions: [] };

    for (const nation of nations) {
        // 3. Process stat effects
        const effectResults = await processStatEffects(supabase, nation, newTick);
        if (effectResults.length > 0) summary.effects.push({ nation: nation.name, effects: effectResults });

        // 4. Process ongoing costs
        const costResult = await processOngoingCosts(supabase, nation, newTick);
        if (costResult.totalCost !== 0) summary.costs.push({ nation: nation.name, ...costResult });

        // 5. Resolve expired votes for this nation
        const resolutions = await resolveExpiredVotes(supabase, nation.id);
        if (resolutions.length > 0) summary.resolutions.push({ nation: nation.name, bills: resolutions });

        // 6. Snapshot nation stats to history (for trend arrows)
        await snapshotNationHistory(supabase, nation, newTick);
    }

    return summary;
}

/**
 * Process stat effects for all active laws in a nation for the current tick.
 *
 * For each active law:
 *   - Look at each stat_effect
 *   - If current tick falls within [passed_tick + delay, passed_tick + delay + duration]
 *   - Apply the rate to the nation's stat
 *   - Update effects_applied_through_tick so we don't double-apply
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {number} currentTick - The new tick number
 * @returns {Promise<Array>}   List of effects applied
 */
async function processStatEffects(supabase, nation, currentTick) {
    const { data: activeLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', nation.id);

    if (!activeLaws || activeLaws.length === 0) return [];

    const appliedEffects = [];
    const nationUpdates = {};

    for (const law of activeLaws) {
        const policy = law.policies;
        if (!policy) continue;

        const lastApplied = law.effects_applied_through_tick || 0;
        if (lastApplied >= currentTick) continue; // Already processed

        const passedTick = law.passed_tick || 0;

        // Get stat effects (support both new array and legacy single)
        const effects = [];
        if (policy.stat_effects && Array.isArray(policy.stat_effects) && policy.stat_effects.length > 0) {
            effects.push(...policy.stat_effects);
        } else if (policy.target_stat) {
            effects.push({
                stat_key: policy.target_stat,
                direction: (policy.stat_direction || 'UP').toLowerCase(),
                rate: policy.stat_change_per_tick || 1,
                delay_ticks: 0,
                duration_ticks: policy.duration_months || 12
            });
        }

        if (effects.length === 0) {
            // No stat effects, just mark as processed
            await supabase.from('active_laws').update({ effects_applied_through_tick: currentTick }).eq('id', law.id);
            continue;
        }

        let anyEffectApplied = false;

        // Process each tick that was missed (handles skipped ticks)
        for (let tick = lastApplied + 1; tick <= currentTick; tick++) {
            const ticksSincePassed = tick - passedTick;

            for (const eff of effects) {
                const delay = eff.delay_ticks || 0;
                const duration = eff.duration_ticks || 12;
                const rate = eff.rate || 1;
                const statKey = eff.stat_key;

                // Is this tick within the active window?
                if (ticksSincePassed > delay && ticksSincePassed <= delay + duration) {
                    // Apply the effect
                    const currentVal = nationUpdates[statKey] !== undefined
                        ? nationUpdates[statKey]
                        : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : 50);

                    let newVal;
                    if (eff.direction === 'up') {
                        newVal = currentVal + rate;
                    } else {
                        newVal = currentVal - rate;
                    }

                    // Clamp 0–100
                    newVal = Math.max(0, Math.min(100, newVal));
                    nationUpdates[statKey] = newVal;
                    anyEffectApplied = true;

                    appliedEffects.push({
                        policy: policy.policy_name,
                        stat: statKey,
                        direction: eff.direction,
                        rate: rate,
                        tick: tick,
                        newValue: newVal
                    });
                }
            }
        }

        // Mark this law as processed through current tick
        await supabase.from('active_laws').update({
            effects_applied_through_tick: currentTick
        }).eq('id', law.id);
    }

    // Apply all nation stat updates in one call
    if (Object.keys(nationUpdates).length > 0) {
        await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
    }

    return appliedEffects;
}

/**
 * Process ongoing costs for all active laws in a nation.
 *
 * Deducts ongoing_base_cost (optionally scaled by a stat) from nation's budget.
 * Tracks accumulated cost on active_laws.ongoing_accumulated.
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {number} currentTick - Current tick
 * @returns {Promise<object>}  { totalCost, details }
 */
async function processOngoingCosts(supabase, nation, currentTick) {
    const { data: activeLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', nation.id);

    if (!activeLaws || activeLaws.length === 0) return { totalCost: 0, details: [] };

    let totalCost = 0;
    const details = [];

    for (const law of activeLaws) {
        const policy = law.policies;
        if (!policy) continue;

        const baseCost = policy.ongoing_base_cost || policy.ongoing_cost_per_tick || 0;
        if (baseCost === 0) continue;

        let tickCost = baseCost;

        // Apply scaling if configured
        if (policy.ongoing_scaling_stat && nation[policy.ongoing_scaling_stat] !== undefined) {
            const scalingVal = Number(nation[policy.ongoing_scaling_stat]) || 1;
            tickCost = baseCost * (scalingVal / 50); // Normalize: stat=50 → 1x, stat=100 → 2x
        }

        totalCost += tickCost;

        // Track accumulated cost
        const newAccum = (law.ongoing_accumulated || 0) + tickCost;
        await supabase.from('active_laws').update({
            ongoing_accumulated: newAccum
        }).eq('id', law.id);

        details.push({ policy: policy.policy_name, cost: tickCost });
    }

    // Deduct from nation's budget
    if (totalCost !== 0) {
        const currentBudget = nation.budget || 0;
        const newBudget = currentBudget - totalCost;
        await supabase.from('nations').update({ budget: newBudget }).eq('id', nation.id);
    }

    return { totalCost, details };
}

/**
 * Save a snapshot of nation stats for trend tracking.
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {number} currentTick - Current tick
 */
async function snapshotNationHistory(supabase, nation, currentTick) {
    // Copy all numeric nation fields to history
    const snapshot = { nation_id: nation.id, tick: currentTick };

    // Copy all stat fields (exclude non-stat columns)
    const exclude = ['id', 'name', 'capital', 'government_type', 'created_at', 'updated_at', 'shard_id'];
    for (const [key, val] of Object.entries(nation)) {
        if (!exclude.includes(key) && typeof val === 'number') {
            snapshot[key] = val;
        }
    }

    await supabase.from('nations_history').upsert(snapshot, {
        onConflict: 'nation_id,tick'
    }).catch(err => {
        // History table might not have all columns — log but don't fail
        console.warn('History snapshot warning:', err.message);
    });
}


// ==================== UTILITY FORMATTERS ====================

function formatStatName(stat) {
    return stat.charAt(0).toUpperCase() + stat.slice(1).replace(/_/g, ' ');
}

function formatMinorSector(key) {
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
