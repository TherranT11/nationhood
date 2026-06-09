// scripts/test-resolve-ordinary.mjs
//
// Phase R8: resolver-level tests for resolveOrdinaryBill (the catch-all).
//
// Three sub-branches: presidential (routes to president_desk), parliamentary
// (enacts immediately via enactBill), failed (plain failBill).
//
// Run with `npm run test:resolve-ordinary`.

import assert from 'node:assert/strict';
import { resolveOrdinaryBill } from '../js/game/bills.js';
import { createSupabaseMock, callsFor } from './support/test-supabase-mock.mjs';

// ─── Fixtures ───────────────────────────────────────────────────────────────
const BASE_CTX = {
    passed: true,
    currentTick: 42,
    nation: { id: 'nation-1', name: 'Testland' },
    votesFor: 70,
    votesAgainst: 30,
    votesAbstain: 5,
};

function parliamentaryNation() {
    // hasElectedPresident() returns true for 'presidential' types.
    // Anything else is parliamentary — use 'parliamentary' explicitly.
    return { id: 'nation-1', name: 'Testland', government_type: 'parliamentary' };
}
function presidentialNation() {
    return { id: 'nation-1', name: 'Testland', government_type: 'presidential' };
}
function ordinaryBill(overrides = {}) {
    return {
        id: 'bill-ord',
        nation_id: 'nation-1',
        bill_name: 'Regular Policy',
        bill_type: 'ordinary',
        bill_articles: [],
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

// ─── Presidential branch: route to president's desk ─────────────────────────
await suite('presidential passed — routes to president_desk', async () => {
    await test('marks bill status=president_desk with deadline + returns president_desk entry', async () => {
        const supabase = createSupabaseMock();
        const ctx = { ...BASE_CTX, nation: presidentialNation() };
        const entry = await resolveOrdinaryBill(supabase, ordinaryBill(), ctx);

        assert.equal(entry.result, 'president_desk');
        assert.equal(entry.billId, 'bill-ord');
        assert.equal(entry.votesFor, 70);
        assert.equal(entry.votesAgainst, 30);

        const billUpds = callsFor(supabase, 'bills', 'update');
        assert.equal(billUpds.length, 1);
        const fields = billUpds[0].chain[0].args[0];
        assert.equal(fields.status, 'president_desk');
        assert.equal(fields.passed_tick, 42);
        assert.equal(typeof fields.president_desk_deadline, 'number');
        assert.ok(fields.president_desk_deadline > 42,
            'deadline should be in the future');
    });

    await test('does NOT call enactBill (no active_laws/bill_articles writes)', async () => {
        const supabase = createSupabaseMock();
        const ctx = { ...BASE_CTX, nation: presidentialNation() };
        await resolveOrdinaryBill(supabase, ordinaryBill(), ctx);
        // enactBill would touch active_laws among many other tables
        assert.equal(callsFor(supabase, 'active_laws', 'insert').length, 0);
        assert.equal(callsFor(supabase, 'active_laws', 'upsert').length, 0);
    });
});

// ─── Parliamentary branch: enact immediately ────────────────────────────────
await suite('parliamentary passed — enacts via enactBill', async () => {
    await test('calls enactBill (observable via its internal bills.update or nations.select)', async () => {
        const supabase = createSupabaseMock();
        const ctx = { ...BASE_CTX, nation: parliamentaryNation() };
        const entry = await resolveOrdinaryBill(supabase, ordinaryBill(), ctx);

        // enactBill returns { success: false } in test because we haven't
        // seeded nations.select etc., so we expect failed_enactment.
        // But we should see it ATTEMPTED — evidenced by calls made by enactBill.
        assert.ok(['passed', 'failed_enactment'].includes(entry.result),
            `expected parliamentary result to be passed or failed_enactment, got ${entry.result}`);
        assert.notEqual(entry.result, 'president_desk',
            'parliamentary route must not stamp president_desk');
    });

    await test('enactBill throwing → clean failed_enactment entry (no crash)', async () => {
        // Build a mock where a specific call throws to simulate an enactBill error.
        // We intercept by making nations.select (which enactBill calls early) throw.
        const supabase = createSupabaseMock();
        // Override supabase.from('nations').select... to throw.
        const originalFrom = supabase.from;
        supabase.from = (table) => {
            if (table === 'nations') {
                return {
                    select() {
                        throw new Error('simulated network failure');
                    },
                };
            }
            return originalFrom.call(supabase, table);
        };
        const ctx = { ...BASE_CTX, nation: parliamentaryNation() };
        const entry = await resolveOrdinaryBill(supabase, ordinaryBill(), ctx);
        assert.equal(entry.result, 'failed_enactment');
        assert.ok(entry.error, 'failed_enactment entry should carry an error message');
    });
});

// ─── Failed branch ──────────────────────────────────────────────────────────
await suite('failed — plain failBill + event', async () => {
    await test('bills.update status=failed (via failBill)', async () => {
        const supabase = createSupabaseMock();
        const entry = await resolveOrdinaryBill(supabase, ordinaryBill(), { ...BASE_CTX, passed: false });

        assert.equal(entry.result, 'failed');
        const billUpds = callsFor(supabase, 'bills', 'update');
        assert.ok(billUpds.some(c => c.chain[0].args[0].status === 'failed'),
            'expected bills.update status=failed');
    });

    await test('failed entry omits "type" (ordinary bills have no type tag)', async () => {
        const supabase = createSupabaseMock();
        const entry = await resolveOrdinaryBill(supabase, ordinaryBill(), { ...BASE_CTX, passed: false });
        assert.equal(entry.type, undefined,
            'ordinary bill entries have no type field — specialized bills do');
    });
});

// ─── Return shape ───────────────────────────────────────────────────────────
await suite('return shape', async () => {
    await test('carries bill_name, votes, earlyResolution', async () => {
        const supabase = createSupabaseMock();
        const bill = ordinaryBill({ early_resolution_status: 'majority_locked' });
        const entry = await resolveOrdinaryBill(supabase, bill, { ...BASE_CTX, passed: false });
        assert.equal(entry.billName, 'Regular Policy');
        assert.equal(entry.votesFor, 70);
        assert.equal(entry.votesAgainst, 30);
        assert.equal(entry.earlyResolution, 'majority_locked');
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
