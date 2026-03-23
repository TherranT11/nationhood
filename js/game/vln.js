/**
 * vln.js — Volbal Ligue Nationale
 *
 * Fictional football league that runs March–November each in-game year.
 * Purely cosmetic — no mechanical effect on any game stat.
 *
 * Calendar: tick % 12 gives month index (0 = January, 2 = March, 10 = November).
 * Active months: 2–10 (March–November). Off-season: 11, 0, 1 (Dec–Feb).
 * 5 matches per tick, 90 total fixtures per season (10 teams, home & away).
 */

// ── Teams ──

export const VLN_TEAMS = [
    { id: 'san_estrella_fc',   name: 'San Estrella FC',   city: 'San Estrella',  strength: 72 },
    { id: 'palvera_united',    name: 'Palvera United',    city: 'Palvera',       strength: 69 },
    { id: 'avelia_cf',         name: 'Avelia CF',         city: 'Avelia',        strength: 65 },
    { id: 'fc_montequilla',    name: 'FC Montequilla',    city: 'Montequilla',   strength: 62 },
    { id: 'melizea_rovers',    name: 'Melizea Rovers',    city: 'Melizea',       strength: 60 },
    { id: 'real_sangreza',     name: 'Real Sangreza',     city: 'Sangreza',      strength: 58 },
    { id: 'crucera_athletic',  name: 'Crucera Athletic',  city: 'Crucera',       strength: 55 },
    { id: 'ossvera_city',      name: 'Ossvera City',      city: 'Ossvera',       strength: 52 },
    { id: 'valdoria_sc',       name: 'Valdoria SC',       city: 'Valdoria',      strength: 48 },
    { id: 'norte_bravo_fc',    name: 'Norte Bravo FC',    city: 'Norte Bravo',   strength: 44 },
];

const MATCHES_PER_TICK = 5;
const TOTAL_FIXTURES = 90; // 10 teams × 9 opponents × 2 (home & away)
const TOTAL_MATCHWEEKS = TOTAL_FIXTURES / MATCHES_PER_TICK; // 18
export const VLN_TOTAL_MATCHWEEKS = TOTAL_MATCHWEEKS;

// Months where league is active (0-indexed: 2 = March, 10 = November)
const LEAGUE_ACTIVE_MONTHS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

export function isLeagueActive(tick) {
    return LEAGUE_ACTIVE_MONTHS.includes(tick % 12);
}

export function getGameYear(tick) {
    return 2000 + Math.floor(tick / 12);
}

export function getGameMonth(tick) {
    return tick % 12;
}

// ── Fixture Generation ──

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function generateFixtures() {
    const fixtures = [];
    for (let i = 0; i < VLN_TEAMS.length; i++) {
        for (let j = 0; j < VLN_TEAMS.length; j++) {
            if (i !== j) {
                fixtures.push({ home: VLN_TEAMS[i].id, away: VLN_TEAMS[j].id, played: false });
            }
        }
    }
    return shuffle(fixtures);
}

// ── Match Resolution ──

const SCORELINES = {
    home: [
        { home: 1, away: 0 }, { home: 2, away: 0 }, { home: 2, away: 1 },
        { home: 3, away: 1 }, { home: 3, away: 2 }, { home: 4, away: 1 },
        { home: 1, away: 0 }, { home: 2, away: 1 }, // weight common results
    ],
    away: [
        { home: 0, away: 1 }, { home: 0, away: 2 }, { home: 1, away: 2 },
        { home: 1, away: 3 }, { home: 2, away: 3 }, { home: 0, away: 1 },
    ],
    draw: [
        { home: 0, away: 0 }, { home: 1, away: 1 },
        { home: 2, away: 2 }, { home: 1, away: 1 }, // weight 1-1
    ],
};

function getTeamById(id) {
    return VLN_TEAMS.find(t => t.id === id);
}

function resolveMatch(fixture) {
    const home = getTeamById(fixture.home);
    const away = getTeamById(fixture.away);

    let homeRoll = Math.ceil(Math.random() * 6);
    let awayRoll = Math.ceil(Math.random() * 6);

    if (home.strength > away.strength) homeRoll += 2;
    if (away.strength > home.strength) awayRoll += 2;

    let outcome;
    if (homeRoll > awayRoll)       outcome = 'home';
    else if (awayRoll > homeRoll)  outcome = 'away';
    else                           outcome = 'draw';

    const pool = SCORELINES[outcome];
    const score = pool[Math.floor(Math.random() * pool.length)];

    return {
        home: fixture.home,
        away: fixture.away,
        homeName: home.name,
        awayName: away.name,
        outcome,
        homeScore: score.home,
        awayScore: score.away,
    };
}

