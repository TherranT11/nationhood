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

// A single palette colour by index (the ONE place the palette mapping lives). Used for default
// colours of nations/continents that don't have an explicit one yet.
export function paletteAt(i) { var n = NATION_PALETTE.length; return NATION_PALETTE[((i % n) + n) % n]; }
// One colour per nation: its stored map colour (nations.color), else a stable palette colour by
// list order — so every reader that orders nations the same way (by name) agrees. Pass the nation
// rows (need .id and .color). Returns { nationId: '#rrggbb' }.
export function nationColors(list) { var m = {}; (list || []).forEach(function (n, i) { m[n.id] = n.color || paletteAt(i); }); return m; }

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

// Paint a nation mini-map into `cv` (canvas) fitted to `box` (its sized parent). One source for
// the mini-map, shared by the live Nation page and the tutorial. opts:
//   hexes:  [{ q, r, terrain, nation_id, continent }] (the world_hexes rows)
//   natColor: { nationId: '#rrggbb' } (from nationColors())
//   viewedId: the nation to highlight/focus
//   mode: 'nation' (viewed nation in colour, rest greyed) | 'continent' | 'world' (all nations)
//   focusContinent: the continent to frame in 'continent' mode
// Returns true if it painted any land, false if there was none (caller shows its own fallback).
export function drawNationMiniMap(cv, box, opts) {
  if (!cv || !box) return false;
  var o = opts || {}, mode = o.mode || 'nation', viewedId = o.viewedId, fc = o.focusContinent;
  var natColor = o.natColor || {};
  var land = (o.hexes || []).filter(function (h) { return h.terrain === 'land'; });
  if (!land.length) return false;
  var DPR = window.devicePixelRatio || 1, W = box.clientWidth, H = box.clientHeight;
  cv.width = W * DPR; cv.height = H * DPR; var ctx = cv.getContext('2d'); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  var hmap = {}; land.forEach(function (h) { hmap[h.q + ',' + h.r] = h; });
  var landAt = function (q, r) { return hmap[q + ',' + r] || null; };
  // Fit/centre on the FOCUS hexes: Nation = the viewed nation's hexes; Continent = its
  // continent's hexes; World = the whole painted world. M = hexes of context around the focus.
  var focused = mode === 'nation' ? land.filter(function (h) { return h.nation_id === viewedId; })
              : (mode === 'continent' && fc) ? land.filter(function (h) { return h.continent === fc; })
              : null;
  var focus = (focused && focused.length) ? focused : land;   // no focus hexes → show the world
  var M = (focused && focused.length) ? 1.5 : 2.5;
  var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  focus.forEach(function (h) { var p = axialToPix(h.q, h.r, 1, 0, 0); minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); miny = Math.min(miny, p.y); maxy = Math.max(maxy, p.y); });
  minx -= M * Math.sqrt(3); maxx += M * Math.sqrt(3); miny -= M * 1.5; maxy += M * 1.5;
  var pad = 6, bw = (maxx - minx) || 1, bh = (maxy - miny) || 1, s = Math.min((W - 2 * pad) / bw, (H - 2 * pad) / bh);
  var ox = pad - minx * s + ((W - 2 * pad) - bw * s) / 2, oy = pad - miny * s + ((H - 2 * pad) - bh * s) / 2;
  var cs = [pixToAxial(0, 0, s, ox, oy), pixToAxial(W, 0, s, ox, oy), pixToAxial(0, H, s, ox, oy), pixToAxial(W, H, s, ox, oy)];
  var qs = cs.map(function (c) { return c[0]; }), rs = cs.map(function (c) { return c[1]; });
  var QA = Math.min.apply(null, qs) - 1, QB = Math.max.apply(null, qs) + 1, RA = Math.min.apply(null, rs) - 1, RB = Math.max.apply(null, rs) + 1;
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#bcd9e6'; ctx.fillRect(0, 0, W, H);
  for (var r = RA; r <= RB; r++) for (var q = QA; q <= QB; q++) {
    var p = axialToPix(q, r, s, ox, oy); if (p.x < -s * 2 || p.x > W + s * 2 || p.y < -s * 2 || p.y > H + s * 2) continue;
    var h = hmap[q + ',' + r];
    hexPath(ctx, p.x, p.y, s * 0.96);
    if (h) {
      if (mode === 'nation') ctx.fillStyle = (h.nation_id && h.nation_id === viewedId) ? (natColor[h.nation_id] || '#5546E8') : '#cdc6b8';
      else if (mode === 'continent' && fc && h.continent !== fc) ctx.fillStyle = '#cdc6b8';   // off-continent land greyed
      else ctx.fillStyle = h.nation_id ? (natColor[h.nation_id] || '#9a8f7d') : '#e9e3d4';    // continent/world: each nation its colour
      ctx.fill();
    } else { ctx.fillStyle = ((q + r) % 2 === 0) ? '#bcd9e6' : '#a9cdde'; ctx.fill(); }
    ctx.lineWidth = 1; ctx.strokeStyle = h ? 'rgba(120,110,90,.25)' : 'rgba(110,150,170,.28)'; ctx.stroke();
  }
  for (var r2 = RA; r2 <= RB; r2++) for (var q2 = QA; q2 <= QB; q2++) {
    if (!landAt(q2, r2)) continue;
    var p2 = axialToPix(q2, r2, s, ox, oy); if (p2.x < -s * 2 || p2.x > W + s * 2 || p2.y < -s * 2 || p2.y > H + s * 2) continue;
    borderEdges(landAt, q2, r2).forEach(function (ed) {
      var e = hexEdge(p2.x, p2.y, s * 0.96, ed.d);
      ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2);
      if (ed.sea) { ctx.strokeStyle = '#7fa9bd'; ctx.lineWidth = 1.6; } else { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.2; } ctx.stroke();
    });
  }
  // Placed cities (opts.cities = [{name,q,r}]). Dot always; label only when the hexes are large
  // enough to read (a zoomed-out world view shows dots alone). Uses the same s/ox/oy transform.
  if (o.cities && o.cities.length) {
    drawCityMarkers(ctx, o.cities, function (q, r) { return axialToPix(q, r, s, ox, oy); },
      { dot: Math.max(1.5, s * 0.13), labels: s >= 9, font: '600 ' + Math.max(8, Math.min(12, Math.round(s * 0.78))) + 'px Archivo' });
  }
  return true;
}

