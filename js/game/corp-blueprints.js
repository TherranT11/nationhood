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
    effect: 'Max Number of Active Projects: 4 · +2 Experience per finished project' },
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

// The REGULATORY COMPLIANCE ladder — reg_tier (20270826), upgraded
// by Logistical Overhaul on the same price ladder as the yard. The
// authorization map and the foreign gate are enforced server-side
// (reg_min_tier + the bid/start RPCs).
export const REG_TIERS = [
  { tier: 'Tier 0: City Permits', upgradeCost: null,
    desc: 'Your licensing stops at the city clerk’s counter. You’re cleared for small-scale municipal work — anything bigger needs certifications you don’t hold yet.',
    effect: 'Can build Residential, Tier I Commercial, Tier I Infrastructure.' },
  { tier: 'Tier I: Provincial Contractor License', upgradeCost: 7000000,
    desc: 'You’ve passed the provincial board examination and posted the required surety bond. Your firm is now registered with the provincial licensing authority, which means you can bid on work that crosses municipal lines and engages standardized provincial inspectors.',
    effect: 'Adds Tier II Commercial and Tier II Infrastructure.' },
  { tier: 'Tier II: National General Contractor Certification', upgradeCost: 10000000,
    desc: 'The National Construction Authority has certified your firm to handle complex multi-jurisdictional projects. You’ve demonstrated sufficient capital reserves, safety record, and technical capability to be trusted with structures that require coordinated review across multiple regulatory regimes.',
    effect: 'Adds Tier III Commercial and Tier III Infrastructure.' },
  { tier: 'Tier III: Industrial Construction License', upgradeCost: 16000000,
    desc: 'Your firm has been cleared by the Industrial Safety Board to operate at the scale and complexity of heavy industrial construction. This involves specialized certifications in hazardous-materials handling, process-systems integration, and large-scale industrial inspection protocols. Most general contractors never reach this tier.',
    effect: 'Adds Tier IV Infrastructure.' },
  { tier: 'Tier IV: Federal Defense Contractor Clearance', upgradeCost: 25000000,
    desc: 'You hold a federal security clearance authorizing your firm to participate in classified construction work. Your principals have passed individual background reviews; your operational systems have been audited for security compliance; your supply chain is registered with the Defense Procurement Office. This authorization is rare and revocable.',
    effect: 'Adds Tier I Military construction.' },
  { tier: 'Tier V: International Construction Charter', upgradeCost: 40000000,
    desc: 'Your firm is registered with international construction authorities and recognized in major foreign markets. You navigate cross-border regulatory frameworks, international labor compliance, foreign-investment review requirements, and host-country licensing protocols. Operating at this tier requires a permanent in-house regulatory affairs division.',
    effect: 'Adds Foreign Construction — projects in other nations.' },
];

