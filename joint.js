// Joint Projects — the cross-nation negotiation UI (server: schema/142). Two surfaces on the home
// page: (1) the proposer's ask composer, a modal the Economic Development minister opens from the
// National Initiatives panel for a joint initiative → joint_propose; and (2) the negotiation inbox,
// a card at the top of home showing the player's live joint negotiations — the message thread plus
// Accept / Counter / Decline when it's their turn. All writes go through the security-definer RPCs;
// read-resilient. Cost formatting is reused from policies.js (fmtInitiativeCost — one source).
import { supabase } from '/supabase.js';
import { esc } from '/util.js';
import { fmtInitiativeCost } from '/policies.js';
const SHARES = [0, 25, 50];   // % of the standing yearly cost the partner can be asked to cover (consent / quarter / half)
// An initiative's authored yearly cost + unit (flat $bn/yr or % of GDP/yr); fmtInitiativeCost formats it.
function costVal(d){ return Number(d && d.budgetPerYear) || 0; }
function costPct(d){ return !!(d && d.budgetUnit === 'gdp'); }

const CSS = `
.jov{position:fixed;inset:0;background:rgba(10,10,16,.55);display:flex;align-items:center;justify-content:center;padding:16px;z-index:60}
.jov__card{background:var(--surface);border:1px solid var(--line);border-radius:16px;max-width:520px;width:100%;max-height:90vh;overflow:auto}
.jov__hd{padding:16px 18px 14px;border-bottom:1px solid var(--line)}
.jov__eyebrow{font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--soft)}
.jov__hd h3{font-size:18px;font-weight:800;letter-spacing:-.01em;margin-top:4px}
.jov__hd p{font-size:12.5px;color:var(--muted);margin-top:6px;line-height:1.5}
.jov__body{padding:16px 18px}
.jov__lbl{font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--soft);margin:16px 0 8px}
.jov__lbl:first-child{margin-top:0}
.jgate{display:flex;align-items:center;gap:10px;background:var(--chip);border:1px solid var(--line);border-radius:10px;padding:11px 12px;font-size:12.5px;color:var(--muted)}
.jgate.ok{border-color:var(--green)}
.jgate .rl{flex:1}.jgate .rl b{color:var(--ink)}
.jgate .bd{font-family:ui-monospace,monospace;font-size:10.5px;font-weight:700;border-radius:6px;padding:4px 8px;background:var(--chip);color:var(--muted)}
.jgate.ok .bd{background:var(--green-soft,#E5F4EC);color:var(--green)}
.jchip{display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:11.5px;border:1px solid var(--line);border-radius:7px;padding:3px 9px;margin:0 6px 6px 0}
.jseg{display:flex;gap:8px}
.jseg button{flex:1;background:var(--chip);border:1px solid var(--line);color:var(--muted);border-radius:9px;padding:10px;font-size:12.5px;font-weight:700;cursor:pointer}
.jseg button.on{border-color:var(--indigo);background:var(--indigo-soft);color:var(--indigo)}
.jseg button:disabled{opacity:.5;cursor:not-allowed}
.jsel{width:100%;margin-top:8px;background:var(--chip);border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:9px 11px;font-size:13px}
.jask{border:1px solid var(--line);background:var(--chip);border-radius:11px;padding:11px 13px;margin-bottom:8px;cursor:pointer}
.jask.on{border-color:var(--indigo);box-shadow:0 0 0 1px var(--indigo)}
.jask__h{display:flex;justify-content:space-between;align-items:center;gap:10px}
.jask__n{font-size:13.5px;font-weight:700}
.jask__sp{font-family:ui-monospace,monospace;font-size:10.5px;color:var(--muted)}
.jask__sp .you{color:var(--indigo)}.jask__sp .them{color:var(--amber,#E0820E)}
.jtx{width:100%;background:var(--chip);border:1px solid var(--line);color:var(--ink);border-radius:10px;padding:10px 12px;font-size:13px;font-family:inherit;line-height:1.5;min-height:56px;resize:vertical}
.jbtn{width:100%;margin-top:14px;background:var(--indigo);color:#fff;border:none;border-radius:11px;padding:12px;font-size:13px;font-weight:700;cursor:pointer}
.jbtn:disabled{background:var(--chip);color:var(--soft);cursor:not-allowed}
.jbtn.ghost{background:transparent;color:var(--muted);border:1px solid var(--line);margin-top:8px}

.jni{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--amber,#E0820E);border-radius:14px;padding:15px 17px;margin-bottom:12px}
.jni__hd{font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--amber,#E0820E);font-weight:700}
.jni__nm{font-size:16px;font-weight:800;letter-spacing:-.01em;margin-top:4px}
.jni__desc{font-size:12.5px;color:var(--muted);margin-top:5px;line-height:1.5}
.jni__row{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.jni__terms{font-size:12.5px;color:var(--muted);margin-top:11px;padding:10px 12px;background:var(--chip);border:1px solid var(--line);border-radius:9px}
.jni__terms b{color:var(--ink)}
.jth{margin-top:11px;border:1px solid var(--line);border-radius:10px;background:var(--chip);max-height:180px;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:7px}
.jmsg{max-width:85%;padding:7px 10px;border-radius:10px;font-size:12.5px;line-height:1.4}
.jmsg.me{align-self:flex-end;background:var(--indigo-soft);color:var(--ink)}
.jmsg.them{align-self:flex-start;background:var(--chip);color:var(--ink)}
.jmsg.sys{align-self:center;font-family:ui-monospace,monospace;font-size:10.5px;color:var(--soft);background:none;text-align:center;max-width:100%}
.jcin{display:flex;gap:8px;margin-top:9px}
.jcin input{flex:1;background:var(--chip);border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:9px 11px;font-size:13px}
.jcin button{border:none;background:var(--indigo);color:#fff;border-radius:9px;padding:0 14px;font-size:12px;font-weight:700;cursor:pointer}
.jact{display:flex;gap:8px;margin-top:12px}
.jact button{flex:1;border-radius:9px;padding:11px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid var(--line)}
.jact .acc{background:var(--green);color:#fff;border-color:var(--green)}
.jact .cou{background:var(--chip);color:var(--amber,#E0820E);border-color:var(--amber,#E0820E)}
.jact .dec{background:var(--chip);color:var(--red);border-color:var(--red)}
.jwait{margin-top:12px;font-family:ui-monospace,monospace;font-size:11px;color:var(--soft);text-align:center}
`;
function injectCss(){ if(document.getElementById('joint-css'))return; var s=document.createElement('style'); s.id='joint-css'; s.textContent=CSS; document.head.appendChild(s); }

