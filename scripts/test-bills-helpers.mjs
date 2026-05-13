// scripts/test-bills-helpers.mjs
//
// Phase R1 of the bills.js refactor: characterization tests for the pure
// helpers exported by js/game/bills.js. These pin down current behavior so
// later refactors (extracting per-bill-type resolvers, dispatch maps, etc.)
// have a safety net.
//
// Pattern matches the existing scripts/test-repeal-helper.mjs and
// scripts/test-endorsement-window.mjs (plain Node + node:assert/strict,
// no test framework). Run with `npm run test:bills-helpers`.

import assert from 'node:assert/strict';
import {
    calculateBillSupport,
    computeBillCostTotals,
    calculateIdeologyPenalty,
    isSimpleMajorityBill,
    isSupermajorityBill,
    isAbsoluteMajorityBill,
    getBillTypeSpec,
    getRequiredSeats,
    evaluateBillVote,
    resolveBillVote,
} from '../js/game/bills.js';
import { GAME_CONFIG } from '../js/game/config.js';

// ─── Tiny test runner ───────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
    try {
        fn();
        passed++;
    } catch (e) {
        failed++;
        failures.push({ name, error: e });
    }
}

function suite(name, fn) {
    console.log(`\n  ${name}`);
    const before = passed + failed;
    fn();
    const ran = passed + failed - before;
    console.log(`    ${ran} test${ran !== 1 ? 's' : ''}`);
}

// ─── getBillTypeSpec (R2) ───────────────────────────────────────────────────
suite('getBillTypeSpec', () => {
    test('foundational → supermajority', () => assert.equal(getBillTypeSpec('foundational').threshold, 'supermajority'));
    test('default_resolution → supermajority', () => assert.equal(getBillTypeSpec('default_resolution').threshold, 'supermajority'));
    test('impeachment_conviction → supermajority', () => assert.equal(getBillTypeSpec('impeachment_conviction').threshold, 'supermajority'));
    test('veto_override → veto_override (distinct from supermajority)', () => assert.equal(getBillTypeSpec('veto_override').threshold, 'veto_override'));
    test('no_confidence → absolute', () => assert.equal(getBillTypeSpec('no_confidence').threshold, 'absolute'));
    test('impeachment_motion → absolute', () => assert.equal(getBillTypeSpec('impeachment_motion').threshold, 'absolute'));
    test('ordinary → simple', () => assert.equal(getBillTypeSpec('ordinary').threshold, 'simple'));
    test('ratification → simple', () => assert.equal(getBillTypeSpec('ratification').threshold, 'simple'));
    test('minister_confirmation → simple', () => assert.equal(getBillTypeSpec('minister_confirmation').threshold, 'simple'));
    test('unknown type → simple (safe default)', () => assert.equal(getBillTypeSpec('fake_type_xyz').threshold, 'simple'));
    test('undefined/null → simple (safe default)', () => {
        assert.equal(getBillTypeSpec(undefined).threshold, 'simple');
        assert.equal(getBillTypeSpec(null).threshold, 'simple');
    });
});

// ─── isSupermajorityBill (R2) ───────────────────────────────────────────────
suite('isSupermajorityBill', () => {
    test('foundational is supermajority', () => assert.equal(isSupermajorityBill('foundational'), true));
    test('default_resolution is supermajority', () => assert.equal(isSupermajorityBill('default_resolution'), true));
    test('veto_override is supermajority (grouped with 2/3 bills)', () => assert.equal(isSupermajorityBill('veto_override'), true));
    test('impeachment_conviction is supermajority', () => assert.equal(isSupermajorityBill('impeachment_conviction'), true));
    test('no_confidence is NOT supermajority', () => assert.equal(isSupermajorityBill('no_confidence'), false));
    test('impeachment_motion is NOT supermajority', () => assert.equal(isSupermajorityBill('impeachment_motion'), false));
    test('ordinary is NOT supermajority', () => assert.equal(isSupermajorityBill('ordinary'), false));
    test('ratification is NOT supermajority', () => assert.equal(isSupermajorityBill('ratification'), false));
});