// The SYSTEM DESIGN ladder — design_tier (20270827), upgraded by
// Logistical Overhaul on the same price ladder as the yard. The
// per-completion Experience contribution and the Experience cap are
// enforced server-side (completion_experience + experience_cap);
// expCap mirrors the cap for the registry readout.
export const DESIGN_TIERS = [
  { tier: 'Tier 0: CAD System & Laptop', upgradeCost: null, expCap: 30,
    desc: 'You have a single laptop with a licensed CAD package and a printer that jams every third drawing. Your designs are 2D floor plans, elevations, and basic structural diagrams — adequate for permit submission but nothing more sophisticated.',
    effect: '+1 Experience any time you finish a project.' },
  { tier: 'Tier I: Drafting Workstations & Plotter', upgradeCost: 7000000, expCap: 30,
    desc: 'You’ve upgraded to dedicated drafting workstations with proper graphics hardware, multiple monitors, and a large-format plotter. Your team can now produce coordinated drawing sets across disciplines — architectural, structural, mechanical — with consistent line weights and proper title blocks.',
    effect: '+2 Experience any time you finish a project.' },
  { tier: 'Tier II: BIM Network & Render Servers', upgradeCost: 10000000, expCap: 30,
    desc: 'The firm has migrated to Building Information Modeling. Every project lives as a coordinated 3D model rather than a stack of disconnected drawings. Clash detection runs automatically. Renderings come out of dedicated render servers in hours instead of days. Your project files are now intelligent assets that compute their own quantities and costs.',
    effect: '+3 Experience any time you finish a project.' },
  { tier: 'Tier III: Integrated Design & Construction Suite', upgradeCost: 16000000, expCap: 50,
    desc: 'Design, engineering, scheduling, and cost estimation now run on a single integrated platform. Changes to the model propagate automatically through structural calculations, MEP routing, construction sequencing, and budget projections. Your competitors are still maintaining separate systems and reconciling them by hand.',
    effect: 'Max Experience rises from 30 to 50.' },
  { tier: 'Tier IV: Parametric & Generative Design Platform', upgradeCost: 25000000, expCap: 50,
    desc: 'Your design platform generates and tests thousands of variations on a single project brief, optimizing for cost, performance, daylight, structural efficiency, and aesthetic constraints simultaneously. Your designers no longer draw buildings — they direct algorithms that draw buildings, then select the best results for client presentation.',
    effect: '+3 Experience per finished project · parametric modeling, generative optimization, simulation-driven engineering, digital twins.' },
  { tier: 'Tier V: AI-Augmented Design & Digital Twin Network', upgradeCost: 40000000, expCap: 80,
    desc: 'Your firm operates an AI-augmented design infrastructure that integrates project intelligence across every job, every client, and every market the firm has ever touched. Buildings are designed once and exist forever as living digital twins, fed real-time data by sensors embedded in the physical structures. Your design platform is a strategic asset competitors cannot replicate without decades of accumulated project data.',
    effect: 'Max Experience rises to 80 · AI-augmented design, organization-wide intelligence, persistent digital twins, real-time feedback.' },
];

