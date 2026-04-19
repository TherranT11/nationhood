import assert from 'node:assert/strict';

function computeFlatLoanFigures(principal, annualRatePct, termMonths) {
    const monthlyInterest = Math.round((principal * (annualRatePct / 100)) / 12);
    const monthlyPrincipal = Math.round(principal / termMonths);
    const monthlyPayment = monthlyInterest + monthlyPrincipal;
    return { monthlyInterest, monthlyPrincipal, monthlyPayment };
}

function simulateLoanAmortization(principal, annualRatePct, termMonths) {
    const originalPrincipal = principal;
    const { monthlyPayment, monthlyInterest } = computeFlatLoanFigures(principal, annualRatePct, termMonths);

    let remainingPrincipal = principal;
    let totalInterestPaid = 0;
    let totalPaid = 0;

    for (let i = 0; i < termMonths; i++) {
        const interestPortion = monthlyInterest;
        const principalPortion = Math.max(0, monthlyPayment - interestPortion);

        remainingPrincipal = Math.max(0, remainingPrincipal - principalPortion);
        totalInterestPaid += interestPortion;
        totalPaid += monthlyPayment;
    }

    return {
        originalPrincipal,
        monthlyPayment,
        monthlyInterest,
        remainingPrincipal,
        totalInterestPaid,
        totalPaid,
    };
}

const principal = 135_000_000;
const rate = 18;
const termMonths = 12;

const figures = computeFlatLoanFigures(principal, rate, termMonths);
assert.equal(figures.monthlyInterest, 2_025_000, 'Monthly interest should be fixed at 2.025M');
assert.equal(figures.monthlyPrincipal, 11_250_000, 'Monthly principal should be principal / term');
assert.equal(figures.monthlyPayment, 13_275_000, 'Monthly payment should be interest + principal');

const sim = simulateLoanAmortization(principal, rate, termMonths);
assert.equal(sim.monthlyInterest, 2_025_000, 'Simulation monthly interest should remain fixed');
assert.equal(sim.remainingPrincipal, 0, 'Loan should be fully repaid after 12 payments');
assert.equal(sim.totalInterestPaid, 24_300_000, 'Total interest should equal fixed monthly interest * term');
assert.equal(sim.totalPaid, 159_300_000, 'Total paid should match principal + total interest');
assert.equal(
    sim.totalPaid,
    sim.originalPrincipal + sim.totalInterestPaid,
    'Accounting identity should hold: total_paid = original_principal + total_interest_paid',
);

console.log('Flat-interest loan regression passed.');
