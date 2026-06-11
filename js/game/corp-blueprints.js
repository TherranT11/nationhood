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

// The yard ladder — supply_tier (20270816/17, redone 20270821 as
// equipment-only), upgraded a level at a time by Logistical Overhaul.
// Rendered as the HEAVY EQUIPMENT department's tier. Caps / wear /
// sourcing are enforced server-side; equipmentCap and upgradeCost are
// display mirrors of yard_storage_caps / yard_upgrade_cost.
export const YARD_TIERS = [
  { tier: 'Level 0: Commercial Rental Yard', upgradeCost: null, equipmentCap: 0,
    desc: 'Your physical yard is completely empty. You own zero iron. Every time you secure a contract, you must lease skid-steers or excavators at a high per-turn premium.',
    effect: 'Project Managers can buy Construction Equipment for an active project — 1 use, then it disappears.' },
  { tier: 'Level I: Local Maintenance Yard', upgradeCost: 7000000, equipmentCap: 2,
    desc: 'A small gravel yard with a chain-link fence. You own a single used flatbed truck and a handful of commercial power tools, keeping basic maintenance in-house.',
    effect: 'Store up to 2 Construction Equipment · 3 uses each before they disappear.' },
  { tier: 'Level II: District Equipment Depot', upgradeCost: 10000000, equipmentCap: 4,
    desc: 'A paved garage facility housing a modest inventory of company-owned light machinery (backhoes, small dump trucks, mini-excavators).',
    effect: 'Store up to 4 Construction Equipment · 3 uses each.' },
  { tier: 'Level III: Regional Machinery Hub', upgradeCost: 16000000, equipmentCap: 6,
    desc: 'A major regional depot featuring heavy capital iron (tower cranes, large bulldozers, concrete transit mixers) owned outright by the firm.',
    effect: 'Store up to 6 Construction Equipment · 3 uses each.' },
  { tier: 'Level IV: National Fleet Logistics Depot', upgradeCost: 25000000, equipmentCap: 6,
    desc: 'Sprawling industrial storage hubs housing specialized tunneling shields, heavy earthmovers, and automated grading machinery fleets.',
    effect: 'Store 6 Equipment · buy from abroad · sell nationally (marketplace coming).' },
  { tier: 'Level V: Automated Global Asset Fleet', upgradeCost: 40000000, equipmentCap: 10,
    desc: 'A massive network of global machinery depots featuring proprietary, automated heavy equipment and AI-driven logistical tracking systems.',
    effect: 'Store 10 Equipment · buy from abroad · sell internationally (marketplace coming).' },
];

// The PROJECT MANAGEMENT ladder — pm_tier (20270820), upgraded by
// Logistical Overhaul on the same price ladder as the yard. Caps and
// the international gate are enforced server-side
// (pm_max_active_projects + the start/bid/award RPCs); building
// requirements check completed commercial self-builds.
export const PM_TIERS = [
  { tier: 'Level 0: The Truck & Clipboard', upgradeCost: null, requirement: null,
    desc: 'You handle all local permitting, contract estimates, and safety compliance yourself out of the cab of your truck. Administrative bottlenecks limit you to chasing one tiny contract at a time.',
    effect: 'Max Number of Active Projects: 1' },
  { tier: 'Level I: Rented Office Suite', upgradeCost: 7000000,
    requirement: 'Own a Commercial I grade building',
    desc: 'A small commercial office space with a hired part-time secretary and a digital bidding software license to track regional projects.',
    effect: 'Max Number of Active Projects: 2' },
  { tier: 'Level II: Municipal Contracting Office', upgradeCost: 10000000,
    requirement: 'Own a Commercial II grade building',
    desc: 'A dedicated local office with full-time cost estimators and a dedicated compliance officer to handle city and county zoning laws.',
    effect: 'Max Number of Active Projects: 3 · +1 Experience when finishing a project' },
  { tier: 'Level III: Regional PMO Division', upgradeCost: 16000000,
    requirement: 'Own a Commercial III grade building',
    desc: 'A comprehensive project management office managing regional contract compliance, regulatory legal teams, and multi-site coordination.',
    effect: 'Max Number of Active Projects: 4 · international bidding · +2 Experience per finished project' },
  { tier: 'Level IV: National Compliance & Legal Bureau', upgradeCost: 25000000,
    requirement: 'Own a Commercial I grade building in at least 2 nations',
    desc: 'A corporate department capable of navigating complex national environmental impacts, sovereign regulations, and massive corporate bids.',
    effect: 'Max Number of Active Projects: 5 · +3 Experience per finished project' },
  { tier: 'Level V: Global Regulatory Affairs Directorate', upgradeCost: 40000000,
    requirement: 'Own a Commercial I grade building in at least 3 nations',
    desc: 'An elite corporate administrative network that can handle thousands of global infrastructure bids and easily clear geopolitical regulatory hurdles simultaneously.',
    effect: 'Max Number of Active Projects: Unlimited · +5 Experience per finished project' },
];