// Canonical bilateral relation A↔B off the world-readable table; a missing pair reads 5 (mirrors
// _relation_value, schema/142).
async function relationValue(a, b){
  var lo = a < b ? a : b, hi = a < b ? b : a;
  try { const { data } = await supabase.from('nation_relations').select('value').eq('nation_a', lo).eq('nation_b', hi).maybeSingle();
        return (data && data.value != null) ? data.value : 5; } catch(e){ return 5; }
}
async function nationName(id){
  try { const { data } = await supabase.from('nations').select('name').eq('id', id).maybeSingle(); return (data && data.name) || id; } catch(e){ return id; }
}
function splitLine(eff, share, pct){ var them = eff * share / 100, you = eff - them; return '<span class="you">You '+fmtInitiativeCost(you, pct)+'</span> · <span class="them">Them '+fmtInitiativeCost(them, pct)+'</span>'; }

var busy = false;   // one in-flight write at a time across the module

// ---------------------------------------------------------------------------
// Proposer composer. opts = { def, initiativeId, nationId, nation, corps, onDone }.
// ---------------------------------------------------------------------------
export async function openJointProposer(opts){
  injectCss();
  var d = opts.def || {}, joint = d.joint || {}, partner = joint.partner;
  if(!partner){ return; }
  var pname = await nationName(partner);
  var rel = await relationValue(opts.nationId, partner);
  var relOk = rel >= 6;
  var secs = Array.isArray(d.sectors) ? d.sectors : [];
  var soCorps = (opts.corps || []).filter(function(c){ return c.type==='so' && secs.indexOf(c.category)>=0; });
  var st = { own:'private', corp: soCorps.length ? soCorps[0].id : null, share: null, msg:'' };

  var ov = document.createElement('div'); ov.className = 'jov';
  document.body.appendChild(ov);
  function close(){ ov.remove(); }

  function draw(){
    var eff = costVal(d), ipct = costPct(d);
    var canState = soCorps.length > 0;
    var ready = relOk && st.share != null && (st.own !== 'state' || st.corp);
    ov.innerHTML =
      '<div class="jov__card"><div class="jov__hd"><div class="jov__eyebrow">Collaborative initiative · to '+esc(pname)+'</div>'+
        '<h3>'+esc(d.name||'Joint project')+'</h3>'+(d.description?'<p>'+esc(d.description)+'</p>':'')+'</div>'+
      '<div class="jov__body">'+
        '<div class="jgate'+(relOk?' ok':'')+'"><span class="rl">Requires relations of <b>6+</b> with <b>'+esc(pname)+'</b>.</span><span class="bd">Rel '+rel+' / 10 '+(relOk?'✓':'✕')+'</span></div>'+
        '<div class="jov__lbl">Both nations gain</div>'+
        '<span class="jchip" style="color:var(--indigo);border-color:var(--indigo)">You +'+(d.quantity||0)+' '+esc(d.resource||'')+'</span>'+
        '<span class="jchip" style="color:var(--green);border-color:var(--green)">'+esc(pname)+' +'+(joint.quantity||0)+' '+esc(joint.target||'')+'</span>'+
        '<div class="jov__lbl">Execution</div>'+
        '<div class="jseg"><button data-own="private" class="'+(st.own==='private'?'on':'')+'" type="button">Private Enterprise</button>'+
          '<button data-own="state" class="'+(st.own==='state'?'on':'')+'" '+(canState?'':'disabled')+' type="button">State Sanctioned</button></div>'+
        (st.own==='state' && canState ? '<select class="jsel" id="jcorp">'+soCorps.map(function(c){ return '<option value="'+esc(c.id)+'"'+(c.id===st.corp?' selected':'')+'>'+esc(c.name)+'</option>'; }).join('')+'</select>' : '')+
        (st.own==='state' && !canState ? '<div class="jni__terms">You have no state-owned firm in an authorised sector — choose Private.</div>' : '')+
        '<div class="jov__lbl">What do you ask of '+esc(pname)+'?</div>'+
        SHARES.map(function(s){ return '<div class="jask'+(st.share===s?' on':'')+'" data-share="'+s+'"><div class="jask__h"><span class="jask__n">'+(s===0?'Consent only':'They cover '+s+'%')+'</span>'+
          '<span class="jask__sp">'+splitLine(eff, s, ipct)+'</span></div></div>'; }).join('')+
        '<div class="jov__lbl">Message to their government</div>'+
        '<textarea class="jtx" id="jmsg" placeholder="Make your case…">'+esc(st.msg)+'</textarea>'+
        '<button class="jbtn" id="jsend"'+(ready?'':' disabled')+'>'+(relOk?'Send proposal to '+esc(pname):'Relations too low to propose')+'</button>'+
        '<button class="jbtn ghost" id="jcancel">Cancel</button>'+
      '</div></div>';

    ov.querySelectorAll('[data-own]').forEach(function(b){ b.onclick=function(){ if(b.disabled)return; st.own=b.dataset.own; if(st.own==='state'&&!st.corp&&soCorps.length)st.corp=soCorps[0].id; draw(); }; });
    ov.querySelectorAll('[data-share]').forEach(function(b){ b.onclick=function(){ st.share=parseInt(b.dataset.share,10); draw(); }; });
    var cs=ov.querySelector('#jcorp'); if(cs)cs.onchange=function(){ st.corp=this.value; };
    var mt=ov.querySelector('#jmsg'); if(mt)mt.oninput=function(){ st.msg=this.value; };
    ov.querySelector('#jcancel').onclick=close;
    var sd=ov.querySelector('#jsend');
    if(sd) sd.onclick=async function(){
      if(busy||!ready)return; busy=true; sd.disabled=true; sd.textContent='Sending…';
      try{
        const { error } = await supabase.rpc('joint_propose', { p_initiative: opts.initiativeId, p_share: st.share,
          p_ownership: st.own, p_corp: st.own==='state'?st.corp:null, p_message: st.msg });
        if(error) throw error;
        close(); if(opts.onDone) opts.onDone();
      } catch(e){ sd.textContent = (e.message||'Could not send'); sd.disabled=false; busy=false; return; }
      busy=false;
    };
  }
  ov.addEventListener('click', function(e){ if(e.target===ov) close(); });
  draw();
}

