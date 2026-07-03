// Client gateway for a nation's National Initiatives — the Home panel (#homeInitiatives).
// Lists what the head of government can enact (eligible + still available by cadence) and the one
// currently under way, and drives the enact RPC. Server truth lives in schema/140 (definitions)
// and 141 (runtime: nation_initiatives + initiative_enact). Read-resilient — returns empties on
// any failure so the panel never breaks the home page.
import { supabase } from '/supabase.js';
import { esc } from '/util.js';

const CSS = `
.nini{border:1px solid var(--line);border-radius:11px;padding:12px 14px;margin-bottom:10px;background:var(--surface)}
.nini:last-child{margin-bottom:0}
.nini.run{border-left:4px solid var(--indigo)}
.nini__name{font-weight:800;font-size:14.5px;letter-spacing:-.01em}
.nini__meta{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:var(--muted);margin-top:5px;line-height:1.6}
.nini__gain{display:inline-block;font-weight:700;font-size:11.5px;color:var(--indigo);border:1px solid var(--indigo);border-radius:7px;padding:2px 7px;margin-top:7px}
.nini__bar{height:6px;border-radius:6px;background:var(--chip,#eee);margin-top:9px;overflow:hidden}
.nini__fill{height:100%;background:var(--indigo)}
.nini__pick{margin-top:9px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.nini__pick select{flex:1;min-width:150px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);font-size:13px}
.nini__go{border:none;background:var(--indigo);color:#fff;border-radius:8px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer}
.nini__opts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.nini__opt{text-align:left;border:1.5px solid var(--line);background:var(--surface);border-radius:9px;padding:9px 11px;cursor:pointer;color:var(--ink);font:inherit}
.nini__opt b{display:block;font-size:12.5px;font-weight:800}
.nini__opt span{display:block;font-size:10.5px;color:var(--muted);margin-top:3px;line-height:1.4}
.nini__opt.is-sel{border-color:var(--indigo);background:var(--indigo-soft,rgba(107,92,255,.1))}
.nini__opt.is-off{opacity:.55;cursor:default}
.nini-empty{color:var(--soft);font-size:13px;font-style:italic}
`;
function injectCss(){ if(document.getElementById('nini-css'))return; var s=document.createElement('style'); s.id='nini-css'; s.textContent=CSS; document.head.appendChild(s); }

// Base cost from the cost basis — MIRRORS the server (schema/140/141): flat → $B; production → $B
// per current unit of the resource (min one unit); gdp → % of GDP. Reads this nation's live figures
// so the shown price matches what the server will charge. The Minister then picks the execution
// model at enact — private (−20%, +1 Growth, firms bid) or state (+25%, −1D2 Unemployment &
// Inflation, the nation's own SO firm in an authorised sector) — applied on top.
function baseCost(d, nation){
  var v=Number(d.cost)||0, model=d.costModel||'flat';
  if(model==='production'){ var cur=Number((nation&&nation.production&&nation.production[String(d.resource||'').toLowerCase()])||0); return Math.max(cur,1)*v; }
  if(model==='gdp'){ return Math.round(Number(nation&&nation.gdp||0)*v/100); }
  return v;
}

// A nation's initiative state: the one under way (if any) and what it can enact next. Available =
// eligible + (recurring, or one-time never carried out here) + nothing already running (one at a
// time). Also returns the nation's placed corps for the executor picker.
export async function fetchNationInitiatives(nationId){
  try {
    const [defsR, mineR, corpsR, natR] = await Promise.all([
      supabase.from('national_initiatives').select('id, definition').order('created_at'),
      supabase.from('nation_initiatives').select('id, initiative_id, corp_id, status, started_tick, complete_tick, cost_per_tick').eq('nation_id', nationId),
      supabase.from('corporations').select('id, name, category, type').eq('nation_id', nationId).eq('status', 'placed'),
      supabase.from('nations').select('gdp, production').eq('id', nationId).maybeSingle()
    ]);
    var defs = defsR.data || [], mine = mineR.data || [];
    var activeRow = mine.filter(function(r){ return r.status==='active'; })[0] || null;
    var enacted = {}; mine.forEach(function(r){ enacted[r.initiative_id]=true; });
    var eligible = defs.filter(function(x){ var e=x.definition&&x.definition.eligibleNations; return e==='*' || (Array.isArray(e)&&e.indexOf(nationId)>=0); });
    var available = activeRow ? [] : eligible.filter(function(x){
      var cad=(x.definition&&x.definition.cadence)||'one_time';
      return cad==='recurring' || !enacted[x.id];   // one-time shows only until first enacted here
    });
    var active = null;
    if(activeRow){ var ad=defs.filter(function(x){ return x.id===activeRow.initiative_id; })[0]; active={ row:activeRow, def: ad?ad.definition:null }; }
    return { active: active, available: available, corps: corpsR.data || [], nation: natR.data || {} };
  } catch(e){ return { active:null, available:[], corps:[], nation:{} }; }
}

