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

// ─── HTML sanitization for the rich-text body ─────────────────────
// Whitelisted tags + attributes. Anything else gets unwrapped (the
// element disappears but its text content survives). Used twice:
// once at submit time before sending to create_forum_thread, again
// at render time before innerHTML'ing the stored body. The render
// pass is the security boundary — submit-side sanitization is just
// belt-and-braces against a hostile client smuggling bad HTML.
const ALLOWED_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U',
  'P', 'BR', 'DIV', 'SPAN',
  'H1', 'H2', 'H3',
  'UL', 'OL', 'LI',
  'BLOCKQUOTE',
  'A', 'IMG',
]);
const ALLOWED_ATTRS = {
  A:   ['href'],
  IMG: ['src', 'alt'],
};
const SAFE_URL_RE = /^https?:\/\//i;

export function sanitizeHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = String(html ?? '');
  walkSanitize(tmp);
  return tmp.innerHTML;
}

function walkSanitize(node) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        // Unwrap — move children up, drop the element itself.
        child.replaceWith(...child.childNodes);
        continue;
      }
      const allowed = ALLOWED_ATTRS[child.tagName] || [];
      for (const attr of [...child.attributes]) {
        if (!allowed.includes(attr.name)) {
          child.removeAttribute(attr.name);
        }
      }
      // URL allowlist on href / src — drop the attribute entirely
      // if it doesn't start with http:// or https://. Strips javascript:,
      // data:, mailto:, etc.
      if (child.tagName === 'A') {
        const href = child.getAttribute('href') || '';
        if (!SAFE_URL_RE.test(href)) child.removeAttribute('href');
      }
      if (child.tagName === 'IMG') {
        const src = child.getAttribute('src') || '';
        if (!SAFE_URL_RE.test(src)) child.removeAttribute('src');
      }
      walkSanitize(child);
    } else if (child.nodeType !== Node.TEXT_NODE) {
      // Comments, processing instructions, etc. — strip.
      child.remove();
    }
  }
}

// Word count for the toolbar's "N words · ~M min read" pill. Reads
// from the visible text content of a rich-text node so HTML markup
// doesn't inflate the count.
export function countWords(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

// Both the category-detail and compose pages key off ?slug= in the URL.
// Returns '' when the param is missing so callers can branch on falsy.
export function getSlugFromUrl() {
  return new URLSearchParams(window.location.search).get('slug') || '';
}

// Renders a small nation chip (flag + name) for use beside thread
// titles on the category list and inside the thread header. Returns
// HTML. nationName is null/empty for International threads — caller
// gets a flag-less "International" chip in that case so the field is
// never blank. flagUrl is optional; absent or falsy hides the flag.
//
// The chip's container class comes from the consumer page so each
// surface can tune its own padding / typography — this helper is
// markup-only, no CSS.
const ESC_LOOKUP_LOCAL = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
const escLocal = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC_LOOKUP_LOCAL[c]);
export function renderNationChip(nationName, flagUrl, { className = 'nation-chip' } = {}) {
  const label = nationName ? String(nationName) : 'International';
  const flag  = flagUrl
    ? `<img class="${escLocal(className)}-flag" src="${escLocal(flagUrl)}" alt="" loading="lazy">`
    : '';
  return `<span class="${escLocal(className)}">${flag}<span class="${escLocal(className)}-name">${escLocal(label)}</span></span>`;
}

// Inserts an <img src=url alt=altText> at the current cursor position
// inside a contenteditable element, or appends if the selection isn't
// inside that element. Used by both compose (opening post) and
// thread-detail (reply) editors.
export function insertImageAtCursor(bodyEl, url, altText) {
  bodyEl.focus();
  const img = document.createElement('img');
  img.src = url;
  img.alt = altText || '';
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && bodyEl.contains(sel.anchorNode)) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(img);
    range.setStartAfter(img);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    bodyEl.appendChild(img);
  }
}
