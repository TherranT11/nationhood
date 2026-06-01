import{_ as w}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as L,a as b,b as _,r as E,d as B}from"./wiki-BGRbODxS.js";import{a as l}from"./utils-CzgKGX6o.js";const P=["nation","person","corporation","religion","culture","political_party","law","agreement","event","organization","military_unit","product","location","sports"];(async()=>{const d=await L();if(!d)return;const{isLoggedIn:f}=d,r=document.getElementById("wiki-root");let m=[];try{m=await b(w)}catch(a){r.innerHTML=`<div class="wiki-empty"><h2>Error</h2><p>${l(a.message)}</p></div>`;return}const k=await _(w,10);let o="all",s="",t=[];const u=new URLSearchParams(window.location.search).get("tags");u&&(t=u.split(",").map(a=>a.trim().replace(/^#/,"").toLowerCase()).filter(Boolean));let g=null;function c(){const a=m.filter(e=>{if(o!=="all"&&e.template_type!==o||s&&!e.title.toLowerCase().includes(s.toLowerCase()))return!1;if(t.length>0){const n=e.tags||[];if(!t.every(i=>n.includes(i)))return!1}return!0}),y=["all",...P].map(e=>{const n=e==="all"?"All":e.split("_").map(i=>i.charAt(0).toUpperCase()+i.slice(1)).join(" ");return`<button class="wiki-filter-btn ${e===o?"active":""}" data-filter="${e}">${n}</button>`}).join(""),v=a.length?a.map(e=>{const n=e.template_type?`<span class="wiki-page-row-type">${l(e.template_type)}</span>`:"",i=e.locked_by?'<span class="wiki-lock-badge">Locked</span>':"",x=e.updated_at?new Date(e.updated_at).toLocaleDateString():"",p=e.tags||[],T=p.length>0?`<span style="display:inline-flex;gap:3px;margin-left:auto;margin-right:8px;">${p.slice(0,5).map(h=>`<span class="wiki-tag-chip" style="font-size:8px;padding:1px 4px;${t.includes(h)?"color:var(--accent,#c8a64e);font-weight:700;":""}">#${l(h)}</span>`).join("")}${p.length>5?`<span style="font-size:8px;color:var(--text-dim);">+${p.length-5}</span>`:""}</span>`:"";return`
                    <a href="wiki.html?slug=${encodeURIComponent(e.slug)}" class="wiki-page-row">
                        <span class="wiki-page-row-title">${l(e.title)}</span>
                        ${i}
                        ${n}
                        ${T}
                        <span class="wiki-page-row-meta">${x}</span>
                    </a>
                `}).join(""):t.length>0?'<div class="wiki-empty" style="padding:30px"><p>No articles tagged with all of these tags.</p><p style="color:var(--text-muted);font-size:12px;margin-top:6px;">Try fewer tags to broaden your search.</p></div>':'<div class="wiki-empty" style="padding:30px"><p>No pages found.</p></div>',$=f?'<a href="wiki-edit.html?new=1" class="wiki-btn wiki-btn-primary">New Page</a>':"";if(r.innerHTML=`
            <div class="wiki-list-header">
                <h1>Wiki</h1>
                <div class="wiki-list-filters">
                    <input type="text" class="wiki-search-input" id="wiki-search" placeholder="Search pages..." value="${l(s)}">
                    ${y}
                    <a href="wiki.html" class="wiki-btn">Wiki Home</a>
                    ${$}
                </div>
            </div>
            <div id="tag-search-mount"></div>
            <div class="wiki-page-list" id="wiki-page-list">${v}</div>
        `,g=B({onSearch:e=>{t=e,c()},popularTags:k}),t.length>0,document.getElementById("tag-search-mount").appendChild(g.container),document.getElementById("wiki-search").addEventListener("input",e=>{s=e.target.value,c()}),r.querySelectorAll(".wiki-filter-btn").forEach(e=>{e.addEventListener("click",()=>{o=e.dataset.filter,c()})}),s){const e=document.getElementById("wiki-search");e.focus(),e.setSelectionRange(e.value.length,e.value.length)}}c(),await E(r)})();