// The hiring ladders behind [POST JOB OPENING] — title CASEs in
// post_job_opening (20270837) are authoritative; this is the display
// copy for the modal's rung cards and the home page's Current Role.
// Construction hires Operations (rungs 4-6 dimmed until chartered)
// and Leadership; automotive hires its three careers (20270837) top
// to bottom from day one. INDUSTRY_JOB_TRACKS below pairs tracks
// with industries for the modal's pills.
export const JOB_TRACKS = {
  operations: [
    { rung: 1, name: 'Project Manager (PM)', postable: true,
      desc: 'You own the execution of a single contract from start to finish. You handle the scheduling, solve logistical bottlenecks on-site, and aggressively push the Advance Build action to deliver the project on time.',
      resp: 'Required to have an active project.' },
    { rung: 2, name: 'Senior Project Manager', postable: true,
      desc: 'You manage multiple simultaneous sub-contracts. You coordinate the allocation of the firm’s shared resources, ensuring that a single rented excavator is seamlessly moved between sites without sitting idle for a single tick.',
      resp: 'Required to have an active project, but often works quicker.' },
    { rung: 3, name: 'Regional Director of Operations', postable: true,
      desc: 'You oversee the entire field portfolio of the firm. You establish construction standard operating procedures, negotiate long-term agreements with specialized labor crews, and manage macro-level capacity bottlenecks.',
      resp: 'Required to oversee multiple projects.' },
    { rung: 4, name: 'National Director of Operations', postable: false,
      desc: 'You run construction at the scale of a country. Regional Directors report to you while you balance the firm’s national pipeline — deciding which cities get crews, which contracts take priority, and which ministries get courted ahead of the next public tender.',
      resp: 'Oversees every region in a nation; arbitrates crew and capacity disputes between Regional Directors.' },
    { rung: 5, name: 'Global Director of Operations', postable: false,
      desc: 'You command operations across borders. You arbitrage labor costs, materials prices, and regulatory friction between nations — and you decide where the firm plants its next depot, office, and flag.',
      resp: 'Oversees all national operations; required to open and run job sites abroad.' },
    { rung: 6, name: 'Chief Operating Officer (COO)', postable: false,
      desc: 'The ultimate operational authority. You sit next to the founder and dictate corporate execution velocity. You decide how to split the firm’s construction capacity across player B2B contracts and high-yield infrastructure builds.',
      resp: 'Sets the firm’s entire build strategy; answers only to the owner for every site, crew, and contract on Earth.' },
  ],
  leadership: [
    { rung: 1, name: 'Estimator / Business Development Associate', postable: true,
      desc: 'You’re the entry point to running the business. You assemble bid packages for new contracts — pricing the work, identifying risks, writing the proposal narrative. You also accompany senior staff to client meetings, networking events, and trade shows, learning who the firm needs to know to win work.',
      resp: 'Required to actively pursue new contracts; supports senior leadership at client-facing events.' },
    { rung: 2, name: 'Business Development Manager', postable: true,
      desc: 'You own client relationships. You identify prospective work, qualify opportunities, manage the pursuit process, and bring deals to the firm. Project Managers execute the work you brought in; you’re already chasing the next contract. You know which property developers are planning expansions, which government agencies have unannounced procurement budgets, and which competitors are weakening.',
      resp: 'Owns the contract pipeline; deals with at least one active prospective client engagement.' },
    { rung: 3, name: 'Regional General Manager', postable: true,
      desc: 'You run a regional office as your own small business. You hire and fire local staff, set regional pricing strategy, manage local client relationships, and handle the political relationships that determine which contracts your firm wins. You report to corporate but you’re the firm’s face in your region.',
      resp: 'Operates a regional office; profit-and-loss accountability for the region.' },
    { rung: 4, name: 'Vice President of Strategy', postable: true,
      desc: 'You shape the firm’s strategic direction. You identify new markets to enter, evaluate competitor acquisitions, develop new service offerings, and steer the firm’s capital deployment between competing growth opportunities. You’re in the room when the founders decide which projects to chase and which to walk away from.',
      resp: 'Sets multi-year strategic plans; required to approve major market entries and significant capital commitments.' },
    { rung: 5, name: 'President / Chief Operating Officer', postable: true,
      desc: 'You’re the second-in-command of the corporation. The CEO sets vision; you execute it across every function — coordinating Operations, Finance, Engineering, and Commercial. Your daily work is running the company — managing the executive team, handling the largest client relationships, representing the firm in major industry forums. You’re the heir apparent.',
      resp: 'Coordinates all corporate functions under the CEO; manages the executive committee.' },
    { rung: 6, name: 'Chief Executive Officer (CEO)', postable: true,
      desc: 'The ultimate corporate authority. You set the firm’s vision and answer for every decision — strategic, financial, operational, ethical. You appoint the COO, CFO, and senior executives. You sit at the head of the board. When the firm wins, your name is in the press. When the firm fails, your career is on the line. You hold the chair until you retire, step down, or are removed by the board.',
      resp: 'Sets corporate vision and strategic direction; ultimate accountability for every major decision.' },
  ],
  manufacturing: [
    { rung: 1, name: 'Production Engineer', postable: true,
      desc: 'Junior plant engineer; you optimize specific lines or troubleshoot quality issues.' },
    { rung: 2, name: 'Production Manager', postable: true,
      desc: 'You manage a shift or a specific production area; responsible for daily output targets.' },
    { rung: 3, name: 'Plant Manager', postable: true,
      desc: 'You run an entire factory; thousands of workers report to you.' },
    { rung: 4, name: 'Director of Manufacturing', postable: true,
      desc: 'You oversee multiple plants or a major manufacturing function.' },
    { rung: 5, name: 'VP of Manufacturing', postable: true,
      desc: 'You oversee the corporation’s entire manufacturing operation globally.' },
    { rung: 6, name: 'Chief Manufacturing Officer (CMO)', postable: true,
      desc: 'Terminal position. C-suite. You’re responsible for everything the corporation builds, physically.' },
  ],
  product: [
    { rung: 1, name: 'Product Engineer', postable: true,
      desc: 'Junior engineer working on specific components of a vehicle program.' },
    { rung: 2, name: 'Engineering Manager', postable: true,
      desc: 'You lead a sub-team within a vehicle program.' },
    { rung: 3, name: 'Vehicle Program Manager', postable: true,
      desc: 'You’re responsible for an entire vehicle program from concept to launch.' },
    { rung: 4, name: 'Director of Product Development', postable: true,
      desc: 'You oversee multiple vehicle programs.' },
    { rung: 5, name: 'VP of Product Planning / VP of Engineering', postable: true,
      desc: 'You set product strategy for a brand or segment.' },
    { rung: 6, name: 'Chief Product Officer (CPO)', postable: true,
      desc: 'Terminal position. C-suite. You’re responsible for what the corporation makes.' },
  ],
  commercial: [
    { rung: 1, name: 'Field Sales Representative / Marketing Analyst', postable: true,
      desc: 'Junior role in the customer-facing side of the business.' },
    { rung: 2, name: 'District Sales Manager / Marketing Manager', postable: true,
      desc: 'You manage relationships with multiple dealerships or run a major marketing campaign.' },
    { rung: 3, name: 'Regional Sales Director / Director of Marketing', postable: true,
      desc: 'You oversee sales for a major region or run all marketing for a brand.' },
    { rung: 4, name: 'VP of Sales / VP of Marketing', postable: true,
      desc: 'You oversee national operations.' },
    { rung: 5, name: 'Senior VP of Commercial Operations', postable: true,
      desc: 'You oversee all customer-facing functions for the corporation.' },
    { rung: 6, name: 'Chief Commercial Officer (CCO)', postable: true,
      desc: 'Terminal position. C-suite. You’re responsible for everything the company does to get its cars into customers’ hands.' },
  ],
};

