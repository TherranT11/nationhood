// Shared helpers for the Kingdoms surface (/kingdoms, /kingdom-home, …). ONE source so the pages of this
// game can't drift on how a house name — or an escaped string — is rendered.

// HTML-escape for interpolation. Stronger than util.js's text-only esc (this also escapes quotes), kept
// separate so the Kingdoms pages don't depend on the main game's util.
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// A house name shown consistently as "House X" (the review card and the home top bar).
export const houseLabel = name => 'House ' + String(name || '').replace(/^\s*House\s+/i, '').trim();
