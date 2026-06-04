// Shared utilities for the politician-forum and politician-forum-category
// surfaces. Single source of truth for HTML escaping, integer formatting,
// relative-time strings, and the zone definitions used by both pages.
//
// Adding a fourth forum page later? Import from here instead of copying
// — that's the rule the 20270596 audit found in violation.

const ESCAPE_LOOKUP = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };

export function escHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ESCAPE_LOOKUP[c]);
}

export function fmtInt(n) {
  return Number(n || 0).toLocaleString();
}

export function formatRelative(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const m = Math.round(diff / 60000);
  if (m < 1)    return 'just now';
  if (m < 60)   return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24)   return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.round(h / 24);
  if (d < 30)   return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString();
}

// Zone shells are structural — the three top-level Forum surfaces
// (World / Players / Game). Categories within a zone come from the DB
// (forum_categories rows); the zone *itself* has no DB representation
// because there are only ever three of them. Both pages read this:
// index renders the eyebrow + title + glyph + desc per zone; the
// category-detail header reads eyebrow + name to form its breadcrumb.
export const ZONE_META = {
  world: {
    eyebrow: 'Zone I',
    name:    'The World',
    title:   'The <em>World</em>',     // index render uses italics inside
    glyph:   '&#127760;',
    desc:    'In-character narrative · press, diplomacy, character lives, and the ongoing record of the game',
  },
  players: {
    eyebrow: 'Zone II',
    name:    'The Players',
    title:   'The <em>Players</em>',
    glyph:   '&#9737;',
    desc:    'Out-of-character · community discussion, help, feedback, and conversation among players themselves',
  },
  game: {
    eyebrow: 'Zone III',
    name:    'The Game',
    title:   'The <em>Game</em>',
    glyph:   '&#128203;',
    desc:    'Administration · announcements from the moderators, rules, schedule, recruitment',
  },
};

export const ZONE_ORDER = ['world', 'players', 'game'];
