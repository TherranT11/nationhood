// Shared hex-grid geometry (pointy-top, axial q,r) + the nation colour palette — used by the
// adminsetup World Map editor and the nation-page map viewer so the math and the colours live
// in ONE place. `s` is the on-screen hex radius (already scaled for zoom); (ox, oy) the origin.

export const NATION_PALETTE = ['#5546E8', '#16915a', '#C42B2B', '#E0820E', '#1f86d6', '#8b46e8',
  '#0f9b8e', '#d6457e', '#7a8b1f', '#c98a16', '#3f6fd6', '#9a5b2d'];

// A hex's six axial neighbours, in the edge order hexEdge() uses (d = 0…5).
export function neighbors(q, r) { return [[q + 1, r], [q, r + 1], [q - 1, r + 1], [q - 1, r], [q, r - 1], [q + 1, r - 1]]; }

export function axialToPix(q, r, s, ox, oy) { return { x: Math.sqrt(3) * s * (q + r / 2) + ox, y: 1.5 * s * r + oy }; }

export function hexRound(q, r) {
  var x = q, z = r, y = -x - z, rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
  var dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
  return [rx, rz];
}
export function pixToAxial(px, py, s, ox, oy) { var x = px - ox, y = py - oy, r = y / (1.5 * s), q = x / (Math.sqrt(3) * s) - r / 2; return hexRound(q, r); }

function corner(cx, cy, s, i) { var a = Math.PI / 180 * (60 * i - 90); return { x: cx + s * Math.cos(a), y: cy + s * Math.sin(a) }; }
export function hexPath(ctx, cx, cy, s) { ctx.beginPath(); for (var i = 0; i < 6; i++) { var c = corner(cx, cy, s, i); i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y); } ctx.closePath(); }
export function hexEdge(cx, cy, s, d) { var a = corner(cx, cy, s, d), b = corner(cx, cy, s, d + 1); return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }; }
