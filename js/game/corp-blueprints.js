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

// The yard ladder — supply_tier (20270816/17) rendered as the HEAVY
// EQUIPMENT department's tier. Caps/sourcing are enforced
// server-side (yard_storage_caps + buy_construction_goods); this is
// the display copy.
export const YARD_TIERS = [
  { tier: 'Level 0: Commercial Rental Yard',
    desc: 'Your physical yard is completely empty. You own zero iron. Every time you secure a contract, you must lease skid-steers or excavators at a high per-turn premium.',
    effect: 'Buy materials only to fulfill an active project, from your nation. No storage.' },
  { tier: 'Level I: Local Maintenance Yard',
    desc: 'A small gravel yard with a chain-link fence. You own a single used flatbed truck and a handful of commercial power tools, keeping basic maintenance in-house.',
    effect: 'Store up to 10 Construction Materials · home-nation purchases only.' },
  { tier: 'Level II: District Equipment Depot',
    desc: 'A paved garage facility housing a modest inventory of company-owned light machinery (backhoes, small dump trucks, mini-excavators).',
    effect: 'Store 10 Materials (buy from any nation) · 5 Equipment (home nation only).' },
];

// Display mirror of the per-type material requirements stamped onto
// blueprints by draft_blueprint (20270814) — the server CASE is
// authoritative; this feeds the modal's live MATERIALS NEEDED line.
export const BUILDING_MATERIALS_NEEDED = {
  single_story_home: 1,
  double_story: 2,
  multitenant_living: 7,
};

// Display mirror of the quality-tier city effects applied by
// complete_construction_projects (20270810) — the server CASE is
// authoritative; this feeds the tier pills' hint text.
export const TIER_CITY_EFFECTS = {
  low_cost: '+0.1 Affordability',
  standard: null,
  high_end: '−0.1 Affordability',
  luxury: '−0.3 Affordability · +0.1 Appeal',
  ultra_rich: '−0.3 Affordability · +0.1 Appeal',
};

// The seven stages of a construction project, displayed horizontally
// on the assigned PM's (and owner's) Pressing Issues tracker. The
// current stage derives from ticks elapsed vs build time — no stage
// state is stored.
export const CONSTRUCTION_STAGES = [
  { name: 'Planning Stage', phase: 'Phase 1: Procurement & Logistics',
    desc: 'Blueprints are locked in. Materials (concrete, lumber, steel) are ordered via your Supply Depot to secure bulk pricing and avoid supply bottlenecks.' },
  { name: 'Work Scheduled', phase: 'Phase 2: Crew & Asset Allocation',
    desc: 'Subcontractors are locked into contracts and your Motor Pool schedules the heavy machinery transport (excavators, operators) to arrive on-site simultaneously.' },
  { name: 'Site Prep & Excavation', phase: 'Phase 3: The Earthmovers',
    desc: 'Heavy equipment breaks ground. Crews clear vegetation, excavate the soil, dig utility trenches, and grade the earth to create a level, stable building pad.' },
  { name: 'Foundation', phase: 'Phase 4: The Pour',
    desc: 'Crews tie steel rebar matrixes into the trenches. Concrete mixing trucks arrive in sequence to pour the footings and slab, forming the permanent anchor for the structure.' },
  { name: 'Framing & Structural Steel', phase: 'Phase 5: The Skeleton',
    desc: 'The building goes vertical. Cranes and framing crews erect the structural steel beams, load-bearing concrete pillars, or wood framing to establish the building’s shell.' },
  { name: 'Exterior Enclosure & Dry-In', phase: 'Phase 6: The Skin',
    desc: 'Roofing crews and exterior installers seal the building. Windows, outer walls, and roofing membranes are installed to shield the interior from weather so internal trades can begin.' },
  { name: 'Interior Fit-Out & MEP', phase: 'Phase 7: The Systems',
    desc: 'Specialized crews take over the interior. Mechanical, Electrical, and Plumbing (MEP) systems are routed through the walls, followed by drywall, finishes, and final inspections.' },
];

export const DEPARTMENTS = {
  construction: [
    { dept: 'PROJECT MANAGEMENT', tier: 'The Truck & Clipboard',
      desc: 'You handle all local permitting, contract estimates, and safety compliance yourself out of the cab of your truck. Administrative bottlenecks limit you to chasing one tiny contract at a time.',
      effect: 'Number of Active Projects: 1' },
    { dept: 'HEAVY EQUIPMENT', ...YARD_TIERS[0] },
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
