// wiki.js — Nationpedia article rendering. ONE source for turning a stored article into HTML,
// shared by the player page (/play/wiki) and the adminsetup editor's live preview so the two can
// never drift. Styling uses the shared app tokens (--ink/--surface/--soft/…), so it follows the
// light/dark theme like every other in-game page.
//
// Authoring uses a light markup in the text fields (lead, section bodies, hatnote, infobox values):
//   [[Title]] or [[Title|label]]  → cross-link to another article (live if it exists, else muted)
//   **bold**                      → bold
//   [1]                           → a reference marker (superscript)
//   blank line                    → paragraph break
// The parser below is the ONE place that markup becomes HTML — the editor preview and the reader
// both call it, so what an admin sees while writing is exactly what players get.
//
//   definition = {
//     hat:  'markup',                               -- optional disambiguation line
//     box:  { heading:'', image:{ url:'' }|null, cap:'', rows:[ ['key','value markup'] ... ] },
//     lead: 'markup',
//     sections: [ { lvl:2|3, h:'heading', b:'markup body' } ],
//     refs: [ 'citation' ... ],
//     see:  [ 'Other Article Title' ... ],
//     cats: [ 'Category' ... ]
//   }

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// Inline markup → HTML. Plain text is escaped; links/bold/refs become HTML. `known` (a Set of
// lower-cased titles that exist) decides whether a [[link]] is live or muted (like a red link).
function inlineMd(text, known) {
  var src = String(text == null ? '' : text), out = '', last = 0, m;
  var re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*|\[(\d+)\]/g;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index));
    if (m[1] != null) {                      // [[Target]] or [[Target|Label]]
      var target = m[1].trim(), label = (m[2] != null ? m[2] : m[1]).trim();
      var live = known && known.has(target.toLowerCase());
      out += '<span class="wk-link' + (live ? '' : ' wk-link--dead') + '" data-link="' + esc(target) + '">' + esc(label) + '</span>';
    } else if (m[3] != null) {               // **bold**
      out += '<strong>' + esc(m[3]) + '</strong>';
    } else if (m[4] != null) {               // [n] reference marker
      out += '<sup class="wk-ref">[' + m[4] + ']</sup>';
    }
    last = re.lastIndex;
  }
  out += esc(src.slice(last));
  return out;
}

// Markup text → one or more <p> (blank line separates paragraphs; a single newline is a space).
function paras(text, known) {
  return String(text || '').split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean)
    .map(function (p) { return '<p>' + inlineMd(p.replace(/\n/g, ' '), known) + '</p>'; }).join('');
}

// A bare cross-link to an article by title (used for See also).
function linkSpan(title, known) {
  var live = known && known.has(String(title).toLowerCase());
  return '<span class="wk-link' + (live ? '' : ' wk-link--dead') + '" data-link="' + esc(title) + '">' + esc(title) + '</span>';
}