// ---------------------------------------------------------------------------
// Negotiation inbox. Fetches the player's live joint negotiations (as proposer or partner) with
// their definitions, the other nation's cost basis, and the message threads.
// ---------------------------------------------------------------------------
export async function fetchJointNegotiations(nationId){
  try {
    const { data: props } = await supabase.from('joint_proposals')
      .select('id, initiative_id, proposer_nation, partner_nation, ownership, share, turn, status')
      .or('proposer_nation.eq.'+nationId+',partner_nation.eq.'+nationId).eq('status','pending').order('created_at');
    if(!props || !props.length) return { items: [] };
    var initIds = Array.from(new Set(props.map(function(p){ return p.initiative_id; })));
    var propIds = props.map(function(p){ return p.id; });
    var natIds = Array.from(new Set(props.reduce(function(a,p){ a.push(p.proposer_nation, p.partner_nation); return a; }, [])));
    const [defsR, msgsR, natsR] = await Promise.all([
      supabase.from('national_initiatives').select('id, definition').in('id', initIds),
      supabase.from('joint_messages').select('proposal_id, from_nation, body, created_at').in('proposal_id', propIds).order('created_at'),
      supabase.from('nations').select('id, name, gdp, production').in('id', natIds)
    ]);
    var defs={}; (defsR.data||[]).forEach(function(r){ defs[r.id]=r.definition; });
    var nats={}; (natsR.data||[]).forEach(function(r){ nats[r.id]=r; });
    var msgs={}; (msgsR.data||[]).forEach(function(m){ (msgs[m.proposal_id]=msgs[m.proposal_id]||[]).push(m); });
    var items = props.map(function(p){ return { p:p, def: defs[p.initiative_id]||{}, proposer: nats[p.proposer_nation]||{id:p.proposer_nation},
      partner: nats[p.partner_nation]||{id:p.partner_nation}, messages: msgs[p.id]||[] }; });
    return { items: items };
  } catch(e){ return { items: [] }; }
}