// Which tracks each industry hires from, with the posting modal's
// pill labels, the track's career blurb, and its defining tension.
export const INDUSTRY_JOB_TRACKS = {
  construction: [
    { key: 'operations', label: 'OPERATIONS' },
    { key: 'finance', label: 'FINANCE', locked: true },
    { key: 'leadership', label: 'LEADERSHIP' },
  ],
  automotive: [
    { key: 'manufacturing', label: 'MANUFACTURING',
      blurb: 'The gritty industrial track. You start in plant operations and rise to chief manufacturing officer.',
      tension: 'The defining tension: every plant decision is permanent and political. You can’t easily close a plant; you can’t easily open one. Decisions you make today shape the company for decades.' },
    { key: 'product', label: 'PRODUCT',
      blurb: 'The engineering-strategic track. You start in vehicle engineering and rise to chief product officer.',
      tension: 'The defining tension: vehicle programs are 4-7 year commitments. You make decisions today that determine the company’s future a decade out. Bad calls on EV timing, missed market segments, over-investment in dying technologies — these errors compound silently and reveal themselves catastrophically.' },
    { key: 'commercial', label: 'COMMERCIAL',
      blurb: 'The sales-marketing-distribution track. You start in dealer relations or marketing and rise to chief commercial officer.',
      tension: 'The defining tension: the customer relationship is mediated through independent dealer franchisees, not employees. Your career rises on building dealer relationships, but dealers can also destroy you. Managing 4,000 small business owners who all have lawyers is its own special skill.' },
  ],
};

// The AUTOMOTIVE design catalog behind Draft Blueprint —
// vehicle_blueprint_xp_cost (20270831) is the authoritative pricing;
// these mirror it (base/mult/mod) and carry the pick copy.
export const VEHICLE_TYPES = [
  { value: 'coupe', label: 'Coupe', base: 3,
    desc: 'Two-door, sporty, smaller market. High style; low practicality.' },
  { value: 'sedan', label: 'Sedan', base: 3,
    desc: 'Four-door, family/business, large market. Practical workhorse.' },
  { value: 'pickup', label: 'Pickup', base: 4,
    desc: 'Truck, utility/work, large in some markets. Tough, expensive, profitable.' },
  { value: 'motorcycle', label: 'Motorcycle', base: 2,
    desc: 'Two-wheel, commuter or sport. Cheap to build, low margin per unit but high volume potential.' },
  { value: 'sports_car', label: 'Sports Car', base: 5,
    desc: 'Two-door performance, premium market. Low volume, high margin.' },
];

export const VEHICLE_CLASSES = [
  { value: 'economy', label: 'Economy', mult: 1.0,
    desc: 'Sub-$20k equivalent, mass market, basic specs.' },
  { value: 'mid_range', label: 'Mid-Range', mult: 1.0,
    desc: 'Standard family/commuter cars.' },
  { value: 'premium', label: 'Premium', mult: 1.3,
    desc: 'Honda Accord / Toyota Camry tier.' },
  { value: 'luxury', label: 'Luxury', mult: 1.5,
    desc: 'BMW / Mercedes / Lexus tier.' },
  { value: 'ultra_luxury', label: 'Ultra-Luxury', mult: 2.0,
    desc: 'Bentley / Rolls-Royce / Maserati tier.' },
];

