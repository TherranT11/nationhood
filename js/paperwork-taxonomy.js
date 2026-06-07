// Single source of truth for the Paperwork Dispatch taxonomy — the
// ministries a Civil Servant can route to and the agencies within each
// ministry. Used by:
//   • handlepaperwork.html (author UI — ministry pill grid + agency dropdown)
//   • courtcaseadmin.html  (moderation — display the chosen ministry / agency)
//   • Future civil-servant routing UI (routes the dispatch, compares to
//     the answer key for the reputation reward / penalty).
//
// Adding / renaming a ministry or agency: update this file only. The
// keys are stored as text in paperwork_dispatches.correct_ministry /
// correct_agency, so renaming a label (display string) is safe but
// renaming a key requires a data backfill.

export const PAPERWORK_MINISTRIES = {
    foreign_affairs: {
        label: 'Foreign Affairs',
        icon:  '\u{1F310}',
        agencies: [
            { key: 'bilateral_relations',     label: 'Bureau of Bilateral Relations',     hint: 'state-to-state' },
            { key: 'treaties_conventions',    label: 'Office of Treaties & Conventions',  hint: 'agreements · ratification' },
            { key: 'consular_services',       label: 'Consular Services Authority',       hint: 'visas · citizens abroad' },
            { key: 'multilateral_affairs',    label: 'Multilateral Affairs Directorate',  hint: 'international bodies' },
            { key: 'public_diplomacy',        label: 'Cultural & Public Diplomacy Bureau', hint: 'soft power' },
        ],
    },
    trade: {
        label: 'Trade',
        icon:  '\u{1F69B}',
        agencies: [
            { key: 'tariffs_customs',         label: 'Office of Tariffs & Customs',        hint: 'duties · clearance' },
            { key: 'export_promotion',        label: 'Export Promotion Bureau',            hint: 'outbound trade' },
            { key: 'trade_agreements',        label: 'Trade Agreements Directorate',       hint: 'FTAs · negotiation' },
            { key: 'import_regulation',       label: 'Bureau of Import Regulation',        hint: 'inbound trade · standards' },
            { key: 'commercial_disputes',     label: 'Commercial Disputes Office',         hint: 'arbitration · WTO' },
        ],
    },
    economic_development: {
        label: 'Economic Development',
        icon:  '\u{1F4DD}',
        agencies: [
            { key: 'industrial_concessions', label: 'Bureau of Industrial Concessions',     hint: 'licensing · renewals' },
            { key: 'environmental_compliance', label: 'Environmental Compliance Authority', hint: 'effluent · inspection' },
            { key: 'sectoral_planning',       label: 'Office of Sectoral Planning',         hint: 'strategy · subsidies' },
            { key: 'special_economic_zones',  label: 'Special Economic Zones Directorate',  hint: 'concessions · zones' },
            { key: 'foreign_investment',      label: 'Bureau of Foreign Investment Review', hint: 'FDI · capital' },
        ],
    },
    interior: {
        label: 'Interior',
        icon:  '\u{1F3E0}',
        agencies: [
            { key: 'provincial_affairs',      label: 'Bureau of Provincial Affairs',        hint: 'governors · regions' },
            { key: 'civil_registry',          label: 'Civil Registry Directorate',          hint: 'records · documents' },
            { key: 'disaster_management',     label: 'Office of Disaster Management',       hint: 'emergencies · relief' },
            { key: 'lands_heritage',          label: 'Public Lands & Heritage Bureau',      hint: 'parks · monuments' },
            { key: 'municipal_affairs',       label: 'Municipal Affairs Office',            hint: 'cities · local govt' },
        ],
    },
    defense: {
        label: 'Defense',
        icon:  '\u{2694}\u{FE0F}',
        agencies: [
            { key: 'national_police',         label: 'Bureau of National Police',           hint: 'law enforcement' },
            { key: 'border_security',         label: 'Border Security Directorate',         hint: 'frontier · ports' },
            { key: 'counterterrorism',        label: 'Counterterrorism Office',             hint: 'threat response' },
            { key: 'defence_procurement',     label: 'Office of Defence Procurement',       hint: 'arms · contracts' },
            { key: 'intelligence',            label: 'National Intelligence Bureau',        hint: 'signals · human' },
        ],
    },
    agriculture: {
        label: 'Agriculture',
        icon:  '\u{1F33E}',
        agencies: [
            { key: 'crop_production',         label: 'Bureau of Crop Production',           hint: 'arable · yields' },
            { key: 'livestock_fisheries',     label: 'Office of Livestock & Fisheries',     hint: 'animals · catch' },
            { key: 'agricultural_subsidies',  label: 'Agricultural Subsidies Directorate',  hint: 'support payments' },
            { key: 'rural_development',       label: 'Rural Development Authority',         hint: 'villages · roads' },
            { key: 'food_safety',             label: 'Bureau of Food Safety',               hint: 'inspection · recalls' },
        ],
    },
    sports: {
        label: 'Sports',
        icon:  '\u{26BD}',
        agencies: [
            { key: 'olympic_affairs',         label: 'Office of Olympic Affairs',           hint: 'international games' },
            { key: 'sports_federations',      label: 'National Sports Federation Bureau',   hint: 'leagues · associations' },
            { key: 'youth_athletics',         label: 'Youth Athletics Directorate',         hint: 'grassroots · schools' },
            { key: 'venue_management',        label: 'Bureau of Stadium & Venue Management', hint: 'facilities · events' },
            { key: 'doping_control',          label: 'Sports Doping Control Authority',     hint: 'testing · sanctions' },
        ],
    },
    transportation: {
        label: 'Transportation',
        icon:  '\u{1F68C}',
        agencies: [
            { key: 'roads_highways',          label: 'Bureau of Roads & Highways',          hint: 'arterials · maintenance' },
            { key: 'civil_aviation',          label: 'Office of Civil Aviation',            hint: 'airports · airlines' },
            { key: 'maritime_affairs',        label: 'Maritime Affairs Directorate',        hint: 'ports · shipping' },
            { key: 'rail_services',           label: 'Rail Services Bureau',                hint: 'rolling stock · tracks' },
            { key: 'public_transit',          label: 'Public Transit Authority',            hint: 'buses · metros' },
        ],
    },
    energy: {
        label: 'Energy',
        icon:  '\u{26A1}',
        agencies: [
            { key: 'oil_gas_concessions',     label: 'Office of Oil & Gas Concessions',     hint: 'extraction · licensing' },
            { key: 'electricity_regulator',   label: 'Electricity Regulatory Authority',    hint: 'grid · tariffs' },
            { key: 'renewable_energy',        label: 'Renewable Energy Bureau',             hint: 'solar · wind · hydro' },
            { key: 'nuclear_affairs',         label: 'Nuclear Affairs Directorate',         hint: 'reactors · waste' },
            { key: 'energy_conservation',     label: 'Energy Conservation Office',          hint: 'efficiency · standards' },
        ],
    },
    finance: {
        label: 'Finance',
        icon:  '\u{1F4B5}',
        agencies: [
            { key: 'tax_collection',          label: 'Bureau of Tax Collection',            hint: 'revenue · audits' },
            { key: 'public_debt',             label: 'Office of Public Debt Management',    hint: 'bonds · refinancing' },
            { key: 'treasury_cash',           label: 'Treasury & Cash Management',          hint: 'liquidity · balances' },
            { key: 'banking_supervision',     label: 'Bureau of Banking Supervision',       hint: 'prudential · stress' },
            { key: 'public_investment',       label: 'Office of Public Investment',         hint: 'capex · sovereign funds' },
        ],
    },
};

