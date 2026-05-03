/**
 * lawsuit-types.js — Shared catalogs for the commercial lawsuit system.
 *
 * Single source for the grievance + relief enums. Imported by the
 * filing modal (sue-corp.js) and the Judicial docket (government.html).
 * SQL RPC file_commercial_lawsuit (20260730 migration) carries its own
 * server-side label CASE for the public event_log description; if you
 * add an enum here, mirror it there.
 */

export const GRIEVANCES = [
    { key: 'breach_of_contract', name: 'Breach of Contract', desc: 'Defendant failed to honor agreed terms after the contract was signed.', sector: 'universal' },
    { key: 'fraud',              name: 'Fraud',              desc: 'Defendant misrepresented material facts before the contract was signed.', sector: 'universal' },
    { key: 'defamation',         name: 'Defamation',         desc: 'Defendant made false public statements that damaged your reputation.',    sector: 'universal' },
    { key: 'predatory_terms',    name: 'Predatory Terms',    desc: 'Bank imposed exploitative interest rates or covenants outside market norms.', sector: 'banking' },
    { key: 'non_payout',         name: 'Non-Payout',         desc: 'Bank refused to fund an approved loan or honor a credit commitment.',     sector: 'banking' },
    { key: 'defective_work',     name: 'Defective Work',     desc: 'Construction failed to meet specified quality standards.',                 sector: 'construction' },
    { key: 'cargo_loss',         name: 'Cargo Loss',         desc: 'Goods lost or damaged in transit due to negligence.',                      sector: 'shipping' },
];

export const RELIEFS = [
    { key: 'payment',              name: 'Payment',              desc: 'Cash damages awarded to compensate for losses.' },
    { key: 'specific_performance', name: 'Specific Performance', desc: 'Force the defendant to honor the original contract.' },
    { key: 'contract_voidance',    name: 'Contract Voidance',    desc: 'Cancel the agreement entirely. Both parties walk away.' },
    { key: 'asset_seizure',        name: 'Asset Seizure',        desc: "Court orders defendant's collateral or property forfeited." },
];

export const GRIEVANCE_LABEL = Object.fromEntries(GRIEVANCES.map(g => [g.key, g.name]));
export const RELIEF_LABEL    = Object.fromEntries(RELIEFS.map(r => [r.key, r.name]));

// Defendant sector → set of permitted grievance sectors. Universal
// always allowed; sector-specific grievances require a matching corp.
export function allowedGrievanceSectors(corpSector) {
    const s = (corpSector || '').toLowerCase();
    if (s === 'finance')      return new Set(['universal', 'banking']);
    if (s === 'construction') return new Set(['universal', 'construction']);
    if (s === 'shipping')     return new Set(['universal', 'shipping']);
    return new Set(['universal']);
}
