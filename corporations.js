// Corporation display constants + formatters for the Corporations register and the
// adminsetup Creator. The business-climate / tax-burden / firm-growth FORMULAS now live in
// SQL (schema/47: _business_climate, _nation_tax_burden, _corp_growth, exposed via the
// corp_register / nation_tax_burden RPCs) — the ONE source the tick and the client share.

// The size tiers, the sectors a firm can belong to, and each sector's bonus to its nation.
// ONE source for the adminsetup Creator + the public register. (Phase 2b restructures the
// bonus values into the structured {target, amount} the placement logic applies.)
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

// The word + colour band for a climate reading (CSS vars resolved at the call site).
export function climateWord(c) {
  return c >= 3   ? { label: 'Booming',   color: 'var(--green)', bg: 'var(--green-soft)' }
       : c >= 0.5 ? { label: 'Healthy',   color: 'var(--green)', bg: 'var(--green-soft)' }
       : c > -0.5 ? { label: 'Neutral',   color: 'var(--muted)', bg: 'var(--chip)' }
       : c > -3   ? { label: 'Headwind',  color: 'var(--amber)', bg: 'var(--amber-soft)' }
       :            { label: 'Recession', color: 'var(--red)',   bg: 'var(--red-soft)' };
}

// Money in $B, shown $M below $0.1B so small firms (a ~$48M startup) don't round to $0.0B.
// ONE source for the admin Creator + the public register. currency defaults to '$'.
export function corpMoney(v, currency) {
  currency = currency || '$'; v = Number(v) || 0;
  if (v === 0) return currency + '0.0B';
  if (Math.abs(v) < 0.1) return (v < 0 ? '−' : '') + currency + Math.round(Math.abs(v) * 1000) + 'M';
  return (v < 0 ? '−' : '') + currency + Math.abs(v).toFixed(1) + 'B';
}
