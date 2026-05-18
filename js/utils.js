/**
 * utils.js — Pure utility functions shared across Nationhood pages.
 *
 * No side-effects on import. Safe to use from any page (game pages,
 * admin pages, pre-auth pages).
 */

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
 * Truncate a string to `max` characters, adding '...' if trimmed.
 */
export function truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '...' : str;
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
    const y = 2000 + Math.floor(tick / 12);
    return `${MONTHS[tick % 12]}, ${y}`;
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
