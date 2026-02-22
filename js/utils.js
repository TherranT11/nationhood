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
