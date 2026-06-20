// Qualitative stat ladders — the single source of truth for every nation stat's
// word label, shared by the tutorial and the online nation pages. Index 0 = value
// 1. Prosperity/Welfare/Order/Image run 1–20; Growth runs 1–19 (10 is the flat,
// zero-growth midpoint). The number is the source — the word always follows it.
export const STAT_LADDERS = {
  prosperity: ['Economic collapse','Failed economy','Deep depression','Depression','Severe downturn','Struggling economy','Weak economy','Underdeveloped','Developing economy','Modest economy','Steady economy','Solid economy','Prosperous','Thriving economy','Wealthy','Affluent economy','Booming economy','Economic powerhouse','Industrial titan','Engine of the world'],
  welfare: ['Total destitution','Widespread misery','No safety net','Deep deprivation','Bare subsistence','Hardscrabble living','Threadbare services','Minimal provision','Patchy support','Basic safety net','Adequate services','Decent provision','Strong public services','Well looked-after','Comprehensive care','Generous welfare state','Comprehensive cradle-to-grave','Universal abundance','Total social security','Want abolished'],
  order: ['Total anarchy','Open rebellion','Lawless chaos','Rampant unrest','Crime and disorder','Fragile peace','Shaky stability','Mostly calm','Settled and stable','Law and order','Firm control','A tight grip','Strong authority','Rigid discipline','Heavy enforcement','Iron rule','Watchful state','Surveillance state','Absolute obedience','Total police state'],
  image: ['Global pariah','Despised abroad','Disgraced reputation','Widely distrusted','Poor standing','A forgotten nobody','Quietly overlooked','Mildly regarded','Fair reputation','Respected enough','Well regarded','Rising influence','Admired abroad','Real prestige','Soft-power player','Globally admired','Cultural beacon','World-renowned','A revered power','Icon of the age'],
  growth: ['Massive recession','Deep recession','Severe recession','Sharp recession','Recession','Mild recession','Downturn','Slowdown','Stalling','Stagnant','Stirring','Slow growth','Modest growth','Steady growth','Strong growth','Rapid growth','Booming','Surging','Explosive growth'],
};

export function statLabel(stat, value) {
  const rung = STAT_LADDERS[stat]; if (!rung) return null;
  const i = Math.min(rung.length, Math.max(1, Math.round(value))) - 1; // clamp into range
  return rung[i];
}

// Display NAME for a stat key — the one source for stat labels. Most are just the
// capitalised key; 'image' shows as "Global Image" (the NATION stat, kept distinct
// from the politician Image competency).
export function statName(key) {
  if (key === 'image') return 'Global Image';
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : '';
}

// Colour band for a stat value — the single source for how a number maps to
// good/warn/bad, shared by every nation view. Growth has its own thresholds
// (contracting → bad, around the flat 10 midpoint → warn, strong → good); the
// other ladders just turn 'good' once they're in the upper half. '' = neutral.
export function statBand(stat, value) {
  if (typeof value !== 'number') return '';
  if (stat === 'growth') return value >= 13 ? 'good' : value >= 10 ? 'warn' : 'bad';
  return value >= 11 ? 'good' : '';
}

// Regime — a single 1–20 democracy↔autocracy scale. Unlike the ladders above it
// has named tiers at set thresholds (not one word per number); a value takes the
// label of the highest tier it reaches. The number is the source (stored on the
// nation); the words follow it. Listed high→low for the admin dropdown.
export const REGIME_TIERS = [
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