export const VEHICLE_ENGINES = [
  { value: 'basic_3cyl', label: 'Basic 3-Cylinder', mod: 0,
    desc: 'Small economy cars, cheap, efficient.' },
  { value: 'basic_4cyl', label: 'Basic 4-Cylinder', mod: 0,
    desc: 'Standard sedans, balanced.' },
  { value: 'tuned_4cyl', label: 'Tuned 4-Cylinder', mod: 1,
    desc: 'Sporty performance, turbocharged.' },
  { value: 'v6', label: 'V6', mod: 1,
    desc: 'Mid-range power, family SUVs and pickups.' },
  { value: 'v8', label: 'V8', mod: 2,
    desc: 'High power, sports cars and full-size pickups.' },
  { value: 'v12', label: 'V12', mod: 3,
    desc: 'Luxury and supercars only, expensive to build.' },
  { value: 'electric_basic', label: 'Electric Motor (Basic)', mod: 1,
    desc: 'Entry-level EV.' },
  { value: 'electric_performance', label: 'Electric Motor (Performance)', mod: 2,
    desc: 'High-end EV / luxury EV.' },
  { value: 'hybrid', label: 'Hybrid Powertrain', mod: 1,
    desc: 'Gas + electric, premium fuel efficiency.' },
];

// +0.5 XP each. off_road fits pickups only; self_driving fits
// Premium+ classes only (both enforced server-side too).
export const VEHICLE_PACKAGES = [
  { value: 'leather_interior', label: 'Leather Interior Package',
    desc: 'Premium seats, soft-touch surfaces, ambient lighting.' },
  { value: 'premium_audio', label: 'Premium Audio Package',
    desc: 'Branded sound system, enhanced acoustics.' },
  { value: 'technology', label: 'Technology Package',
    desc: 'Touchscreen, navigation, smartphone integration.' },
  { value: 'driver_assist', label: 'Driver Assist Package',
    desc: 'Lane-keeping, adaptive cruise, blind-spot monitoring.' },
  { value: 'sport_performance', label: 'Sport Performance Package',
    desc: 'Sport suspension, performance brakes, sport tuning.' },
  { value: 'safety', label: 'Safety Package',
    desc: 'Enhanced airbags, collision avoidance, crash structure.' },
  { value: 'appearance', label: 'Appearance Package',
    desc: 'Premium wheels, body kit, custom trim.' },
  { value: 'cold_weather', label: 'Cold Weather Package',
    desc: 'Heated seats, heated steering wheel, remote start.' },
  { value: 'off_road', label: 'Off-Road Package', pickupOnly: true,
    desc: 'Skid plates, locking differential, raised suspension (Pickup only).' },
  { value: 'self_driving', label: 'Self-Driving Package', premiumOnly: true,
    desc: 'Advanced autonomous capability (Premium+ tier only).' },
];

export const VEHICLE_QUALITY = [
  { value: 'low', label: 'Low', mod: -1,
    desc: 'Cheap materials, shorter lifespan, frequent issues.' },
  { value: 'moderate', label: 'Moderate', mod: 0,
    desc: 'Typical mass-market quality.' },
  { value: 'standard', label: 'Standard', mod: 1,
    desc: 'Solid, reliable build.' },
  { value: 'exceptional', label: 'Exceptional', mod: 2,
    desc: 'Premium materials, exceptional longevity, low warranty costs.' },
];

// The DESIGN & ENGINEERING STUDIO ladder — automotive's first asset.
// Level I is live: draft_vehicle_blueprint (20270832) grants +1
// Experience per new Model up to the ceiling of 20, and automotive
// corps are founded with 5 XP. Higher levels are display copy until
// the studio's upgrade mechanics land (tier state moves to a column
// then); the grants/ceilings here mirror the server constants.
export const STUDIO_TIERS = [
  { tier: 'Level I: The Drafting & Prototyping Center',
    desc: 'Built on day one using your initial capital. This is a dedicated office building housing a small team of engineers using professional CAD suites, complete with an attached physical prototyping workshop and basic component testing rigs.',
    effect: '+1 Experience every time you create a new Model · Experience ceiling: 20.' },
  { tier: 'Level II: Advanced Powertrain Lab',
    desc: 'Adds engine dynamometers, advanced emissions-testing bays, and environmental chambers to refine motor, transmission, or battery reliability.',
    effect: '+2 Experience every time you create a new Model · Experience ceiling: 20.' },
  { tier: 'Level III: Virtual Simulation Mainframe',
    desc: 'Integrates high-performance computing clusters. Allows you to run digital crash tests and aerodynamic simulations, drastically speeding up blueprint creation.',
    effect: '+3 Experience every time you create a new Model · Experience ceiling: 20.' },
  { tier: 'Level IV: Aerodynamic Wind Tunnel Complex',
    desc: 'A massive, state-of-the-art physical wind tunnel facility to perfect drag coefficients and thermal management for high-tier chassis.',
    effect: 'New Experience ceiling: 40 · Requires a Tier I Industrial facility.' },
  { tier: 'Level V: The Global Skunkworks Tower',
    desc: 'An elite, multi-disciplinary research campus pushing the absolute ceiling of autonomous systems, next-generation solid-state batteries, and composite materials.',
    effect: 'New Experience ceiling: 60 · Requires a Tier III Commercial building.' },
];

