// Corporation display constants + formatters for the Corporations register and the
// adminsetup Creator. The business-climate / tax-burden / firm-growth FORMULAS now live in
// SQL (schema/47: _business_climate, _nation_tax_burden, _corp_growth, exposed via the
// corp_register / nation_tax_burden RPCs) — the ONE source the tick and the client share.

// The size tiers, the sectors, and each sector's bonus LABEL for display. The bonus is a
// ONE-TIME add when a firm is placed, scaled by size (+0.1 Startup … +0.5 International), to
// the production resource or stat shown — the mechanical amount+target is the SQL source
// (_corp_apply_bonus / _corp_bonus_amount, schema/47); these tags are display only.
// Finance/Construction/Logistics are rule-modifiers not yet wired (no production/stat add).
export const SIZES = ['Startup', 'Moderate', 'Enterprise', 'National Corporation', 'International Conglomerate'];
export const CATEGORIES = ['Energy', 'Finance', 'Heavy Industry', 'Agriculture', 'Telecom', 'Aerospace', 'Rail', 'Shipping', 'Nuclear', 'Manufacturing', 'Pharma', 'Construction', 'Logistics', 'Retail', 'Mining', 'Services', 'Airline'];
export const CATEGORY_BONUS = {
  'Energy':         { tag: '+ Energy production',     desc: 'Powers the grid and industry.' },
  'Finance':        { tag: 'Rule-modifier (inactive)', desc: 'Cheaper national borrowing — not yet wired.' },
  'Heavy Industry': { tag: '+ Goods production',      desc: 'Backbone of heavy build and arms.' },
  'Agriculture':    { tag: '+ Food production',       desc: 'Feeds the population.' },
  'Telecom':        { tag: '+ Services production',   desc: 'Speeds the flow of information.' },
  'Aerospace':      { tag: '+ Image',                 desc: 'Prestige of advanced industry and defence.' },
  'Rail':           { tag: '+ Growth',                desc: 'Connects the interior, moves goods cheaply.' },
  'Shipping':       { tag: '+ Goods production',      desc: 'Carries trade through the ports.' },
  'Nuclear':        { tag: '+ Energy production',     desc: 'Clean, strategic power.' },
  'Manufacturing':  { tag: '+ Goods production',      desc: 'Consumer and export output.' },
  'Pharma':         { tag: '+ Welfare',               desc: 'Improves public health.' },
  'Construction':   { tag: 'Rule-modifier (inactive)', desc: 'Cheaper national projects — not yet wired.' },
  'Logistics':      { tag: 'Rule-modifier (inactive)', desc: 'Greases the whole economy — not yet wired.' },
  'Retail':         { tag: '+ Prosperity',            desc: 'Drives consumer demand.' },
  'Mining':         { tag: '+ Minerals production',   desc: 'Raw materials for industry.' },
  'Services':       { tag: '+ Services production',   desc: 'Core of the modern economy.' },
  'Airline':        { tag: '+ Diplomacy production',  desc: 'Links the nation abroad; lifts tourism.' }
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
