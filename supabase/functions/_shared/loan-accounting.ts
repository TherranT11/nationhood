export function computeMonthlyLoanBreakdown(params: {
    payment: number;
    annualRatePct: number;
    remainingPrincipal: number;
}) {
    const payment = Math.max(0, Math.round(Number(params.payment) || 0));
    const annualRatePct = Math.max(0, Number(params.annualRatePct) || 0);
    const remainingPrincipal = Math.max(0, Math.round(Number(params.remainingPrincipal) || 0));

    const monthlyRate = annualRatePct / 100 / 12;
    const interestPortion = Math.max(0, Math.round(remainingPrincipal * monthlyRate));
    const principalPortion = Math.min(remainingPrincipal, Math.max(0, payment - interestPortion));
    const nextRemainingPrincipal = Math.max(0, remainingPrincipal - principalPortion);

    return {
        payment,
        interestPortion,
        principalPortion,
        nextRemainingPrincipal,
        fullyRepaid: nextRemainingPrincipal <= 0,
    };
}
