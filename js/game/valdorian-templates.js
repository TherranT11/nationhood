/**
 * valdorian-templates.js — The Valdorian News Template System
 *
 * Template definitions, selection engine, word pools, and reporter roster.
 * No AI generation — every article is assembled from pre-written template
 * components selected and filled based on structured event data.
 */

// ════════════════════════════════════════════════════════════════
// SECTION DEFINITIONS
// ════════════════════════════════════════════════════════════════

export const SECTIONS = {
    politics:   { label: 'Politics',   color: '#4A9EFF' },
    economy:    { label: 'Economy',    color: '#4ADE80' },
    military:   { label: 'Military',   color: '#F87171' },
    diplomacy:  { label: 'Diplomacy',  color: '#A78BFA' },
    society:    { label: 'Society',    color: '#FBBF24' },
    sport:      { label: 'Sport',      color: '#2DD4BF' },
    opinion:    { label: 'Opinion',    color: '#94A3B8' },
};

// ════════════════════════════════════════════════════════════════
// REPORTER ROSTER
// ════════════════════════════════════════════════════════════════

export const REPORTERS = {
    politics:  ['Maren Solis', 'Davi Cortes', 'Elena Brandt'],
    economy:   ['Isaak Norden', 'Priya Devar', 'Lukas Fell'],
    military:  ['Kael Ashford', 'Reyna Moss', 'Tobias Greer'],
    diplomacy: ['Amara Osei', 'Julian Weiss', 'Sofía Duarte'],
    society:   ['Lina Vasquez', 'Omar Hadid', 'Clara Engström'],
    sport:     ['Renzo Ferreira', 'Nadia Sokol', 'Tomas Brühl'],
    opinion:   ['The Valdorian Editorial Board'],
};

export function pickReporter(section) {
    const pool = REPORTERS[section] || REPORTERS.politics;
    return pool[Math.floor(Math.random() * pool.length)];
}

// ════════════════════════════════════════════════════════════════
// WORD POOLS
// ════════════════════════════════════════════════════════════════

export const WORD_POOLS = {
    negative_adjectives: [
        'reckless', 'shortsighted', 'cynical', 'dangerous', 'irresponsible',
        'politically motivated', 'misguided', 'counterproductive', 'rash',
        'ill-conceived', 'tone-deaf', 'self-serving',
    ],
    positive_adjectives: [
        'bold', 'historic', 'long-overdue', 'principled', 'courageous',
        'decisive', 'landmark', 'transformative', 'welcome', 'ambitious',
    ],
    negative_framings: {
        politics:   ['political theater', 'electioneering', 'a distraction from real issues', 'partisan maneuvering', 'empty gesture'],
        economy:    ['fiscal fantasy', 'economic recklessness', 'budgetary negligence', 'a handout dressed as policy'],
        military:   ['saber-rattling', 'warmongering', 'dangerous escalation', 'reckless provocation'],
        diplomacy:  ['diplomatic posturing', 'empty symbolism', 'a photo opportunity', 'appeasement in disguise'],
        society:    ['social engineering', 'ideological overreach', 'virtue signaling', 'pandering to special interests'],
    },
    alternative_actions: [
        'immediate parliamentary debate', "the minister's resignation",
        'a full public inquiry', 'a vote of no confidence',
        'an emergency session', 'a complete reversal of policy',
    ],
    crisis_intensifiers: [
        'deepening', 'worsening', 'escalating', 'mounting', 'accelerating',
        'spiraling', 'unprecedented', 'growing',
    ],
    crisis_outcomes_negative: [
        'dire consequences', 'lasting damage', 'irreversible harm',
        'widespread suffering', 'economic devastation', 'social upheaval',
    ],
};

