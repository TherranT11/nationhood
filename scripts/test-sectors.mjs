// scripts/test-sectors.mjs
//
// Unit tests for the pure helpers exported by js/game/sectors.js. Pattern
// follows scripts/test-bills-helpers.mjs — plain Node + node:assert/strict,
// no test framework. Covers Phase 1 (calc) and Phase 2 (bill resolution).
//
// Run: `npm run test:sectors`

import assert from 'node:assert/strict';
import {
    calculateTotalWeightedPopularity,
    calculateSectorContributions,
    leadToSeatsCurve,
    findTiedSectors,
    resolveTie,
    formatPopularity,
    parsePopularity,
    computeSectorShifts,
    sumSectorEffects,
} from '../js/game/sectors.js';

// ─── Tiny test runner ───────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
    try { fn(); passed++; }
    catch (e) { failed++; failures.push({ name, error: e }); }
}

function suite(name, fn) {
    console.log(`\n  ${name}`);
    const before = passed + failed;
    fn();
    const ran = passed + failed - before;
    console.log(`    ${ran} test${ran !== 1 ? 's' : ''}`);
}

// ─── Fixtures ───────────────────────────────────────────────────────────────
// Two factions, three sectors. Popularity stored as integer tenths.
const FACTION_A = 'fac-a';
const FACTION_B = 'fac-b';

const SECTORS_BASIC = [
    { id: 's1', sector_key: 'RETIREES',     name: 'Retirees',     weight: 1, base_turnout: 1.00, is_active: true },
    { id: 's2', sector_key: 'URBAN_PROFS',  name: 'Urban Profs',  weight: 2, base_turnout: 1.20, is_active: true },
    { id: 's3', sector_key: 'TRADES',       name: 'Trades',       weight: 3, base_turnout: 0.80, is_active: true },
];

// Faction A: heavy support in URBAN_PROFS, weak elsewhere.
// Faction B: roughly even spread.
const POP_BASIC = [
    { faction_id: FACTION_A, sector_id: 's1', popularity: 30 }, // 3.0
    { faction_id: FACTION_A, sector_id: 's2', popularity: 80 }, // 8.0
    { faction_id: FACTION_A, sector_id: 's3', popularity: 40 }, // 4.0
    { faction_id: FACTION_B, sector_id: 's1', popularity: 50 }, // 5.0
    { faction_id: FACTION_B, sector_id: 's2', popularity: 50 }, // 5.0
    { faction_id: FACTION_B, sector_id: 's3', popularity: 60 }, // 6.0
];

// Deterministic RNG factory — yields the supplied values in order, then loops.
function fixedRng(values) {
    let i = 0;
    return () => {
        const v = values[i % values.length];
        i++;
        return v;
    };
}

// ─── calculateTotalWeightedPopularity ───────────────────────────────────────
suite('calculateTotalWeightedPopularity', () => {
    test('zero faction id returns 0', () => {
        assert.equal(calculateTotalWeightedPopularity(null, SECTORS_BASIC, POP_BASIC), 0);
    });

    test('faction with no popularity rows returns 0', () => {
        assert.equal(calculateTotalWeightedPopularity('fac-unknown', SECTORS_BASIC, POP_BASIC), 0);
    });

    test('faction A: 30*1*1.00 + 80*2*1.20 + 40*3*0.80 = 318', () => {
        const got = calculateTotalWeightedPopularity(FACTION_A, SECTORS_BASIC, POP_BASIC);
        assert.equal(got, 30 * 1 * 1.00 + 80 * 2 * 1.20 + 40 * 3 * 0.80);
        assert.equal(got, 318);
    });

    test('faction B: 50*1*1.00 + 50*2*1.20 + 60*3*0.80 = 314', () => {
        const got = calculateTotalWeightedPopularity(FACTION_B, SECTORS_BASIC, POP_BASIC);
        assert.equal(got, 50 * 1 * 1.00 + 50 * 2 * 1.20 + 60 * 3 * 0.80);
        assert.equal(got, 314);
    });

    test('inactive sectors are skipped', () => {
        const sectors = SECTORS_BASIC.map(s => s.id === 's2' ? { ...s, is_active: false } : s);
        const got = calculateTotalWeightedPopularity(FACTION_A, sectors, POP_BASIC);
        // Drops the 80*2*1.20 = 192 contribution.
        assert.equal(got, 30 * 1 * 1.00 + 40 * 3 * 0.80);
    });

    test('missing popularity row treated as 0', () => {
        const popPartial = POP_BASIC.filter(r => !(r.faction_id === FACTION_A && r.sector_id === 's3'));
        const got = calculateTotalWeightedPopularity(FACTION_A, SECTORS_BASIC, popPartial);
        assert.equal(got, 30 * 1 * 1.00 + 80 * 2 * 1.20 + 0);
    });
});