function selectMatchOfTheWeek(results) {
    const scored = results.map(r => ({
        ...r,
        _entertainment: (r.homeScore + r.awayScore)
            + (r.homeScore === r.awayScore ? 1 : 0)
            + (Math.abs(r.homeScore - r.awayScore) <= 1 ? 0.5 : 0),
    }));
    scored.sort((a, b) => b._entertainment - a._entertainment);
    const best = scored[0];
    // Strip internal scoring field
    const { _entertainment, ...motw } = best;
    return motw;
}

// ── Standings ──

function freshStandings() {
    return Object.fromEntries(VLN_TEAMS.map(t => [t.id, {
        id: t.id,
        name: t.name,
        played: 0,
        w: 0,
        d: 0,
        l: 0,
        form: [],
    }]));
}

function applyResult(result, standings) {
    const h = standings[result.home];
    const a = standings[result.away];

    h.played += 1;
    a.played += 1;

    if (result.outcome === 'home') {
        h.w += 1;
        a.l += 1;
    } else if (result.outcome === 'away') {
        a.w += 1;
        h.l += 1;
    } else {
        h.d += 1;
        a.d += 1;
    }

    const homeForm = result.outcome === 'home' ? 'W' : result.outcome === 'draw' ? 'D' : 'L';
    const awayForm = result.outcome === 'away' ? 'W' : result.outcome === 'draw' ? 'D' : 'L';

    h.form = [...h.form.slice(-4), homeForm];
    a.form = [...a.form.slice(-4), awayForm];
}

export function getPoints(record) {
    return (record.w * 3) + record.d;
}

export function getSortedTable(standings) {
    return Object.values(standings)
        .sort((a, b) => {
            const ptsDiff = getPoints(b) - getPoints(a);
            if (ptsDiff !== 0) return ptsDiff;
            return b.w - a.w;
        });
}

// ── Season Initialization ──

export function initSeason(tick) {
    return {
        active: true,
        season: getGameYear(tick),
        matchweek: 0,
        fixtures: generateFixtures(),
        standings: freshStandings(),
        last_results: [],
        match_of_week: null,
    };
}

// ── Tick Processing (called from advance-tick) ──

/**
 * Process one tick of the VLN. Returns updated state object.
 * Called by the advance-tick handler each tick.
 *
 * @param {object} vlnState - current VLN state from DB
 * @param {number} newTick  - the tick being processed
 * @returns {object} updated vlnState to persist
 */
export function processVLNTick(vlnState, newTick) {
    const month = getGameMonth(newTick);
    const year = getGameYear(newTick);
    const active = isLeagueActive(newTick);

    // Season reset: March of a new year
    if (month === 2 && vlnState.season !== year) {
        return initSeason(newTick);
    }

    // Off-season — just mark inactive, keep final standings
    if (!active) {
        return { ...vlnState, active: false, last_results: [], match_of_week: null };
    }

    // Active season — resolve up to 5 matches
    const fixtures = vlnState.fixtures || [];
    const standings = vlnState.standings || freshStandings();
    const unplayed = fixtures.filter(f => !f.played);

    if (unplayed.length === 0) {
        // Season complete — show final table
        return { ...vlnState, active: true, last_results: [], match_of_week: null };
    }

    const batch = unplayed.slice(0, MATCHES_PER_TICK);
    const results = batch.map(f => resolveMatch(f));

    // Mark fixtures as played
    for (const r of results) {
        const fix = fixtures.find(f => f.home === r.home && f.away === r.away && !f.played);
        if (fix) fix.played = true;
    }

    // Update standings
    for (const r of results) {
        applyResult(r, standings);
    }

    const matchOfWeek = results.length > 0 ? selectMatchOfTheWeek(results) : null;
    const matchweek = (vlnState.matchweek || 0) + 1;

    return {
        ...vlnState,
        active: true,
        season: year,
        matchweek,
        fixtures,
        standings,
        last_results: results,
        match_of_week: matchOfWeek,
    };
}
