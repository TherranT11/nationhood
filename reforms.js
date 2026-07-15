// Parliamentary reform catalogue — the client mirror of _reform_name / _reform_cost /
// _repeal_cost (schema/167). The server stays authoritative for what a reform does and
// costs; this is the display copy the reform track page reads to name each rung and show
// the Influence a proposal will cost before you spend it.
//
// A reform LEVEL is 0–15 (economy.regime_reform). The n-th reform (1..15) has the name
// below for the nation's type; advancing from level R proposes reform R+1. The 15th reform
// of an autocracy / monarchy is its Handover / Abolition — passing it converts the nation
// to a full democracy (server-side, schema/167).

export const REFORM_NAMES = {
  democracy: [
    'End Arbitrary Arrest', 'Published Legal Code', 'Independent Courts', 'Municipal Elections',
    'Legal Opposition', 'Eased Press Licensing', 'Right of Assembly', 'Free Press', 'Universal Suffrage',
    'Secret Ballot', 'Civilian Control of the Army', 'Term Limits', 'Constitutional Court',
    'Freedom of Information', 'Parliamentary Sovereignty'],
  monarchy: [
    'Great Charter', 'Council of Notables', 'Right of Petition', 'Judges Under Law', 'Consent of Estates',
    'Ministerial Responsibility', 'The Civil List', 'The Veto Withers', 'Constitutional Oath',
    'The Countersignature', 'The Chamber’s Choice', 'Prerogatives Enumerated', 'Estates Nationalized',
    'The Ceremonial Crown', 'The Abolition'],
  autocracy: [
    'End of Terror', 'Rehabilitations', 'Collective Leadership', 'Socialist Legality', 'Factions Legalized',
    'Licensed Press', 'Choice on the Ballot', 'Independent Associations', 'Archives Crack Open',
    'Independents May Stand', 'Leading Role Repealed', 'Opposition Legalized', 'The Tilted Election',
    'Party & State Divorced', 'The Handover'],
};

// The name of the n-th reform (1..15) for a type, or null out of range / unknown type.
export function reformName(type, n) {
  const a = REFORM_NAMES[type];
  return (a && n >= 1 && n <= 15) ? a[n - 1] : null;
}

// The standing stat effects a reform carries while enacted — the client mirror of _reform_effects
// (schema/217). Per type, index n-1 holds reform n's effects as {t: stat, v: signed}; [] = no
// mechanic authored yet. The SERVER stays authoritative (nation_stat_values already includes these);
// this is only the display copy the reform track shows under each rung.
export const REFORM_EFFECTS = {
  democracy: [],
  monarchy: [
    [{ t: 'Rule of Law', v: 8 }, { t: 'Civil Liberties', v: 4 }],   // 1 · Great Charter
  ],
  autocracy: [],
};
export function reformEffects(type, n) {
  const a = REFORM_EFFECTS[type];
  return (a && n >= 1 && n <= 15 && a[n - 1]) ? a[n - 1] : [];
}
// "+8 Rule of Law · +4 Civil Liberties", or '' when the reform has no mechanic yet.
export function reformEffectText(type, n) {
  return reformEffects(type, n).map(function (e) {
    return (e.v > 0 ? '+' : e.v < 0 ? '−' : '') + Math.abs(e.v) + ' ' + e.t;
  }).join(' · ');
}
