/**
 * utils.js — Pure utility functions shared across Nationhood pages.
 *
 * No side-effects on import. Safe to use from any page (game pages,
 * admin pages, pre-auth pages).
 */

// ===== APP VERSION =====

// Single source of truth for the build label shown in every faction navbar.
export const APP_VERSION = 'Alpha 2.7.1';

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
 * Display label for an entrepreneur corp industry / sector enum value.
 * Lowercase snake_case ('real_estate') → uppercase with spaces
 * ('REAL ESTATE'). NULL / empty → em-dash. Single source for the
 * transformation; all dashboard sites that show an industry pill or
 * subtitle should call this.
 */
export function industryLabel(s) {
    if (!s) return '—';
    return String(s).toUpperCase().replace(/_/g, ' ');
}

/**
 * Display label for a corp_buildings.building_type enum value
 * ('regional_hq' → 'Regional HQ', etc). Single source — both
 * the per-corp Active Projects renderer and the Markets Properties /
 * My Offers grids read from here. NULL / unknown values fall back to
 * the generic 'Building' so unmapped future types still render.
 */
export function buildingTypeLabel(t) {
    switch (t) {
        case 'regional_hq':        return 'Regional HQ';
        case 'construction_yard':  return 'Construction Yard';
        case 'port':               return 'Port';
        case 'banking_office':     return 'Banking Office';
        case 'real_estate_office': return 'Real Estate Office';
        case 'light_assembly_plant':  return 'Light Assembly Plant';
        case 'engine_assembly_plant': return 'Engine Assembly Plant';
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
    community_organizer:  'Community Organizer',
    member_of_parliament: 'Member of Parliament',
};
export function officeTitle(office) { return OFFICE_TITLES[office] || ''; }

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
    if (office === 'member_of_parliament' || office === 'senior_mp') {
        return Number(state.nextGeneralElectionTick) || null;
    }
    if (office === 'community_organizer' || office === 'city_council_member') {
        return (Number(state.officeWonAtTick) || 0) + 12;
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
 * own?". Private corps aren't tradeable, so only the founder holds a
 * stake (100%); public corps use pctOwned over the viewer's shares.
 */
export function viewerStakePct(corp, viewerFactionId, viewerShares) {
    if (!corp) return 0;
    if (corp.listing !== 'public') {
        return corp.owner_faction_id === viewerFactionId ? 100 : 0;
    }
    return pctOwned(viewerShares || 0, corp.shares_outstanding) ?? 0;
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