// ─── isAbsoluteMajorityBill (R2) ────────────────────────────────────────────
suite('isAbsoluteMajorityBill', () => {
    test('no_confidence is absolute', () => assert.equal(isAbsoluteMajorityBill('no_confidence'), true));
    test('impeachment_motion is absolute', () => assert.equal(isAbsoluteMajorityBill('impeachment_motion'), true));
    test('foundational is NOT absolute', () => assert.equal(isAbsoluteMajorityBill('foundational'), false));
    test('veto_override is NOT absolute', () => assert.equal(isAbsoluteMajorityBill('veto_override'), false));
    test('impeachment_conviction is NOT absolute', () => assert.equal(isAbsoluteMajorityBill('impeachment_conviction'), false));
    test('ordinary is NOT absolute', () => assert.equal(isAbsoluteMajorityBill('ordinary'), false));
});

// ─── the three predicates partition cleanly ─────────────────────────────────
suite('predicate partition (exactly one of the three is true)', () => {
    const types = [
        'foundational', 'default_resolution', 'veto_override', 'impeachment_conviction',
        'no_confidence', 'impeachment_motion',
        'ordinary', 'ratification', 'minister_confirmation', 'fake_type',
    ];
    for (const t of types) {
        test(`${t}: exactly one of super/absolute/simple`, () => {
            const trueCount = [isSupermajorityBill(t), isAbsoluteMajorityBill(t), isSimpleMajorityBill(t)]
                .filter(Boolean).length;
            assert.equal(trueCount, 1, `expected exactly one true, got ${trueCount}`);
        });
    }
});

// ─── isSimpleMajorityBill ───────────────────────────────────────────────────
suite('isSimpleMajorityBill', () => {
    test('ordinary is simple majority', () => assert.equal(isSimpleMajorityBill('ordinary'), true));
    test('minister_confirmation is simple majority', () => assert.equal(isSimpleMajorityBill('minister_confirmation'), true));
    test('ratification is simple majority', () => assert.equal(isSimpleMajorityBill('ratification'), true));
    test('foundational is NOT simple majority', () => assert.equal(isSimpleMajorityBill('foundational'), false));
    test('default_resolution is NOT simple majority', () => assert.equal(isSimpleMajorityBill('default_resolution'), false));
    test('veto_override is NOT simple majority', () => assert.equal(isSimpleMajorityBill('veto_override'), false));
    test('no_confidence is NOT simple majority', () => assert.equal(isSimpleMajorityBill('no_confidence'), false));
    test('impeachment_motion is NOT simple majority', () => assert.equal(isSimpleMajorityBill('impeachment_motion'), false));
    test('impeachment_conviction is NOT simple majority', () => assert.equal(isSimpleMajorityBill('impeachment_conviction'), false));
});

// ─── getRequiredSeats ───────────────────────────────────────────────────────
suite('getRequiredSeats', () => {
    const TOTAL = GAME_CONFIG.TOTAL_SEATS;
    const SUPER = Math.ceil(TOTAL * GAME_CONFIG.SUPERMAJORITY_THRESHOLD);
    const VETO  = Math.ceil(TOTAL * GAME_CONFIG.VETO_OVERRIDE_THRESHOLD);
    const ABS   = Math.floor(TOTAL / 2) + 1;

    test('foundational requires supermajority', () => assert.equal(getRequiredSeats('foundational'), SUPER));
    test('default_resolution requires supermajority', () => assert.equal(getRequiredSeats('default_resolution'), SUPER));
    test('impeachment_conviction requires supermajority', () => assert.equal(getRequiredSeats('impeachment_conviction'), SUPER));
    test('veto_override uses veto-override threshold', () => assert.equal(getRequiredSeats('veto_override'), VETO));
    test('no_confidence requires absolute majority', () => assert.equal(getRequiredSeats('no_confidence'), ABS));
    test('impeachment_motion requires absolute majority', () => assert.equal(getRequiredSeats('impeachment_motion'), ABS));
    test('ordinary with no votesAgainst → MAJORITY_SEATS', () => assert.equal(getRequiredSeats('ordinary'), GAME_CONFIG.MAJORITY_SEATS));
    test('ordinary with null votesAgainst → MAJORITY_SEATS', () => assert.equal(getRequiredSeats('ordinary', null), GAME_CONFIG.MAJORITY_SEATS));
    test('ordinary with votesAgainst=30 → 31', () => assert.equal(getRequiredSeats('ordinary', 30), 31));
    test('ordinary with votesAgainst=0 → 1', () => assert.equal(getRequiredSeats('ordinary', 0), 1));
});