// The QUALITY & DATA CENTER ladder — automotive's third asset. It
// charters Analyze Market's reach: every corp runs Level I today
// (one vehicle type, home nation — exactly what the action does),
// and the higher levels widen it (more types per analysis, foreign
// nations at III+, the best-selling Quality at V) when the upgrade
// mechanics land and the tier moves to a column.
export const DATA_TIERS = [
  { tier: 'Level I: Service Diagnostics & Warranty Depot',
    desc: 'A centralized technical service bay where your corporate mechanics analyze warranty part returns and evaluate early fleet diagnostic data sent back from regional player-owned vehicle repairs.',
    effect: 'Analyze Market shows Demand for 1 vehicle type, home nation only.' },
  { tier: 'Level II: Fleet Analytics Station',
    desc: 'Basic digital tracking hardware installed in your sold vehicles allows you to pull high-level mileage, fuel consumption, and battery health data over local cellular networks.',
    effect: 'Shows Demand for any 2 selected types.' },
  { tier: 'Level III: Data Processing Lab',
    desc: 'Dedicated server architecture that continuously isolates mechanical, structural, and electronic bugs across thousands of active vehicles globally.',
    effect: 'Select another Nation · shows Demand for any 3 selected types.' },
  { tier: 'Level IV: Global Telemetry Over-The-Air Array',
    desc: 'Continuous, high-bandwidth OTA cellular data streams link every single one of your vehicles on the road directly to your analytics database, feeding your R&D pipeline with real-world driving data.',
    effect: 'Select another Nation · shows Demand for any 4 selected types.' },
  { tier: 'Level V: Predictive AI Core',
    desc: 'An advanced neural network that actively predicts component failures and vehicle wear across millions of units before they occur, drastically cutting your warranty liability and granting massive R&D bonuses.',
    effect: 'Select another Nation · Demand for any 4 selected types · shows which Quality sells the best.' },
];

// The SUPPLY CHAIN & PART DEPOT ladder — automotive's fourth asset,
// determining procurement costs. Display copy until Aluminum lands
// as a market raw material with its procurement flow (the storage
// caps 10/50/75/120/250 and the Level III foreign-buying gate get
// enforced server-side then, like the construction depot's).
export const PARTS_TIERS = [
  { tier: 'Level I: Regional B2B Depot',
    desc: 'A large on-site storage warehouse. Your starting status gives you the leverage to sign direct, bulk purchasing contracts with Tier-1 component suppliers, protecting your early production runs from retail markup.',
    effect: 'Store up to 10 Aluminum.' },
  { tier: 'Level II: Just-In-Time Logistics Center',
    desc: 'Implements an active supply tracking network that links directly to component vendors, reducing your inventory storage overhead by matching part arrivals to your assembly schedule.',
    effect: 'Store up to 50 Aluminum.' },
  { tier: 'Level III: Vertical Consolidation Hub',
    desc: 'Direct ownership of sub-assembly stamping and electronics component plants, insulating your company from global parts shortages.',
    effect: 'Store up to 75 Aluminum · buy from other nations.' },
  { tier: 'Level IV: Strategic Material Terminal',
    desc: 'Direct ownership of raw foundry logistics, battery chemical contracts, and metal processing facilities, locking in permanently lower material costs.',
    effect: 'Store up to 120 Aluminum.' },
  { tier: 'Level V: Global Resource Network',
    desc: 'Strategic international mining stakes, dedicated shipping fleets, and exclusive raw-material trade pipelines that guarantee your manufacturing costs are fundamentally unbeatable.',
    effect: 'Store up to 250 Aluminum.' },
];

