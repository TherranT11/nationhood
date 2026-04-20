import assert from 'node:assert/strict';

const CLOSABLE_STATUSES = new Set(['current', 'late', 'delinquent']);

function closeFundedInsurancePolicies({ requests, policies, insuredContractId, currentTick }) {
    const fundedRequestIds = requests
        .filter((request) => request.request_type === 'insurance'
            && request.insured_contract_id === insuredContractId
            && request.status === 'funded')
        .map((request) => request.id);

    let closedCount = 0;
    for (const policy of policies) {
        if (!fundedRequestIds.includes(policy.request_id)) continue;
        if (!CLOSABLE_STATUSES.has(policy.status)) continue;
        policy.status = 'repaid';
        policy.completed_tick = currentTick;
        closedCount += 1;
    }

    const linkedPoliciesFound = policies.filter((policy) =>
        fundedRequestIds.includes(policy.request_id) && CLOSABLE_STATUSES.has(policy.status)
    ).length + closedCount;

    return {
        fundedRequestCount: fundedRequestIds.length,
        linkedPoliciesFound,
        linkedPoliciesClosed: closedCount,
    };
}

// current policy closes on completion
{
    const requests = [{ id: 'req-1', request_type: 'insurance', insured_contract_id: 'contract-1', status: 'funded' }];
    const policies = [{ id: 'pol-1', request_id: 'req-1', status: 'current', completed_tick: null }];

    const result = closeFundedInsurancePolicies({ requests, policies, insuredContractId: 'contract-1', currentTick: 400 });

    assert.equal(result.fundedRequestCount, 1);
    assert.equal(result.linkedPoliciesFound, 1);
    assert.equal(result.linkedPoliciesClosed, 1);
    assert.equal(policies[0].status, 'repaid');
    assert.equal(policies[0].completed_tick, 400);
}

// late and delinquent policies both close on completion
{
    const requests = [
        { id: 'req-2', request_type: 'insurance', insured_contract_id: 'contract-2', status: 'funded' },
        { id: 'req-3', request_type: 'insurance', insured_contract_id: 'contract-2', status: 'funded' },
    ];
    const policies = [
        { id: 'pol-2', request_id: 'req-2', status: 'late', completed_tick: null },
        { id: 'pol-3', request_id: 'req-3', status: 'delinquent', completed_tick: null },
    ];

    const result = closeFundedInsurancePolicies({ requests, policies, insuredContractId: 'contract-2', currentTick: 401 });

    assert.equal(result.fundedRequestCount, 2);
    assert.equal(result.linkedPoliciesFound, 2);
    assert.equal(result.linkedPoliciesClosed, 2);
    assert.deepEqual(policies.map((p) => p.status), ['repaid', 'repaid']);
    assert.deepEqual(policies.map((p) => p.completed_tick), [401, 401]);
}

// multiple funded insurance requests for one contract all close + idempotent rerun
{
    const requests = [
        { id: 'req-4', request_type: 'insurance', insured_contract_id: 'contract-3', status: 'funded' },
        { id: 'req-5', request_type: 'insurance', insured_contract_id: 'contract-3', status: 'funded' },
        { id: 'req-6', request_type: 'insurance', insured_contract_id: 'contract-3', status: 'pending' }, // ignored
    ];
    const policies = [
        { id: 'pol-4', request_id: 'req-4', status: 'current', completed_tick: null },
        { id: 'pol-5', request_id: 'req-5', status: 'late', completed_tick: null },
        { id: 'pol-6', request_id: 'req-5', status: 'delinquent', completed_tick: null },
        { id: 'pol-7', request_id: 'req-5', status: 'repaid', completed_tick: 399 }, // already closed
    ];

    const first = closeFundedInsurancePolicies({ requests, policies, insuredContractId: 'contract-3', currentTick: 402 });
    assert.equal(first.fundedRequestCount, 2);
    assert.equal(first.linkedPoliciesFound, 3);
    assert.equal(first.linkedPoliciesClosed, 3);

    const rerun = closeFundedInsurancePolicies({ requests, policies, insuredContractId: 'contract-3', currentTick: 402 });
    assert.equal(rerun.fundedRequestCount, 2);
    assert.equal(rerun.linkedPoliciesFound, 0);
    assert.equal(rerun.linkedPoliciesClosed, 0);
    assert.deepEqual(
        policies.filter((p) => ['pol-4', 'pol-5', 'pol-6'].includes(p.id)).map((p) => p.completed_tick),
        [402, 402, 402],
    );
}

console.log('Project insurance cleanup regression passed.');