// The SUPPLY & MATERIAL Depot ladder — materials_tier (20270822),
// upgraded by Logistical Overhaul on the same price ladder as the
// yard. Caps / sourcing are enforced server-side
// (materials_storage_cap + buy_construction_goods); storageCap and
// upgradeCost are display mirrors.
export const SUPPLY_TIERS = [
  { tier: 'Level 0: Retail Hardware Store', upgradeCost: null, storageCap: 0,
    desc: 'You buy concrete mix, lumber, and rebar directly from retail commercial distributors or local suppliers at standard market prices with zero bulk discounts.',
    effect: 'Project Manager or Owner/CEO can buy Construction Materials directly for active projects.' },
  { tier: 'Level I: Storage Shed & Materials Laydown', upgradeCost: 7000000, storageCap: 20,
    desc: 'A rented, outdoor storage lot or warehouse bay allowing you to store a few material pallets purchased during minor market dips.',
    effect: 'Buy and store up to 20 Construction Materials.' },
  { tier: 'Level II: Municipal Distribution Yard', upgradeCost: 10000000, storageCap: 60,
    desc: 'A dedicated warehouse featuring bulk storage silos for cement and structural steel racking, allowing direct wholesale purchasing.',
    effect: 'Buy and store up to 60 Construction Materials.' },
  { tier: 'Level III: Regional Supply Terminal', upgradeCost: 16000000, storageCap: 85,
    desc: 'A massive logistics hub featuring an active rail spur link to receive raw steel shipments and aggregate trainloads directly from manufacturers.',
    effect: 'Store up to 85 Construction Materials · buy from other nations.' },
  { tier: 'Level IV: Deep-Water Staging Network', upgradeCost: 25000000, storageCap: 120,
    desc: 'Direct ownership of multi-modal distribution centers, deep-water port access, and bulk transport loops that isolate you from market shortages.',
    effect: 'Store 120 Materials · buy abroad · sell in your own nation (marketplace coming).' },
  { tier: 'Level V: Sovereign Resource & Materials Conglomerate', upgradeCost: 40000000, storageCap: 170,
    desc: 'A fully integrated global supply network with strategic ownership of extraction nodes and steel mills, guaranteeing the lowest material overhead on the server.',
    effect: 'Store 170 Materials · buy abroad · sell nationally and on the world market (marketplace coming).' },
];

// Display mirror of the per-type material requirements stamped onto
// blueprints by draft_blueprint (20270814) — the server CASE is
// authoritative; this feeds the modal's live MATERIALS NEEDED line.
export const BUILDING_MATERIALS_NEEDED = {
  single_story_home: 1,
  double_story: 2,
  multitenant_living: 7,
  infrastructure_tier_i: 10,
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
    { dept: 'PROJECT MANAGEMENT', ...PM_TIERS[0] },
    { dept: 'HEAVY EQUIPMENT', ...YARD_TIERS[0] },
    { dept: 'SUPPLY & MATERIAL', ...SUPPLY_TIERS[0] },
    { dept: 'SYSTEM DESIGN', tier: 'CAD System & Laptop',
      desc: 'You implement your own designs, limited by your own project expertise.',
      effect: 'You gain Experience at +3 per completed project.' },
    { dept: 'REGULATORY COMPLIANCE', tier: 'City Permits',
      desc: 'Your licensing stops at the city clerk’s counter. You’re cleared for small-scale municipal work — anything bigger needs certifications you don’t hold yet.',
      effect: 'Can only build ‘Residential’ and ‘Tier I Commercial’.' },
  ],
  automotive: [null, null, null, null, null],
};
