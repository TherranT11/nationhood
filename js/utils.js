/**
 * utils.js — Pure utility functions shared across Nationhood pages.
 *
 * No side-effects on import. Safe to use from any page (game pages,
 * admin pages, pre-auth pages).
 */

// ===== APP VERSION =====

// Single source of truth for the build label shown in every faction navbar.
export const APP_VERSION = 'ALPA — 2.9';

// ===== AGE / CAREER MATH =====
// Single source of truth for the politician age + career-years derivation.
// Politicians spawn at START_AGE; each TICKS_PER_AGE_YEAR ticks elapsed
// since founded_tick is one in-game year of age. Pre-cleanup these three
// constants + functions lived in politician-topbar / politician-career /
// politician-ministry-foreign separately — same math, three copies.

export const START_AGE = 25;
export const TICKS_PER_AGE_YEAR = 12;

/** Years elapsed since the politician was founded. NULL-safe. */
export function careerYears(faction, currentTick) {
    if (!faction || faction.founded_tick == null || currentTick == null) return 0;
    const elapsed = Math.max(0, Number(currentTick) - Number(faction.founded_tick));
    return Math.floor(elapsed / TICKS_PER_AGE_YEAR);
}

/** In-game age of the politician. NULL-safe; defaults to START_AGE. */
export function currentAge(faction, currentTick) {
    return START_AGE + careerYears(faction, currentTick);
}

// ===== STRING ESCAPING =====

/**
 * Escape HTML special characters to prevent XSS when inserting
 * user-provided text into the DOM via innerHTML.
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

/**
 * Escape a string for safe use inside an HTML attribute value.
 */
export function escapeAttr(text) {
    return (text || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Hex-color guard for any user-supplied color string that flows into
 * inline CSS via `style="..."`. escapeHtml doesn't escape CSS context,
 * so a "; background:url(...)" payload would otherwise slip through.
 * Accepts 3 / 6 / 8-digit hex values; anything else falls back to the
 * brand teal. Source of truth — every page that paints with a stored
 * party_color or similar must filter through this.
 */
export function safeHexColor(c, fallback = '#5aafa5') {
    return /^#[0-9a-f]{3}([0-9a-f]{3}([0-9a-f]{2})?)?$/i.test(c || '') ? c : fallback;
}

/**
 * 2-3 letter badge initials for a faction (party / corp / etc.). Prefers
 * the abbreviation when present; falls back to two-word initials, then a
 * two-letter slice of the name. Final fallback: "??".
 */
export function factionInitials(name, abbreviation) {
    if (abbreviation) return String(abbreviation).slice(0, 3).toUpperCase();
    const parts = (name || '').split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name || '??').slice(0, 2).toUpperCase();
}

/**
 * Player-facing character name. Appends "(Nickname)" when faction
 * .nickname is set, else returns just "First Last". One source so
 * every character-name surface (topbar, party panel, committee
 * card, brief card, etc.) renders the same shape. Falls back to
 * the faction's own name when first/last are absent.
 */
export function displayName(faction) {
    const first = faction?.leader_first_name || '';
    const last  = faction?.leader_last_name  || '';
    const full  = (first + ' ' + last).trim() || faction?.faction_name || '';
    const nick  = (faction?.nickname || '').trim();
    return nick ? `${full} (${nick})` : full;
}

// Entrepreneur "home nation" = ent_origin_nation (immutable birthplace,
// set by 20270349 / the 20270491 travel RPC seed) with a fallback to
// the current location for legacy rows missed by the one-time backfill.
// Mirrors found_entrepreneur_corp's server-side derivation so the
// picker, modals, and gate all agree on the same name.
export function homeNationName(faction) {
    const origin = (faction?.ent_origin_nation || '').trim();
    const nation = (faction?.nation || '').trim();
    return origin || nation || '';
}

/**
 * Truncate a string to `max` characters, adding '...' if trimmed.
 */
export function truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '...' : str;
}

/**
 * Title-case each word ("shipping" → "Shipping"). Does not touch
 * underscores — callers that need "snake_case" → "Snake Case" should
 * .replace(/_/g,' ') first. One source for the entrepreneur pages'
 * industry/listing labels (was cap2/cap inline copies).
 */