// ─── calculateSectorContributions ───────────────────────────────────────────
suite('calculateSectorContributions', () => {
    test('returns one entry per active sector, in input order', () => {
        const got = calculateSectorContributions(FACTION_A, SECTORS_BASIC, POP_BASIC);
        assert.equal(got.length, 3);
        assert.deepEqual(got.map(c => c.sector_key), ['RETIREES', 'URBAN_PROFS', 'TRADES']);
    });

    test('each contribution = popularity * weight * base_turnout', () => {
        const got = calculateSectorContributions(FACTION_A, SECTORS_BASIC, POP_BASIC);
        assert.equal(got[0].contribution, 30);
        assert.equal(got[1].contribution, 192);
        assert.equal(got[2].contribution, 96);
    });

    test('inactive sectors are filtered out', () => {
        const sectors = SECTORS_BASIC.map(s => s.id === 's1' ? { ...s, is_active: false } : s);
        const got = calculateSectorContributions(FACTION_A, sectors, POP_BASIC);
        assert.equal(got.length, 2);
        assert.deepEqual(got.map(c => c.sector_key), ['URBAN_PROFS', 'TRADES']);
    });

    test('sum of contributions == total weighted popularity', () => {
        const contribs = calculateSectorContributions(FACTION_A, SECTORS_BASIC, POP_BASIC);
        const sum = contribs.reduce((a, c) => a + c.contribution, 0);
        const twp = calculateTotalWeightedPopularity(FACTION_A, SECTORS_BASIC, POP_BASIC);
        assert.equal(sum, twp);
    });
});

// ─── leadToSeatsCurve ───────────────────────────────────────────────────────
suite('leadToSeatsCurve', () => {
    test('lead = 0 → 50 per 100', () => assert.equal(leadToSeatsCurve(0), 50));
    test('lead < 0 → 50 per 100',  () => assert.equal(leadToSeatsCurve(-25), 50));
    test('lead = 10 → 55',  () => assert.equal(leadToSeatsCurve(10), 55));
    test('lead = 20 → 58',  () => assert.equal(leadToSeatsCurve(20), 58));
    test('lead = 50 → 67',  () => assert.equal(leadToSeatsCurve(50), 67));
    test('lead = 100 → 78', () => assert.equal(leadToSeatsCurve(100), 78));
    test('lead = 200 → 92', () => assert.equal(leadToSeatsCurve(200), 92));

    test('lead = 5 (mid-segment) → 52.5', () => {
        // Linear between 0/50 and 10/55: midpoint at 5 → 52.5
        assert.equal(leadToSeatsCurve(5), 52.5);
    });

    test('lead = 75 (mid-segment) → 72.5', () => {
        // Linear between 50/67 and 100/78: midpoint at 75 → 72.5
        assert.equal(leadToSeatsCurve(75), 72.5);
    });

    test('lead beyond 200 uses tail slope', () => {
        // 92 at lead=200, plus 0.14 per +1
        assert.equal(leadToSeatsCurve(300), 92 + 100 * 0.14);
    });

    test('parliament size scales linearly', () => {
        assert.equal(leadToSeatsCurve(20, 100), 58);
        assert.equal(leadToSeatsCurve(20, 200), 116);
        assert.equal(leadToSeatsCurve(20, 50),  29);
    });

    test('NaN lead returns tied 50%', () => {
        assert.equal(leadToSeatsCurve(NaN), 50);
    });
});

