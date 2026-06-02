// ────────────────────────────────────────────────────────────────────
// Shared court-case taxonomy. Single source of truth for:
//   • The eight-deep litigation list per case category (Civil /
//     Criminal / Commercial). The compose form, the admin editor,
//     and the trial UI all read from here.
//   • Beat type slugs + their display labels.
//
// Edit here, all three pages update. Adding a category here without
// also updating court_case_drafts.case_type's CHECK constraint will
// silently break submission — keep schema and JS in sync.
// ────────────────────────────────────────────────────────────────────

export const LITIGATION_BY_TYPE = {
  civil: [
    'Tenancy & Habitation', 'Personal Injury', 'Defamation', 'Family Law',
    'Inheritance & Estates', 'Property Title', 'Civil Rights', 'Wrongful Termination',
  ],
  criminal: [
    'Bribery & Corruption', 'Embezzlement', 'Fraud', 'Tax Evasion',
    'Money Laundering', 'Assault', 'Homicide', 'Drug Offenses',
  ],
  commercial: [
    'Contract Dispute', 'Breach of Warranty', 'Force Majeure', 'Intellectual Property',
    'Antitrust', 'Securities', 'Shareholder Dispute', 'Maritime',
  ],
};

export const BEAT_TYPES = ['evid', 'law', 'fact', 'app', 'eyewit', 'expert'];
export const BEAT_TYPE_LABEL = {
    evid:   'EVIDENCE',
    law:    'LAW',
    fact:   'FACT',
    app:    'APPEAL',
    eyewit: 'EYEWITNESS',
    expert: 'EXPERT WITNESS',
};