// ─── calculateIdeologyPenalty ───────────────────────────────────────────────
suite('calculateIdeologyPenalty', () => {
    test('zero opposed → 0 (floor)', () => assert.equal(calculateIdeologyPenalty('floor', 0, 75), 0));
    test('zero opposed → 0 (passed)', () => assert.equal(calculateIdeologyPenalty('passed', 0, 75), 0));

    test('floor + low polarization (<50) → -floor(opposed/2)', () => {
        assert.equal(calculateIdeologyPenalty('floor', 4, 30), -2);
        assert.equal(calculateIdeologyPenalty('floor', 5, 49), -2);
        // Math.floor(1/2) === 0, then -1 * 0 === -0 in JS. Normalize with `+ 0`
        // so strict assert.equal accepts either signed zero.
        assert.equal(calculateIdeologyPenalty('floor', 1, 0) + 0, 0);
    });
    test('floor + high polarization (>=50) → -opposed', () => {
        assert.equal(calculateIdeologyPenalty('floor', 4, 50), -4);
        assert.equal(calculateIdeologyPenalty('floor', 4, 75), -4);
    });
    test('passed + mid polarization (<75) → -opposed', () => {
        assert.equal(calculateIdeologyPenalty('passed', 3, 50), -3);
        assert.equal(calculateIdeologyPenalty('passed', 3, 74), -3);
    });
    test('passed + high polarization (>=75) → -3 × opposed', () => {
        assert.equal(calculateIdeologyPenalty('passed', 3, 75), -9);
        assert.equal(calculateIdeologyPenalty('passed', 2, 100), -6);
    });
    test('null polarization treated as 0 → low-pol path', () => {
        assert.equal(calculateIdeologyPenalty('floor', 4, null), -2);
    });
    test('unknown stage → 0', () => {
        assert.equal(calculateIdeologyPenalty('committee', 4, 50), 0);
    });
});

// ─── calculateBillSupport ───────────────────────────────────────────────────
suite('calculateBillSupport', () => {
    test('sponsor only', () => {
        const r = calculateBillSupport([], 'sponsor', { sponsor: 30 });
        assert.equal(r.sponsorSeats, 30);
        assert.equal(r.acceptedSeats, 0);
        assert.equal(r.totalSupport, 30);
    });
    test('accepted partners add seats', () => {
        const r = calculateBillSupport(
            [
                { stance: 'accept', faction_id: 'p1' },
                { stance: 'accept', faction_id: 'p2' },
            ],
            'sponsor',
            { sponsor: 20, p1: 15, p2: 10 }
        );
        assert.equal(r.acceptedSeats, 25);
        assert.equal(r.totalSupport, 45);
    });
    test('reject stance excluded', () => {
        const r = calculateBillSupport(
            [
                { stance: 'accept', faction_id: 'p1' },
                { stance: 'reject', faction_id: 'p2' },
            ],
            'sponsor',
            { sponsor: 20, p1: 10, p2: 30 }
        );
        assert.equal(r.totalSupport, 30);
    });
    test('sponsor in support list excluded from acceptedSeats (no double-count)', () => {
        const r = calculateBillSupport(
            [
                { stance: 'accept', faction_id: 'sponsor' },
                { stance: 'accept', faction_id: 'p1' },
            ],
            'sponsor',
            { sponsor: 20, p1: 10 }
        );
        assert.equal(r.acceptedSeats, 10);
        assert.equal(r.totalSupport, 30);
    });
    test('falls back to seat_count when allPartySeats lookup misses', () => {
        const r = calculateBillSupport(
            [{ stance: 'accept', faction_id: 'p', seat_count: 12 }],
            'sponsor',
            { sponsor: 20 }
        );
        assert.equal(r.acceptedSeats, 12);
        assert.equal(r.totalSupport, 32);
    });
    test('null bill_support handled', () => {
        const r = calculateBillSupport(null, 'sponsor', { sponsor: 10 });
        assert.equal(r.totalSupport, 10);
    });
    test('missing sponsor in allPartySeats → 0', () => {
        const r = calculateBillSupport([], 'unknown', {});
        assert.equal(r.sponsorSeats, 0);
        assert.equal(r.totalSupport, 0);
    });
    test('percent uses GAME_CONFIG.TOTAL_SEATS', () => {
        const r = calculateBillSupport([], 'sponsor', { sponsor: GAME_CONFIG.MAJORITY_SEATS });
        const expected = Math.round((GAME_CONFIG.MAJORITY_SEATS / GAME_CONFIG.TOTAL_SEATS) * 100);
        assert.equal(r.percent, expected);
    });
});

