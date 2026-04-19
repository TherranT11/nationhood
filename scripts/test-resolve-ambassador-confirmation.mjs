// scripts/test-resolve-ambassador-confirmation.mjs
//
// Phase R4: resolver-level tests for resolveAmbassadorConfirmationBill.
// Uses the shared recording Supabase mock extracted in R4 scope.
//
// Run with `npm run test:resolve-ambassador-confirmation`.

import assert from 'node:assert/strict';
import { resolveAmbassadorConfirmationBill } from '../js/game/bills.js';
import { createSupabaseMock, callsFor } from './support/test-supabase-mock.mjs';

// ─── Test fixtures ──────────────────────────────────────────────────────────
function makeBill(overrides = {}) {
    return {
        id: 'bill-1',
        nation_id: 'nation-1',
        bill_name: 'Confirmation of Ambassador',
        bill_type: 'confirmation',
        ambassador_id: 'amb-1',
        bill_support: [],
        early_resolution_status: null,
        ...overrides,
    };
}
function makeCtx(overrides = {}) {
    return {
        passed: true,
        currentTick: 42,
        nation: { id: 'nation-1', name: 'Testland' },
        votesFor: 70,
        votesAgainst: 30,
        votesAbstain: 5,
        ...overrides,
    };
}

// ─── Tiny test runner ───────────────────────────────────────────────────────
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

// ─── Scenarios ──────────────────────────────────────────────────────────────

await suite('passed path', async () => {
    await test('activates ambassador + marks bill passed', async () => {
        const supabase = createSupabaseMock({
            'ambassadors.select': { data: { faction_id: 'party-1' }, error: null },
        });
        const entry = await resolveAmbassadorConfirmationBill(supabase, makeBill(), makeCtx());

        assert.equal(entry.result, 'passed');
        assert.equal(entry.type, 'confirmation');

        const billUpd = callsFor(supabase, 'bills', 'update');
        assert.equal(billUpd.length, 1);
        assert.equal(billUpd[0].chain[0].args[0].status, 'passed');
        assert.equal(billUpd[0].chain[0].args[0].passed_tick, 42);

        const ambUpd = callsFor(supabase, 'ambassadors', 'update');
        assert.equal(ambUpd.length, 1);
        const fields = ambUpd[0].chain[0].args[0];
        assert.equal(fields.status, 'active');
        assert.equal(fields.is_active, true);
        assert.equal(fields.appointed_at_tick, 42);
    });

    await test('no ambassador row found: still passes if ctx.passed is true', async () => {
        const supabase = createSupabaseMock({
            'ambassadors.select': { data: null, error: null },
        });
        const entry = await resolveAmbassadorConfirmationBill(supabase, makeBill(), makeCtx());
        // No ambNomineeId → nomineeVotedNo can't short-circuit → stays passed
        assert.equal(entry.result, 'passed');
    });
});

await suite('auto-fail: nominee voted NO', async () => {
    await test('nominee stance "no" → force-fail + reject ambassador', async () => {
        const supabase = createSupabaseMock({
            'ambassadors.select': { data: { faction_id: 'party-1' }, error: null },
        });
        const bill = makeBill({
            bill_support: [{ faction_id: 'party-1', stance: 'no' }],
        });
        const entry = await resolveAmbassadorConfirmationBill(supabase, bill, makeCtx());

        assert.equal(entry.result, 'failed');
        const ambUpd = callsFor(supabase, 'ambassadors', 'update');
        assert.equal(ambUpd.length, 1);
        const fields = ambUpd[0].chain[0].args[0];
        assert.equal(fields.status, 'rejected');
        assert.equal(fields.is_active, false);
    });

    await test('nominee stance "reject" (alias) → force-fail', async () => {
        const supabase = createSupabaseMock({
            'ambassadors.select': { data: { faction_id: 'party-1' }, error: null },
        });
        const bill = makeBill({
            bill_support: [{ faction_id: 'party-1', stance: 'reject' }],
        });
        const entry = await resolveAmbassadorConfirmationBill(supabase, bill, makeCtx());
        assert.equal(entry.result, 'failed');
    });

    await test('non-nominee voting no does NOT force-fail', async () => {
        const supabase = createSupabaseMock({
            'ambassadors.select': { data: { faction_id: 'party-1' }, error: null },
        });
        const bill = makeBill({
            bill_support: [
                { faction_id: 'party-2', stance: 'no' },
                { faction_id: 'party-3', stance: 'no' },
            ],
        });
        const entry = await resolveAmbassadorConfirmationBill(supabase, bill, makeCtx());
        // ctx.passed is true and the nominee (party-1) didn't vote no
        assert.equal(entry.result, 'passed');
    });
});

await suite('failed path', async () => {
    await test('ctx.passed=false → rejects ambassador + calls failBill', async () => {
        const supabase = createSupabaseMock({
            'ambassadors.select': { data: { faction_id: 'party-1' }, error: null },
        });
        const entry = await resolveAmbassadorConfirmationBill(
            supabase, makeBill(), makeCtx({ passed: false }),
        );

        assert.equal(entry.result, 'failed');

        // failBill issues a bills.update with status=failed
        const billUpds = callsFor(supabase, 'bills', 'update');
        assert.ok(billUpds.some(c => c.chain[0].args[0].status === 'failed'),
            'expected a bills.update with status=failed');

        // ambassador rejected
        const ambUpd = callsFor(supabase, 'ambassadors', 'update');
        assert.equal(ambUpd.length, 1);
        assert.equal(ambUpd[0].chain[0].args[0].status, 'rejected');
        assert.equal(ambUpd[0].chain[0].args[0].is_active, false);
    });
});

await suite('return shape', async () => {
    await test('carries early_resolution_status through', async () => {
        const supabase = createSupabaseMock({
            'ambassadors.select': { data: { faction_id: 'party-1' }, error: null },
        });
        const bill = makeBill({ early_resolution_status: 'supermajority_reached' });
        const entry = await resolveAmbassadorConfirmationBill(supabase, bill, makeCtx());
        assert.equal(entry.earlyResolution, 'supermajority_reached');
        assert.equal(entry.billId, 'bill-1');
        assert.equal(entry.billName, 'Confirmation of Ambassador');
        assert.equal(entry.votesFor, 70);
        assert.equal(entry.votesAgainst, 30);
        assert.equal(entry.type, 'confirmation');
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
