/**
 * lawsuit-types.js — Shared catalogs for the commercial lawsuit system.
 *
 * Single source for the grievance + relief enums. Imported by the filing
 * UI (entrepreneur-corp.html) and the Judicial docket + ruling modal
 * (government.html / lawsuit-rule.js). After the entrepreneur modernization
 * the system litigates corp_loans disputes only; the SQL
 * file_commercial_lawsuit mirrors this two-grievance set.
 */

export const GRIEVANCES = [
    { key: 'non_payout',      name: 'Non-Payout',      desc: 'Borrower defaulted on an approved loan — the lender sues to recover what is owed.', sector: 'banking' },
    { key: 'predatory_terms', name: 'Predatory Terms', desc: 'Lender imposed exploitative interest or covenants — the borrower sues to void the loan.', sector: 'banking' },
];

export const RELIEFS = [
    { key: 'payment',           name: 'Payment',           desc: 'Borrower pays the lender the amount still owed.' },
    { key: 'contract_voidance', name: 'Contract Voidance', desc: 'Cancel the loan entirely — the borrower owes nothing further.' },
];

export const GRIEVANCE_LABEL = Object.fromEntries(GRIEVANCES.map(g => [g.key, g.name]));
export const RELIEF_LABEL    = Object.fromEntries(RELIEFS.map(r => [r.key, r.name]));

// Default relief for each grievance (the natural remedy).
export const GRIEVANCE_RELIEF = { non_payout: 'payment', predatory_terms: 'contract_voidance' };