// ─── evaluateBillVote ───────────────────────────────────────────────────────
suite('evaluateBillVote', () => {
    const TOTAL = 120;

    // Foundational (supermajority, no quorum)
    test('foundational supermajority reached → will_pass', () => {
        const r = evaluateBillVote({ bill_type: 'foundational', votes_for: 80, votes_against: 0, votes_abstain: 0 }, TOTAL);
        assert.equal(r.status, 'will_pass');
        assert.equal(r.reason, 'supermajority_reached');
    });
    test('foundational impossible → will_fail', () => {
        const r = evaluateBillVote({ bill_type: 'foundational', votes_for: 0, votes_against: 50, votes_abstain: 0 }, TOTAL);
        assert.equal(r.status, 'will_fail');
        assert.equal(r.reason, 'supermajority_impossible');
    });
    test('foundational in progress → pending', () => {
        const r = evaluateBillVote({ bill_type: 'foundational', votes_for: 30, votes_against: 0, votes_abstain: 0 }, TOTAL);
        assert.equal(r.status, 'pending');
    });
    test('foundational with constitutional_amendment_streamlining uses 55%', () => {
        const r = evaluateBillVote(
            { bill_type: 'foundational', votes_for: 70, votes_against: 0, votes_abstain: 0 },
            TOTAL,
            { constitutional_amendment_streamlining: true }
        );
        // 70 >= ceil(120 * 0.55) = 66 → will_pass
        assert.equal(r.status, 'will_pass');
    });
    test('foundational streamlining bill itself uses 67% even when streamlining is active', () => {
        const r = evaluateBillVote(
            {
                bill_type: 'foundational',
                votes_for: 70,
                votes_against: 0,
                votes_abstain: 0,
                proposed_constitutional_amendment_streamlining: true,
            },
            TOTAL,
            { constitutional_amendment_streamlining: true }
        );
        // 70 < ceil(120 * 0.667) = 80 → pending
        assert.equal(r.status, 'pending');
    });

    // Impeachment conviction
    test('impeachment_conviction with judicial politicization uses 75%', () => {
        const r = evaluateBillVote(
            { bill_type: 'impeachment_conviction', votes_for: 80, votes_against: 0, votes_abstain: 0 },
            TOTAL,
            { judicial_appointment_politicization: true }
        );
        // 80 < ceil(120 * 0.75) = 90 → pending
        assert.equal(r.status, 'pending');
    });

    // No-confidence (absolute majority, no quorum)
    test('no_confidence at exact majority → will_pass', () => {
        const r = evaluateBillVote({ bill_type: 'no_confidence', votes_for: 61, votes_against: 50, votes_abstain: 0 }, TOTAL);
        assert.equal(r.status, 'will_pass');
    });
    test('no_confidence with judicial politicization needs 60%', () => {
        const r = evaluateBillVote(
            { bill_type: 'no_confidence', votes_for: 65, votes_against: 0, votes_abstain: 0 },
            TOTAL,
            { judicial_appointment_politicization: true }
        );
        // 65 < ceil(120 * 0.6) = 72 → pending
        assert.equal(r.status, 'pending');
    });

    // Ordinary
    test('ordinary quorum not met but reachable → quorum_not_met', () => {
        const r = evaluateBillVote({ bill_type: 'ordinary', votes_for: 10, votes_against: 5, votes_abstain: 0 }, TOTAL);
        assert.equal(r.status, 'quorum_not_met');
        assert.equal(r.quorumMet, false);
    });
    test('ordinary majority locked → will_pass', () => {
        const r = evaluateBillVote({ bill_type: 'ordinary', votes_for: 70, votes_against: 30, votes_abstain: 0 }, TOTAL);
        assert.equal(r.status, 'will_pass');
        assert.equal(r.reason, 'majority_locked');
    });
    test('ordinary defeat locked → will_fail', () => {
        const r = evaluateBillVote({ bill_type: 'ordinary', votes_for: 30, votes_against: 70, votes_abstain: 0 }, TOTAL);
        assert.equal(r.status, 'will_fail');
        assert.equal(r.reason, 'defeat_locked');
    });
    test('ordinary current leader yes → passing', () => {
        const r = evaluateBillVote({ bill_type: 'ordinary', votes_for: 40, votes_against: 30, votes_abstain: 0 }, TOTAL);
        assert.equal(r.status, 'passing');
    });
    test('ordinary current leader no → failing', () => {
        const r = evaluateBillVote({ bill_type: 'ordinary', votes_for: 30, votes_against: 40, votes_abstain: 0 }, TOTAL);
        assert.equal(r.status, 'failing');
    });
    test('ordinary tied votes → tied', () => {
        const r = evaluateBillVote({ bill_type: 'ordinary', votes_for: 35, votes_against: 35, votes_abstain: 0 }, TOTAL);
        assert.equal(r.status, 'tied');
    });
    test('legislative_quorum_override 40 lowers threshold', () => {
        const r = evaluateBillVote(
            { bill_type: 'ordinary', votes_for: 30, votes_against: 20, votes_abstain: 0 },
            TOTAL,
            { legislative_quorum_override: 40 }
        );
        // quorum override 40% of 120 = 48; 50 participating ≥ 48 → quorum met → passing
        assert.equal(r.status, 'passing');
    });

    // Entrenchment
    test('entrenchment protected uses 60%', () => {
        const r = evaluateBillVote(
            { bill_type: 'ordinary', entrenchment_tier: 'protected', votes_for: 75, votes_against: 0, votes_abstain: 0 },
            TOTAL
        );
        // 75 >= ceil(120 * 0.6) = 72 → will_pass
        assert.equal(r.status, 'will_pass');
        assert.equal(r.entrenchmentTier, 'protected');
    });
    test('entrenchment entrenched uses 67%', () => {
        const r = evaluateBillVote(
            { bill_type: 'ordinary', entrenchment_tier: 'entrenched', votes_for: 75, votes_against: 0, votes_abstain: 0 },
            TOTAL
        );
        // 75 < ceil(120 * 0.667) = 80 → pending
        assert.equal(r.status, 'pending');
    });
});

