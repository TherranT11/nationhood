// Shared hex-grid geometry (pointy-top, axial q,r) + the nation colour palette — used by the
// adminsetup World Map editor and the nation-page map viewer so the math and the colours live
// in ONE place. `s` is the on-screen hex radius (already scaled for zoom); (ox, oy) the origin.

// Nation colour palette + neighbour order are module-internal — read through nationColors()
// and borderEdges() below (the only things callers need).
const NATION_PALETTE = ['#5546E8', '#16915a', '#C42B2B', '#E0820E', '#1f86d6', '#8b46e8',
  '#0f9b8e', '#d6457e', '#7a8b1f', '#c98a16', '#3f6fd6', '#9a5b2d'];

// A hex's six axial neighbours, in the edge order hexEdge() uses (d = 0…5).
function neighbors(q, r) { return [[q + 1, r], [q, r + 1], [q - 1, r + 1], [q - 1, r], [q, r - 1], [q + 1, r - 1]]; }

export function axialToPix(q, r, s, ox, oy) { return { x: Math.sqrt(3) * s * (q + r / 2) + ox, y: 1.5 * s * r + oy }; }

// One palette colour per key, by list order — the ONE place the palette mapping lives.
// Returns { key: '#rrggbb' }. nationColors is the by-name-ordered nation case; continents
// (and any other layer) reuse paletteColors directly.
export function paletteColors(keys) { var m = {}; (keys || []).forEach(function (k, i) { if (k != null && k !== '') m[k] = NATION_PALETTE[i % NATION_PALETTE.length]; }); return m; }
export function paletteAt(i) { var n = NATION_PALETTE.length; return NATION_PALETTE[((i % n) + n) % n]; }
export function nationColors(list) { return paletteColors((list || []).map(function (n) { return n.id; })); }

// The border edges of a land hex: each side facing the sea (no land neighbour) or a different
// nation. landAt(q,r) returns the land hex at a cell or null. Returns [{ d, sea }] — d is the
// side (0…5), sea = true for a coastline, false for a nation border. ONE source for "what is a
// border", shared by the editor and the viewer.
export function borderEdges(landAt, q, r) {
  var hh = landAt(q, r); if (!hh) return [];
  var out = [], nb = neighbors(q, r);
  for (var d = 0; d < 6; d++) { var nh = landAt(nb[d][0], nb[d][1]); if (!nh) out.push({ d: d, sea: true }); else if (hh.nation_id && nh.nation_id !== hh.nation_id) out.push({ d: d, sea: false }); }
  return out;
}

function hexRound(q, r) {
  var x = q, z = r, y = -x - z, rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
  var dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
  return [rx, rz];
}
export function pixToAxial(px, py, s, ox, oy) { var x = px - ox, y = py - oy, r = y / (1.5 * s), q = x / (Math.sqrt(3) * s) - r / 2; return hexRound(q, r); }

function corner(cx, cy, s, i) { var a = Math.PI / 180 * (60 * i - 90); return { x: cx + s * Math.cos(a), y: cy + s * Math.sin(a) }; }
export function hexPath(ctx, cx, cy, s) { ctx.beginPath(); for (var i = 0; i < 6; i++) { var c = corner(cx, cy, s, i); i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y); } ctx.closePath(); }
export function hexEdge(cx, cy, s, d) { var a = corner(cx, cy, s, d), b = corner(cx, cy, s, d + 1); return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }; }