// ─── findTiedSectors ────────────────────────────────────────────────────────
suite('findTiedSectors', () => {
    const FACTIONS = [{ id: FACTION_A }, { id: FACTION_B }];

    test('clear leader produces no tie', () => {
        const got = findTiedSectors(FACTIONS, SECTORS_BASIC, POP_BASIC);
        // s2 is led by A unambiguously (8.0 vs 5.0); s3 is led by B (6.0 vs 4.0);
        // s1 is led by B (5.0 vs 3.0). All clear leaders.
        assert.deepEqual(got, []);
    });

    test('two factions tied at the top trigger a tie record', () => {
        const pop = [
            { faction_id: FACTION_A, sector_id: 's1', popularity: 73 },
            { faction_id: FACTION_B, sector_id: 's1', popularity: 73 },
        ];
        const got = findTiedSectors(FACTIONS, SECTORS_BASIC, pop);
        assert.equal(got.length, 1);
        assert.equal(got[0].sector_id, 's1');
        assert.deepEqual(new Set(got[0].tied_faction_ids), new Set([FACTION_A, FACTION_B]));
    });

    test('display precision: 73 vs 74 are NOT tied', () => {
        const pop = [
            { faction_id: FACTION_A, sector_id: 's1', popularity: 73 },
            { faction_id: FACTION_B, sector_id: 's1', popularity: 74 },
        ];
        const got = findTiedSectors(FACTIONS, SECTORS_BASIC, pop);
        assert.equal(got.length, 0);
    });

    test('72 and 74 are NOT tied (display as 7.2 and 7.4)', () => {
        const pop = [
            { faction_id: FACTION_A, sector_id: 's1', popularity: 72 },
            { faction_id: FACTION_B, sector_id: 's1', popularity: 74 },
        ];
        const got = findTiedSectors(FACTIONS, SECTORS_BASIC, pop);
        assert.equal(got.length, 0);
    });

    test('exact equality (73 == 73) is a tie', () => {
        const pop = [
            { faction_id: FACTION_A, sector_id: 's1', popularity: 73 },
            { faction_id: FACTION_B, sector_id: 's1', popularity: 73 },
        ];
        const got = findTiedSectors(FACTIONS, SECTORS_BASIC, pop);
        assert.equal(got.length, 1);
        assert.equal(got[0].tied_faction_ids.length, 2);
    });

    test('all-zero sector is not a tie', () => {
        const pop = [
            { faction_id: FACTION_A, sector_id: 's1', popularity: 0 },
            { faction_id: FACTION_B, sector_id: 's1', popularity: 0 },
        ];
        const got = findTiedSectors(FACTIONS, SECTORS_BASIC, pop);
        assert.equal(got.length, 0);
    });

    test('three-way tie returns all three', () => {
        const FACTION_C = 'fac-c';
        const factions = [{ id: FACTION_A }, { id: FACTION_B }, { id: FACTION_C }];
        const pop = [
            { faction_id: FACTION_A, sector_id: 's1', popularity: 60 },
            { faction_id: FACTION_B, sector_id: 's1', popularity: 60 },
            { faction_id: FACTION_C, sector_id: 's1', popularity: 60 },
        ];
        const got = findTiedSectors(factions, SECTORS_BASIC, pop);
        assert.equal(got.length, 1);
        assert.equal(got[0].tied_faction_ids.length, 3);
    });

    test('inactive sector is excluded from tie detection', () => {
        const sectors = SECTORS_BASIC.map(s => s.id === 's1' ? { ...s, is_active: false } : s);
        const pop = [
            { faction_id: FACTION_A, sector_id: 's1', popularity: 73 },
            { faction_id: FACTION_B, sector_id: 's1', popularity: 73 },
        ];
        assert.deepEqual(findTiedSectors(FACTIONS, sectors, pop), []);
    });

    test('only the top tier is checked — lower duplicates ignored', () => {
        // A leads at 8.0; B and a third faction tie at 5.0. Not a tie record.
        const FACTION_C = 'fac-c';
        const factions = [{ id: FACTION_A }, { id: FACTION_B }, { id: FACTION_C }];
        const pop = [
            { faction_id: FACTION_A, sector_id: 's1', popularity: 80 },
            { faction_id: FACTION_B, sector_id: 's1', popularity: 50 },
            { faction_id: FACTION_C, sector_id: 's1', popularity: 50 },
        ];
        assert.deepEqual(findTiedSectors(factions, SECTORS_BASIC, pop), []);
    });
});