// Render into `el`. ctx = { canEnact, currentTick, onEnact(initiativeId, ownership, corpId|null) }.
// Only the Minister of Economic Development (canEnact) sees the enact controls; everyone sees the
// running programme + what's available.
export function renderNationInitiatives(el, data, ctx){
  if(!el) return; injectCss(); ctx = ctx || {};
  var html='';
  if(data.active && data.active.def){
    var a=data.active, d=a.def;
    var left=Math.max(0,(a.row.complete_tick||0)-(Number(ctx.currentTick)||0));
    var total=Math.max(1,(a.row.complete_tick||0)-(a.row.started_tick||0));
    var pct=Math.max(0,Math.min(100,Math.round((1-left/total)*100)));
    html += '<div class="nini run"><div class="nini__name">'+esc(d.name||'Initiative')+'</div>'+
      '<div class="nini__meta">Under way · '+left+' month'+(left===1?'':'s')+' left · $'+(Number(a.row.cost_per_tick)||0).toFixed(1)+'B/mo</div>'+
      '<span class="nini__gain">+'+(d.quantity||0)+' '+esc(d.resource||'')+' on completion</span>'+
      '<div class="nini__bar"><div class="nini__fill" style="width:'+pct+'%"></div></div></div>';
  }
  (data.available||[]).forEach(function(row){
    var d=row.definition||{};
    var lm=d.lengthMonths||[], secs=Array.isArray(d.sectors)?d.sectors:[];
    var base=baseCost(d, data.nation), priv=Math.round(base*0.8), state=Math.round(base*1.25);
    html += '<div class="nini" data-init="'+esc(row.id)+'"><div class="nini__name">'+esc(d.name||'Initiative')+'</div>'+
      '<div class="nini__meta">'+(lm[0]!=null?lm[0]:'?')+'–'+(lm[1]!=null?lm[1]:'?')+' mo'+(d.cadence==='recurring'?' · recurring':'')+'</div>'+
      '<span class="nini__gain">+'+(d.quantity||0)+' '+esc(d.resource||'')+'</span>';
    if(ctx.canEnact){
      // The Minister picks the execution model. State needs one of the nation's own SO firms in an
      // authorised sector; private lets firms bid (no executor picked).
      var so=(data.corps||[]).filter(function(c){ return c.type==='so' && secs.indexOf(c.category)>=0; });
      html += '<div class="nini__opts">'+
        '<button class="nini__opt" data-own="private" type="button"><b>Private Enterprise</b><span>$'+priv+'B · +1 Growth · firms bid</span></button>'+
        (so.length
          ? '<button class="nini__opt" data-own="state" type="button"><b>State Sanctioned</b><span>$'+state+'B · −1–2 Unemployment &amp; Inflation</span></button>'
          : '<div class="nini__opt is-off"><b>State Sanctioned</b><span>Needs a state-owned '+esc(secs.join(' / ')||'sector')+' firm — you have none</span></div>')+
        '</div>';
      if(so.length){
        html += '<div class="nini__pick" hidden><select class="nini__corp">'+
          so.map(function(c){ return '<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>'; }).join('')+
          '</select><button class="nini__go" type="button">Enact (2 AP)</button></div>';
      }
    }
    html += '</div>';
  });
  el.innerHTML = html || '<p class="nini-empty">No initiatives available'+(ctx.canEnact?'':' — your Minister of Economic Development enacts these')+'.</p>';

  el.querySelectorAll('.nini[data-init]').forEach(function(card){
    var priv=card.querySelector('.nini__opt[data-own="private"]');
    var stateBtn=card.querySelector('.nini__opt[data-own="state"]');
    var pick=card.querySelector('.nini__pick'), go=card.querySelector('.nini__go');
    // Private enacts straight away (firms bid). State reveals the SO-firm picker first.
    if(priv) priv.addEventListener('click', function(){ if(ctx.onEnact) ctx.onEnact(card.dataset.init, 'private', null); });
    if(stateBtn&&pick) stateBtn.addEventListener('click', function(){ pick.hidden=false; stateBtn.classList.add('is-sel'); if(priv)priv.classList.remove('is-sel'); });
    if(go) go.addEventListener('click', function(){ var sel=card.querySelector('.nini__corp'); if(ctx.onEnact) ctx.onEnact(card.dataset.init, 'state', sel?sel.value||null:null); });
  });
}
