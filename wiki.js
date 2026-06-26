// wiki.js — Nationhopedia article rendering. ONE source for turning a stored article
// (wiki_articles row → { title, kind, hat, box, lead, sections, see, refs, cats }) into HTML,
// shared by the player page (/play/wiki) and the adminsetup editor's live preview so the two can
// never drift. Styling uses the shared app tokens (--ink/--surface/--soft/…), so it follows the
// light/dark theme like every other in-game page. Body html (hat, lead, sections, infobox values)
// is admin-authored and trusted — writes are is_admin-gated in the DB (schema/105).

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// A cross-link to another article by title. `known` (a Set of lower-cased titles) decides whether
// it renders live (clickable) or muted (the target doesn't exist yet) — same idea as a red link.
function wlink(title, label, known) {
  var live = known && known.has(String(title).toLowerCase());
  return '<span class="wk-link' + (live ? '' : ' wk-link--dead') + '" data-link="' + esc(title) + '">'
    + esc(label || title) + '</span>';
}

function imgHTML(im) {
  if (!im) return '';
  if (im.kind === 'image' && im.url) return '<img class="wk-ib-pic" src="' + esc(im.url) + '" alt="">';
  if (im.kind === 'circle') return '<div class="wk-ib-circle" style="background:' + esc(im.color || '#5546E8') + '">' + esc(im.text || '') + '</div>';
  // square is the default glyph treatment
  return '<div class="wk-ib-square" style="background:' + esc(im.color || '#5546E8') + '">' + esc(im.text || '') + '</div>';
}

function boxHTML(title, b) {
  if (!b) return '';
  var groups = (b.groups || []).map(function (gr) {
    var h = gr.h ? '<div class="wk-ib-grouph">' + esc(gr.h) + '</div>' : '';
    var rows = (gr.rows || []).map(function (r) {
      return '<div class="wk-ib-row"><div class="wk-ib-k">' + esc(r[0]) + '</div><div class="wk-ib-v">' + (r[1] == null ? '' : r[1]) + '</div></div>';
    }).join('');
    return h + rows;
  }).join('');
  var img = b.image ? '<div class="wk-ib-img">' + imgHTML(b.image) + (b.image.cap ? '<div class="wk-ib-cap">' + esc(b.image.cap) + '</div>' : '') + '</div>' : '';
  return '<aside class="wk-infobox">'
    + '<div class="wk-ib-title">' + esc(String(title).replace(/\n/g, ' ')) + '</div>'
    + (b.sub ? '<div class="wk-ib-sub">' + esc(b.sub) + '</div>' : '')
    + img + groups + '</aside>';
}

// The full article body HTML. `a` is a normalized article ({ title, kind, hat, box, lead,
// sections, see, refs, cats }); `known` is a Set of lower-cased titles that exist (for link
// liveness). The caller wires .wk-link / [data-sec] clicks (the player page navigates; the admin
// preview leaves them inert).
export function articleHTML(a, known) {
  var secs = (a.sections || []);
  var toc = secs.length
    ? '<div class="wk-toc"><div class="wk-toch">Contents</div><ol>'
      + secs.map(function (s, i) { return '<li><a data-sec="wk-sec-' + i + '">' + esc(s.h) + '</a></li>'; }).join('')
      + '</ol></div>'
    : '';
  var body = secs.map(function (s, i) {
    return '<h2 class="wk-sec" id="wk-sec-' + i + '">' + esc(s.h) + '</h2><div class="wk-bodytext">' + (s.html || '') + '</div>';
  }).join('');
  var see = (a.see && a.see.length)
    ? '<h2 class="wk-sec">See also</h2><ul class="wk-bullets">' + a.see.map(function (t) { return '<li>' + wlink(t, t, known) + '</li>'; }).join('') + '</ul>'
    : '';
  var refs = (a.refs && a.refs.length)
    ? '<h2 class="wk-sec">References</h2><div class="wk-refs"><ol>' + a.refs.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ol></div>'
    : '';
  var cats = (a.cats && a.cats.length)
    ? '<div class="wk-cats"><span class="wk-cl">Categories:</span>' + a.cats.map(function (c) { return '<span class="wk-catchip">' + esc(c) + '</span>'; }).join('') + '</div>'
    : '';
  return '<h1 class="wk-title">' + esc(String(a.title).replace(/\n/g, ' ')) + '</h1>'
    + '<div class="wk-fromline">From Nationhopedia, the free encyclopedia' + (a.kind ? ' &middot; ' + esc(a.kind) : '') + '</div>'
    + (a.hat ? '<div class="wk-hatnote">' + a.hat + '</div>' : '')
    + boxHTML(a.title, a.box)
    + '<div class="wk-lead">' + (a.lead || '') + '</div>'
    + toc + body + see + refs + cats;
}

