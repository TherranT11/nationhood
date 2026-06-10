// Per-industry corp blueprints — the Core Metrics pillar copy and the
// five department tiers. VALUES live on entrepreneur_corps columns
// (pillar_* from 20270794; department tier state moves to columns when
// upgrade mechanics land); the LABELS and copy live here, shared by
// the corp page and the career page's role-view modal. Only
// construction is chartered so far.
export const PILLARS = {
  construction: [
    { col: 'pillar_speed', name: 'STRUCTURAL SPEED', kind: 'Throughput',
      desc: 'Decreases the baseline number of ticks required to deliver a finished building. Faster completion liquidates contracts quickly, avoiding penalties and freeing up your project queue.' },
    { col: 'pillar_efficiency', name: 'PROCUREMENT EFFICIENCY', kind: 'Cost Reduction',
      desc: 'Reflects your vertical supply-chain dominance. Higher efficiency permanently slashes the baseline corporate cash you must spend out-of-pocket on the raw steel, concrete, and aggregates a project requires.' },
    { col: 'pillar_quality', name: 'ENGINEERING QUALITY', kind: 'Value-Add',
      desc: 'Applies a permanent, positive performance modifier to the completed building. A high-tier builder delivers an Assembly Plant granting +0.3 GDP growth instead of the baseline +0.2 — and charges premium margins for it.' },
  ],
};

export const DEPARTMENTS = {
  construction: [
    { dept: 'PROJECT MANAGEMENT', tier: 'The Truck & Clipboard',
      desc: 'You handle all local permitting, contract estimates, and safety compliance yourself out of the cab of your truck. Administrative bottlenecks limit you to chasing one tiny contract at a time.',
      effect: 'Number of Active Projects: 1' },
    { dept: 'HEAVY EQUIPMENT', tier: 'Level 0: Commercial Rental Yard',
      desc: 'Your physical yard is completely empty. You own zero iron. Every time you secure a contract, you must lease skid-steers or excavators at a high per-turn premium.',
      effect: 'Construction Project costs require equipment rentals.' },
    { dept: 'SUPPLY & MATERIAL', tier: 'Retail Hardware Store',
      desc: 'You buy concrete mix, lumber, and rebar directly from retail commercial distributors or local suppliers at standard market prices with zero bulk discounts.',
      effect: 'Construction Project costs require standard upfront prices.' },
    { dept: 'SYSTEM DESIGN', tier: 'CAD System & Laptop',
      desc: 'You implement your own designs, limited by your own project expertise.',
      effect: 'You gain Experience at +3 per completed project.' },
    { dept: 'REGULATORY COMPLIANCE', tier: 'City Permits',
      desc: 'Your licensing stops at the city clerk’s counter. You’re cleared for small-scale municipal work — anything bigger needs certifications you don’t hold yet.',
      effect: 'Can only build ‘Residential’ and ‘Tier I Commercial’.' },
  ],
  automotive: [null, null, null, null, null],
};