// The full article body HTML. `a` is a flat article ({ title, kind, hat, box, lead, sections,
// refs, see, cats }); `known` is a Set of lower-cased titles that exist (for link liveness). The
// caller wires .wk-link / [data-sec] clicks (the reader navigates; the editor preview leaves them
// inert). The infobox floats right inside .wk-body so the prose wraps around it.
export function articleHTML(a, known) {
  var box = a.box || {};
  var rows = (box.rows || []).filter(function (r) { return r && (r[0] || r[1]); })
    .map(function (r) { return '<div class="wk-ib-row"><span class="wk-ib-k">' + esc(r[0]) + '</span><span class="wk-ib-v">' + inlineMd(r[1] || '', known) + '</span></div>'; }).join('');
  var ibImg = (box.image && box.image.url)
    ? '<div class="wk-ib-img"><img class="wk-ib-pic" src="' + esc(box.image.url) + '" alt="">' + (box.cap ? '<div class="wk-ib-cap">' + esc(box.cap) + '</div>' : '') + '</div>'
    : '';
  var infobox = (rows || ibImg)
    ? '<aside class="wk-infobox"><div class="wk-ib-title">' + esc(box.heading || a.title) + '</div>' + ibImg + rows + '</aside>'
    : '';

  // Sections + a numbered Table of Contents (H2 = "1", H3 = "1.1").
  var h2 = 0, h3 = 0, toc = '', body = '';
  (a.sections || []).forEach(function (s, i) {
    if (!s || !s.h) return;
    var lvl = (s.lvl === 3 ? 3 : 2), num;
    if (lvl === 2) { h2++; h3 = 0; num = '' + h2; } else { h3++; num = h2 + '.' + h3; }
    toc += '<li class="' + (lvl === 3 ? 'wk-toc-sub' : '') + '"><span class="wk-toc-n">' + num + '</span><a data-sec="wk-sec-' + i + '">' + esc(s.h) + '</a></li>';
    body += '<h' + lvl + ' class="wk-sec' + (lvl === 3 ? ' wk-sec3' : '') + '" id="wk-sec-' + i + '">' + esc(s.h) + '</h' + lvl + '>' + paras(s.b, known);
  });
  var tocBox = toc ? '<div class="wk-toc"><div class="wk-toch">Contents</div><ol>' + toc + '</ol></div>' : '';

  var see = (a.see || []).filter(Boolean);
  var seeHtml = see.length ? '<h2 class="wk-sec">See also</h2><ul class="wk-bullets">' + see.map(function (t) { return '<li>' + linkSpan(t, known) + '</li>'; }).join('') + '</ul>' : '';
  var refs = (a.refs || []).filter(Boolean);
  var refsHtml = refs.length ? '<h2 class="wk-sec">References</h2><ol class="wk-refs-list">' + refs.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ol>' : '';
  var cats = (a.cats || []).filter(Boolean);
  var catsHtml = cats.length ? '<div class="wk-cats"><span class="wk-cl">Categories:</span>' + cats.map(function (c) { return '<span class="wk-catchip">' + esc(c) + '</span>'; }).join('') + '</div>' : '';

  return '<h1 class="wk-title">' + esc(a.title || 'Untitled') + '</h1>'
    + '<div class="wk-fromline">From Nationpedia, the free encyclopedia' + (a.kind ? ' &middot; ' + esc(a.kind) : '') + '</div>'
    + (a.hat ? '<div class="wk-hatnote">' + inlineMd(a.hat, known) + '</div>' : '')
    + '<div class="wk-body">' + infobox + paras(a.lead, known) + tocBox + body + seeHtml + refsHtml + catsHtml + '</div>';
}

// Merge a wiki_articles row into the flat article articleHTML expects (title/kind from the
// columns, the rest from the definition). ONE place that mapping lives.
export function normalizeArticle(row) {
  var d = (row && row.definition) || {};
  return {
    title: row.title, kind: row.kind,
    hat: d.hat || '', box: d.box || {}, lead: d.lead || '',
    sections: d.sections || [], refs: d.refs || [], see: d.see || [], cats: d.cats || []
  };
}

// First paragraph of a markup field, rendered inline (for the landing's featured preview). Same
// markup grammar as the article body — one source.
export function leadHTML(markup, known) {
  var first = String(markup || '').split(/\n{2,}/).map(function (s) { return s.trim(); }).filter(Boolean)[0] || '';
  return inlineMd(first.replace(/\n/g, ' '), known);
}
// Strip markup to plain text (for one-line excerpts in the recently-edited list).
export function plainText(markup) {
  return String(markup || '')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (_, t, l) { return (l != null ? l : t).trim(); })
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[(\d+)\]/g, '')
    .replace(/\s+/g, ' ').trim();
}

