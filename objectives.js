// Shared objective formatting — ONE source for a condition's / reward's human-readable text,
// used by the admin Objectives Builder (adminsetup) and the player Agenda (home page). The two
// context-dependent lookups — a nation's name and a hex's label — are INJECTED via ctx, since each
// page holds its own nation + hex data; everything else is self-contained here.
function objNum(v) { return Number(v) || 0; }
function sgn(v) { var x = objNum(v); return (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x); }
function money(v) { var x = objNum(v); return (x >= 0 ? '+' : '−') + '₣' + Math.abs(x) + 'B'; }

export function condText(c, ctx) {
  ctx = ctx || {};
  var natName = ctx.natName || function (id) { return id || '—'; };
  var hexLabel = ctx.hexLabel || function (k) { return k || '—'; };
  switch (c.kind) {
    case 'stat_up':   return 'Increase ' + c.stat + ' by ' + objNum(c.amount);
    case 'stat_down': return 'Decrease ' + c.stat + ' by ' + objNum(c.amount);
    case 'prod_up':   return 'Increase ' + c.resource + ' production by ' + objNum(c.amount);
    case 'budget':    return 'Hold at least ₣' + objNum(c.amount) + 'B Budget';
    case 'debt_down': return 'Reduce Debt by ' + objNum(c.pct) + '%';
    case 'fdi':       return 'Hold FDI tokens in at least ' + objNum(c.count) + ' countr' + (objNum(c.count) === 1 ? 'y' : 'ies');
    case 'trade':     return 'Keep at least ' + objNum(c.count) + ' Trade Agreement' + (objNum(c.count) === 1 ? '' : 's') + ' active';
    case 'mil_dom':   return 'Hold more Military in ' + (c.continent || '—') + ' than any other nation';
    case 'gdp_up':    return 'Grow GDP by ' + objNum(c.pct) + '%';
    case 'allies':    return 'Have ' + objNum(c.count) + ' all' + (objNum(c.count) === 1 ? 'y' : 'ies') + ' in ' + (c.continent || '—');
    case 'units':     return 'Field more than ' + objNum(c.count) + ' ' + c.unit;
    case 'relations': return 'Relations with ' + natName(c.nation) + ' above ' + objNum(c.value);
    case 'seize':     return 'Seize territory ' + hexLabel(c.hex);
  }
  return '';
}

export function rewardText(r, ctx) {
  ctx = ctx || {};
  var natName = ctx.natName || function (id) { return id || '—'; };
  switch (r.kind) {
    case 'popularity': return sgn(r.amount) + ' Party Popularity';
    case 'confidence': return sgn(r.amount) + ' Government Confidence';
    case 'onhand':     return sgn(r.amount) + ' ' + r.resource + ' on hand';
    case 'budget':     return money(r.amount) + ' Budget';
    case 'relations':  return sgn(r.amount) + ' Relations with ' + natName(r.nation);
    case 'debt':       return money(r.amount) + ' Debt';
    case 'stat':       return sgn(r.amount) + ' ' + r.stat;
  }
  return '';
}