// The FRANCHISE & COMMERCIAL SUITE ladder — automotive's fifth
// asset, powering Supply Agreements. Level I is live: home-nation
// Sales Campaigns get +1 Demand (run_sales_campaign, 20270841).
// The deeper home bonuses and the Subsidiary-brand demand (III+)
// arrive with the tier column and its upgrade mechanics.
export const FRANCHISE_TIERS = [
  { tier: 'Level I: Flagship Showroom Network',
    desc: 'A small, corporate-owned network of modern dealerships situated in major metropolitan hubs to market your initial vehicle lineup directly to player-buyers and early consumer markets.',
    effect: '+1 Demand for all vehicles in your nation.' },
  { tier: 'Level II: Provincial Franchise Network',
    desc: 'Establishes corporate franchise frameworks, allowing independent NPC dealerships to distribute and service your vehicles across the entire state or province.',
    effect: '+2 Demand for all vehicles in your nation.' },
  { tier: 'Level III: National Fleet Logistics Office',
    desc: 'Unlocks dedicated commercial B2B sales infrastructure, allowing you to bid on and automatically fulfill massive vehicle transport contracts for shipping or rental corporations.',
    effect: '+3 Demand for all vehicles in your nation · +1 Demand for Subsidiary brands.' },
  { tier: 'Level IV: Continental Financing Corporation',
    desc: 'Mass-market retail presence backed by an in-house consumer auto financing and leasing division, multiplying your retail sales volume.',
    effect: '+4 Demand for all vehicles in your nation · +2 Demand for Subsidiary brands.' },
  { tier: 'Level V: Sovereign Trade Matrix',
    desc: 'Direct integration with international trade ministries, allowing you to establish nationwide consumer markets across multiple continents, secure massive state subsidies, and completely bypass import tariffs.',
    effect: '+3 Demand for Subsidiary brands.' },
];

// The ASSEMBLY PLANT ladder — automotive's second asset. Display copy
// only for now (every automotive corp starts at Level I); tier state
// moves to a column when its upgrade mechanics land. Industrial
// buildings (the construction blueprint category still being
// chartered) gate Levels II-V; line counts and the Superior 1.2× /
// Automated 1.3× efficiencies will drive vehicle production.
export const ASSEMBLY_TIERS = [
  { tier: 'Level I: Low-Volume Batch Workshop',
    desc: 'A professional, modern warehouse utilizing manual overhead cranes, stationary hoist bays, and a basic moving conveyor loop. Assembly is largely done by technicians using pneumatic tools. Slow, but highly flexible for initial vehicle runs.',
    effect: '1 Assembly Line.' },
  { tier: 'Level II: Semi-Automated Assembly Line',
    desc: 'Integrates early-stage robotics for chassis welding and heavy lifting, standardizing the pace of the conveyor line and increasing your volume capacity.',
    effect: '2 Assembly Lines · Requires a Tier I Industrial building.' },
  { tier: 'Level III: Modern Flexible Manufacturing Facility',
    desc: 'Features high-speed robotic stamping presses and automated paint lines. Allows multiple tooled production lines to share the same physical building footprint.',
    effect: '2 Assembly Lines — 1 Superior at 1.2× efficiency · Requires 2 Tier I Industrial buildings.' },
  { tier: 'Level IV: High-Volume Gigafactory',
    desc: 'A sprawling, heavily automated marvel with synchronized battery/engine marriage stations, structural casting machines, and massive daily output capabilities.',
    effect: '3 Assembly Lines — 1 Superior · 1 Automated at 1.3× efficiency · Requires a Tier II Industrial building.' },
  { tier: 'Level V: The Lights-Out Mega-Complex',
    desc: 'A fully autonomous, AI-orchestrated manufacturing ecosystem. Operates with near-zero variable labor overhead, self-corrects manufacturing defects in real-time, and scales production volume instantly.',
    effect: '4 Assembly Lines — 2 Superior · 2 Automated · Requires a Tier III Industrial building.' },
];

