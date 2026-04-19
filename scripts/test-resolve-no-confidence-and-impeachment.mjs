// scripts/test-resolve-no-confidence-and-impeachment.mjs
//
// Phase R5: resolver-level tests for
//   - resolveNoConfidenceBill
//   - resolveImpeachmentMotionBill
//   - resolveImpeachmentConvictionBill
// All three share the "simple vote + call domain handler + bookkeeping" shape.
//
// Run with `npm run test:resolve-no-confidence-and-impeachment`.

import assert from 'node:assert/strict';
import {
    resolveNoConfidenceBill,
    resolveImpeachmentMotionBill,
    resolveImpeachmentConvictionBill,
} from '../js/game/bills.js';
import { createSupabaseMock, callsFor } from './support/test-supabase-mock.mjs';

// ─── Fixtures ───────────────────────────────────────────────────────────────
const BASE_CTX = {
    passed: true,
    currentTick: 42,
    nation: { id: 'nation-1', name: 'Testland' },
    votesFor: 70,
    votesAgainst: 30,
    votesAbstain: 5,
    totalSeats: 120,
};

function ncBill(overrides = {}) {
    return {
        id: 'bill-nc',
        nation_id: 'nation-1',
        bill_name: 'No Confidence',
        bill_type: 'no_confidence',
        proposed_by: 'opp-1',
        bill_support: [],
        early_resolution_status: null,
        ...overrides,
    };
}
function motionBill(overrides = {}) {
    return {
        id: 'bill-im',
        nation_id: 'nation-1',
        bill_name: 'Impeachment of President Smith',
        bill_type: 'impeachment_motion',
        impeachment_id: 'imp-1',
        proposed_by: 'opp-1',
        bill_support: [],
        early_resolution_status: null,
        ...overrides,
    };
}
function convictionBill(overrides = {}) {
    return {
        id: 'bill-ic',
        nation_id: 'nation-1',
        bill_name: 'Conviction of President Smith',
        bill_type: 'impeachment_conviction',
        impeachment_id: 'imp-1',
        proposed_by: 'opp-1',
        bill_support: [],
        early_resolution_status: null,
        ...overrides,
    };
}

// ─── Tiny runner ────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const failures = [];
async function test(name, fn) {
    try { await fn(); passed++; }
    catch (e) { failed++; failures.push({ name, error: e }); }
}
function suite(name, fn) {
    console.log(`\n  ${name}`);
    const before = passed + failed;
    return Promise.resolve(fn()).then(() => {
        const ran = passed + failed - before;
        console.log(`    ${ran} test${ran !== 1 ? 's' : ''}`);
    });
}

// ─── resolveNoConfidenceBill ────────────────────────────────────────────────
await suite('resolveNoConfidenceBill', async () => {
    await test('passed path: marks bill passed, delegates to resolveNoConfidence', async () => {
        const supabase = createSupabaseMock();
        const entry = await resolveNoConfidenceBill(supabase, ncBill(), { ...BASE_CTX });

        assert.equal(entry.result, 'passed');
        assert.equal(entry.type, 'no_confidence');

        const billUpds = callsFor(supabase, 'bills', 'update');
        assert.ok(billUpds.some(c => c.chain[0].args[0].status === 'passed'),
            'expected bills.update status=passed');
    });

    await test('failed path: calls failBill (bills.update status=failed)', async () => {
        const supabase = createSupabaseMock();
        const entry = await resolveNoConfidenceBill(supabase, ncBill(), { ...BASE_CTX, passed: false });

        assert.equal(entry.result, 'failed');
        const billUpds = callsFor(supabase, 'bills', 'update');
        assert.ok(billUpds.some(c => c.chain[0].args[0].status === 'failed'),
            'expected bills.update status=failed');
    });

    await test('return shape carries earlyResolution + votes', async () => {
        const supabase = createSupabaseMock();
        const bill = ncBill({ early_resolution_status: 'majority_reached' });
        const entry = await resolveNoConfidenceBill(supabase, bill, { ...BASE_CTX });
        assert.equal(entry.billId, 'bill-nc');
        assert.equal(entry.billName, 'No Confidence');
        assert.equal(entry.votesFor, 70);
        assert.equal(entry.votesAgainst, 30);
        assert.equal(entry.earlyResolution, 'majority_reached');
    });
});