export function titleCase(s) {
    return String(s || '').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Single source for the Oil & Gas building type definitions (Phase 2,
 * 20270443). Cost is the unscaled base ($) the SQL helper applies the
 * nation construction multiplier to; ticks is build-time at median
 * nation; per-tier production / capacity / demand math drives the
 * tick processor.
 *
 * Server-authoritative copies live in:
 *   corp_building_cost_profile       — cost
 *   process_oil_and_gas              — output/capacity per tier
 *   oil_gas_crude_spot_price()       — $20k crude spot
 *   oil_gas_refined_spot_price()     — $100k refined spot
 *   oil_gas_retail_price()           — $130k gas station retail
 * Keep these mirrors in sync.
 */
export const OIL_GAS_DEFS = {
    pump_jack:        { cost: 8000000,   ticks: 24, output:    3 },  // crude / tick
    refinery_small:   { cost: 80000000,  ticks: 24, capacity:  4 },  // crude → refined / tick
    refinery_regular: { cost: 170000000, ticks: 27, capacity: 10 },
    refinery_large:   { cost: 300000000, ticks: 30, capacity: 20 },
    gas_station:      { cost: 6000000,   ticks: 24 },                // consumes (SoL+inf)/20 refined / tick
};

export const OIL_GAS_PRICES = {
    crudeSpot:   20000,
    refinedSpot: 100000,
    retail:      130000,
};

/**
 * Canonical title-case display names for entrepreneur corp industries.
 * Single source — every site that shows an industry name reads from
 * this map via industryLabel (uppercase pill form) or
 * industryTitleLabel (title-case form for dashboards / dropdowns).
 * Adding a new industry: add it here and both formatters pick it up.
 */
const INDUSTRY_LABELS = {
    construction:           'Construction',
    banking:                'Banking',
    shipping:               'Shipping',
    real_estate:            'Real Estate',
    airline:                'Airline',
    aviation_manufacturing: 'Aviation Manufacturing',
    oil_and_gas:            'Oil & Gas',
};

/**
 * Display label for an entrepreneur corp industry / sector enum value.
 * Returns the canonical name in uppercase ('OIL & GAS', 'REAL ESTATE').
 * NULL / empty → em-dash. Unknown industries fall back to a generic
 * underscore→space transform so new industries aren't completely broken
 * before they get added to INDUSTRY_LABELS.
 */
export function industryLabel(s) {
    if (!s) return '—';
    const name = INDUSTRY_LABELS[s];
    return name ? name.toUpperCase() : String(s).toUpperCase().replace(/_/g, ' ');
}

/**
 * Title-case display label for an industry — used by the dashboard
 * INDUSTRY field and the buyer-corp dropdowns where uppercase looks
 * wrong. Same source map as industryLabel, so the two forms can't
 * drift apart.
 */
export function industryTitleLabel(s) {
    if (!s) return '—';
    return INDUSTRY_LABELS[s] || titleCase(s);
}

/**
 * Display label for a corp_buildings.building_type enum value
 * ('regional_hq' → 'Regional HQ', etc). Single source — both
 * the per-corp Active Projects renderer and the Markets Properties /
 * My Offers grids read from here. NULL / unknown values fall back to
 * the generic 'Building' so unmapped future types still render.
 */
/**
 * Single source for the Apartment Complex tier definitions. Every fact
 * that varies per apartment type lives here: construction cost base,
 * build duration ticks, Pattern-B cost sensitivity (20270437), and the
 * per-tick base rent (20270438). Both the entrepreneur-corp request
 * modal preview (cost/ticks/sensitivity) and computeApartmentRent
 * below (baseRent) read from this map — single JS-side source.
 *
 * Server-authoritative copies of these numbers live in:
 *   corp_building_cost_profile  — cost + sensitivity (20270437)
 *   process_apartment_rents      — baseRent (20270438)
 * Keep them in sync.
 */
export const APARTMENT_DEFS = {
    apartment_basic:  { cost: 12000000, ticks: 24, sensitivity: 1.0, baseRent: 40000,  occMult: 1.00 },
    apartment_modest: { cost: 25000000, ticks: 27, sensitivity: 1.3, baseRent: 90000,  occMult: 0.85 },
    apartment_luxury: { cost: 60000000, ticks: 30, sensitivity: 1.7, baseRent: 250000, occMult: 0.65 },
};

/**
 * Apartment occupancy as a function of nation stability AND tier.
 * Single source — computeApartmentRent below calls it for the live
 * rent calc; the occupancy sparkline in entrepreneur-corp.html calls
 * it per-history-tick via nations_history.politician_stability.
 *
 * Tier multiplier (APARTMENT_DEFS.occMult, 20270617): luxury units
 * serve a smaller renter pool than basic. So at any nation stability,
 * basic occupancy >= modest >= luxury. Multiply BEFORE clamp so the
 * 0.4 floor still applies — at very-bad stability all tiers floor
 * out together (no negative-occupancy weirdness).
 *
 *   occupancy = clamp(0.4, 1.0, stability * occMult / 100)
 */
export function apartmentOccupancy(buildingType, stab) {
    const mult = APARTMENT_DEFS[buildingType]?.occMult ?? 1.0;
    const s = Number(stab ?? 50);
    return Math.max(0.4, Math.min(1.0, s * mult / 100));
}

/**
 * Per-tick rent breakdown for an Apartment Complex. Mirrors the
 * process_apartment_rents() server RPC (20270438) — keep the math
 * in lockstep with that function.
 *
 *   gross       = base × (standard_of_living + infrastructure) / 100
 *   occupancy   = apartmentOccupancy(buildingType, nation.politician_stability)
 *   maintenance = base × (100 - infrastructure) / 200
 *   net         = round(gross × occupancy - maintenance)
 *
 * Returns { gross, maintenance, occupancy, net, basePerTick } as
 * integers (dollars per tick) and occupancy as a 0-1 fraction.
 * Unknown / non-apartment building types return null so callers can
 * skip the row cleanly.
 */
export function computeApartmentRent(buildingType, nation) {
    const def = APARTMENT_DEFS[buildingType];
    if (!def) return null;
    const base = def.baseRent;
    const sol  = Number(nation?.standard_of_living ?? 50);
    const inf  = Number(nation?.infrastructure    ?? 50);
    const gross       = base * (sol + inf) / 100;
    const occupancy   = apartmentOccupancy(buildingType, nation?.politician_stability);
    const maintenance = base * (100 - inf) / 200;
    const net         = Math.round(gross * occupancy - maintenance);
    return {
        basePerTick: base,
        gross:       Math.round(gross),
        maintenance: Math.round(maintenance),
        occupancy,
        net,
    };
}

export function buildingTypeLabel(t) {
    switch (t) {
        case 'regional_hq':        return 'Regional HQ';
        case 'construction_yard':  return 'Construction Yard';
        case 'port':               return 'Port';
        case 'banking_office':     return 'Banking Office';
        case 'real_estate_office': return 'Real Estate Office';
        case 'light_assembly_plant':  return 'Light Assembly Plant';
        case 'engine_assembly_plant': return 'Engine Assembly Plant';
        case 'apartment_basic':    return 'Basic Apartments';
        case 'apartment_modest':   return 'Modest Apartments';
        case 'apartment_luxury':   return 'Luxury Apartments';
        case 'pump_jack':          return 'Pump Jack';
        case 'refinery_small':     return 'Small Refinery';
        case 'refinery_regular':   return 'Regular Refinery';
        case 'refinery_large':     return 'Large Refinery';
        case 'gas_station':        return 'Gas Station';
        default:                   return t ? String(t) : 'Building';
    }
}

// ===== POLITICIAN OFFICES =====
// Single source of truth for factions.politician_office display labels.
// Consumers: politician-career.html (Tier-1 rung descriptions, Stand-
// for-Election lockout hint, affiliation subtitle), politician-home.html
// (hero affiliation). Extend when new office values land on the CHECK
// constraint (see migration 20270418).
export const OFFICE_TITLES = {
    community_organizer:    'Community Organizer',
    city_council_member:    'City Council Member',
    city_council_president: 'City Council President',
    member_of_parliament:   'Member of Parliament',
    senior_mp:              'Senior MP',
};
export function officeTitle(office) { return OFFICE_TITLES[office] || ''; }

// MP-tier predicate — the two politician_office values that count as
// "sitting Member of Parliament" for legislative gates (Propose New
// Law, Committee admission, etc.). Single source: every "is this
// caller an MP?" check across the politician pages reads from here
// so that adding a third MP-tier office is a one-line change.
export const MP_OFFICES = new Set(['member_of_parliament', 'senior_mp']);
export function isMpOffice(office) { return MP_OFFICES.has(office); }

// Committee Chair bid thresholds — single source for politician_bid_
// for_chair (migration 20270584). The RPC is the authority; these
// constants exist so the career rung pre-check and the nation-page
// Bid-for-Chair button can disable themselves with matching reason
// labels instead of letting every player learn the gates by hitting
// the server. Change these here if you bump the SQL tunables.
export const CHAIR_BID_THRESHOLDS = {
    SKILL:                   8,
    INFLUENCE:              15,
    SEATED_TICKS_REQUIRED:   4,
    COOLDOWN_TICKS:          8,
};

// Civil-service ministry slug → display name. Source of truth for the
// politician_ministry column (factions; CHECK constraint enumerates the
// four slugs in migration 20270471). Read by politician-career.html's
// Tier 1 Civil Servant rung + header, and politician-home.html's hero
// affiliation. Extend when new ministries land on the CHECK constraint.
export const MINISTRY_NAMES = {
    defense:              'Defense',
    foreign_affairs:      'Foreign Affairs & Trade',
    economic_development: 'Economic Development',
    interior:             'Interior',
};
export function ministryName(slug) { return MINISTRY_NAMES[slug] || ''; }

// One-paragraph descriptive blurb per ministry — used as the CTA
// subtitle on politician-nation.html and as the Overview-card body
// on politician-ministry.html. Single source so an edit lands on
// both surfaces at once.
export const MINISTRY_BLURBS = {
    defense:
        `Commands the armed forces, oversees national security strategy and military procurement, sets defense doctrine, and represents the Republic in security alliances and matters of war.`,
    foreign_affairs:
        `Conducts the Republic's foreign relations, negotiates treaties and trade agreements, manages embassies and consulates, and represents the nation before international bodies.`,
    economic_development:
        `Plans national economic policy, manages industrial concessions, oversees infrastructure investment and public works, and represents the Republic in international trade and finance forums.`,
    interior:
        `Administers domestic affairs, supervises sub-national government, oversees policing and the civil registry, manages internal security, and coordinates disaster response.`,
};

// Single-line career standing for politician hero cards (the H1 on
// politician-career, the hero-career pill on politician-home). Same
// precedence everywhere it's read: a held state role IS your standing,
// so an elected office beats a civil-service post which beats card-
// carrying party membership which beats nothing. Used to live inline
// on each page with subtly different fallback chains — politician-home
// didn't even fall through to ministry, so a civil-servant card-
// carrier would render as just the party name there. SoT here so both
// surfaces stay locked.
export function careerLabel(politician, party) {
    const office       = politician?.politician_office  || null;
    const ministrySlug = politician?.politician_ministry || null;
    const officeText   = office ? officeTitle(office) : '';
    const ministryText = ministrySlug
        ? `Civil Servant of ${ministryName(ministrySlug) || ministrySlug}`
        : '';
    return officeText || ministryText || party?.faction_name || 'Independent';
}

// ===== GAME DATE =====

export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Convert a game tick number to a human-readable date string.
 * Tick 0 = January, 2000.
 */
export function tickToDate(tick) {
    if (tick == null) return '—';
    return `${MONTHS[tick % 12]}, ${tickToYear(tick)}`;
}

/**
 * Year portion of tickToDate's "Month, Year" — same anchor (2000) and same
 * 12-ticks-per-year math. Use this when a surface only needs the year and
 * would otherwise re-derive it (and risk drifting from tickToDate).
 */
export function tickToYear(tick) {
    return 2000 + Math.floor((Number(tick) || 0) / 12);
}

/**
 * Term-end tick by office — single source for "when does this seat
 * reseat?" Legislature offices (member_of_parliament, senior_mp) track
 * the nation's general-election cycle; local offices (community_organizer,
 * city_council_member) run a flat 12-tick term from when they won.
 * Returns null when no term applies (no office, or office without a
 * scheduled end).
 *
 *   state = { office, nextGeneralElectionTick, officeWonAtTick }
 */
export function termEndTickFor(state) {
    const office = state && state.office;
    if (isMpOffice(office)) {
        return Number(state.nextGeneralElectionTick) || null;
    }
    if (office === 'community_organizer' || office === 'city_council_member' || office === 'city_council_president') {
        // Local-office term length by office. CO + CCM run a flat
        // 12-tick term; CC President runs 36 ticks (3 years, per
        // 20270654). The server-side expiry RPC
        // (politician_resolve_expired_terms) uses the same per-office
        // CASE — keep the two in sync if a term length ever changes.
        //
        // Number.isFinite guard rejects NULL / undefined won-at-tick
        // (which would otherwise coerce to NaN → || 0 → "+ 12 = tick
        // 12 → Jan 2001"). An orphaned local role with no anchor
        // returns null so the caller hides the tenure pill until the
        // server-side cleanup (20270629) lands.
        const wonAt = Number(state.officeWonAtTick);
        if (!Number.isFinite(wonAt)) return null;
        return wonAt + (office === 'city_council_president' ? 36 : 12);
    }
    return null;
}

// ===== FORMATTING =====

/**
 * Format large currency values with human-readable suffixes.
 *   88_000_000_000 → "$88.0 Billion"
 */
export function formatCurrencyShort(val) {
    if (val == null) return 'N/A';
    val = Number(val);
    const sign = val < 0 ? '-' : '';
    const abs = Math.abs(val);
    if (abs >= 1e12) return sign + '$' + (abs / 1e12).toFixed(1) + ' Trillion';
    if (abs >= 1e9)  return sign + '$' + (abs / 1e9).toFixed(1) + ' Billion';
    if (abs >= 1e6)  return sign + '$' + (abs / 1e6).toFixed(1) + ' Million';
    return sign + '$' + abs.toLocaleString();
}

/**
 * Compact money format used across the corp pages — "$1.50B" / "$23.4M"
 * / "$120.0k" / "$850". Two-decimal M/B output, one-decimal k, raw
 * localeString under a thousand. Originally hfFmtBig() inside the
 * Hire/Fire prelude on corp-operations.html; promoted here when Expansion
 * + Actions got split into their own pages and the helper turned out to
 * have callers outside the HF subsystem (bid assembly, fleet actions,
 * insurance, ship market, etc.).
 */
export function hfFmtBig(n) {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e9) return sign + '$' + (abs / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(2) + 'M';
    if (abs >= 1e3) return sign + '$' + (abs / 1e3).toFixed(1) + 'k';
    return sign + '$' + abs.toLocaleString();
}

/**
 * Magnitude formatter for counts/populations — same B / M / k scaling as
 * hfFmtBig but without the currency prefix. e.g. 23_500_000 → "23.50M".
 */
export function fmtBig(n) {
    const abs = Math.abs(Number(n) || 0);
    if (abs >= 1e9) return (abs / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return (abs / 1e6).toFixed(2) + 'M';
    if (abs >= 1e3) return (abs / 1e3).toFixed(1) + 'k';
    return abs.toLocaleString();
}

/**
 * Whole-million money format used by the entrepreneur corp pages —
 * raw dollars → "$5M" / "$7.5M" (one decimal only when non-integer).
 * Distinct from hfFmtBig (two-decimal M/B) and formatCurrencyShort
 * (spelled-out "Million"); its own source of truth, read by both
 * entrepreneur-corp.html and entrepreneur-corporations.html.
 */
export function fmtM(raw) {
    const m = (Number(raw) || 0) / 1e6;
    return '$' + (Number.isInteger(m) ? m : m.toFixed(1)) + 'M';
}

/**
 * Exact, thousands-grouped USD with no suffix — "$50,000" /
 * "$1,250,000". For share prices / valuations / treasuries where the
 * compact formatters lose precision (hfFmtBig "$50.0k", fmtM "$0.1M").
 * One source, read by the entrepreneur stock UI. Rounds to whole
 * dollars (display only; the authoritative numeric stays in the DB).
 */
export function fmtUsd(n) {
    return '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
}

/**
 * Compact money formatter that drops trailing .0 — "$441B" not
 * "$441.00B", "$25k" not "$25.5k". Used by the politician-side
 * nation-card stat strip + National Characteristics body where the
 * tighter visual reads better than hfFmtBig's two-decimal precision.
 * Same B/M/k scaling, same negative-sign handling.
 */
export function fmtMoney(n) {
    const abs = Math.abs(Number(n) || 0);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e9) return sign + '$' + (abs / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (abs >= 1e3) return sign + '$' + Math.round(abs / 1e3) + 'k';
    return sign + '$' + Math.round(abs);
}

/**
 * Display string for an entrepreneur corp valuation — the single
 * source for HOW valuation is rendered, paired with
 * computeEntrepreneurValuation (the single source for the NUMBER).
 * Compact "$20M" form (never raw "$20,000,000"); null → "—". Read by
 * the dashboard, corporations list, markets directory and corp page so
 * the figure looks identical everywhere.
 */
export function fmtValuation(amount) {
    return amount == null ? '—' : fmtM(amount);
}

/**
 * Ownership percentage a holding represents, rounded to a whole
 * percent. null when undeterminable (no shares outstanding). One
 * source for the entrepreneur stock UI — read by the corp page and
 * the dashboard holdings; never inline the divide.
 */
export function pctOwned(shares, sharesOutstanding) {
    const o = Number(sharesOutstanding) || 0;
    return o > 0 ? Math.round((Number(shares) || 0) / o * 100) : null;
}

/**
 * Viewer's ownership % of an entrepreneur corp — one source for the
 * stake math read by the corporations list, markets directory, and any
 * future surface that needs "what fraction of this corp does the viewer
 * own?". Whenever the corp has a share model (shares_outstanding != null
 * — public corps always, private corps after a director-investment is
 * accepted per 20270212), use pctOwned over the viewer's shares. Only
 * pre-investment private corps fall through to "owner=100, else=0",
 * since they have no shareholdings rows to read.
 */
export function viewerStakePct(corp, viewerFactionId, viewerShares) {
    if (!corp) return 0;
    if (corp.shares_outstanding != null) {
        return pctOwned(viewerShares || 0, corp.shares_outstanding) ?? 0;
    }
    return corp.owner_faction_id === viewerFactionId ? 100 : 0;
}

/**
 * Human display name for a faction that owns/leads something —
 * "First Last", else faction_name, else "—". One source for the
 * entrepreneur owner/CEO label (corp page + markets directory);
 * never inline the leader-name ternary.
 */
export function ownerDisplayName(faction) {
    const f = faction || {};
    return [f.leader_first_name, f.leader_last_name].filter(Boolean).join(' ').trim()
        || f.faction_name || '—';
}

/**
 * Format a budget value with compact suffixes ($1.2T, $500M, $30K).
 */
export function fmtBudgetCurrency(val) {
    if (val == null) return '$0';
    val = Number(val);
    const sign = val < 0 ? '-' : '';
    const abs = Math.abs(val);
    if (abs >= 1e12) return sign + '$' + (abs / 1e12).toFixed(1) + 'T';
    if (abs >= 1e9)  return sign + '$' + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6)  return sign + '$' + (abs / 1e6).toFixed(0) + 'M';
    if (abs >= 1e3)  return sign + '$' + (abs / 1e3).toFixed(0) + 'K';
    return sign + '$' + Math.round(abs);
}

// ===== CSS HELPERS =====

/**
 * Return a CSS class name for an ideology tag (e.g. "SOCIALIST" → "ideo-socialist").
 */
export function getIdeologyClass(tag) {
    return 'ideo-' + (tag || '').toLowerCase();
}

// ===== TIME =====

/**
 * Relative time formatter ("Just now", "5m ago", "3h ago", or a date).
 */
export function formatTime(ts) {
    const d = new Date(ts);
    const diff = Date.now() - d;
    if (diff < 60000)   return 'Just now';
    if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
}


// ===== FACTION ELIGIBILITY =====

/**
 * True when a faction row is eligible to be counted as a political party slot.
 * Business rule: eligibility is role-based (faction_type === 'party').
 */
export function isEligiblePartyFaction(faction) {
    return !!faction && faction.faction_type === 'party';
}

/**
 * Count eligible parties, optionally scoped to one nation.
 */
export function countEligibleParties(factions, nationId = null) {
    if (!Array.isArray(factions) || factions.length === 0) return 0;
    return factions.filter(f =>
        isEligiblePartyFaction(f) &&
        (nationId == null || f.nation_id === nationId)
    ).length;
}