// ─── resolveTie ─────────────────────────────────────────────────────────────
suite('resolveTie', () => {
    test('throws on fewer than 2 factions', () => {
        assert.throws(() => resolveTie([], () => 0));
        assert.throws(() => resolveTie(['only-one'], () => 0));
    });

    test('rng returning 0 picks first', () => {
        assert.equal(resolveTie(['a', 'b', 'c'], () => 0), 'a');
    });

    test('rng returning 0.5 picks middle of 3', () => {
        // floor(0.5 * 3) = 1
        assert.equal(resolveTie(['a', 'b', 'c'], () => 0.5), 'b');
    });

    test('rng returning ~1.0 clamps to last', () => {
        // floor(0.9999 * 3) = 2
        assert.equal(resolveTie(['a', 'b', 'c'], () => 0.9999), 'c');
        // Pathological rng() === 1.0 must not overshoot.
        assert.equal(resolveTie(['a', 'b', 'c'], () => 1.0), 'c');
    });

    test('two-way tie with deterministic rng cycles', () => {
        const rng = fixedRng([0, 0.5]); // floor(0*2)=0 (a), floor(0.5*2)=1 (b)
        assert.equal(resolveTie(['a', 'b'], rng), 'a');
        assert.equal(resolveTie(['a', 'b'], rng), 'b');
    });
});

// ─── formatPopularity / parsePopularity round-trip ──────────────────────────
suite('format / parse popularity', () => {
    test('formatPopularity: 73 → "7.3"',   () => assert.equal(formatPopularity(73), '7.3'));
    test('formatPopularity: 0 → "0.0"',    () => assert.equal(formatPopularity(0), '0.0'));
    test('formatPopularity: 100 → "10.0"', () => assert.equal(formatPopularity(100), '10.0'));
    test('formatPopularity: junk → "0.0"', () => assert.equal(formatPopularity(undefined), '0.0'));

    test('parsePopularity: "7.3" → 73',  () => assert.equal(parsePopularity('7.3'), 73));
    test('parsePopularity: "10" → 100',  () => assert.equal(parsePopularity('10'), 100));
    test('parsePopularity: "0" → 0',     () => assert.equal(parsePopularity('0'), 0));
    test('parsePopularity: "-1" → null', () => assert.equal(parsePopularity('-1'), null));
    test('parsePopularity: "10.5" → null (over cap)', () => assert.equal(parsePopularity('10.5'), null));
    test('parsePopularity: "abc" → null', () => assert.equal(parsePopularity('abc'), null));

    test('round-trip: 73 → "7.3" → 73', () => {
        assert.equal(parsePopularity(formatPopularity(73)), 73);
    });
});

// ─── computeSectorShifts (Phase 2) ──────────────────────────────────────────
suite('computeSectorShifts — withdrawn / empty / malformed', () => {
    const effects = [{ sector_key: 'RETIREES', change_tenths: 20 }];
    const voters = new Map([['fac-a', 'yes'], ['fac-b', 'no']]);

    test('withdrawn → empty array', () => {
        assert.deepEqual(
            computeSectorShifts({ effects, voters, sponsorId: 'fac-a', result: 'withdrawn' }),
            []
        );
    });

    test('unknown result → empty array', () => {
        assert.deepEqual(
            computeSectorShifts({ effects, voters, sponsorId: 'fac-a', result: 'deferred' }),
            []
        );
    });

    test('empty effects → empty array (passed)', () => {
        assert.deepEqual(
            computeSectorShifts({ effects: [], voters, sponsorId: 'fac-a', result: 'passed' }),
            []
        );
    });

    test('null effects → empty array', () => {
        assert.deepEqual(
            computeSectorShifts({ effects: null, voters, sponsorId: 'fac-a', result: 'passed' }),
            []
        );
    });

    test('zero-change effects are skipped', () => {
        const noOpEffects = [{ sector_key: 'RETIREES', change_tenths: 0 }];
        assert.deepEqual(
            computeSectorShifts({ effects: noOpEffects, voters, sponsorId: 'fac-a', result: 'passed' }),
            []
        );
    });

    test('non-numeric change is skipped', () => {
        const bad = [{ sector_key: 'RETIREES', change_tenths: 'lots' }];
        assert.deepEqual(
            computeSectorShifts({ effects: bad, voters, sponsorId: 'fac-a', result: 'passed' }),
            []
        );
    });

    test('missing sector_key is skipped', () => {
        const bad = [{ change_tenths: 20 }];
        assert.deepEqual(
            computeSectorShifts({ effects: bad, voters, sponsorId: 'fac-a', result: 'passed' }),
            []
        );
    });
});

