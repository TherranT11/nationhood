// card-effect-text.js — ONE source for turning a card effect ({kind, p}) into human-readable HTML.
// Used by the Card Creator preview (card-creator.js) AND the legislature pages that surface a Committee
// Bill's pass/fail effects (so voters see what a bill does). Returns an HTML string (with <b> emphasis).
//
// `nationName` (id → name) and `cardName` (id → name) are optional lookups: relations effects name the
// nation, and a deck_add effect names the card + nation. Anywhere a lookup isn't given, the effect reads
// "a nation" / "A card". Everything else is self-contained.
import { esc } from '/util.js';

const RES_LABEL = { air_wings: 'Air Wings' };                 // multi-word display overrides; the rest Title-case
const cap = function (s) { return (s || '').charAt(0).toUpperCase() + (s || '').slice(1); };
export const resLabel = function (k) { return RES_LABEL[k] || cap(k); };

export function cardEffectText(kind, p, nationName, cardName) {
  p = p || {};
  var nn = typeof nationName === 'function' ? nationName : function () { return ''; };
  var cn = typeof cardName === 'function' ? cardName : function () { return ''; };
  var t = function (k, pp) { return cardEffectText(k, pp, nationName, cardName); };   // nested-effect recursion (appoint/cond/event)
  switch (kind) {
    case 'party_gain': return 'Targeted party <b>gains ' + (p.x || 0) + ' approval</b>';
    case 'party_lose': return 'Targeted party <b>loses ' + (p.x || 0) + ' approval</b>';
    case 'decider_gain': return 'The deciding party <b>gains ' + (p.x || 0) + ' approval</b>';
    case 'decider_lose': return 'The deciding party <b>loses ' + (p.x || 0) + ' approval</b>';
    case 'coal_up': return 'Coalition health <b>+1</b>';
    case 'coal_down': return 'Coalition health <b>−1</b>';
    case 'coal_pop_up': return 'All coalition parties <b>gain ' + (p.x || 0) + ' approval</b>';
    case 'coal_pop_down': return 'All coalition parties <b>lose ' + (p.x || 0) + ' approval</b>';
    case 'sanction': return 'Sanction <b>' + esc(nn(p.nation) || 'a nation') + '</b> for at least <b>' + (p.ticks || 36) + '</b> ticks';
    case 'stat_up': return '<b>' + esc(p.stat || '?') + ' +' + (p.x || 0) + '</b>';
    case 'stat_down': return '<b>' + esc(p.stat || '?') + ' −' + (p.x || 0) + '</b>';
    case 'hex_pop': return 'At a chosen hex: <b>you +' + (p.x || 0) + '</b>, or <b>a rival −' + (p.x || 0) + '</b> approval';
    case 'res_add': return 'Add <b>' + (p.x || 0) + ' ' + esc(resLabel(p.res || 'food')) + '</b> to on-hand';
    case 'res_remove': return 'Remove <b>' + (p.x || 0) + ' ' + esc(resLabel(p.res || 'food')) + '</b> from on-hand';
    case 'rel_up': return 'Relations with <b>' + esc(nn(p.nation) || 'a nation') + '</b> rise by <b>' + (p.x || 0) + '</b>';
    case 'rel_down': return 'Relations with <b>' + esc(nn(p.nation) || 'a nation') + '</b> fall by <b>' + (p.x || 0) + '</b>';
    case 'prod_up': return '<b>' + esc(resLabel(p.res || 'energy')) + '</b> production <b>+' + (p.x || 0) + '</b> for <b>' + (p.ticks || 12) + '</b> ticks';
    case 'prod_down': return '<b>' + esc(resLabel(p.res || 'energy')) + '</b> production <b>−' + (p.x || 0) + '</b> for <b>' + (p.ticks || 12) + '</b> ticks';
    case 'deck_add': return '<b>' + esc(cn(p.card) || 'A card') + '</b> enters <b>' + esc(nn(p.nation) || 'a nation') + '</b>’s deck';
    case 'no_conf': return 'Put forth a <b>motion of no confidence</b>';
    case 'nat_el': return 'Carry out a <b>national election</b>';
    case 'hex_el': return 'Carry out an <b>election in a chosen hex</b> (reapportions its seats)';
    case 'mob_add': return 'An <b>Armed Mob</b> rises in <b>hex ' + esc(p.hex || '?') + '</b>';
    case 'mob_rem': return 'The <b>Armed Mob</b> in <b>hex ' + esc(p.hex || '?') + '</b> disperses';
    case 'mil_add': return 'Deploy a <b>Militia</b> to <b>hex ' + esc(p.hex || '?') + '</b>';
    case 'mil_rem': return 'The <b>Militia</b> in <b>hex ' + esc(p.hex || '?') + '</b> stands down';
    case 'appoint': return 'Head of Government must <b>appoint you to ' + esc(p.min || '?') + '</b>, or: ' + t(p.nk || 'party_lose', p.np || {});
    case 'cond': return 'IF <b>' + esc(p.stat || '?') + '</b> is ' + (p.dir || 'above') + ' <b>' + (p.x || 0) + '</b>, then: ' + t(p.nk || 'party_lose', p.np || {});
    case 'event': return '<b>Decision:</b> “' + esc(p.txt || '…') + '” → ' + t(p.nk || 'party_lose', p.np || {});
  }
  return '';
}
