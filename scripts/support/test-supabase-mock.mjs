// scripts/support/test-supabase-mock.mjs
//
// Shared recording Supabase mock for resolver-level tests.
// Records every chained call so tests can assert on the exact DB operations
// their subject issues; resolves awaited terminals (.single / .maybeSingle
// or thenable terminals like .update/.insert/.eq) with pre-seeded responses
// keyed by "table.rootOp" (e.g. "ministries.select", "bills.update").
//
// Usage:
//   import { createSupabaseMock, callsFor, firstArg } from './support/test-supabase-mock.mjs';
//   const supabase = createSupabaseMock({
//       'ministries.select': { data: { id: 'm1', is_acting: false }, error: null },
//       'bills.update':      { data: null, error: null },
//   });
//   await subjectUnderTest(supabase, ...);
//   assert.equal(callsFor(supabase, 'ministries', 'update').length, 1);

export function createSupabaseMock(responses = {}) {
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

/** All recorded calls against `table` whose first chained method is `rootOp`. */
export function callsFor(supabase, table, rootOp) {
    return supabase._calls.filter(c => c.table === table && c.chain[0]?.method === rootOp);
}

/** The first argument to the first invocation of `method` in this call's chain. */
export function firstArg(call, method) {
    const step = call.chain.find(s => s.method === method);
    return step?.args[0];
}
