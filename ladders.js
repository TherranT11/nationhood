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

// Crime — the reader-facing inverse of the internal `order` stat (high order = low crime).
// The number stays `order` (ONE source); Crime just flips its framing to crime ≈ 101 − order
// and buckets it into five plain bands (1–20 … 81–100). Used on the nation-select + World cards.
const CRIME_BANDS = ['Safe streets', 'Low crime', 'Moderate crime', 'High crime', 'Rampant crime'];
export function crimeValue(order) {
  const num = Number(order);
  if (!Number.isFinite(num)) return null;
  return Math.max(1, Math.min(100, 101 - Math.round(num)));
}
export function crimeLabel(order) {
  const c = crimeValue(order);
  if (c === null) return null;
  return CRIME_BANDS[Math.min(4, Math.floor((c - 1) / 20))];
}
// Colour band for Crime: high crime is bad (red), low crime good (green) — the EXACT inverse of
// statBand('order') so a number never disagrees with itself. statBand fails at order < 45
// (crime ≥ 57) and turns good at order ≥ 55 (crime ≤ 46).
export function crimeBand(order) {
  const c = crimeValue(order);
  if (c === null) return '';
  if (c >= 57) return 'bad';
  if (c <= 46) return 'good';
  return '';
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

// Regime — a nation's constitutional form, split into a TYPE and a REFORM level. The old
// single 1–25 index was retired: `type` is the axis (autocracy / democracy / monarchy) and
// `reform` (0–15) is how far the nation has liberalised WITHIN that type. The pair is the
// source (stored as economy.regime_type + economy.regime_reform); the words below follow it.
// A monarchy LIBERALISES as its reform rises, like the other types: an unreformed crown is an
// Absolute Monarchy (reform ≤ 4, a one-party state — schema/98) and each reform strips the crown's
// power (Crowned Parliament → Constitutional → Ceremonial Crown), until the 15th (the Abolition)
// turns it into a republic. The royal Head-of-State titles are gated to the monarchy type
// (isMonarchy, used by the declaration picker).
export const REGIME_TYPE_LABEL = { autocracy: 'Autocracy', democracy: 'Democracy', monarchy: 'Monarchy' };

// Per-type reform bands → the tier name. Advancing (higher reform) is always MORE liberal; each
// entry is [reform lower bound, label], listed high→low, and a reform level takes the label of the
// highest band it reaches.
const REGIME_BANDS = {
  autocracy: [[8, 'Competitive Autocracy'], [4, 'Functional Autocracy'], [0, 'One State Autocracy']],
  democracy: [[9, 'Full Democracy'], [6, 'Electoral Democracy'], [3, 'Flawed Democracy'], [0, 'Illiberal Democracy']],
  monarchy:  [[14, 'Ceremonial Crown'], [10, 'Constitutional Monarchy'], [5, 'Crowned Parliament'], [0, 'Absolute Monarchy']],
};

// Reform level normalised to an integer in 0–15.
function reformOf(regime) { return Math.max(0, Math.min(15, Math.round(Number(regime && regime.reform)) || 0)); }

// Read a nation's regime from its economy jsonb → { type, reform }, or null when no type is
// set (an un-configured nation). ONE source for turning the stored keys into a regime object,
// mirrored server-side by _regime_type / _regime_reform (schema/166).
export function nationRegime(economy) {
  if (!economy) return null;
  const type = economy.regime_type;
  if (type !== 'autocracy' && type !== 'democracy' && type !== 'monarchy') return null;
  return { type: type, reform: reformOf({ reform: economy.regime_reform }) };
}

// ---- Stock Market -------------------------------------------------------------------
// A nation's Stock Market is a "Price Rating" on a 1–100,000 scale. It starts INACTIVE for every
// nation (no admin starting input) — a nation only gains a market by founding or joining a stock
// exchange (a later stage), which sets economy.stock_market = { active: true }. The rating itself
// is COMPUTED from live stats (never stored), so it can't drift from the numbers it's built on.
const STOCK_PRICE_MIN = 1;
const STOCK_PRICE_MAX = 100000;
function clampStockPrice(n) {
  const v = Math.round(Number(n));
  if (!isFinite(v)) return null;
  return Math.max(STOCK_PRICE_MIN, Math.min(STOCK_PRICE_MAX, v));
}

// Whether a nation has a live market. Absent OR active:false → inactive (no rating yet).
export function nationStockMarket(economy) {
  const sm = economy && economy.stock_market;
  return { active: !!(sm && sm.active === true) };
}

// The four live levers that set the Price Rating — the same values nation_stat_values feeds the
// Government page. Corruption is inverted (100 − Corruption). Also the ONE source for the stat list.
export const STOCK_LEVERS = [
  { key: 'Growth',      weight: 0.30, invert: false },
  { key: 'Prosperity',  weight: 0.30, invert: false },
  { key: 'Rule of Law', weight: 0.25, invert: false },
  { key: 'Corruption',  weight: 0.15, invert: true  },
];
// Index from the Market Score: par 1,000 at S=50, one decade (×10) per 25 points, clamped 1–100,000.
function stockPriceFromScore(score) {
  return clampStockPrice(1000 * Math.pow(10, (score - 50) / 25));
}
// The ONE stock computation — per-lever detail, the Market Score (0–100), and the Price Rating it
// maps to. Both the headline number and its breakdown read THIS single result, so they can never
// disagree. An unset/missing lever falls back to neutral (Corruption → 0 = none, the rest → 50).
export function stockMarketBreakdown(stats) {
  const levers = STOCK_LEVERS.map(function (L) {
    const v = (stats && stats[L.key] != null) ? stats[L.key] : NaN;   // null stats / missing key → unset
    let raw = Number(v);
    if (!isFinite(raw)) raw = L.invert ? 0 : 50;                       // unset → neutral
    raw = Math.max(0, Math.min(100, raw));
    const used = L.invert ? (100 - raw) : raw;                         // Corruption counts as (100 − C)
    return { key: L.key, weight: L.weight, invert: L.invert, raw: raw, used: used, points: L.weight * used };
  });
  const score = levers.reduce(function (s, L) { return s + L.points; }, 0);
  return { levers: levers, score: score, price: stockPriceFromScore(score) };
}

// The tier label for a regime object — e.g. "Full Democracy". Null for an unset/invalid regime.
export function regimeLabel(regime) {
  if (!regime || !REGIME_BANDS[regime.type]) return null;
  const r = reformOf(regime);
  const bands = REGIME_BANDS[regime.type];
  for (const band of bands) if (r >= band[0]) return band[1];
  return bands[bands.length - 1][1];
}

// Is this regime a monarchy? ONE source for the crown-only affordances (royal Head-of-State
// titles), shared by the declaration picker; mirrors _regime_is_monarchy (schema/166).
export function isMonarchy(regime) { return !!regime && regime.type === 'monarchy'; }

// Is this an authoritarian-floor regime (the old "≤ 4" band) — an autocracy at reform ≤ 3?
// These states suppress political fallout and reward a foreign stand against them. ONE source,
// mirrors _regime_is_authoritarian (schema/166).
export function isAuthoritarian(regime) { return !!regime && regime.type === 'autocracy' && reformOf(regime) <= 3; }

// The player-facing regime line: "Full Democracy · Reform 9/15", or "—" when unset. ONE source
// for this format — read by the Nation, World and select screens.
export function regimeText(regime) {
  const label = regimeLabel(regime);
  return label ? (label + ' · Reform ' + reformOf(regime) + '/15') : '—';
}
