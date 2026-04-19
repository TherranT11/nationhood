// scripts/test-resolve-minister-confirmation.mjs
//
// Phase R3 of the bills.js refactor: resolver-level tests for the extracted
// resolveMinisterConfirmationBill() function. Exercises each success/fail
// path with a recording Supabase mock so we assert on the exact DB calls
// the resolver makes.
//
// Run with `npm run test:resolve-minister-confirmation`.

import assert from 'node:assert/strict';
import { resolveMinisterConfirmationBill } from '../js/game/bills.js';

// ─── Recording Supabase mock ────────────────────────────────────────────────
// Records every call chain. Responses for specific operations can be
// pre-seeded via the `responses` map keyed by "table.rootOp" (e.g.
// "ministries.select", "nations.select"); both single/maybeSingle variants
// resolve to the same entry, and update/insert/delete fall through to
// { data: null, error: null } unless overridden.
function createSupabaseMock(responses = {}) {
    const calls = [];

    function makeChain(table) {
        const chain = [];

        function resolveResponse() {
            const rootOp = chain[0]?.method;
            const key = `${table}.${rootOp}`;
            return responses[key] || { data: null, error: null };
        }

        const builder = new Proxy({}, {
            get(_, prop) {
                if (prop === 'then') {
                    return (onFulfilled, onRejected) => {
                        const response = resolveResponse();
                        calls.push({ table, chain: chain.slice(), response });
                        return Promise.resolve(response).then(onFulfilled, onRejected);
                    };
                }
                return (...args) => {
                    chain.push({ method: prop, args });
                    if (prop === 'single' || prop === 'maybeSingle') {
                        const response = resolveResponse();
                        calls.push({ table, chain: chain.slice(), response });
                        return Promise.resolve(response);
                    }
                    return builder;
                };
            },
        });
        return builder;
    }

    return {
        from(table) { return makeChain(table); },
        rpc() { return Promise.resolve({ data: null, error: null }); },
        _calls: calls,
    };
}

// Helpers to query the recorded calls.
function callsFor(supabase, table, rootOp) {
    return supabase._calls.filter(c => c.table === table && c.chain[0]?.method === rootOp);
}
function firstArg(call, method) {
    const step = call.chain.find(s => s.method === method);
    return step?.args[0];
}