// ─── resolveBillVote ────────────────────────────────────────────────────────
suite('resolveBillVote', () => {
    const TOTAL = 120;

    test('foundational at threshold → passed', () => {
        assert.equal(resolveBillVote({ bill_type: 'foundational', votes_for: 80, votes_against: 40, votes_abstain: 0 }, TOTAL), 'passed');
    });
    test('foundational below threshold → failed', () => {
        assert.equal(resolveBillVote({ bill_type: 'foundational', votes_for: 70, votes_against: 0, votes_abstain: 0 }, TOTAL), 'failed');
    });
    test('no_confidence at exact majority → passed', () => {
        assert.equal(resolveBillVote({ bill_type: 'no_confidence', votes_for: 61, votes_against: 0, votes_abstain: 0 }, TOTAL), 'passed');
    });
    test('no_confidence one short → failed', () => {
        assert.equal(resolveBillVote({ bill_type: 'no_confidence', votes_for: 60, votes_against: 0, votes_abstain: 0 }, TOTAL), 'failed');
    });
    test('ordinary quorum not met (first failure) → deferred', () => {
        const bill = { bill_type: 'ordinary', votes_for: 10, votes_against: 5, votes_abstain: 0, quorum_failures: 0 };
        assert.equal(resolveBillVote(bill, TOTAL), 'deferred');
    });
    test('ordinary quorum not met (second failure) → failed_no_quorum', () => {
        const bill = { bill_type: 'ordinary', votes_for: 10, votes_against: 5, votes_abstain: 0, quorum_failures: 1 };
        assert.equal(resolveBillVote(bill, TOTAL), 'failed_no_quorum');
    });
    test('ordinary quorum met, yes > no → passed', () => {
        const bill = { bill_type: 'ordinary', votes_for: 40, votes_against: 30, votes_abstain: 0, quorum_failures: 0 };
        assert.equal(resolveBillVote(bill, TOTAL), 'passed');
    });
    test('ordinary quorum met, yes < no → failed', () => {
        const bill = { bill_type: 'ordinary', votes_for: 30, votes_against: 35, votes_abstain: 0, quorum_failures: 0 };
        assert.equal(resolveBillVote(bill, TOTAL), 'failed');
    });
    test('ordinary tied (yes === no) → failed', () => {
        const bill = { bill_type: 'ordinary', votes_for: 40, votes_against: 40, votes_abstain: 0, quorum_failures: 0 };
        assert.equal(resolveBillVote(bill, TOTAL), 'failed');
    });
    test('entrenchment protected at 60% → passed', () => {
        const bill = { bill_type: 'ordinary', entrenchment_tier: 'protected', votes_for: 72, votes_against: 0, votes_abstain: 0 };
        assert.equal(resolveBillVote(bill, TOTAL), 'passed');
    });
    test('entrenchment protected one short → failed', () => {
        const bill = { bill_type: 'ordinary', entrenchment_tier: 'protected', votes_for: 71, votes_against: 0, votes_abstain: 0 };
        assert.equal(resolveBillVote(bill, TOTAL), 'failed');
    });
});