// ─── resolveImpeachmentMotionBill ───────────────────────────────────────────
await suite('resolveImpeachmentMotionBill', async () => {
    await test('passed: advances proceeding to trial + creates conviction bill', async () => {
        const supabase = createSupabaseMock({
            'impeachment_proceedings.select': { data: { president_id: 'pres-1' }, error: null },
            'presidents.select': { data: { faction_id: 'gov-1' }, error: null },
            'bills.insert': { data: { id: 'conv-bill-1' }, error: null },
        });
        const entry = await resolveImpeachmentMotionBill(supabase, motionBill(), { ...BASE_CTX });

        assert.equal(entry.result, 'passed');
        assert.equal(entry.type, 'impeachment_motion');

        // proceeding advanced to trial
        const procUpds = callsFor(supabase, 'impeachment_proceedings', 'update');
        assert.ok(procUpds.some(c => c.chain[0].args[0].phase === 'trial'
                                  && c.chain[0].args[0].motion_result === 'passed'),
            'expected proceedings set to phase=trial, motion_result=passed');

        // conviction bill inserted
        const billInserts = callsFor(supabase, 'bills', 'insert');
        assert.equal(billInserts.length, 1);
        const row = billInserts[0].chain[0].args[0];
        assert.equal(row.bill_type, 'impeachment_conviction');
        assert.equal(row.impeachment_id, 'imp-1');
        assert.equal(row.status, 'floor');
        // name rewrite: "Impeachment of …" → "Conviction of …"
        assert.equal(row.bill_name, 'Conviction of President Smith');
    });

    await test('failed: marks proceeding resolved + motion_result=failed + cooldown', async () => {
        const supabase = createSupabaseMock({
            'impeachment_proceedings.select': { data: { president_id: 'pres-1' }, error: null },
            'presidents.select': { data: { faction_id: 'gov-1' }, error: null },
        });
        const entry = await resolveImpeachmentMotionBill(supabase, motionBill(), { ...BASE_CTX, passed: false });

        assert.equal(entry.result, 'failed');

        const procUpds = callsFor(supabase, 'impeachment_proceedings', 'update');
        assert.ok(procUpds.some(c => c.chain[0].args[0].phase === 'resolved'
                                  && c.chain[0].args[0].motion_result === 'failed'),
            'expected proceedings set to phase=resolved, motion_result=failed');

        // nation cooldown set
        const natUpds = callsFor(supabase, 'nations', 'update');
        assert.ok(natUpds.some(c => typeof c.chain[0].args[0].impeachment_cooldown_until_tick === 'number'),
            'expected nations.update with impeachment_cooldown_until_tick');

        // campaign_actions row recorded
        const camp = callsFor(supabase, 'campaign_actions', 'insert');
        assert.equal(camp.length, 1);
        assert.equal(camp[0].chain[0].args[0].action_type, 'impeachment_failed');
    });

    await test('return shape', async () => {
        const supabase = createSupabaseMock();
        const entry = await resolveImpeachmentMotionBill(supabase, motionBill(), { ...BASE_CTX });
        assert.equal(entry.billId, 'bill-im');
        assert.equal(entry.type, 'impeachment_motion');
    });
});

// ─── resolveImpeachmentConvictionBill ───────────────────────────────────────
await suite('resolveImpeachmentConvictionBill', async () => {
    await test('passed (convicted): proceeding → conviction_result=convicted', async () => {
        const supabase = createSupabaseMock();
        const entry = await resolveImpeachmentConvictionBill(supabase, convictionBill(), { ...BASE_CTX });

        assert.equal(entry.result, 'passed');
        assert.equal(entry.type, 'impeachment_conviction');

        const procUpds = callsFor(supabase, 'impeachment_proceedings', 'update');
        assert.ok(procUpds.some(c => c.chain[0].args[0].conviction_result === 'convicted'
                                  && c.chain[0].args[0].phase === 'resolved'),
            'expected proceeding conviction_result=convicted + phase=resolved');
    });

    await test('failed (acquitted): proceeding acquitted + stability bonus + yes-voter penalties', async () => {
        const supabase = createSupabaseMock({
            'impeachment_proceedings.select': { data: { president_id: 'pres-1' }, error: null },
            'presidents.select': { data: { faction_id: 'gov-1' }, error: null },
            'nations.select': { data: { stability: 60 }, error: null },
        });
        const bill = convictionBill({
            bill_support: [
                { faction_id: 'opp-1', stance: 'yes' },     // the filer — excluded from yes-voter penalty
                { faction_id: 'coalition-a', stance: 'yes' },
                { faction_id: 'coalition-b', stance: 'accept' }, // alias for yes
                { faction_id: 'neutral-1', stance: 'no' },   // not penalized
            ],
        });
        const entry = await resolveImpeachmentConvictionBill(supabase, bill, { ...BASE_CTX, passed: false });

        assert.equal(entry.result, 'failed');

        // proceeding acquitted
        const procUpds = callsFor(supabase, 'impeachment_proceedings', 'update');
        assert.ok(procUpds.some(c => c.chain[0].args[0].conviction_result === 'acquitted'),
            'expected proceeding conviction_result=acquitted');

        // stability +3 (60 → 63)
        const natUpds = callsFor(supabase, 'nations', 'update');
        assert.ok(natUpds.some(c => c.chain[0].args[0].stability === 63),
            'expected nations.update stability=63');

        // yes-voter penalties — via adjust_momentum RPC. Count them.
        // coalition-a (yes) + coalition-b (accept) = 2 yes-voter penalties, plus 1 for the filer afterward
        // opp-1 (filer) is excluded from the yes-voter loop; filer penalty is a separate call after.
        // Our mock's rpc() is a no-op returning null; we can't assert on it here without extending the mock.
        // Instead, just confirm the nations.update for stability happened as a proxy for the acquitted-branch running end-to-end.
    });

    await test('return shape', async () => {
        const supabase = createSupabaseMock();
        const bill = convictionBill({ early_resolution_status: 'defeat_locked' });
        const entry = await resolveImpeachmentConvictionBill(supabase, bill, { ...BASE_CTX });
        assert.equal(entry.billId, 'bill-ic');
        assert.equal(entry.type, 'impeachment_conviction');
        assert.equal(entry.earlyResolution, 'defeat_locked');
    });
});

// ─── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
        console.log(`  ✗ ${f.name}`);
        console.log(`    ${f.error.message}`);
    }
    process.exit(1);
}