// Minimal bill + context factory.
function makeBill(overrides = {}) {
    return {
        id: 'bill-1',
        nation_id: 'nation-1',
        bill_name: 'Test Confirmation',
        bill_type: 'minister_confirmation',
        ministry_key: 'defense',
        bill_support: [],
        metadata: {
            pending_minister: {
                party_id: 'party-1',
                first_name: 'Anna',
                last_name: 'Kowalski',
                age: 48,
            },
        },
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

await suite('passed + existing ministry row', async () => {
    await test('updates existing ministry row with confirmed nominee', async () => {
        const supabase = createSupabaseMock({
            'ministries.select':     { data: { id: 'min-1', is_acting: false }, error: null },
            'nations.select':        { data: { id: 'nation-1', gdp: 1000 }, error: null },
            'bills.update':          { data: null, error: null },
            'ministries.update':     { data: null, error: null },
            'event_log.insert':      { data: null, error: null },
        });
        const entry = await resolveMinisterConfirmationBill(supabase, makeBill(), makeCtx());

        assert.equal(entry.result, 'passed');
        assert.equal(entry.type, 'minister_confirmation');

        // bills.update: status passed
        const billUpd = callsFor(supabase, 'bills', 'update');
        assert.equal(billUpd.length, 1);
        assert.equal(billUpd[0].chain[0].args[0].status, 'passed');
        assert.equal(billUpd[0].chain[0].args[0].passed_tick, 42);

        // ministries.update with the confirmed nominee's data
        const minUpd = callsFor(supabase, 'ministries', 'update');
        assert.equal(minUpd.length, 1);
        const fields = minUpd[0].chain[0].args[0];
        assert.equal(fields.party_id, 'party-1');
        assert.equal(fields.minister_first_name, 'Anna');
        assert.equal(fields.minister_last_name, 'Kowalski');
        assert.equal(fields.minister_age, 48);
        assert.equal(fields.confirmation_status, 'confirmed');
        assert.equal(fields.pending_minister, null);
        // Update targets the pre-existing ministry row by id
        assert.equal(firstArg(minUpd[0], 'eq'), 'id');
        // No ministries.insert was issued
        assert.equal(callsFor(supabase, 'ministries', 'insert').length, 0);
    });
});

await suite('passed + missing ministry row', async () => {
    await test('inserts new ministry row with confirmed nominee', async () => {
        const supabase = createSupabaseMock({
            'ministries.select':  { data: null, error: null }, // NO existing row
            'nations.select':     { data: { id: 'nation-1' }, error: null },
            'bills.update':       { data: null, error: null },
            'ministries.insert':  { data: null, error: null },
        });
        const entry = await resolveMinisterConfirmationBill(supabase, makeBill(), makeCtx());

        assert.equal(entry.result, 'passed');
        assert.equal(callsFor(supabase, 'ministries', 'update').length, 0);

        const ins = callsFor(supabase, 'ministries', 'insert');
        assert.equal(ins.length, 1);
        const row = ins[0].chain[0].args[0];
        assert.equal(row.nation_id, 'nation-1');
        assert.equal(row.ministry_key, 'defense');
        assert.equal(row.is_active, true);
        assert.equal(row.minister_first_name, 'Anna');
        assert.equal(row.confirmation_status, 'confirmed');
    });
});

await suite('passed PM confirmation — installs HOG + syncs gov_formations', async () => {
    await test('updates government_formations.ministry_assignments.prime_minister', async () => {
        const supabase = createSupabaseMock({
            'ministries.select': { data: { id: 'min-pm', is_acting: false }, error: null },
            'nations.select':    { data: { id: 'nation-1' }, error: null },
            'government_formations.select': {
                data: { id: 'gf-1', ministry_assignments: { interior: 'p2' } },
                error: null,
            },
            'factions.select': { data: { leader_ideology: 'LEFT' }, error: null },
        });
        const entry = await resolveMinisterConfirmationBill(
            supabase,
            makeBill({ ministry_key: 'prime_minister' }),
            makeCtx(),
        );

        assert.equal(entry.result, 'passed');

        const gfUpd = callsFor(supabase, 'government_formations', 'update');
        assert.equal(gfUpd.length, 1);
        const gfFields = gfUpd[0].chain[0].args[0];
        assert.deepEqual(gfFields.ministry_assignments, { interior: 'p2', prime_minister: 'party-1' });
    });

    await test('upserts head_of_government via installHOG', async () => {
        const supabase = createSupabaseMock({
            'ministries.select': { data: { id: 'min-pm', is_acting: false }, error: null },
            'nations.select':    { data: { id: 'nation-1' }, error: null },
            'government_formations.select': { data: null, error: null },
            'factions.select': { data: { leader_ideology: 'RIGHT' }, error: null },
        });
        await resolveMinisterConfirmationBill(
            supabase,
            makeBill({ ministry_key: 'prime_minister' }),
            makeCtx(),
        );

        // installHOG: deactivate any active HOG, then upsert the new one.
        const hogUpd = callsFor(supabase, 'head_of_government', 'update');
        assert.equal(hogUpd.length, 1);
        assert.equal(hogUpd[0].chain[0].args[0].active, false);

        const hogUpsert = callsFor(supabase, 'head_of_government', 'upsert');
        assert.equal(hogUpsert.length, 1);
        const row = hogUpsert[0].chain[0].args[0];
        assert.equal(row.nation_id, 'nation-1');
        assert.equal(row.faction_id, 'party-1');
        assert.equal(row.first_name, 'Anna');
        assert.equal(row.last_name, 'Kowalski');
        assert.equal(row.active, true);
        assert.equal(row.ideology, 'RIGHT'); // resolved from factions.leader_ideology
    });

    await test('non-PM confirmation does NOT install HOG or touch gov_formations', async () => {
        const supabase = createSupabaseMock({
            'ministries.select': { data: { id: 'min-d', is_acting: false }, error: null },
            'nations.select':    { data: { id: 'nation-1' }, error: null },
        });
        await resolveMinisterConfirmationBill(
            supabase,
            makeBill({ ministry_key: 'defense' }),
            makeCtx(),
        );
        assert.equal(callsFor(supabase, 'head_of_government', 'upsert').length, 0);
        assert.equal(callsFor(supabase, 'government_formations', 'update').length, 0);
    });
});

await suite('force-fail paths', async () => {
    await test('missing bill.metadata.pending_minister → force-fail + returns failed', async () => {
        const supabase = createSupabaseMock({
            'ministries.select': { data: { id: 'min-1', is_acting: false }, error: null },
        });
        const bill = makeBill({ metadata: {} });
        const entry = await resolveMinisterConfirmationBill(supabase, bill, makeCtx());

        assert.equal(entry.result, 'failed');
        // bills.update from failBill path (not the status='passed' path)
        const billUpds = callsFor(supabase, 'bills', 'update');
        // failBill issues exactly one bills.update with status 'failed'
        assert.ok(billUpds.some(c => c.chain[0].args[0].status === 'failed'),
            'expected a bills.update with status=failed');
        // No ministries.update with party_id (no confirmation happened)
        const minUpds = callsFor(supabase, 'ministries', 'update');
        assert.ok(!minUpds.some(c => c.chain[0].args[0].party_id === 'party-1'),
            'expected no confirmation-style ministries update');
    });

    await test('nominee party voted NO → force-fail', async () => {
        const supabase = createSupabaseMock({
            'ministries.select': { data: { id: 'min-1', is_acting: false }, error: null },
        });
        const bill = makeBill({
            bill_support: [{ faction_id: 'party-1', stance: 'no' }],
        });
        const entry = await resolveMinisterConfirmationBill(supabase, bill, makeCtx());
        assert.equal(entry.result, 'failed');
    });

    await test('nominee voted "reject" (alias for no) → force-fail', async () => {
        const supabase = createSupabaseMock({
            'ministries.select': { data: { id: 'min-1', is_acting: false }, error: null },
        });
        const bill = makeBill({
            bill_support: [{ faction_id: 'party-1', stance: 'reject' }],
        });
        const entry = await resolveMinisterConfirmationBill(supabase, bill, makeCtx());
        assert.equal(entry.result, 'failed');
    });
});

await suite('failed branch — cleans up pending hint', async () => {
    await test('existing non-acting ministry → confirmation_status=rejected, pending cleared', async () => {
        const supabase = createSupabaseMock({
            'ministries.select': { data: { id: 'min-1', is_acting: false }, error: null },
        });
        const entry = await resolveMinisterConfirmationBill(
            supabase, makeBill(), makeCtx({ passed: false }),
        );

        assert.equal(entry.result, 'failed');
        const minUpd = callsFor(supabase, 'ministries', 'update');
        assert.equal(minUpd.length, 1);
        const fields = minUpd[0].chain[0].args[0];
        assert.equal(fields.confirmation_status, 'rejected');
        assert.equal(fields.pending_minister, null);
    });

    await test('existing acting ministry → confirmation_status=acting (preserved)', async () => {
        const supabase = createSupabaseMock({
            'ministries.select': { data: { id: 'min-1', is_acting: true }, error: null },
        });
        await resolveMinisterConfirmationBill(
            supabase, makeBill(), makeCtx({ passed: false }),
        );
        const minUpd = callsFor(supabase, 'ministries', 'update');
        const fields = minUpd[0].chain[0].args[0];
        assert.equal(fields.confirmation_status, 'acting');
    });

    await test('missing ministry row → no ministries.update attempted', async () => {
        const supabase = createSupabaseMock({
            'ministries.select': { data: null, error: null },
        });
        const entry = await resolveMinisterConfirmationBill(
            supabase, makeBill(), makeCtx({ passed: false }),
        );
        assert.equal(entry.result, 'failed');
        assert.equal(callsFor(supabase, 'ministries', 'update').length, 0);
    });
});

await suite('return shape', async () => {
    await test('includes billId, billName, votesFor/Against, type, earlyResolution', async () => {
        const supabase = createSupabaseMock({
            'ministries.select': { data: { id: 'm', is_acting: false }, error: null },
            'nations.select':    { data: {}, error: null },
        });
        const bill = makeBill({ early_resolution_status: 'nominee_voted_no' });
        const entry = await resolveMinisterConfirmationBill(supabase, bill, makeCtx());
        assert.equal(entry.billId, 'bill-1');
        assert.equal(entry.billName, 'Test Confirmation');
        assert.equal(entry.votesFor, 70);
        assert.equal(entry.votesAgainst, 30);
        assert.equal(entry.type, 'minister_confirmation');
        assert.equal(entry.earlyResolution, 'nominee_voted_no');
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