const WIKI_CSS = `
.wk-masthead{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding:0 0 16px;margin-bottom:8px}
.wk-mbrand{display:flex;align-items:center;gap:11px}
.wk-globe{width:34px;height:34px;border-radius:50%;border:1px solid var(--line2);display:grid;place-items:center;color:var(--indigo);flex:none}
.wk-globe svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.4}
.wk-mbrand b{font-weight:900;font-size:17px;letter-spacing:-.02em}
.wk-mbrand span{display:block;font-family:'Space Mono',monospace;font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--soft)}
.wk-search{position:relative}
.wk-search input{width:300px;max-width:60vw;background:var(--field);border:1px solid var(--line2);border-radius:8px;padding:9px 12px 9px 32px;font-family:'Archivo',sans-serif;font-size:13.5px;color:var(--ink)}
.wk-search input:focus{outline:none;border-color:var(--indigo)}
.wk-search svg{position:absolute;left:10px;top:9px;width:15px;height:15px;stroke:var(--soft);fill:none;stroke-width:2}
.wk-suggest{position:absolute;top:42px;left:0;right:0;background:var(--surface);border:1px solid var(--line2);border-radius:9px;box-shadow:0 12px 30px rgba(0,0,0,.18);overflow:hidden;display:none;z-index:30}
.wk-suggest.show{display:block}
.wk-sg{padding:9px 13px;font-size:13px;cursor:pointer;display:flex;justify-content:space-between;gap:10px;color:var(--ink)}
.wk-sg:hover{background:var(--chip)}
.wk-sg .wk-kind{font-family:'Space Mono',monospace;font-size:9px;color:var(--soft);text-transform:uppercase}

.wk-article{max-width:920px;margin:0 auto}
.wk-title{font-weight:900;font-size:clamp(26px,4vw,34px);letter-spacing:-.03em;padding-bottom:7px;border-bottom:1px solid var(--line2)}
.wk-fromline{font-family:'Space Mono',monospace;font-size:10.5px;color:var(--soft);font-style:italic;margin:6px 0}
.wk-hatnote{font-size:13px;color:var(--muted);font-style:italic;border-left:3px solid var(--line2);padding:2px 0 2px 12px;margin:14px 0}

.wk-infobox{float:right;width:300px;margin:6px 0 18px 26px;border:1px solid var(--line2);border-radius:12px;overflow:hidden;background:var(--field);font-size:12.5px}
.wk-ib-title{background:var(--ink);color:var(--surface);text-align:center;font-weight:800;font-size:14px;padding:11px 12px;letter-spacing:-.01em}
.wk-ib-sub{text-align:center;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--soft);padding:7px;background:var(--chip);border-bottom:1px solid var(--line)}
.wk-ib-img{padding:14px;display:flex;flex-direction:column;align-items:center;gap:7px;border-bottom:1px solid var(--line)}
.wk-ib-pic{max-width:140px;height:auto;border:1px solid var(--line2);border-radius:4px}
.wk-ib-square{width:74px;height:74px;border-radius:12px;display:grid;place-items:center;color:#fff;font-weight:900;font-size:20px;font-family:'Space Mono',monospace}
.wk-ib-circle{width:80px;height:80px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;font-size:24px}
.wk-ib-cap{font-family:'Space Mono',monospace;font-size:9.5px;color:var(--soft);text-align:center}
.wk-ib-grouph{background:var(--indigo-soft);color:var(--indigo);text-align:center;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.07em;text-transform:uppercase;font-weight:700;padding:6px}
.wk-ib-row{display:flex;border-bottom:1px solid var(--line)}
.wk-ib-row:last-child{border-bottom:none}
.wk-ib-k{width:42%;padding:8px 11px;font-weight:700;background:var(--surface);color:var(--muted);font-size:11.5px}
.wk-ib-v{width:58%;padding:8px 11px}
@media(max-width:680px){.wk-infobox{float:none;width:100%;margin:0 0 18px}}

.wk-lead p{font-size:15.5px;margin-bottom:14px}
.wk-lead p:first-of-type{font-size:16px}
.wk-bodytext p{font-size:15px;margin-bottom:14px}
.wk-bodytext ul{margin:0 0 14px 22px;font-size:15px}.wk-bodytext li{margin:4px 0}
.wk-sec{font-weight:800;font-size:21px;letter-spacing:-.01em;border-bottom:1px solid var(--line);padding-bottom:5px;margin:26px 0 12px;scroll-margin-top:70px}
.wk-sub{font-weight:700;font-size:16px;margin:18px 0 8px;scroll-margin-top:70px}
.wk-link{color:var(--indigo);cursor:pointer;text-decoration:none}
.wk-link:hover{text-decoration:underline}
.wk-link--dead{color:var(--soft);cursor:default}
.wk-link--dead:hover{text-decoration:none}
sup.wk-ref{font-size:10px;color:var(--indigo);cursor:pointer;vertical-align:super;line-height:0}

.wk-toc{display:inline-block;min-width:240px;border:1px solid var(--line2);background:var(--field);border-radius:10px;padding:12px 16px 14px;margin:6px 0 18px}
.wk-toch{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--soft);font-weight:700;margin-bottom:8px}
.wk-toc ol{list-style:none;counter-reset:t;margin:0;padding:0}
.wk-toc li{counter-increment:t;font-size:13px;margin:4px 0}
.wk-toc li::before{content:counter(t) ". ";color:var(--soft);font-family:'Space Mono',monospace;font-size:11px}
.wk-toc a{color:var(--indigo);cursor:pointer;text-decoration:none}.wk-toc a:hover{text-decoration:underline}

.wk-refs ol{margin-left:20px;font-size:12.5px;color:var(--muted)}
.wk-refs li{margin:5px 0}
.wk-bullets{margin:0 0 14px 22px;font-size:15px}.wk-bullets li{margin:4px 0}
.wk-cats{margin-top:26px;padding-top:12px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;align-items:center;gap:8px}
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

// Merge a wiki_articles row into the flat article object articleHTML expects (title/kind from the
// columns, everything else from the definition). ONE place that mapping lives.
export function normalizeArticle(row) {
  var d = (row && row.definition) || {};
  return {
    title: row.title, kind: row.kind,
    hat: d.hat, box: d.box, lead: d.lead,
    sections: d.sections || [], see: d.see || [], refs: d.refs || [], cats: d.cats || []
  };
}
