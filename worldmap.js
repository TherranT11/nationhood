// Shared world-map rendering — one source for how the map is drawn, imported by
// the Cartographer (admin editor) and the game home (read-only viewer). Geometry,
// colours and marker shapes live here so the two renderers can never drift.

export const MAP_VIEW = { w: 1200, h: 800 };
const INK = '#0F1417', VELLUM = '#E6E0D0', COAST = '#2E5468';

// Settlement kinds: label (map maker), marker colour, marker radius.
export const TYPES = {
  humanTown:    { label:'Human town',    color:'#C8A15A', r:5 },
  humanCity:    { label:'Human city',    color:'#C8A15A', r:8 },
  humanCapital: { label:'Human capital', color:'#C8A15A', r:11 },
  orcVillage:   { label:'Orc village',   color:'#9B3B33', r:6 },
  orcTribe:     { label:'Orc tribe',     color:'#9B3B33', r:10 },
};

export const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

export const toPath = (pts, close) =>
  pts.map((p,i) => (i===0?'M':'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ') + (close ? ' Z' : '');

// One settlement marker. `selected` draws the editor's selection ring; `highlight`
// draws the viewer's pulsing "you are here" ring. Internal to renderSettlements.
function markerSvg(type, { selected = false, highlight = false } = {}) {
  const t = TYPES[type];
  if (!t) return '';
  const c = t.color, ring = selected ? VELLUM : c;
  const selRing = (r) => selected ? `<circle r="${r}" fill="none" stroke="${VELLUM}" stroke-width="1" opacity="0.7"/>` : '';
  const hi = highlight
    ? `<circle r="${t.r + 9}" fill="none" stroke="${VELLUM}" stroke-width="1.5" opacity="0.85"><animate attributeName="opacity" values="0.85;0.3;0.85" dur="2.4s" repeatCount="indefinite"/></circle>`
    : '';
  let body;
  if (type === 'humanCapital') body =
    `<circle r="15" fill="none" stroke="${ring}" stroke-width="1" opacity="0.6"/>` +
    `<circle r="10" fill="${INK}" stroke="${c}" stroke-width="2"/>` +
    `<path d="M-5 3 L-4 -4 L-1.5 -0.5 L0 -5 L1.5 -0.5 L4 -4 L5 3 Z" fill="${c}"/>`;
  else if (type === 'humanCity') body = selRing(14) + `<circle r="8" fill="${INK}" stroke="${c}" stroke-width="2"/><circle r="3" fill="${c}"/>`;
  else if (type === 'humanTown') body = selRing(11) + `<circle r="5" fill="${c}" stroke="${INK}" stroke-width="1.5"/>`;
  else if (type === 'orcTribe')  body = selRing(16) + `<path d="M0 -12 L11 7 L-11 7 Z" fill="${INK}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/><path d="M0 -4 L4 4 L-4 4 Z" fill="${c}"/>`;
  else body = selRing(12) + `<path d="M0 -7 L6 5 L-6 5 Z" fill="${c}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
  return hi + body;
}

// Everything beneath the settlements: landmasses, grid overlay, borders, roads.
// Requires a <pattern id="grid"> in the host SVG's <defs>.
export function renderTerrain(map) {
  const { w, h } = MAP_VIEW;
  let s = '';
  (map.landmasses || []).forEach((l) => {
    s += `<path d="${toPath(l.points,true)}" fill="none" stroke="${COAST}" stroke-width="9" stroke-linejoin="round" opacity="0.55"/>`;
    s += `<path d="${toPath(l.points,true)}" fill="${l.fill}" stroke="${l.stroke}" stroke-width="1.5" stroke-linejoin="round"/>`;
  });
  s += `<rect width="${w}" height="${h}" fill="url(#grid)"/>`;
  (map.borders || []).forEach((b) => { s += `<path d="${toPath(b.points,true)}" fill="${b.fill}" stroke="${b.stroke}" stroke-width="1.5" stroke-linejoin="round"/>`; });
  (map.roads || []).forEach((r) => { s += `<path d="${toPath(r.points,false)}" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`; });
  return s;
}

// Settlement markers + labels. opts:
//   labels      show name labels (default true)
//   selId       id drawn with the editor selection ring
//   highlightId id drawn with the "you are here" ring
//   names       { [id]: overrideName } to relabel a settlement (a ruler's capital)
//   interactive attach data-id + a pointer/move cursor (editor only)
//   moveCursor  when interactive, use the move cursor instead of pointer
export function renderSettlements(map, opts = {}) {
  const { labels = true, selId = null, highlightId = null, names = {}, interactive = false, moveCursor = false } = opts;
  const cursor = interactive ? (moveCursor ? 'move' : 'pointer') : 'default';
  let s = '';
  (map.settlements || []).forEach((st) => {
    const t = TYPES[st.type];
    if (!t) return;
    s += `<g data-id="${st.id}" transform="translate(${st.x} ${st.y})" style="cursor:${cursor}">`;
    s += markerSvg(st.type, { selected: selId === st.id, highlight: highlightId === st.id });
    if (labels) {
      const name = names[st.id] != null ? names[st.id] : st.name;
      const fill = (selId === st.id || highlightId === st.id) ? VELLUM : '#CFD6CE';
      s += `<text x="${t.r+8}" y="4" font-family="var(--mono)" font-size="13" fill="${fill}" stroke="${INK}" stroke-width="3" paint-order="stroke" style="pointer-events:none">${esc(name)}</text>`;
    }
    s += `</g>`;
  });
  return s;
}
