import{_supabase as d}from"./supabase-client-CiYoFhIh.js";import{e as i,h as l}from"./utils-oN1e812_.js";import{b as T,c as S}from"./lawsuit-types-mDq47olK.js";const C=5e6,w=5e6,_=2e8,I=5e6,P=25e6,h=50,$=600;let e=null,c=null;async function V(t,o){!t?.id||!o?.id||(e={kind:"defendant",lawsuit:t,faction:o,choice:"refute",defenseText:"",offerAmount:P,chatMessages:[],chatDraft:"",submitting:!1,error:null,currentTick:Number(t.filed_at_tick||0)},E(),n(),await Promise.all([A(),F(),O()]),M(),n())}async function O(){const{data:t,error:o}=await d.from("shard").select("current_tick").eq("name","Alpha Shard").single();if(o){console.warn("[lawsuit-respond] shard tick fetch failed:",o.message);return}e&&(e.currentTick=t?.current_tick??0)}async function X(t,o){!t?.id||!o?.id||(e={kind:"plaintiff_settle",lawsuit:t,faction:o,chatMessages:[],chatDraft:"",submitting:!1,error:null},E(),n(),await A(),M(),n())}function E(){if(c){try{d.removeChannel(c)}catch{}c=null}const t=document.getElementById("lawsuit-overlay");t&&t.remove();const o=document.createElement("div");o.id="lawsuit-overlay",o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:flex-start;justify-content:center;padding:30px 24px;overflow-y:auto;",o.onclick=a=>{a.target===o&&x()},document.body.appendChild(o)}function x(){if(c){try{d.removeChannel(c)}catch{}c=null}const t=document.getElementById("lawsuit-overlay");t&&t.remove(),e=null}async function F(){if(!e?.faction?.id)return;const{data:t,error:o}=await d.from("factions").select("corp_cash_reserves").eq("id",e.faction.id).single();if(o){console.warn("[lawsuit-respond] cash refresh failed:",o.message);return}t&&(e.faction.corp_cash_reserves=t.corp_cash_reserves)}async function A(){if(!e?.lawsuit?.chat_id)return;const{data:t,error:o}=await d.from("group_chat_messages").select("id, sender_id, is_system, message_text, created_at").eq("chat_id",e.lawsuit.chat_id).order("created_at",{ascending:!0}).limit(200);if(o){console.warn("[lawsuit-respond] chat load failed:",o.message);return}e.chatMessages=t||[]}function M(){e?.lawsuit?.chat_id&&(c=d.channel("lawsuit-chat-"+e.lawsuit.chat_id).on("postgres_changes",{event:"INSERT",schema:"public",table:"group_chat_messages",filter:`chat_id=eq.${e.lawsuit.chat_id}`},t=>{e&&(e.chatMessages.push(t.new),n())}).subscribe())}async function B(){const t=(e?.chatDraft||"").trim();if(!t||!e?.lawsuit?.chat_id||!e?.faction?.id)return;const o=t;e.chatDraft="",n();const{error:a}=await d.from("group_chat_messages").insert({chat_id:e.lawsuit.chat_id,sender_id:e.faction.id,message_text:o});a&&(console.warn("[lawsuit-respond] send failed:",a.message),e.chatDraft=o,e.error="Failed to send: "+a.message,n())}function n(){const t=document.getElementById("lawsuit-overlay");if(!t||!e)return;t.innerHTML=e.kind==="defendant"?H():q();const o=document.getElementById("lawsuit-chat-body");o&&(o.scrollTop=o.scrollHeight)}function H(){const t=e.lawsuit,o=Number(e.faction?.corp_cash_reserves??0),a=T[t.grievance_type]||t.grievance_type,r=S[t.relief_sought]||t.relief_sought,f=Math.max(0,Number(t.response_deadline_tick||0)-Number(e.currentTick??0)),R=o>=C,k=o>=e.offerAmount;let s=!e.submitting;e.choice==="refute"?s=s&&R&&(e.defenseText||"").trim().length>=h:e.choice==="settle"&&(s=s&&k&&e.offerAmount>0);const g=(v,y,m,N,z,j={})=>{const u=e.choice===v,b=!!j.disabled;return`<div onclick="${b?"":`window.lawsuitChoose('${v}')`}" style="
            padding:14px 16px;
            background:${u?"rgba(200,90,58,0.06)":"var(--bg-2,#1a1a17)"};
            border:1px solid ${u?"#c55":"var(--panel-border)"};
            ${u?"border-left:3px solid #c55;":""}
            cursor:${b?"not-allowed":"pointer"};
            opacity:${b?.4:1};
            display:grid;grid-template-columns:18px 1fr;gap:14px;align-items:flex-start;
        ">
            <div style="width:14px;height:14px;border:1px solid ${u?"#c55":"var(--panel-border)"};border-radius:50%;background:var(--bg-panel);position:relative;margin-top:3px;">
                ${u?'<div style="position:absolute;inset:3px;background:#c55;border-radius:50%;"></div>':""}
            </div>
            <div style="min-width:0;">
                <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;">
                    <span style="font-size:15px;font-weight:600;color:var(--panel-text);">${i(y)}</span>
                    <span style="font-family:var(--font-mono);font-size:10px;color:#c8a832;letter-spacing:0.1em;">${i(m)}</span>
                </div>
                <div style="font-size:12px;color:#9e9a92;margin-top:4px;line-height:1.4;">${i(N)}</div>
                ${z?`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:7px;">${z}</div>`:""}
            </div>
        </div>`},p=(v,y)=>{const m={positive:["#8aa653","rgba(138,166,83,0.06)","rgba(138,166,83,0.4)"],negative:["#c85a3a","rgba(200,90,58,0.06)","rgba(200,90,58,0.4)"],warn:["#a0633a","rgba(160,99,58,0.06)","rgba(160,99,58,0.4)"],neutral:["#9e9a92","var(--bg-panel)","var(--panel-border)"]}[y]||["#9e9a92","var(--bg-panel)","var(--panel-border)"];return`<span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 7px;border:1px solid ${m[2]};color:${m[0]};background:${m[1]};">${i(v)}</span>`};return`<div onclick="event.stopPropagation()" style="width:920px;max-width:96vw;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;max-height:92vh;">

        <!-- Urgent banner -->
        <div style="background:rgba(200,90,58,0.12);border-bottom:1px solid rgba(200,90,58,0.4);padding:10px 24px;display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--font-mono);font-size:14px;color:#c55;">⚠</span>
            <span style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c55;">Pressing Issue · Civil Lawsuit Filed</span>
            <span style="margin-left:auto;font-family:var(--font-mono);font-size:10px;color:#9e9a92;letter-spacing:0.14em;text-transform:uppercase;">Response required within <span style="color:#c55;">${f} ticks</span></span>
        </div>

        <!-- Header -->
        <div style="padding:18px 24px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.22em;color:#c55;text-transform:uppercase;margin-bottom:4px;">Lawsuit ${i((t.id||"").slice(0,8))}</div>
                <div style="font-size:22px;font-weight:600;color:var(--panel-text);letter-spacing:-0.01em;">Lawsuit Filed Against You</div>
                <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:6px;">Defendant: <span style="color:#c8a832;">${i(e.faction?.abbreviation||e.faction?.corp_ticker||"")}</span> ${i(e.faction?.faction_name||"")} · Cash: ${l(o)}</div>
            </div>
            <span onclick="window.lawsuitClose()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;padding:0 6px;">&times;</span>
        </div>

        <!-- Body: 2-column (response options + chat) -->
        <div style="flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);overflow:hidden;">

            <!-- LEFT: allegation + response options -->
            <div style="overflow-y:auto;padding:18px 22px;border-right:1px solid var(--panel-border);">

                <!-- Allegation card -->
                <div style="background:var(--bg-2,#1a1a17);border:1px solid #a0633a66;padding:14px 16px;margin-bottom:18px;">
                    <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#c55;margin-bottom:8px;">Plaintiff · Allegation</div>
                    <div style="font-size:16px;font-weight:600;color:var(--panel-text);margin-bottom:4px;">${i(t.plaintiff?.faction_name||"Plaintiff")}</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
                        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:8px 10px;">
                            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:4px;">Grievance</div>
                            <div style="font-size:13px;color:#c55;font-weight:600;">${i(a)}</div>
                        </div>
                        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:8px 10px;">
                            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:4px;">Relief Sought</div>
                            <div style="font-size:13px;color:#c55;font-weight:600;">${i(r)}</div>
                        </div>
                    </div>
                </div>

                <!-- Response options -->
                <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c8a832;margin-bottom:10px;">Your Response</div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${g("refute","File a Refutation","−"+l(C)+" legal fees","Deny the allegations. Case proceeds to trial; the Ministry of Justice rules.",p("Goes to trial","neutral")+p("MoJ rules","neutral")+p("Public record","warn"))}
                    ${e.choice==="refute"?`
                        <div style="background:var(--bg-2,#1a1a17);border:1px solid #c55;border-left-width:3px;padding:14px 16px;">
                            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c55;margin-bottom:6px;">Articulate Your Defense</div>
                            <div style="font-size:11px;color:#9e9a92;margin-bottom:10px;line-height:1.5;">State your case for the court. Stored as the defense filing for MoJ review.</div>
                            <textarea id="lawsuit-defense" oninput="window.lawsuitDefense(this.value)" maxlength="${$}" placeholder="Describe why the allegations are unfounded…" style="width:100%;background:var(--bg-panel);border:1px solid var(--panel-border);color:var(--panel-text);font-size:13px;line-height:1.5;padding:10px 12px;min-height:100px;resize:vertical;outline:none;font-family:inherit;">${i(e.defenseText)}</textarea>
                            <div style="display:flex;justify-content:space-between;margin-top:6px;">
                                <span style="font-family:var(--font-mono);font-size:10px;color:${e.defenseText.length<h?"#c55":"#9e9a92"};">${e.defenseText.length} / ${$} characters · min ${h}</span>
                            </div>
                        </div>`:""}

                    ${g("settle","Offer Settlement","Variable","Propose a cash payment to make the lawsuit go away. Plaintiff accepts or rejects.",p("No trial if accepted","positive")+p("Plaintiff may reject","warn"))}
                    ${e.choice==="settle"?`
                        <div style="background:var(--bg-2,#1a1a17);border:1px solid #8a722f;padding:14px 16px;">
                            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c8a832;margin-bottom:10px;">Settlement Offer</div>
                            <div style="display:flex;align-items:center;gap:14px;">
                                <div style="font-size:26px;font-weight:600;color:var(--panel-text);min-width:120px;">${l(e.offerAmount)}</div>
                                <input type="range" min="${w}" max="${_}" step="${I}" value="${e.offerAmount}" oninput="window.lawsuitOffer(this.value)" style="flex:1;cursor:pointer;" />
                            </div>
                            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-top:6px;letter-spacing:0.12em;text-transform:uppercase;">
                                <span>${l(w)}</span>
                                <span>${l(_)}</span>
                            </div>
                            ${k?"":'<div style="font-family:var(--font-mono);font-size:10px;color:#c55;margin-top:8px;">Offer exceeds your cash on hand.</div>'}
                        </div>`:""}

                    ${g("concede","Concede the Claim","No legal fees","Acknowledge the allegations. Case closes as upheld; sentencing is handled by the Ministry of Justice.",p("Matter closed","neutral")+p("Admission of liability","negative"))}

                    ${g("counter","Refute & Counter-Sue","Coming soon","File your own claim against the plaintiff. Combined trial.",p("Phase 3","neutral"),{disabled:!0})}
                </div>
            </div>

            <!-- RIGHT: chat panel -->
            ${D()}
        </div>

        <!-- Footer -->
        <div style="padding:12px 24px;border-top:1px solid var(--panel-border);background:var(--bg-panel);display:flex;justify-content:space-between;align-items:center;gap:18px;">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#6a6660;">
                Cash: <span style="color:var(--panel-text);">${l(o)}</span> · Reply deadline: <span style="color:#c55;">${f} ticks</span>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="window.lawsuitClose()" style="padding:9px 22px;font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#9e9a92;border:1px solid var(--panel-border);cursor:pointer;">Defer</div>
                <div onclick="${s?"window.lawsuitSubmit()":""}" style="padding:9px 22px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${s?"#fff":"#6a6660"};background:${s?"#c55":"var(--panel-border)"};border:1px solid ${s?"#c55":"var(--panel-border)"};cursor:${s?"pointer":"not-allowed"};${s?"":"opacity:0.45;pointer-events:none;"}">Submit Response ▸</div>
            </div>
        </div>
        ${e.error?`<div style="padding:8px 24px;font-family:var(--font-mono);font-size:10px;color:#c55;background:var(--bg-panel);border-top:1px solid var(--panel-border);">${i(e.error)}</div>`:""}
    </div>`}function q(){const t=e.lawsuit,o=Number(t.settle_offer_amount||0),a=T[t.grievance_type]||t.grievance_type,r=S[t.relief_sought]||t.relief_sought;return`<div onclick="event.stopPropagation()" style="width:920px;max-width:96vw;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;max-height:92vh;">
        <div style="background:rgba(201,164,73,0.12);border-bottom:1px solid rgba(201,164,73,0.4);padding:10px 24px;display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--font-mono);font-size:14px;color:#c8a832;">◆</span>
            <span style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c8a832;">Pressing Issue · Settlement Offered</span>
        </div>
        <div style="padding:18px 24px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.22em;color:#c8a832;text-transform:uppercase;margin-bottom:4px;">Lawsuit ${i((t.id||"").slice(0,8))}</div>
                <div style="font-size:22px;font-weight:600;color:var(--panel-text);letter-spacing:-0.01em;">Settlement Offer</div>
                <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:6px;">${i(t.defendant?.faction_name||"Defendant")} has offered <span style="color:#c8a832;">${l(o)}</span> to settle.</div>
            </div>
            <span onclick="window.lawsuitClose()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;padding:0 6px;">&times;</span>
        </div>
        <div style="flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);overflow:hidden;">
            <div style="overflow-y:auto;padding:18px 22px;border-right:1px solid var(--panel-border);">
                <div style="background:var(--bg-2,#1a1a17);border:1px solid var(--panel-border);padding:14px 16px;margin-bottom:14px;">
                    <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;margin-bottom:6px;">Original Claim</div>
                    <div style="font-size:14px;color:var(--panel-text);"><span style="color:#c55;font-weight:600;">${i(a)}</span> · Relief sought: <span style="color:#c8a832;">${i(r)}</span></div>
                </div>
                <div style="background:var(--bg-2,#1a1a17);border:1px solid #8a722f;padding:18px 20px;text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#c8a832;margin-bottom:8px;">Settlement Offered</div>
                    <div style="font-size:36px;font-weight:600;color:var(--panel-text);letter-spacing:-0.02em;">${l(o)}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:#9e9a92;margin-top:8px;">Accept to close the case immediately. Reject to proceed to trial.</div>
                </div>
            </div>
            ${D()}
        </div>
        <div style="padding:12px 24px;border-top:1px solid var(--panel-border);background:var(--bg-panel);display:flex;justify-content:flex-end;gap:8px;">
            <div onclick="${e.submitting?"":"window.lawsuitSettleReject()"}" style="padding:9px 22px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#c55;border:1px solid #c55;background:transparent;cursor:${e.submitting?"not-allowed":"pointer"};${e.submitting?"opacity:0.45;pointer-events:none;":""}">Reject · To Trial</div>
            <div onclick="${e.submitting?"":"window.lawsuitSettleAccept()"}" style="padding:9px 22px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#fff;background:#8aa653;border:1px solid #8aa653;cursor:${e.submitting?"not-allowed":"pointer"};${e.submitting?"opacity:0.45;pointer-events:none;":""}">Accept ${l(o)}</div>
        </div>
        ${e.error?`<div style="padding:8px 24px;font-family:var(--font-mono);font-size:10px;color:#c55;background:var(--bg-panel);border-top:1px solid var(--panel-border);">${i(e.error)}</div>`:""}
    </div>`}function D(){const t=e.faction?.id;let o="";for(const a of e.chatMessages){const r=a.sender_id===t;if(a.is_system){o+=`<div style="text-align:center;font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.1em;margin:6px 0;">${i(a.message_text)}</div>`;continue}o+=`<div style="display:flex;justify-content:${r?"flex-end":"flex-start"};margin:5px 0;">
            <div style="max-width:80%;padding:7px 11px;background:${r?"rgba(200,90,58,0.16)":"var(--bg-2,#1a1a17)"};border:1px solid ${r?"rgba(200,90,58,0.4)":"var(--panel-border)"};font-size:12px;color:var(--panel-text);line-height:1.45;word-wrap:break-word;">${i(a.message_text)}</div>
        </div>`}return e.chatMessages.length===0&&(o='<div style="text-align:center;font-family:var(--font-mono);font-size:10px;color:#6a6660;padding:20px;">No messages yet. Open the dialogue.</div>'),`<div style="display:flex;flex-direction:column;background:var(--bg-panel);min-height:0;">
        <div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);font-family:var(--font-mono);font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#9e9a92;">Discussion</div>
        <div id="lawsuit-chat-body" style="flex:1;overflow-y:auto;padding:10px 14px;">${o}</div>
        <div style="border-top:1px solid var(--panel-border);padding:8px 10px;display:flex;gap:6px;">
            <input type="text" value="${i(e.chatDraft||"")}" oninput="window.lawsuitChatDraft(this.value)" onkeydown="if(event.key==='Enter'){window.lawsuitChatSend();event.preventDefault();}" placeholder="Type a message…" style="flex:1;background:var(--bg-2,#1a1a17);border:1px solid var(--panel-border);color:var(--panel-text);font-size:12px;padding:6px 10px;outline:none;font-family:inherit;" />
            <div onclick="window.lawsuitChatSend()" style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;padding:6px 12px;color:#fff;background:#5a8aaa;border:1px solid #5a8aaa;cursor:pointer;">Send</div>
        </div>
    </div>`}async function G(){if(!e||e.submitting)return;e.submitting=!0,e.error=null,n();const t={p_lawsuit_id:e.lawsuit.id,p_response_kind:e.choice==="counter"?"refute":e.choice,p_defense_text:e.choice==="refute"?e.defenseText:null,p_settle_offer_amount:e.choice==="settle"?e.offerAmount:null};let o,a;try{({data:o,error:a}=await d.rpc("respond_to_lawsuit",t))}catch(r){e.submitting=!1,e.error="Network error: "+(r?.message||String(r)),n();return}if(a||!o?.success){e.submitting=!1,e.error=a?.message||o?.error||"Response failed",n();return}x(),window.dispatchEvent(new CustomEvent("lawsuit:responded",{detail:{lawsuit_id:t.p_lawsuit_id,status:o.new_status}}))}async function L(t){if(!e||e.submitting)return;e.submitting=!0,e.error=null,n();let o,a;try{({data:o,error:a}=await d.rpc("respond_to_settle_offer",{p_lawsuit_id:e.lawsuit.id,p_decision:t}))}catch(f){e.submitting=!1,e.error="Network error: "+(f?.message||String(f)),n();return}if(a||!o?.success){e.submitting=!1,e.error=a?.message||o?.error||"Decision failed",n();return}const r=e?.lawsuit?.id||o.lawsuit_id;x(),window.dispatchEvent(new CustomEvent("lawsuit:settled",{detail:{lawsuit_id:r,decision:t}}))}window.lawsuitClose=x;window.lawsuitChoose=t=>{e&&(e.choice=t,n())};window.lawsuitDefense=t=>{e&&(e.defenseText=String(t||"").slice(0,$),n())};window.lawsuitOffer=t=>{e&&(e.offerAmount=Math.max(w,Math.min(_,Number(t)||0)),n())};window.lawsuitChatDraft=t=>{e&&(e.chatDraft=String(t||""))};window.lawsuitChatSend=B;window.lawsuitSubmit=G;window.lawsuitSettleAccept=()=>L("accept");window.lawsuitSettleReject=()=>L("reject");export{V as openLawsuitResponseModal,X as openSettleReviewModal};