// City markers: a small black dot (and, when there's room, the city name) at each placed city's hex
// centre. `cities` = [{ name, q, r }] — rows with a null q/r (unplaced) are skipped. `toPix(q,r)`
// returns the on-screen centre for the caller's current transform/zoom. Several cities in one hex are
// spread vertically so they don't stack. The label carries a white halo so it reads over any hex fill.
// ONE source, shared by the admin World Map editor and the nation-page mini-map.
export function drawCityMarkers(ctx, cities, toPix, opts) {
  var o = opts || {}, dot = o.dot || 2.4, labels = o.labels !== false, font = o.font || '600 10px Archivo';
  var byHex = {};
  (cities || []).forEach(function (c) { if (c.q == null || c.r == null) return; var k = c.q + ',' + c.r; (byHex[k] = byHex[k] || []).push(c); });
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = font; ctx.lineJoin = 'round';
  Object.keys(byHex).forEach(function (k) {
    var g = byHex[k], base = toPix(g[0].q, g[0].r), n = g.length, step = dot * 2 + (labels ? 11 : 4);
    g.forEach(function (c, i) {
      var cx = base.x, cy = base.y + (i - (n - 1) / 2) * step;
      ctx.beginPath(); ctx.arc(cx, cy, dot, 0, Math.PI * 2); ctx.fillStyle = '#15151b'; ctx.fill();
      if (labels && c.name) {
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.strokeText(c.name, cx, cy + dot + 1);
        ctx.fillStyle = '#15151b'; ctx.fillText(c.name, cx, cy + dot + 1);
      }
    });
  });
  ctx.restore();
}

function corner(cx, cy, s, i) { var a = Math.PI / 180 * (60 * i - 90); return { x: cx + s * Math.cos(a), y: cy + s * Math.sin(a) }; }
export function hexPath(ctx, cx, cy, s) { ctx.beginPath(); for (var i = 0; i < 6; i++) { var c = corner(cx, cy, s, i); i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y); } ctx.closePath(); }
export function hexEdge(cx, cy, s, d) { var a = corner(cx, cy, s, d), b = corner(cx, cy, s, d + 1); return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }; }
