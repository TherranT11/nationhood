// Qualitative stat ladders — the single source of truth for every nation stat's
// word label, shared by the tutorial and the online nation pages. Each ladder has
// 13 bands across the 1–100 scale: band 0 = 1–8 (the worst), band 12 = 92–100 (the
// best). For Growth the middle band (~47–54, "Stalling"→"Ticking over") is the flat,
// near-zero-growth band, with contraction below and expansion above. The number is
// the source — the word always follows it.
export const STAT_LADDERS = {
  prosperity: ['Economic collapse','Deep depression','Severe downturn','Struggling economy','Weak economy','Developing economy','Steady economy','Solid economy','Prosperous','Wealthy','Affluent economy','Economic powerhouse','Engine of the world'],
  welfare: ['Total destitution','No safety net','Deep deprivation','Threadbare services','Minimal provision','Patchy support','Adequate services','Decent provision','Strong public services','Comprehensive care','Generous welfare state','Universal abundance','Want abolished'],
  order: ['Total anarchy','Lawless chaos','Rampant unrest','Crime and disorder','Shaky stability','Mostly calm','Settled and stable','Law and order','Firm control','Strong authority','Heavy enforcement','Surveillance state','Total police state'],
  image: ['Global pariah','Disgraced reputation','Widely distrusted','Poor standing','Quietly overlooked','Mildly regarded','Fair reputation','Well regarded','Rising influence','Admired abroad','Soft-power player','Globally admired','Icon of the age'],
  growth: ['Economic freefall','Severe contraction','Deep recession','Recession','Sharp slowdown','Stalling','Ticking over','Modest growth','Steady growth','Solid expansion','Strong growth','Booming','Red-hot expansion'],
};

// The inclusive lower bound of each of the 13 bands on the 1–100 scale — band 0 is 1–8,
// band 12 is 92–100. A value takes the highest band whose lower bound it reaches.
const BAND_MIN = [1, 9, 16, 24, 32, 39, 47, 55, 62, 70, 78, 85, 92];

export function statLabel(stat, value) {
  const rung = STAT_LADDERS[stat]; if (!rung) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;   // unset / non-numeric → no label (caller shows '—')
  const v = Math.round(num);
  let i = 0;
  for (let b = BAND_MIN.length - 1; b >= 0; b--) { if (v >= BAND_MIN[b]) { i = b; break; } }
  return rung[Math.min(i, rung.length - 1)];
}

// Display NAME for a stat key — the one source for stat labels. Most are just the
// capitalised key; 'image' shows as "Global Image" (the NATION stat, kept distinct
// from the politician Image competency).
export function statName(key) {
  if (key === 'image') return 'Global Image';
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : '';
}

// Colour band for a stat value (1–100) — the single source for how a number maps to
// good/warn/bad, shared by every nation view. Growth has its own thresholds (contracting
// → bad, around the flat ~50 midpoint → warn, strong → good); the other ladders just turn
// 'good' once they're past the midpoint. '' = neutral. Thresholds mirror the yearly malaise
// pass (schema/125): a stat under 45 fires a penalty; Growth pays a GDP dividend at 55+.
export function statBand(stat, value) {
  if (typeof value !== 'number') return '';
  if (value < 45) return 'bad';   // below 45 is failing (red) — the malaise penalty threshold (schema/125)
  if (stat === 'growth') return value >= 55 ? 'good' : 'warn';
  return value >= 55 ? 'good' : '';
}

// Regime — a single 1–25 democracy↔autocracy scale. Unlike the ladders above it
// has named tiers at set thresholds (not one word per number); a value takes the
// label of the highest tier it reaches. The number is the source (stored on the
// nation); the words follow it. Listed high→low for the admin dropdown. 21–25 are
// the monarchy band, sitting above the republic tiers (Constitutional = democratic
// crown; Absolute = a crown above even that). Constitutional monarchies (21–23) are
// ordinary multiparty democracies; an Absolute monarchy (24–25) is a one-party state
// ruled by the monarch's party (schema/98). The royal Head-of-State titles
// (King/Queen/Emperor) are gated to the monarchy band (isMonarchy, used by the
// declaration picker).
export const REGIME_TIERS = [
  { value: 24, label: 'Absolute Monarchy' },
  { value: 21, label: 'Constitutional Monarchy' },
  { value: 20, label: 'Full Democracy' },
  { value: 17, label: 'Electoral Democracy' },
  { value: 14, label: 'Flawed Democracy' },
  { value: 11, label: 'Illiberal Democracy' },
  { value: 9,  label: 'Competitive Autocracy' },
  { value: 5,  label: 'Functional Autocracy' },
  { value: 1,  label: 'One State Autocracy' },
];

export function regimeLabel(value) {
  const n = Number(value);
  if (isNaN(n)) return null;
  for (const t of REGIME_TIERS) if (n >= t.value) return t.label; // tiers are high→low
  return REGIME_TIERS[REGIME_TIERS.length - 1].label;
}

// Is this regime in the monarchy band (21–25 — Constitutional or Absolute)? ONE
// source for the "is this a monarchy" test, shared by the royal Head-of-State title
// gate in the declaration picker (and any other crown-only affordance).
export function isMonarchy(value) {
  const n = Number(value);
  return !isNaN(n) && n >= 21;
}

// The player-facing regime line: "Label (N)" for a numeric regime, the stored string
// for a legacy one, or "—". ONE source for this format — read by the Nation and World
// pages (the number → label step is regimeLabel above).
export function regimeText(regime) {
  return (typeof regime === 'number') ? (regimeLabel(regime) + ' (' + regime + ')') : (regime || '—');
}