suite('computeSectorShifts — passed (vote-aligned)', () => {
    const effects = [{ sector_key: 'RETIREES', change_tenths: 20 }];

    test('YES voter gets +effect', () => {
        const voters = new Map([['fac-a', 'yes']]);
        const got = computeSectorShifts({ effects, voters, sponsorId: 'fac-a', result: 'passed' });
        assert.deepEqual(got, [{ factionId: 'fac-a', sector_key: 'RETIREES', delta_tenths: 20 }]);
    });

    test('NO voter gets -effect (mirror)', () => {
        const voters = new Map([['fac-b', 'no']]);
        const got = computeSectorShifts({ effects, voters, sponsorId: 'fac-a', result: 'passed' });
        // sponsor (fac-a) auto-counts as YES even if not in voters map
        const map = new Map(got.map(r => [r.factionId, r.delta_tenths]));
        assert.equal(map.get('fac-a'),  20);
        assert.equal(map.get('fac-b'), -20);
    });

    test('abstain → no row', () => {
        const voters = new Map([['fac-a', 'yes'], ['fac-c', 'abstain']]);
        const got = computeSectorShifts({ effects, voters, sponsorId: 'fac-a', result: 'passed' });
        const ids = new Set(got.map(r => r.factionId));
        assert.ok(ids.has('fac-a'));
        assert.ok(!ids.has('fac-c'));
    });

    test('sponsor not in voters map is still credited as YES', () => {
        const voters = new Map([['fac-b', 'no']]);
        const got = computeSectorShifts({ effects, voters, sponsorId: 'fac-sponsor', result: 'passed' });
        const map = new Map(got.map(r => [r.factionId, r.delta_tenths]));
        assert.equal(map.get('fac-sponsor'), 20);
    });

    test('sponsor explicitly NO is overridden to YES (matches ideology pattern)', () => {
        // edge case from processIdeologyShifts at bills.js:432-433: sponsor
        // is always treated as YES regardless of recorded stance.
        const voters = new Map([['fac-a', 'no']]);
        const got = computeSectorShifts({ effects, voters, sponsorId: 'fac-a', result: 'passed' });
        const map = new Map(got.map(r => [r.factionId, r.delta_tenths]));
        assert.equal(map.get('fac-a'), 20);
    });

    test('multiple sectors fan out per voter', () => {
        const multi = [
            { sector_key: 'RETIREES',   change_tenths:  15 },
            { sector_key: 'CAPITAL_OWNERS', change_tenths: -25 },
        ];
        const voters = new Map([['fac-a', 'yes'], ['fac-b', 'no']]);
        const got = computeSectorShifts({ effects: multi, voters, sponsorId: 'fac-a', result: 'passed' });
        // 2 voters × 2 sectors = 4 rows
        assert.equal(got.length, 4);
        const lookup = new Map(got.map(r => [`${r.factionId}:${r.sector_key}`, r.delta_tenths]));
        assert.equal(lookup.get('fac-a:RETIREES'),         15);
        assert.equal(lookup.get('fac-a:CAPITAL_OWNERS'),  -25);
        assert.equal(lookup.get('fac-b:RETIREES'),        -15);
        assert.equal(lookup.get('fac-b:CAPITAL_OWNERS'),   25);
    });

    test('does not mutate caller voters Map', () => {
        const voters = new Map([['fac-other', 'no']]);
        computeSectorShifts({ effects, voters, sponsorId: 'fac-sponsor', result: 'passed' });
        assert.equal(voters.size, 1);
        assert.ok(!voters.has('fac-sponsor'));
    });
});

