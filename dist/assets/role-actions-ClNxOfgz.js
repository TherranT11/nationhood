function t(l){if(l==null)return"";const a=document.createElement("div");return a.textContent=String(l),a.innerHTML}function p(l,a){if(!l)return{roles:null,panel:null};const i=a.entityColor||"#c8a832",n=(a.stats||[]).map(s=>`
        <div class="pa-header-stat">
            <div class="pa-header-stat-label">${t(s.label)}</div>
            <div class="pa-header-stat-value"${s.color?` style="color:${s.color};"`:""}>${t(s.value)}</div>
        </div>
    `).join(""),d=(a.statusBarItems||[]).map(s=>s.type==="count"?`
                <div class="pa-status-item">
                    <div class="pa-status-label">${t(s.label)}</div>
                    <div class="pa-status-value">
                        <span class="pa-status-big"${s.bigColor?` style="color:${s.bigColor};"`:""}>${t(s.big)}</span>
                        ${s.dim1?`<span class="pa-status-dim">${t(s.dim1)}</span>`:""}
                        ${s.dim2?`<span class="pa-status-dim">${t(s.dim2)}</span>`:""}
                    </div>
                </div>
            `:s.type==="list"?`
                <div class="pa-status-item">
                    <div class="pa-status-label">${t(s.label)}</div>
                    <div style="display:flex;gap:4px;margin-top:3px;">
                        ${(s.items||[]).map(e=>`<span class="pa-platform-slot ${e.statusClass||""}"${e.title?` title="${t(e.title)}"`:""}>${t(e.label)}</span>`).join("")}
                    </div>
                </div>
            `:"").join("");return l.innerHTML=`
        <div class="pa-page">
            <div class="pa-header">
                <div class="pa-header-left">
                    <span class="pa-title" style="color:${i};">${t(a.title||"Actions")}</span>
                    <div class="pa-party-badge">
                        <div class="pa-party-dot" style="background:${i};"></div>
                        <span class="pa-party-name">${t(a.entityName||"")}</span>
                    </div>
                </div>
                <div class="pa-header-stats">${n}</div>
            </div>
            <div class="pa-status-bar">${d}</div>
            <div class="pa-main">
                <div class="pa-leaders" id="${a.rolesContainerId}"${a.rolesColumnWidth?` style="width:${typeof a.rolesColumnWidth=="number"?a.rolesColumnWidth+"px":a.rolesColumnWidth};"`:""}></div>
                <div class="pa-actions-panel" id="${a.panelContainerId}"></div>
            </div>
        </div>
        ${a.extraHtml||""}
    `,{roles:document.getElementById(a.rolesContainerId),panel:document.getElementById(a.panelContainerId)}}export{p as r};
