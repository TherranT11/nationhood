// Corporation + business-climate display logic — the ONE source for the
// Market ▸ Corporations tab. Everything here is READ-ONLY: the climate is a live
// reading of the nation's economy + stats (never a stored value), and each firm's
// growth is derived from it. No simulation, no writes, no "advance".

// The fixed, world-neutral baseline every nation is measured against, so a reading
// means the same thing in any nation — a nation below it opens in a headwind. Growth
// and Prosperity are the 1–20 nation stats; tax/unemployment/inflation are percentages.
export const CLIMATE_BASE = { tax: 25, growth: 10, prosperity: 12, unemployment: 7, inflation: 10 };

function n(v) { return Number(v) || 0; }

// The size tiers, the sectors a firm can belong to, and each sector's passive bonus to its
// nation. ONE source for the adminsetup Creator + the public register (and Phase 2's tick,
// which will read CATEGORY_BONUS server-side). Bonus is display copy in Phase 1; Phase 2
// applies it.
export const SIZES = ['Startup', 'Moderate', 'Enterprise', 'National Corporation', 'International Conglomerate'];
export const CATEGORIES = ['Energy', 'Finance', 'Heavy Industry', 'Agriculture', 'Telecom', 'Aerospace', 'Rail', 'Shipping', 'Nuclear', 'Manufacturing', 'Pharma', 'Construction', 'Logistics', 'Retail', 'Mining', 'Services', 'Airline'];
export const CATEGORY_BONUS = {
  'Energy':         { tag: '+1 Energy / tick',          desc: 'Powers the grid and industry.' },
  'Finance':        { tag: 'Debt accrues slower',       desc: 'Cheaper national borrowing.' },
  'Heavy Industry': { tag: '+1 Goods / tick',           desc: 'Backbone of heavy build and arms.' },
  'Agriculture':    { tag: '+1 Food / tick',            desc: 'Feeds the population.' },
  'Telecom':        { tag: '+1 Services / tick',        desc: 'Speeds the flow of information.' },
  'Aerospace':      { tag: '+1 Image',                  desc: 'Prestige of advanced industry and defence.' },
  'Rail':           { tag: '+1 Growth',                 desc: 'Connects the interior, moves goods cheaply.' },
  'Shipping':       { tag: '+1 Goods / tick',           desc: 'Carries trade through the ports.' },
  'Nuclear':        { tag: '+2 Energy / tick',          desc: 'Clean, strategic power.' },
  'Manufacturing':  { tag: '+1 Goods / tick',           desc: 'Consumer and export output.' },
  'Pharma':         { tag: '+1 Welfare',                desc: 'Improves public health.' },
  'Construction':   { tag: 'Initiatives build cheaper', desc: 'Cuts the cost of national projects.' },
  'Logistics':      { tag: '+0.5 Growth to all firms',  desc: 'Greases the whole economy.' },
  'Retail':         { tag: '+1 Prosperity',             desc: 'Drives consumer demand.' },
  'Mining':         { tag: '+1 Minerals / tick',        desc: 'Raw materials for industry.' },
  'Services':       { tag: '+1 Services / tick',        desc: 'Core of the modern economy.' },
  'Airline':        { tag: '+1 Diplomacy',              desc: 'Links the nation abroad; lifts tourism.' }
};

// Business climate: how far the nation's economy sits above/below the world standard.
// stats carries growth + prosperity; economy carries tax/inflation/unemployment.
export function businessClimate(stats, economy) {
  stats = stats || {}; economy = economy || {};
  return Math.round((
    (n(stats.growth) - CLIMATE_BASE.growth) +
    (n(stats.prosperity) - CLIMATE_BASE.prosperity) * 0.3 -
    (n(economy.tax) - CLIMATE_BASE.tax) * 0.04 -
    (n(economy.inflation) - CLIMATE_BASE.inflation) * 0.3 -
    (n(economy.unemployment) - CLIMATE_BASE.unemployment) * 0.3
  ) * 10) / 10;
}

// The word + colour band for a climate reading (CSS vars resolved at the call site).
export function climateWord(c) {
  return c >= 3   ? { label: 'Booming',   color: 'var(--green)', bg: 'var(--green-soft)' }
       : c >= 0.5 ? { label: 'Healthy',   color: 'var(--green)', bg: 'var(--green-soft)' }
       : c > -0.5 ? { label: 'Neutral',   color: 'var(--muted)', bg: 'var(--chip)' }
       : c > -3   ? { label: 'Headwind',  color: 'var(--amber)', bg: 'var(--amber-soft)' }
       :            { label: 'Recession', color: 'var(--red)',   bg: 'var(--red-soft)' };
}

// A firm's growth = the climate + its own trajectory (drift), dragged down hard by any
// debt, clamped to ±9%. Display only — nothing is written back.
export function corpGrowth(corp, climate) {
  var drag = n(corp.debt) > 0 ? n(corp.debt) * 3 : 0;
  return Math.max(-9, Math.min(9, Math.round((climate + n(corp.drift) - drag) * 10) / 10));
}