// Stats a dispatch may affect when handled correctly (or incorrectly).
// Grouped purely for the dropdown UI; the answer-key column stores just
// the key. Display labels here drive the UI; the key is the database
// value.
export const PAPERWORK_STATS = {
    governance: [
        { key: 'stability',       label: 'Stability',       unit: '0–100' },
        { key: 'civil_freedoms',  label: 'Civil Freedoms',  unit: '0–100' },
        { key: 'crime',           label: 'Crime',           unit: '0–100' },
        { key: 'corruption',      label: 'Corruption',      unit: '0–100' },
    ],
    economy: [
        { key: 'gdp',                 label: 'GDP',                 unit: 'USD bn' },
        { key: 'gdp_growth',          label: 'GDP Growth',          unit: '0–100' },
        { key: 'budget',              label: 'Budget',              unit: 'USD bn' },
        { key: 'debt',                label: 'Debt',                unit: 'USD bn' },
        { key: 'income_tax',          label: 'Income Tax',          unit: '0–100' },
        { key: 'corporate_tax',       label: 'Corporate Tax',       unit: '0–100' },
        { key: 'wages',               label: 'Wages',               unit: '0–100' },
        { key: 'standard_of_living',  label: 'Standard of Living',  unit: '0–100' },
        { key: 'cost_of_living',      label: 'Cost of Living',      unit: '0–100' },
    ],
    society: [
        { key: 'health',              label: 'Health',              unit: '0–100' },
        { key: 'education',           label: 'Education',           unit: '0–100' },
        { key: 'infrastructure',      label: 'Infrastructure',      unit: '0–100' },
        { key: 'population_growth',   label: 'Population Growth',   unit: '0–100' },
    ],
    sectors: [
        { key: 'manufacturing_sector', label: 'Manufacturing Sector', unit: '0–100' },
        { key: 'skilled_worker',       label: 'Skilled Worker',       unit: '0–100' },
        { key: 'service_sector',       label: 'Service Sector',       unit: '0–100' },
    ],
    resources_on_hand: [
        { key: 'energy_on_hand',     label: 'Energy (on hand)',    unit: 'units' },
        { key: 'food_on_hand',       label: 'Food (on hand)',      unit: 'units' },
        { key: 'minerals_on_hand',   label: 'Minerals (on hand)',  unit: 'units' },
        { key: 'consumer_goods',     label: 'Consumer Goods',      unit: 'units' },
        { key: 'luxury_goods',       label: 'Luxury Goods',        unit: 'units' },
    ],
    resources_generation: [
        { key: 'energy_generation',   label: 'Energy Generation',   unit: 'units/tick' },
        { key: 'food_generation',     label: 'Food Generation',     unit: 'units/tick' },
        { key: 'mineral_generation',  label: 'Mineral Generation',  unit: 'units/tick' },
        { key: 'goods_generation',    label: 'Goods Generation',    unit: 'units/tick' },
        { key: 'luxury_generation',   label: 'Luxury Generation',   unit: 'units/tick' },
    ],
};

export const PAPERWORK_STAT_GROUP_LABELS = {
    governance:             'Governance',
    economy:                'Economy',
    society:                'Society',
    sectors:                'Sectors',
    resources_on_hand:      'Resources · On Hand',
    resources_generation:   'Resources · Generation',
};

// Lookup helpers (used by both the author UI and the admin display).
export function findMinistry(key) {
    return PAPERWORK_MINISTRIES[key] || null;
}
export function findAgency(ministryKey, agencyKey) {
    const m = findMinistry(ministryKey);
    if (!m) return null;
    return m.agencies.find(a => a.key === agencyKey) || null;
}
export function findStat(statKey) {
    if (!statKey) return null;
    for (const group of Object.values(PAPERWORK_STATS)) {
        const hit = group.find(s => s.key === statKey);
        if (hit) return hit;
    }
    return null;
}