// The five automotive assets behind the department cards' [UPGRADE]
// buttons (20270842) — upgrade_automotive_asset and the per-level
// SQL helpers are authoritative; tier state lives on the
// entrepreneur_corps columns named here. Prices align with
// construction's yard_upgrade_cost by Roman numeral (Level I is the
// founding state).
export const AUTOMOTIVE_ASSETS = {
  design_studio: { col: 'design_studio_tier', dept: 'DESIGN & ENGINEERING', ladder: STUDIO_TIERS },
  assembly:      { col: 'assembly_tier',      dept: 'ASSEMBLY PLANT', ladder: ASSEMBLY_TIERS },
  data_center:   { col: 'data_center_tier',   dept: 'QUALITY & DATA CENTER', ladder: DATA_TIERS },
  parts_depot:   { col: 'parts_depot_tier',   dept: 'SUPPLY CHAIN & PART DEPOT', ladder: PARTS_TIERS },
  franchise:     { col: 'franchise_tier',     dept: 'FRANCHISE & COMMERCIAL SUITE', ladder: FRANCHISE_TIERS },
};
export const AUTOMOTIVE_ASSET_UPGRADE_COSTS = { 2: 10000000, 3: 16000000, 4: 25000000, 5: 40000000 };

// Assembly lines per plant level — mirror of assembly_lines (20270842).
export const ASSEMBLY_LINES_BY_TIER = [1, 1, 2, 2, 3, 4];

// Production materials (20270843/51) — mirrors of
// vehicle_aluminum_per_unit, vehicle_components_per_unit, and
// parts_depot_cap; the buy RPCs and start_production_run enforce.
export const ALUMINUM_PER_VEHICLE = { motorcycle: 0.5, pickup: 2 }; // every other type: 1
export const aluminumPerVehicle = (type) => ALUMINUM_PER_VEHICLE[type] ?? 1;
export const COMPONENTS_PER_ENGINE = { hybrid: 1, electric_basic: 2, electric_performance: 3 };
export const COMPONENTS_PER_PACKAGE = { technology: 1, self_driving: 1 };
export function componentsPerVehicle(engine, packages) {
  return (COMPONENTS_PER_ENGINE[engine] || 0)
    + (packages || []).reduce((s, p) => s + (COMPONENTS_PER_PACKAGE[p] || 0), 0);
}
export const PARTS_DEPOT_CAPS = [10, 10, 50, 75, 120, 250];

// Display mirrors of the Sales Campaign pricing/appeal helpers
// (20270839) — vehicle_class_anchor_price and vehicle_appeal are
// authoritative; these feed the campaign modal's live lines.
export const VEHICLE_CLASS_ANCHORS = {
  economy: 18000, mid_range: 35000, premium: 55000,
  luxury: 90000, ultra_luxury: 250000,
};

export function vehicleAppeal(engine, quality, packageCount) {
  const eMod = VEHICLE_ENGINES.find(e => e.value === engine)?.mod ?? 0;
  const qMod = VEHICLE_QUALITY.find(q => q.value === quality)?.mod ?? 0;
  return Math.max(0.5, 1 + eMod + qMod + 0.5 * (packageCount || 0));
}

export function vehicleBlueprintXpCost(type, klass, engine, packageCount, quality) {
  const base = VEHICLE_TYPES.find(t => t.value === type)?.base ?? 3;
  const mult = VEHICLE_CLASSES.find(c => c.value === klass)?.mult ?? 1.0;
  const eMod = VEHICLE_ENGINES.find(e => e.value === engine)?.mod ?? 0;
  const qMod = VEHICLE_QUALITY.find(q => q.value === quality)?.mod ?? 0;
  return Math.max(1, Math.ceil(base * mult + eMod + 0.5 * (packageCount || 0) + qMod));
}

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
    { dept: 'SYSTEM DESIGN', ...DESIGN_TIERS[0] },
    { dept: 'REGULATORY COMPLIANCE', ...REG_TIERS[0] },
  ],
  automotive: [
    { dept: 'DESIGN & ENGINEERING', ...STUDIO_TIERS[0] },
    { dept: 'ASSEMBLY PLANT', ...ASSEMBLY_TIERS[0] },
    { dept: 'QUALITY & DATA CENTER', ...DATA_TIERS[0] },
    { dept: 'SUPPLY CHAIN & PART DEPOT', ...PARTS_TIERS[0] },
    { dept: 'FRANCHISE & COMMERCIAL SUITE', ...FRANCHISE_TIERS[0] },
  ],
};