// ─── computeBillCostTotals ──────────────────────────────────────────────────
suite('computeBillCostTotals', () => {
    test('null bill → zeros', () => {
        const r = computeBillCostTotals(null, {});
        assert.equal(r.upfront, 0);
        assert.equal(r.ongoingMonthly, 0);
        assert.equal(r.ongoingYearly, 0);
    });
    test('empty articles → zeros', () => {
        const r = computeBillCostTotals({ bill_articles: [] }, {});
        assert.equal(r.upfront, 0);
        assert.equal(r.ongoingMonthly, 0);
    });
    test('text-only article → zero', () => {
        const r = computeBillCostTotals({ bill_articles: [{}] }, {});
        assert.equal(r.upfront, 0);
    });
    test('policy article without scaling → raw cost', () => {
        const bill = {
            bill_articles: [{
                policies: { upfront_cost: 100000, ongoing_cost_per_tick: 5000 },
            }],
        };
        const r = computeBillCostTotals(bill, {});
        assert.equal(r.upfront, 100000);
        assert.equal(r.ongoingMonthly, 5000);
        assert.equal(r.ongoingYearly, 60000);
    });
    test('repeal article subtracts ongoing (negative monthly)', () => {
        const bill = {
            bill_articles: [{
                repeal_active_law_id: 'law-1',
                policies: { ongoing_cost_per_tick: 8000 },
            }],
        };
        const r = computeBillCostTotals(bill, {});
        assert.equal(r.upfront, 0);
        assert.equal(r.ongoingMonthly, -8000);
        assert.equal(r.ongoingYearly, -96000);
    });
    test('funding_data: discretionary upfront + delta-pct × base_cost monthly', () => {
        const bill = {
            bill_articles: [{
                funding_data: {
                    discretionary: 500000,
                    institutions: [
                        { current_pct: 50, proposed_pct: 70, base_cost: 1000000 }, // +20% × 1M = 200k
                        { current_pct: 30, proposed_pct: 30, base_cost: 500000 },  // unchanged
                    ],
                },
            }],
        };
        const r = computeBillCostTotals(bill, {});
        assert.equal(r.upfront, 500000);
        assert.equal(r.ongoingMonthly, 200000);
    });
    test('multiple articles sum correctly (policy + policy + repeal)', () => {
        const bill = {
            bill_articles: [
                { policies: { upfront_cost: 50000, ongoing_cost_per_tick: 1000 } },
                { policies: { upfront_cost: 30000, ongoing_cost_per_tick: 2000 } },
                { repeal_active_law_id: 'x', policies: { ongoing_cost_per_tick: 500 } },
            ],
        };
        const r = computeBillCostTotals(bill, {});
        assert.equal(r.upfront, 80000);
        assert.equal(r.ongoingMonthly, 1000 + 2000 - 500);
    });
    test('policy with ongoing_base_cost (legacy fallback)', () => {
        const bill = {
            bill_articles: [{
                policies: { upfront_cost: 0, ongoing_base_cost: 7500 },
            }],
        };
        const r = computeBillCostTotals(bill, {});
        assert.equal(r.ongoingMonthly, 7500);
    });
});

// ─── Summary ───────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
        console.log(`  ✗ ${f.name}`);
        console.log(`    ${f.error.message}`);
    }
    process.exit(1);
}