// ctx = { nationId, isEconDevMin, amPM, onChange }. A negotiation is shown only to the side that can
// act it: the partner's Head of Government (amPM) or the proposer's Economic Development minister.
export function renderJointNegotiations(el, data, ctx){
  if(!el) return; ctx = ctx || {}; injectCss();
  var visible = (data.items||[]).filter(function(it){
    if(it.p.partner_nation === ctx.nationId) return !!ctx.amPM;         // I am the partner nation → its HoG acts
    if(it.p.proposer_nation === ctx.nationId) return !!ctx.isEconDevMin; // I am the proposer nation → its Econ Dev minister acts
    return false;
  });
  if(!visible.length){ el.innerHTML=''; return; }

  el.innerHTML = visible.map(function(it){
    var p=it.p, d=it.def, joint=d.joint||{};
    var iAmPartner = p.partner_nation === ctx.nationId;
    var other = iAmPartner ? it.proposer : it.partner;
    var eff = costVal(d), ipct = costPct(d);   // the standing cost, split with the partner per share
    var them = eff * p.share / 100, prop = eff - them;
    var youGet = iAmPartner ? ('+'+(joint.quantity||0)+' '+esc(joint.target||'')) : ('+'+(d.quantity||0)+' '+esc(d.resource||''));
    var theyGet= iAmPartner ? ('+'+(d.quantity||0)+' '+esc(d.resource||'')) : ('+'+(joint.quantity||0)+' '+esc(joint.target||''));
    var myTurn = (iAmPartner && p.turn==='partner') || (!iAmPartner && p.turn==='proposer');
    var termsTxt = p.share>0
      ? '<b>'+esc(other.name||other.id)+'</b>'+(iAmPartner?' asks you to cover ':' would cover ')+'<b>'+p.share+'%</b> — you '+fmtInitiativeCost(iAmPartner?them:prop, ipct)+', them '+fmtInitiativeCost(iAmPartner?prop:them, ipct)+'.'
      : '<b>Consent only</b> — '+(iAmPartner?'you pay nothing; the proposer funds it in full.':'you fund it in full ('+fmtInitiativeCost(eff, ipct)+').');
    var thread = (it.messages||[]).map(function(m){
      if(m.from_nation==null) return '<div class="jmsg sys">'+esc(m.body)+'</div>';
      var mine = m.from_nation === ctx.nationId;
      return '<div class="jmsg '+(mine?'me':'them')+'">'+esc(m.body)+'</div>';
    }).join('') || '<div class="jmsg sys">No messages yet.</div>';
    var actions = myTurn
      ? '<div class="jact"><button class="acc" data-do="accept" data-id="'+esc(p.id)+'">Accept</button>'+
        '<button class="cou" data-do="counter" data-id="'+esc(p.id)+'">Counter ▸</button>'+
        '<button class="dec" data-do="decline" data-id="'+esc(p.id)+'">Decline</button></div>'+
        '<div class="jseg jcounter" data-id="'+esc(p.id)+'" hidden style="margin-top:8px">'+
          SHARES.map(function(s){ return '<button data-cshare="'+s+'" type="button">'+(s===0?'Consent':s+'%')+'</button>'; }).join('')+'</div>'
      : '<div class="jwait">Waiting for '+esc(other.name||other.id)+' to respond…</div>';
    return '<div class="jni" data-prop="'+esc(p.id)+'"><div class="jni__hd">Joint project · '+(iAmPartner?'from ':'to ')+esc(other.name||other.id)+'</div>'+
      '<div class="jni__nm">'+esc(d.name||'Joint project')+'</div>'+(d.description?'<div class="jni__desc">'+esc(d.description)+'</div>':'')+
      '<div class="jni__row"><span class="jchip" style="color:var(--green);border-color:var(--green)">You '+youGet+'</span>'+
        '<span class="jchip" style="color:var(--soft);border-color:var(--line)">'+esc(other.name||other.id)+' '+theyGet+'</span></div>'+
      '<div class="jni__terms">'+termsTxt+'</div>'+
      '<div class="jth">'+thread+'</div>'+
      '<div class="jcin"><input data-msg="'+esc(p.id)+'" placeholder="Reply…" autocomplete="off"><button data-send="'+esc(p.id)+'" type="button">Send</button></div>'+
      actions+'</div>';
  }).join('');

  // One in-flight write at a time; outcomes surface through the shared home toast (ctx.notify).
  async function call(fn, args, okMsg){
    if(busy) return; busy = true;
    try {
      const { error } = await supabase.rpc(fn, args); if(error) throw error;
      if(okMsg && ctx.notify) ctx.notify(okMsg);
      if(ctx.onChange) ctx.onChange();
    } catch(e){ if(ctx.notify) ctx.notify(e.message || 'That could not be completed.'); }
    busy = false;
  }
  el.querySelectorAll('[data-do]').forEach(function(b){ b.onclick=function(){
    var id=b.dataset.id, act=b.dataset.do;
    if(act==='counter'){ var box=el.querySelector('.jcounter[data-id="'+id+'"]'); if(box) box.hidden=!box.hidden; return; }
    if(act==='decline' && !confirm('Decline this joint project?')) return;
    call(act==='accept'?'joint_accept':'joint_decline', { p_proposal: id }, act==='accept'?'Joint project agreed — under way.':'Proposal declined.');
  }; });
  el.querySelectorAll('[data-cshare]').forEach(function(b){ b.onclick=function(){
    var id=b.closest('.jcounter').dataset.id; call('joint_counter', { p_proposal: id, p_share: parseInt(b.dataset.cshare,10) }, 'Counter-offer sent.');
  }; });
  el.querySelectorAll('[data-send]').forEach(function(b){ b.onclick=function(){
    var id=b.dataset.send, inp=el.querySelector('[data-msg="'+id+'"]'); var v=inp?inp.value.trim():'';
    if(!v) return; call('joint_message', { p_proposal: id, p_body: v });
  }; });
}