suite('computeSectorShifts — failed (asymmetric, sponsor-only)', () => {
    const effects = [
        { sector_key: 'RETIREES',       change_tenths:  20 },
        { sector_key: 'CAPITAL_OWNERS', change_tenths: -15 },
    ];

    test('sponsor takes full inverse magnitude on every sector', () => {
        const voters = new Map([['fac-a', 'yes'], ['fac-b', 'no']]);
        const got = computeSectorShifts({ effects, voters, sponsorId: 'fac-sponsor', result: 'failed' });
        assert.equal(got.length, 2);
        const lookup = new Map(got.map(r => [r.sector_key, r.delta_tenths]));
        assert.equal(lookup.get('RETIREES'),       -20);
        assert.equal(lookup.get('CAPITAL_OWNERS'),  15);
    });

    test('only sponsor is in the output — YES voters not penalized', () => {
        const voters = new Map([['fac-a', 'yes'], ['fac-b', 'no']]);
        const got = computeSectorShifts({ effects, voters, sponsorId: 'fac-sponsor', result: 'failed' });
        const ids = new Set(got.map(r => r.factionId));
        assert.deepEqual(ids, new Set(['fac-sponsor']));
    });

    test('no sponsor → no rows (defensive)', () => {
        const voters = new Map([['fac-a', 'yes']]);
        assert.deepEqual(
            computeSectorShifts({ effects, voters, sponsorId: null, result: 'failed' }),
            []
        );
    });

    test('failed with empty effects → empty', () => {
        assert.deepEqual(
            computeSectorShifts({ effects: [], voters: new Map(), sponsorId: 'fac-a', result: 'failed' }),
            []
        );
    });
});

// ─── sumSectorEffects (Phase 2) ─────────────────────────────────────────────
suite('sumSectorEffects', () => {
    test('empty input → empty output', () => {
        assert.deepEqual(sumSectorEffects([]), []);
        assert.deepEqual(sumSectorEffects(null), []);
    });

    test('single article passes through unchanged', () => {
        const got = sumSectorEffects([[
            { sector_key: 'RETIREES', change_tenths: 20 },
        ]]);
        assert.deepEqual(got, [{ sector_key: 'RETIREES', change_tenths: 20 }]);
    });

    test('two articles sum into one row per sector', () => {
        const got = sumSectorEffects([
            [{ sector_key: 'RETIREES', change_tenths: 20 }],
            [{ sector_key: 'RETIREES', change_tenths: 15 }],
        ]);
        assert.deepEqual(got, [{ sector_key: 'RETIREES', change_tenths: 35 }]);
    });

    test('opposite-sign effects on same sector cancel', () => {
        const got = sumSectorEffects([
            [{ sector_key: 'CAPITAL_OWNERS', change_tenths:  10 }],
            [{ sector_key: 'CAPITAL_OWNERS', change_tenths: -10 }],
        ]);
        // Cancel to 0, which is then dropped by the zero-skip filter.
        assert.deepEqual(got, []);
    });

    test('mixed sectors stay distinct', () => {
        const got = sumSectorEffects([
            [
                { sector_key: 'RETIREES',       change_tenths: 20 },
                { sector_key: 'CAPITAL_OWNERS', change_tenths: -15 },
            ],
            [
                { sector_key: 'RETIREES', change_tenths: 5 },
            ],
        ]);
        const lookup = Object.fromEntries(got.map(r => [r.sector_key, r.change_tenths]));
        assert.equal(lookup.RETIREES,       25);
        assert.equal(lookup.CAPITAL_OWNERS, -15);
    });

    test('malformed entries are skipped silently', () => {
        const got = sumSectorEffects([
            [
                null,
                { sector_key: 'RETIREES', change_tenths: 'oops' },
                { change_tenths: 20 },                        // missing key
                { sector_key: 'RETIREES', change_tenths: 12 },
            ],
        ]);
        assert.deepEqual(got, [{ sector_key: 'RETIREES', change_tenths: 12 }]);
    });
});

// ─── Final summary ──────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    for (const f of failures) {
        console.error(`\n  ✗ ${f.name}\n    ${f.error.message}`);
    }
    process.exit(1);
}
