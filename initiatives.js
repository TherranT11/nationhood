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
.nini__start{margin-top:9px;font-family:ui-monospace,monospace;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border:1.5px solid var(--indigo);color:var(--indigo);background:transparent;border-radius:9px;padding:8px 13px;cursor:pointer}
.nini__pick{margin-top:9px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.nini__pick select{flex:1;min-width:150px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);font-size:13px}
.nini__go{border:none;background:var(--indigo);color:#fff;border-radius:8px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer}
.nini-empty{color:var(--soft);font-size:13px;font-style:italic}
`;
function injectCss(){ if(document.getElementById('nini-css'))return; var s=document.createElement('style'); s.id='nini-css'; s.textContent=CSS; document.head.appendChild(s); }

// Effective cost + on-enact effect line — MIRRORS the server (schema/141): private −20% / state
// +25%; private → +1 Growth, state → −1D2 Unemployment & Inflation. Display only.
function effCost(d){ var c=Number(d.cost)||0; if(d.ownership==='private')return Math.round(c*0.8); if(d.ownership==='state')return Math.round(c*1.25); return Math.round(c); }
function ownEffect(d){ return d.ownership==='private'?'+1 Growth':d.ownership==='state'?'−1–2 Unemployment & Inflation':''; }

// A nation's initiative state: the one under way (if any) and what it can enact next. Available =
// eligible + (recurring, or one-time never carried out here) + nothing already running (one at a
// time). Also returns the nation's placed corps for the executor picker.
export async function fetchNationInitiatives(nationId){
  try {
    const [defsR, mineR, corpsR] = await Promise.all([
      supabase.from('national_initiatives').select('id, definition').order('created_at'),
      supabase.from('nation_initiatives').select('id, initiative_id, corp_id, status, started_tick, complete_tick, cost_per_tick').eq('nation_id', nationId),
      supabase.from('corporations').select('id, name').eq('nation_id', nationId).eq('status', 'placed')
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
    return { active: active, available: available, corps: corpsR.data || [] };
  } catch(e){ return { active:null, available:[], corps:[] }; }
}

// Render into `el`. ctx = { amPM, currentTick, onEnact(initiativeId, corpId|null) }. Only the head
// of government sees the Start controls; everyone sees the running programme + what's available.
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
    var corps=(data.corps||[]).filter(function(c){ return Array.isArray(d.executors) && d.executors.indexOf(c.id)>=0; });
    var eff=ownEffect(d), lm=d.lengthMonths||[];
    html += '<div class="nini" data-init="'+esc(row.id)+'"><div class="nini__name">'+esc(d.name||'Initiative')+'</div>'+
      '<div class="nini__meta">$'+effCost(d)+'B · '+(lm[0]!=null?lm[0]:'?')+'–'+(lm[1]!=null?lm[1]:'?')+' mo · '+esc(d.ownership||'unset')+(eff?' · '+eff:'')+(d.cadence==='recurring'?' · recurring':'')+'</div>'+
      '<span class="nini__gain">+'+(d.quantity||0)+' '+esc(d.resource||'')+'</span>';
    if(ctx.amPM){
      html += '<div class="nini__pick" hidden><select class="nini__corp">'+
        corps.map(function(c){ return '<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>'; }).join('')+
        '<option value="">Direct government programme</option></select>'+
        '<button class="nini__go" type="button">Enact (2 AP)</button></div>'+
        '<button class="nini__start" type="button">Start ▸</button>';
    }
    html += '</div>';
  });
  el.innerHTML = html || '<p class="nini-empty">No initiatives available'+(ctx.amPM?'':' — your Head of Government enacts these')+'.</p>';

  el.querySelectorAll('.nini[data-init]').forEach(function(card){
    var start=card.querySelector('.nini__start'), pick=card.querySelector('.nini__pick'), go=card.querySelector('.nini__go');
    if(start&&pick) start.addEventListener('click', function(){ pick.hidden=false; start.hidden=true; });
    if(go) go.addEventListener('click', function(){ var v=card.querySelector('.nini__corp').value; if(ctx.onEnact) ctx.onEnact(card.dataset.init, v||null); });
  });
}