const WIKI_CSS = `
.wk-article{max-width:920px;margin:0 auto}
.wk-title{font-weight:900;font-size:clamp(26px,4vw,34px);letter-spacing:-.03em;padding-bottom:7px;border-bottom:1px solid var(--line2);line-height:1.15}
.wk-fromline{font-family:'Space Mono',monospace;font-size:10.5px;color:var(--soft);font-style:italic;margin:6px 0}
.wk-hatnote{font-size:13px;color:var(--muted);font-style:italic;border-left:3px solid var(--line2);padding:2px 0 2px 12px;margin:14px 0}

.wk-body{font-size:15px;line-height:1.7;color:var(--ink)}
.wk-body p{margin-bottom:13px}
.wk-body > p:first-of-type{font-size:16px}
.wk-body strong{font-weight:700}

.wk-infobox{float:right;width:290px;margin:4px 0 16px 24px;border:1px solid var(--line2);border-radius:10px;overflow:hidden;background:var(--field);font-size:12.5px}
.wk-ib-title{background:var(--ink);color:var(--surface);text-align:center;font-weight:800;font-size:14px;padding:11px 12px;letter-spacing:-.01em}
.wk-ib-img{padding:14px;display:flex;flex-direction:column;align-items:center;gap:7px;border-bottom:1px solid var(--line)}
.wk-ib-pic{max-width:160px;max-height:170px;height:auto;border:1px solid var(--line2);border-radius:4px}
.wk-ib-cap{font-family:'Space Mono',monospace;font-size:9.5px;color:var(--soft);text-align:center}
.wk-ib-row{display:flex;border-bottom:1px solid var(--line)}
.wk-ib-row:last-child{border-bottom:none}
.wk-ib-k{width:42%;padding:8px 11px;font-weight:700;background:var(--surface);color:var(--muted);font-size:11.5px}
.wk-ib-v{width:58%;padding:8px 11px}
@media(max-width:680px){.wk-infobox{float:none;width:100%;margin:0 0 18px}}

.wk-sec{font-weight:800;font-size:21px;letter-spacing:-.01em;border-bottom:1px solid var(--line);padding-bottom:5px;margin:24px 0 12px;scroll-margin-top:70px}
.wk-sec3{font-size:16.5px;border-bottom:none;margin:18px 0 9px}
.wk-link{color:var(--indigo);cursor:pointer;text-decoration:none}
.wk-link:hover{text-decoration:underline}
.wk-link--dead{color:var(--soft);cursor:default}
.wk-link--dead:hover{text-decoration:none}
sup.wk-ref{font-size:10px;color:var(--indigo);vertical-align:super;line-height:0}

.wk-toc{display:inline-block;min-width:220px;border:1px solid var(--line2);background:var(--field);border-radius:8px;padding:11px 16px 13px;margin:6px 0 18px}
.wk-toch{font-weight:800;font-size:12px;text-align:center;margin-bottom:7px}
.wk-toc ol{list-style:none;margin:0;padding:0;font-size:13px}
.wk-toc li{padding:2px 0}
.wk-toc li.wk-toc-sub{padding-left:18px;font-size:12.5px}
.wk-toc-n{font-family:'Space Mono',monospace;color:var(--soft);margin-right:8px;font-size:11px}
.wk-toc a{color:var(--indigo);cursor:pointer;text-decoration:none}.wk-toc a:hover{text-decoration:underline}

.wk-bullets{margin:0 0 14px 22px;font-size:15px}.wk-bullets li{margin:4px 0}
.wk-refs-list{margin:0 0 14px 22px;font-size:12.5px;color:var(--muted)}.wk-refs-list li{margin:5px 0}
.wk-cats{clear:both;margin-top:22px;padding-top:12px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.wk-cl{font-family:'Space Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--soft)}
.wk-catchip{font-size:12px;border:1px solid var(--line2);background:var(--surface);border-radius:6px;padding:4px 10px;color:var(--muted)}
.wk-empty{border:1px dashed var(--line2);border-radius:13px;padding:40px 20px;text-align:center;color:var(--soft);font-size:13px;font-style:italic}
`;

// Inject the article styles once per document (idempotent), the same way sidenav.js does.
export function injectWikiCSS() {
  if (document.getElementById('wk-style')) return;
  var s = document.createElement('style');
  s.id = 'wk-style';
  s.textContent = WIKI_CSS;
  document.head.appendChild(s);
}