export function drawFromPool(poolName, count = 1) {
    const pool = typeof poolName === 'string' ? WORD_POOLS[poolName] : poolName;
    if (!pool || pool.length === 0) return count === 1 ? '' : [];
    if (count === 1) return pool[Math.floor(Math.random() * pool.length)];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// ════════════════════════════════════════════════════════════════
// TEMPLATE SELECTION ENGINE
// ════════════════════════════════════════════════════════════════

/**
 * Evaluate a single condition against event data.
 * Condition format: { field: "momentum_change", op: ">", value: 5 }
 * Also supports shorthand strings: "momentum_change > 5"
 */
function evaluateCondition(cond, eventData) {
    let field, op, value;
    if (typeof cond === 'string') {
        const m = cond.match(/^(\w+)\s*(>=|<=|>|<|==|!=)\s*(.+)$/);
        if (!m) return false;
        [, field, op, value] = m;
        value = isNaN(Number(value)) ? value.trim() : Number(value);
    } else {
        ({ field, op, value } = cond);
    }

    const actual = eventData[field];
    if (actual === undefined || actual === null) return false;
    const numActual = Number(actual);

    switch (op) {
        case '>':  return numActual > value;
        case '>=': return numActual >= value;
        case '<':  return numActual < value;
        case '<=': return numActual <= value;
        case '==': return actual == value;
        case '!=': return actual != value;
        default:   return false;
    }
}

/**
 * Select one template from a list using weighted random,
 * filtered by conditions evaluated against eventData.
 */
export function selectTemplate(templates, eventData) {
    // Filter to eligible templates
    const eligible = templates.filter(t => {
        if (!t.conditions || t.conditions.length === 0) return true;
        return t.conditions.every(c => evaluateCondition(c, eventData));
    });

    if (eligible.length === 0) return null;

    // Weighted random selection
    const totalWeight = eligible.reduce((s, t) => s + (t.weight || 1), 0);
    let roll = Math.random() * totalWeight;
    for (const t of eligible) {
        roll -= (t.weight || 1);
        if (roll <= 0) return t;
    }
    return eligible[eligible.length - 1];
}

/**
 * Fill template variables: {var_name} → eventData.var_name
 * Also handles word pool draws: {negative_adjective}, {positive_adjective}, etc.
 */
export function fillTemplate(templateStr, eventData) {
    const filled = templateStr.replace(/\{(\w+)\}/g, (match, key) => {
        if (key === 'negative_adjective') return drawFromPool('negative_adjectives');
        if (key === 'positive_adjective') return drawFromPool('positive_adjectives');
        if (key === 'negative_framing') {
            const section = eventData.section || 'politics';
            const pool = WORD_POOLS.negative_framings[section] || WORD_POOLS.negative_framings.politics;
            return drawFromPool(pool);
        }
        if (key === 'alternative_action') return drawFromPool('alternative_actions');
        if (key === 'crisis_intensifier') return drawFromPool('crisis_intensifiers');
        if (eventData[key] !== undefined && eventData[key] !== null && eventData[key] !== '') return String(eventData[key]);
        return ''; // strip unfilled vars instead of leaving raw {placeholder} text
    });
    // Clean up artefacts from stripped vars: double spaces, empty parens, dangling dashes/colons
    return filled.replace(/\s{2,}/g, ' ').replace(/\(\s*\)/g, '').replace(/\s+—\s*$/g, '').replace(/:\s*$/g, '').replace(/^\s+|\s+$/g, '').replace(/\s([.,;])/g, '$1');
}

// ════════════════════════════════════════════════════════════════
// SHARED QUOTE TEMPLATES
// ════════════════════════════════════════════════════════════════

export const QUOTE_TEMPLATES = {
    supportive: [
        '"We welcome this development and hope it marks a new chapter for {nation_name}."',
        '"This is a step in the right direction. The people of {nation_name} have waited long enough."',
        '"{party_name} supports this measure and calls on all parties to do the same."',
        '"Finally, leadership that listens. We commend the government\'s action."',
    ],
    hostile: [
        '{spokesperson} dismissed the move as "{negative_adjective} and {negative_adjective}."',
        '"{negative_framing} — that\'s all this is," said {spokesperson}.',
        '{spokesperson} called it "too little, too late" and demanded {alternative_action}.',
        '"The people see through this," {spokesperson} warned. "{negative_framing} won\'t save them at the ballot box."',
    ],
    neutral: [
        '{party_name} declined to comment.',
        'A {party_name} spokesperson said the party was "monitoring the situation closely."',
        '{party_name} issued a brief statement acknowledging the development without taking a position.',
        '{spokesperson} said the party would "review the details before making a formal response."',
    ],
};

// ════════════════════════════════════════════════════════════════
// DEVELOPING STORY PREFIXES
// ════════════════════════════════════════════════════════════════

export const DEVELOPING_PREFIXES = [
    "In the latest chapter of {nation_name}'s deepening {topic} crisis, ",
    "As the {topic} situation continues to dominate headlines, ",
    "The ongoing {topic} dispute took a new turn this week as ",
    "Adding to months of {topic} turmoil, ",
    "Against the backdrop of an escalating {topic} crisis, ",
];

// ════════════════════════════════════════════════════════════════
// EVENT TYPE REGISTRY
// ════════════════════════════════════════════════════════════════

export const EVENT_TYPES = {
    // ── Political ──
    rally:              { section: 'politics', tier: 2, label: 'Rally' },
    press_conference:   { section: 'politics', tier: 2, label: 'Press Conference' },
    bill_vote_pass:     { section: 'politics', tier: 2, label: 'Bill Vote (Pass)' },
    bill_vote_fail:     { section: 'politics', tier: 2, label: 'Bill Vote (Fail)' },
    scandal:            { section: 'politics', tier: 1, label: 'Scandal Revealed' },
    election:           { section: 'politics', tier: 1, label: 'Election Result' },
    coalition_formed:   { section: 'politics', tier: 2, label: 'Coalition Formed' },
    coalition_collapsed:{ section: 'politics', tier: 1, label: 'Coalition Collapsed' },
    no_confidence:      { section: 'politics', tier: 1, label: 'No-Confidence' },
    impeachment:        { section: 'politics', tier: 1, label: 'Impeachment' },
    endorsement:        { section: 'politics', tier: 2, label: 'Endorsement Deal' },
    voter_outreach:     { section: 'politics', tier: 3, label: 'Voter Outreach' },
    fundraiser:         { section: 'politics', tier: 2, label: 'Fundraiser' },
    issue_statement:    { section: 'politics', tier: 3, label: 'Issue Statement' },
    attack_campaign:    { section: 'politics', tier: 2, label: 'Attack Campaign' },

    // ── Economy ──
    budget_vote:        { section: 'economy', tier: 2, label: 'Budget Vote' },
    economic_crisis:    { section: 'economy', tier: 1, label: 'Economic Crisis' },
    stat_milestone:     { section: 'economy', tier: 2, label: 'Stat Milestone' },
    trade_agreement:    { section: 'economy', tier: 2, label: 'Trade Agreement' },
    central_bank:       { section: 'economy', tier: 2, label: 'Central Bank' },
    sovereign_default:  { section: 'economy', tier: 1, label: 'Sovereign Default' },

    // ── Military & Diplomacy ──
    war_declaration:    { section: 'military',  tier: 1, label: 'War Declaration' },
    war_failed:         { section: 'military',  tier: 1, label: 'War Vote Failed' },
    peace_accepted:     { section: 'military',  tier: 1, label: 'Peace Accepted' },
    alliance_signed:    { section: 'diplomacy', tier: 1, label: 'Alliance Signed' },
    state_visit:        { section: 'diplomacy', tier: 2, label: 'State Visit' },
    io_founded:         { section: 'diplomacy', tier: 1, label: 'IO Founded' },
    ambassador_recalled:{ section: 'diplomacy', tier: 2, label: 'Ambassador Recalled' },
    coup_attempt:       { section: 'military',  tier: 1, label: 'Coup Attempt' },
    military_patrol:    { section: 'military',  tier: 3, label: 'Military Patrol' },
    joint_exercises:    { section: 'diplomacy', tier: 3, label: 'Joint Exercises' },

    // ── Crises ──
    crisis_started:     { section: 'politics', tier: 1, label: 'Crisis Erupts' },
    crisis_ongoing:     { section: 'politics', tier: 2, label: 'Crisis Update' },
    crisis_resolved:    { section: 'politics', tier: 2, label: 'Crisis Resolved' },
    currency_collapse:  { section: 'economy',  tier: 1, label: 'Currency Collapse' },
    hyperinflation:     { section: 'economy',  tier: 1, label: 'Hyperinflation Emergency' },
    debt_crisis:        { section: 'economy',  tier: 1, label: 'Sovereign Debt Crisis' },
    ministry_crisis:    { section: 'politics', tier: 2, label: 'Ministry Crisis' },

    // ── Defaults (inaction) ──
    default_stat_decay:    { section: 'economy',  tier: 3, label: 'Stat Decay' },
    default_momentum_decay:{ section: 'politics', tier: 3, label: 'Momentum Fading' },
    default_budget_stall:  { section: 'economy',  tier: 2, label: 'Budget Stalemate' },
    default_inaction:      { section: 'politics', tier: 3, label: 'Government Inaction' },

    // ── Non-Political ──
    sport_match:        { section: 'sport',   tier: 3, label: 'Sport Match' },
    sport_tournament:   { section: 'sport',   tier: 1, label: 'Tournament Event' },
    weather:            { section: 'society', tier: 3, label: 'Weather' },
    culture:            { section: 'society', tier: 3, label: 'Culture / Society' },
    financial_ticker:   { section: 'economy', tier: 3, label: 'Financial Ticker' },
    ambient:            { section: 'society', tier: 3, label: 'Ambient Blurbs' },
    opinion:            { section: 'opinion', tier: 2, label: 'Opinion / Editorial' },

    // ── Protest ──
    protest_fizzle:         { section: 'politics', tier: 3, label: 'Protest Fizzle' },
    protest_respectable:    { section: 'politics', tier: 2, label: 'Protest Turnout' },
    protest_strong:         { section: 'politics', tier: 2, label: 'Strong Protest' },
    protest_mass:           { section: 'politics', tier: 1, label: 'Mass Demonstration' },
    protest_crisis_started: { section: 'politics', tier: 1, label: 'Protest Crisis' },
    protest_crisis_tick:    { section: 'politics', tier: 2, label: 'Protest Crisis Update' },
    protest_crisis_ended:   { section: 'politics', tier: 2, label: 'Protest Crisis Over' },
    protest_epo_resolved:   { section: 'politics', tier: 1, label: 'Crackdown Ends Protest' },
    protest_epo_escalated:  { section: 'politics', tier: 1, label: 'Crackdown Backfires' },
    protest_emergency:      { section: 'politics', tier: 1, label: 'National Emergency' },
    protest_called_off:     { section: 'politics', tier: 2, label: 'Protest Called Off' },
    protest_public_address: { section: 'politics', tier: 3, label: 'Public Address' },
};

// ════════════════════════════════════════════════════════════════
// HEADLINE TEMPLATES
// ════════════════════════════════════════════════════════════════

export const HEADLINE_TEMPLATES = {

    // ─────────── RALLY ───────────
    rally: [
        { id: 'rally_h_01', template: "{party_name} Holds Rally: '{subject_name}'", conditions: [], weight: 1 },
        { id: 'rally_h_02', template: "Thousands Turn Out for {party_name} Rally on {subject_name}", conditions: [{ field: 'momentum_change', op: '>', value: 5 }], weight: 2 },
        { id: 'rally_h_03', template: "{party_name} Rallies Supporters Around {ideology_tag} Message", conditions: [{ field: 'momentum_change', op: '>', value: 5 }], weight: 2 },
        { id: 'rally_h_04', template: "{party_name} Rally Draws Modest Crowd — '{subject_name}' Message Falls Flat", conditions: [{ field: 'momentum_change', op: '<', value: 3 }], weight: 1 },
        { id: 'rally_h_05', template: "'{subject_name}' — {party_name} Rally Divides Electorate", conditions: [{ field: 'blocs_alienated', op: '>', value: 2 }], weight: 3 },
    ],

    // ─────────── PRESS CONFERENCE ───────────
    press_conference: [
        { id: 'press_h_01', template: "{leader_name} Addresses Nation on {subject_name}", conditions: [], weight: 1 },
        { id: 'press_h_02', template: "{party_name} Takes Bold Stance on {subject_name}", conditions: [{ field: 'momentum_change', op: '>', value: 4 }], weight: 2 },
        { id: 'press_h_03', template: "{leader_name} Faces Tough Questions on {subject_name}", conditions: [{ field: 'momentum_change', op: '<', value: 2 }], weight: 1 },
        { id: 'press_h_04', template: "Press Conference: {party_name} Outlines Vision for {subject_name}", conditions: [], weight: 1 },
        { id: 'press_h_05', template: "'{subject_name}' — {leader_name} Sets New Course", conditions: [{ field: 'momentum_change', op: '>', value: 6 }], weight: 2 },
    ],

    // ─────────── BILL VOTE (PASS) ───────────
    bill_vote_pass: [
        { id: 'bill_pass_h_01', template: "Parliament Passes {bill_name}", conditions: [{ field: 'bill_name', op: '!=', value: '' }], weight: 1 },
        { id: 'bill_pass_h_01b', template: "Parliament Passes New Legislation", conditions: [], weight: 1 },
        { id: 'bill_pass_h_02', template: "{bill_name} Clears Parliament in Decisive Vote", conditions: [{ field: 'bill_name', op: '!=', value: '' }, { field: 'margin', op: '>', value: 20 }], weight: 2 },
        { id: 'bill_pass_h_03', template: "{bill_name} Squeaks Through Parliament — Narrow Victory for {party_name}", conditions: [{ field: 'bill_name', op: '!=', value: '' }, { field: 'margin', op: '<', value: 5 }, { field: 'party_name', op: '!=', value: '' }], weight: 2 },
        { id: 'bill_pass_h_03b', template: "{bill_name} Squeaks Through Parliament — Narrow Victory", conditions: [{ field: 'bill_name', op: '!=', value: '' }, { field: 'margin', op: '<', value: 5 }], weight: 1 },
        { id: 'bill_pass_h_04', template: "Landmark: {bill_name} Becomes Law After Contentious Debate", conditions: [{ field: 'bill_name', op: '!=', value: '' }, { field: 'defection_count', op: '>', value: 3 }], weight: 2 },
    ],

    // ─────────── BILL VOTE (FAIL) ───────────
    bill_vote_fail: [
        { id: 'bill_fail_h_01', template: "Parliament Rejects {bill_name}", conditions: [{ field: 'bill_name', op: '!=', value: '' }], weight: 1 },
        { id: 'bill_fail_h_01b', template: "Parliament Rejects Proposed Legislation", conditions: [], weight: 1 },
        { id: 'bill_fail_h_02', template: "{bill_name} Defeated in Parliament — Government Embarrassed", conditions: [{ field: 'bill_name', op: '!=', value: '' }, { field: 'defection_count', op: '>', value: 3 }], weight: 2 },
        { id: 'bill_fail_h_03', template: "{bill_name} Falls Short — Coalition Fractures on Display", conditions: [{ field: 'bill_name', op: '!=', value: '' }, { field: 'defection_count', op: '>', value: 5 }], weight: 3 },
        { id: 'bill_fail_h_04', template: "Bill Blocked: {bill_name} Voted Down", conditions: [{ field: 'bill_name', op: '!=', value: '' }], weight: 1 },
    ],

    // ─────────── ELECTION ───────────
    election: [
        { id: 'election_h_01', template: "{winner_name} Wins Election — {winner_seats} Seats", conditions: [{ field: 'winner_name', op: '!=', value: '' }], weight: 2 },
        { id: 'election_h_02', template: "Landslide: {winner_name} Sweeps to Power", conditions: [{ field: 'margin', op: '>', value: 20 }], weight: 3 },
        { id: 'election_h_03', template: "Razor-Thin: {winner_name} Edges Out {runner_up_name}", conditions: [{ field: 'margin', op: '<', value: 3 }], weight: 3 },
        { id: 'election_h_04', template: "Election Night: {winner_name} Claims Victory in {nation_name}", conditions: [{ field: 'winner_name', op: '!=', value: '' }], weight: 1 },
        { id: 'election_h_05', template: "Upset: {winner_name} Topples {incumbent_name} in Stunning Result", conditions: [{ field: 'is_upset', op: '==', value: true }], weight: 3 },
        { id: 'election_h_06', template: "Election Results In: {nation_name} Voters Head to the Polls", conditions: [], weight: 1 },
        { id: 'election_h_07', template: "{nation_name} Holds Elections — New Government Expected", conditions: [], weight: 1 },
    ],

    // ─────────── COALITION ───────────
    coalition_formed: [
        { id: 'coal_h_01', template: "New Government: {pm_name} Forms Coalition", conditions: [], weight: 1 },
        { id: 'coal_h_02', template: "{coalition_parties} Form Governing Alliance — {pm_name} to Lead", conditions: [], weight: 1 },
        { id: 'coal_h_03', template: "Unlikely Alliance: {coalition_parties} Join Forces", conditions: [{ field: 'ideology_gap', op: '>', value: 30 }], weight: 2 },
        { id: 'coal_h_04', template: "{pm_name} Secures Majority — Coalition of {coalition_size} Parties", conditions: [], weight: 1 },
    ],

    coalition_collapsed: [
        { id: 'coal_col_h_01', template: "Government Collapses — Coalition Dissolved", conditions: [], weight: 1 },
        { id: 'coal_col_h_02', template: "{defecting_party} Walks Out — Government Falls", conditions: [], weight: 2 },
        { id: 'coal_col_h_03', template: "Coalition in Ruins: {pm_name} Loses Majority", conditions: [], weight: 1 },
        { id: 'coal_col_h_04', template: "Political Crisis: Government Coalition Splinters", conditions: [], weight: 1 },
    ],

    // ─────────── NO-CONFIDENCE ───────────
    no_confidence: [
        { id: 'noc_h_01', template: "No-Confidence Motion Filed Against {pm_name}", conditions: [{ field: 'status', op: '==', value: 'filed' }], weight: 1 },
        { id: 'noc_h_02', template: "No-Confidence Vote Succeeds — {pm_name} Ousted", conditions: [{ field: 'status', op: '==', value: 'passed' }], weight: 3 },
        { id: 'noc_h_03', template: "{pm_name} Survives No-Confidence Vote", conditions: [{ field: 'status', op: '==', value: 'failed' }], weight: 2 },
        { id: 'noc_h_04', template: "Parliament Turns on {pm_name} — No-Confidence Succeeds {vote_for}-{vote_against}", conditions: [{ field: 'status', op: '==', value: 'passed' }, { field: 'vote_for', op: '!=', value: '' }], weight: 2 },
        { id: 'noc_h_05', template: "{pm_name} Hangs On — No-Confidence Defeated by {margin} Votes", conditions: [{ field: 'status', op: '==', value: 'failed' }, { field: 'margin', op: '!=', value: '' }], weight: 1 },
        { id: 'noc_h_06', template: "No-Confidence Vote Shakes {nation_name} Government", conditions: [], weight: 1 },
    ],

    // ─────────── IMPEACHMENT ───────────
    impeachment: [
        { id: 'imp_h_01', template: "Impeachment Motion Filed Against President {president_name}", conditions: [{ field: 'status', op: '==', value: 'filed' }], weight: 1 },
        { id: 'imp_h_02', template: "Legislature Votes to Impeach President {president_name}", conditions: [{ field: 'status', op: '==', value: 'impeached' }], weight: 3 },
        { id: 'imp_h_03', template: "Impeachment Motion Fails — President {president_name} Vindicated", conditions: [{ field: 'status', op: '==', value: 'motion_failed' }], weight: 2 },
        { id: 'imp_h_04', template: "President {president_name} Convicted and Removed From Office", conditions: [{ field: 'status', op: '==', value: 'convicted' }], weight: 3 },
        { id: 'imp_h_05', template: "President {president_name} Acquitted — Survives Impeachment Trial", conditions: [{ field: 'status', op: '==', value: 'acquitted' }], weight: 2 },
        { id: 'imp_h_06', template: "Charges Filed: {charges} — Impeachment Proceedings Begin", conditions: [{ field: 'status', op: '==', value: 'filed' }], weight: 2 },
        { id: 'imp_h_07', template: "Historic Vote: {president_name} Impeached {vote_for}-{vote_against}", conditions: [{ field: 'status', op: '==', value: 'impeached' }, { field: 'vote_for', op: '!=', value: '' }], weight: 2 },
        { id: 'imp_h_08', template: "VP {vp_name} Sworn In as Acting President After {president_name} Removed", conditions: [{ field: 'status', op: '==', value: 'convicted' }], weight: 2 },
        { id: 'imp_h_09', template: "Impeachment Crisis Rocks {nation_name}", conditions: [], weight: 1 },
    ],

    // ─────────── ENDORSEMENT ───────────
    endorsement: [
        { id: 'endorse_h_01', template: "{bloc_name} Endorses {party_name}", conditions: [{ field: 'bloc_name', op: '!=', value: '' }], weight: 2 },
        { id: 'endorse_h_02', template: "{bloc_name} Backs {party_name} — Major Boost Ahead of Election", conditions: [{ field: 'election_within', op: '<', value: 10 }], weight: 2 },
        { id: 'endorse_h_03', template: "Surprise Endorsement: {bloc_name} Breaks with Tradition for {party_name}", conditions: [{ field: 'is_surprise', op: '==', value: true }], weight: 3 },
        { id: 'endorse_h_04', template: "{party_name} Secures Key Endorsement in {nation_name}", conditions: [], weight: 1 },
        { id: 'endorse_h_05', template: "New Endorsement Shakes Up {nation_name} Politics", conditions: [], weight: 1 },
    ],

    // ─────────── ATTACK CAMPAIGN ───────────
    attack_campaign: [
        { id: 'attack_h_01', template: "{party_name} Launches Attack on {target_name}", conditions: [], weight: 1 },
        { id: 'attack_h_02', template: "Devastating: {party_name} Exposes {target_name}'s {vector_name}", conditions: [{ field: 'outcome', op: '==', value: 'devastating' }], weight: 3 },
        { id: 'attack_h_03', template: "Attack Backfires: {party_name}'s Campaign Against {target_name} Draws Sympathy", conditions: [{ field: 'outcome', op: '==', value: 'backfire' }], weight: 3 },
        { id: 'attack_h_04', template: "Mudslinging: {party_name} and {target_name} Trade Blows", conditions: [{ field: 'outcome', op: '==', value: 'mutual' }], weight: 2 },
    ],

    // ─────────── VOTER OUTREACH ───────────
    voter_outreach: [
        { id: 'outreach_h_01', template: "{party_name} Launches Outreach in {bloc_name} Communities", conditions: [{ field: 'bloc_name', op: '!=', value: '' }], weight: 2 },
        { id: 'outreach_h_02', template: "{party_name} Canvassers Hit the Streets Targeting {bloc_name} Voters", conditions: [{ field: 'bloc_name', op: '!=', value: '' }], weight: 1 },
        { id: 'outreach_h_03', template: "{party_name} Expands Ground Game with {bloc_name} Outreach Drive", conditions: [{ field: 'effect', op: '>', value: 3 }], weight: 2 },
        { id: 'outreach_h_04', template: "{party_name} Launches Voter Outreach Campaign in {nation_name}", conditions: [], weight: 1 },
    ],

    // ─────────── FUNDRAISER ───────────
    fundraiser: [
        { id: 'fund_h_01', template: "{party_name} Raises {amount} in Fundraising Drive", conditions: [], weight: 1 },
        { id: 'fund_h_02', template: "Donors Flock to {party_name} — {amount} Raised", conditions: [{ field: 'amount_numeric', op: '>', value: 200000 }], weight: 2 },
        { id: 'fund_h_03', template: "{party_name} Fundraiser Falls Short of Expectations", conditions: [{ field: 'amount_numeric', op: '<', value: 50000 }], weight: 2 },
    ],

    // ─────────── ISSUE STATEMENT ───────────
    issue_statement: [
        { id: 'issue_h_01', template: "{party_name} Calls for Action on {subject_name}", conditions: [], weight: 1 },
        { id: 'issue_h_02', template: "{leader_name}: '{subject_name}' Must Be National Priority", conditions: [], weight: 1 },
    ],

    // ─────────── SCANDAL ───────────
    scandal: [
        { id: 'scandal_h_01', template: "Scandal: {party_name} Rocked by {scandal_type} Allegations", conditions: [{ field: 'scandal_type', op: '!=', value: '' }], weight: 2 },
        { id: 'scandal_h_02', template: "{leader_name} Under Fire — {scandal_type} Claims Surface", conditions: [{ field: 'scandal_type', op: '!=', value: '' }], weight: 1 },
        { id: 'scandal_h_03', template: "Scandal Rocks {nation_name} Politics", conditions: [], weight: 1 },
        { id: 'scandal_h_04', template: "Leaked Documents Reveal {party_name} {scandal_type}", conditions: [{ field: 'severity', op: '>', value: 7 }], weight: 3 },
        { id: 'scandal_h_05', template: "Political Firestorm: Scandal Engulfs {nation_name} Government", conditions: [], weight: 1 },
    ],

    // ─────────── BUDGET ───────────
    budget_vote: [
        { id: 'budget_h_01', template: "Parliament Passes {nation_name} Budget", conditions: [{ field: 'status', op: '==', value: 'passed' }], weight: 1 },
        { id: 'budget_h_02', template: "Budget Rejected — Government Faces Shutdown Threat", conditions: [{ field: 'status', op: '==', value: 'failed' }], weight: 2 },
        { id: 'budget_h_03', template: "{nation_name} Budget Passes with Slim Majority", conditions: [{ field: 'margin', op: '<', value: 5 }], weight: 2 },
        { id: 'budget_h_04', template: "Historic Budget: {nation_name} Approves Record Spending", conditions: [{ field: 'total_spending', op: '>', value: 1000000 }], weight: 2 },
        { id: 'budget_h_05', template: "{nation_name} Budget Vote: Legislature Decides", conditions: [], weight: 1 },
    ],

    // ─────────── STAT MILESTONE ───────────
    stat_milestone: [
        { id: 'stat_m_h_01', template: "{stat_name} Reaches New Threshold in {nation_name}", conditions: [], weight: 1 },
        { id: 'stat_m_h_02', template: "Alarm: {stat_name} Hits Critical Level in {nation_name}", conditions: [{ field: 'is_negative', op: '==', value: true }], weight: 2 },
        { id: 'stat_m_h_03', template: "{nation_name} Celebrates: {stat_name} at Record High", conditions: [{ field: 'is_positive', op: '==', value: true }], weight: 2 },
        { id: 'stat_m_h_04', template: "{nation_name}: {stat_name} Indicator Shifts", conditions: [], weight: 1 },
    ],

    // ─────────── ECONOMIC CRISIS ───────────
    economic_crisis: [
        { id: 'econ_cr_h_01', template: "{nation_name} Enters Economic Crisis — Markets Tumble", conditions: [], weight: 1 },
        { id: 'econ_cr_h_02', template: "Economic Emergency: {crisis_name} Grips {nation_name}", conditions: [], weight: 2 },
        { id: 'econ_cr_h_03', template: "Recession Fears Mount as {nation_name} Economy Falters", conditions: [], weight: 1 },
        { id: 'econ_cr_h_04', template: "Markets in Freefall: {crisis_name} Deepens", conditions: [{ field: 'severity', op: '==', value: 'critical' }], weight: 3 },
        { id: 'econ_cr_h_05', template: "{nation_name} Economy in Crisis — Government Under Pressure to Act", conditions: [], weight: 1 },
    ],

    // ─────────── TRADE AGREEMENT ───────────
    trade_agreement: [
        { id: 'trade_h_01', template: "{nation_name} Signs Trade Deal with {partner_name}", conditions: [], weight: 1 },
        { id: 'trade_h_02', template: "New Trade Pact: {nation_name} and {partner_name} Open Markets", conditions: [], weight: 1 },
        { id: 'trade_h_03', template: "Historic Trade Agreement Between {nation_name} and {partner_name}", conditions: [{ field: 'value', op: '>', value: 500000 }], weight: 2 },
    ],

    // ─────────── CENTRAL BANK ───────────
    central_bank: [
        { id: 'cb_h_01', template: "Central Bank Adjusts Rates — Markets React", conditions: [], weight: 1 },
        { id: 'cb_h_02', template: "Central Bank Warns of {crisis_intensifier} Economic Pressures", conditions: [{ field: 'gdp_growth', op: '<', value: 35 }], weight: 2 },
        { id: 'cb_h_03', template: "Interest Rate Decision: Central Bank Holds Steady", conditions: [], weight: 1 },
    ],

    // ─────────── SOVEREIGN DEFAULT ───────────
    sovereign_default: [
        { id: 'default_h_01', template: "{nation_name} Defaults on Sovereign Debt", conditions: [{ field: 'default_type', op: '==', value: 'full' }], weight: 3 },
        { id: 'default_h_02', template: "{nation_name} Restructures Debt — Partial Default Declared", conditions: [{ field: 'default_type', op: '==', value: 'partial_restructuring' }], weight: 2 },
        { id: 'default_h_03', template: "Financial Catastrophe: {nation_name} Cannot Pay Its Debts", conditions: [], weight: 1 },
        { id: 'default_h_04', template: "Creditors Stunned as {nation_name} Declares Sovereign Default", conditions: [], weight: 2 },
    ],

    // ─────────── WAR ───────────
    war_declaration: [
        { id: 'war_h_01', template: "{declarer} Declares War on {target}", conditions: [], weight: 1 },
        { id: 'war_h_02', template: "War: {declarer} Launches Military Action Against {target}", conditions: [], weight: 2 },
        { id: 'war_h_03', template: "Parliament Authorizes War — {declarer} to Strike {target}", conditions: [], weight: 1 },
        { id: 'war_h_04', template: "{declarer_pm}: 'We Have No Choice' — War Declared on {target}", conditions: [], weight: 2 },
        { id: 'war_h_05', template: "Continental Crisis: {declarer} Goes to War", conditions: [], weight: 1 },
    ],

    war_failed: [
        { id: 'war_fail_h_01', template: "Parliament Blocks War — {declarer} Cannot Attack {target}", conditions: [], weight: 1 },
        { id: 'war_fail_h_02', template: "War Vote Fails: {declarer} Pulls Back from Brink", conditions: [], weight: 2 },
        { id: 'war_fail_h_03', template: "Parliament Says No: War Motion Defeated {vote_against}-{vote_for}", conditions: [{ field: 'vote_for', op: '!=', value: '' }], weight: 1 },
        { id: 'war_fail_h_04', template: "{declarer_pm} Humiliated as War Resolution Fails", conditions: [{ field: 'margin', op: '>', value: 15 }], weight: 2 },
    ],

    peace_accepted: [
        { id: 'peace_h_01', template: "Peace: {nation_a} and {nation_b} Sign Agreement", conditions: [], weight: 1 },
        { id: 'peace_h_02', template: "War Over: {nation_a} and {nation_b} Agree to Terms", conditions: [], weight: 2 },
        { id: 'peace_h_03', template: "Historic Peace Accord Ends {war_duration}-Tick Conflict", conditions: [{ field: 'war_duration', op: '>', value: 10 }], weight: 3 },
        { id: 'peace_h_04', template: "Guns Fall Silent: Peace at Last Between {nation_a} and {nation_b}", conditions: [], weight: 1 },
        { id: 'peace_h_05', template: "Ceasefire Becomes Peace — {nation_a} and {nation_b} Lay Down Arms", conditions: [], weight: 1 },
    ],

    // ─────────── DIPLOMACY ───────────
    alliance_signed: [
        { id: 'alliance_h_01', template: "{nation_a} and {nation_b} Sign {alliance_type}", conditions: [], weight: 1 },
        { id: 'alliance_h_02', template: "New Alliance: {nation_a} and {nation_b} Form Pact", conditions: [], weight: 1 },
        { id: 'alliance_h_03', template: "Mutual Defense: {nation_a} and {nation_b} Pledge Military Support", conditions: [{ field: 'alliance_tier', op: '==', value: 3 }], weight: 3 },
        { id: 'alliance_h_04', template: "Strategic Partnership: {nation_a} and {nation_b} Deepen Ties", conditions: [{ field: 'alliance_tier', op: '==', value: 1 }], weight: 1 },
        { id: 'alliance_h_05', template: "Continental Shift: {nation_a} and {nation_b} Forge Alliance", conditions: [], weight: 1 },
    ],

    state_visit: [
        { id: 'sv_h_01', template: "{visitor_pm} Visits {host_nation} for State Talks", conditions: [], weight: 1 },
        { id: 'sv_h_02', template: "Historic Visit: {visitor_nation} Leader Received in {host_nation}", conditions: [{ field: 'is_first', op: '==', value: true }], weight: 3 },
        { id: 'sv_h_03', template: "{visitor_nation} and {host_nation} Hold Summit — Trade and Security on Agenda", conditions: [], weight: 1 },
    ],

    io_founded: [
        { id: 'io_h_01', template: "New International Body: {io_name} Founded", conditions: [], weight: 1 },
        { id: 'io_h_02', template: "{founder_nations} Launch {io_name} — New Era of Cooperation", conditions: [], weight: 2 },
        { id: 'io_h_03', template: "{io_name} Established with {member_count} Founding Members", conditions: [], weight: 1 },
        { id: 'io_h_04', template: "Continental Milestone: {io_name} International Organization Created", conditions: [], weight: 1 },
    ],

    ambassador_recalled: [
        { id: 'amb_h_01', template: "{nation_a} Recalls Ambassador from {nation_b}", conditions: [], weight: 1 },
        { id: 'amb_h_02', template: "Diplomatic Rift: {nation_a} Pulls Ambassador from {nation_b}", conditions: [], weight: 2 },
    ],

    coup_attempt: [
        { id: 'coup_h_01', template: "Coup Attempt in {nation_name}", conditions: [], weight: 1 },
        { id: 'coup_h_02', template: "Military Seizes Power in {nation_name}", conditions: [{ field: 'success', op: '==', value: true }], weight: 3 },
        { id: 'coup_h_03', template: "Failed Coup: {nation_name} Government Survives Takeover Attempt", conditions: [{ field: 'success', op: '==', value: false }], weight: 3 },
        { id: 'coup_h_04', template: "Tanks in the Streets: Coup Unfolds in {nation_name}", conditions: [], weight: 2 },
        { id: 'coup_h_05', template: "{leader_name} Deposed in Military Coup", conditions: [{ field: 'success', op: '==', value: true }], weight: 2 },
    ],

    military_patrol: [
        { id: 'patrol_h_01', template: "{nation_name} Military Conducts Routine Patrol Near {region}", conditions: [], weight: 1 },
        { id: 'patrol_h_02', template: "Border Patrol: {nation_name} Forces Active Near {region}", conditions: [], weight: 1 },
    ],

    joint_exercises: [
        { id: 'exercise_h_01', template: "{nation_a} and {nation_b} Conduct Joint Military Exercises", conditions: [], weight: 1 },
        { id: 'exercise_h_02', template: "Show of Strength: {nation_a} and {nation_b} Hold War Games", conditions: [], weight: 1 },
    ],

    // ════════════════════════════════════════════════════════════
    // CRISIS TEMPLATES
    // ════════════════════════════════════════════════════════════

    crisis_started: [
        { id: 'crisis_start_h_01', template: "CRISIS: {crisis_name} Engulfs {nation_name}", conditions: [], weight: 1 },
        { id: 'crisis_start_h_02', template: "{nation_name} Plunged Into {crisis_name}", conditions: [], weight: 2 },
        { id: 'crisis_start_h_03', template: "Emergency Declared: {crisis_name} Hits {nation_name}", conditions: [{ field: 'severity', op: '==', value: 'critical' }], weight: 3 },
        { id: 'crisis_start_h_04', template: "Breaking: {crisis_name} — {nation_name} in Turmoil", conditions: [{ field: 'severity', op: '==', value: 'severe' }], weight: 2 },
        { id: 'crisis_start_h_05', template: "{crisis_name}: Experts Warn of {crisis_intensifier} Consequences", conditions: [], weight: 1 },
    ],

    crisis_ongoing: [
        { id: 'crisis_ong_h_01', template: "{crisis_name} Continues to Ravage {nation_name} — No End in Sight", conditions: [{ field: 'duration_ticks', op: '>', value: 5 }], weight: 3 },
        { id: 'crisis_ong_h_02', template: "Week {duration_ticks} of {crisis_name}: {nation_name} Struggles to Cope", conditions: [], weight: 1 },
        { id: 'crisis_ong_h_03', template: "{crisis_name} Deepens — Government Under Growing Pressure", conditions: [{ field: 'approval_delta', op: '<', value: -5 }], weight: 2 },
        { id: 'crisis_ong_h_04', template: "Analysts: {crisis_name} Could Last Months Without Policy Change", conditions: [{ field: 'duration_ticks', op: '>', value: 8 }], weight: 2 },
    ],

    crisis_resolved: [
        { id: 'crisis_res_h_01', template: "{nation_name} Emerges from {crisis_name}", conditions: [], weight: 1 },
        { id: 'crisis_res_h_02', template: "Crisis Over: {crisis_name} Resolved After {duration_ticks} Ticks", conditions: [], weight: 2 },
        { id: 'crisis_res_h_03', template: "Relief: {crisis_name} Ends in {nation_name} — Recovery Begins", conditions: [], weight: 1 },
        { id: 'crisis_res_h_04', template: "{pm_name} Claims Credit as {crisis_name} Ends", conditions: [], weight: 2 },
    ],

    currency_collapse: [
        { id: 'currency_h_01', template: "CURRENCY CRISIS: {currency_name} in Freefall", conditions: [], weight: 1 },
        { id: 'currency_h_02', template: "{nation_name} Currency Collapses — Emergency Measures Expected", conditions: [], weight: 2 },
        { id: 'currency_h_03', template: "{currency_name} Hits Record Low — Capital Flight Accelerates", conditions: [], weight: 2 },
        { id: 'currency_h_04', template: "Markets Panic: {nation_name} Currency Drops Below Critical Level", conditions: [], weight: 1 },
    ],

    hyperinflation: [
        { id: 'hyper_h_01', template: "HYPERINFLATION: Prices Soar in {nation_name}", conditions: [], weight: 1 },
        { id: 'hyper_h_02', template: "{nation_name} Enters Hyperinflation — Cost of Living Spirals", conditions: [], weight: 2 },
        { id: 'hyper_h_03', template: "Bread Lines Form as Hyperinflation Ravages {nation_name}", conditions: [{ field: 'inflation_value', op: '>', value: 90 }], weight: 3 },
        { id: 'hyper_h_04', template: "Economic Catastrophe: {nation_name} Inflation Exceeds {inflation_value}%", conditions: [], weight: 1 },
    ],

    debt_crisis: [
        { id: 'debt_h_01', template: "DEBT CRISIS: {nation_name} Finances on Brink of Collapse", conditions: [], weight: 1 },
        { id: 'debt_h_02', template: "{nation_name} Drowning in Debt — Creditors Demand Action", conditions: [], weight: 2 },
        { id: 'debt_h_03', template: "Sovereign Debt Crisis Grips {nation_name} — Default Looms", conditions: [], weight: 2 },
        { id: 'debt_h_04', template: "Fiscal Emergency: {nation_name} Debt-to-GDP Exceeds {debt_to_gdp}%", conditions: [], weight: 1 },
    ],

    ministry_crisis: [
        { id: 'min_cr_h_01', template: "{ministry_name} Ministry in Crisis — Funding at Critical Low", conditions: [], weight: 1 },
        { id: 'min_cr_h_02', template: "{nation_name}'s {ministry_name} Sector Collapsing Under Neglect", conditions: [], weight: 2 },
        { id: 'min_cr_h_03', template: "Public Outcry: {ministry_name} Services Deteriorate to Crisis Level", conditions: [], weight: 1 },
    ],

    // ════════════════════════════════════════════════════════════
    // DEFAULT / INACTION TEMPLATES
    // ════════════════════════════════════════════════════════════

    default_stat_decay: [
        { id: 'decay_h_01', template: "{stat_name} Slips in {nation_name} — No Government Response", conditions: [], weight: 1 },
        { id: 'decay_h_02', template: "Indicators Decline: {stat_name} Drops to {stat_value}", conditions: [], weight: 1 },
        { id: 'decay_h_03', template: "{nation_name} {stat_name} Drifts Lower Amid Policy Vacuum", conditions: [{ field: 'decay_amount', op: '<', value: -2 }], weight: 2 },
    ],

    default_momentum_decay: [
        { id: 'momentum_decay_h_01', template: "{party_name} Fades from Headlines — Momentum Wanes", conditions: [], weight: 1 },
        { id: 'momentum_decay_h_02', template: "Quiet Week for {party_name} — Public Attention Shifts", conditions: [], weight: 1 },
        { id: 'momentum_decay_h_03', template: "{party_name} Loses Ground as Rivals Dominate News Cycle", conditions: [{ field: 'rival_active', op: '==', value: true }], weight: 2 },
    ],

    default_budget_stall: [
        { id: 'budget_stall_h_01', template: "Budget Gridlock Continues in {nation_name}", conditions: [], weight: 1 },
        { id: 'budget_stall_h_02', template: "No Budget in Sight — {nation_name} Parliament Remains Deadlocked", conditions: [], weight: 2 },
        { id: 'budget_stall_h_03', template: "Fiscal Paralysis: {nation_name} Enters Tick {stall_duration} Without Budget", conditions: [{ field: 'stall_duration', op: '>', value: 3 }], weight: 3 },
        { id: 'budget_stall_h_04', template: "Opposition Blames {pm_name} for Budget Impasse", conditions: [], weight: 1 },
    ],

    default_inaction: [
        { id: 'inaction_h_01', template: "Government Quiet as {issue_name} Festers", conditions: [], weight: 1 },
        { id: 'inaction_h_02', template: "{pm_name} Criticized for Inaction on {issue_name}", conditions: [], weight: 2 },
        { id: 'inaction_h_03', template: "Editorial: Why Isn't {nation_name}'s Government Acting?", conditions: [], weight: 1 },
        { id: 'inaction_h_04', template: "{nation_name} Drifts as Government Takes No Action", conditions: [], weight: 1 },
    ],

    // ─────────── NON-POLITICAL ───────────
    sport_match: [
        { id: 'sport_h_01', template: "{home_team} {result_verb} {away_team} {score} in {competition}", conditions: [], weight: 1 },
        { id: 'sport_h_02', template: "{notable_player} Stars as {home_team} Beat {away_team} at {venue}", conditions: [{ field: 'result', op: '==', value: 'home_win' }], weight: 2 },
        { id: 'sport_h_03', template: "Upset: {away_team} Stuns {home_team} {score} at {venue}", conditions: [{ field: 'result', op: '==', value: 'away_win' }], weight: 2 },
        { id: 'sport_h_04', template: "Honors Even: {home_team} and {away_team} Share Points", conditions: [{ field: 'result', op: '==', value: 'draw' }], weight: 1 },
    ],

    sport_tournament: [
        { id: 'tourn_h_01', template: "{home_team} Crowned {competition} Champions", conditions: [{ field: 'is_final', op: '==', value: true }], weight: 3 },
        { id: 'tourn_h_02', template: "{competition}: {winner} Advances to Next Round", conditions: [], weight: 1 },
        { id: 'tourn_h_03', template: "Heartbreak for {loser}: {winner} Win {competition} on Home Soil", conditions: [{ field: 'is_final', op: '==', value: true }], weight: 2 },
        { id: 'tourn_h_04', template: "{competition} Underway — {participant_count} Nations Compete", conditions: [{ field: 'is_opening', op: '==', value: true }], weight: 2 },
        { id: 'tourn_h_05', template: "Historic: {winner} Claims First-Ever {competition} Title", conditions: [{ field: 'is_first_title', op: '==', value: true }], weight: 3 },
    ],

    weather: [
        { id: 'weather_h_01', template: "Severe storms forecast for {region}. Travel advisories issued.", conditions: [], weight: 1 },
        { id: 'weather_h_02', template: "Heatwave continues across {region} — temperatures expected to reach {temp}°.", conditions: [], weight: 1 },
        { id: 'weather_h_03', template: "Heavy rainfall in {region} raises flood concerns.", conditions: [], weight: 1 },
    ],

    culture: [
        { id: 'culture_h_01', template: "National Museum opens new exhibition on {era} artifacts.", conditions: [], weight: 1 },
        { id: 'culture_h_02', template: "{city} hosts annual {festival_name}. Record crowds expected.", conditions: [], weight: 1 },
        { id: 'culture_h_03', template: "Renowned author {author_name} releases new novel to critical acclaim.", conditions: [], weight: 1 },
    ],

    financial_ticker: [
        { id: 'ticker_h_01', template: "Currency: {currency_name} {direction} {percentage}% against {foreign_currency}.", conditions: [], weight: 1 },
        { id: 'ticker_h_02', template: "Stock exchange closes {direction} at {index_value}. {sector} leads.", conditions: [], weight: 1 },
        { id: 'ticker_h_03', template: "Consumer confidence index: {value}. {direction} for {consecutive_count} months.", conditions: [], weight: 1 },
    ],

    ambient: [
        { id: 'ambient_h_01', template: "Ferry services between {city_a} and {city_b} resume after maintenance.", conditions: [], weight: 1 },
        { id: 'ambient_h_02', template: "New rail link between {city_a} and {city_b} enters planning phase.", conditions: [], weight: 1 },
        { id: 'ambient_h_03', template: "{city} celebrates founding anniversary with public holiday.", conditions: [], weight: 1 },
        { id: 'ambient_h_04', template: "Rare {animal} spotted in {region} national park. Conservationists optimistic.", conditions: [], weight: 1 },
        { id: 'ambient_h_05', template: "Population census results expected next month. Preliminary data suggests growth in {region}.", conditions: [], weight: 1 },
        { id: 'ambient_h_06', template: "Memorial service held for victims of the {year} {event_name}.", conditions: [], weight: 1 },
        { id: 'ambient_h_07', template: "Housing starts {direction} {percentage}% in {region}. Analysts cite {reason}.", conditions: [], weight: 1 },
        { id: 'ambient_h_08', template: "Central Bank reserves at {currency_symbol}{amount}. {direction} from last quarter.", conditions: [], weight: 1 },
    ],

    opinion: [
        { id: 'opinion_h_01', template: "The Case For — and Against — {decision_description}", conditions: [], weight: 1 },
        { id: 'opinion_h_02', template: "Editorial: {nation_name} at a Crossroads on {topic}", conditions: [], weight: 2 },
        { id: 'opinion_h_03', template: "Analysis: What {topic} Means for {nation_name}'s Future", conditions: [], weight: 1 },
        { id: 'opinion_h_04', template: "Opinion: The Cost of Inaction on {topic}", conditions: [], weight: 1 },
    ],

    // ─────────── PROTEST: FIZZLE (Tier 1-2) ───────────
    protest_fizzle: [
        { id: 'pf_h_01', template: "{party_name} Protest Fizzles — Sparse Turnout Embarrasses Opposition", conditions: [{ field: 'tier', op: '==', value: 1 }], weight: 2 },
        { id: 'pf_h_02', template: "Opposition Rally Draws Modest Crowd; Government Approval Holds Steady", conditions: [], weight: 2 },
        { id: 'pf_h_03', template: "{party_name}'s Protest Over {grievance_label} Fails to Gain Traction", conditions: [], weight: 1 },
        { id: 'pf_h_04', template: "Empty Streets: {party_name} Protest Falls Short of Expectations", conditions: [{ field: 'tier', op: '==', value: 1 }], weight: 1 },
    ],

    // ─────────── PROTEST: RESPECTABLE (Tier 3) ───────────
    protest_respectable: [
        { id: 'pr_h_01', template: "Thousands March Against {grievance_label} in {nation_name}", conditions: [], weight: 2 },
        { id: 'pr_h_02', template: "{party_name} Draws Respectable Turnout for {grievance_label} Protest", conditions: [], weight: 1 },
        { id: 'pr_h_03', template: "Opposition Protest Sends Message to Government on {grievance_label}", conditions: [], weight: 1 },
    ],

    // ─────────── PROTEST: STRONG (Tier 4) ───────────
    protest_strong: [
        { id: 'ps_h_01', template: "Large Crowds Rally Against Government — {party_name} Leads Protest Over {grievance_label}", conditions: [], weight: 2 },
        { id: 'ps_h_02', template: "Tens of Thousands Take to Streets Demanding Action on {grievance_label}", conditions: [], weight: 1 },
        { id: 'ps_h_03', template: "Government Approval Dips as {party_name} Protest Draws Strong Turnout", conditions: [], weight: 1 },
    ],

    // ─────────── PROTEST: MASS DEMONSTRATION (Tier 5) ───────────
    protest_mass: [
        { id: 'pm_h_01', template: "Mass Demonstration Rocks {nation_name} — Unrest Rises as Protesters Demand Change", conditions: [], weight: 2 },
        { id: 'pm_h_02', template: "Unprecedented Turnout: {party_name} Leads Massive Protest Over {grievance_label}", conditions: [], weight: 1 },
        { id: 'pm_h_03', template: "Streets Overflow as Mass Protest Shakes Government — Civil Unrest Surges", conditions: [], weight: 1 },
    ],

    // ─────────── PROTEST: CRISIS STARTED (Tier 6/7) ───────────
    protest_crisis_started: [
        { id: 'pcs_h_01', template: "Historic Protest Erupts — {nation_name} Plunged Into Crisis", conditions: [{ field: 'tier', op: '==', value: 6 }], weight: 2 },
        { id: 'pcs_h_02', template: "Nationwide Protest Paralyzes {nation_name} — Government Faces Existential Crisis", conditions: [{ field: 'tier', op: '==', value: 7 }], weight: 2 },
        { id: 'pcs_h_03', template: "{party_name} Protest Escalates to National Crisis — {tier_label}", conditions: [], weight: 1 },
        { id: 'pcs_h_04', template: "BREAKING: Protesters Demand {demand_label} — Crisis Engulfs {nation_name}", conditions: [{ field: 'tier', op: '==', value: 7 }], weight: 2 },
    ],

    // ─────────── PROTEST: CRISIS TICK UPDATE ───────────
    protest_crisis_tick: [
        { id: 'pct_h_01', template: "Protest Crisis Enters Day {ticks_active} — No Resolution in Sight", conditions: [], weight: 2 },
        { id: 'pct_h_02', template: "{nation_name} Protest Continues: Government Approval Slides Further", conditions: [], weight: 1 },
        { id: 'pct_h_03', template: "Streets Still Full: {tier_label} Shows No Sign of Abating", conditions: [], weight: 1 },
    ],

    // ─────────── PROTEST: CRISIS ENDED (Natural / Demand Met) ───────────
    protest_crisis_ended: [
        { id: 'pce_h_01', template: "Protest Crisis Ends in {nation_name} — Protesters Disperse After {ticks_active} Days", conditions: [], weight: 2 },
        { id: 'pce_h_02', template: "Government Weathers Protest Storm — Crisis Declared Over", conditions: [{ field: 'demand_met', op: '==', value: false }], weight: 1 },
        { id: 'pce_h_03', template: "Protesters Claim Victory as Government Meets Demands", conditions: [{ field: 'demand_met', op: '==', value: true }], weight: 3 },
    ],

    // ─────────── PROTEST: EPO RESOLVED ───────────
    protest_epo_resolved: [
        { id: 'per_h_01', template: "Government Crackdown Ends Protest Crisis — Interior Ministry Deploys Forces", conditions: [], weight: 2 },
        { id: 'per_h_02', template: "Enforce Public Order Succeeds: {nation_name} Protest Dispersed by Authorities", conditions: [], weight: 1 },
    ],

    // ─────────── PROTEST: EPO ESCALATED ───────────
    protest_epo_escalated: [
        { id: 'pee_h_01', template: "Crackdown Backfires Spectacularly — Protest Escalates to Nationwide Crisis", conditions: [], weight: 2 },
        { id: 'pee_h_02', template: "Police Action Inflames Protesters — {nation_name} Faces Nationwide Uprising", conditions: [], weight: 1 },
        { id: 'pee_h_03', template: "BREAKING: Failed Crackdown Triggers Tier 7 Nationwide Protest in {nation_name}", conditions: [], weight: 1 },
    ],

    // ─────────── PROTEST: NATIONAL EMERGENCY ───────────
    protest_emergency: [
        { id: 'pne_h_01', template: "National Emergency Declared — Government Ends Protest Crisis at Severe Cost", conditions: [], weight: 2 },
        { id: 'pne_h_02', template: "{nation_name} Under Emergency Rule as Government Crushes Protest Movement", conditions: [], weight: 1 },
        { id: 'pne_h_03', template: "Martial Law: Government Ends Protest but Pays Heavy Price in Stability", conditions: [], weight: 1 },
    ],

    // ─────────── PROTEST: CALLED OFF ───────────
    protest_called_off: [
        { id: 'pco_h_01', template: "{party_name} Calls Off Protest — Moderates Breathe Sigh of Relief", conditions: [], weight: 2 },
        { id: 'pco_h_02', template: "Protest Crisis Winding Down as {party_name} Orders Supporters Home", conditions: [], weight: 1 },
    ],

    // ─────────── PROTEST: PUBLIC ADDRESS ───────────
    protest_public_address: [
        { id: 'ppa_h_01', template: "Government Issues Public Address Amid Ongoing Protest Crisis", conditions: [], weight: 2 },
        { id: 'ppa_h_02', template: "Head of Government Appeals for Calm as Protest Enters Day {ticks_active}", conditions: [], weight: 1 },
    ],
};

// ════════════════════════════════════════════════════════════════
// LEDE TEMPLATES
// ════════════════════════════════════════════════════════════════

export const LEDE_TEMPLATES = {

    // ─── Rally ───
    rally: [
        { id: 'rally_l_01', conditions: [{ field: 'momentum_change', op: '>', value: 5 }, { field: 'secondary_energized_bloc', op: '!=', value: '' }], template: "The {party_name} drew large crowds to a rally in the capital, campaigning on {ideology_tag} themes. Party leader {leader_name} called for {subject_name}, energizing {primary_energized_bloc} and {secondary_energized_bloc} voters." },
        { id: 'rally_l_01b', conditions: [{ field: 'momentum_change', op: '>', value: 5 }], template: "The {party_name} drew large crowds to a rally in the capital, campaigning on {ideology_tag} themes. Party leader {leader_name} called for {subject_name}, energizing {primary_energized_bloc} voters." },
        { id: 'rally_l_02', conditions: [{ field: 'blocs_alienated', op: '>', value: 0 }, { field: 'primary_alienated_bloc', op: '!=', value: '' }], template: "A {party_name} rally on {subject_name} drew a mixed response. While {primary_energized_bloc} voters responded positively, {primary_alienated_bloc} communities criticized the party's message as divisive." },
        { id: 'rally_l_03', conditions: [{ field: 'momentum_change', op: '<', value: 3 }], template: "{party_name} held a low-key rally on {subject_name}. Turnout was modest and the event generated little media attention." },
        { id: 'rally_l_04', conditions: [], template: "The {party_name} rallied supporters around {subject_name} at an event in the capital. {leader_name} addressed the crowd, emphasizing the party's platform and vision for {nation_name}." },
    ],

    // ─── Crisis Started ───
    crisis_started: [
        { id: 'crisis_start_l_01', conditions: [{ field: 'severity', op: '==', value: 'critical' }], template: "{nation_name} is facing its worst {crisis_type} emergency in a generation. The {crisis_name} has triggered emergency measures across the country, with experts warning that without immediate action, the situation could deteriorate further. The governing coalition under {pm_name} faces mounting pressure to respond." },
        { id: 'crisis_start_l_02', conditions: [{ field: 'severity', op: '==', value: 'severe' }], template: "A {crisis_name} has gripped {nation_name} as key indicators crossed critical thresholds. {trigger_description}. Government officials are scrambling to contain the fallout." },
        { id: 'crisis_start_l_03', conditions: [], template: "{nation_name} has entered a period of crisis as {crisis_name} takes hold. The situation, triggered by {trigger_description}, is expected to worsen unless the government takes decisive action." },
    ],

    // ─── Crisis Ongoing ───
    crisis_ongoing: [
        { id: 'crisis_ong_l_01', conditions: [{ field: 'duration_ticks', op: '>', value: 5 }], template: "The {crisis_name} in {nation_name} shows no signs of abating as it enters its {duration_ticks}th tick. Per-tick effects continue to erode key indicators, with {worst_affected_stat} bearing the brunt of the damage. Opposition parties are demanding the government take action." },
        { id: 'crisis_ong_l_02', conditions: [], template: "{nation_name} continues to grapple with the {crisis_name}. Government sources indicate that recovery conditions have not yet been met, and analysts predict the crisis could persist for several more ticks." },
    ],

    // ─── Crisis Resolved ───
    crisis_resolved: [
        { id: 'crisis_res_l_01', conditions: [{ field: 'duration_ticks', op: '>', value: 8 }], template: "After {duration_ticks} ticks of hardship, {nation_name} has finally emerged from the {crisis_name}. Recovery indicators have crossed the threshold needed to declare the crisis over, though the long-term damage to {worst_affected_stat} may take months to fully repair." },
        { id: 'crisis_res_l_02', conditions: [], template: "The {crisis_name} in {nation_name} has been resolved. Key indicators have recovered to acceptable levels, allowing the government to stand down emergency measures. {pm_name} expressed relief but cautioned against complacency." },
    ],

    // ─── Currency Collapse ───
    currency_collapse: [
        { id: 'currency_l_01', conditions: [], template: "The {currency_name} has collapsed below the critical threshold, sending markets into turmoil. Inflation is surging, foreign investment is fleeing, and trade balance is deteriorating rapidly. Central bank officials are meeting in emergency session." },
    ],

    // ─── Hyperinflation ───
    hyperinflation: [
        { id: 'hyper_l_01', conditions: [], template: "Prices are spiraling out of control in {nation_name} as inflation exceeds {inflation_value}%. The cost of basic goods has become unaffordable for many citizens. Currency strength is plummeting, and foreign investors are abandoning the market. The government faces calls for emergency economic reform." },
    ],

    // ─── Debt Crisis ───
    debt_crisis: [
        { id: 'debt_l_01', conditions: [], template: "{nation_name}'s debt-to-GDP ratio has crossed {debt_to_gdp}%, triggering a sovereign debt crisis. Credit ratings are in freefall, foreign investment is drying up, and GDP growth has stalled. Without drastic fiscal reform or a debt restructuring, analysts warn that a full sovereign default may be inevitable." },
    ],

    // ─── Ministry Crisis ───
    ministry_crisis: [
        { id: 'min_cr_l_01', conditions: [], template: "Chronic underfunding of {nation_name}'s {ministry_name} ministry has triggered a full-blown crisis. Key indicators in the sector have deteriorated to critical levels, and public outcry is mounting. The responsible minister faces growing calls for resignation." },
    ],

    // ─── Sovereign Default ───
    sovereign_default: [
        { id: 'default_l_01', conditions: [{ field: 'default_type', op: '==', value: 'full' }], template: "{nation_name} has defaulted on its sovereign debt, wiping out all outstanding obligations. The immediate fallout has been devastating: credit has plunged, the currency has collapsed, and foreign investors are fleeing. A long recovery period of at least 20 ticks is expected." },
        { id: 'default_l_02', conditions: [{ field: 'default_type', op: '==', value: 'partial_restructuring' }], template: "{nation_name} has declared a partial debt restructuring, agreeing to repay {repayment_rate}% of its obligations. While less severe than a full default, the economic damage is significant. Credit, currency strength, and foreign investment have all taken major hits." },
    ],

    // ─── Default / Inaction ───
    default_stat_decay: [
        { id: 'decay_l_01', conditions: [], template: "Without active policy intervention, {nation_name}'s {stat_name} has continued its natural drift downward. The {stat_name} index fell by {decay_amount} this tick, reflecting the cost of governmental inaction." },
    ],

    default_momentum_decay: [
        { id: 'mom_decay_l_01', conditions: [], template: "With no rallies, outreach, or press events this tick, {party_name}'s public momentum has decayed by 20%. The party risks fading from the headlines and ceding ground to more active rivals." },
    ],

    default_budget_stall: [
        { id: 'budget_stall_l_01', conditions: [{ field: 'stall_duration', op: '>', value: 3 }], template: "The budget impasse in {nation_name} has now lasted {stall_duration} ticks with no resolution in sight. Parliamentary factions remain deadlocked, and the prospect of a government shutdown grows more likely with each passing tick." },
        { id: 'budget_stall_l_02', conditions: [], template: "{nation_name}'s parliament has failed to pass a budget this tick. The unresolved fiscal situation is creating uncertainty in markets and putting pressure on the governing coalition." },
    ],

    default_inaction: [
        { id: 'inaction_l_01', conditions: [], template: "Observers note that {nation_name}'s government has taken no significant action this tick. With {unused_ap} action points going unused, critics argue the administration is asleep at the wheel while {issue_name} continues to affect citizens." },
    ],

    // ─── Election ───
    election: [
        { id: 'election_l_01', conditions: [{ field: 'winner_name', op: '!=', value: '' }], template: "Voters in {nation_name} have spoken. {winner_name} has won the election with {winner_seats} seats, securing a mandate to form the next government." },
        { id: 'election_l_02', conditions: [], template: "Voters in {nation_name} have gone to the polls in an election that could reshape the political landscape. Results are expected to determine the direction of the next government." },
    ],

    // ─── Bill Pass/Fail ───
    bill_vote_pass: [
        { id: 'bill_pass_l_01', conditions: [{ field: 'party_name', op: '!=', value: '' }, { field: 'vote_for', op: '!=', value: '' }], template: "Parliament has passed {bill_name} in a {vote_for}-{vote_against} vote. The legislation, sponsored by {party_name}, will now take effect." },
        { id: 'bill_pass_l_02', conditions: [{ field: 'vote_for', op: '!=', value: '' }], template: "Parliament has passed {bill_name} in a {vote_for}-{vote_against} vote. The legislation will now take effect." },
        { id: 'bill_pass_l_03', conditions: [{ field: 'party_name', op: '!=', value: '' }], template: "Parliament has passed {bill_name}. The legislation, sponsored by {party_name}, will now take effect." },
        { id: 'bill_pass_l_04', conditions: [], template: "Parliament has passed {bill_name}. The legislation will now take effect." },
    ],

    bill_vote_fail: [
        { id: 'bill_fail_l_01', conditions: [{ field: 'party_name', op: '!=', value: '' }, { field: 'vote_for', op: '!=', value: '' }], template: "Parliament has rejected {bill_name} in a {vote_for}-{vote_against} vote. {party_name}'s legislative agenda has suffered a setback." },
        { id: 'bill_fail_l_02', conditions: [{ field: 'vote_for', op: '!=', value: '' }], template: "Parliament has rejected {bill_name} in a {vote_for}-{vote_against} vote. The proposed legislation has been defeated." },
        { id: 'bill_fail_l_03', conditions: [{ field: 'party_name', op: '!=', value: '' }], template: "Parliament has rejected {bill_name}. {party_name}'s legislative agenda has suffered a setback." },
        { id: 'bill_fail_l_04', conditions: [], template: "Parliament has rejected {bill_name}. The proposed legislation has been defeated." },
    ],

    // ─── Protest: Fizzle ───
    protest_fizzle: [
        { id: 'pf_l_01', conditions: [{ field: 'tier', op: '==', value: 1 }], template: "A protest organised by {party_name} over {grievance_label} drew embarrassingly low turnout in {nation_name}. The sparse crowds handed the government a free headline, and centrist voters appear unimpressed by the opposition's tactics." },
        { id: 'pf_l_02', conditions: [], template: "{party_name} called for public demonstrations against {grievance_label}, but turnout fell well short of expectations. Political analysts noted that protest fatigue and weak public sentiment contributed to the modest showing." },
    ],

    // ─── Protest: Respectable ───
    protest_respectable: [
        { id: 'pr_l_01', conditions: [], template: "Thousands took to the streets in {nation_name} as {party_name} organised a protest against {grievance_label}. The respectable turnout signals growing public discontent, though the demonstration fell short of creating a major crisis for the government." },
    ],

    // ─── Protest: Strong ───
    protest_strong: [
        { id: 'ps_l_01', conditions: [], template: "A large protest organised by {party_name} drew tens of thousands to the streets of {nation_name}. Demonstrators demanded action on {grievance_label}, and government approval took a significant hit. Ideologically aligned voter blocs rallied behind the opposition." },
    ],

    // ─── Protest: Mass Demonstration ───
    protest_mass: [
        { id: 'pm_l_01', conditions: [], template: "An unprecedented mass demonstration organised by {party_name} brought {nation_name} to a standstill. Hundreds of thousands marched against {grievance_label}, with government approval plummeting and civil unrest surging. The government faces mounting pressure to respond." },
    ],

    // ─── Protest: Crisis Started ───
    protest_crisis_started: [
        { id: 'pcs_l_01', conditions: [{ field: 'tier', op: '==', value: 6 }], template: "A historic protest movement has erupted in {nation_name}, plunging the country into crisis. Organised by {party_name} over {grievance_label}, the demonstrations have overwhelmed authorities. Government approval is eroding rapidly, and civil unrest is rising with each passing day." },
        { id: 'pcs_l_02', conditions: [{ field: 'tier', op: '==', value: 7 }], template: "Nationwide protests have paralysed {nation_name} as millions take to the streets demanding {demand_label}. The {party_name}-led movement has triggered a full national crisis, with the economy suffering alongside soaring unrest and plummeting government approval. The government has {demand_window} ticks to meet the protesters' demands or face severe consequences." },
    ],

    // ─── Protest: Crisis Tick ───
    protest_crisis_tick: [
        { id: 'pct_l_01', conditions: [], template: "The protest crisis in {nation_name} continues with no resolution in sight. Government approval dropped further as civil unrest rises. {party_name}'s supporters remain on the streets, and the government faces growing pressure to either address the demonstrators' concerns or take decisive action." },
    ],

    // ─── Protest: Crisis Ended ───
    protest_crisis_ended: [
        { id: 'pce_l_01', conditions: [{ field: 'demand_met', op: '==', value: true }], template: "The protest crisis in {nation_name} has ended after the government met the demonstrators' key demand. Protesters are dispersing from the streets, though the political damage to the government may take time to repair." },
        { id: 'pce_l_02', conditions: [], template: "After {ticks_active} ticks of sustained unrest, the protest crisis in {nation_name} has come to an end. The demonstrations, which were organised by {party_name}, have left their mark on the nation's political landscape." },
    ],

    // ─── Protest: EPO Resolved ───
    protest_epo_resolved: [
        { id: 'per_l_01', conditions: [], template: "The Interior Ministry's decision to enforce public order has ended the protest crisis in {nation_name}. Security forces moved in to disperse the remaining demonstrators, drawing condemnation from opposition parties but bringing an end to the disruption." },
    ],

    // ─── Protest: EPO Escalated ───
    protest_epo_escalated: [
        { id: 'pee_l_01', conditions: [], template: "A government crackdown on protesters in {nation_name} has backfired catastrophically. Rather than dispersing, the demonstrators swelled in numbers, escalating the crisis from a Tier 6 Historic Protest to a Tier 7 Nationwide Protest. The streets are now filled with millions demanding {demand_label}." },
    ],

    // ─── Protest: National Emergency ───
    protest_emergency: [
        { id: 'pne_l_01', conditions: [], template: "The government of {nation_name} has declared a national emergency to end the protest crisis. While the demonstrations have been forcibly ended, the cost has been severe: civil unrest has surged, political violence has spiked, happiness has plummeted, and government approval has taken a devastating hit." },
    ],

    // ─── Protest: Called Off ───
    protest_called_off: [
        { id: 'pco_l_01', conditions: [], template: "{party_name} has called off the protest in {nation_name}, ordering supporters to return home. The decision was welcomed by moderate voters, and the crisis is expected to wind down within two ticks." },
    ],

    // ─── Protest: Public Address ───
    protest_public_address: [
        { id: 'ppa_l_01', conditions: [], template: "The government of {nation_name} issued a public address amid the ongoing protest crisis, calling for calm and dialogue. The address has slightly reduced civil unrest accumulation and bolstered support among moderate voters." },
    ],
};

// ════════════════════════════════════════════════════════════════
// BODY BLOCK TEMPLATES (Tier 1 only)
// ════════════════════════════════════════════════════════════════

export const BODY_BLOCK_TEMPLATES = {

    // ─── Crisis ───
    crisis_started: {
        context: [
            { id: 'crisis_start_ctx_01', required: true, template: "The {crisis_name} was triggered when {trigger_description}. Economists had been warning for weeks that the situation was approaching a tipping point, but parliamentary gridlock prevented preventive action." },
        ],
        action: [
            { id: 'crisis_start_act_01', required: true, template: "The government has activated emergency protocols in response to the crisis. {pm_name} called an emergency cabinet meeting, and the central bank has been placed on high alert. Public-facing institutions are expected to face severe strain." },
        ],
        impact_domestic: [
            { id: 'crisis_start_impact_01', required: false, template: "The immediate domestic impact is significant. {worst_affected_stat} is expected to decline further, and government approval is already dropping. Citizens in the most affected regions are bracing for difficult weeks ahead." },
        ],
        reaction_oppose: [
            { id: 'crisis_start_opp_01', required: false, template: "Opposition leaders wasted no time in assigning blame. {opposition_leader} called the crisis '{negative_adjective}' and demanded {alternative_action}." },
        ],
        escalation_warning: [
            { id: 'crisis_start_esc_01', required: false, template: "Analysts warn that if left unchecked, the {crisis_name} could cascade into broader economic instability. The government's response in the coming ticks will be critical in determining the crisis's ultimate severity." },
        ],
    },

    sovereign_default: {
        context: [
            { id: 'sovdefault_ctx_01', required: true, template: "{nation_name}'s fiscal situation had been deteriorating for some time, with debt-to-GDP reaching {debt_to_gdp}% before the default was declared. Credit had already fallen to dangerously low levels, locking the nation out of international borrowing markets." },
        ],
        action: [
            { id: 'sovdefault_act_01', required: true, template: "The {default_type} default has reduced the nation's outstanding debt, but at enormous cost. Credit has dropped by {credit_penalty}, the currency has weakened by {currency_penalty}, and foreign investment has fled." },
        ],
        impact_domestic: [
            { id: 'sovdefault_impact_01', required: true, template: "Standard of living has taken a significant hit, happiness is declining, and inflation is expected to rise sharply. The government will face a painful recovery period estimated at a minimum of 20 ticks." },
        ],
        impact_international: [
            { id: 'sovdefault_intl_01', required: false, template: "Trade partners are already feeling the effects. Nations with close economic ties to {nation_name} have seen their own credit ratings affected, with contagion effects hitting the broader continental economy." },
        ],
    },
};

// ════════════════════════════════════════════════════════════════
// OPINION / EDITORIAL TRIGGERS
// ════════════════════════════════════════════════════════════════

export const OPINION_TRIGGERS = [
    { condition: 'election_within_10', topic: 'election', headline: "The Case For — and Against — {candidate_a} vs {candidate_b}" },
    { condition: 'crisis_active', topic: 'crisis', headline: "Editorial: {nation_name}'s {crisis_name} and What Comes Next" },
    { condition: 'stability_below_30', topic: 'governance', headline: "Editorial: Can {nation_name}'s Government Survive?" },
    { condition: 'debt_critical', topic: 'economy', headline: "Editorial: The Debt Bomb — Is Default Inevitable?" },
    { condition: 'war_active_5_ticks', topic: 'war', headline: "Analysis: {war_duration} Ticks In — Is Peace Possible?" },
    { condition: 'shutdown_active', topic: 'budget', headline: "Editorial: The Cost of a Government That Can't Govern" },
    { condition: 'inaction_3_ticks', topic: 'governance', headline: "Editorial: The Price of Doing Nothing" },
];
